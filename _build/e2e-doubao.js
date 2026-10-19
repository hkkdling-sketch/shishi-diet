// 跨域能力实测 —— 这是「事实校验」测试，不是功能测试。
//
// 为什么需要它：识食是纯前端应用，能不能用某家服务，取决于对方是否放行 CORS。
// 只看 OPTIONS 预检会误判（豆包就是预检回 CORS 头、实际 POST 响应一个都不带）。
// 所以这里在**真浏览器**里发真请求，用错误类型来判断：
//   HTTP 401  → 请求到了服务端，CORS 通（只是 Key 是假的）
//   Failed to fetch → 被跨域拦掉
//
// 2026-10 的结论（对照 jsdelivr 确认浏览器有网）：
//   通义   HTTP 401        可直连
//   豆包   Failed to fetch 不可直连
//   智谱   Failed to fetch 不可直连
// 服务商哪天改了策略，这个测试会失败 —— 那时要同步改界面文案。
const { chromium } = require('playwright');
const EXE = 'C:/Users/25675/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = process.env.URL || 'http://127.0.0.1:8794/index.html';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };

const CASES = [
  { name: '通义 DashScope', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen3-vl-plus', expect: 'cors-ok' },
  { name: '豆包 火山方舟', url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-seed-2-1-lite-260915', expect: 'cors-blocked' },
  { name: '智谱 bigmodel', url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4v-flash', expect: 'cors-blocked' },
];

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await (await b.newContext()).newPage();
  await p.goto(URL, { waitUntil: 'load' });

  // 先确认浏览器本身有网，否则后面的结论全是假的
  const online = await p.evaluate(async () => {
    try { return (await fetch('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/package.json')).ok; }
    catch (e) { return false; }
  });
  if (!online) {
    console.log('  ⊘ 跳过：当前浏览器没有外网，无法判断 CORS（换到有网环境再跑）');
    await b.close();
    process.exit(0);
  }
  console.log('  对照 jsdelivr：通（浏览器有网）');

  // 预设必须填对
  await p.evaluate(() => { document.getElementById('apiPreset').value = 'doubao'; applyPreset(); });
  ok((await p.inputValue('#apiBase')) === 'https://ark.cn-beijing.volces.com/api/v3', '豆包预设地址正确');
  ok(/^doubao-seed-/.test(await p.inputValue('#apiModel')), '豆包预设模型正确');

  for (const c of CASES) {
    const r = await p.evaluate(async ({ url, model }) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake-key-probe' },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }] }),
        });
        return { status: res.status };
      } catch (e) { return { error: String(e && e.message || e) }; }
    }, c);
    const label = r.error ? ('拦截 ' + r.error) : ('HTTP ' + r.status);
    console.log('  ' + c.name.padEnd(14) + ' -> ' + label);

    if (c.expect === 'cors-ok') {
      ok(!r.error && r.status > 0, c.name + ' 应能直连（拿到 HTTP 状态码，而不是 Failed to fetch）');
      ok(r.status === 401, c.name + ' 假 Key 应得 401（实际 ' + r.status + '）');
    } else {
      ok(!!r.error, c.name + ' 应被跨域拦掉（说明界面必须标注「需代理」）');
    }
  }

  await b.close();
  console.log(`通过 ${pass} / 失败 ${fail}`);
  if (fail) process.exit(1);
})();
