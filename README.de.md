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

**Massenhaftes Erstellen von ADCode (Bluethenics) Free-AI-Konten — je ein verifizierter Firebase-Zugang — plus eine lokale OpenAI-kompatible Bridge + 9Router-Konnektor.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Free-Tarif](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-4-of-them) · [🧪 API verwenden](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 Funktionsweise](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

ADCode ist der KI-Code-Editor von Bluethenics. Der Quellcode ist öffentlich (Apache-2.0: `github.com/bluethenics/adcode`), Website und API laufen auf Cloudflare, und das **„Included AI" ist kostenlos** — vier Modelle, bereitgestellt vom eigenen Relay von ADCode vor zwei Partner-Hosts (Tagflow AI, Heabsy).

Es gibt einen Haken, und es ist kein Captcha: **das Relay hat überhaupt keine API-Schlüssel.** Es vertraut auf ein **Firebase-ID-Token** eines ADCode-Kontos (Projekt `adcode-idle`), die dauerhafte Anmeldeinformation ist also das Konto selbst. Auf der Live-Kette gemessen: kein Captcha, kein Turnstile, kein Telefon, keine SMS — die **einzige** Hürde ist die E-Mail-Verifizierung des Kontos (`requiresVerifiedAccount: true`; eine anonyme Registrierung wird von Firebase akzeptiert und dann vom Relay mit `403 verify-account` abgelehnt).

Dieses Repo erzeugt daher **Konten**, keine Schlüssel, und liefert das Stück, das eine CLI oder IDE braucht: `src/bridge.js`, einen lokalen OpenAI-kompatiblen Endpunkt, der das 1-Stunden-ID-Token des Kontos für dich austauscht. Es ist ein **Registry**-Repo — `keys.txt` enthält ein Firebase-Refresh-Token pro verifiziertem Konto, und es wird nie ein Schlüssel jeglicher Art verlangt.

## 🎁 Free-Tarif — wie viel du bekommst

| Was | Wert |
| --- | --- |
| Wie du es bekommst | ein per E-Mail verifiziertes **ADCode-Konto** (Firebase) — keine Karte, kein Captcha, kein Telefon |
| Sitzungs-Credits | **2000** pro 5-Stunden-Sitzung |
| Wochen-Credits | **20000** pro Woche |
| Enthaltene Modelle | **4**, jedes mit eigenem `creditRate` |
| Registrierungs-Bonus | keiner — die Credits sind der Free-Tarif selbst, pro Sitzung/Woche erneuert |
| Die Einheit, die skaliert | **ein Konto = eine Anmeldeinformation** |

Die obigen Zahlen stammen direkt vom kontofreien Config-Endpunkt, gemessen am 21.10.2026:

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config

# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

Das Relay erzwingt außerdem tägliche Anfrage- und Ausgabenobergrenzen sowie ein Pro-Minute-Limit pro Konto, und wenn ein `429` eines Partners eintrifft, wechselt das Relay still auf ein anderes enthaltenes Modell — eine „Modell fehlt"-Meldung ist meist dieser Fallback, kein leeres Katalogangebot.

> 💡 Der Free-Tarif wird von ADCode festgelegt und kann sich ändern. Prüfe die Live-Zahlen auf [adcode.bluethenics.com](https://adcode.bluethenics.com) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every credential in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 4 davon

Der kontofreie Config-Endpunkt listet genau diese vier auf; **alle vier antworteten mit `200` und echtem Inhalt** bei den Konten, die die Mint-Kette erzeugt hat:

| Modell-ID | Hinweise | Verifiziert |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262.144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131.072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131.072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131.072 ctx · `creditRate 0.2` | **chat-200** |

Nur Text: Ein `image_url`/`image`-Inhaltsteil wird mit `400 images-not-supported` beantwortet, und das Relay akzeptiert genau diese Body-Schlüssel — `model`, `messages`, `tools`, `tool_choice`, `stream`, `stream_options`, `max_tokens`, `max_completion_tokens`, `reasoning_effort`. Alles andere ist ein `400 bad-request`, weshalb die Bridge nur diese weiterleitet und den Rest verwirft.

## 🧪 So verwendest du die API

Richte jeden OpenAI-Client auf **die Bridge** (sie ist das Stück, das das Protokoll des Relays spricht):

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

Jeder Platzhalter-Schlüssel wird akzeptiert — die Anmeldeinformation, die das Relay prüft, ist das ID-Token des Kontos, das die Bridge selbst erneuert. `GET /v1/models` listet die vier IDs auf, `stream: true` leitet SSE-`chat.completion.chunk`-Frames unverändert durch, und wenn eine Anfrage über die Bridge eintrifft, während das 1-Stunden-Token abgelaufen ist, meldet sich die Bridge erneut an, bevor sie weiterleitet (gemessen: ein absichtlich veraltetes Token antwortete trotzdem mit `200`).

Der direkte Weg zu `https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` ist ebenfalls möglich, aber dann liegt der Token-Lebenszyklus und die exakte Body-Whitelist bei dir.

## 🛠 Schnellstart

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

Ein Konto pro Anmeldeinformation, und eine Anmeldeinformation erreicht `keys.txt` **nur**, nachdem das Relay mit `200` und echtem Inhalt geantwortet hat. Der Mailbox-Teil wird direkt aufgerufen (temp.tf drosselt per IP und ist nicht Teil des Vertrauenspfads des Panels); alles andere folgt deinem Pool, wenn du einen übergibst.

### 🖱️ Der Launcher

Der Launcher fragt nach der Proxy-Liste (optional — ohne eine läuft die CLI direkt) und der Anzahl, merkt sie sich in `launcher.config.json` und führt die CLI aus — mint, verify, screen exits, settings, help, Connect to 9Router. Sein Wortzeichen ist dasselbe ASCII-Banner wie diese README.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

> **Qualitätsgates.** Jeder Schlüssel hier hat ein Live-`chat-200` bestanden, bevor er in `keys.txt` geschrieben wurde
> (tote Schlüssel werden nie ausgeliefert). Router-Kombinationen folgen derselben Regel auf Modellebene: Ein Eintrag wird
> **nur hinzugefügt, wenn das Modell mit `chat-200` antwortet und Tools aufrufen kann** — ein Modell ohne Tool-Unterstützung,
> ein toter Schlüssel oder ein toter Anbieter wird verworfen statt hinzugefügt. Funktioniert mit **9Router und OmniRoute**.

| Prüfung | Ergebnis |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (keine Auth) | **200** — 4 Modelle, `requiresVerifiedAccount:true`, `sessionCredits 2000`, `weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`, `email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — Aktionslink landet in **~30–60 s** im Postfach |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — das frische Token trägt `email_verified:true`, was das Relay liest |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| die anderen drei `heabsy-*`-Modelle | **200** jeweils (4/4 des Katalogs) |
| `stream:true` | **200** — SSE-`data: {…chat.completion.chunk}`-Frames, dann `[DONE]` |
| Halte-Re-Verifizierung (17 Minuten später, gleiche Anmeldeinformationen) | **200** bei allen vier Modellen |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — OpenAI-Form, Platzhalter-Schlüssel akzeptiert, SSE-Passthrough (`delta.content`) |
| Bridge mit absichtlich veraltetem Token | **200** — sie meldete sich erneut an, statt zu scheitern |
| 9Router `adcode/tagflow-code-27b` | **200** `"ok"` durch den Router |
| `node src/cli.js --verify-only` | prüft jede Anmeldeinformation in `keys.txt` mit einem Live-Chat-Aufruf erneut; Exit 1, wenn eine tot ist |
| `node src/cli.js --screen` | testet jeden Exit gegen **sowohl** ADCode als auch die Firebase-Identity-API (ein Exit, der nur eines von beiden trägt, lässt den Mint später scheitern) |

Eine Anmeldeinformation, die ihr Chat-Gate nicht besteht, wird mit der Ablehnung in `accounts.jsonl` geschrieben und **niemals** in `keys.txt`.

## 🧭 Funktionsweise

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| Mailbox | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | Plus-Alias auf einem echten Microsoft-Postfach, eines pro Konto; pro IP gedrosselt (429 + Back-off) |
| Registrierung | `POST identitytoolkit/v1/accounts:signUp?key=…` | der öffentliche Web-API-Schlüssel ist in der Desktop-App von ADCode enthalten |
| Verifizierung | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | der Link wird mit `GET temp.tf/api/check` aus dem Postfach gelesen; ein erneutes Senden hinterlässt zwei Links, also wird jeder gesehene Code versucht |
| Token | `POST accounts:signInWithPassword` | das neue ID-Token sagt `email_verified:true` — die einzige Anforderung des Relays |
| Gate | `POST /v1/ai/tagflow/chat/completions` | 200 mit Inhalt (oder `reasoning_content`) = Anmeldeinformation behalten |
| Bereitstellen | `node src/bridge.js` | OpenAI-kompatibler localhost-Endpunkt, gestützt auf diese Anmeldeinformation |

Das Relay sieht nie einen API-Schlüssel, es gibt also nichts zu rotieren — aber ein `403 verify-account` bedeutet, dass das Konto seinen Verifizierungslink verloren hat oder nie eingelöst hat (erneut minten), `401` bedeutet, dass das 1-Stunden-Token abgelaufen ist (die Bridge erneuert es, `--verify-only` tut dasselbe von Hand), und `403 blocked` bedeutet, dass ein Administrator dieses Konto deaktiviert hat (ein neues minten).

## ⚙️ CLI-Optionen

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

| Env | Standard | Bedeutung |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(nicht gesetzt)* | Exit-Pool, eine Zeile pro Proxy — optional: ohne ihn verbindet sich die CLI direkt |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(nicht gesetzt)* | dasselbe für die Bridge (`ADCODE_PROXY` legt einen einzelnen Exit fest) |
| `ADCODE_STATE` | `credentials.json` | Anmeldeinformationsdatei, die die Bridge liest |
| `ADCODE_MODEL` | `tagflow-code-27b` | Modell, das für das Live-Gate verwendet wird |

## 🛰️ Hinter einem Proxy

**Optional — bei Skalierung empfohlen (Pro-IP-Limits, Bans).** Das Tool funktioniert auch ohne Proxy.

- **Mit einem Pool:** übergib `--pool <file>` (oder setze `ADCODE_PROXIES`), und jeder Panel-/Firebase-Aufruf geht über einen Exit aus dieser Liste. Ein Pool, den du angefordert hast, der aber fehlt, leer ist oder keine nutzbare Zeile enthält, ist ein **harter Fehler** — das Tool fällt nie still auf deine eigene IP zurück. Die Bridge nimmt dasselbe Flag (`node src/bridge.js --pool exits.txt`) und rotiert zum nächsten Exit, wenn einer einen Fehler wirft.
- **Ohne einen Pool:** die CLI gibt `running WITHOUT a proxy (direct)` aus und die Bridge sagt `direct` in ihrem Banner; nichts anderes ändert sich außer dem Punkt, von dem die Pakete ausgehen.
- Der **Mailbox-Teil ist immer direkt**: temp.tf drosselt pro IP und ist nicht Teil des Vertrauenspfads des Panels, daher verbrennt das Routing über einen Pool-Exit nur Adressen.
- Führe zuerst `--screen` aus: Es testet jeden Exit gegen ADCode **und** die Firebase-Identity-API, weil ein Exit, der nur eines der beiden erreichen kann, ein halbes Konto mintet. Der gemessene Pool für diese Spur war eine WARP-lose gemischte Liste aus `http`- (CONNECT) und `socks5`-Exits, pro Anfrage rotiert — die gesamte Mint-Kette, die Bridge und der Router-Smoke liefen alle darauf ohne WARP im Pfad.

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | ein **Firebase-Refresh-Token** pro verifiziertem Konto (mit einem Header, der erklärt, wie man es in ein ID-Token umwandelt) — von Git ignoriert |
| `accounts.jsonl` | der vollständige Datensatz pro Versuch: E-Mail, Passwort, uid, Refresh-Token, Modell, Gate-Status, Exit |
| `credentials.json` | die Anmeldeinformation in der Form, die `src/bridge.js` liest (`ADCODE_STATE` überschreibt) |
| `proxies.txt` | deine Exits — von Git ignoriert |
| `launcher.config.json` | was der Launcher sich merkt — von Git ignoriert |

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router. ADCode hat keinen Schlüssel zum Registrieren, daher registriert der Konnektor **die Bridge** als Provider-Endpunkt:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

Standardwerte: `--9router-base http://localhost:20128`, `--9router-password 123456`, `--9router-prefix adcode`, `--9router-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Modelle werden als `adcode/<model id>` bereitgestellt, z. B. `adcode/tagflow-code-27b` — verifiziert mit `200` durch den Router.

## 🔌 Mit OmniRoute verbinden

[OmniRoute](https://omniroute.online) ist ein selbst gehosteter, OpenAI-kompatibler Router. ADCode hat keinen Schlüssel zum Registrieren, daher registriert der Konnektor **die Bridge** als Provider-Endpunkt:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-omniroute         # terminal 2 — idempotent
```

Standardwerte: `--omniroute-base http://localhost:20128`, `--omniroute-password 123456`, `--omniroute-prefix adcode`, `--omniroute-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Modelle werden als `adcode/<model id>` bereitgestellt, z. B. `adcode/tagflow-code-27b` — verifiziert mit `200` durch den Router.
## 🔑 Was dir ein Konto bringt

> Hier gibt es **keinen API-Schlüssel** zum Weitergeben — der Free-Tarif von ADCode ist an ein verifiziertes Firebase-Konto gebunden. Ein Mint = ein Konto = eine Anmeldeinformation.

| | |
| --- | --- |
| 🏢 Anbieter | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 Was der Anbieter gibt | kostenloses „Included AI": **4 Modelle**, 2000 Credits pro 5-Stunden-Sitzung / 20000 pro Woche |
| 🔑 Was dir eine Anmeldeinformation bringt | ein per E-Mail verifiziertes Konto, alle vier Modelle, lokal bereitgestellt von der mitgelieferten Bridge |
| 🌐 API-Form | OpenAI-kompatibel **über die Bridge**: `POST http://127.0.0.1:8917/v1/chat/completions` (Platzhalter-Schlüssel) |
| 🔒 Deine Daten | nur die API von ADCode, die Firebase-Identity-Endpunkte und das Mailbox-Backend werden kontaktiert; Anmeldeinformationen bleiben auf deinem Rechner |

## 🐞 Issues

Wenn ADCode seine Kontoregeln ändert, den Relay-Pfad entfernt oder etwas verlangt, was die Kette nicht hat (ein Captcha, ein Telefon), stoppt das Tool an diesem Schritt und gibt die Ablehnung wörtlich aus. **[Öffne ein Issue](../../issues)** mit dem Befehl und der exakten Ausgabe.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ Kontorisiko & wie man es minimiert