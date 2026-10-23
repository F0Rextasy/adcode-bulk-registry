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

**Crea en masa cuentas de IA gratuita de ADCode (Bluethenics) — una credencial de Firebase verificada cada una — además de un puente local compatible con OpenAI + conector de 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-4-of-them) · [🧪 Usar la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

ADCode es el editor de código con IA de Bluethenics. Su código fuente es público (Apache-2.0: `github.com/bluethenics/adcode`), su sitio y su API viven en Cloudflare, y su **"IA incluida" es gratuita** — cuatro modelos servidos por el propio relay de ADCode delante de dos hosts asociados (Tagflow AI, Heabsy).

Hay un detalle, y no es un captcha: **el relay no tiene claves de API en absoluto.** Confía en un **token de ID de Firebase** de una cuenta de ADCode (proyecto `adcode-idle`), así que la credencial duradera es la propia cuenta. Medido en la cadena en vivo: sin captcha, sin Turnstile, sin teléfono, sin SMS — la **única** barrera es la verificación de correo electrónico de la cuenta (`requiresVerifiedAccount: true`; un registro anónimo es aceptado por Firebase y luego rechazado por el relay con `403 verify-account`).

Por lo tanto, este repositorio acuña **cuentas**, no claves, y entrega la pieza que necesita un CLI o un IDE: `src/bridge.js`, un endpoint local compatible con OpenAI que intercambia por ti el token de ID de 1 hora de la cuenta. Es un repositorio de tipo **registro** — `keys.txt` contiene un token de refresco de Firebase por cada cuenta verificada, y nunca se pide ninguna clave de ningún tipo.

## 🎁 Nivel gratuito — cuánto obtienes

| Qué | Valor |
| --- | --- |
| Cómo obtenerlo | una **cuenta de ADCode** con correo verificado (Firebase) — sin tarjeta, sin captcha, sin teléfono |
| Créditos de sesión | **2000** por sesión de 5 horas |
| Créditos semanales | **20000** por semana |
| Modelos incluidos | **4**, cada uno con su propio `creditRate` |
| Asignación de registro | ninguna — los créditos son el propio nivel gratuito, renovados por sesión/semana |
| La unidad que escala | **una cuenta = una credencial** |

Los números anteriores provienen directamente del endpoint de configuración sin cuenta, medido el 2026-10-21:

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config

# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

El relay también aplica límites diarios de solicitudes y de gasto, además de un límite por minuto en cada cuenta, y cuando llega el propio `429` de un socio, el relay recurre silenciosamente a otro modelo incluido — una lectura de "modelo ausente" suele ser ese respaldo, no un catálogo vacío.

> 💡 El nivel gratuito lo define ADCode y puede cambiar. Consulta los números en vivo en [adcode.bluethenics.com](https://adcode.bluethenics.com) — y deja que la propia puerta de la herramienta decida:

```bash
node src/cli.js --verify-only     # every credential in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 4

El endpoint de configuración sin cuenta lista exactamente estos cuatro; **los cuatro respondieron `200` con contenido real** en las cuentas que produjo la cadena de acuñación:

| ID del modelo | Notas | Verificado |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262,144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131,072 ctx · `creditRate 0.2` | **chat-200** |

Solo texto: una parte de contenido `image_url`/`image` recibe `400 images-not-supported`, y el relay acepta exactamente estas claves de cuerpo — `model`, `messages`, `tools`, `tool_choice`, `stream`, `stream_options`, `max_tokens`, `max_completion_tokens`, `reasoning_effort`. Cualquier otra cosa es un `400 bad-request`, por lo que el puente reenvía solo estas y descarta el resto.

## 🧪 Cómo usar la API

Apunta cualquier cliente de OpenAI al **puente** (es la pieza que habla el protocolo del relay):

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

Se acepta cualquier clave de marcador de posición — la credencial que verifica el relay es el token de ID de la cuenta, que el puente renueva por su cuenta. `GET /v1/models` lista los cuatro ids, `stream: true` deja pasar los frames SSE `chat.completion.chunk` sin tocarlos, y si llega una solicitud a través del puente mientras el token de 1 hora ha caducado, el puente inicia sesión de nuevo antes de reenviar (medido: un token deliberadamente obsoleto igual respondió `200`).

Ir directamente a `https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` también es posible, pero entonces tú te encargas del ciclo de vida del token y de la lista blanca exacta del cuerpo.

## 🛠 Inicio rápido

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

Una cuenta por credencial, y una credencial llega a `keys.txt` **solo** después de que el relay respondiera `200` con contenido real. La parte del buzón se llama directamente (temp.tf limita por IP y no forma parte de la ruta de confianza del panel); todo lo demás sigue tu pool cuando pasas uno.

### 🖱️ El lanzador

El lanzador pide la lista de proxies (opcional — sin una, el CLI se ejecuta directo) y la cantidad, las recuerda en `launcher.config.json`, y ejecuta el CLI — acuñar, verificar, cribar salidas, ajustes, ayuda, Conectar a 9Router. Su logotipo es el mismo banner ASCII que este README.

## ✅ Verificado y funcionando — cada clave se prueba

> **Puertas de calidad.** Cada clave aquí pasó un `chat-200` en vivo antes de escribirse en `keys.txt`
> (las claves muertas nunca se entregan). Las combinaciones del router siguen la misma regla a nivel de modelo: una entrada se
> añade **solo si el modelo responde `chat-200` y puede llamar herramientas** — un modelo sin soporte de herramientas,
> una clave muerta o un proveedor muerto se descarta en lugar de añadirse. Funciona con **9Router y OmniRoute**.

| Comprobación | Resultado |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (sin auth) | **200** — 4 modelos, `requiresVerifiedAccount:true`, `sessionCredits 2000`, `weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`, `email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — el enlace de acción llega al buzón en **~30–60 s** |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — el token nuevo lleva `email_verified:true`, que es lo que lee el relay |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| los otros tres modelos `heabsy-*` | **200** cada uno (4/4 del catálogo) |
| `stream:true` | **200** — frames SSE `data: {…chat.completion.chunk}`, luego `[DONE]` |
| reverificación tras espera (17 minutos después, mismas credenciales) | **200** en los cuatro modelos |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — forma de OpenAI, clave de marcador de posición aceptada, paso directo de SSE (`delta.content`) |
| puente con un token deliberadamente obsoleto | **200** — inició sesión de nuevo en lugar de fallar |
| 9Router `adcode/tagflow-code-27b` | **200** `"ok"` a través del router |
| `node src/cli.js --verify-only` | vuelve a comprobar cada credencial en `keys.txt` con una llamada de chat en vivo; sale con 1 si alguna está muerta |
| `node src/cli.js --screen` | prueba cada salida contra **ambos** ADCode y la API de identidad de Firebase (una salida que solo lleva uno de los dos falla la acuñación después) |

Una credencial que falla su puerta de chat se escribe en `accounts.jsonl` con el rechazo y **nunca** en `keys.txt`.

## 🧭 Cómo funciona

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| Paso | Llamada | Notas |
| --- | --- | --- |
| buzón | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | plus-alias en un buzón real de Microsoft, uno por cuenta; limitado por IP (429 + retroceso) |
| registro | `POST identitytoolkit/v1/accounts:signUp?key=…` | la clave pública de la API web se incluye dentro de la app de escritorio de ADCode |
| verificación | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | el enlace se lee del buzón con `GET temp.tf/api/check`; un reenvío deja dos enlaces, así que se prueba cada código visto |
| token | `POST accounts:signInWithPassword` | el nuevo token de ID dice `email_verified:true` — el único requisito del relay |
| puerta | `POST /v1/ai/tagflow/chat/completions` | 200 con contenido (o `reasoning_content`) = conservar la credencial |
| servir | `node src/bridge.js` | endpoint localhost compatible con OpenAI respaldado por esa credencial |

El relay nunca ve una clave de API, así que no hay nada que rotar — pero un `403 verify-account` significa que la cuenta perdió o nunca gastó su enlace de verificación (acuña de nuevo), `401` significa que el token de 1 hora murió (el puente lo renueva, `--verify-only` hace lo mismo a mano), y `403 blocked` significa que un administrador deshabilitó esa cuenta (acuña una nueva).

## ⚙️ Opciones del CLI

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

| Env | Predeterminado | Significado |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(sin definir)* | pool de salidas, una línea por proxy — opcional: sin él, el CLI se conecta directamente |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(sin definir)* | igual para el puente (`ADCODE_PROXY` fija una única salida) |
| `ADCODE_STATE` | `credentials.json` | archivo de credenciales que lee el puente |
| `ADCODE_MODEL` | `tagflow-code-27b` | modelo usado para la puerta en vivo |

## 🛰️ Detrás de un proxy

**Opcional — recomendado a escala (límites por IP, bloqueos).** La herramienta también funciona sin proxy.

- **Con un pool:** pasa `--pool <file>` (o define `ADCODE_PROXIES`) y cada llamada al panel/Firebase pasa por una salida de esa lista. Un pool que pediste pero que falta, está vacío o no lleva ninguna línea usable es un **error grave** — la herramienta nunca recurre silenciosamente a tu propia IP. El puente acepta la misma bandera (`node src/bridge.js --pool exits.txt`) y rota a la siguiente salida cuando una falla.
- **Sin un pool:** el CLI imprime `running WITHOUT a proxy (direct)` y el puente dice `direct` en su banner; nada más cambia salvo desde dónde salen los paquetes.
- La **parte del buzón es siempre directa**: temp.tf limita por IP y no forma parte de la ruta de confianza del panel, así que enrutarla a través de una salida del pool solo quema direcciones.
- Ejecuta `--screen` primero: prueba cada salida contra ADCode **y** la API de identidad de Firebase, porque una salida que solo puede alcanzar una de las dos acuña una media cuenta. El pool medido para este carril fue una lista mixta sin WARP de salidas `http` (CONNECT) y `socks5`, rotadas por solicitud — toda la cadena de acuñación, el puente y la prueba del router se ejecutaron sobre él sin WARP en la ruta.

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `keys.txt` | un **token de refresco de Firebase** por cuenta verificada (con un encabezado que explica cómo convertirlo en un token de ID) — ignorado por git |
| `accounts.jsonl` | el registro completo por intento: correo, contraseña, uid, token de refresco, modelo, estado de la puerta, salida |
| `credentials.json` | la credencial con la forma que lee `src/bridge.js` (`ADCODE_STATE` lo anula) |
| `proxies.txt` | tus salidas — ignorado por git |
| `launcher.config.json` | lo que recuerda el lanzador — ignorado por git |

## 🔌 Conectar a 9Router

[9Router](https://9router.com) es un router autoalojado compatible con OpenAI. ADCode no tiene ninguna clave que registrar, así que el conector registra **el puente** como endpoint del proveedor:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

Predeterminados: `--9router-base http://localhost:20128`, `--9router-password 123456`, `--9router-prefix adcode`, `--9router-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Los modelos se sirven como `adcode/<model id>`, p. ej. `adcode/tagflow-code-27b` — verificado `200` a través del router.

## 🔌 Conectar a OmniRoute

[OmniRoute](https://omniroute.online) es un router autoalojado compatible con OpenAI. ADCode no tiene ninguna clave que registrar, así que el conector registra **el puente** como endpoint del proveedor:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-omniroute         # terminal 2 — idempotent
```

Predeterminados: `--omniroute-base http://localhost:20128`, `--omniroute-password 123456`, `--omniroute-prefix adcode`, `--omniroute-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Los modelos se sirven como `adcode/<model id>`, p. ej. `adcode/tagflow-code-27b` — verificado `200` a través del router.
## 🔑 Qué te da una cuenta

> Aquí **no hay ninguna clave de API** que repartir — el nivel gratuito de ADCode está vinculado a una cuenta de Firebase verificada. Una acuñación = una cuenta = una credencial.

| | |
| --- | --- |
| 🏢 Proveedor | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 Qué da el proveedor | "IA incluida" gratuita: **4 modelos**, 2000 créditos por sesión de 5 horas / 20000 por semana |
| 🔑 Qué te da una credencial | una cuenta con correo verificado, los cuatro modelos, servidos localmente por el puente incluido |
| 🌐 Forma de la API | compatible con OpenAI **a través del puente**: `POST http://127.0.0.1:8917/v1/chat/completions` (clave de marcador de posición) |
| 🔒 Tus datos | solo se contacta la API de ADCode, los endpoints de identidad de Firebase y el backend del buzón; las credenciales permanecen en tu máquina |

## 🐞 Problemas

Si ADCode cambia sus reglas de cuentas, elimina la ruta del relay o empieza a exigir algo que la cadena no tiene (un captcha, un teléfono), la herramienta se detiene en ese paso e imprime el rechazo textualmente. **[Abre un issue](../../issues)** con el comando y la salida exacta.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ Riesgo de cuenta y cómo minimizarlo