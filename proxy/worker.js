/**
 * 识食 · 拍照识别代理（Cloudflare Worker）
 * ============================================
 *
 * 解决的问题：识食本身没有服务器，API Key 只能存在每台设备的浏览器里，
 * 换设备就要重新填一次。把 Key 放到这个 Worker 里（服务端），
 * 客户端就完全不用配置 Key —— 所有设备共用同一个地址。
 *
 * 部署一次，以后所有设备都免配置。
 *
 * 部署步骤见同目录 README.md
 */

// 允许的模型白名单：防止有人拿你的 Key 去跑贵模型
// 豆包那几个是为了「上游换成火山方舟」时开箱可用 —— 否则换完上游会直接被 403 挡住
const DEFAULT_MODELS = [
  'glm-4v-flash', 'glm-4v',
  'qwen-vl-plus',
  'doubao-seed-2-1-lite-260915', 'doubao-seed-2-1-pro-260915',
  'gpt-4o-mini',
];

function corsHeaders(env, origin) {
  const allow = (env.ALLOW_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allow.includes('*') || allow.includes(origin);
  return {
    ok,
    headers: {
      'Access-Control-Allow-Origin': ok ? (allow.includes('*') ? '*' : origin) : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    },
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const { ok, headers } = corsHeaders(env, origin);

    // 预检请求
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    if (request.method !== 'POST') {
      return json({ error: '只接受 POST' }, 405, headers);
    }

    // 来源校验：防止别人白嫖你的 Key
    if (!ok) {
      return json({
        error: '来源不被允许',
        hint: '把本站域名加进 Worker 的 ALLOW_ORIGIN 环境变量（逗号分隔），或设为 * 允许所有来源',
      }, 403, headers);
    }

    if (!env.API_KEY) {
      return json({ error: 'Worker 还没配置 API_KEY' }, 500, headers);
    }

    // 解析请求体，做模型白名单校验
    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return json({ error: '请求体不是合法 JSON' }, 400, headers);
    }

    const allowModels = (env.ALLOW_MODELS || DEFAULT_MODELS.join(','))
      .split(',').map(s => s.trim()).filter(Boolean);
    if (payload.model && !allowModels.includes(payload.model)) {
      return json({
        error: '模型不在白名单内：' + payload.model,
        allowed: allowModels,
      }, 403, headers);
    }
    if (!payload.model) payload.model = allowModels[0];

    // 上游地址：默认智谱，可换成任何 OpenAI 兼容接口
    const upstream = (env.UPSTREAM || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/+$/, '');

    let res;
    try {
      res = await fetch(upstream + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + env.API_KEY,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      return json({ error: '连不上上游接口：' + e.message }, 502, headers);
    }

    // 把上游响应原样透传（含状态码），客户端不用做特殊处理
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
    });
  },
};
