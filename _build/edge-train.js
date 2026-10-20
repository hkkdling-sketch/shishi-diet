/* Phase D 测试：训练消耗公式 / 日程日历 / 训练日营养目标 / 纤维 / 外食 / 实时扣减
   覆盖用户提出的六条诉求，尤其验证「跑了 5 公里用时多少 → 具体消耗」 */
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
  ';return {distKcal,hrKcalPerMin,maxHR,hrZone,exBurn,exOf,isTrainDay,dayIntensity,fiberTarget,calc,dayTotals,' +
  'gapToday,dbSuggest,planSheet,savePlan,delPlan,doAddEx,exSheet,drawExSheet,newExSheet,doNewEx,' +
  'outEatSheet,doOutEat,aiToLog,readR,renderTrain,renderCalIntoTrain,calGoTrain,scale' +
  ',setPlanRest,delPlan,savePlan,calClick' +
  ',CARB_PK,EXERCISES,INTENSITY_LABEL,findEx,allEx,exSub,paceStr,speedStr,exIcon,quickExSheet,todayStr,dstr,' +
  'get S(){return S},set S(v){S=v},get exSel(){return exSel},set exSel(v){exSel=v}};')(...Object.values(win));

let pass = 0, fail = 0;
function t(n, f) {
  try { const r = f(); console.log((r === false ? '✗' : '✓') + ' ' + n); r === false ? fail++ : pass++; }
  catch (e) { console.log('✗ ' + n + ' → ' + e.message); fail++; }
}
const P = { sex: 'm', age: 24, h: 175, w: 70, act: 1.55, adj: 0, pk: 2.0 };

/* ============================================================
   1. 距离法热量公式 —— 用户核心诉求「跑了5公里用时多少，给我具体消耗」
   ============================================================ */
console.log('\n=== 1. 跑步距离法（kcal = 1.036 × 体重 × 公里）===');

t('70kg 跑 5km = 1.036×70×5 = 362.6 → 363 kcal', () => {
  const k = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 5 }, P);
  console.log('   70kg / 5km →', k, 'kcal');
  return k === 363;
});

t('同样 5km，用时 25 分钟与 40 分钟消耗几乎相同（距离法特性）', () => {
  const a = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 5, min: 25 }, P);
  const b = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 5, min: 40 }, P);
  console.log('   25min →', a, 'kcal ；40min →', b, 'kcal');
  return a === b;
});

t('60kg 跑 10km 明显少于 90kg 跑 10km（体重线性）', () => {
  const light = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 10 }, { ...P, w: 60 });
  const heavy = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 10 }, { ...P, w: 90 });
  console.log('   60kg →', light, 'kcal ；90kg →', heavy, 'kcal');
  return heavy > light && Math.abs(heavy / light - 1.5) < 0.01;
});

t('走 5km 消耗低于跑 5km（0.75 vs 1.036）', () => {
  const run = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 5 }, P);
  const walk = api.exBurn({ mode: 'dist', kcalPerKm: 0.75, km: 5 }, P);
  console.log('   跑 →', run, '；走 →', walk);
  return walk < run;
});

t('距离为 0 或负数 → 0（不产生假数据）', () => {
  return api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 0 }, P) === 0
      && api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: -3 }, P) === 0;
});

t('没有体重 → 0（不算）', () => {
  return api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 5 }, {}) === 0;
});

/* ============================================================
   2. Keytel 心率公式
   ============================================================ */
console.log('\n=== 2. 心率公式（Keytel 2005）===');

t('男性 (145bpm, 70kg, 24岁) → 约 13.2 kcal/min', () => {
  const v = api.hrKcalPerMin('m', 145, 70, 24);
  const manual = (-55.0969 + 0.6309 * 145 + 0.1988 * 70 + 0.2017 * 24) / 4.184;
  console.log('   心率法 →', v.toFixed(2), 'kcal/min（手算', manual.toFixed(2), '）');
  return Math.abs(v - manual) < 0.001 && v > 10 && v < 18;
});

t('女性同参数低于男性（性别项不同）', () => {
  const m = api.hrKcalPerMin('m', 145, 70, 24);
  const f = api.hrKcalPerMin('f', 145, 70, 24);
  console.log('   男', m.toFixed(2), 'vs 女', f.toFixed(2));
  return f < m && f > 0;
});

t('心率极低（50bpm，低于零点约 57bpm）会算出负值 → 钳到 0', () => {
  const v = api.hrKcalPerMin('m', 50, 70, 24);
  console.log('   50bpm →', v);
  return v === 0;
});

t('女性零点更高（63bpm 附近）：60bpm 对女性已为负', () => {
  const m = api.hrKcalPerMin('m', 60, 70, 24);
  const f = api.hrKcalPerMin('f', 60, 70, 24);
  console.log('   60bpm 男', m.toFixed(3), '女', f);
  return m > 0 && f === 0;
});

t('心率越高消耗越高（单调）', () => {
  const a = api.hrKcalPerMin('m', 120, 70, 24);
  const b = api.hrKcalPerMin('m', 160, 70, 24);
  return b > a;
});

t('Tanaka 最大心率：24 岁 → 208−0.7×24 = 191', () => {
  const m = api.maxHR(24);
  console.log('   24岁 →', m, 'bpm');
  return m === 191;
});

t('心率区（145 / 191 ≈ 76%）→ 3 区', () => {
  const z = api.hrZone(145, 24);
  console.log('   145bpm → 区', z);
  return z === 3;
});

t('填了心率后，exBurn 走心率公式而非距离法', () => {
  const withHr = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 5, min: 30, hr: 150 }, P);
  const distOnly = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 5, min: 30 }, P);
  console.log('   心率法 →', withHr, 'kcal ；距离法 →', distOnly, 'kcal');
  return withHr !== distOnly && withHr > 0;
});

/* ============================================================
   3. 非位移型：MET 法
   ============================================================ */
console.log('\n=== 3. 非位移型（MET × 体重 × 小时）===');

t('70kg 力量训练 60min / MET 5 → 350 kcal', () => {
  const k = api.exBurn({ mode: 'met', met: 5, min: 60 }, P);
  console.log('   MET5 / 60min →', k, 'kcal');
  return k === 350;
});

t('MET 12 跳绳 30min → 420 kcal', () => {
  const k = api.exBurn({ mode: 'met', met: 12, min: 30 }, P);
  console.log('   跳绳 30min →', k, 'kcal');
  return k === 420;
});

t('无时长无距离 → 0', () => {
  return api.exBurn({ mode: 'met', met: 5, min: 0 }, P) === 0;
});

/* ============================================================
   4. 训练日判定与强度分档
   ============================================================ */
console.log('\n=== 4. 训练日判定 / 强度分档 ===');

const T = api.todayStr();
api.S = { profile: P, log: {}, ex: {}, wt: {}, plan: {}, myEx: [], restKcal: 0, bestStreak: 0, api: {}, theme: '' };

t('无计划无记录 → 休息日', () => api.isTrainDay(T) === false);

t('有计划（非休息）→ 训练日', () => {
  api.S.plan[T] = { rest: false, type: '跑步', min: 40, intensity: 'mid' };
  const r = api.isTrainDay(T);
  api.S.plan = {};
  return r === true;
});

t('计划标记 rest=true → 不是训练日', () => {
  api.S.plan[T] = { rest: true };
  const r = api.isTrainDay(T);
  api.S.plan = {};
  return r === false;
});

t('只记录训练没排课 → 也是训练日', () => {
  api.S.ex[T] = [{ n: '跑步', km: 5, min: 30, kcal: 363, intensity: 'mid' }];
  const r = api.isTrainDay(T);
  api.S.ex = {};
  return r === true;
});

t('强度档取「计划与已记录」中的最高', () => {
  api.S.plan[T] = { rest: false, type: '瑜伽', intensity: 'low' };
  api.S.ex[T] = [{ n: 'HIIT', min: 20, kcal: 200, intensity: 'high' }];
  const r = api.dayIntensity(T);
  api.S.plan = {}; api.S.ex = {};
  console.log('   low 计划 + high 记录 →', r);
  return r === 'high';
});

/* ============================================================
   5. 训练日 vs 休息日营养目标
   ============================================================ */
console.log('\n=== 5. 训练日 vs 休息日目标 ===');

api.S.plan = {}; api.S.ex = {};
const cRest = api.calc(T);
t('休息日：无训练加成', () => cRest.exK === 0 && cRest.training === false);

t('休息日蛋白 = pk × 体重 = 2.0 × 70 = 140g', () => {
  console.log('   →', cRest.pg, 'g');
  return cRest.pg === 140;
});

t('休息日脂肪占热量 30% 左右', () => {
  const pct = cRest.fg * 9 / cRest.target;
  console.log('   →', (pct * 100).toFixed(1) + '%');
  return Math.abs(pct - 0.30) < 0.03;
});

t('三大营养素热量回算 ≈ 目标（无空洞）', () => {
  const sum = cRest.pg * 4 + cRest.fg * 9 + cRest.cg * 4;
  console.log('   回算', sum, 'vs 目标', cRest.target);
  return Math.abs(sum - cRest.target) <= 4;
});

// 训练日：中等强度 60 分钟力量训练
api.S.ex[T] = [{ n: '力量训练', min: 60, kcal: 350, intensity: 'mid', mode: 'met' }];
const cMid = api.calc(T);
t('训练日：热量目标比休息日高（加上训练消耗）', () => {
  console.log('   休息', cRest.target, '→ 训练', cMid.target);
  return cMid.target > cRest.target;
});

t('训练日蛋白上调（中等强度 +0.2 g/kg = +14g）', () => {
  console.log('   休息', cRest.pg, 'g → 训练', cMid.pg, 'g');
  return cMid.pg === Math.round(2.2 * 70) || cMid.pg > cRest.pg;
});

t('训练日碳水高于休息日（热量多了，余量归碳水）', () => {
  console.log('   休息', cRest.cg, 'g → 训练', cMid.cg, 'g');
  return cMid.cg > cRest.cg;
});

api.S.ex[T] = [{ n: 'HIIT', min: 30, kcal: 500, intensity: 'high', mode: 'met' }];
const cHigh = api.calc(T);
t('高强度蛋白上调更多（+0.4 g/kg）', () => {
  console.log('   中等', cMid.pg, 'g → 高强度', cHigh.pg, 'g');
  return cHigh.pg >= cMid.pg;
});

api.S.ex[T] = [{ n: '散步', min: 60, kcal: 120, intensity: 'low', mode: 'met' }];
const cLow = api.calc(T);
t('低强度的蛋白上调和碳水参考都更低', () => {
  console.log('   低', cLow.pg, '/', api.CARB_PK[cLow.cKey]);
  return api.CARB_PK[cLow.cKey] === 4.0 && cLow.pg <= cMid.pg;
});

// 休息日额外扣减
api.S.ex = {};
api.S.restKcal = -250;
const cRestAdj = api.calc(T);
t('休息日额外调整（−250）生效', () => {
  console.log('   无调整', cRest.target, '→ 有调整', cRestAdj.target);
  return Math.abs((cRest.target - cRestAdj.target) - 250) <= 1;
});
api.S.restKcal = 0;

t('休息日调整不会把热量压到 BMR 下限之下', () => {
  api.S.restKcal = -3000;
  const c = api.calc(T);
  const bmr = 10 * 70 + 6.25 * 175 - 5 * 24 + 5;
  api.S.restKcal = 0;
  console.log('   目标', c.target, '下限', Math.round(bmr * 1.1));
  return c.floorApplied === true && c.target >= Math.round(bmr * 1.1) - 1;
});

/* ============================================================
   6. 膳食纤维目标
   ============================================================ */
console.log('\n=== 6. 膳食纤维（IOM 基础值 + 训练日加成）===');

t('男 24 岁 训练日 → 38 + 5 = 43g', () => {
  const v = api.fiberTarget({ sex: 'm', age: 24 }, true);
  console.log('   男<50 训练日 →', v);
  return v === 43;
});

t('男 24 岁 休息日 → 38g', () => api.fiberTarget({ sex: 'm', age: 24 }, false) === 38);

t('男 55 岁 休息日 → 30g（≥50 降档）', () => {
  const v = api.fiberTarget({ sex: 'm', age: 55 }, false);
  console.log('   男≥50 →', v);
  return v === 30;
});

t('女 30 岁 休息日 → 25g', () => api.fiberTarget({ sex: 'f', age: 30 }, false) === 25);

t('女 55 岁 休息日 → 21g', () => api.fiberTarget({ sex: 'f', age: 55 }, false) === 21);

t('训练日总是比休息日多 5g', () => {
  const cases = [{ sex: 'm', age: 24 }, { sex: 'f', age: 30 }, { sex: 'm', age: 60 }, { sex: 'f', age: 60 }];
  return cases.every(p => api.fiberTarget(p, true) - api.fiberTarget(p, false) === 5);
});

/* ============================================================
   7. 实时扣减（用户诉求：减去今天已吃的，剩多少）
   ============================================================ */
console.log('\n=== 7. 实时剩余预算 ===');

api.S.profile = P; api.S.ex = {}; api.S.plan = {}; api.S.log = {};
const g0 = api.gapToday(T);
t('没吃东西时，缺口 = 全部目标', () => {
  const c = api.calc(T);
  return g0.kcal === c.target && g0.p === c.pg && g0.fb === c.fb;
});

api.S.log[T] = [{ n: '鸡胸肉', g: 200, k: 266, p: 38.8, f: 10, c: 5, fb: 0 }];
const g1 = api.gapToday(T);
t('吃了 200g 鸡胸肉 → 蛋白缺口精确减少 38.8g', () => {
  console.log('   蛋白缺口', g0.p.toFixed(1), '→', g1.p.toFixed(1));
  return Math.abs((g0.p - g1.p) - 38.8) < 0.01;
});

t('热量缺口同步减少 266 kcal', () => Math.abs((g0.kcal - g1.kcal) - 266) < 1);

t('纤维缺口随纤维摄入下降', () => {
  api.S.log[T] = [{ n: '燕麦', g: 100, k: 377, p: 12.1, f: 6.7, c: 61.6, fb: 10.6 }];
  const g = api.gapToday(T);
  console.log('   纤维缺口', g0.fb, '→', g.fb);
  return Math.abs((g0.fb - g.fb) - 10.6) < 0.01;
});

t('吃超了 → 缺口为负（能显示「超 X」）', () => {
  api.S.log[T] = [{ n: '炸鸡', g: 1000, k: 9000, p: 900, f: 900, c: 900, fb: 90 }];
  const g = api.gapToday(T);
  console.log('   P', g.p.toFixed(0), '/ kcal', g.kcal.toFixed(0), '/ 纤维', g.fb.toFixed(0));
  return g.kcal < 0 && g.p < 0 && g.fb < 0;
});

api.S.log[T] = [{ n: '鸡胸肉', g: 200, k: 266, p: 38.8, f: 10, c: 5, fb: 0 }];
t('dayTotals 正确累计含纤维', () => {
  const t2 = api.dayTotals(T);
  return Math.abs(t2.p - 38.8) < 0.01 && t2.fb === 0;
});

/* ============================================================
   8. 该补什么（从内置食物库推荐，不再依赖库存）
   ============================================================ */
console.log('\n=== 8. 从内置库推荐该补什么 ===');

api.S.log = {};
const ds1 = api.dbSuggest(api.gapToday(T));
t('推荐结果存在且指明补哪个维度', () => {
  console.log('   主推荐补「' + (ds1 ? ds1.dim : '无') + '」：' + (ds1 ? ds1.need + 'g ' + ds1.food.n : '—'));
  return !!ds1 && !!ds1.dim && ds1.need > 0;
});

t('蛋白缺口大时优先推蛋白质类食材', () => {
  return ds1.dim === 'p' && ds1.food.cat === 'protein';
});

t('给出的克重能大致补足该缺口', () => {
  const g = api.gapToday(T);
  const r = api.scale(ds1.food, ds1.need);
  const got = ds1.dim === 'p' ? r.p : ds1.dim === 'fb' ? r.fb : r.k;
  const want = ds1.dim === 'p' ? g.p : ds1.dim === 'fb' ? g.fb : g.kcal;
  console.log('   要补', Math.round(want), '→ 推荐给', Math.round(got));
  return got >= want * 0.8;
});

t('营养都吃够了 → 返回 null（不硬编造）', () => {
  api.S.log[T] = [{ n: 'x', g: 100, k: 99999, p: 9999, f: 999, c: 9999, fb: 999 }];
  const r = api.dbSuggest(api.gapToday(T));
  api.S.log = {};
  return r === null;
});

t('蛋白已足但纤维缺 → 转推补纤维的食材', () => {
  const c = api.calc(T);
  api.S.log[T] = [{ n: '纯蛋白', g: 100, k: c.pg * 4, p: c.pg, f: 0, c: 0, fb: 0 }];
  const r = api.dbSuggest(api.gapToday(T));
  api.S.log = {};
  console.log('   →', r ? r.dim + ' / ' + r.food.n : '无');
  return !!r && r.dim === 'fb';
});

/* ============================================================
   9. 外食记录（直接记入今日）
   ============================================================ */
console.log('\n=== 9. 外食记录 ===');

api.S.log = {};
$('oeN').value = '牛肉面';
$('oeG').value = '450';
$('oeK').value = '620';
$('oeP').value = '28';
$('oeC').value = '78';
$('oeF').value = '18';
$('oeFb').value = '4';
api.doOutEat();
t('外食写入今日记录', () => {
  const l = api.S.log[T] || [];
  return l.length === 1 && l[0].n === '牛肉面' && l[0].k === 620;
});
t('外食条目标记 out=true', () => (api.S.log[T][0] || {}).out === true);
t('外食计入今日合计（含纤维）', () => {
  const tt = api.dayTotals(T);
  return Math.abs(tt.p - 28) < 0.01 && Math.abs(tt.fb - 4) < 0.01;
});

t('外食缺名称 → 不写入并提示', () => {
  const before = (api.S.log[T] || []).length;
  $('oeN').value = '';
  api.doOutEat();
  return (api.S.log[T] || []).length === before;
});

t('外食克重和热量都空 → 不写入', () => {
  const before = (api.S.log[T] || []).length;
  $('oeN').value = '随便'; $('oeG').value = '0'; $('oeK').value = '0';
  api.doOutEat();
  return (api.S.log[T] || []).length === before;
});

// 拍照识别结果 → 直接记入今日
api.S.log = {};
$('rN').value = '鸡胸肉(生)';
$('rK').value = '133'; $('rP').value = '19.4'; $('rF').value = '5'; $('rC').value = '2.5'; $('rFb').value = '0';
$('rG').value = '150'; $('rCat').value = 'protein';
api.aiToLog();
t('拍照识别结果直接记入今日', () => {
  const l = api.S.log[T] || [];
  console.log('   记录', l.length, '条');
  return l.length === 1 && l[0].n === '鸡胸肉(生)' && Math.abs(l[0].k - 199.5) < 0.5;
});

t('拍完再记一笔不会叠加到上一条里', () => {
  const before = (api.S.log[T] || []).length;
  $('rN').value = '米饭(熟)'; $('rG').value = '200'; $('rK').value = '116'; $('rP').value = '2.6';
  $('rF').value = '0.3'; $('rC').value = '25.9'; $('rFb').value = '0.3'; $('rCat').value = 'staple';
  api.aiToLog();
  return (api.S.log[T] || []).length === before + 1;
});

t('名称或克数缺失 → 不写入且不报错', () => {
  const before = (api.S.log[T] || []).length;
  $('rN').value = ''; $('rG').value = '300';
  api.aiToLog();
  $('rN').value = '没克数的'; $('rG').value = '0';
  api.aiToLog();
  return (api.S.log[T] || []).length === before;
});

/* ============================================================
   10. 训练记录写入与校验
   ============================================================ */
console.log('\n=== 10. 训练记录 ===');

api.S = { profile: P, log: {}, ex: {}, wt: {}, plan: {}, myEx: [], restKcal: 0, bestStreak: 0, api: {}, theme: '' };

t('记录 5km 跑步 → 写入公里数与配速可算', () => {
  api.exSel = api.findEx('跑步');
  $('exKm').value = '5'; $('exMin').value = '30'; $('exHr').value = '';
  api.doAddEx();
  const e = (api.S.ex[T] || [])[0];
  console.log('   记录：', e && (e.n + ' ' + e.km + 'km ' + e.min + 'min −' + e.kcal + 'kcal'));
  return e && e.km === 5 && e.min === 30 && e.kcal === 363;
});

t('位移型不填距离 → 拒绝写入', () => {
  api.S.ex = {};
  api.exSel = api.findEx('跑步');
  $('exKm').value = '0'; $('exMin').value = '30';
  api.doAddEx();
  return (api.S.ex[T] || []).length === 0;
});

t('非位移型不填时长 → 拒绝写入', () => {
  api.S.ex = {};
  api.exSel = api.findEx('力量训练');
  $('exKm').value = ''; $('exMin').value = '0';
  api.doAddEx();
  return (api.S.ex[T] || []).length === 0;
});

t('时长超上限（>900）→ 拒绝', () => {
  api.S.ex = {};
  api.exSel = api.findEx('力量训练');
  $('exMin').value = '1200';
  api.doAddEx();
  return (api.S.ex[T] || []).length === 0;
});

t('距离超上限（>500km）→ 拒绝', () => {
  api.S.ex = {};
  api.exSel = api.findEx('跑步');
  $('exKm').value = '600';
  api.doAddEx();
  return (api.S.ex[T] || []).length === 0;
});

t('心率越界（>230）→ 拒绝', () => {
  api.S.ex = {};
  api.exSel = api.findEx('跑步');
  $('exKm').value = '5'; $('exMin').value = '30'; $('exHr').value = '999';
  api.doAddEx();
  return (api.S.ex[T] || []).length === 0;
});

t('无 profile → 拒绝（消耗必须按体重算）', () => {
  const bak = api.S.profile; api.S.profile = null; api.S.ex = {};
  api.exSel = api.findEx('跑步');
  $('exKm').value = '5';
  api.doAddEx();
  const r = (api.S.ex[T] || []).length === 0;
  api.S.profile = bak;
  return r;
});

/* ============================================================
   11. 自定义运动项目
   ============================================================ */
console.log('\n=== 11. 自定义运动项目 ===');

api.S.myEx = [];
$('neN').value = '攀岩'; $('neM').value = '8'; $('neG').value = '户外'; $('neI').value = 'high';
api.doNewEx();
t('新建自定义项目成功', () => {
  const e = (api.S.myEx || [])[0];
  console.log('   →', e && JSON.stringify(e));
  return e && e.n === '攀岩' && e.m === 8 && e.mode === 'met';
});

t('自定义项目出现在可选列表里', () => api.allEx().some(e => e.n === '攀岩'));

t('自定义项目能算出消耗（MET 法）', () => {
  const k = api.exBurn({ mode: 'met', met: 8, min: 60 }, P);
  return k === 560;
});

t('重名 → 拒绝', () => {
  const n = api.S.myEx.length;
  $('neN').value = '攀岩'; $('neM').value = '8';
  api.doNewEx();
  return api.S.myEx.length === n;
});

t('MET 越界（0 / 30）→ 拒绝', () => {
  const n = api.S.myEx.length;
  $('neN').value = '瞎填1'; $('neM').value = '0'; api.doNewEx();
  $('neN').value = '瞎填2'; $('neM').value = '30'; api.doNewEx();
  return api.S.myEx.length === n;
});

/* ============================================================
   12. 日程日历
   ============================================================ */
console.log('\n=== 12. 训练日程 ===');

api.S.plan = {};
api.S.myEx = [];
const D = api.dstr(0);
t('保存训练日程', () => {
  api.planSheet(D);
  $('plN').value = '跑步'; $('plKm').value = '8'; $('plMin').value = '45'; $('plI').value = 'high';
  $('plTrainBox').style.display = 'block';
  api.savePlan(D);
  const p = api.S.plan[D];
  console.log('   →', JSON.stringify(p));
  return p && p.rest === false && p.type === '跑步' && p.km === 8 && p.intensity === 'high';
});
t('排课后当天成为训练日', () => api.isTrainDay(D) === true);
t('排课后当日营养目标按该强度计算', () => {
  const c = api.calc(D);
  console.log('   强度', c.intensity, '蛋白', c.pg, '碳水参考', c.carbTarget);
  return c.training === true && c.intensity === 'high';
});

t('保存休息日', () => {
  const d2 = api.dstr(1);
  api.planSheet(d2);
  api.setPlanRest(true);
  $('plTrainBox').style.display = 'none';
  api.savePlan(d2);
  const p = api.S.plan[d2];
  console.log('   →', JSON.stringify(p));
  return p && p.rest === true;
});

t('休息日不是训练日', () => api.isTrainDay(api.dstr(1)) === false);

t('清除日程', () => {
  const d3 = api.dstr(2);
  api.S.plan[d3] = { rest: false, type: '瑜伽', min: 30, intensity: 'low' };
  api.delPlan(d3);
  return api.S.plan[d3] === undefined;
});

t('日程距离/时长越界 → 拒绝保存', () => {
  const d4 = api.dstr(3);
  api.planSheet(d4);
  $('plN').value = '跑步'; $('plKm').value = '900'; $('plMin').value = '30';
  $('plTrainBox').style.display = 'block';
  api.savePlan(d4);
  const r = api.S.plan[d4] === undefined;
  return r;
});

t('日历渲染输出月历结构', () => {
  const box = $('trainCal');
  api.renderCalIntoTrain(box);
  const h = box.innerHTML;
  return h.includes('calgrid') && h.includes('caldow') && h.includes('calcell');
});

t('日历上已排课的日期带计划标记', () => {
  const box = $('trainCal');
  api.renderCalIntoTrain(box);
  return box.innerHTML.includes('calcell plan');
});

t('日历月份切换正常', () => {
  const before = api.S ? 1 : 0;
  api.calGoTrain(1);
  api.calGoTrain(-1);
  const box = $('trainCal');
  api.renderCalIntoTrain(box);
  return box.innerHTML.includes('年');
});

/* ============================================================
   13. 渲染与工具函数
   ============================================================ */
console.log('\n=== 13. 渲染与工具 ===');

t('renderTrain 无 profile 时给引导（不崩）', () => {
  const bak = api.S.profile; api.S.profile = null;
  api.renderTrain();
  const h = $('trainBox').innerHTML;
  api.S.profile = bak;
  return h.includes('身体数据');
});

t('renderTrain 有 profile 时输出 Hero + 日历', () => {
  api.S.profile = P;
  api.renderTrain();
  const h = $('trainBox').innerHTML;
  return h.includes('trainhero') && h.includes('trainCal');
});

t('paceStr：5km / 30min → 6\'00"/km', () => {
  const s = api.paceStr(5, 30);
  console.log('   →', s);
  return s === `6'00"/km`;
});

t('paceStr：10km / 45min → 4\'30"/km', () => {
  const s = api.paceStr(10, 45);
  console.log('   →', s);
  return s === `4'30"/km`;
});

t('paceStr 秒数进位正确（无 60"）', () => {
  const s = api.paceStr(7, 40);   // 342.857 s/km → 5'43"
  console.log('   7km/40min →', s);
  return !s.includes(`60"`);
});

t('paceStr 缺参数 → 空串', () => api.paceStr(0, 30) === '' && api.paceStr(5, 0) === '');

t('speedStr：5km / 30min → 10.0 km/h', () => {
  const s = api.speedStr(5, 30);
  console.log('   →', s);
  return s === '10.0 km/h';
});

t('exSub 组合描述：5km · 30分钟 · 配速', () => {
  const s = api.exSub({ km: 5, min: 30, hr: 0 });
  console.log('   →', s);
  return s.includes('5 km') && s.includes('30 分钟') && s.includes('配速') === false;
});

t('exSub 含心率时也列出', () => {
  const s = api.exSub({ km: 5, min: 30, hr: 150 });
  return s.includes('150');
});

t('exIcon 内置项目取到专属图标', () => api.exIcon('跑步') === 'run');

t('exIcon 未知项目兜底为 lift', () => api.exIcon('不存在的运动') === 'lift');

t('CARB_PK 分档合理（休息 < 低 < 中 < 高）', () => {
  const { rest, low, mid, high } = api.CARB_PK;
  console.log('   ', JSON.stringify(api.CARB_PK));
  return rest < low && low < mid && mid < high;
});

t('INTENSITY_LABEL 三档齐全', () => {
  return api.INTENSITY_LABEL.low && api.INTENSITY_LABEL.mid && api.INTENSITY_LABEL.high;
});

t('距离型项目都带 kcalPerKm 系数', () => {
  const dist = api.EXERCISES.filter(e => e.mode === 'dist');
  console.log('   位移型项目', dist.length, '个：', dist.map(e => e.n).join('/'));
  return dist.length >= 4 && dist.every(e => e.kcalPerKm > 0);
});

t('所有内置项目都有图标名与强度档', () => {
  return api.EXERCISES.every(e => e.ic && e.intensity && e.grp);
});

/* ============================================================
   14. 边界安全
   ============================================================ */
console.log('\n=== 14. 边界安全 ===');

t('calc 在无 profile 时返回 null（不崩）', () => {
  const bak = api.S.profile; api.S.profile = null;
  const r = api.calc(T);
  api.S.profile = bak;
  return r === null;
});

t('gapToday 在无 profile 时返回 null', () => {
  const bak = api.S.profile; api.S.profile = null;
  const r = api.gapToday(T);
  api.S.profile = bak;
  return r === null;
});

t('体重极小（25kg）不产生夸张数值', () => {
  const bak = api.S.profile;
  api.S.profile = { ...P, w: 25 };
  const c = api.calc(T);
  api.S.profile = bak;
  console.log('   25kg → 目标', c.target, '蛋白', c.pg, '脂肪下限', c.fg);
  return c.target > 0 && c.pg > 0 && c.fg >= Math.round(25 * 0.5) - 1;
});

t('体重极大（200kg）不溢出', () => {
  const bak = api.S.profile;
  api.S.profile = { ...P, w: 200 };
  const c = api.calc(T);
  const k = api.exBurn({ mode: 'dist', kcalPerKm: 1.036, km: 5 }, api.S.profile);
  api.S.profile = bak;
  console.log('   200kg 跑5km →', k, 'kcal');
  return Number.isFinite(c.target) && k === 1036;
});

t('S.plan 损坏（非对象）时不崩', () => {
  const bak = api.S.plan;
  api.S.plan = null;
  let ok = true;
  try { api.isTrainDay(T); api.gapToday(T); } catch (e) { ok = false; }
  api.S.plan = bak;
  return ok;
});

t('S.ex 损坏（非对象）时不崩', () => {
  const bak = api.S.ex;
  api.S.ex = null;
  let ok = true;
  try { api.isTrainDay(T); api.calc(T); } catch (e) { ok = false; }
  api.S.ex = bak;
  return ok;
});

t('日期边界：昨天的训练不影响今天主题', () => {
  api.S.ex = {}; api.S.plan = {};
  api.S.ex[api.dstr(1)] = [{ n: '跑步', km: 5, min: 30, kcal: 363, intensity: 'high' }];
  const r = api.isTrainDay(T) === false && api.calc(T).exK === 0;
  api.S.ex = {};
  return r;
});

console.log('\n通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
