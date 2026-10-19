// 份量助手测试：常见份量表 / 匹配 / 换算
// 期望值来源：PORTIONS 表本身是数据（不是公式），所以这里用**手算的独立结果**去对：
//   西兰花 纤维 2.6 g/100g，一颗 300 g → 2.6 × 3 = 7.8 g
// 这样断言和代码不会因为「抄了同一个公式」而必然通过。
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
  ';return {portionsFor,renderPortions,pickPortion,updatePortionTip,renderAiSummary,readR,guessCat,' +
  'get PORTIONS(){return PORTIONS},get PORT_FALLBACK(){return PORT_FALLBACK},' +
  'get CAT_ORDER(){return CAT_ORDER},get FOODS(){return FOODS}};')(...Object.values(win));

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + msg); }
}
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

/* ---------- 1. 数据表本身要站得住 ---------- */
const P = api.PORTIONS, FB = api.PORT_FALLBACK, FOODS = api.FOODS;
const foodNames = FOODS.map(f => f.n);
let badKey = null, badItem = null;
Object.keys(P).forEach(k => {
  if (!foodNames.includes(k) && !badKey) badKey = k;
  P[k].forEach(([u, g]) => {
    if (!(typeof u === 'string' && u.length > 0 && typeof g === 'number' && g > 0 && g <= 1000)) badItem = k + '/' + u;
  });
});
ok(!badKey, 'PORTIONS 的键必须都能在 FOODS 里找到（可疑：' + badKey + '）');
ok(!badItem, '每条形如 [单位名, 正数克重]，且不超过 1000 g（可疑：' + badItem + '）');
ok(Object.keys(P).length >= 60, '份量表至少覆盖 60 种常见食材（实际 ' + Object.keys(P).length + '）');
ok(Array.isArray(FB.protein), 'PORT_FALLBACK 要覆盖 protein');
ok(Array.isArray(FB.staple), 'PORT_FALLBACK 要覆盖 staple');
ok(Array.isArray(FB.veg), 'PORT_FALLBACK 要覆盖 veg');
ok(Array.isArray(FB.fruit), 'PORT_FALLBACK 要覆盖 fruit');
ok(Array.isArray(FB.fat), 'PORT_FALLBACK 要覆盖 fat');
ok(Array.isArray(FB.other), 'PORT_FALLBACK 要覆盖 other');

/* ---------- 2. 匹配：精确 / 模糊 / 兜底 ---------- */
const broc = api.portionsFor('西兰花', 'veg');
ok(broc.some(x => x[0] === '一颗' && x[1] === 300), '精确匹配「西兰花」要能给出「一颗 300 g」');
ok(api.portionsFor('西兰花(焯水)', 'veg') === broc, '带后缀的名字也要命中（括号已忽略）');
ok(api.portionsFor('一颗西兰花', 'veg') === broc, '名字里包住关键词也要命中');
ok(api.portionsFor('外星果', 'veg') === FB.veg, '认不出的名字退回蔬菜通用单位');
ok(api.portionsFor('外星果', 'protein') === FB.protein, '分类不同，退回的单位也不同');
ok(api.portionsFor('', 'veg') === FB.veg, '空名字不能崩，退回通用单位');

/* ---------- 3. 交互：点一下就填克重，并且算出纤维 ---------- */
$('rN').value = '西兰花'; $('rCat').value = 'veg';
$('rK').value = '36'; $('rFb').value = '2.6';
api.renderPortions();
const box = $('portionBox').innerHTML;
ok(box.indexOf('pickPortion(300)') >= 0, '渲染出的按钮要带克数（300）');
ok(!EMOJI.test(box), '界面里不许出现 emoji');

api.pickPortion(300);
ok(api.readR().g === 300, '点「一颗」后总克重被填成 300');
// 换算结果现在长在 AI 判断卡片上（提示行只做引导，不重复报数）
// 独立手算：2.6 g/100g × 300 g = 7.8 g 纤维；36 kcal/100g × 300 g = 108 kcal
api.renderAiSummary();
const card = $('aiSummary').innerHTML;
ok(card.indexOf('7.8') >= 0, '卡片里要算出膳食纤维 7.8 g（2.6 × 3）');
ok(card.indexOf('108') >= 0, '卡片里要算出约 108 kcal（36 × 3）');
ok(card.indexOf('膳食纤维') >= 0, '卡片要点名膳食纤维，而不是只给一个数字');
ok($('aiSummary').style.display === 'block', '有名字时卡片要显示出来');

/* ---------- 4. 边界 ---------- */
$('rG').value = '0';
api.updatePortionTip();
ok($('portionTip').innerHTML.indexOf('没估出重量') >= 0, '没填克重时给的是引导语，不是 0 g 的空结果');
$('rG').value = '150'; $('rFb').value = '';
api.updatePortionTip();
const card2 = $('aiSummary').innerHTML;
ok(card2.indexOf('150') >= 0 && card2.indexOf('膳食纤维') < 0, '纤维留空时不硬凑一项（不编数据）');
$('rN').value = '没听说过的东西';
api.renderPortions();
ok($('portionBox').innerHTML.indexOf('一把') >= 0, '认不出也能按分类给出通用份量');

/* ---------- 5. 吃掉弹层的快捷按钮也要用份量单位 ---------- */
// 真实事故（流程评审实测）：库存 2000g 鸡胸肉时，快捷按钮是
// 500/1000/1500/2000g —— 按库存百分比算的。用户想记 150g，
// 最近选项 1000g，误差 +850g，按钮完全没用。
ok(!/it\.g\s*\*\s*0\.25/.test(js), '吃掉弹层不能用库存 25% 当快捷选项');
ok(/portionsFor\(it\.n\s*,\s*it\.cat\)/.test(js), '吃掉弹层要用份量表给快捷选项');
ok(js.includes('if(!quicks.length)'), '库存比最小份量还少时要有「全部」兜底');

console.log(`通过 ${pass} / 失败 ${fail}`);
if (fail) process.exit(1);
