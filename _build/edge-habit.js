// 习惯与趋势功能测试：连续记录天数 / 月度天数 / 体重趋势（最小二乘斜率）
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
  ';return {streakDays,monthDays,renderStreak,logWeight,weightSeries,weightTrend,renderWeightTrend,doLogWeight,logWeightSheet,' +
  'saveProfile,calc,todayStr,dstr,get S(){return S},set S(v){S=v}};')(...Object.values(win));

let pass = 0, fail = 0;
function t(n, f) {
  try { const r = f(); console.log((r === false ? '✗' : '✓') + ' ' + n); r === false ? fail++ : pass++; }
  catch (e) { console.log('✗ ' + n + ' → ' + e.message); fail++; }
}
const ago = n => api.dstr(n);
const mkLog = (days) => { const o = {}; days.forEach(d => { o[d] = [{ n: 'x', g: 100, k: 100, p: 5, f: 2, c: 10 }] }); return o };

console.log('=== 1. 连续记录天数 ===');

api.S.log = mkLog([ago(0), ago(1), ago(2)]);
t('连续 3 天（含今天）→ 3', () => api.streakDays() === 3);

api.S.log = mkLog([ago(1), ago(2)]);
t('今天还没记、昨天记了 → 不算断，仍为 2', () => api.streakDays() === 2);

api.S.log = mkLog([ago(0), ago(2), ago(3)]);
t('中间断了（缺昨天）→ 只算今天 1 天', () => api.streakDays() === 1);

api.S.log = {};
t('完全无记录 → 0', () => api.streakDays() === 0);

api.S.log = mkLog([ago(3), ago(4)]);
t('最近两天都没记 → 0', () => api.streakDays() === 0);

api.S.log = mkLog([ago(0), ago(1), ago(2), ago(3), ago(4)]);
t('连续 5 天 → 5', () => api.streakDays() === 5);

// 空数组不算「有记录」
api.S.log = {}; api.S.log[ago(0)] = [];
t('当天记录为空数组 → 不算记录', () => api.streakDays() === 0);

console.log('\n=== 2. 本月记录天数 ===');
(() => {
  const now = new Date(), pre = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  api.S.log = {};
  api.S.log[pre + '-01'] = [{ n: 'a', g: 1, k: 1, p: 0, f: 0, c: 0 }];
  api.S.log[pre + '-' + day] = [{ n: 'b', g: 1, k: 1, p: 0, f: 0, c: 0 }];
  api.S.log['2020-01-05'] = [{ n: 'old', g: 1, k: 1, p: 0, f: 0, c: 0 }];   // 往年，不该计入
  api.S.log[pre + '-15'] = [];                                              // 空数组，不该计入
})();
t('本月只统计本月且非空 → 2', () => api.monthDays() === 2);

console.log('\n=== 3. 体重日志 ===');
api.S.wt = {};
api.logWeight(70.0);
t('logWeight 写入今天的值', () => api.S.wt[api.todayStr()] === 70);
api.logWeight(69.4);
t('同一天改两次只留最后一次', () => api.S.wt[api.todayStr()] === 69.4);

api.S.wt = { [ago(4)]: 72, [ago(3)]: 71.5, [ago(2)]: 71, [ago(1)]: 70.5, [ago(0)]: 70 };
t('weightSeries 按日期升序返回', () => {
  const s = api.weightSeries(30);
  return s.length === 5 && s[0].w === 72 && s[4].w === 70;
});
t('weightSeries 限制条数（取最近 3 条）', () => {
  const s = api.weightSeries(3);
  return s.length === 3 && s[2].w === 70;
});

console.log('\n=== 4. 趋势斜率（最小二乘）===');
t('每天 −0.5kg → 周斜率 −3.5', () => {
  const tr = api.weightTrend();
  console.log('   kg/周 = ' + tr.kgPerWeek + ' | 总变化 = ' + tr.delta + ' | 点数 = ' + tr.points);
  return Math.abs(tr.kgPerWeek - (-3.5)) < 0.01 && Math.abs(tr.delta - (-2)) < 0.01;
});

api.S.wt = { [ago(0)]: 70 };
t('只有 1 个点 → 返回 null（不给趋势）', () => api.weightTrend() === null);

api.S.wt = {};
t('无数据 → null', () => api.weightTrend() === null);

// 平台期：体重完全不变 → 斜率 0
api.S.wt = { [ago(3)]: 70, [ago(2)]: 70, [ago(1)]: 70, [ago(0)]: 70 };
t('体重不变 → 斜率 0', () => {
  const tr = api.weightTrend();
  return tr && tr.kgPerWeek === 0 && tr.delta === 0;
});

// 增重方向
api.S.wt = { [ago(2)]: 68, [ago(1)]: 69, [ago(0)]: 70 };
t('增重 → 正斜率', () => {
  const tr = api.weightTrend();
  return tr.kgPerWeek > 0 && tr.delta === 2;
});

console.log('\n=== 5. 渲染与安全 ===');
api.S.wt = { [ago(2)]: 70, [ago(1)]: 69.5, [ago(0)]: 69 };
t('renderWeightTrend 输出折线 + 当前值', () => {
  const el = $('wtTrend');
  api.renderWeightTrend();
  const h = el.innerHTML;
  return h.includes('<polyline') && h.includes('69') && h.includes('kg/周');
});
t('renderWeightTrend 单点也能画（不崩）', () => {
  api.S.wt = { [ago(0)]: 70 };
  api.renderWeightTrend();
  return $('wtTrend').innerHTML.includes('<polyline');
});
t('renderWeightTrend 无数据给引导文案', () => {
  api.S.wt = {};
  api.renderWeightTrend();
  return $('wtTrend').innerHTML.includes('体重变化趋势');
});

t('renderStreak 输出连续天数', () => {
  api.S.profile = { sex: 'm', age: 24, h: 175, w: 70, act: 1.55, adj: 0, pk: 2.0 };
  api.S.log = mkLog([ago(0), ago(1), ago(2)]);
  api.renderStreak();
  const h = $('streakBox').innerHTML;
  return h.includes('连续记录') && h.includes('>3<');
});
t('renderStreak 无 profile 时清空', () => {
  api.S.profile = null;
  api.renderStreak();
  return $('streakBox').innerHTML === '';
});
t('renderStreak 记录最长连续（bestStreak 单调不减）', () => {
  api.S.profile = { sex: 'm', age: 24, h: 175, w: 70, act: 1.55, adj: 0, pk: 2.0 };
  api.S.bestStreak = 0;
  api.S.log = mkLog([ago(0), ago(1), ago(2), ago(3)]);
  api.renderStreak();
  const a = api.S.bestStreak;
  api.S.log = mkLog([ago(0)]);
  api.renderStreak();
  const b = api.S.bestStreak;
  return a === 4 && b === 4;
});

console.log('\n=== 6. 边界安全 ===');
t('renderWeightTrend 元素不存在时静默返回', () => {
  delete made['wtTrend__missing'];
  const old = document.getElementById;
  document.getElementById = (id) => id === 'wtTrend' ? null : old(id);
  api.renderWeightTrend();     // 不应抛错
  document.getElementById = old;
  return true;
});
t('体重越界不写入（25 以下）', () => {
  api.S.wt = {};
  $('wtIn').value = '10';
  api.doLogWeight();
  return Object.keys(api.S.wt).length === 0;
});
t('体重越界不写入（300 以上）', () => {
  api.S.wt = {};
  $('wtIn').value = '500';
  api.doLogWeight();
  return Object.keys(api.S.wt).length === 0;
});
t('合法体重写入并同步 profile.w', () => {
  api.S.wt = {}; api.S.profile = { sex: 'm', age: 24, h: 175, w: 70, act: 1.55, adj: 0, pk: 2.0 };
  $('wtIn').value = '68.5';
  api.doLogWeight();
  return api.S.wt[api.todayStr()] === 68.5 && api.S.profile.w === 68.5;
});
t('小数体重保留一位', () => {
  api.S.wt = {};
  $('wtIn').value = '67.83';
  api.doLogWeight();
  return api.S.wt[api.todayStr()] === 67.8;
});

console.log('\n通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
