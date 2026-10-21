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

**Массовое создание бесплатных AI-аккаунтов ADCode (Bluethenics) — по одному подтверждённому учётному данным Firebase на каждый — плюс локальный OpenAI-совместимый мост + коннектор для 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-4-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

ADCode — это AI-редактор кода от Bluethenics. Его исходный код открыт (Apache-2.0: `github.com/bluethenics/adcode`), сайт и API работают на Cloudflare, а его **«Included AI» бесплатен** — четыре модели обслуживаются собственным релеем ADCode перед двумя партнёрскими хостами (Tagflow AI, Heabsy).

Есть одна загвоздка, и это не капча: **у релея вообще нет API-ключей.** Он доверяет **ID-токену Firebase** аккаунта ADCode (проект `adcode-idle`), поэтому долговечные учётные данные — это сам аккаунт. Измерено на живой цепочке: ни капчи, ни Turnstile, ни телефона, ни SMS — **единственный** барьер — подтверждение e-mail аккаунта (`requiresVerifiedAccount: true`; анонимная регистрация принимается Firebase, а затем отклоняется релеем с `403 verify-account`).

Поэтому этот репозиторий создаёт **аккаунты**, а не ключи, и поставляет то, что нужно CLI или IDE: `src/bridge.js` — локальную OpenAI-совместимую конечную точку, которая сама подставляет 1-часовой ID-токен аккаунта. Это репозиторий-**реестр** — `keys.txt` хранит по одному refresh-токену Firebase на каждый подтверждённый аккаунт, и никакой ключ любого рода никогда не запрашивается.

## 🎁 Бесплатный тариф — сколько вы получаете

| Что | Значение |
| --- | --- |
| Как получить | один подтверждённый по e-mail **аккаунт ADCode** (Firebase) — без карты, без капчи, без телефона |
| Кредиты за сессию | **2000** за 5-часовую сессию |
| Кредиты за неделю | **20000** в неделю |
| Включённые модели | **4**, каждая со своим `creditRate` |
| Надбавка за регистрацию | нет — кредиты и есть сам бесплатный тариф, обновляемый за сессию/неделю |
| Единица масштабирования | **один аккаунт = одни учётные данные** |

Приведённые выше числа взяты напрямую из конечной точки конфигурации, не требующей аккаунта, измерено 2026-10-21:

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config
# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

Релей также применяет дневные лимиты на запросы и расходы, а также поминутный лимит на каждый аккаунт, и когда приходит собственный `429` партнёра, релей молча переключается на другую включённую модель — сообщение «model missing» обычно означает именно это переключение, а не пустой каталог.

> 💡 Бесплатный тариф устанавливается ADCode и может измениться. Проверяйте актуальные числа на [adcode.bluethenics.com](https://adcode.bluethenics.com) — и пусть решает собственный барьер инструмента:

```bash
node src/cli.js --verify-only     # every credential in keys.txt is re-tested with a real chat call
```

## 🤖 Модели — все 4

Конечная точка конфигурации, не требующая аккаунта, перечисляет ровно эти четыре; **все четыре ответили `200` с реальным содержимым** на аккаунтах, созданных цепочкой:

| ID модели | Примечания | Проверено |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262,144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131,072 ctx · `creditRate 0.2` | **chat-200** |

Только текст: на часть содержимого `image_url`/`image` отвечают `400 images-not-supported`, и релей принимает ровно эти ключи тела — `model`, `messages`, `tools`, `tool_choice`, `stream`, `stream_options`, `max_tokens`, `max_completion_tokens`, `reasoning_effort`. Всё остальное — `400 bad-request`, поэтому мост пересылает только их и отбрасывает остальное.

## 🧪 Как использовать API

Направьте любой OpenAI-клиент на **мост** (именно он говорит на протоколе релея):

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

Принимается любой ключ-заглушка — учётные данные, которые проверяет релей, это ID-токен аккаунта, который мост обновляет самостоятельно. `GET /v1/models` перечисляет четыре id, `stream: true` пропускает кадры SSE `chat.completion.chunk` без изменений, а если запрос приходит через мост, когда 1-часовой токен уже умер, мост входит заново перед пересылкой (измерено: намеренно устаревший токен всё равно ответил `200`).

Обращаться напрямую к `https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` тоже возможно, но тогда вы сами отвечаете за жизненный цикл токена и точный белый список тела запроса.

## 🛠 Быстрый старт

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

Один аккаунт на одни учётные данные, и учётные данные попадают в `keys.txt` **только** после того, как релей ответил `200` с реальным содержимым. Часть с почтовым ящиком вызывается напрямую (temp.tf ограничивает по IP и не входит в цепочку доверия панели); всё остальное следует за вашим пулом, если вы его передали.

### 🖱️ Лаунчер

Лаунчер запрашивает список прокси (необязательно — без него CLI работает напрямую) и количество, запоминает их в `launcher.config.json` и запускает CLI — создание, проверка, отсев выходов, настройки, справка, подключение к 9Router. Его логотип — тот же ASCII-баннер, что и в этом README.

## ✅ Проверено в работе — каждый ключ протестирован

| Проверка | Результат |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (без авторизации) | **200** — 4 модели, `requiresVerifiedAccount:true`, `sessionCredits 2000`, `weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`, `email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — ссылка-действие приходит в ящик за **~30–60 с** |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — свежий токен несёт `email_verified:true`, именно это читает релей |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| остальные три модели `heabsy-*` | **200** каждая (4/4 каталога) |
| `stream:true` | **200** — кадры SSE `data: {…chat.completion.chunk}`, затем `[DONE]` |
| повторная проверка через 17 минут с теми же учётными данными | **200** на всех четырёх моделях |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — форма OpenAI, ключ-заглушка принимается, сквозная передача SSE (`delta.content`) |
| мост с намеренно устаревшим токеном | **200** — он вошёл заново вместо ошибки |
| 9Router `adcode/tagflow-code-27b` | **200** `"ok"` через роутер |
| `node src/cli.js --verify-only` | перепроверяет каждые учётные данные в `keys.txt` живым вызовом чата; код выхода 1, если какие-то мертвы |
| `node src/cli.js --screen` | тестирует каждый выход против **и** ADCode, **и** API идентичности Firebase (выход, несущий только одно из них, провалит создание позже) |

Учётные данные, не прошедшие свой чат-барьер, записываются в `accounts.jsonl` с отказом и **никогда** в `keys.txt`.

## 🧭 Как это работает

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| почтовый ящик | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | plus-алиас на реальном ящике Microsoft, по одному на аккаунт; ограничение по IP (429 + откат) |
| регистрация | `POST identitytoolkit/v1/accounts:signUp?key=…` | публичный веб-API-ключ поставляется внутри десктопного приложения ADCode |
| подтверждение | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | ссылка читается из ящика через `GET temp.tf/api/check`; повторная отправка оставляет две ссылки, поэтому пробуется каждый увиденный код |
| токен | `POST accounts:signInWithPassword` | новый ID-токен говорит `email_verified:true` — единственное требование релея |
| барьер | `POST /v1/ai/tagflow/chat/completions` | 200 с содержимым (или `reasoning_content`) = сохранить учётные данные |
| обслуживание | `node src/bridge.js` | OpenAI-совместимая конечная точка на localhost, работающая на этих учётных данных |

Релей никогда не видит API-ключ, поэтому ротировать нечего — но `403 verify-account` означает, что аккаунт потерял или так и не использовал свою ссылку подтверждения (создайте заново), `401` означает, что 1-часовой токен умер (мост обновляет его, `--verify-only` делает то же вручную), а `403 blocked` означает, что администратор отключил этот аккаунт (создайте новый).

## ⚙️ Опции CLI

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

| Переменная | По умолчанию | Значение |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(не задано)* | пул выходов, по одной строке на прокси — необязательно: без него CLI подключается напрямую |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(не задано)* | то же для моста (`ADCODE_PROXY` закрепляет один выход) |
| `ADCODE_STATE` | `credentials.json` | файл учётных данных, который читает мост |
| `ADCODE_MODEL` | `tagflow-code-27b` | модель, используемая для живого барьера |

## 🛰️ За прокси

**Необязательно — рекомендуется при масштабе (лимиты на IP, блокировки).** Инструмент работает и без прокси.

- **С пулом:** передайте `--pool <file>` (или задайте `ADCODE_PROXIES`), и каждый вызов панели/Firebase пойдёт через выход из этого списка. Пул, который вы запросили, но который отсутствует, пуст или не содержит пригодной строки, — это **жёсткая ошибка** — инструмент никогда не откатывается тихо на ваш собственный IP. Мост принимает тот же флаг (`node src/bridge.js --pool exits.txt`) и переключается на следующий выход при ошибке.
- **Без пула:** CLI печатает `running WITHOUT a proxy (direct)`, а мост пишет `direct` в своём баннере; меняется только то, откуда уходят пакеты.
- **Часть с почтовым ящиком всегда напрямую**: temp.tf ограничивает по IP и не входит в цепочку доверия панели, поэтому маршрутизация через выход пула только сжигает адреса.
- Сначала запустите `--screen`: он тестирует каждый выход против ADCode **и** API идентичности Firebase, потому что выход, достигающий только одного из двух, создаёт половинчатый аккаунт. Измеренный пул для этого канала был смешанным списком без WARP из выходов `http` (CONNECT) и `socks5`, ротируемых на каждый запрос — вся цепочка создания, мост и проверка роутера работали на нём без WARP в пути.

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | по одному **refresh-токену Firebase** на каждый подтверждённый аккаунт (с заголовком, объясняющим, как превратить его в ID-токен) — игнорируется git |
| `accounts.jsonl` | полная запись по каждой попытке: e-mail, пароль, uid, refresh-токен, модель, статус барьера, выход |
| `credentials.json` | учётные данные в форме, которую читает `src/bridge.js` (`ADCODE_STATE` переопределяет) |
| `proxies.txt` | ваши выходы — игнорируется git |
| `launcher.config.json` | то, что запоминает лаунчер — игнорируется git |

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый OpenAI-совместимый роутер. У ADCode нет ключа для регистрации, поэтому коннектор регистрирует **мост** как конечную точку провайдера:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

По умолчанию: `--9router-base http://localhost:20128`, `--9router-password 123456`, `--9router-prefix adcode`, `--9router-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Модели обслуживаются как `adcode/<model id>`, например `adcode/tagflow-code-27b` — проверено `200` через роутер.

## 🔑 Что даёт один аккаунт

> Здесь **нет API-ключа**, которым можно поделиться — бесплатный тариф ADCode привязан к подтверждённому аккаунту Firebase. Одно создание = один аккаунт = одни учётные данные.

| | |
| --- | --- |
| 🏢 Провайдер | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 Что даёт провайдер | бесплатный «Included AI»: **4 модели**, 2000 кредитов за 5-часовую сессию / 20000 в неделю |
| 🔑 Что дают одни учётные данные | один подтверждённый по e-mail аккаунт, все четыре модели, обслуживаемые локально встроенным мостом |
| 🌐 Форма API | OpenAI-совместимая **через мост**: `POST http://127.0.0.1:8917/v1/chat/completions` (ключ-заглушка) |
| 🔒 Ваши данные | контакт только с API ADCode, конечными точками идентичности Firebase и бэкендом почтового ящика; учётные данные остаются на вашей машине |

## 🐞 Проблемы

Если ADCode изменит правила своих аккаунтов, уберёт путь релея или начнёт требовать то, чего нет в цепочке (капчу, телефон), инструмент остановится на этом шаге и напечатает отказ дословно. **[Откройте issue](../../issues)** с командой и точным выводом.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ Риск для аккаунта и как его минимизировать