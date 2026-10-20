// 真实浏览器渲染测试：截图 + 控制台错误捕获 + 交互验证
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/25675/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
  const errors = [], warns = [];

  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      colorScheme: scheme,
      locale: 'zh-CN',
    });
    const page = await ctx.newPage();

    page.on('console', m => {
      const t = m.text();
      if (m.type() === 'error') errors.push(`[${scheme}] ${t}`);
      else if (m.type() === 'warning') warns.push(`[${scheme}] ${t}`);
    });
    page.on('pageerror', e => errors.push(`[${scheme}] PAGEERROR: ${e.message}`));

    await page.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // ---- 断言 1：无横向溢出 ----
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) errors.push(`[${scheme}] 横向溢出 ${overflow}px`);

    // ---- 断言 2：主题色生效 ----
    const theme = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        accent: cs.getPropertyValue('--accent').trim(),
        canvas: cs.getPropertyValue('--canvas').trim(),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        bodyColor: getComputedStyle(document.body).color,
      };
    });

    // ---- 断言 3：nav 图标已注入（boot() 用 outerHTML 替换占位 span，故直接查 svg）----
    const navIcons = await page.evaluate(() =>
      [...document.querySelectorAll('nav button')].map(b => (b.querySelector('svg') || {}).outerHTML ? b.querySelector('svg').innerHTML.length : 0));
    if (navIcons.some(n => n === 0)) errors.push(`[${scheme}] nav 图标未注入`);
    // 导航 4 项：今日 / 训练 / 拍照 / 我的（2026-10-20 删除库存 tab）
    if (navIcons.length !== 4) errors.push(`[${scheme}] 导航项应为 4 个，实际 ${navIcons.length}`);

    // ---- 断言 4：无 emoji 残留 ----
    const emoji = await page.evaluate(() => {
      const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) if (re.test(n.textContent)) out.push(n.textContent.trim().slice(0, 40));
      return out;
    });
    if (emoji.length) errors.push(`[${scheme}] 界面仍有 emoji: ${emoji.join(' | ')}`);

    console.log(`\n[${scheme}]`);
    console.log('  强调色', theme.accent, '| 画布', theme.canvas);
    console.log('  正文色', theme.bodyColor, '| 背景', theme.bodyBg);
    console.log('  nav 图标内容长度', navIcons);
    console.log('  横向溢出', overflow, 'px');

    await page.screenshot({ path: path.join(OUT, `01-今日-${scheme}.png`), fullPage: false });

    // ---- 交互：填写个人数据 ----
    await page.click('nav button[data-t="tab-me"]');
    await page.waitForTimeout(250);
    await page.selectOption('#pSex', 'm');
    await page.fill('#pAge', '24');
    await page.fill('#pH', '175');
    await page.fill('#pW', '70');
    await page.selectOption('#pAct', '1.55');
    await page.selectOption('#pAdj', '0');
    await page.selectOption('#pPk', '2.0');
    await page.click('button:has-text("保存并计算")');
    await page.waitForTimeout(400);
    const meText = await page.textContent('#pResult');
    await page.screenshot({ path: path.join(OUT, `02-我的-${scheme}.png`) });

    // ---- 断言：今日页「装到桌面」横幅（必须细，不能把关键卡挤出首屏）----
    await page.click('nav button[data-t="tab-today"]');
    await page.waitForTimeout(300);
    const inst = await page.evaluate(() => {
      const bar = document.querySelector('#instBox .instbar');
      if (!bar) return null;
      const r = bar.getBoundingClientRect();
      const btn = bar.querySelector('.btn-s');
      const gap = [...document.querySelectorAll('#todayBox .card')]
        .find(c => c.textContent.includes('还差多少'));
      return {
        h: Math.round(r.height),
        top: Math.round(r.top),
        btn: btn ? btn.textContent.trim() : '',
        btnH: btn ? Math.round(btn.getBoundingClientRect().height) : 0,
        hasClose: !!bar.querySelector('.instx'),
        // 关键卡仍在首屏内
        gapInFold: gap ? gap.getBoundingClientRect().top < window.innerHeight : false,
      };
    });
    if (!inst) errors.push(`[${scheme}] 今日页缺少「装到桌面」横幅`);
    else {
      if (inst.h > 46) errors.push(`[${scheme}] 安装横幅过高 ${inst.h}px（应 ≤46，避免挤压首屏）`);
      if (inst.btnH < 26) errors.push(`[${scheme}] 安装按钮过小 ${inst.btnH}px，手机上不好点`);
      if (!inst.hasClose) errors.push(`[${scheme}] 安装横幅没有关闭按钮`);
      if (!inst.gapInFold) warns.push(`[${scheme}] 实时扣减卡被挤出首屏`);
      console.log(`  [${scheme}] 安装横幅: 高${inst.h}px @${inst.top} 按钮「${inst.btn}」${inst.btnH}px 可关闭=${inst.hasClose} 扣减卡在首屏=${inst.gapInFold}`);
    }

    // ---- 交互：最近常吃 + 份量记忆 ----
    await page.click('nav button[data-t="tab-today"]');
    await page.waitForTimeout(250);
    // 先往日记里塞一条，最近常吃条才可能出现
    await page.evaluate(() => {
      const S = JSON.parse(localStorage.getItem('shishi_v2') || '{}');
      const d = new Date(); const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      S.log = S.log || {}; S.log[key] = [{ n: '米饭(熟)', g: 200, k: 232, p: 5.2, f: 0.6, c: 51.8, fb: 0.6 }];
      localStorage.setItem('shishi_v2', JSON.stringify(S));
    });
    await page.reload();
    await page.waitForTimeout(500);
    const recentsOk = await page.evaluate(() => {
      const box = document.getElementById('todayBox');
      if (!box) return { has: false, n: 0 };
      const chips = [...box.querySelectorAll('.recchip')];
      return { has: chips.length > 0, n: chips.length, firstTxt: chips[0] ? chips[0].textContent.trim() : '' };
    });
    console.log(`  [${scheme}] 最近常吃条: ${recentsOk.n} 个 ${recentsOk.firstTxt || ''}`);
    if (!recentsOk.has) errors.push(`[${scheme}] 最近常吃条未渲染（记过一笔就该出现）`);
    else {
      // 点第一个 → 抽屉打开且克数预填上次的 200
      await page.click('.recchip');
      await page.waitForTimeout(300);
      const relSheet = await page.evaluate(() => ({
        open: document.getElementById('ovl').classList.contains('on'),
        g: document.getElementById('relG') ? document.getElementById('relG').value : '',
      }));
      console.log(`  [${scheme}] 再记一笔抽屉: 打开=${relSheet.open} 克数=${relSheet.g}`);
      if (!relSheet.open) errors.push(`[${scheme}] 点最近常吃应打开记录抽屉`);
      if (String(relSheet.g) !== '200') errors.push(`[${scheme}] 份量记忆应预填上次的 200g，实际 ${relSheet.g}`);
      await page.fill('#relG', '250');
      await page.click('#sheet button:has-text("记入今日")');
      await page.waitForTimeout(350);
      const logged = await page.evaluate(() =>
        document.getElementById('todayBox').innerHTML.includes('250g'));
      if (!logged) errors.push(`[${scheme}] 改过的份量没记进今日`);
      await page.screenshot({ path: path.join(OUT, `03-最近常吃-${scheme}.png`) });
    }
    let sheetOpened = !!recentsOk.has;

    // ---- 交互：今日页首屏（缺口卡必须可见）----
    await page.evaluate(() => { closeSheet(); window.scrollTo(0, 0); });
    await page.waitForTimeout(200);
    const curFirst = await page.evaluate(() => {
      const box = document.getElementById('todayBox');
      const cards = [...box.querySelectorAll('.card')].map(c => {
        const r = c.getBoundingClientRect();
        return { txt: c.querySelector('h3')?.textContent.trim().slice(0, 10) || c.textContent.trim().slice(0, 8),
                 top: Math.round(r.top), bottom: Math.round(r.bottom), hero: !!c.querySelector('.kcalhero'),
                 recents: !!c.querySelector('.recchip') };
      });
      return { cards, navTop: Math.round(document.querySelector('nav').getBoundingClientRect().top) };
    });
    const curAbove = curFirst.cards.filter(c => c.bottom <= curFirst.navTop);
    console.log(`  [${scheme}] 今日页首屏卡片: ${curAbove.map(c => c.txt + `@${c.top}`).join(' | ') || '（无）'}`);
    const heroCard = curFirst.cards.find(c => c.hero);
    if (!heroCard || heroCard.bottom > curFirst.navTop) errors.push(`[${scheme}] 今日热量卡不在首屏`);
    if (!curAbove.some(c => c.txt.includes('还差'))) warns.push(`[${scheme}] 缺口分析卡不在首屏（建议压缩上方内容）`);
    const recCard = curFirst.cards.find(c => c.recents);
    if (recentsOk.has && recCard && recCard.top < -80) warns.push(`[${scheme}] 最近常吃位置偏上（top=${recCard.top}），考虑上移`);

    // ---- 交互：拍照页 ----
    await page.evaluate(() => closeSheet());
    await page.click('nav button[data-t="tab-scan"]');
    await page.waitForTimeout(300);
    await page.click('#apiBox summary');
    await page.waitForTimeout(250);
    const presetOpts = await page.evaluate(() =>
      [...document.querySelectorAll('#apiPreset option')].map(o => o.textContent));
    // ---- 断言：接口设置必须能自助排查（测试连接 + 无 Key 模式说明）----
    const apiUi = await page.evaluate(() => {
      const key = document.getElementById('apiKey');
      const testBtn = document.getElementById('apiTestBtn');
      const proxyOpt = [...document.querySelectorAll('#apiPreset option')]
        .find(o => (o.textContent || '').includes('代理'));
      const box = document.getElementById('apiBox');
      return {
        hasTestBtn: !!testBtn,
        testBtnText: testBtn ? testBtn.textContent.trim() : '',
        keyPlaceholder: key ? key.getAttribute('placeholder') : '',
        hasProxyOpt: !!proxyOpt,
        mentionsProxy: box.textContent.includes('proxy/'),
        hasTestOut: !!document.getElementById('apiTest'),
      };
    });
    if (!apiUi.hasTestBtn) errors.push(`[${scheme}] 接口设置缺少「测试连接」按钮`);
    if (!apiUi.hasTestOut) errors.push(`[${scheme}] 缺少测试结果容器 #apiTest`);
    if (!apiUi.keyPlaceholder.includes('留空'))
      errors.push(`[${scheme}] Key 输入框未说明可以留空（无 Key 模式）`);
    if (!apiUi.hasProxyOpt) errors.push(`[${scheme}] 服务商预设缺少「自建代理」选项`);
    if (!apiUi.mentionsProxy) errors.push(`[${scheme}] 未说明自建代理方案（proxy/ 目录）`);
    console.log(`  [${scheme}] 接口设置: 测试按钮「${apiUi.testBtnText}」· 代理预设=${apiUi.hasProxyOpt} · 预设 ${presetOpts.length} 项`);
    await page.screenshot({ path: path.join(OUT, `05-拍照-${scheme}.png`) });

    // ---- 断言：选图两条入口（拍照 / 从相册选）----
    const pick = await page.evaluate(() => {
      const cam = document.getElementById('photoCam');
      const lib = document.getElementById('photoLib');
      const btns = [...document.querySelectorAll('#tab-scan .btnrow button')]
        .map(b => b.textContent.trim());
      return {
        cam: !!cam, lib: !!lib,
        camCapture: cam ? cam.getAttribute('capture') : null,
        libCapture: lib ? lib.getAttribute('capture') : 'MISSING',
        libAccept: lib ? lib.getAttribute('accept') : '',
        libMultiple: lib ? lib.hasAttribute('multiple') : false,
        btns,
        hasFns: ['clearPhoto', 'rmPhoto', 'renderPrev'].every(n => typeof window[n] === 'function'),
      };
    });
    if (!pick.cam || !pick.lib) errors.push(`[${scheme}] 选图入口缺失（拍照=${pick.cam} 相册=${pick.lib}）`);
    if (pick.camCapture !== 'environment') errors.push(`[${scheme}] 拍照入口缺少 capture="environment"`);
    // 这条是本次修复的核心：相册入口绝不能带 capture，否则只能重拍
    if (pick.libCapture !== null) errors.push(`[${scheme}] 相册入口带了 capture="${pick.libCapture}"，会导致无法选已拍好的照片`);
    if (!pick.libAccept.includes('image')) errors.push(`[${scheme}] 相册入口 accept 不含 image`);
    // 这条是第二个修复：必须能一次选多张
    if (!pick.libMultiple) errors.push(`[${scheme}] 相册入口缺少 multiple，无法一次选多张`);
    if (!pick.btns.includes('拍照') || !pick.btns.includes('从相册选'))
      errors.push(`[${scheme}] 按钮文案不对: ${JSON.stringify(pick.btns)}`);
    if (!pick.hasFns) errors.push(`[${scheme}] 缺少多图相关函数（clearPhoto / rmPhoto / renderPrev）`);

    // 真实走一遍「从相册选」：一次塞 3 张，验证多选 + 单张删除
    const icons = ['icon-192.png', 'icon-512.png', 'icon-192.png'];
    await page.setInputFiles('#photoLib', icons.map(f => path.join(__dirname, '..', f)));
    await page.waitForTimeout(700);
    const afterPick = await page.evaluate(() => {
      const thumbs = [...document.querySelectorAll('#prevBox .thumb')];
      return {
        count: thumbs.length,
        allDataUrl: thumbs.every(t => (t.querySelector('img') || {}).getAttribute
          && t.querySelector('img').getAttribute('src').startsWith('data:image/')),
        hasIdx: document.querySelectorAll('#prevBox .thumbi').length,
        scanText: (document.getElementById('doScan') || {}).textContent || '',
        hasClear: [...document.querySelectorAll('#prevBox button')].some(b => b.textContent.includes('清空')),
        hasAdd: [...document.querySelectorAll('#prevBox button')].some(b => b.textContent.includes('再加一张')),
        xButtons: document.querySelectorAll('#prevBox .thumbx').length,
      };
    });
    if (afterPick.count !== 3) errors.push(`[${scheme}] 一次选 3 张后缩略图数为 ${afterPick.count}（期望 3）`);
    if (!afterPick.allDataUrl) errors.push(`[${scheme}] 缩略图未转成 dataURL`);
    if (afterPick.hasIdx !== 3) errors.push(`[${scheme}] 多图未显示序号`);
    if (!afterPick.scanText.includes('3')) errors.push(`[${scheme}] 识别按钮未显示张数: ${afterPick.scanText}`);
    if (afterPick.xButtons !== 3) errors.push(`[${scheme}] 每张图缺少单独删除按钮`);
    if (!afterPick.hasClear || !afterPick.hasAdd) errors.push(`[${scheme}] 缺少「清空」或「再加一张」`);

    // 删掉第 2 张 → 应剩 2 张，且序号重排
    await page.evaluate(() => rmPhoto(1));
    await page.waitForTimeout(250);
    const afterRm = await page.evaluate(() => ({
      count: document.querySelectorAll('#prevBox .thumb').length,
      idx: [...document.querySelectorAll('#prevBox .thumbi')].map(s => s.textContent),
    }));
    if (afterRm.count !== 2) errors.push(`[${scheme}] 删掉一张后剩 ${afterRm.count} 张（期望 2）`);
    if (afterRm.idx.join(',') !== '1,2') errors.push(`[${scheme}] 删除后序号未重排: ${afterRm.idx}`);

    // 再选 1 张 → 应追加到 3 张
    await page.setInputFiles('#photoLib', path.join(__dirname, '..', 'icon-512.png'));
    await page.waitForTimeout(500);
    const afterAdd = await page.evaluate(() => document.querySelectorAll('#prevBox .thumb').length);
    if (afterAdd !== 3) errors.push(`[${scheme}] 追加选图后应为 3 张，实际 ${afterAdd}`);

    // 超上限保护：一次塞 8 张，总量不得超 6
    await page.setInputFiles('#photoLib', Array(8).fill(path.join(__dirname, '..', 'icon-192.png')));
    await page.waitForTimeout(700);
    const capped = await page.evaluate(() => document.querySelectorAll('#prevBox .thumb').length);
    if (capped > 6) errors.push(`[${scheme}] 超过 6 张上限，实际 ${capped}`);
    console.log(`  [${scheme}] 选图入口: 拍照(capture=${pick.camCapture}) + 相册(multiple=${pick.libMultiple}, capture=${pick.libCapture}) → 3张✓ 删除✓ 追加✓ 上限=${capped}`);

    // 「清空」要能清干净
    await page.evaluate(() => clearPhoto());
    await page.waitForTimeout(200);
    const afterClear = await page.evaluate(() => ({
      thumbs: document.querySelectorAll('#prevBox .thumb').length,
      res: document.getElementById('scanResult').style.display,
    }));
    if (afterClear.thumbs) errors.push(`[${scheme}] clearPhoto() 后仍有 ${afterClear.thumbs} 张缩略图`);
    await page.screenshot({ path: path.join(OUT, `05b-拍照-多图-${scheme}.png`) });

    // ---- 交互：外食记录（不入库存）----
    await page.evaluate(() => { document.getElementById('apiBox').open = false; });
    await page.click('button:has-text("记一顿外食")');
    await page.waitForTimeout(300);
    const outSheet = await page.evaluate(() => document.getElementById('ovl').classList.contains('on'));
    if (!outSheet) errors.push(`[${scheme}] 外食抽屉未打开`);
    await page.fill('#oeN', '牛肉面');
    await page.fill('#oeG', '450');
    await page.fill('#oeK', '620');
    await page.fill('#oeP', '28');
    await page.fill('#oeC', '78');
    await page.fill('#oeF', '18');
    await page.fill('#oeFb', '4');
    await page.screenshot({ path: path.join(OUT, `06-外食抽屉-${scheme}.png`) });
    await page.click('#sheet button:has-text("记入今日")');
    await page.waitForTimeout(400);
    const outLogged = await page.evaluate(() => {
      const box = document.getElementById('todayBox');
      return box.innerHTML.includes('牛肉面') && box.innerHTML.includes('外食');
    });
    if (!outLogged) errors.push(`[${scheme}] 外食未写入今日饮食（或未打「外食」标记）`);
    const invAfterOut = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('shishi_v2')).inv === undefined ? 0 : -1 } catch (e) { return -1 }
    });

    // ---- 交互：训练页 ----
    await page.click('nav button[data-t="tab-train"]');
    await page.waitForTimeout(350);
    const trainScreen = await page.evaluate(() => {
      const box = document.getElementById('trainBox');
      const cards = [...box.querySelectorAll('.card')].map(c => ({
        txt: c.querySelector('h3')?.textContent.trim().slice(0, 12) || c.textContent.trim().slice(0, 8),
        top: Math.round(c.getBoundingClientRect().top),
        bottom: Math.round(c.getBoundingClientRect().bottom),
      }));
      const hero = box.querySelector('.trainhero');
      return { cards, navTop: Math.round(document.querySelector('nav').getBoundingClientRect().top),
               heroTop: hero ? Math.round(hero.getBoundingClientRect().top) : -1,
               heroText: hero ? hero.textContent : '' };
    });
    const trainAbove = trainScreen.cards.filter(c => c.bottom <= trainScreen.navTop);
    console.log(`\n  [${scheme}] 训练页首屏: hero@${trainScreen.heroTop} | ${trainAbove.map(c => c.txt + `@${c.top}`).join(' | ') || '（无卡片）'}`);
    if (trainScreen.heroTop < 0 || trainScreen.heroTop > trainScreen.navTop)
      errors.push(`[${scheme}] 训练页 hero 不在首屏 (top=${trainScreen.heroTop})`);
    if (!trainScreen.heroText.includes('训练日') && !trainScreen.heroText.includes('休息日'))
      errors.push(`[${scheme}] 训练页 hero 未显示训练日/休息日状态`);
    const calExist = await page.evaluate(() =>
      !!document.querySelector('#trainCal .calgrid') &&
      document.querySelectorAll('#trainCal .calcell:not(.empty)').length >= 28);
    if (!calExist) errors.push(`[${scheme}] 训练日历未渲染或格子不足`);
    await page.screenshot({ path: path.join(OUT, `07-训练-${scheme}.png`) });

    // ---- 交互：记录一次 5km 跑步（核心诉求）----
    await page.click('#trainBox button:has-text("记录训练")');
    await page.waitForTimeout(350);
    const exSheetOpen = await page.evaluate(() => document.getElementById('ovl').classList.contains('on'));
    if (!exSheetOpen) errors.push(`[${scheme}] 训练记录抽屉未打开`);
    const selectedEx = await page.evaluate(() => document.getElementById('exN').value);
    await page.fill('#exKm', '5');
    await page.fill('#exMin', '30');
    await page.waitForTimeout(300);
    const burnPreview = await page.evaluate(() => {
      const p = document.getElementById('exPrev');
      return p ? p.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    console.log(`  [${scheme}] 选中「${selectedEx}」→ 5km/30min 预估: ${burnPreview}`);
    if (!burnPreview.includes('363')) errors.push(`[${scheme}] 5km 跑步预估应为 363 kcal，实际「${burnPreview}」`);
    await page.screenshot({ path: path.join(OUT, `08-训练记录抽屉-${scheme}.png`) });
    await page.click('#sheet button:has-text("记录")');
    await page.waitForTimeout(400);

    // 记录后：今日页应体现训练日 + 目标上调
    await page.click('nav button[data-t="tab-today"]');
    await page.waitForTimeout(400);
    const afterTrain = await page.evaluate(() => {
      const box = document.getElementById('todayBox');
      return { html: box.innerHTML, hasTrainTag: box.innerHTML.includes('训练日') };
    });
    if (!afterTrain.hasTrainTag) errors.push(`[${scheme}] 记录训练后今日页未显示训练日标签`);
    if (!afterTrain.html.includes('5 km')) errors.push(`[${scheme}] 今日页训练条目未显示公里数`);
    await page.screenshot({ path: path.join(OUT, `09-今日-训练后-${scheme}.png`) });

    // ---- 断言：实时扣减卡存在且含纤维 ----
    const gapCard = await page.evaluate(() => {
      const box = document.getElementById('todayBox');
      const cards = [...box.querySelectorAll('.card')];
      const c = cards.find(x => x.textContent.includes('还差多少'));
      return c ? c.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
    });
    if (!gapCard.includes('膳食纤维')) errors.push(`[${scheme}] 实时扣减卡缺膳食纤维维度`);
    console.log(`  [${scheme}] 扣减卡: ${gapCard.slice(0, 90)}…`);

    // ---- 断言：热量主指标用条形 + 数字，且不用环形图 ----
    // 依据：NN/g 指出长度是最准确的视觉编码、角度/面积最差；
    //       Apple HIG 把 Activity 圆环保留给健康三环，不宜挪用。
    const hero = await page.evaluate(() => {
      const h = document.querySelector('#todayBox .kcalhero');
      const bar = h ? h.querySelector('.kh-bar') : null;
      const fill = bar ? bar.querySelector('i') : null;
      const lum = c => {
        const [r, g, b] = c.match(/\d+/g).map(Number).map(v => {
          v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a, b) => {
        const x = lum(a), y = lum(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const cardBg = getComputedStyle(h.parentElement).backgroundColor;
      return {
        hasHero: !!h,
        ringCount: document.querySelectorAll('#todayBox .ring').length,
        hasBar: !!bar,
        fillW: fill ? fill.getBoundingClientRect().width : 0,
        barW: bar ? bar.getBoundingClientRect().width : 0,
        barH: bar ? Math.round(bar.getBoundingClientRect().height) : 0,
        num: h ? (h.querySelector('.kh-num') || {}).textContent : '',
        state: h ? (h.querySelector('.kh-foot b') || {}).textContent : '',
        ariaRole: bar ? bar.getAttribute('role') : null,
        ariaNow: bar ? bar.getAttribute('aria-valuenow') : null,
        // 非文本元素对比度：进度条填充 vs 卡片底色，WCAG 要求 ≥3:1
        barContrast: fill && cardBg ? +ratio(getComputedStyle(fill).backgroundColor, cardBg).toFixed(2) : 0,
        trackContrast: bar && cardBg ? +ratio(getComputedStyle(bar).backgroundColor, cardBg).toFixed(2) : 0,
      };
    });
    if (!hero.hasHero) errors.push(`[${scheme}] 热量主指标未使用条形方案（.kcalhero 缺失）`);
    if (hero.ringCount > 0) errors.push(`[${scheme}] 仍存在环形图（.ring ×${hero.ringCount}）`);
    if (!hero.hasBar) errors.push(`[${scheme}] 热量进度条缺失`);
    if (hero.barH < 8) errors.push(`[${scheme}] 进度条过细 ${hero.barH}px（应 ≥8，便于辨认）`);
    if (!/\d/.test(hero.num)) errors.push(`[${scheme}] 条形方案必须同时给出数字`);
    if (!hero.state) errors.push(`[${scheme}] 缺少文字状态（不能只靠颜色）`);
    if (hero.ariaRole !== 'progressbar' || hero.ariaNow === null)
      errors.push(`[${scheme}] 进度条缺少无障碍属性（role/aria-valuenow）`);
    // 非文本对比度（WCAG 1.4.11）：
    //   进度条「填充」承载数据，必须 ≥3:1 —— 这是硬要求
    //   「轨道」只表示量程，且数值始终以文字给出（无障碍替代），
    //   所以按「清晰可辨」要求 ≥1.5:1，而不是 3:1（否则轨道会过重、喧宾夺主）
    if (hero.barContrast && hero.barContrast < 3)
      errors.push(`[${scheme}] 进度条填充对比度 ${hero.barContrast}:1 低于 3:1（非文本元素要求）`);
    if (hero.trackContrast && hero.trackContrast < 1.5)
      errors.push(`[${scheme}] 进度条轨道对比度 ${hero.trackContrast}:1 过低，看不出量程（应 ≥1.5:1）`);
    console.log(`  [${scheme}] 热量条形: 高${hero.barH}px 数字「${hero.num.trim()}」状态「${hero.state}」环形图=${hero.ringCount} 填充对比度 ${hero.barContrast}:1 轨道 ${hero.trackContrast}:1`);

    // ---- 断言：今日限量卡（钠 / 饱和脂肪 / 糖，GB 28050 强制标示项）----
    const lim = await page.evaluate(() => {
      const card = [...document.querySelectorAll('#todayBox .card')]
        .find(c => c.textContent.includes('今日限量'));
      if (!card) return null;
      const rows = [...card.querySelectorAll('.limrow')];
      return {
        labels: rows.map(r => (r.querySelector('.gl') || {}).textContent.trim()),
        allHaveBar: rows.every(r => !!r.querySelector('.lbar > i')),
        allHaveFoot: rows.every(r => (r.querySelector('.lf') || {}).textContent.trim().length > 0),
        hasBasis: card.textContent.includes('GB 28050'),
        text: card.textContent.replace(/\s+/g, ' ').trim().slice(0, 150),
      };
    });
    if (!lim) errors.push(`[${scheme}] 今日页缺少「今日限量」卡`);
    else {
      const want = ['钠', '饱和脂肪', '糖'];
      const missing = want.filter(w => !lim.labels.some(l => l.includes(w)));
      if (missing.length) errors.push(`[${scheme}] 限量卡缺字段: ${missing.join(',')}（实际 ${lim.labels.join('/')}）`);
      if (!lim.allHaveBar) errors.push(`[${scheme}] 限量行缺少进度条`);
      if (!lim.allHaveFoot) errors.push(`[${scheme}] 限量行缺少「还剩/已超出」文字（不能只靠颜色）`);
      if (!lim.hasBasis) errors.push(`[${scheme}] 限量卡未说明依据（GB 28050）`);
      console.log(`  [${scheme}] 限量卡: ${lim.labels.join(' | ')}`);
    }

    // ---- 断言：我的页 自适应消耗卡 ----
    await page.click('nav button[data-t="tab-me"]');
    await page.waitForTimeout(350);
    const adapt = await page.evaluate(() => {
      const box = document.getElementById('adaptBox');
      if (!box) return null;
      const t = box.textContent.replace(/\s+/g, ' ').trim();
      return {
        text: t.slice(0, 160),
        // 数据不足时应给进度条，数据充足时应给结果 + 切换
        hasProgress: !!box.querySelector('.lbar > i'),
        hasSeg: !!box.querySelector('.seg button'),
        hasResult: /kcal/.test(t),
        segCount: box.querySelectorAll('.seg button').length,
      };
    });
    if (!adapt) errors.push(`[${scheme}] 我的页缺少「自适应消耗」卡`);
    else {
      const shaped = (adapt.hasProgress && !adapt.hasSeg) || (adapt.hasSeg && adapt.hasResult);
      if (!shaped) errors.push(`[${scheme}] 自适应卡形态异常（进度=${adapt.hasProgress} 切换=${adapt.hasSeg} 结果=${adapt.hasResult}）`);
      if (adapt.hasSeg && adapt.segCount !== 2) errors.push(`[${scheme}] 自适应切换按钮应为 2 个，实际 ${adapt.segCount}`);
      console.log(`  [${scheme}] 自适应卡: ${adapt.hasSeg ? '有结果+切换' : '数据不足(显示进度)'} — ${adapt.text.slice(0, 70)}…`);
    }

    // ---- 断言：排日程抽屉（含日历）----
    await page.evaluate(() => { if (document.getElementById('ovl').classList.contains('on')) closeSheet(); });
    await page.click('nav button[data-t="tab-train"]');
    await page.waitForTimeout(300);
    await page.click('#trainBox button:has-text("排日程")');
    await page.waitForTimeout(400);
    const planCal = await page.evaluate(() =>
      !!document.querySelector('#calWrap .calgrid') && !!document.getElementById('plSeg'));
    if (!planCal) errors.push(`[${scheme}] 日程抽屉内日历或训练/休息切换未渲染`);
    await page.screenshot({ path: path.join(OUT, `10-日程抽屉-${scheme}.png`) });
    // 切到休息日 → 训练表单应隐藏
    await page.click('#plSeg button:has-text("休息")');
    await page.waitForTimeout(250);
    const trainBoxHidden = await page.evaluate(() => {
      const b = document.getElementById('plTrainBox');
      return !b || getComputedStyle(b).display === 'none';
    });
    if (!trainBoxHidden) errors.push(`[${scheme}] 选「休息」后训练表单未隐藏`);
    await page.click('#sheet button:has-text("取消")');
    await page.waitForTimeout(250);

    // ---- 断言：我的页 训练日/休息日对照表 ----
    await page.click('nav button[data-t="tab-me"]');
    await page.waitForTimeout(350);
    const dual = await page.evaluate(() => {
      const el = document.querySelector('.dual');
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    if (!dual.includes('休息日') || !dual.includes('训练日'))
      errors.push(`[${scheme}] 训练日/休息日对照表未渲染`);
    const hasRestField = await page.evaluate(() => !!document.getElementById('pRest'));
    if (!hasRestField) errors.push(`[${scheme}] 休息日热量调整输入框不存在`);
    console.log(`  [${scheme}] 目标对照: ${dual.slice(0, 80)}…`);

    // ---- 断言：我的页 使用指南入口 ----
    const guideLink = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a')]
        .find(x => (x.getAttribute('href') || '').includes('/guide/'));
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return {
        href: a.getAttribute('href'),
        text: a.textContent.trim(),
        h: Math.round(r.height),
        w: Math.round(r.width),
        hasTarget: a.getAttribute('target') === '_blank',
      };
    });
    if (!guideLink) errors.push(`[${scheme}] 我的页缺少「使用指南」入口`);
    else {
      // 手机上可点：高度要够大（48px 是触控舒适下限附近），且新窗口打开
      if (guideLink.h < 40) errors.push(`[${scheme}] 指南按钮过高不足: ${guideLink.h}px`);
      if (!guideLink.hasTarget) errors.push(`[${scheme}] 指南链接未用新窗口打开（会顶掉当前状态）`);
      console.log(`  [${scheme}] 指南入口: 「${guideLink.text}」${guideLink.w}×${guideLink.h}px → ${guideLink.href}`);
    }

    await page.screenshot({ path: path.join(OUT, `11-我的-训练目标-${scheme}.png`) });

    console.log('  外食后库存字段存在性', invAfterOut);

    // ---- 断言 5：深色模式对比度 ----
    if (scheme === 'dark') {
      const lum = await page.evaluate(() => {
        const p = c => { const [r, g, b] = c.match(/\d+/g).map(Number); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        return { bg: p(getComputedStyle(document.body).backgroundColor), fg: p(getComputedStyle(document.body).color) };
      });
      const ratio = (Math.max(lum.bg, lum.fg) + 5) / (Math.min(lum.bg, lum.fg) + 5);
      console.log('  深色对比度 ≈', ratio.toFixed(1) + ':1');
      if (ratio < 7) warns.push(`[${scheme}] 正文对比度 ${ratio.toFixed(1)}:1 偏低`);
    } else {
      const lum = await page.evaluate(() => {
        const p = c => { const [r, g, b] = c.match(/\d+/g).map(Number); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        return { bg: p(getComputedStyle(document.body).backgroundColor), fg: p(getComputedStyle(document.body).color) };
      });
      const ratio = (Math.max(lum.bg, lum.fg) + 5) / (Math.min(lum.bg, lum.fg) + 5);
      console.log('  浅色对比度 ≈', ratio.toFixed(1) + ':1');
    }

    console.log('  最近常吃抽屉打开', sheetOpened);
    console.log('  预设服务商', presetOpts.join(' / '));
    console.log('  计算结果:', (meText || '').replace(/\s+/g, ' ').trim().slice(0, 120));
    console.log('  截图已存');

    await ctx.close();
  }

  await browser.close();

  console.log('\n================ 汇总 ================');
  if (errors.length) {
    console.log('错误 ' + errors.length + ' 条:');
    errors.forEach(e => console.log('  ✗ ' + e));
  } else {
    console.log('✓ 无控制台错误 / 无页面异常');
  }
  if (warns.length) {
    console.log('提示 ' + warns.length + ' 条:');
    warns.forEach(w => console.log('  ! ' + w));
  }
  process.exit(errors.length ? 1 : 0);
})();
