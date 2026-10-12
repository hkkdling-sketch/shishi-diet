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

    // ---- 断言 3：nav 图标已注入（boot() 副作用）----
    const navIcons = await page.evaluate(() =>
      [...document.querySelectorAll('nav button .ic-nav')].map(s => s.innerHTML.length));
    if (navIcons.some(n => n === 0)) errors.push(`[${scheme}] nav 图标未注入`);

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

    // ---- 交互：库存 ----
    await page.click('nav button[data-t="tab-stock"]');
    await page.waitForTimeout(250);
    // 首屏应当已经能直接看到概览 / 提醒 / 缺口（不用滚动）
    const firstScreen = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#stockBox > .card')].map(c => {
        const r = c.getBoundingClientRect();
        return { txt: c.querySelector('h3')?.textContent.trim().slice(0, 10) || c.textContent.trim().slice(0, 8),
                 top: Math.round(r.top), bottom: Math.round(r.bottom) };
      });
      return { cards, navTop: Math.round(document.querySelector('nav').getBoundingClientRect().top) };
    });
    const aboveFold = firstScreen.cards.filter(c => c.bottom <= firstScreen.navTop);
    console.log(`\n  [${scheme}] 首屏可见卡片: ${aboveFold.map(c => c.txt + `@${c.top}`).join(' | ') || '（无）'}`);
    if (!aboveFold.some(c => c.txt.includes('库存总计'))) errors.push(`[${scheme}] 概览卡不在首屏`);
    if (!aboveFold.some(c => c.txt.includes('今日还差'))) warns.push(`[${scheme}] 缺口分析卡不在首屏（建议压缩上方内容）`);

    // 手动添加区默认折叠 —— 展开后再操作
    const addHidden = await page.evaluate(() => !document.getElementById('q').offsetParent);
    if (!addHidden) errors.push(`[${scheme}] 手动添加表单应当默认折叠`);
    await page.click('#addBox > summary');
    await page.waitForTimeout(200);
    await page.fill('#q', '鸡胸');
    await page.waitForTimeout(300);
    const sug = await page.evaluate(() => document.getElementById('sug').innerHTML.length);
    await page.fill('#addG', '500');
    // 点第一个建议项
    const firstSug = await page.$('#sug > *');
    if (firstSug) await firstSug.click();
    await page.waitForTimeout(250);
    await page.click('button:has-text("加入库存")');
    await page.waitForTimeout(400);
    const stockHtml = await page.evaluate(() => document.getElementById('stockBox').innerHTML.length);
    await page.screenshot({ path: path.join(OUT, `03-库存-${scheme}.png`) });

    // ---- 交互：吃掉（打开抽屉，检查是否自建 sheet 而非原生弹窗）----
    let sheetOpened = false;
    const eatBtn = await page.$('#stockBox button');
    if (eatBtn) {
      await eatBtn.click();
      await page.waitForTimeout(350);
      sheetOpened = await page.evaluate(() =>
        document.getElementById('ovl').classList.contains('on'));
      await page.screenshot({ path: path.join(OUT, `04-吃掉抽屉-${scheme}.png`) });
      const quickBtns = await page.evaluate(() => document.querySelectorAll('#sheet button').length);
      if (sheetOpened && quickBtns < 3) warns.push(`[${scheme}] 抽屉按钮偏少 (${quickBtns})`);
    }

    // ---- 交互：拍照页 ----
    await page.evaluate(() => closeSheet());
    await page.click('nav button[data-t="tab-scan"]');
    await page.waitForTimeout(300);
    await page.click('#apiBox summary');
    await page.waitForTimeout(250);
    const presetOpts = await page.evaluate(() =>
      [...document.querySelectorAll('#apiPreset option')].map(o => o.textContent));
    await page.screenshot({ path: path.join(OUT, `05-拍照-${scheme}.png`) });

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

    console.log('  保存建议数', sug, '| 库存HTML长度', stockHtml, '| 抽屉打开', sheetOpened);
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
