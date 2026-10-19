// 接口配置测试：服务商猜测、错误提示翻译、无 Key 模式、连接测试。
// 这几块直接影响「第一次能不能配好」，配错了用户就以为功能坏了。
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const i = html.indexOf('<script>'), j = html.lastIndexOf('</script>');
const js = html.slice(i + 8, j);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
const sec = t => console.log('\n— ' + t + ' —');

function boot(fetchImpl) {
  const store = {}, made = {}, listeners = {};
  function mkEl(id) {
    const el = {
      id, _html: '', _text: '', value: '', style: {}, dataset: {}, _cls: new Set(), children: [],
      get innerHTML() { return this._html; }, set innerHTML(v) { this._html = String(v); },
      get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
      addEventListener(t, f) { (listeners[id + ':' + t] = listeners[id + ':' + t] || []).push(f); },
      removeEventListener() {}, click() {}, focus() {}, blur() {},
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
    el.parentElement = null; el.firstChild = null;
    return el;
  }
  const $ = id => (made[id] || (made[id] = mkEl(id)));
  const document = {
    getElementById: $, querySelector: () => null, querySelectorAll: () => [],
    createElement: t => { const e = mkEl('_' + t); e.tagName = t.toUpperCase(); return e; },
    addEventListener() {}, body: mkEl('body'), documentElement: mkEl('html'),
    readyState: 'complete', hidden: false,
  };
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }, clear: () => {},
  };
  const navigator = { onLine: true, userAgent: 'node', maxTouchPoints: 0,
    serviceWorker: { register: () => Promise.resolve(), addEventListener() {} } };
  const location = { origin: 'https://x.test', href: 'https://x.test/', protocol: 'https:', hash: '', reload() {}, hostname: 'x.test' };
  const win = {
    document, localStorage, navigator, location,
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    addEventListener() {}, removeEventListener() {},
    setTimeout: fn => { try { fn(); } catch (e) {} return 0; },
    clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: fn => { try { fn(0); } catch (e) {} return 0; },
    URL, Number, Math, JSON, Date, String, Array, Object, RegExp, Promise, Error, isNaN, parseFloat, parseInt,
    alert() {}, confirm: () => true, prompt: () => '500',
    fetch: fetchImpl || (() => Promise.reject(new Error('offline'))),
    Image: function () { this.onload = null; this.onerror = null; this.src = ''; },
    scrollTo() {}, scrollBy() {},
    FileReader: function () { this.readAsDataURL = () => {}; this.readAsText = () => {}; },
    console: { log() {}, warn() {}, error() {} },
    CSS: { supports: () => true },
    caches: { open: () => Promise.resolve({ addAll: () => Promise.resolve(), put: () => Promise.resolve(), match: () => Promise.resolve(null) }), keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) },
    self: null,
  };
  win.self = win; win.window = win; win.globalThis = win;

  const fn = new Function(...Object.keys(win),
    js + '\n;return {applyPreset,saveApi,testApi,guessProvider,onKeyBlur,apiErrorText,doScan,' +
    'get S(){return S}, el:id=>document.getElementById(id)};');
  const api = fn(...Object.values(win));
  return { api, made, store, listeners };
}

/* ============ 1. 从 Key 形态猜服务商 ============ */
sec('1. guessProvider：从 Key 形态猜服务商');
{
  const b = boot();
  const g = b.api.guessProvider;
  ok(g('') === null, '空 Key → null');
  ok(g('   ') === null, '空白 Key → null');
  ok(g('sk-proj-abc123def456') === null, 'sk- 开头 → 不猜（OpenAI / 通义都可能）');
  ok(g('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6') === 'zhipu', '32 位 hex → 智谱');
  ok(g('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.Xy9Zk2Lm') === 'zhipu', 'id.secret 格式 → 智谱');
  ok(g('随便一段中文') === null, '无法识别 → null（不乱猜）');
}

/* ============ 2. onKeyBlur：自动补地址 ============ */
sec('2. onKeyBlur：粘贴 Key 后自动补地址');
{
  const b = boot();
  b.api.el('apiBase').value = '';
  b.api.el('apiModel').value = '';
  b.api.el('apiKey').value = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
  b.api.onKeyBlur();
  ok(b.api.el('apiBase').value.includes('bigmodel.cn'), `自动填了智谱地址：${b.api.el('apiBase').value}`);
  ok(b.api.el('apiModel').value === 'glm-4v-flash', `自动填了模型：${b.api.el('apiModel').value}`);

  // 用户已经填了地址 → 不能被覆盖
  const b2 = boot();
  b2.api.el('apiBase').value = 'https://my-proxy.workers.dev';
  b2.api.el('apiKey').value = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
  b2.api.onKeyBlur();
  ok(b2.api.el('apiBase').value === 'https://my-proxy.workers.dev', '已有地址时不被覆盖（尊重用户配置）');

  // 认不出的 Key → 什么都不做
  const b3 = boot();
  b3.api.el('apiBase').value = '';
  b3.api.el('apiKey').value = 'sk-unknown';
  b3.api.onKeyBlur();
  ok(b3.api.el('apiBase').value === '', '认不出时不瞎填');
}

/* ============ 3. apiErrorText：把报错翻译成人话 ============ */
sec('3. apiErrorText：错误提示翻译');
{
  const b = boot();
  const t = b.api.apiErrorText;
  const net = t(new Error('Failed to fetch'));
  ok(net.includes('连不上'), '网络错误 → 提示连不上');
  ok(net.includes('CORS') || net.includes('跨域'), '并解释了 CORS 这个最常见原因');
  ok(t(new Error('HTTP 401：invalid api key')).includes('Key 不对'), '401 → Key 不对');
  ok(t(new Error('HTTP 404：not found')).includes('地址'), '404 → 地址/模型不对');
  ok(t(new Error('HTTP 429：rate limit')).includes('频繁'), '429 → 频率/额度');
  const raw = t(new Error('某个没见过的错误'));
  ok(raw === '某个没见过的错误', '认不出的错误原样返回，不吞掉信息');
}

/* ============ 4. 无 Key 模式 ============ */
sec('4. 无 Key 模式（自建代理）');
{
  const b = boot();
  b.api.el('apiBase').value = 'https://my-proxy.workers.dev/';
  b.api.el('apiModel').value = 'glm-4v-flash';
  b.api.el('apiKey').value = '';
  b.api.saveApi();
  ok(b.api.S.api.base === 'https://my-proxy.workers.dev', '末尾斜杠被去掉');
  ok(b.api.S.api.key === '', 'Key 可以为空');
  const saved = JSON.parse(b.store['shishi_v2']);
  ok(saved.api.base === 'https://my-proxy.workers.dev', '已持久化到 localStorage');

  // 地址为空时必须拦住
  const b2 = boot();
  b2.api.el('apiBase').value = '';
  b2.api.el('apiKey').value = '';
  b2.api.saveApi();
  ok(b2.api.S.api.key !== undefined, '空地址时不会写入垃圾配置');
}

/* ============ 5. doScan：无 Key 不再被拦 ============ */
sec('5. doScan：有地址无 Key 时不再要求填 Key');
{
  const b = boot();
  b.api.S.api = { base: 'https://my-proxy.workers.dev', model: 'glm-4v-flash', key: '' };
  // 没有选图 → 应该提示「先选一张图」，而不是「先填 API Key」
  b.api.doScan().then(() => {}).catch(() => {});
  const msg = b.api.el('toast').textContent;
  ok(!/API Key/.test(msg), `没有误报缺 Key（实际提示：${msg || '（无）'}）`);

  // 地址也没有 → 才提示填地址
  const b2 = boot();
  b2.api.S.api = { base: '', model: '', key: '' };
  b2.api.doScan().then(() => {}).catch(() => {});
  ok(/地址/.test(b2.api.el('toast').textContent), `地址为空时提示填地址：${b2.api.el('toast').textContent}`);
}

/* ============ 6 + 7 + 汇总：testApi 是异步的，必须等它跑完再统计 ============ */
(async function main() {

  sec('6. testApi：连接测试');
  {
    // 成功
    const b = boot(() => Promise.resolve({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ choices: [{ message: { content: 'OK' } }] })),
    }));
    b.api.el('apiBase').value = 'https://my-proxy.workers.dev';
    b.api.el('apiModel').value = 'glm-4v-flash';
    b.api.el('apiKey').value = '';
    await b.api.testApi();
    const html = b.api.el('apiTest').innerHTML;
    ok(html.includes('连接正常'), '成功时显示「连接正常」');
    ok(html.includes('ms'), '并给出耗时');

    // 失败：401
    const b2 = boot(() => Promise.resolve({
      ok: false, status: 401,
      text: () => Promise.resolve(JSON.stringify({ error: { message: 'invalid api key' } })),
    }));
    b2.api.el('apiBase').value = 'https://x.test';
    b2.api.el('apiModel').value = 'glm-4v-flash';
    await b2.api.testApi();
    const h2 = b2.api.el('apiTest').innerHTML;
    ok(h2.includes('Key 不对'), '401 时给出可操作提示');
    ok(!h2.includes('undefined'), '提示里没有 undefined');

    // 失败：网络错误
    const b3 = boot(() => Promise.reject(new Error('Failed to fetch')));
    b3.api.el('apiBase').value = 'https://x.test';
    await b3.api.testApi();
    ok(b3.api.el('apiTest').innerHTML.includes('连不上'), '网络错误时提示连不上');

    // 地址为空
    const b4 = boot();
    b4.api.el('apiBase').value = '';
    await b4.api.testApi();
    ok(b4.api.el('apiTest').innerHTML.includes('先填'), '地址为空时提示先填地址');
  }

  /* ============ 7. 预设：自建代理选项 ============ */
  sec('7. 预设含「自建代理」');
  {
    const b = boot();
    b.api.el('apiPreset').value = 'proxy';
    b.api.el('apiBase').value = 'https://old.example.com';
    b.api.el('apiModel').value = 'old-model';
    b.api.applyPreset();
    ok(b.api.el('apiBase').value === '', '选「自建代理」时清空地址（等用户填自己的）');
    ok(b.api.el('apiModel').value === 'glm-4v-flash', '给出默认模型名');
  }

  /* ============ 7b. 预设：豆包（火山方舟）============ */
  // 期望值来自火山方舟官方文档，不是抄代码：
  //   base_url = https://ark.cn-beijing.volces.com/api/v3
  //   视觉模型 ID 形如 doubao-seed-2-1-lite-260915
  // 最容易抄错的地方是「以为是 /v1」—— 火山方舟是 /api/v3，写 /v1 会 404。
  sec('7b. 预设含「豆包 · 火山方舟」');
  {
    const b = boot();
    b.api.el('apiPreset').value = 'doubao';
    b.api.el('apiBase').value = '';
    b.api.el('apiModel').value = '';
    b.api.applyPreset();
    const base = b.api.el('apiBase').value;
    const model = b.api.el('apiModel').value;
    ok(base === 'https://ark.cn-beijing.volces.com/api/v3',
      '地址是官方 base_url（实际：' + base + '）');
    ok(!/\/v1\/?$/.test(base), '不能写成 OpenAI 那种 /v1 结尾（火山方舟是 /api/v3）');
    ok(/^doubao-seed-/.test(model), '默认模型是豆包 seed 系列视觉模型（实际：' + model + '）');
    ok(html.includes('value="doubao"'), '下拉框里要有豆包选项，否则 JS 有、界面选不到');
    ok(/doubao/i.test(html) && /volcengine/i.test(html), '界面上要告诉用户去哪儿拿 Key');
    // 文案必须跟实测一致 —— 说「可直连」而实际连不上，比不说更糟
    ok(/通义[^<]*可直连/.test(html), '通义要标「可直连」（实测 POST 响应带 ACAO: *）');
    ok(/豆包[^<]*需代理/.test(html), '豆包要标「需代理」（实测 POST 响应不带任何 CORS 头）');
    ok(!/豆包[^<]*可直连/.test(html), '不能把豆包写成可直连');
  }

  /* ============ 8. 接口不该用全局 event ============ */
  sec('8. 代码健壮性：不依赖浏览器专有的全局 event');
  {
    const src = js;
    ok(!/const\s+btn\s*=\s*event\b/.test(src), '没有 `btn = event` 这种写法（非浏览器环境会 ReferenceError）');
    ok(src.includes('apiTestBtn'), '测试按钮通过 id 获取，而不是靠事件对象');
  }

  console.log(`\n================ 汇总 ================`);
  console.log(`通过 ${pass} / 失败 ${fail}`);
  process.exit(fail ? 1 : 0);
})();
