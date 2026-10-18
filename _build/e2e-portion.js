// 浏览器里真的点一遍份量助手 —— 不断言「元素存在」，而是走完用户动作：
// 打开拍照页 → 手动输入 → 填西兰花和营养 → 点「一颗」→ 看克重和纤维对不对
const { chromium } = require('playwright');
const EXE = 'C:/Users/25675/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = process.env.URL || 'http://127.0.0.1:8793/index.html';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p.on('pageerror', e => { fail++; console.log('  ✗ 页面报错: ' + e.message); });
  await p.goto(URL, { waitUntil: 'load' });

  // 进拍照页
  await p.click('[data-tab="tab-scan"], .navitem[data-go="tab-scan"]').catch(async () => {
    await p.evaluate(() => go('tab-scan'));
  });
  await p.waitForTimeout(150);

  // 手动输入（不拍照）
  await p.evaluate(() => openManual());
  await p.waitForTimeout(150);

  // 填成西兰花：名称 + 每 100g 营养（纤维 2.6 来自内置食物库口径）
  await p.fill('#rN', '西兰花');
  await p.fill('#rK', '36');
  await p.fill('#rFb', '2.6');
  await p.selectOption('#rCat', 'veg').catch(() => {});
  await p.evaluate(() => renderPortions());
  await p.waitForTimeout(100);

  const btns = await p.$$eval('.pbtn', els => els.map(e => e.textContent.trim()));
  console.log('  份量按钮: ' + btns.join(' / '));
  ok(btns.length >= 3, '至少要给出 3 个份量选项');
  ok(btns.some(t => t.indexOf('一颗') >= 0), '西兰花要有「一颗」这个选项');

  // 真的点「一颗」
  const one = await p.$$('.pbtn');
  let clicked = false;
  for (const el of one) {
    const t = (await el.textContent()).trim();
    if (t.indexOf('一颗') >= 0) { await el.click(); clicked = true; break; }
  }
  ok(clicked, '找得到「一颗」按钮并点了它');
  await p.waitForTimeout(120);

  const g = await p.inputValue('#rG');
  ok(String(g) === '300', '点完「一颗」，总克重应填成 300（实际 ' + g + '）');

  const tip = (await p.textContent('#portionTip')).trim();
  console.log('  提示: ' + tip);
  // 独立手算：2.6 g/100g × 300 g = 7.8 g
  ok(tip.indexOf('7.8') >= 0, '提示里要算出膳食纤维 7.8 g');
  ok(tip.indexOf('108') >= 0, '提示里要算出约 108 kcal');

  // 再点「一小朵」，克重和纤维要跟着变
  for (const el of await p.$$('.pbtn')) {
    if ((await el.textContent()).indexOf('一小朵') >= 0) { await el.click(); break; }
  }
  await p.waitForTimeout(120);
  const g2 = await p.inputValue('#rG');
  const tip2 = (await p.textContent('#portionTip')).trim();
  ok(String(g2) === '25', '换成「一小朵」后克重应变 25（实际 ' + g2 + '）');
  ok(tip2.indexOf('0.7') >= 0 || tip2.indexOf('0.65') >= 0, '25 g 的纤维约 0.7 g（实际：' + tip2 + '）');

  await p.screenshot({ path: '_build/_portion.png', fullPage: false });
  await b.close();
  console.log(`通过 ${pass} / 失败 ${fail}`);
  if (fail) process.exit(1);
})();
