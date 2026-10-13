# 架构

## 文件职责

```
shishi-diet/
├── index.html          # 生成物，勿手改（由 _build/assemble.py 拼装）
├── manifest.json       # PWA 清单（含 id，满足安卓安装条件）
├── sw.js               # Service Worker，stale-while-revalidate
├── icon-192.png / icon-512.png
├── _build/             # 源文件 + 构建 + 测试
│   ├── new_app.js      #   ← 全部 JS 逻辑
│   ├── new.css         #   ← 全部样式
│   ├── new_body.html   #   ← HTML 结构
│   ├── assemble.py     #   拼装 index.html
│   ├── verify.py       #   结构校验
│   ├── push.sh         #   推送到 GitHub（走 Contents API，不用 git push）
│   └── edge-*.js / render*.js / smoke.js / test-worker.mjs
├── guide/              # 手机上手指南页
├── report/             # 改造报告页
├── research/           # 行业调研报告
└── proxy/              # 可选：拍照识别代理
    ├── worker.js       #   Cloudflare Worker 源码
    ├── index.html      #   部署图文步骤（实时读取 worker.js）
    └── README.md
```

## 数据模型（localStorage，键 `shishi_v2`）

```js
S = {
  profile: {sex:'m'|'f', age, h, w, act, adj, pk},   // pk = 蛋白 g/kg
  inv:  [{id, n, g, k, p, f, c, fb, na, sf, sg, cat}],  // 库存（每 100g 营养）
  log:  { "YYYY-MM-DD": [ {n,g,k,p,f,c,fb,na,sf,sg,iid?,b?,out?} ] },
  ex:   { "YYYY-MM-DD": [ {n, km?, min?, kcal, mode, intensity?} ] },
  wt:   { "YYYY-MM-DD": kg },
  plan: { "YYYY-MM-DD": {type,name,min,km,intensity,rest} },
  myEx: [], restKcal: 0, bestStreak: 0,
  hideInstall: false, useAdaptive: false,
  api: {base, model, key}, theme: ""
}
```

营养字段含义（全部**每 100g**）：

| 字段 | 含义 | 单位 |
|---|---|---|
| `k` | 热量 | kcal |
| `p` `f` `c` | 蛋白质 / 脂肪 / 碳水 | g |
| `fb` | 膳食纤维 | g |
| `na` | 钠 | **mg** |
| `sf` | 饱和脂肪 | g |
| `sg` | 糖（单糖+双糖） | g |

`log` 条目里存的是**已按克重换算后的绝对值**（不是每 100g）。
`b` 是扣库存时的原始快照（撤销用）。`out:true` 表示外食，不动库存。

**`norm()` 做防御性归一化** —— 字段被外部改坏（`null` / 数组 / 字符串）也不白屏。
新增状态字段时记得在 `load()` 的默认值和 `norm()` 里都补上。

## 关键函数

| 函数 | 职责 |
|---|---|
| `calc(day)` | 算 BMR / TDEE / 目标 / 宏量 / 限量上限。返回 `tdeeFormula` 与 `adaptUsed` |
| `dayTotals(day)` | 某天饮食合计（含 `na/sf/sg`） |
| `scale(o, g)` | 把每 100g 营养按克重换算 |
| `adaptiveTDEE()` | 能量守恒反推真实消耗。**刻意不调用 `calc()`**，避免相互递归 |
| `gapToday()` | 目标 − 已吃 |
| `feedSuggest()` | 从库存挑最优食材补缺口 |
| `invTotals()` | 库存剩余营养合计 |
| `weightTrend()` | 体重斜率（kg/周），**x 轴用真实天数** |
| `renderToday/renderStock/renderMe/renderTrain` | 四个主页面渲染 |
| `ic(name, size)` | 内联 SVG 图标（`ICON_PATHS`） |
| `sheet(html)` / `closeSheet()` | 底部抽屉 |

## 营养数据

`FOODS` 数组，109 条，9 个字段（`n,k,p,f,c,fb,na,sf,sg,cat`）。
分类 `cat`：`protein` / `staple` / `veg` / `fruit` / `fat` / `other`。

数值口径为《中国食物成分表》估算值。**新增条目必须满足两条不变式**
（`edge-adapt.js` 有断言守着）：

- `sf ≤ f`（饱和脂肪不能超过总脂肪）
- `sg ≤ c`（糖不能超过碳水）

> 这条不变式抓到过真实错误：牛奶(全脂) 曾写成糖 4.8 > 碳水 3.4，物理上不可能。

## 拍照识别

对接任意 **OpenAI 兼容**的 `/chat/completions`。

- 三种模式：`pack`（包装食品，按 GB 28050 提取 7 项）/ `fresh`（生鲜）/ `meal`（外食）
- 支持**一次选多张**（`MAX_PHOTOS = 6`），所有图放进**同一个 `content` 数组**一次发出去 ——
  模型在同一上下文交叉比对，比分开识别准得多
- 两个输入：`#photoCam`（带 `capture`，直接开相机）/ `#photoLib`（**不带 capture** + `multiple`，走相册）
- **`#photoLib` 绝不能带 `capture`** —— 否则又变成只能重拍。`verify.py` 有守卫
- 无 Key 模式：base 有值、key 为空时也能跑，此时**不带 `Authorization` 头**

## 可选代理

`proxy/worker.js` 是 Cloudflare Worker，把 API Key 放服务端，
客户端只填地址、Key 留空 → **所有设备永久免配置**。

Worker 里做了 `ALLOW_ORIGIN` 来源校验和 `ALLOW_MODELS` 模型白名单。
**错误响应也必须带 CORS 头** —— 否则浏览器会把 401 变成
`TypeError: Failed to fetch`，用户看到的报错和真正原因完全对不上。
