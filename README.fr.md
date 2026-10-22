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

**Créez en masse des comptes ADCode (Bluethenics) free-AI — un identifiant Firebase vérifié chacun — plus un pont local compatible OpenAI + un connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Offre gratuite](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-4-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi ce projet existe

ADCode est l'éditeur de code IA de Bluethenics. Son code source est public (Apache-2.0 : `github.com/bluethenics/adcode`), son site et son API sont hébergés sur Cloudflare, et son **« Included AI » est gratuit** — quatre modèles servis par le propre relais d'ADCode devant deux hôtes partenaires (Tagflow AI, Heabsy).

Il y a un hic, et ce n'est pas un captcha : **le relais n'a aucune clé API.** Il fait confiance à un **jeton d'ID Firebase** d'un compte ADCode (projet `adcode-idle`), donc l'identifiant durable est le compte lui-même. Mesuré sur la chaîne en production : pas de captcha, pas de Turnstile, pas de téléphone, pas de SMS — le **seul** verrou est la vérification de l'e-mail du compte (`requiresVerifiedAccount: true` ; une inscription anonyme est acceptée par Firebase puis refusée par le relais avec `403 verify-account`).

Ce dépôt fabrique donc des **comptes**, pas des clés, et fournit la pièce dont un CLI ou un IDE a besoin : `src/bridge.js`, un point de terminaison local compatible OpenAI qui échange pour vous le jeton d'ID d'une heure du compte. C'est un dépôt **registry** — `keys.txt` contient un jeton de rafraîchissement Firebase par compte vérifié, et aucune clé d'aucune sorte n'est jamais demandée.

## 🎁 Offre gratuite — ce que vous obtenez

| Quoi | Valeur |
| --- | --- |
| Comment l'obtenir | un **compte ADCode** avec e-mail vérifié (Firebase) — pas de carte, pas de captcha, pas de téléphone |
| Crédits par session | **2000** par session de 5 heures |
| Crédits hebdomadaires | **20000** par semaine |
| Modèles inclus | **4**, chacun avec son propre `creditRate` |
| Allocation d'inscription | aucune — les crédits sont l'offre gratuite elle-même, rafraîchie par session/semaine |
| L'unité qui évolue | **un compte = un identifiant** |

Les chiffres ci-dessus proviennent directement du point de terminaison de configuration sans authentification, mesuré le 2026-10-21 :

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config
# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

Le relais impose également des plafonds quotidiens de requêtes et de dépenses ainsi qu'une limite par minute sur chaque compte, et lorsqu'un `429` d'un partenaire arrive, le relais bascule silencieusement vers un autre modèle inclus — une lecture « modèle manquant » correspond généralement à ce repli, pas à un catalogue vide.

> 💡 L'offre gratuite est définie par ADCode et peut changer. Consultez les chiffres en direct sur [adcode.bluethenics.com](https://adcode.bluethenics.com) — et laissez le propre verrou de l'outil décider :

```bash
node src/cli.js --verify-only     # every credential in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 4

Le point de terminaison de configuration sans authentification liste exactement ces quatre ; **les quatre ont répondu `200` avec du contenu réel** sur les comptes produits par la chaîne de création :

| ID du modèle | Notes | Vérifié |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262,144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131,072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131,072 ctx · `creditRate 0.2` | **chat-200** |

Texte uniquement : une partie de contenu `image_url`/`image` reçoit `400 images-not-supported`, et le relais accepte exactement ces clés de corps — `model`, `messages`, `tools`, `tool_choice`, `stream`, `stream_options`, `max_tokens`, `max_completion_tokens`, `reasoning_effort`. Tout le reste est un `400 bad-request`, c'est pourquoi le pont ne transmet que celles-ci et abandonne le reste.

## 🧪 Comment utiliser l'API

Pointez n'importe quel client OpenAI vers **le pont** (c'est la pièce qui parle le protocole du relais) :

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

N'importe quelle clé factice est acceptée — l'identifiant que le relais vérifie est le jeton d'ID du compte, que le pont rafraîchit de lui-même. `GET /v1/models` liste les quatre identifiants, `stream: true` transmet les trames SSE `chat.completion.chunk` telles quelles, et si une requête arrive via le pont alors que le jeton d'une heure est mort, le pont se reconnecte avant de transmettre (mesuré : un jeton volontairement périmé a tout de même répondu `200`).

Aller directement à `https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` est également possible, mais vous gérez alors vous-même le cycle de vie du jeton et la liste blanche exacte du corps.

## 🛠 Démarrage rapide

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

Un compte par identifiant, et un identifiant n'atteint `keys.txt` **qu'**après que le relais a répondu `200` avec du contenu réel. Le volet boîte mail est appelé directement (temp.tf limite par IP et ne fait pas partie du chemin de confiance du panneau) ; tout le reste suit votre pool lorsque vous en passez un.

### 🖱️ Le lanceur

Le lanceur demande la liste de proxys (facultative — sans elle, le CLI s'exécute en direct) et le nombre, les mémorise dans `launcher.config.json`, et exécute le CLI — création, vérification, test des sorties, paramètres, aide, Connect to 9Router. Son logotype est la même bannière ASCII que ce README.

## ✅ Vérifié et fonctionnel — chaque clé est testée

> **Contrôles qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combinaisons de routeur suivent la même règle au niveau du modèle : une entrée est
> ajoutée **uniquement si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans prise en charge des outils,
> une clé morte ou un fournisseur mort est écarté plutôt qu'ajouté. Fonctionne avec **9Router et OmniRoute**.

| Vérification | Résultat |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (sans auth) | **200** — 4 modèles, `requiresVerifiedAccount:true`, `sessionCredits 2000`, `weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`, `email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — le lien d'action arrive dans la boîte mail en **~30–60 s** |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — le nouveau jeton porte `email_verified:true`, ce que lit le relais |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| les trois autres modèles `heabsy-*` | **200** chacun (4/4 du catalogue) |
| `stream:true` | **200** — trames SSE `data: {…chat.completion.chunk}`, puis `[DONE]` |
| re-vérification après attente (17 minutes plus tard, mêmes identifiants) | **200** sur les quatre modèles |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — forme OpenAI, clé factice acceptée, passthrough SSE (`delta.content`) |
| pont avec un jeton volontairement périmé | **200** — il s'est reconnecté au lieu d'échouer |
| 9Router `adcode/tagflow-code-27b` | **200** `"ok"` via le routeur |
| `node src/cli.js --verify-only` | revérifie chaque identifiant dans `keys.txt` avec un appel de chat en direct ; code de sortie 1 si l'un est mort |
| `node src/cli.js --screen` | teste chaque sortie contre **à la fois** ADCode et l'API d'identité Firebase (une sortie qui ne porte qu'un seul des deux échouera plus tard à la création) |

Un identifiant qui échoue à son verrou de chat est écrit dans `accounts.jsonl` avec le refus et **jamais** dans `keys.txt`.

## 🧭 Comment ça marche

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| Étape | Appel | Notes |
| --- | --- | --- |
| boîte mail | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | plus-alias sur une vraie boîte Microsoft, un par compte ; limité par IP (429 + back-off) |
| inscription | `POST identitytoolkit/v1/accounts:signUp?key=…` | la clé API web publique est embarquée dans l'application de bureau d'ADCode |
| vérification | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | le lien est lu dans la boîte mail avec `GET temp.tf/api/check` ; un renvoi laisse deux liens, donc chaque code vu est essayé |
| jeton | `POST accounts:signInWithPassword` | le nouveau jeton d'ID porte `email_verified:true` — la seule exigence du relais |
| verrou | `POST /v1/ai/tagflow/chat/completions` | 200 avec contenu (ou `reasoning_content`) = conserver l'identifiant |
| service | `node src/bridge.js` | point de terminaison localhost compatible OpenAI adossé à cet identifiant |

Le relais ne voit jamais de clé API, donc il n'y a rien à faire tourner — mais un `403 verify-account` signifie que le compte a perdu ou n'a jamais utilisé son lien de vérification (recréez-en un), `401` signifie que le jeton d'une heure est mort (le pont le renouvelle, `--verify-only` fait la même chose à la main), et `403 blocked` signifie qu'un administrateur a désactivé ce compte (créez-en un nouveau).

## ⚙️ Options du CLI

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

| Env | Défaut | Signification |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(non défini)* | pool de sorties, une ligne par proxy — facultatif : sans lui, le CLI se connecte directement |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(non défini)* | idem pour le pont (`ADCODE_PROXY` épingle une seule sortie) |
| `ADCODE_STATE` | `credentials.json` | fichier d'identifiants que lit le pont |
| `ADCODE_MODEL` | `tagflow-code-27b` | modèle utilisé pour le verrou en direct |

## 🛰️ Derrière un proxy

**Facultatif — recommandé à grande échelle (limites par IP, bannissements).** L'outil fonctionne aussi sans proxy.

- **Avec un pool :** passez `--pool <file>` (ou définissez `ADCODE_PROXIES`) et chaque appel au panneau/Firebase passe par une sortie de cette liste. Un pool que vous avez demandé mais qui est manquant, vide ou ne contient aucune ligne utilisable est une **erreur fatale** — l'outil ne retombe jamais discrètement sur votre propre IP. Le pont prend le même drapeau (`node src/bridge.js --pool exits.txt`) et bascule vers la sortie suivante en cas d'erreur.
- **Sans pool :** le CLI affiche `running WITHOUT a proxy (direct)` et le pont indique `direct` dans sa bannière ; rien d'autre ne change, hormis le point de départ des paquets.
- Le **volet boîte mail est toujours direct** : temp.tf limite par IP et ne fait pas partie du chemin de confiance du panneau, donc le router via une sortie de pool ne fait que brûler des adresses.
- Lancez d'abord `--screen` : il teste chaque sortie contre ADCode **et** l'API d'identité Firebase, car une sortie qui ne peut atteindre qu'un des deux crée un demi-compte. Le pool mesuré pour cette voie était une liste mixte sans WARP de sorties `http` (CONNECT) et `socks5`, alternées à chaque requête — toute la chaîne de création, le pont et le test du routeur ont tourné dessus sans WARP dans le chemin.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | un **jeton de rafraîchissement Firebase** par compte vérifié (avec un en-tête expliquant comment le transformer en jeton d'ID) — ignoré par git |
| `accounts.jsonl` | l'enregistrement complet par tentative : e-mail, mot de passe, uid, jeton de rafraîchissement, modèle, statut du verrou, sortie |
| `credentials.json` | l'identifiant dans la forme que lit `src/bridge.js` (`ADCODE_STATE` le remplace) |
| `proxies.txt` | vos sorties — ignoré par git |
| `launcher.config.json` | ce que le lanceur mémorise — ignoré par git |

## 🔌 Se connecter à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI. ADCode n'a aucune clé à enregistrer, donc le connecteur enregistre **le pont** comme point de terminaison du fournisseur :

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

Défauts : `--9router-base http://localhost:20128`, `--9router-password 123456`, `--9router-prefix adcode`, `--9router-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Les modèles sont servis sous `adcode/<model id>`, par ex. `adcode/tagflow-code-27b` — vérifié `200` via le routeur.

## 🔌 Se connecter à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé compatible OpenAI. ADCode n'a aucune clé à enregistrer, donc le connecteur enregistre **le pont** comme point de terminaison du fournisseur :

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-omniroute         # terminal 2 — idempotent
```

Défauts : `--omniroute-base http://localhost:20128`, `--omniroute-password 123456`, `--omniroute-prefix adcode`, `--omniroute-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Les modèles sont servis sous `adcode/<model id>`, par ex. `adcode/tagflow-code-27b` — vérifié `200` via le routeur.
## 🔑 Ce qu'un compte vous apporte

> Il n'y a **aucune clé API** à distribuer ici — l'offre gratuite d'ADCode est liée à un compte Firebase vérifié. Une création = un compte = un identifiant.

| | |
| --- | --- |
| 🏢 Fournisseur | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 Ce que le fournisseur offre | « Included AI » gratuit : **4 modèles**, 2000 crédits par session de 5 heures / 20000 par semaine |
| 🔑 Ce qu'un identifiant vous apporte | un compte avec e-mail vérifié, les quatre modèles, servis localement par le pont inclus |
| 🌐 Forme de l'API | compatible OpenAI **via le pont** : `POST http://127.0.0.1:8917/v1/chat/completions` (clé factice) |
| 🔒 Vos données | seuls l'API d'ADCode, les points de terminaison d'identité Firebase et le backend de boîte mail sont contactés ; les identifiants restent sur votre machine |

## 🐞 Problèmes

Si ADCode modifie ses règles de compte, supprime le chemin du relais ou commence à exiger quelque chose que la chaîne n'a pas (un captcha, un téléphone), l'outil s'arrête à cette étape et affiche le refus mot pour mot. **[Ouvrez un ticket](../../issues)** avec la commande et la sortie exacte.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ Risque lié au compte et comment le minimiser