const { chromium } = require('playwright');
const path = require('path');
const EXE = 'C:/Users/25675/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = path.join(__dirname, 'shots');

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const errs = [];

  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, locale: 'zh-CN' });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`[${scheme}] ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') errs.push(`[${scheme}] ${m.text()}`) });

    await p.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);

    // 灌入仿真数据：7 天饮食记录 + 8 样库存（含告急项）
    await p.evaluate(() => {
      const d = i => { const t = new Date(); t.setDate(t.getDate() - i);
        return t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0'); };
      const P = n => ({ id: 'i'+n, n, g: 0 });
      const inv = [
        { id:'i1', n:'鸡胸肉(生)', k:133,p:19.4,f:5.0,c:2.5, cat:'protein', g: 620 },
        { id:'i2', n:'鸡蛋(全蛋)', k:144,p:13.3,f:8.8,c:2.8, cat:'protein', g: 25 },
        { id:'i3', n:'希腊酸奶', k:59, p:10.0,f:0.4,c:3.6, cat:'protein', g: 400 },
        { id:'i4', n:'糙米饭', k:112,p:2.6, f:0.9,c:23.0,cat:'staple',  g: 750 },
        { id:'i5', n:'燕麦片', k:377,p:15.0,f:6.7,c:61.0,cat:'staple',  g: 80 },
        { id:'i6', n:'西兰花', k:36, p:4.1, f:0.6,c:4.3, cat:'veg',     g: 300 },
        { id:'i7', n:'牛油果', k:171,p:2.0, f:15.3,c:7.4,cat:'fruit',   g: 180 },
        { id:'i8', n:'巴旦木', k:578,p:21.0,f:50.0,c:20.0,cat:'fat',    g: 60 },
      ];
      const log = {};
      const plan = [
        [100,'i1',133,19.4,5.0,2.5], [50,'i4',112,2.6,0.9,23.0], [150,'i6',36,4.1,0.6,4.3],
        [120,'i1',133,19.4,5.0,2.5], [100,'i4',112,2.6,0.9,23.0], [200,'i3',59,10.0,0.4,3.6],
        [180,'i1',133,19.4,5.0,2.5], [60,'i5',377,15.0,6.7,61.0], [250,'i6',36,4.1,0.6,4.3],
        [160,'i1',133,19.4,5.0,2.5], [100,'i4',112,2.6,0.9,23.0], [150,'i3',59,10.0,0.4,3.6],
        [140,'i1',133,19.4,5.0,2.5], [100,'i4',112,2.6,0.9,23.0], [80,'i7',171,2.0,15.3,7.4],
      ];
      plan.forEach((x, k) => {
        const day = d(Math.floor(k / 3) + 1);
        const [g, iid, ik, ip, if_, ic] = x;
        const it = inv.find(v => v.id === iid);
        const r = g / 100;
        (log[day] = log[day] || []).push({
          n: it.n, g, k: it.k * r, p: it.p * r, f: it.f * r, c: it.c * r, iid,
          b: { k: it.k, p: it.p, f: it.f, c: it.c, cat: it.cat },
        });
      });
      localStorage.setItem('shishi_v2', JSON.stringify({
        profile: { sex:'m', age:24, h:175, w:70, act:1.55, adj:0, pk:2.0 },
        inv, log, ex: {}, api: { base:'https://open.bigmodel.cn/api/paas/v4', model:'glm-4v-flash', key:'' }, theme:'',
      }));
    });

    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(500);

    const stats = await p.evaluate(() => {
      const counts = [...document.querySelectorAll('.ftab')].map(b => b.textContent.trim());
      const ring = document.querySelector('.invh-ring b');
      const foot = document.querySelector('.invh-foot');
      const dleft = [...document.querySelectorAll('.item.inv')].map(el => {
        const m = el.textContent.match(/约还能吃\s*([\d.]+|<1)\s*天/);
        return m ? m[1] : null;
      });
      return {
        counts,
        overall: ring ? ring.textContent.trim() : null,
        foot: foot ? foot.textContent.trim() : null,
        dleft,
        ov: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    console.log(`\n[${scheme}] 筛选标签 ${stats.counts.join(' / ')}`);
    console.log(`  总览环 ${stats.overall} 天 | ${stats.foot}`);
    console.log('  各样预计可吃天数:', stats.dleft.map(x => x || '—').join(', '));
    if (stats.ov > 1) errs.push(`[${scheme}] 横向溢出 ${stats.ov}px`);

    // 库存页
    await p.click('nav button[data-t="tab-stock"]');
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(OUT, `10-库存概览-${scheme}.png`), fullPage: true });

    // 采购清单
    await p.evaluate(() => showShopping());
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, `11-采购清单-${scheme}.png`) });
    const shop = await p.evaluate(() => document.getElementById('sheet').innerHTML.length);
    await p.evaluate(() => closeSheet());
    await p.waitForTimeout(200);

    // 食材详情
    await p.evaluate(() => detailSheet('i1'));
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, `12-食材详情-${scheme}.png`) });
    await p.evaluate(() => closeSheet());
    await p.waitForTimeout(200);

    // 吃掉抽屉
    await p.evaluate(() => eatSheet('i1'));
    await p.waitForTimeout(400);
    await p.evaluate(() => { const e = document.getElementById('eatG'); e.value = '180'; e.dispatchEvent(new Event('input')); });
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(OUT, `13-吃掉-余量提示-${scheme}.png`) });

    // 今日页
    await p.evaluate(() => closeSheet());
    await p.click('nav button[data-t="tab-today"]');
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(OUT, `14-今日库存提醒-${scheme}.png`), fullPage: true });

    console.log('  采购清单 HTML ' + shop + ' 字符');
    await ctx.close();
  }

  await b.close();
  console.log('\n================ 汇总 ================');
  if (errs.length) { console.log('错误 ' + errs.length + ' 条:'); errs.forEach(e => console.log('  ✗ ' + e)); }
  else console.log('✓ 无控制台错误 / 无页面异常 / 无横向溢出');
  process.exit(errs.length ? 1 : 0);
})();
