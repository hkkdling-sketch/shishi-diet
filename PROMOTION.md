# 识食 · 推广素材包

> 定位一句话：**别的 App 记「你吃了多少」，识食算「你还剩多少、够吃几天」。**

这个包里的东西都是**公开发布型**素材——发出去让人自己找过来，
不需要私信、不需要逐个联系任何人。

---

## 0. 先想清楚：为什么是「库存」这个角度

市面上所有热量 App 都在比**食物库大小**（100 万条 vs 200 万条）。
那是军备竞赛，个人项目比不过。

识食的差异点是**记账单位不同**：

| | 主流 App | 识食 |
|---|---|---|
| 记账单位 | 一条记录 | **一份库存** |
| 核心问题 | 今天摄入了多少 | 今天摄入了多少 **＋ 存货还能撑几天** |
| 用户动作 | 搜食物 → 选份量 | 买菜时入库一次 → 之后吃多少扣多少 |
| 买菜决策 | 不参与 | **自动生成采购清单** |

这个角度好推，因为它**反常识**——「我用库存来记饮食」这句话本身就能引起好奇。

---

## 1. 一句话介绍（多语言版本，按平台选）

中文（口语）：
> 拍张照就知道吃了多少营养。但它更狠的地方是——**按库存记账**。买回来的菜入库一次，之后吃多少扣多少，它会告诉你「鸡胸肉还能吃 6 天」并自动列出该买什么。

中文（正式）：
> 识食是一个按「库存」而非「条目」记账的饮食管理 PWA。纯前端单文件、零依赖、数据只存本地。

English (casual):
> Photograph your food, get the macros. But the real trick: it tracks **your pantry**, not just your meals. Log groceries once, deduct as you eat — it tells you "chicken breast: 6 days left" and builds your shopping list.

English (formal):
> Shishi is a single-file, offline-first PWA that tracks nutrition by **pantry inventory** rather than by meal entries. BYOK AI photo recognition, zero backend, all data stays in your browser.

日本語：
> 写真を撮るだけで栄養がわかる。でも本当の違いは**在庫管理**。買った食材を一度登録すれば、食べた分だけ減っていく。「鶏むね肉はあと6日」と教えてくれて、買い物リストまで作ってくれます。

---

## 2. Product Hunt / Hacker News 发布文案

> 用户强抵触推销，所以下面这些是「发布帖」而非「推广信」——
> 发在公开板块，让感兴趣的人自己点进来。

### Product Hunt

**Tagline（60 字符内）**
```
Calorie tracking that thinks in pantry inventory, not meals
```

**Description**
```
Every calorie tracker asks the same question: "what did you eat?"
Shishi asks a better one: "what do you still have?"

The idea is simple. When you buy groceries, you log them once —
as inventory, in grams. From then on, every time you eat, you deduct.
No more searching a food database for every meal.

What that unlocks:
• "Chicken breast: 6 days left" — burn-rate prediction from your
  actual last 7 days of eating, not a generic guess
• Auto shopping list — restocks exactly to 7 days of supply
• Gap analysis — "you're 140g short on protein. 1400g of the Greek
  yogurt you already own fixes it."
• Full undo — delete a log entry and the grams go back to inventory

Honest about its limits:
• Gives NO prediction until you have 2+ days of data — I'd rather
  say "not enough data" than show you a number I made up
• 87 foods built in (Chinese Food Composition Table). AI photo
  recognition is BYOK and optional
• Single HTML file. No account, no server, no tracking. Your data
  never leaves the device.

Built it for myself because logging every meal felt like data entry.
MIT licensed.
```

### Hacker News (Show HN)

**Title**
```
Show HN: Shishi – a PWA that tracks nutrition by pantry inventory
```

**Comment (first, self-post)**
```
Author here. I built this because I got tired of the "search food →
pick portion" loop that every calorie app forces on you.

The insight: in a real kitchen, you buy 1kg of chicken at once, then
eat roughly a third of it over three days. You don't know the exact
grams and you don't want to search a database each time. So the natural
unit isn't "a meal entry" — it's "the thing sitting in your fridge."

So inventory is the ledger. You log groceries once, deduct as you cook.
The interesting part is what that makes possible:

- Burn-rate prediction. Track actual consumption over 7 days, and you
  get days-left per ingredient. Not "you have 620g" — "you have 6 days."
- Shopping list that restocks to a target, based on real burn rate.
- Gap analysis. Target says 140g protein, you've had 0. It searches
  YOUR inventory by protein density and says "eat 1400g of that yogurt."
- Deletion refunds inventory. Non-obvious: if you already ate an item
  to zero and it got removed, undo rebuilds it from a nutrition backup
  stored in the log entry.

Design decisions I'd defend:
1. Under 2 days of data → return null, show "not enough data." A
   prediction from one data point is noise, and bad predictions make
   people distrust the whole feature. Saying "I don't know" is better.
2. Protein target capped at 35% of calories. Above that there's no
   extra hypertrophy benefit and it crowds out carbs.
3. Calorie floor at BMR × 1.1. Silently letting someone set a target
   below their BMR is harmful.
4. localStorage, no account. Tradeoff: clearing browser data loses
   everything, so there's JSON export/import.

Stack: one index.html, everything inlined. No build step, no deps.
Service worker is stale-while-revalidate — my first version was
cache-first with a hardcoded version string, which meant users would
never receive updates. That bug is why I now have 75 automated
assertions across 6 test files.

Works with 智谱 GLM-4V-Flash (free, no VPN needed in mainland China),
Qwen-VL, or any OpenAI-compatible endpoint. API key stays local.

Feedback welcome, especially on the inventory model — I know a
KitchenPal-style app is a hard sell because logging groceries is
front-loaded work.
```

### Reddit

适合：`r/selfhosted`、`r/QuantifiedSelf`、`r/nutrition`（注意各版规则）
**不要**发 `r/loseit`（自推规则严格，容易封）

```
Title: I built a nutrition tracker where the pantry is the database

Most calorie apps are a food search box. I wanted the opposite: log
your groceries once, then just say "I ate some of it."

What I found interesting while building it: once inventory is the
ledger, you can answer questions the meal-entry model can't.
- Days-left per ingredient, from your real 7-day burn rate
- Auto shopping list (restock to 7 days of supply)
- "You're 140g short on protein — the yogurt you already own covers it"

Deliberately conservative on prediction: under 2 days of data it shows
"not enough data" instead of guessing. A wrong prediction is worse than
no prediction, because it teaches users to ignore the number.

Single HTML file, MIT, no account, no server. Key thing to know: data
lives in localStorage, so export a backup if you care about it.

Live: https://hkkdling-sketch.github.io/shishi-diet/
Repo: https://github.com/hkkdling-sketch/shishi-diet
```

---

## 3. 短内容（X / 小红书 / 即刻）

### X / Twitter（英文受众）

**主贴**
```
Most calorie apps: "what did you eat?"
Shishi: "what do you still have?"

Log groceries once as inventory. Deduct as you eat.
→ "chicken: 6 days left" (from your real 7-day burn rate)
→ auto shopping list
→ "you're 140g short on protein; that yogurt covers it"

Single HTML file. No account. No server.
https://hkkdling-sketch.github.io/shishi-diet/
```

**跟帖（讲设计决策，这类内容在技术受众里传播更好）**
```
The hardest part wasn't the feature, it was resisting the feature.

With <2 days of data, days-left returns null and the UI says
"not enough data."

A prediction from one data point is noise. Showing it would teach
users to distrust the number — and then the whole feature is dead.
```

**跟帖 2（讲那个只有真渲染才发现的 bug）**
```
A bug my unit tests couldn't catch:

All 40+ assertions green. Element existed. innerHTML length 635.
Page looked completely blank in the browser.

Cause: #tab-today was missing its .on class, and .tab{display:none}.

DOM stubs test structure. Only a real browser tests whether the user
can SEE anything. Now Playwright is a required test step.
```

### 小红书（中文受众，重「实用感」）

**标题候选**
- `我把饮食记录做成了「冰箱管理」，它现在会告诉我还能吃几天`
- `别的 App 记你吃了多少，这个 App 算你还剩多少`

**正文**
```
做这个东西的起因很朴素：受够了每次吃饭都要先「搜食物→选份量」。

真实的厨房不是这样的。你周末买 1kg 鸡胸肉，然后三天吃掉大概
三分之一。你不知道精确克重，也懒得每次都查食物库。

所以我换了个记账单位——不是「一条记录」，是「一份库存」。

买菜回来入库一次，之后每次吃就从库存扣。听起来只是省了一步，
但它让一些别的东西成为可能：

📦 还能吃几天
不是「还剩 620g」这种没用的信息，是「还能吃 6 天」。
按你真实的近 7 天消耗速度算的。

🛒 自动采购清单
按实际消耗速度，把要买的补到够吃 7 天。

🎯 今天差多少
目标蛋白 140g，今天吃了 0。它会翻你的库存，
按蛋白密度挑出最优解：「吃 1400g 那个希腊酸奶就补上了」。

↩️ 删记录会退回库存
吃掉 200g 后悔了？删掉记录，克重原样回到库存。
如果那东西已经被吃光移除了，撤销时会连分类信息一起重建。

——— 几个我坚持的设计 ———

① 数据不够就不给预测
记录不满 2 天，它显示「待记录」而不是硬算一个数。
从单日数据算出来的预测是噪声，给出来反而会让人不再信任这个功能。
宁可说「还不知道」。

② 没有账号，数据只在你手机里
不上传、不埋点。代价是清浏览器数据会丢，所以做了导出备份。

③ 一个 HTML 文件
下载下来双击就能用。没服务器没依赖。

📱 在线直接用（手机打开可以「添加到主屏幕」当 App）
https://hkkdling-sketch.github.io/shishi-diet/

识别食物的 AI 接口是选配的，用智谱的免费模型，国内能直连。
不配也能用，内置 87 条食物数据可以手动录。
```

---

## 4. 竞品对比（回答「为什么不用 XX」）

| | 识食 | MyFitnessPal | KitchenPal | openplate |
|---|---|---|---|---|
| 记账单位 | **库存** | 餐次条目 | 库存 | 餐次条目 |
| 消耗预测 | ✅ 按实际消耗算 | ❌ | 部分（保质期） | ❌ |
| 自动采购清单 | ✅ | ❌ | ✅ | ❌ |
| 账号 | **不需要** | 必须 | 必须 | 不需要 |
| 数据位置 | **仅本机** | 云端 | 云端 | 本机 |
| 部署 | **单文件** | SaaS | SaaS | Docker |
| 开源 | MIT | ❌ | ❌ | MIT |
| 中文食物库 | ✅ 87 条（中国食物成分表） | 一般 | ❌ | ❌ |
| 无 VPN 可用 | ✅ 智谱免费模型 | ❌ | ❌ | 部分 |

**诚实的话**：MyFitnessPal 的食物库有百万级，识食只有 87 条。
如果你需要海量包装食品数据，识食现在还不适合你。
识食赌的是：**记账模型比数据库大小更影响你能否坚持下去。**

---

## 5. 发布渠道清单（都是「公开发布」，不是私信）

按「不需要主动联系任何人」筛选：

| 渠道 | 类型 | 备注 |
|---|---|---|
| GitHub + Pages | 作品展示 | ✅ 已完成 |
| Product Hunt | 发布帖 | 需要提前几天建账号 |
| Show HN | 发布帖 | 技术受众，讲设计决策比讲功能有效 |
| Reddit r/selfhosted | 发布帖 | 自托管 PWA 是他们的偏好类型 |
| 小红书 | 内容 | 重「实用感 + 解决什么烦」，不要写功能列表 |
| 即刻 | 内容 | 技术/产品圈，适合讲踩坑 |
| V2EX 分享创造 | 发布帖 | 中文技术社区，反馈质量高 |
| 少数派 Matrix | 投稿 | 中文效率工具，稿子过得去就有流量 |

**不要做的**：私信博主求推荐、找 KOL 谈合作、进群发链接。
既不符合你的偏好，也基本没效果。

---

## 6. 一句话可复用的「钩子」

发任何地方都能用，因为它是反常识的：

> **别的 App 记你吃了多少，识食算你还剩多少。**

英文：

> **Every calorie app logs meals. This one runs your pantry.**

---

## 7. 关于「多久能见效」的实话

被动路径起量慢，这是结构性的，不是执行问题：

- 开源项目冷启动通常 **3–6 个月**才有稳定自然流量
- Product Hunt / HN 单次爆发可能带来几百访问，但**留存靠产品本身**
- SEO 要靠持续产出内容，不会一夜之间有人来

**能加速的事**：把「设计决策」写出来（比如为什么数据不够就不给预测）。
技术社区对「一个具体的、可争论的决定」反应远好于「一个新功能」。
上面第 3 节的 X 跟帖就是按这个思路写的。
