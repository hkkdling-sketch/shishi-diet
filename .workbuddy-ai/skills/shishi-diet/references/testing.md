# 测试套件

交付前**全部**必须通过。当前合计 **404 条断言 + 浏览器端到端**。


## 跑法

**一条命令跑全，不要手敲 glob：**

```bash
bash _build/test.sh          # 拼装 + 结构校验 + 9 个断言套件 + 元测试
bash _build/test.sh --full   # 再加浏览器端到端（脚本会自己起本地服务）
```

> 为什么不用 `node _build/edge-*.js`：那个 glob **会漏掉两个套件** ——
> `edge3.js` 不匹配 `edge-*`（没有连字符），`test-worker.mjs` 不是 `.js`。
> `test.sh` 里是显式列表，一条不漏。

想单独跑某个套件时直接指定文件，并注意断言函数名不统一
（`edge3/inv/undo/habit/train` 用 `t`，其余用 `ok`）。

## 各套件覆盖什么

| 套件 | 条数 | 覆盖 |
|---|---|---|
| `verify.py` | — | 标签配对、必需函数存在、边界保护标记、emoji 残留、括号平衡 |
| `smoke.js` | — | 最小 DOM stub 跑 `boot()` / `calc()` / 渲染全流程，捕获运行期异常 |
| `edge3.js` | 6 | 核心边界：极端减脂、高蛋白封顶、库存闭环、撤销回滚 |
| `edge-inv.js` | 35 | 库存管家：消耗预测、采购清单、缺口分析、分类推断 |
| `edge-undo.js` | 6 | 撤销回滚：精确还原、吃光重建、跨日期退款 |
| `edge-habit.js` | 28 | 习惯层：连续天数、月度统计、体重趋势斜率 |
| `edge-train.js` | 105 | 训练层：距离法/心率法/MET、训练日判定、双套目标、纤维、外食、日历 |
| `edge-install.js` | 47 | PWA 安装：安卓一键装 / iOS 降级 / 已装隐藏 / 关闭提示 |
| `edge-adapt.js` | 64 | 国标 3 字段 + 自适应 TDEE：限量目标、漏记剔除、反推数值、边界 |
| `edge-api.js` | 52 | 接口配置：服务商猜测、错误提示翻译、无 Key 模式、连接测试 |
| `edge-portion.js` | 24 | 常见份量表：数据不变式、名称匹配、克重换算、空值边界 |
| `test-worker.mjs` | 37 | 代理 Worker：CORS 预检、来源校验、模型白名单、错误透传 |
| `verify-skill.js` | — | **元测试**：技能文档里的数字与实际断言数对账；两份技能必须逐字一致 |
| `render.js` | — | 双主题截图、控制台错误、对比度、首屏可见性、选图多选、限量卡、自适应卡 |
| `render-guide.js` | — | 指南页：锚点有效性、横向溢出、FAQ 完整性 |
| `render-proxy.js` | — | 部署页：代码与 `worker.js` 逐字一致、复制按钮可用 |

## 写测试的三条纪律

**1. 期望值必须独立。** 不能把源码里的公式再抄一遍当期望值。

```js
// ✗ 同义反复：按构造必然通过，永远不可能和代码不一致
ok(c.sfLimit === Math.round(c.target * 0.10 / 9), ...);

// ✓ 独立来源：手算出来的字面量
ok(c.target === 2602, ...);   // 档案 70kg/175cm/24岁/男/1.55 → BMR 1679 × 1.55
ok(c.sfLimit === 29, ...);    // round(2602 × 10% ÷ 9) = round(28.91) = 29
```

**2. 测用户的实际动作。** 断言元素存在 ≠ 功能可用。

```js
// ✗ 只证明 input 标签在页面上
ok(page.evaluate(() => !!document.getElementById('photoLib')), ...);

// ✓ 真的把文件塞进去，验证整条路径
await page.setInputFiles('#photoLib', [a, b, c]);
// 然后断言缩略图数量、序号、删除按钮、识别按钮文案
```

**3. 边界比正常路径更重要。** 每个新函数都要有：数据不足、数据被外部改坏（`null` / 字符串 / `NaN`）、
极端值、以及「拒绝给出结果」的路径。

## 用合成数据验证算法

自适应 TDEE 是反推算法，算错会给出错误的热量目标，必须用可手算的场景验证：

```js
// 吃 2000 / 掉 1kg（跨 14 天）→ 赤字 7700/14 = 550 kcal/天 → TDEE 应为 2550
fillWeight(api, 15, 70.0, 69.0);
fillLog(api, 14, 2000);
const a = api.adaptiveTDEE();
ok(near(a.tdee, 2550, 15), `反推 TDEE ${a.tdee}（期望 ≈2550）`);
```

已覆盖的三个场景：减重（2551）、持平（2400）、增重（2726）。

## 浏览器测试的坑

- **不要用 `waitForTimeout` 猜时间**，能等条件就等条件
- **比对文本前先规范化换行符**：Windows 剪贴板会把 `\n` 变成 `\r\n`，
  直接 `===` 会得到假失败 → `s.replace(/\r\n/g, '\n')`
- **服务端口**：`render.js` 用 8777，`render-guide.js` 用 8778，`render-proxy.js` 用 8780。
  忘了起服务会报 `ERR_CONNECTION_REFUSED`，别误以为是代码坏了
