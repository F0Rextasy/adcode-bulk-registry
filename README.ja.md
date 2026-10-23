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

**ADCode (Bluethenics) の無料 AI アカウントを一括作成 — それぞれ検証済みの Firebase 認証情報を 1 つずつ — さらにローカルの OpenAI 互換ブリッジ + 9Router コネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-4-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 問題報告](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

ADCode は Bluethenics の AI コードエディタです。そのソースは公開されており (Apache-2.0: `github.com/bluethenics/adcode`)、サイトと API は Cloudflare 上にあり、その **「Included AI」は無料**です — 2 つのパートナーホスト (Tagflow AI、Heabsy) の前段に立つ ADCode 自身のリレーが提供する 4 つのモデルです。

ただし落とし穴が 1 つあり、それは captcha ではありません: **リレーには API キーが一切ありません。** リレーは ADCode アカウント (プロジェクト `adcode-idle`) の **Firebase ID トークン**を信頼するため、永続的な認証情報はアカウントそのものです。実際のチェーンで計測したところ: captcha なし、Turnstile なし、電話番号なし、SMS なし — **唯一**の関門はアカウントのメール検証です (`requiresVerifiedAccount: true`。匿名サインアップは Firebase に受理された後、リレーによって `403 verify-account` で拒否されます)。

したがってこのリポジトリが発行するのはキーではなく**アカウント**であり、CLI や IDE が必要とする部分 — `src/bridge.js`、アカウントの 1 時間有効な ID トークンをあなたの代わりに差し替えるローカルの OpenAI 互換エンドポイント — を同梱しています。これは**レジストリ**リポジトリです — `keys.txt` は検証済みアカウントごとに 1 つの Firebase リフレッシュトークンを保持し、いかなる種類のキーも要求されることはありません。

## 🎁 無料枠 — どれだけ得られるか

| 項目 | 値 |
| --- | --- |
| 入手方法 | メール検証済みの **ADCode アカウント** (Firebase) 1 つ — カード不要、captcha 不要、電話番号不要 |
| セッションクレジット | 5 時間セッションあたり **2000** |
| 週間クレジット | 週あたり **20000** |
| 対象モデル | **4** つ、それぞれ独自の `creditRate` |
| サインアップ特典 | なし — クレジット自体が無料枠であり、セッション/週ごとに更新される |
| スケールする単位 | **1 アカウント = 1 認証情報** |

上記の数値はアカウント不要の config エンドポイントから直接取得したもので、2026-10-21 に計測:

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config

# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

リレーはさらに、アカウントごとに 1 日あたりのリクエスト数と支出の上限、および 1 分あたりの制限を適用し、パートナー側の `429` が発生した場合、リレーは別の対象モデルへ静かにフォールバックします — 「モデルが見つからない」という表示は通常、そのフォールバックであり、カタログが空であることを意味しません。

> 💡 無料枠は ADCode によって設定され、変更される可能性があります。最新の数値は [adcode.bluethenics.com](https://adcode.bluethenics.com) で確認してください — そしてツール自身のゲートに判断を委ねてください:

```bash
node src/cli.js --verify-only     # keys.txt のすべての認証情報が実際のチャット呼び出しで再テストされる
```

## 🤖 モデル — その 4 つすべて

アカウント不要の config エンドポイントは正確にこれら 4 つを列挙しており、**4 つすべてが実際のコンテンツとともに `200` を返しました** — 発行チェーンが生成したアカウントにおいて:

| モデル ID | 備考 | 検証済み |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262,144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131,072 ctx · `creditRate 0.2` | **chat-200** |

テキストのみ: `image_url`/`image` のコンテンツパートは `400 images-not-supported` で返され、リレーが受け付けるボディキーは正確にこれらだけです — `model`、`messages`、`tools`、`tool_choice`、`stream`、`stream_options`、`max_tokens`、`max_completion_tokens`、`reasoning_effort`。それ以外は `400 bad-request` となるため、ブリッジはこれらだけを転送し、残りは破棄します。

## 🧪 API の使い方

任意の OpenAI クライアントを**ブリッジ**に向けてください (リレーのプロトコルを話すのはこの部分です):

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

任意のプレースホルダーキーが受け付けられます — リレーがチェックする認証情報はアカウントの ID トークンであり、ブリッジがそれを自身で更新します。`GET /v1/models` は 4 つの ID を列挙し、`stream: true` は SSE の `chat.completion.chunk` フレームをそのまま通過させ、1 時間トークンが失効した状態でブリッジ経由のリクエストが到着した場合、ブリッジは転送前に再度サインインします (計測済み: 意図的に古いトークンでも `200` を返しました)。

`https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` に直接アクセスすることも可能ですが、その場合はトークンのライフサイクルと正確なボディのホワイトリストを自分で管理することになります。

## 🛠 クイックスタート

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

1 アカウントにつき 1 認証情報で、認証情報が `keys.txt` に到達するのは、リレーが実際のコンテンツとともに `200` を返した**後だけ**です。メールボックスの部分は直接呼び出されます (temp.tf は IP ごとにスロットリングし、パネルの信頼経路の一部ではないため)。それ以外は、プールを渡した場合はすべてそのプールに従います。

### 🖱️ ランチャー

ランチャーはプロキシリスト (任意 — なしの場合は CLI が直接実行) と件数を尋ね、それらを `launcher.config.json` に記憶し、CLI を実行します — mint、verify、screen exits、settings、help、Connect to 9Router。そのワードマークはこの README と同じ ASCII バナーです。

## ✅ 検証済みで動作 — すべてのキーがテスト済み

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前に実際の `chat-200` を通過しています
> (死んだキーは決して出荷されません)。ルーターのコンボもモデルレベルで同じルールに従います: エントリが
> 追加されるのは、**モデルが `chat-200` を返し、ツールを呼び出せる場合のみ**です — ツールサポートのないモデル、
> 死んだキー、死んだプロバイダーは追加されずに破棄されます。**9Router と OmniRoute** で動作します。

| チェック | 結果 |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (認証なし) | **200** — 4 モデル、`requiresVerifiedAccount:true`、`sessionCredits 2000`、`weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`、`email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — アクションリンクが **約 30〜60 秒**でメールボックスに届く |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — 新しいトークンが `email_verified:true` を持ち、それをリレーが読み取る |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| 他の 3 つの `heabsy-*` モデル | それぞれ **200** (カタログの 4/4) |
| `stream:true` | **200** — SSE `data: {…chat.completion.chunk}` フレーム、その後 `[DONE]` |
| 再検証の保持 (17 分後、同じ認証情報) | 4 モデルすべてで **200** |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — OpenAI 形式、プレースホルダーキー受理、SSE パススルー (`delta.content`) |
| 意図的に古いトークンを使ったブリッジ | **200** — 失敗せずに再度サインインした |
| 9Router `adcode/tagflow-code-27b` | ルーター経由で **200** `"ok"` |
| `node src/cli.js --verify-only` | `keys.txt` のすべての認証情報を実際のチャット呼び出しで再チェック; いずれかが死んでいれば exit 1 |
| `node src/cli.js --screen` | 各 exit を **ADCode と** Firebase identity API の**両方**に対してテスト (どちらか一方しか通らない exit は後の mint で失敗する) |

チャットゲートに失敗した認証情報は、拒否内容とともに `accounts.jsonl` に書き込まれ、`keys.txt` には**決して**書き込まれません。

## 🧭 仕組み

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| メールボックス | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | 実際の Microsoft メールボックス上の plus エイリアス、アカウントごとに 1 つ; IP ごとにスロットリング (429 + バックオフ) |
| サインアップ | `POST identitytoolkit/v1/accounts:signUp?key=…` | 公開ウェブ API キーは ADCode のデスクトップアプリ内に同梱されている |
| 検証 | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | リンクは `GET temp.tf/api/check` でメールボックスから読み取られる; 再送するとリンクが 2 つ残るため、見つかったすべてのコードが試される |
| トークン | `POST accounts:signInWithPassword` | 新しい ID トークンが `email_verified:true` を持ち、それがリレーの唯一の要件 |
| ゲート | `POST /v1/ai/tagflow/chat/completions` | コンテンツ (または `reasoning_content`) とともに 200 = 認証情報を保持 |
| 提供 | `node src/bridge.js` | その認証情報に支えられた OpenAI 互換の localhost エンドポイント |

リレーは API キーを一切見ないため、ローテーションすべきものは何もありません — ただし `403 verify-account` はアカウントが検証リンクを失ったか一度も使わなかったことを意味し (再 mint)、`401` は 1 時間トークンが失効したことを意味し (ブリッジが更新し、`--verify-only` も手動で同じことを行う)、`403 blocked` は管理者がそのアカウントを無効化したことを意味します (新しいものを mint)。

## ⚙️ CLI オプション

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

| 環境変数 | デフォルト | 意味 |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(未設定)* | exit プール、1 行につき 1 プロキシ — 任意: なしの場合は CLI が直接接続する |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(未設定)* | ブリッジ用も同様 (`ADCODE_PROXY` は単一の exit を固定する) |
| `ADCODE_STATE` | `credentials.json` | ブリッジが読み取る認証情報ファイル |
| `ADCODE_MODEL` | `tagflow-code-27b` | ライブゲートに使用されるモデル |

## 🛰️ プロキシの背後で

**任意 — 規模を拡大する場合は推奨 (IP ごとの制限、BAN)。** このツールはプロキシなしでも動作します。

- **プールあり:** `--pool <file>` を渡す (または `ADCODE_PROXIES` を設定する) と、すべてのパネル/Firebase 呼び出しがそのリストの exit を経由します。要求したプールが存在しない、空、または使用可能な行を含まない場合は**ハードエラー**です — ツールが黙って自分の IP にフォールバックすることは決してありません。ブリッジも同じフラグを受け取り (`node src/bridge.js --pool exits.txt`)、いずれかがエラーになると次の exit にローテーションします。
- **プールなし:** CLI は `running WITHOUT a proxy (direct)` と表示し、ブリッジはバナーに `direct` と表示します; パケットが出ていく場所以外に変わるものはありません。
- **メールボックスの部分は常に直接:** temp.tf は IP ごとにスロットリングし、パネルの信頼経路の一部ではないため、プールの exit 経由でルーティングしてもアドレスを消費するだけです。
- まず `--screen` を実行してください: 各 exit を ADCode **と** Firebase identity API に対してテストします。なぜなら、両方のうち片方にしか到達できない exit は半分のアカウントを mint してしまうからです。このレーンの計測済みプールは、WARP なしの `http` (CONNECT) と `socks5` exit の混在リストで、リクエストごとにローテーションされました — mint チェーン全体、ブリッジ、ルーターのスモークはすべて、パスに WARP を含めずにこれで実行されました。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | 検証済みアカウントごとに 1 つの **Firebase リフレッシュトークン** (ID トークンへの変換方法を説明するヘッダー付き) — git 管理外 |
| `accounts.jsonl` | 試行ごとの完全な記録: メール、パスワード、uid、リフレッシュトークン、モデル、ゲートステータス、exit |
| `credentials.json` | `src/bridge.js` が読み取る形式の認証情報 (`ADCODE_STATE` が上書き) |
| `proxies.txt` | あなたの exit — git 管理外 |
| `launcher.config.json` | ランチャーが記憶する内容 — git 管理外 |

## 🔌 9Router に接続する

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです。ADCode には登録すべきキーがないため、コネクタは**ブリッジ**をプロバイダーエンドポイントとして登録します:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

デフォルト: `--9router-base http://localhost:20128`、`--9router-password 123456`、`--9router-prefix adcode`、`--9router-name ADCode`、`--bridge-url http://127.0.0.1:8917/v1`。モデルは `adcode/<model id>` として提供されます (例: `adcode/tagflow-code-27b`) — ルーター経由で `200` を検証済み。

## 🔌 OmniRoute に接続する

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです。ADCode には登録すべきキーがないため、コネクタは**ブリッジ**をプロバイダーエンドポイントとして登録します:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-omniroute         # terminal 2 — idempotent
```

デフォルト: `--omniroute-base http://localhost:20128`、`--omniroute-password 123456`、`--omniroute-prefix adcode`、`--omniroute-name ADCode`、`--bridge-url http://127.0.0.1:8917/v1`。モデルは `adcode/<model id>` として提供されます (例: `adcode/tagflow-code-27b`) — ルーター経由で `200` を検証済み。
## 🔑 1 つのアカウントで得られるもの

> ここで配布すべき **API キーはありません** — ADCode の無料枠は検証済みの Firebase アカウントに紐づいています。1 回の mint = 1 アカウント = 1 認証情報。

| | |
| --- | --- |
| 🏢 プロバイダー | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 プロバイダーが提供するもの | 無料の「Included AI」: **4 モデル**、5 時間セッションあたり 2000 クレジット / 週あたり 20000 |
| 🔑 1 つの認証情報で得られるもの | メール検証済みアカウント 1 つ、4 モデルすべて、同梱のブリッジによってローカルで提供 |
| 🌐 API 形式 | **ブリッジ経由で** OpenAI 互換: `POST http://127.0.0.1:8917/v1/chat/completions` (プレースホルダーキー) |
| 🔒 あなたのデータ | 接続されるのは ADCode の API、Firebase identity エンドポイント、メールボックスバックエンドのみ; 認証情報はあなたのマシン上に留まる |

## 🐞 問題報告

ADCode がアカウント規則を変更したり、リレーパスを廃止したり、チェーンにないもの (captcha、電話) を要求し始めた場合、ツールはそのステップで停止し、拒否内容をそのまま出力します。コマンドと正確な出力を添えて **[issue を作成してください](../../issues)**。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ アカウントのリスクとその最小化方法