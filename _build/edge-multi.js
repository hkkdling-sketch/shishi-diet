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
  ';return {renderItems,delItem,saveItemG,clearScan,showMode,renderAiSummary,aiToLog,readR,recentFoods,dbSuggest,' +
  'memGrams,applyMem,quickRel,doRelGrams,doRel,' +
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

/* ---------- 7. 分别记账：三条进 log，克数各自换算 ---------- */
api.scanItems = ITEMS.map(x => ({ ...x }));
api.renderItems();
api.aiToLog();
const today = api.S.log[api.todayStr()] || [];
ok(today.length === 3, '三条都要记进今天（实际 ' + today.length + ' 条）');
ok(today.every(e => e.g > 0), '每条都要有克数');
const rice = today.find(e => e.n === '米饭(熟)');
ok(rice && Math.abs(rice.k - 174) < 0.5, '米饭按 150 g 换算成 174 kcal（实际 ' + (rice && rice.k) + '）');
const broc = today.find(e => e.n === '西兰花');
ok(broc && Math.abs(broc.fb - 3.1) < 0.2, '西兰花 120 g 的纤维约 3.1 g（实际 ' + (broc && broc.fb) + '）');
// 库存已删除：不允许再出现扣库存痕迹
ok(today.every(e => e.iid === undefined), '记入后不该再带库存 id');
ok(api.S.inv === undefined, '状态里不该再有 inv 字段');

/* ---------- 8. 删一条记录只动当天的 log ---------- */
api.S.log = {};
api.scanItems = [{ ...ITEMS[1] }];
api.renderItems();
api.aiToLog();
const after = api.S.log[api.todayStr()] || [];
ok(after.length === 1, '再记一笔后今天有 1 条（实际 ' + after.length + '）');

/* ---------- 9. 清空扫描区不影响已记的账 ---------- */
api.scanItems = ITEMS.map(x => ({ ...x }));
api.renderItems();
api.clearScan();
ok(api.scanItems.length === 0, '清空后条目为空');
ok($('scanResult').style.display === 'none', '清空后整个结果区收起');
ok((api.S.log[api.todayStr()] || []).length === 1, '已记进今天的 1 条不受影响');

/* ---------- 10. 库存功能已彻底移除 ---------- */
// 2026-10-20 决策：库存非主流（对标 MyFitnessPal / Cal AI / MacroFactor /
// YAZIO / Lose It! 无一家做食材库存），彻底删除，用「最近常吃 + 份量记忆」顶替。
ok(!html.includes('aiToStock'), '不该再有「加入库存」入口');
ok(!html.includes('tab-stock'), '页面里不该再有库存 tab');
ok(!html.includes('onclick="aiToLog(true)">记入今日') && !html.includes('onclick="aiToLog(false)">'),
  '不该再有需要选「扣不扣库存」的按钮，主按钮只记今天的账');
ok(!js.includes('function renderStock'), '来源里不该再有 renderStock');
ok(!js.includes('S.inv'), '来源里不该再读 S.inv');
// 删除的字段不能被 norm() 重新兜底出来
api.S.log = {};
ok(api.S.inv === undefined || api.S.inv === null, 'inv 不再出现在状态里');

/* ---------- 11. 最近常吃：从历史日记取，点一下再记一笔 ---------- */
api.S.log = {};
api.S.log[api.todayStr()] = [
  { n: '米饭(熟)', g: 150, k: 174, p: 3.9, f: 0.45, c: 38.85, fb: 0.45, out: false },
  { n: '米饭(熟)', g: 200, k: 232, p: 5.2, f: 0.6, c: 51.8, fb: 0.6, out: false },
];
const recent = api.recentFoods(8);
ok(recent.length === 1, '同一种食物只出现一次（实际 ' + recent.length + '）');
ok(recent[0].g === 200, '克重要取最近一次的 200 g（实际 ' + recent[0].g + '）');
ok(recent[0].c === 2, '出现次数要数成 2 次（实际 ' + recent[0].c + '）');
ok(recent[0].last === api.todayStr(), '最近日期是今天');

// 库里没有的克数 → 只记名字和克重，不造数据
api.S.log = {};
api.S.log[api.todayStr()] = [{ n: '未知菜', g: 80 }];
// recentFoods 会跳过没有名字的条目
const r2 = api.recentFoods(8);
ok(r2.length === 1 && r2[0].n === '未知菜', '没有营养数据的食物也能进最近常吃');

/* ---------- 12. 份量记忆：memGrams / applyMem / 一键复记 ---------- */
api.S.log = {};
api.S.log[api.todayStr()] = [
  { n: '鸡胸肉', g: 150 },
  { n: '鸡胸肉', g: 180 },
  { n: '米饭(熟)', g: 200 },
];
ok(api.memGrams('鸡胸肉') === 180, 'memGrams 取最近一次 180g（实际 ' + api.memGrams('鸡胸肉') + '）');
ok(api.memGrams('米饭(熟)') === 200, 'memGrams 取米饭 200g');
ok(api.memGrams('不存在的食物') === 0, 'memGrams 没记过的食物返回 0');

// 识别结果命中常吃 → 用上次克重预填并标 mem（营养仍用 AI 估的每100g 值，只改克重）
const it = { n: '鸡胸肉', g: 999, k: 133, p: 0, f: 0, c: 0, fb: 0, na: 0, sf: 0, sg: 0 };
api.applyMem(it);
ok(it.g === 180, 'applyMem 把克重覆盖成记忆的 180g（实际 ' + it.g + '）');
ok(it.mem === true, 'applyMem 要标记 it.mem=true');
const it2 = { n: '从来没吃过', g: 50 };
api.applyMem(it2);
ok(it2.g === 50 && !it2.mem, '没命中常吃就不改克重、不标 mem');

// 一键复记：按上次克重直接记入今日，不弹层
const beforeN = (api.S.log[api.todayStr()] || []).length;
api.quickRel('鸡胸肉');
const tlog = api.S.log[api.todayStr()];
ok(tlog.length === beforeN + 1, 'quickRel 应往今日多记一笔');
const added = tlog[tlog.length - 1];
ok(added.n === '鸡胸肉' && added.g === 180, 'quickRel 记的是常吃克重 180g');

console.log(`通过 ${pass} / 失败 ${fail}`);
if (fail) process.exit(1);
