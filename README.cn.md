<div align="center">

```
 █████╗ ██████╗  ██████╗ ██████╗ ██████╗ ███████╗
██╔══██╗██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████║██║  ██║██║     ██║   ██║██║  ██║█████╗
██╔══██║██║  ██║██║     ██║   ██║██║  ██║██╔══╝
██║  ██║██████╔╝╚██████╗╚██████╔╝██████╔╝███████╗
╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
```

# adcode-bulk-registry

**批量创建 ADCode（Bluethenics）免费 AI 账户——每个账户一个经过验证的 Firebase 凭据——外加一个本地 OpenAI 兼容桥接器 + 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-4-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个项目

ADCode 是 Bluethenics 的 AI 代码编辑器。它的源码是公开的（Apache-2.0：`github.com/bluethenics/adcode`），其网站和 API 托管在 Cloudflare 上，而且它的 **“Included AI” 是免费的**——由 ADCode 自己的中继在两家合作主机（Tagflow AI、Heabsy）前面提供四个模型。

有一个问题，而且不是验证码：**该中继根本没有 API 密钥。** 它信任 ADCode 账户（项目 `adcode-idle`）的 **Firebase ID 令牌**，因此持久凭据就是账户本身。在真实链路上实测：没有验证码，没有 Turnstile，没有手机号，没有短信——**唯一**的门槛是账户的电子邮件验证（`requiresVerifiedAccount: true`；匿名注册会被 Firebase 接受，随后被中继以 `403 verify-account` 拒绝）。

因此本仓库铸造的是**账户**，而不是密钥，并提供 CLI 或 IDE 所需的那一块：`src/bridge.js`，一个本地 OpenAI 兼容端点，为你替换账户的 1 小时 ID 令牌。这是一个**注册表**仓库——`keys.txt` 为每个已验证账户保存一个 Firebase 刷新令牌，且从不索要任何形式的密钥。

## 🎁 免费额度——你能得到多少

| 项目 | 值 |
| --- | --- |
| 获取方式 | 一个经过电子邮件验证的 **ADCode 账户**（Firebase）——无需银行卡、无需验证码、无需手机号 |
| 会话额度 | 每 5 小时会话 **2000** |
| 每周额度 | 每周 **20000** |
| 包含的模型 | **4** 个，每个都有自己的 `creditRate` |
| 注册赠送 | 无——额度本身就是免费层，按会话/周刷新 |
| 可扩展的单位 | **一个账户 = 一个凭据** |

以上数字直接来自无需账户的配置端点，测量于 2026-10-21：

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config
# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

中继还对每个账户实施每日请求和消费上限以及每分钟限制，当合作方自己的 `429` 出现时，中继会静默回退到另一个包含的模型——“模型缺失”的读数通常就是这种回退，而不是空目录。

> 💡 免费层由 ADCode 设定，可能会变化。请查看 [adcode.bluethenics.com](https://adcode.bluethenics.com) 上的实时数字——并让工具自己的门槛来判定：

```bash
node src/cli.js --verify-only     # every credential in keys.txt is re-tested with a real chat call
```

## 🤖 模型——全部 4 个

无需账户的配置端点恰好列出这四个；**在铸造链路生成的账户上，四个模型都以真实内容返回了 `200`**：

| 模型 ID | 备注 | 已验证 |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262,144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131,072 ctx · `creditRate 0.2` | **chat-200** |

仅支持文本：`image_url`/`image` 内容部分会得到 `400 images-not-supported`，并且中继只接受这些请求体键——`model`、`messages`、`tools`、`tool_choice`、`stream`、`stream_options`、`max_tokens`、`max_completion_tokens`、`reasoning_effort`。其他任何内容都是 `400 bad-request`，这就是为什么桥接器只转发这些并丢弃其余部分。

## 🧪 如何使用 API

将任何 OpenAI 客户端指向**桥接器**（它才是说中继协议的那一块）：

```bash
node src/bridge.js --port 8917          # reads credentials.json
# then, in another shell:
curl http://127.0.0.1:8917/v1/chat/completions \
  -H "Authorization: Bearer bridge" \
  -H "Content-Type: application/json" \
  -d '{"model":"tagflow-code-27b","messages":[{"role":"user","content":"hi"}],"max_tokens":64}'
```

```python
from openai import OpenAI
c = OpenAI(base_url="http://127.0.0.1:8917/v1", api_key="bridge")
print(c.chat.completions.create(model="tagflow-code-27b",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

任何占位密钥都会被接受——中继检查的凭据是账户的 ID 令牌，桥接器会自行刷新它。`GET /v1/models` 列出这四个 id，`stream: true` 会原样透传 SSE `chat.completion.chunk` 帧，并且如果请求通过桥接器到达时 1 小时令牌已失效，桥接器会在转发前重新登录（实测：故意过期的令牌仍然返回 `200`）。

直接访问 `https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` 也是可以的，但那样你就得自己负责令牌生命周期和确切的请求体白名单。

## 🛠 快速开始

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

一个账户一个凭据，并且凭据只有在继电器以真实内容返回 `200` 后才会进入 `keys.txt`。邮箱环节是直接调用的（temp.tf 按 IP 限流，且不属于面板的信任路径）；当你传入代理池时，其他一切都遵循你的代理池。

### 🖱️ 启动器

启动器会询问代理列表（可选——没有代理时 CLI 直接运行）和数量，将它们记在 `launcher.config.json` 中，并运行 CLI——铸造、验证、筛选出口、设置、帮助、连接到 9Router。它的字标与本 README 中的 ASCII 横幅相同。

## ✅ 已验证可用——每个密钥都经过测试

| 检查 | 结果 |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config`（无认证） | **200** — 4 个模型，`requiresVerifiedAccount:true`，`sessionCredits 2000`，`weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`，`email_verified:false` |
| Firebase `accounts:sendOobCode`（VERIFY_EMAIL） | **200** — 操作链接在 **约 30–60 秒**内到达邮箱 |
| Firebase `accounts:update`（`oobCode`） | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — 新令牌带有 `email_verified:true`，这正是中继读取的内容 |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| 其他三个 `heabsy-*` 模型 | 每个 **200**（目录 4/4） |
| `stream:true` | **200** — SSE `data: {…chat.completion.chunk}` 帧，然后是 `[DONE]` |
| 保持后重新验证（17 分钟后，相同凭据） | 四个模型全部 **200** |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — OpenAI 格式，接受占位密钥，SSE 透传（`delta.content`） |
| 使用故意过期令牌的桥接器 | **200** — 它重新登录而不是失败 |
| 9Router `adcode/tagflow-code-27b` | 通过路由器 **200** `"ok"` |
| `node src/cli.js --verify-only` | 用实时聊天调用重新检查 `keys.txt` 中的每个凭据；如果有任何失效则退出码为 1 |
| `node src/cli.js --screen` | 针对 **ADCode 和** Firebase 身份 API **两者**测试每个出口（只携带其中之一的出口会在之后铸造失败） |

未通过聊天门槛的凭据会连同拒绝原因写入 `accounts.jsonl`，并且**绝不**写入 `keys.txt`。

## 🧭 工作原理

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| 步骤 | 调用 | 备注 |
| --- | --- | --- |
| 邮箱 | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | 在真实 Microsoft 邮箱上使用 plus 别名，每个账户一个；按 IP 限流（429 + 退避） |
| 注册 | `POST identitytoolkit/v1/accounts:signUp?key=…` | 公共 Web API 密钥随 ADCode 桌面应用一起分发 |
| 验证 | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | 链接通过 `GET temp.tf/api/check` 从邮箱中读取；重发会留下两个链接，因此会尝试看到的每个代码 |
| 令牌 | `POST accounts:signInWithPassword` | 新的 ID 令牌带有 `email_verified:true`——中继的唯一要求 |
| 门槛 | `POST /v1/ai/tagflow/chat/completions` | 200 且有内容（或 `reasoning_content`）= 保留该凭据 |
| 服务 | `node src/bridge.js` | 由该凭据支持的 OpenAI 兼容 localhost 端点 |

中继从不看到 API 密钥，因此没有什么需要轮换——但 `403 verify-account` 意味着该账户丢失或从未使用其验证链接（重新铸造），`401` 意味着 1 小时令牌已失效（桥接器会续期，`--verify-only` 手动做同样的事），而 `403 blocked` 意味着管理员禁用了该账户（铸造一个新的）。

## ⚙️ CLI 选项

```bash
node src/cli.js --count 1             # mint one account, gate it with a live chat call
node src/cli.js --count 5 --conc 2    # five accounts, two in flight
node src/cli.js --model heabsy-qwen38 # which model the gate (and the bridge) defaults to
node src/cli.js --mail-window 600     # seconds to wait for the verification link
node src/cli.js --verify-only         # re-check every credential in keys.txt (--limit N to cap)
node src/cli.js --screen              # exit pool self-test (ADCode + Firebase)
node src/cli.js --connect-9router     # register the bundled bridge on a local 9Router
node src/cli.js --help

node src/bridge.js --port 8917 [--pool exits.txt] [--model tagflow-code-27b]
```

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `ADCODE_PROXIES` | *（未设置）* | 出口池，每行一个代理——可选：没有它时 CLI 直接连接 |
| `ADCODE_POOL` / `ADCODE_PROXY` | *（未设置）* | 桥接器同理（`ADCODE_PROXY` 固定单个出口） |
| `ADCODE_STATE` | `credentials.json` | 桥接器读取的凭据文件 |
| `ADCODE_MODEL` | `tagflow-code-27b` | 用于实时门槛的模型 |

## 🛰️ 在代理后面

**可选——大规模使用时推荐（按 IP 限流、封禁）。** 该工具在没有代理时也能工作。

- **有代理池时：** 传入 `--pool <file>`（或设置 `ADCODE_PROXIES`），每个面板/Firebase 调用都会通过该列表中的一个出口。你请求了代理池但它缺失、为空或不包含可用行，都是**硬错误**——该工具绝不会悄悄回退到你自己的 IP。桥接器接受相同的标志（`node src/bridge.js --pool exits.txt`），并在某个出口出错时轮换到下一个出口。
- **没有代理池时：** CLI 会打印 `running WITHOUT a proxy (direct)`，桥接器在其横幅中显示 `direct`；除了数据包离开的位置之外，其他一切不变。
- **邮箱环节始终是直接的**：temp.tf 按 IP 限流，且不属于面板的信任路径，因此通过代理池出口路由它只会浪费地址。
- 先运行 `--screen`：它会针对 ADCode **和** Firebase 身份 API 测试每个出口，因为只能到达两者之一的出口会铸造出半个账户。该通道实测的代理池是一个不含 WARP 的混合列表，包含 `http`（CONNECT）和 `socks5` 出口，按请求轮换——整个铸造链路、桥接器和路由器冒烟测试都在其上运行，路径中没有 WARP。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每个已验证账户一个 **Firebase 刷新令牌**（附有说明如何将其转换为 ID 令牌的头部）——已被 git 忽略 |
| `accounts.jsonl` | 每次尝试的完整记录：电子邮件、密码、uid、刷新令牌、模型、门槛状态、出口 |
| `credentials.json` | `src/bridge.js` 读取的凭据格式（`ADCODE_STATE` 可覆盖） |
| `proxies.txt` | 你的出口——已被 git 忽略 |
| `launcher.config.json` | 启动器记住的内容——已被 git 忽略 |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管的、OpenAI 兼容的路由器。ADCode 没有可注册的密钥，因此连接器将**桥接器**注册为提供方端点：

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

默认值：`--9router-base http://localhost:20128`、`--9router-password 123456`、`--9router-prefix adcode`、`--9router-name ADCode`、`--bridge-url http://127.0.0.1:8917/v1`。模型以 `adcode/<model id>` 形式提供，例如 `adcode/tagflow-code-27b`——通过路由器验证为 `200`。

## 🔑 一个账户能给你什么

> 这里**没有 API 密钥**可以分发——ADCode 的免费层绑定到一个经过验证的 Firebase 账户。一次铸造 = 一个账户 = 一个凭据。

| | |
| --- | --- |
| 🏢 提供方 | **ADCode**（Bluethenics）——[adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 提供方给什么 | 免费的 “Included AI”：**4 个模型**，每 5 小时会话 2000 额度 / 每周 20000 |
| 🔑 一个凭据给你什么 | 一个经过电子邮件验证的账户，全部四个模型，由捆绑的桥接器在本地提供服务 |
| 🌐 API 形式 | **通过桥接器**的 OpenAI 兼容：`POST http://127.0.0.1:8917/v1/chat/completions`（占位密钥） |
| 🔒 你的数据 | 只联系 ADCode 的 API、Firebase 身份端点和邮箱后端；凭据留在你的机器上 |

## 🐞 问题反馈

如果 ADCode 更改其账户规则、放弃中继路径，或开始要求链路所没有的东西（验证码、手机号），该工具会在该步骤停止并原样打印拒绝信息。请附上命令和确切输出**[提交 issue](../../issues)**。

## 📄 许可证

MIT © 2026 — 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ 账户风险及如何将其最小化