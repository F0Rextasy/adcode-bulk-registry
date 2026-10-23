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

**ADCode(Bluethenics) 무료 AI 계정을 대량 생성합니다 — 각각 검증된 Firebase 자격 증명 하나씩 — 그리고 로컬 OpenAI 호환 브리지 + 9Router 커넥터를 제공합니다.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-4-of-them) · [🧪 API 사용법](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 왜 만들었나

ADCode는 Bluethenics의 AI 코드 에디터입니다. 소스는 공개되어 있고(Apache-2.0: `github.com/bluethenics/adcode`), 사이트와 API는 Cloudflare에서 운영되며, **"Included AI"는 무료**입니다 — 두 파트너 호스트(Tagflow AI, Heabsy) 앞에 있는 ADCode 자체 릴레이가 제공하는 네 개의 모델입니다.

문제가 하나 있는데, 캡차가 아닙니다: **릴레이에는 API 키가 전혀 없습니다.** 릴레이는 ADCode 계정(프로젝트 `adcode-idle`)의 **Firebase ID 토큰**을 신뢰하므로, 지속되는 자격 증명은 계정 자체입니다. 실제 체인에서 측정한 결과: 캡차 없음, Turnstile 없음, 전화번호 없음, SMS 없음 — **유일한** 관문은 계정의 이메일 인증입니다(`requiresVerifiedAccount: true`; 익명 가입은 Firebase가 수락한 뒤 릴레이가 `403 verify-account`로 거부합니다).

따라서 이 저장소는 키가 아니라 **계정**을 생성하며, CLI나 IDE에 필요한 조각인 `src/bridge.js`를 제공합니다 — 계정의 1시간짜리 ID 토큰을 대신 교체해 주는 로컬 OpenAI 호환 엔드포인트입니다. 이것은 **레지스트리** 저장소입니다 — `keys.txt`에는 검증된 계정마다 Firebase 리프레시 토큰 하나가 들어 있으며, 어떤 종류의 키도 요구하지 않습니다.

## 🎁 무료 티어 — 얼마나 받을 수 있나

| 항목 | 값 |
| --- | --- |
| 획득 방법 | 이메일 인증된 **ADCode 계정** 하나(Firebase) — 카드 없음, 캡차 없음, 전화번호 없음 |
| 세션 크레딧 | 5시간 세션당 **2000** |
| 주간 크레딧 | 주당 **20000** |
| 포함 모델 | **4개**, 각각 고유한 `creditRate` |
| 가입 허용량 | 없음 — 크레딧 자체가 무료 티어이며 세션/주 단위로 갱신됨 |
| 확장되는 단위 | **계정 하나 = 자격 증명 하나** |

위 수치는 인증이 필요 없는 설정 엔드포인트에서 그대로 가져온 것이며, 2026-10-21에 측정했습니다:

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config

# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

릴레이는 또한 각 계정에 일일 요청 및 지출 상한과 분당 한도를 적용하며, 파트너 측의 `429`가 발생하면 릴레이는 조용히 다른 포함 모델로 폴백합니다 — "모델 없음"으로 읽히는 것은 보통 그 폴백이지 빈 카탈로그가 아닙니다.

> 💡 무료 티어는 ADCode가 정하며 변경될 수 있습니다. 실시간 수치는 [adcode.bluethenics.com](https://adcode.bluethenics.com)에서 확인하세요 — 그리고 도구 자체의 게이트가 판단하게 하세요:

```bash
node src/cli.js --verify-only     # keys.txt의 모든 자격 증명을 실제 채팅 호출로 다시 테스트
```

## 🤖 모델 — 네 개 전부

인증이 필요 없는 설정 엔드포인트는 정확히 이 네 개를 나열하며, **네 개 모두 생성 체인이 만들어낸 계정에서 실제 콘텐츠와 함께 `200`을 응답했습니다**:

| 모델 ID | 비고 | 검증됨 |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262,144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131,072 ctx · `creditRate 0.2` | **chat-200** |

텍스트 전용입니다: `image_url`/`image` 콘텐츠 파트는 `400 images-not-supported`로 응답되며, 릴레이는 정확히 이 본문 키만 허용합니다 — `model`, `messages`, `tools`, `tool_choice`, `stream`, `stream_options`, `max_tokens`, `max_completion_tokens`, `reasoning_effort`. 그 외는 `400 bad-request`이므로, 브리지는 이것들만 전달하고 나머지는 버립니다.

## 🧪 API 사용법

아무 OpenAI 클라이언트든 **브리지**를 가리키게 하세요(릴레이의 프로토콜을 구사하는 조각입니다):

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

아무 자리 표시자 키나 허용됩니다 — 릴레이가 확인하는 자격 증명은 계정의 ID 토큰이며, 브리지가 스스로 갱신합니다. `GET /v1/models`는 네 개의 id를 나열하고, `stream: true`는 SSE `chat.completion.chunk` 프레임을 그대로 통과시키며, 1시간 토큰이 만료된 상태에서 브리지를 통해 요청이 들어오면 브리지는 전달 전에 다시 로그인합니다(측정: 의도적으로 오래된 토큰도 여전히 `200`을 응답했습니다).

`https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions`로 직접 가는 것도 가능하지만, 그러면 토큰 수명 주기와 정확한 본문 화이트리스트를 직접 관리해야 합니다.

## 🛠 빠른 시작

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

계정 하나당 자격 증명 하나이며, 자격 증명은 릴레이가 실제 콘텐츠와 함께 `200`을 응답한 **뒤에만** `keys.txt`에 도달합니다. 메일박스 구간은 직접 호출됩니다(temp.tf는 IP별로 제한하며 패널의 신뢰 경로에 속하지 않습니다); 나머지는 풀을 전달하면 풀을 따릅니다.

### 🖱️ 런처

런처는 프록시 목록(선택 사항 — 없으면 CLI는 직접 실행)과 개수를 묻고, `launcher.config.json`에 기억한 뒤 CLI를 실행합니다 — mint, verify, screen exits, settings, help, Connect to 9Router. 워드마크는 이 README와 동일한 ASCII 배너입니다.

## ✅ 검증됨 — 모든 키가 테스트됩니다

> **품질 게이트.** 여기 있는 모든 키는 `keys.txt`에 기록되기 전에 실제 `chat-200`을 통과했습니다
> (죽은 키는 절대 배포되지 않습니다). 라우터 조합도 모델 수준에서 같은 규칙을 따릅니다: 항목은
> **모델이 `chat-200`을 응답하고 도구를 호출할 수 있을 때만** 추가됩니다 — 도구 지원이 없는 모델,
> 죽은 키, 죽은 제공자는 추가되지 않고 제거됩니다. **9Router와 OmniRoute**에서 작동합니다.

| 검사 | 결과 |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (인증 없음) | **200** — 모델 4개, `requiresVerifiedAccount:true`, `sessionCredits 2000`, `weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`, `email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — 액션 링크가 **약 30–60초** 내에 메일함에 도착 |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — 새 토큰이 `email_verified:true`를 담고 있으며, 이것이 릴레이가 읽는 값 |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| 나머지 세 개의 `heabsy-*` 모델 | 각각 **200** (카탈로그 4/4) |
| `stream:true` | **200** — SSE `data: {…chat.completion.chunk}` 프레임, 그다음 `[DONE]` |
| 보류 재검증 (17분 후, 동일 자격 증명) | 네 모델 모두 **200** |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — OpenAI 형태, 자리 표시자 키 허용, SSE 패스스루(`delta.content`) |
| 의도적으로 오래된 토큰을 사용한 브리지 | **200** — 실패하는 대신 다시 로그인함 |
| 9Router `adcode/tagflow-code-27b` | 라우터를 통해 **200** `"ok"` |
| `node src/cli.js --verify-only` | `keys.txt`의 모든 자격 증명을 실제 채팅 호출로 다시 검사; 하나라도 죽었으면 종료 코드 1 |
| `node src/cli.js --screen` | 각 출구를 **ADCode와** Firebase 아이덴티티 API **양쪽**에 대해 테스트 (둘 중 하나만 통과하는 출구는 나중에 mint에 실패함) |

채팅 게이트를 통과하지 못한 자격 증명은 거부 사유와 함께 `accounts.jsonl`에 기록되며 `keys.txt`에는 **절대** 기록되지 않습니다.

## 🧭 작동 방식

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| 메일박스 | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | 실제 Microsoft 메일박스의 plus 별칭, 계정당 하나; IP별 제한(429 + 백오프) |
| 가입 | `POST identitytoolkit/v1/accounts:signUp?key=…` | 공개 웹 API 키는 ADCode 데스크톱 앱 안에 포함되어 있음 |
| 인증 | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | 링크는 `GET temp.tf/api/check`로 메일박스에서 읽음; 재전송하면 링크가 두 개 남으므로 보이는 모든 코드를 시도함 |
| 토큰 | `POST accounts:signInWithPassword` | 새 ID 토큰이 `email_verified:true`를 담고 있음 — 릴레이의 유일한 요구 사항 |
| 게이트 | `POST /v1/ai/tagflow/chat/completions` | 콘텐츠(또는 `reasoning_content`)와 함께 200 = 자격 증명 유지 |
| 서빙 | `node src/bridge.js` | 해당 자격 증명을 기반으로 하는 OpenAI 호환 로컬호스트 엔드포인트 |

릴레이는 API 키를 전혀 보지 않으므로 교체할 것이 없습니다 — 하지만 `403 verify-account`는 계정이 인증 링크를 잃었거나 사용하지 않았다는 뜻이고(다시 mint), `401`은 1시간 토큰이 만료되었다는 뜻이며(브리지가 갱신하고, `--verify-only`가 수동으로 동일하게 수행), `403 blocked`는 관리자가 해당 계정을 비활성화했다는 뜻입니다(새로 mint).

## ⚙️ CLI 옵션

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

| 환경 변수 | 기본값 | 의미 |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(미설정)* | 출구 풀, 프록시당 한 줄 — 선택 사항: 없으면 CLI는 직접 연결 |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(미설정)* | 브리지에도 동일 (`ADCODE_PROXY`는 단일 출구를 고정) |
| `ADCODE_STATE` | `credentials.json` | 브리지가 읽는 자격 증명 파일 |
| `ADCODE_MODEL` | `tagflow-code-27b` | 실제 게이트에 사용되는 모델 |

## 🛰️ 프록시 뒤에서

**선택 사항 — 대규모에서는 권장(IP별 제한, 차단).** 프록시 없이도 도구는 작동합니다.

- **풀이 있을 때:** `--pool <file>`을 전달하거나(`ADCODE_PROXIES` 설정) 모든 패널/Firebase 호출이 그 목록의 출구를 통해 나갑니다. 요청했지만 없거나, 비어 있거나, 사용할 수 있는 줄이 없는 풀은 **하드 오류**입니다 — 도구는 절대 조용히 자신의 IP로 폴백하지 않습니다. 브리지도 같은 플래그를 받으며(`node src/bridge.js --pool exits.txt`), 하나가 오류를 내면 다음 출구로 로테이션합니다.
- **풀이 없을 때:** CLI는 `running WITHOUT a proxy (direct)`를 출력하고 브리지는 배너에 `direct`를 표시합니다; 패킷이 나가는 위치 외에는 아무것도 달라지지 않습니다.
- **메일박스 구간은 항상 직접 연결입니다**: temp.tf는 IP별로 제한하며 패널의 신뢰 경로에 속하지 않으므로, 풀 출구를 통해 라우팅하면 주소만 낭비됩니다.
- 먼저 `--screen`을 실행하세요: 각 출구를 ADCode **와** Firebase 아이덴티티 API 양쪽에 대해 테스트합니다, 왜냐하면 둘 중 하나에만 도달할 수 있는 출구는 반쪽짜리 계정을 mint하기 때문입니다. 이 레인의 측정된 풀은 `http`(CONNECT)와 `socks5` 출구가 섞인 WARP 없는 목록이었고, 요청마다 로테이션되었습니다 — 전체 mint 체인, 브리지, 라우터 스모크가 모두 경로에 WARP 없이 이 위에서 실행되었습니다.

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | 검증된 계정당 **Firebase 리프레시 토큰** 하나 (ID 토큰으로 바꾸는 방법을 설명하는 헤더 포함) — git 무시됨 |
| `accounts.jsonl` | 시도당 전체 기록: 이메일, 비밀번호, uid, 리프레시 토큰, 모델, 게이트 상태, 출구 |
| `credentials.json` | `src/bridge.js`가 읽는 형태의 자격 증명 (`ADCODE_STATE`가 재정의) |
| `proxies.txt` | 사용자의 출구 — git 무시됨 |
| `launcher.config.json` | 런처가 기억하는 내용 — git 무시됨 |

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅되는 OpenAI 호환 라우터입니다. ADCode는 등록할 키가 없으므로, 커넥터는 **브리지**를 제공자 엔드포인트로 등록합니다:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

기본값: `--9router-base http://localhost:20128`, `--9router-password 123456`, `--9router-prefix adcode`, `--9router-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. 모델은 `adcode/<model id>`로 제공됩니다, 예: `adcode/tagflow-code-27b` — 라우터를 통해 `200` 검증됨.

## 🔌 OmniRoute에 연결

[OmniRoute](https://omniroute.online)는 자체 호스팅되는 OpenAI 호환 라우터입니다. ADCode는 등록할 키가 없으므로, 커넥터는 **브리지**를 제공자 엔드포인트로 등록합니다:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-omniroute         # terminal 2 — idempotent
```

기본값: `--omniroute-base http://localhost:20128`, `--omniroute-password 123456`, `--omniroute-prefix adcode`, `--omniroute-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. 모델은 `adcode/<model id>`로 제공됩니다, 예: `adcode/tagflow-code-27b` — 라우터를 통해 `200` 검증됨.
## 🔑 계정 하나로 얻는 것

> 여기에는 나눠줄 **API 키가 없습니다** — ADCode의 무료 티어는 검증된 Firebase 계정에 묶여 있습니다. mint 하나 = 계정 하나 = 자격 증명 하나.

| | |
| --- | --- |
| 🏢 제공자 | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 제공자가 주는 것 | 무료 "Included AI": **모델 4개**, 5시간 세션당 2000 크레딧 / 주당 20000 |
| 🔑 자격 증명 하나로 얻는 것 | 이메일 인증된 계정 하나, 네 모델 전부, 번들 브리지가 로컬에서 서빙 |
| 🌐 API 형태 | **브리지를 통한** OpenAI 호환: `POST http://127.0.0.1:8917/v1/chat/completions` (자리 표시자 키) |
| 🔒 데이터 | ADCode의 API, Firebase 아이덴티티 엔드포인트, 메일박스 백엔드에만 접속하며; 자격 증명은 사용자 컴퓨터에 남습니다 |

## 🐞 이슈

ADCode가 계정 규칙을 바꾸거나, 릴레이 경로를 없애거나, 체인에 없는 무언가(캡차, 전화번호)를 요구하기 시작하면 도구는 그 단계에서 멈추고 거부 메시지를 그대로 출력합니다. 명령과 정확한 출력을 포함해 **[이슈를 열어주세요](../../issues)**.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ 계정 위험 및 최소화 방법