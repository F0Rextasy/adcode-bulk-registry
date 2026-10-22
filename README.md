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

**Bulk-create ADCode (Bluethenics) free-AI accounts — one verified Firebase credential each — plus a local OpenAI-compatible bridge + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-4-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

ADCode is Bluethenics' AI code editor. Its source is public (Apache-2.0: `github.com/bluethenics/adcode`), its site and API live on Cloudflare, and its **"Included AI" is free** — four models served by ADCode's own relay in front of two partner hosts (Tagflow AI, Heabsy).

There is one catch, and it is not a captcha: **the relay has no API keys at all.** It trusts a **Firebase ID token** of an ADCode account (project `adcode-idle`), so the durable credential is the account itself. Measured on the live chain: no captcha, no Turnstile, no phone, no SMS — the **only** gate is the account's e-mail verification (`requiresVerifiedAccount: true`; an anonymous sign-up is accepted by Firebase and then refused by the relay with `403 verify-account`).

This repo therefore mints **accounts**, not keys, and ships the piece a CLI or IDE needs: `src/bridge.js`, a local OpenAI-compatible endpoint that swaps the account's 1-hour ID token in for you. It is a **registry** repo — `keys.txt` holds one Firebase refresh token per verified account, and no key of any kind is ever asked for.

## 🎁 Free tier — how much you get

| What | Value |
| --- | --- |
| How to get it | one e-mail-verified **ADCode account** (Firebase) — no card, no captcha, no phone |
| Session credits | **2000** per 5-hour session |
| Weekly credits | **20000** per week |
| Included models | **4**, each at its own `creditRate` |
| Signup allowance | none — the credits are the free tier itself, refreshed per session/week |
| The unit that scales | **one account = one credential** |

The numbers above come straight from the account-free config endpoint, measured 2026-10-21:

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config
# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

The relay also enforces daily request and spending ceilings plus a per-minute limit on each account, and when a partner's own `429` lands the relay silently falls back to another included model — a "model missing" reading is usually that fallback, not an empty catalogue.

> 💡 The free tier is set by ADCode and can change. Check the live numbers at [adcode.bluethenics.com](https://adcode.bluethenics.com) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every credential in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 4 of them

The account-free config endpoint lists exactly these four; **all four answered `200` with real content** on the accounts the mint chain produced:

| Model ID | Notes | Verified |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262,144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131,072 ctx · `creditRate 0.2` | **chat-200** |

Text only: an `image_url`/`image` content part is answered `400 images-not-supported`, and the relay accepts exactly these body keys — `model`, `messages`, `tools`, `tool_choice`, `stream`, `stream_options`, `max_tokens`, `max_completion_tokens`, `reasoning_effort`. Anything else is a `400 bad-request`, which is why the bridge forwards only these and drops the rest.

## 🧪 How to use the API

Point any OpenAI client at **the bridge** (it is the piece that speaks the relay's protocol):

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

Any placeholder key is accepted — the credential the relay checks is the account's ID token, which the bridge refreshes on its own. `GET /v1/models` lists the four ids, `stream: true` passes SSE `chat.completion.chunk` frames through untouched, and if a request arrives through the bridge while the 1-hour token has died, the bridge signs in again before forwarding (measured: a deliberately stale token still answered `200`).

Going to `https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` directly is possible too, but then you own the token lifecycle and the exact body whitelist.

## 🛠 Quick start

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

One account per credential, and a credential reaches `keys.txt` **only** after the relay answered `200` with real content. The mailbox leg is called directly (temp.tf throttles by IP and is not part of the panel's trust path); everything else follows your pool when you pass one.

### 🖱️ The launcher

The launcher asks for the proxy list (optional — without one the CLI runs direct) and the count, remembers them in `launcher.config.json`, and runs the CLI — mint, verify, screen exits, settings, help, Connect to 9Router. Its wordmark is the same ASCII banner as this README.

## ✅ Verified working — every key is tested

| Check | Result |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (no auth) | **200** — 4 models, `requiresVerifiedAccount:true`, `sessionCredits 2000`, `weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`, `email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — action link lands in the mailbox in **~30–60 s** |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — the fresh token carries `email_verified:true`, which is what the relay reads |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| the other three `heabsy-*` models | **200** each (4/4 of the catalogue) |
| `stream:true` | **200** — SSE `data: {…chat.completion.chunk}` frames, then `[DONE]` |
| hold re-verification (17 minutes later, same credentials) | **200** on all four models |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — OpenAI shape, placeholder key accepted, SSE passthrough (`delta.content`) |
| bridge with a deliberately stale token | **200** — it signed in again instead of failing |
| 9Router `adcode/tagflow-code-27b` | **200** `"ok"` through the router |
| `node src/cli.js --verify-only` | re-checks every credential in `keys.txt` with a live chat call; exit 1 if any is dead |
| `node src/cli.js --screen` | tests each exit against **both** ADCode and the Firebase identity API (an exit that carries only one of them fails the mint later) |

A credential that fails its chat gate is written to `accounts.jsonl` with the refusal and **never** to `keys.txt`.

## 🧭 How it works

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| Step | Call | Notes |
| --- | --- | --- |
| mailbox | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | plus-alias on a real Microsoft mailbox, one per account; throttled per IP (429 + back-off) |
| sign-up | `POST identitytoolkit/v1/accounts:signUp?key=…` | the public web API key ships inside ADCode's desktop app |
| verify | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | the link is read out of the mailbox with `GET temp.tf/api/check`; a resend leaves two links, so every code seen is tried |
| token | `POST accounts:signInWithPassword` | the new ID token says `email_verified:true` — the relay's only requirement |
| gate | `POST /v1/ai/tagflow/chat/completions` | 200 with content (or `reasoning_content`) = keep the credential |
| serve | `node src/bridge.js` | OpenAI-compatible localhost endpoint backed by that credential |

The relay never sees an API key, so there is nothing to rotate — but a `403 verify-account` means the account lost or never spent its verification link (mint again), `401` means the 1-hour token died (the bridge renews it, `--verify-only` does the same by hand), and `403 blocked` means an administrator disabled that account (mint a new one).

## ⚙️ CLI options

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

| Env | Default | Meaning |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(unset)* | exit pool, one line per proxy — optional: without it the CLI connects directly |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(unset)* | same for the bridge (`ADCODE_PROXY` pins a single exit) |
| `ADCODE_STATE` | `credentials.json` | credential file the bridge reads |
| `ADCODE_MODEL` | `tagflow-code-27b` | model used for the live gate |

## 🛰️ Behind a proxy

**Optional — recommended at scale (per-IP limits, bans).** The tool works without a proxy too.

- **With a pool:** pass `--pool <file>` (or set `ADCODE_PROXIES`) and every panel/Firebase call goes through an exit from that list. A pool you asked for but that is missing, empty or carries no usable line is a **hard error** — the tool never quietly falls back to your own IP. The bridge takes the same flag (`node src/bridge.js --pool exits.txt`) and rotates to the next exit when one errors.
- **Without a pool:** the CLI prints `running WITHOUT a proxy (direct)` and the bridge says `direct` in its banner; nothing else changes but where the packets leave from.
- The **mailbox leg is always direct**: temp.tf throttles per IP and is not part of the panel's trust path, so routing it through a pool exit only burns addresses.
- Run `--screen` first: it tests each exit against ADCode **and** the Firebase identity API, because an exit that can reach only one of the two mints a half-account. The measured pool for this lane was a WARP-less mixed list of `http` (CONNECT) and `socks5` exits, rotated per request — the whole mint chain, the bridge and the router smoke all ran on it with no WARP in the path.

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | one **Firebase refresh token** per verified account (with a header explaining how to turn it into an ID token) — git-ignored |
| `accounts.jsonl` | the full record per attempt: e-mail, password, uid, refresh token, model, gate status, exit |
| `credentials.json` | the credential in the shape `src/bridge.js` reads (`ADCODE_STATE` overrides) |
| `proxies.txt` | your exits — git-ignored |
| `launcher.config.json` | what the launcher remembers — git-ignored |

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router. ADCode has no key to register, so the connector registers **the bridge** as the provider endpoint:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

Defaults: `--9router-base http://localhost:20128`, `--9router-password 123456`, `--9router-prefix adcode`, `--9router-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Models are served as `adcode/<model id>`, e.g. `adcode/tagflow-code-27b` — verified `200` through the router.


## 🔌 Connect to OmniRoute

[OmniRoute](https://omniroute.online) is a self-hosted, OpenAI-compatible router. ADCode has no key to register, so the connector registers **the bridge** as the provider endpoint:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-omniroute         # terminal 2 — idempotent
```

Defaults: `--omniroute-base http://localhost:20128`, `--omniroute-password 123456`, `--omniroute-prefix adcode`, `--omniroute-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Models are served as `adcode/<model id>`, e.g. `adcode/tagflow-code-27b` — verified `200` through the router.
## 🔑 What one account gets you

> There is **no API key** to hand out here — ADCode's free tier is bound to a verified Firebase account. One mint = one account = one credential.

| | |
| --- | --- |
| 🏢 Provider | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 What the provider gives | free "Included AI": **4 models**, 2000 credits per 5-hour session / 20000 per week |
| 🔑 What one credential gets you | one e-mail-verified account, all four models, served locally by the bundled bridge |
| 🌐 API shape | OpenAI-compatible **through the bridge**: `POST http://127.0.0.1:8917/v1/chat/completions` (placeholder key) |
| 🔒 Your data | only ADCode's API, the Firebase identity endpoints and the mailbox backend are contacted; credentials stay on your machine |

## 🐞 Issues

If ADCode changes its account rules, drops the relay path or starts requiring something the chain does not have (a captcha, a phone), the tool stops at that step and prints the refusal verbatim. **[Open an issue](../../issues)** with the command and the exact output.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ Account risk & how to minimise it
