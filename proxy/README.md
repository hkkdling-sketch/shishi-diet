# 识食 · 拍照识别代理（可选）

> 📖 **在线版图文步骤（带「复制代码」按钮，手机上更好看）：**
> <https://hkkdling-sketch.github.io/shishi-diet/proxy/>

## 这个目录解决什么问题

识食是**零后端**的单文件应用，API Key 只能存在每台设备的浏览器里。
结果就是：**换手机、清理浏览器数据、换浏览器，都要重新填一次 Key。**

把 Key 放到一个免费的小服务里（Cloudflare Worker），客户端就完全不用配 Key ——
**部署一次，所有设备共用同一个地址，永远不用再填。**

| | 直接填 Key（默认） | 用代理（本目录） |
|---|---|---|
| 配置次数 | 每台设备一次 | **全局一次** |
| Key 存在哪 | 你的浏览器本地 | Cloudflare 服务端（加密） |
| 换设备 | 要重新填 | 什么都不用做 |
| 费用 | 免费（智谱 GLM-4V-Flash 目前免费） | 免费额度 10 万次/天 |
| 代价 | 无 | 多一个服务，不再是纯「零后端」 |

> **如果你只在手机上用一个设备，其实不用折腾这个** —— 直接填 Key，一次就好。

---

## 部署步骤（约 5 分钟，全部免费）

### 1. 拿一个 API Key

去 [bigmodel.cn](https://open.bigmodel.cn/) 注册 → 创建 API Key。
选 **GLM-4V-Flash**，目前免费。复制那串 Key 备用。

### 2. 创建 Worker

1. 打开 [dash.cloudflare.com](https://dash.cloudflare.com/) 注册/登录（免费）
2. 左侧 **Workers & Pages** → **Create** → **Create Worker**
3. 起个名字（比如 `shishi-proxy`）→ **Deploy**
4. 点 **Edit code**，把本目录 `worker.js` 的**全部内容**粘进去，覆盖原来的示例代码
5. 右上角 **Deploy**

### 3. 配置环境变量

回到 Worker 页面 → **Settings** → **Variables and Secrets**，添加三个变量：

| 变量名 | 值 | 类型 | 说明 |
|---|---|---|---|
| `API_KEY` | 你第 1 步拿到的 Key | **Secret**（加密） | 必填 |
| `ALLOW_ORIGIN` | `https://hkkdling-sketch.github.io` | Text | 只允许你的站点调用 |
| `UPSTREAM` | 留空即可 | Text | 默认智谱；换别家才需要填 |

> `ALLOW_ORIGIN` **一定要设**，否则任何人都能拿你的 Key 去用。
> 想允许所有来源就填 `*`（不建议）。
> 多个域名用英文逗号分隔。

改完变量后**重新 Deploy 一次**才生效。

### 4. 在识食里填地址

打开识食 → **拍照** 页 → 展开「识别接口设置」：

- **API 地址**：`https://shishi-proxy.你的用户名.workers.dev`
- **模型**：`glm-4v-flash`
- **API Key**：**留空**

点「保存设置」，再点「测试连接」确认通了。

之后**任何设备**打开识食，只要填一次这个地址就行（或者干脆把地址写进代码里当默认值）。

---

## 常见问题

**返回「来源不被允许」？**
`ALLOW_ORIGIN` 没设对。注意要写**完整的 origin**（含 `https://`，**不含**结尾斜杠和路径）。
正确：`https://hkkdling-sketch.github.io`
错误：`https://hkkdling-sketch.github.io/shishi-diet/`

**返回「模型不在白名单内」？**
改 `ALLOW_MODELS` 变量，或用白名单里的模型名。

**返回「Worker 还没配置 API_KEY」？**
变量名必须是 `API_KEY`（全大写），类型选 **Secret**，改完要重新 Deploy。

**想换别家模型？**
设 `UPSTREAM`，比如通义千问：
`https://dashscope.aliyuncs.com/compatible-mode/v1`
再把 `API_KEY` 换成对应的 Key、`ALLOW_MODELS` 加上 `qwen-vl-plus`。

**担心被刷？**
Cloudflare 免费版可以在 **Security → WAF → Rate limiting rules** 里加一条规则
（比如同一 IP 每分钟最多 10 次），免费额度内够用。

---

## 隐私说明（重要）

用了代理之后，**你的照片会经过这个 Worker 转发给模型厂商**。
这比「直连」多了一跳，但照片本来也是要发给模型厂商识别的，
Worker 只是转发、不落盘、不记录。

如果你对隐私有要求，**就继续用直连 + 自己填 Key** —— 那样照片只在你和模型厂商之间传输。
这是明确的取舍，不是「代理更好」。
