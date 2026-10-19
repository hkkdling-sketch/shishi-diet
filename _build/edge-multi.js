// 一盘多条目：拆分 / 改份量 / 删除 / 合计 / 分别记账
// 期望值全部手算，不抄源码公式：
//   米饭   150 g × 116 kcal/100g = 174 kcal，纤维 0.3×1.5 = 0.45 g
//   西兰花 120 g ×  42 kcal/100g =  50.4 kcal，纤维 2.6×1.2 = 3.12 g
//   鸡胸   100 g × 133 kcal/100g = 133 kcal，纤维 0
//   合计 370 g / 357.4→357 kcal / 3.57→3.6 g 纤维
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
  ';return {renderItems,delItem,saveItemG,clearScan,showMode,renderAiSummary,aiToLog,aiToStock,readR,' +
  'get scanItems(){return scanItems}, set scanItems(v){scanItems=v},' +
  'set aiNote(v){aiNote=v}, get S(){return S}, todayStr,uid};')(...Object.values(win));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };

const ITEMS = [
  { n: '米饭(熟)',   g: 150, k: 116, p: 2.6, f: 0.3, c: 25.9, fb: 0.3, na: 2, sf: 0.1, sg: 0.1, cat: 'staple' },
  { n: '西兰花',     g: 120, k: 42,  p: 3.2, f: 1.8, c: 5.1,  fb: 2.6, na: 180, sf: 0.3, sg: 2.4, cat: 'veg' },
  { n: '鸡胸肉(生)', g: 100, k: 133, p: 19.4, f: 5.0, c: 2.5, fb: 0,  na: 63, sf: 1.4, sg: 0, cat: 'protein' },
];

/* ---------- 1. 渲染：三条要渲染成三行 ---------- */
api.scanItems = ITEMS.map(x => ({ ...x }));
api.aiNote = '白盘家常菜，油不多';
api.renderItems();
const listHtml = $('itemList').innerHTML;
ok((listHtml.match(/class="itemRow"/g) || []).length === 3, '三条要渲染成三行（实际 ' + (listHtml.match(/class="itemRow"/g) || []).length + ' 行）');
ok(listHtml.includes('米饭'), '列表里要有米饭');
ok(listHtml.includes('西兰花'), '列表里要有西兰花');
ok(listHtml.includes('鸡胸肉'), '列表里要有鸡胸肉');
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(listHtml), '列表里不许有 emoji');

/* ---------- 2. 合计卡：手算对账 ---------- */
const card = $('aiSummary').innerHTML;
ok(card.includes('这一餐 · 3 样'), '三条时标题是「这一餐 · 3 样」');
ok(card.includes('370'), '总克重 370 g（150+120+100）');
ok(card.includes('357'), '总热量 357 kcal（174+50.4+133=357.4）');
ok(card.includes('3.6'), '总纤维 3.6 g（0.45+3.12=3.57）');
ok(card.includes('白盘家常菜'), 'AI 的说明要显示出来');

/* ---------- 3. 单条时标题用食物名 ---------- */
api.scanItems = [{ ...ITEMS[1] }];
api.renderItems();
ok($('aiSummary').innerHTML.includes('西兰花'), '只有一条时标题直接用食物名');
ok(!$('aiSummary').innerHTML.includes('这一餐'), '只有一条时不要说「这一餐」');

/* ---------- 4. 改份量：合计要跟着变 ---------- */
api.scanItems = ITEMS.map(x => ({ ...x }));
api.renderItems();
$('eiG').value = '300';
api.saveItemG(1);                       // 西兰花 120 → 300
ok(api.scanItems[1].g === 300, '改完克数要写回条目（实际 ' + api.scanItems[1].g + '）');
// 300 g 西兰花：纤维 2.6×3 = 7.8；总纤维 = 0.45 + 7.8 = 8.25 → 8.3
ok($('aiSummary').innerHTML.includes('8.3'), '改份量后总纤维应变成 8.3 g');
// 总克重 = 150 + 300 + 100 = 550
ok($('aiSummary').innerHTML.includes('550'), '改份量后总克重应变成 550 g');

/* ---------- 5. 删掉一条 ---------- */
api.delItem(0);                          // 删米饭
ok(api.scanItems.length === 2, '删掉后剩两条（实际 ' + api.scanItems.length + '）');
ok(!$('aiSummary').innerHTML.includes('这一餐 · 3 样'), '删完标题要更新');
ok($('itemList').innerHTML.includes('西兰花'), '剩下的还在');

/* ---------- 6. 全部删光要收起来 ---------- */
api.delItem(0); api.delItem(0);
ok(api.scanItems.length === 0, '删光后条目为空');
ok($('scanResult').style.display === 'none', '删光后整个结果区收起');

/* ---------- 7. 分别记账：三条进 log，各自扣库存 ---------- */
api.scanItems = ITEMS.map(x => ({ ...x }));
api.renderItems();
api.S.inv = [
  { id: 'a', n: '米饭(熟)',   g: 500, k: 116, p: 2.6, f: 0.3, c: 25.9, fb: 0.3, na: 2, sf: 0.1, sg: 0.1, cat: 'staple' },
  { id: 'b', n: '西兰花',     g: 400, k: 42,  p: 3.2, f: 1.8, c: 5.1,  fb: 2.6, na: 180, sf: 0.3, sg: 2.4, cat: 'veg' },
];
api.aiToLog(false);
const today = api.S.log[api.todayStr()] || [];
ok(today.length === 3, '三条都要记进今天（实际 ' + today.length + ' 条）');
ok(today.every(e => e.g > 0), '每条都要有克数');
const rice = today.find(e => e.n === '米饭(熟)');
ok(rice && Math.abs(rice.k - 174) < 0.5, '米饭按 150 g 换算成 174 kcal（实际 ' + (rice && rice.k) + '）');
const broc = today.find(e => e.n === '西兰花');
ok(broc && Math.abs(broc.fb - 3.1) < 0.2, '西兰花 120 g 的纤维约 3.1 g（实际 ' + (broc && broc.fb) + '）');
ok(rice && rice.iid === 'a', '米饭扣到了库存');
ok(broc && broc.iid === 'b', '西兰花扣到了库存');
const chick = today.find(e => e.n === '鸡胸肉(生)');
ok(chick && chick.out === true, '库存里没有鸡胸肉，那条要标成外食（不动库存）');
ok(api.S.inv.find(i => i.id === 'a').g === 350, '米饭库存 500→350');
ok(api.S.inv.find(i => i.id === 'b').g === 280, '西兰花库存 400→280');

/* ---------- 8. 外食模式不碰库存 ---------- */
api.S.log = {};
api.S.inv = [{ id: 'c', n: '西兰花', g: 400, k: 42, p: 3.2, f: 1.8, c: 5.1, fb: 2.6, na: 180, sf: 0.3, sg: 2.4, cat: 'veg' }];
api.scanItems = [{ ...ITEMS[1] }];
api.renderItems();
api.aiToLog(true);
ok(api.S.inv[0].g === 400, '选「外食」时库存不能动');
ok((api.S.log[api.todayStr()] || []).length === 1, '外食也要记进今天');

/* ---------- 9. 只加入库存 ---------- */
api.S.inv = [];
api.scanItems = ITEMS.map(x => ({ ...x }));
api.renderItems();
api.aiToStock();
ok(api.S.inv.length === 3, '三条都要加入库存（实际 ' + api.S.inv.length + '）');
ok(api.S.inv.every(i => i.id && i.n && i.g > 0), '每条库存项都要有 id/名称/克数');

console.log(`通过 ${pass} / 失败 ${fail}`);
if (fail) process.exit(1);
