// 库存管家扩展功能测试：消耗预测 / 采购清单 / 缺口分析 / 详情 / 批量
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

const made = {}, store = {};
function mkEl(id) {
  const el = { id, _html: '', _text: '', value: '', style: {}, dataset: {}, _cls: new Set(), children: [],
    get innerHTML() { return this._html }, set innerHTML(v) { this._html = String(v) },
    get textContent() { return this._text }, set textContent(v) { this._text = String(v) },
    addEventListener() {}, removeEventListener() {}, click() {}, focus() {}, blur() {}, select() {},
    dispatchEvent() { return true }, appendChild(c) { this.children.push(c); return c }, removeChild() {},
    querySelector() { return null }, querySelectorAll() { return [] }, setAttribute() {},
    getAttribute() { return null }, removeAttribute() {}, insertAdjacentHTML() {},
    getBoundingClientRect() { return { width: 360, height: 200, top: 0, left: 0 } },
    scrollIntoView() {}, closest() { return null } };
  el.classList = { add: c => el._cls.add(c), remove: c => el._cls.delete(c),
    contains: c => el._cls.has(c), toggle: c => el._cls.has(c) ? el._cls.delete(c) : el._cls.add(c) };
  return el;
}
const $ = id => (made[id] || (made[id] = mkEl(id)));
const document = { getElementById: $, querySelector: () => null, querySelectorAll: () => [],
  createElement: t => mkEl('_' + t), addEventListener() {}, body: mkEl('body'),
  documentElement: mkEl('html'), readyState: 'complete', hidden: false };
const localStorage = { getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) }, removeItem: k => { delete store[k] }, clear() {} };
const win = { document, localStorage, navigator: { onLine: true }, location: { origin: 'https://e.com', href: 'https://e.com/', protocol: 'https:', hostname: 'e.com' },
  matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {}, scrollTo() {},
  setTimeout: fn => { fn(); return 0 }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: fn => { fn(0); return 0 },
  URL, Number, Math, JSON, Date, String, Array, Object, RegExp, Promise, Error, isNaN, parseFloat, parseInt,
  Event: function (t) { this.type = t },
  alert: m => { throw new Error('alert:' + m) }, confirm: m => { throw new Error('confirm:' + m) },
  prompt: m => { throw new Error('prompt:' + m) },
  fetch: () => Promise.reject(new Error('off')), Image: function () {}, FileReader: function () { this.readAsDataURL = () => {} },
  console, CSS: { supports: () => true },
  caches: { open: () => Promise.resolve({ addAll: () => Promise.resolve(), put: () => Promise.resolve(), match: () => Promise.resolve(null) }), keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) } };
win.self = win; win.window = win; win.globalThis = win;

const api = new Function(...Object.keys(win), js +
  ';return {calc,invTotals,dailyBurn,dailyBurnAll,daysLeft,recentIntake,shoppingList,gapToday,proteinSuggest,' +
  'renderStock,renderToday,detailSheet,showShopping,setLow,doSetLow,eatSheet,doEat,doRestock,restockAllLow,doRestockAllLow,' +
  'clearInvAsk,doClearInv,setStockView,lowThreshold,guessCat,scale,dayTotals,todayStr,dstr,uid,' +
  'get S(){return S},get FOODS(){return FOODS}};')(...Object.values(win));

let pass = 0, fail = 0;
function t(n, f) {
  try { const r = f(); console.log((r === false ? '✗' : '✓') + ' ' + n); r === false ? fail++ : pass++; }
  catch (e) { console.log('✗ ' + n + ' → ' + e.message); fail++; }
}
function daysAgo(n) { return api.dstr(n) }

console.log('=== 1. 消耗速度预测 ===');

// 造一个场景：鸡胸肉 1000g，近 5 天每天吃 200g
api.S.inv = [{ id: 'c1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5.0, c: 2.5, cat: 'protein', g: 1000 }];
api.S.log = {}; api.S.ex = {}; api.S.profile = { sex: 'm', age: 24, h: 175, w: 70, act: 1.55, adj: 0, pk: 2.0 };
for (let i = 0; i < 5; i++) {
  api.S.log[daysAgo(i)] = [{ n: '鸡胸肉(生)', g: 200, k: 266, p: 38.8, f: 10, c: 5, iid: 'c1' }];
}

t('dailyBurn 算出日均 200g', () => {
  const b = api.dailyBurn('c1', 7);
  console.log('   日均 = ' + (b ? b.toFixed(2) : 'null') + ' g/天');
  return b !== null && Math.abs(b - 200 * 5 / 7) < 0.01;
});
t('daysLeft 预测 1000g ÷ 日均 = 约 7 天', () => {
  const d = api.daysLeft(api.S.inv[0]);
  console.log('   预计可吃 ' + (d ? d.toFixed(1) : 'null') + ' 天');
  return d !== null && d > 6 && d < 8;
});
t('样本不足（只 1 天有记录）时返回 null，不给噪声预测', () => {
  api.S.log = {};
  api.S.log[daysAgo(0)] = [{ n: 'x', g: 100, iid: 'c1' }];
  const b = api.dailyBurn('c1', 7);
  console.log('   单日记录 → ' + (b === null ? 'null（正确，不给预测）' : b.toFixed(2)));
  return b === null;
});
t('完全无记录时 daysLeft 返回 null', () => {
  api.S.log = {};
  return api.daysLeft(api.S.inv[0]) === null;
});
t('dailyBurnAll 汇总全库消耗', () => {
  api.S.log = {};
  api.S.log[daysAgo(0)] = [{ g: 100, iid: 'a' }, { g: 50, iid: 'b' }];
  api.S.log[daysAgo(1)] = [{ g: 150, iid: 'a' }];
  const b = api.dailyBurnAll(7);
  console.log('   全库日均 = ' + b.toFixed(2) + ' g/天（300g / 7天）');
  return Math.abs(b - 300 / 7) < 0.01;
});

console.log('\n=== 2. 采购清单 ===');
api.S.log = {};
for (let i = 0; i < 5; i++) api.S.log[daysAgo(i)] = [{ n: '鸡胸肉(生)', g: 200, k: 266, p: 38.8, f: 10, c: 5, iid: 'c1' }];
api.S.inv = [
  { id: 'c1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5.0, c: 2.5, cat: 'protein', g: 80 },   // 低于 100 → 需补
  { id: 'c2', n: '西兰花', k: 36, p: 4.1, f: 0.6, c: 4.3, cat: 'veg', g: 500 },            // 充足
  { id: 'c3', n: '鸡蛋(全蛋)', k: 144, p: 13.3, f: 8.8, c: 2.8, cat: 'protein', g: 20 },   // 告急（<30）
];
t('采购清单只包含低量项', () => {
  const l = api.shoppingList();
  const names = l.map(x => x.n);
  console.log('   清单: ' + l.map(x => x.n + ' +' + x.suggest + 'g').join(' | '));
  return names.includes('鸡胸肉(生)') && names.includes('鸡蛋(全蛋)') && !names.includes('西兰花');
});
t('告急项排在前面', () => {
  const l = api.shoppingList();
  console.log('   第一项 = ' + l[0].n + '（urgent=' + l[0].urgent + '）');
  return l[0].urgent === true;
});
t('有消耗数据的项按「补到够吃 7 天」计算', () => {
  const l = api.shoppingList();
  const ck = l.find(x => x.id === 'c1');
  const b = api.dailyBurn('c1', 7);
  const expect = Math.max(Math.ceil((b * 7 - 80) / 50) * 50, 100);
  console.log('   鸡胸肉 日均' + b.toFixed(0) + 'g，现有80g → 建议 +' + ck.suggest + 'g（期望 ' + expect + '）');
  return ck.suggest === expect;
});
t('无消耗数据的项给一次性合理量（非 0）', () => {
  const l = api.shoppingList();
  const egg = l.find(x => x.id === 'c3');
  console.log('   鸡蛋（无消耗记录）→ 建议 +' + egg.suggest + 'g');
  return egg.suggest >= 200;
});
t('自定义提醒线生效', () => {
  api.S.inv.find(x => x.id === 'c2').low = 600;   // 西兰花 500g < 600 → 应进清单
  const l = api.shoppingList();
  const has = l.some(x => x.id === 'c2');
  console.log('   西兰花提醒线设为 600g（现有 500g）→ ' + (has ? '已进清单' : '未进清单'));
  api.S.inv.find(x => x.id === 'c2').low = undefined;
  return has;
});

console.log('\n=== 3. 缺口分析 ===');
api.S.log = {};
t('gapToday 正确计算三种营养素缺口', () => {
  const c = api.calc(), g = api.gapToday();
  console.log('   目标 P' + c.pg + 'g，已吃 0 → 缺口 P' + Math.round(g.p) + 'g / ' + Math.round(g.kcal) + 'kcal');
  return Math.abs(g.p - c.pg) < 1 && Math.abs(g.kcal - c.target) < 2;
});
t('已吃够时缺口为 0（不为负）', () => {
  api.S.log[api.todayStr()] = [{ n: 'x', g: 999, k: 9999, p: 999, f: 999, c: 999 }];
  const g = api.gapToday();
  console.log('   超量摄入 → 缺口 P' + g.p + ' kcal' + g.kcal + '（应为 0）');
  api.S.log = {};
  return g.p === 0 && g.kcal === 0;
});
t('proteinSuggest 从蛋白类食材里挑密度最高的', () => {
  api.S.inv = [
    { id: 'p1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5, c: 2.5, cat: 'protein', g: 500 },
    { id: 'p2', n: '鸡蛋(全蛋)', k: 144, p: 13.3, f: 8.8, c: 2.8, cat: 'protein', g: 500 },
    { id: 'v1', n: '西兰花', k: 36, p: 4.1, f: 0.6, c: 4.3, cat: 'veg', g: 500 },
  ];
  const ps = api.proteinSuggest();
  console.log('   推荐: ' + (ps ? ps.need + 'g ' + ps.food.n : 'null') + ' 补 ' + (ps ? ps.pc : '-') + 'g 蛋白');
  return ps && ps.food.cat === 'protein';
});
t('proteinSuggest 忽略非蛋白类食材', () => {
  api.S.inv = [{ id: 'v1', n: '西兰花', k: 36, p: 4.1, f: 0.6, c: 4.3, cat: 'veg', g: 500 }];
  const ps = api.proteinSuggest();
  console.log('   库存只有蔬菜 → ' + (ps === null ? 'null（正确）' : '推荐了 ' + ps.food.n));
  return ps === null;
});
t('缺口为 0 时不推荐', () => {
  api.S.inv = [{ id: 'p1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5, c: 2.5, cat: 'protein', g: 500 }];
  api.S.log[api.todayStr()] = [{ n: 'x', g: 999, k: 9999, p: 999, f: 999, c: 999 }];
  const ps = api.proteinSuggest();
  api.S.log = {};
  return ps === null;
});

console.log('\n=== 4. 分类推断 ===');
t('内置库精确匹配', () => api.guessCat('鸡胸肉(生)') === 'protein' && api.guessCat('西兰花') === 'veg');
t('部分匹配', () => {
  const c = api.guessCat('鸡胸肉');
  console.log('   「鸡胸肉」→ ' + c);
  return c === 'protein';
});
t('关键字规则：肉类', () => api.guessCat('黑椒牛柳') === 'protein');
t('关键字规则：主食', () => api.guessCat('意大利面') === 'staple');
t('关键字规则：水果', () => api.guessCat('红富士苹果') === 'fruit');
t('关键字规则：油脂坚果', () => api.guessCat('巴旦木') === 'fat');
t('无法判断时归 other', () => {
  const c = api.guessCat('某种奇怪的东西XYZ');
  console.log('   → ' + c);
  return c === 'other';
});
t('空名安全返回 other', () => api.guessCat('') === 'other' && api.guessCat(null) === 'other');

console.log('\n=== 5. 详情与提醒线 ===');
t('detailSheet 能正常渲染（含 14 天柱图）', () => {
  api.S.log = {};
  for (let i = 0; i < 5; i++) api.S.log[daysAgo(i)] = [{ n: 'x', g: 100, k: 1, p: 1, f: 1, c: 1, iid: 'c1' }];
  api.S.inv = [{ id: 'c1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5, c: 2.5, cat: 'protein', g: 400 }];
  api.detailSheet('c1');
  const h = made['sheet'].innerHTML;
  console.log('   抽屉 HTML 长度 ' + h.length + '，含 14 根柱 = ' + (h.match(/class="wkr/g) || []).length);
  return h.includes('近 14 天消耗') && (h.match(/class="wkr/g) || []).length === 14;
});
t('doSetLow 保存自定义提醒线', () => {
  api.doSetLow('c1', 250);
  console.log('   提醒线 → ' + api.lowThreshold(api.S.inv[0]) + 'g');
  return api.S.inv[0].low === 250;
});
t('detailSheet 对不存在的 id 安全返回', () => { api.detailSheet('nope'); return true; });

console.log('\n=== 6. 吃掉 / 补货 / 撤销 ===');
t('吃掉后库存扣减 + 记录写入', () => {
  api.S.inv = [{ id: 'e1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5, c: 2.5, cat: 'protein', g: 500 }];
  api.S.log = {};
  $('eatG').value = '150';
  api.doEat('e1');
  const g = api.S.inv[0].g, d = api.dayTotals();
  console.log('   剩余 ' + g + 'g，今日 ' + Math.round(d.k) + ' kcal');
  return Math.abs(g - 350) < 0.01 && Math.abs(d.k - 199.5) < 0.5;
});
t('吃掉后自定义提醒线随撤销一起还原', () => {
  api.S.inv = [{ id: 'r1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5, c: 2.5, cat: 'protein', g: 300, low: 200 }];
  api.S.log = {};
  $('eatG').value = '300';       // 吃光，条目被移除
  api.doEat('r1');
  const gone = api.S.inv.length === 0;
  const newFn = new Function(...Object.keys(win), js + ';return {delLog};')(...Object.values(win));
  newFn.delLog(0);
  const back = api.S.inv.find(x => x.id === 'r1');
  console.log('   吃光移除=' + gone + ' → 撤销后 ' + (back ? back.g + 'g, low=' + back.low : '失败'));
  return gone && back && back.low === 200;
});
t('补货叠加', () => {
  api.S.inv = [{ id: 's1', n: 'A', k: 100, p: 10, f: 1, c: 0, cat: 'protein', g: 100 }];
  $('rsG').value = '400';
  api.doRestock('s1');
  return Math.abs(api.S.inv[0].g - 500) < 0.01;
});
t('一键补货：所有低量项按建议量补齐', () => {
  api.S.log = {};
  for (let i = 0; i < 5; i++) api.S.log[daysAgo(i)] = [{ n: 'x', g: 100, k: 1, p: 1, f: 1, c: 1, iid: 'a1' }];
  api.S.inv = [
    { id: 'a1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5, c: 2.5, cat: 'protein', g: 50 },
    { id: 'a2', n: '鸡蛋(全蛋)', k: 144, p: 13.3, f: 8.8, c: 2.8, cat: 'protein', g: 30 },
    { id: 'a3', n: '西兰花', k: 36, p: 4.1, f: 0.6, c: 4.3, cat: 'veg', g: 900 },
  ];
  const before = { a1: api.S.inv[0].g, a2: api.S.inv[1].g, a3: api.S.inv[2].g };
  api.doRestockAllLow();
  const after = { a1: api.S.inv[0].g, a2: api.S.inv[1].g, a3: api.S.inv[2].g };
  console.log('   a1: ' + before.a1 + '→' + after.a1 + ' | a2: ' + before.a2 + '→' + after.a2 + ' | a3: ' + before.a3 + '→' + after.a3 + '(应不变)');
  return after.a1 > before.a1 && after.a2 > before.a2 && after.a3 === before.a3;
});
t('清空库存不影响饮食记录', () => {
  api.S.inv = [{ id: 'z1', n: 'A', k: 100, p: 10, f: 1, c: 0, cat: 'protein', g: 100 }];
  api.S.log = {}; api.S.log[api.todayStr()] = [{ n: 'B', g: 100, k: 50, p: 5, f: 1, c: 1 }];
  api.doClearInv();
  console.log('   库存 ' + api.S.inv.length + ' 项，饮食记录仍 ' + (api.S.log[api.todayStr()] || []).length + ' 条');
  return api.S.inv.length === 0 && (api.S.log[api.todayStr()] || []).length === 1;
});

console.log('\n=== 7. 视图与渲染 ===');
t('三种筛选视图都能渲染', () => {
  api.S.log = {};
  for (let i = 0; i < 5; i++) api.S.log[daysAgo(i)] = [{ n: 'x', g: 100, k: 1, p: 1, f: 1, c: 1, iid: 'k1' }];
  api.S.inv = [
    { id: 'k1', n: '鸡胸肉(生)', k: 133, p: 19.4, f: 5, c: 2.5, cat: 'protein', g: 60 },
    { id: 'k2', n: '西兰花', k: 36, p: 4.1, f: 0.6, c: 4.3, cat: 'veg', g: 800 },
  ];
  ['all', 'low', 'soon'].forEach(v => { api.setStockView(v); if (!made['stockBox'].innerHTML.length) throw new Error(v + ' 渲染为空'); });
  return true;
});
t('renderStock 输出概览卡 + 筛选标签 + 批量操作', () => {
  api.setStockView('all');
  const h = made['stockBox'].innerHTML, a = made['stockActions'].innerHTML;
  console.log('   stockBox ' + h.length + ' 字符，stockActions ' + a.length + ' 字符');
  return h.includes('库存总计') && h.includes('ftab') && a.includes('批量操作');
});
t('renderToday 输出库存提醒卡', () => {
  api.S.inv = [{ id: 'q1', n: 'A', k: 100, p: 10, f: 1, c: 0, cat: 'protein', g: 50 }];
  api.renderToday();
  const h = made['todayBox'].innerHTML;
  console.log('   今日页含「库存提醒」= ' + h.includes('库存提醒'));
  return h.includes('库存提醒');
});
t('空库存时 renderStock 不崩且给引导', () => {
  api.S.inv = []; api.renderStock();
  const h = made['stockBox'].innerHTML;
  return h.includes('库存是空的') && made['stockActions'].innerHTML === '';
});

console.log('\n通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
