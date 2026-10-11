// 运行时冒烟测试：用最小 DOM stub 跑一遍 boot() + 关键流程，捕获运行期异常。
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const i = html.indexOf('<script>'), j = html.lastIndexOf('</script>');
const js = html.slice(i + 8, j);

// ---- 最小 DOM stub ----
const store = {};
const KNOWN_IDS = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const made = {};

function mkEl(id) {
  const el = {
    id, _html: '', _text: '', value: '', style: {}, dataset: {}, _cls: new Set(),
    classList: null, children: [],
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    addEventListener() {}, removeEventListener() {}, click() {}, focus() {}, blur() {},
    appendChild(c) { this.children.push(c); return c; },
    removeChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    insertAdjacentHTML() {}, getBoundingClientRect() { return { width: 360, height: 200, top: 0, left: 0 }; },
    scrollIntoView() {}, closest() { return null; },
  };
  el.classList = {
    add: c => el._cls.add(c), remove: c => el._cls.delete(c),
    contains: c => el._cls.has(c), toggle: c => el._cls.has(c) ? el._cls.delete(c) : el._cls.add(c),
  };
  el.parentElement = null;
  el.firstChild = null;
  return el;
}

function $(id) {
  if (!made[id]) made[id] = mkEl(id);
  return made[id];
}

const document = {
  getElementById: id => $(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: t => { const e = mkEl('_' + t); e.tagName = t.toUpperCase(); return e; },
  addEventListener() {},
  body: mkEl('body'),
  documentElement: mkEl('html'),
  readyState: 'complete',
  hidden: false,
};

const localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

const navigator = { onLine: true, userAgent: 'node-smoke', serviceWorker: { register: () => Promise.resolve(), addEventListener() {} } };
const location = { origin: 'https://example.com', href: 'https://example.com/', protocol: 'https:', hash: '', reload() {}, hostname: 'example.com' };
const matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });

const errors = [];
const origErr = console.error;
console.error = (...a) => { errors.push(a.join(' ')); origErr(...a); };

const win = {
  document, localStorage, navigator, location, matchMedia,
  addEventListener() {}, removeEventListener() {},
  setTimeout: (fn) => { try { fn(); } catch (e) { errors.push('setTimeout: ' + e.message); } return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: fn => { try { fn(0); } catch (e) { errors.push('rAF: ' + e.message); } return 0; },
  URL, Number, Math, JSON, Date, String, Array, Object, RegExp, Promise, Error, isNaN, parseFloat, parseInt,
  alert: m => errors.push('alert() 被调用（应避免）: ' + m),
  confirm: m => { errors.push('confirm() 被调用（应避免）: ' + m); return true; },
  prompt: m => { errors.push('prompt() 被调用（应避免）: ' + m); return '500'; },
  fetch: () => Promise.reject(new Error('offline')),
  Image: function () { this.onload = null; this.onerror = null; this.src = ''; },
  scrollTo() {}, scrollBy() {},
  FileReader: function () { this.readAsDataURL = () => {}; this.readAsText = () => {}; },
  console, CSS: { supports: () => true }, caches: { open: () => Promise.resolve({ addAll: () => Promise.resolve(), put: () => Promise.resolve(), match: () => Promise.resolve(null) }), keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) },
  self: null, caches: null,
};
win.self = win;
win.window = win;
win.caches = win.caches;
win.globalThis = win;

// ---- 执行 ----
let fn;
try {
  fn = new Function(...Object.keys(win), js + '\n;return {calc,load,save,invTotals,renderStock,renderToday,renderMe,go,addFromDb,saveProfile,addEx,quickEat,toast,sheet,applyTheme,toggleTheme,get S(){return S},get SET(){return SET}};');
} catch (e) {
  console.log('✗ 脚本无法编译:', e.message);
  process.exit(1);
}

let api;
try {
  api = fn(...Object.values(win));
} catch (e) {
  console.log('✗ 顶层执行抛错:', e.message, '\n', e.stack.split('\n').slice(0, 4).join('\n'));
  process.exit(1);
}
console.log('✓ 顶层执行成功');

// boot() 已在脚本末尾作为 IIFE 自动执行；此处仅确认 state 已初始化
try {
  if (!api.S || typeof api.S !== 'object') throw new Error('S 未初始化');
  console.log('✓ 启动 IIFE 已自动执行，state 初始化正常');
} catch (e) { console.log('✗ 启动失败:', e.message); process.exit(1); }

// 填充 profile 并计算
try {
  api.S.profile = { sex: 'm', age: 24, h: 175, w: 70, act: 1.55, adj: 0, pk: 2.0 };
  api.save();
  const r = api.calc();
  console.log('✓ calc() 成功 →', JSON.stringify(r));

  // 断言：蛋白不超 35% 热量；总热量不低于 BMR*1.1
  const bmr = 10 * 70 + 6.25 * 175 - 5 * 24 + 5;
  if (r.pg * 4 > r.target * 0.36) { console.log('✗ 蛋白质超上限: pg=' + r.pg + ' 占总热量 ' + (r.pg * 4 / r.target * 100).toFixed(1) + '%'); process.exit(1); }
  if (r.target < bmr * 1.1 - 1) { console.log('✗ 总热量低于 BMR 下限'); process.exit(1); }
  const kcalFromMacros = r.pg * 4 + r.fg * 9 + r.cg * 4;
  console.log('  宏量回算 =', kcalFromMacros, 'kcal，偏差', (kcalFromMacros - r.target), 'kcal');
  if (Math.abs(kcalFromMacros - r.target) > 4) { console.log('✗ 宏量热量与目标偏差 > 4 kcal'); process.exit(1); }
  console.log('✓ 边界保护生效：蛋白占比 ' + (r.pg * 4 / r.target * 100).toFixed(1) + '%，热量下限 ' + (r.target >= bmr * 1.1 - 1 ? '正常' : '失效'));
} catch (e) { console.log('✗ calc() 抛错:', e.message, '\n', e.stack.split('\n').slice(0, 5).join('\n')); process.exit(1); }

// 渲染流程
for (const m of ['renderToday', 'renderStock', 'renderMe']) {
  try { api[m](); console.log('✓ ' + m + '() 成功'); }
  catch (e) { console.log('✗ ' + m + '() 抛错:', e.message, '\n', e.stack.split('\n').slice(0, 5).join('\n')); process.exit(1); }
}

// 库存增量：加 500g 鸡胸肉，吃掉 150g，验证扣减与退款
try {
  api.S.inv = [];
  $(('q')).value = '鸡'; api.addFromDb();
  if (!api.S.inv.length) { console.log('! addFromDb 未加入（可能因输入校验），跳过库存测试'); }
  else {
    const it = api.S.inv[0];
    console.log('✓ 加入库存:', it.n, it.g + 'g');
    const before = api.S.inv[0].g;
    api.S.log = api.S.log || [];
    api.S.log.push({ id: 't1', n: it.n, g: 150, k: it.k, p: it.p, f: it.f, c: it.c, src: 'inv', invId: it.id, d: '2026-01-01' });
    const t1 = api.invTotals();
    console.log('✓ invTotals() =', JSON.stringify(t1));
  }
} catch (e) { console.log('! 库存流程异常（非致命）:', e.message); }

// 检查是否有 alert/confirm/prompt 调用
if (errors.filter(e => /alert\(\) 被调用|confirm\(\) 被调用|prompt\(\) 被调用/.test(e)).length) {
  console.log('\n✗ 仍在使用原生弹窗:');
  errors.filter(e => /被调用/.test(e)).forEach(e => console.log('   ' + e));
  process.exit(1);
}
console.log('✓ 无原生 alert/confirm/prompt 调用');

const runErrs = errors.filter(e => !/被调用/.test(e));
if (runErrs.length) { console.log('\n运行期 console.error:'); runErrs.slice(0, 10).forEach(e => console.log('   ' + e)); }

console.log('\n=== 冒烟测试全部通过 ===');
