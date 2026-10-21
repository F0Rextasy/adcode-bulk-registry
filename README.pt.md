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

**Crie em massa contas de IA gratuita do ADCode (Bluethenics) — uma credencial Firebase verificada cada — além de uma ponte local compatível com OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Nível gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-4-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isto existe

ADCode é o editor de código com IA da Bluethenics. Seu código-fonte é público (Apache-2.0: `github.com/bluethenics/adcode`), seu site e API ficam na Cloudflare, e sua **"IA Incluída" é gratuita** — quatro modelos servidos pelo próprio relay do ADCode na frente de dois hosts parceiros (Tagflow AI, Heabsy).

Há um porém, e não é um captcha: **o relay não tem chaves de API nenhuma.** Ele confia em um **token de ID do Firebase** de uma conta ADCode (projeto `adcode-idle`), então a credencial durável é a própria conta. Medido na cadeia ao vivo: sem captcha, sem Turnstile, sem telefone, sem SMS — o **único** portão é a verificação de e-mail da conta (`requiresVerifiedAccount: true`; um cadastro anônimo é aceito pelo Firebase e depois recusado pelo relay com `403 verify-account`).

Este repositório, portanto, cunha **contas**, não chaves, e entrega a peça que uma CLI ou IDE precisa: `src/bridge.js`, um endpoint local compatível com OpenAI que troca o token de ID de 1 hora da conta por você. É um repositório de **registro** — `keys.txt` guarda um token de atualização do Firebase por conta verificada, e nenhuma chave de qualquer tipo é jamais solicitada.

## 🎁 Nível gratuito — quanto você recebe

| O quê | Valor |
| --- | --- |
| Como obter | uma **conta ADCode** com e-mail verificado (Firebase) — sem cartão, sem captcha, sem telefone |
| Créditos por sessão | **2000** a cada sessão de 5 horas |
| Créditos semanais | **20000** por semana |
| Modelos incluídos | **4**, cada um com seu próprio `creditRate` |
| Franquia de cadastro | nenhuma — os créditos são o próprio nível gratuito, renovados por sessão/semana |
| A unidade que escala | **uma conta = uma credencial** |

Os números acima vêm direto do endpoint de configuração sem autenticação, medidos em 2026-10-21:

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config
# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

O relay também impõe tetos diários de requisições e de gastos, além de um limite por minuto em cada conta, e quando o próprio `429` de um parceiro chega, o relay silenciosamente recorre a outro modelo incluído — uma leitura de "modelo ausente" geralmente é esse fallback, não um catálogo vazio.

> 💡 O nível gratuito é definido pelo ADCode e pode mudar. Confira os números ao vivo em [adcode.bluethenics.com](https://adcode.bluethenics.com) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every credential in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 4

O endpoint de configuração sem autenticação lista exatamente estes quatro; **todos os quatro responderam `200` com conteúdo real** nas contas que a cadeia de cunhagem produziu:

| ID do modelo | Notas | Verificado |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262.144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131.072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131.072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131.072 ctx · `creditRate 0.2` | **chat-200** |

Somente texto: uma parte de conteúdo `image_url`/`image` é respondida com `400 images-not-supported`, e o relay aceita exatamente estas chaves de corpo — `model`, `messages`, `tools`, `tool_choice`, `stream`, `stream_options`, `max_tokens`, `max_completion_tokens`, `reasoning_effort`. Qualquer outra coisa é um `400 bad-request`, e é por isso que a ponte encaminha apenas estas e descarta o resto.

## 🧪 Como usar a API

Aponte qualquer cliente OpenAI para **a ponte** (é a peça que fala o protocolo do relay):

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

Qualquer chave de preenchimento é aceita — a credencial que o relay verifica é o token de ID da conta, que a ponte renova por conta própria. `GET /v1/models` lista os quatro ids, `stream: true` repassa os quadros SSE `chat.completion.chunk` intactos, e se uma requisição chega pela ponte enquanto o token de 1 hora já morreu, a ponte faz login novamente antes de encaminhar (medido: um token deliberadamente obsoleto ainda respondeu `200`).

Ir direto para `https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` também é possível, mas aí você é dono do ciclo de vida do token e da lista exata de chaves de corpo permitidas.

## 🛠 Início rápido

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

Uma conta por credencial, e uma credencial só chega a `keys.txt` **depois** que o relay respondeu `200` com conteúdo real. A etapa da caixa de correio é chamada diretamente (o temp.tf limita por IP e não faz parte do caminho de confiança do painel); todo o resto segue seu pool quando você passa um.

### 🖱️ O launcher

O launcher pede a lista de proxies (opcional — sem uma, a CLI roda direto) e a quantidade, memoriza-os em `launcher.config.json` e executa a CLI — cunhar, verificar, testar saídas, configurações, ajuda, Conectar ao 9Router. Seu logotipo textual é o mesmo banner ASCII deste README.

## ✅ Verificado e funcionando — toda chave é testada

| Verificação | Resultado |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (sem auth) | **200** — 4 modelos, `requiresVerifiedAccount:true`, `sessionCredits 2000`, `weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`, `email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — o link de ação chega na caixa de correio em **~30–60 s** |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — o token novo carrega `email_verified:true`, que é o que o relay lê |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| os outros três modelos `heabsy-*` | **200** cada (4/4 do catálogo) |
| `stream:true` | **200** — quadros SSE `data: {…chat.completion.chunk}`, depois `[DONE]` |
| reverificação após espera (17 minutos depois, mesmas credenciais) | **200** em todos os quatro modelos |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — formato OpenAI, chave de preenchimento aceita, repasse SSE (`delta.content`) |
| ponte com um token deliberadamente obsoleto | **200** — ela fez login novamente em vez de falhar |
| 9Router `adcode/tagflow-code-27b` | **200** `"ok"` através do roteador |
| `node src/cli.js --verify-only` | reverifica cada credencial em `keys.txt` com uma chamada de chat ao vivo; sai com código 1 se alguma estiver morta |
| `node src/cli.js --screen` | testa cada saída contra **ambos** o ADCode e a API de identidade do Firebase (uma saída que carrega apenas um dos dois falha na cunhagem depois) |

Uma credencial que falha no seu portão de chat é gravada em `accounts.jsonl` com a recusa e **nunca** em `keys.txt`.

## 🧭 Como funciona

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| Etapa | Chamada | Notas |
| --- | --- | --- |
| caixa de correio | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | plus-alias em uma caixa de correio real da Microsoft, uma por conta; limitado por IP (429 + back-off) |
| cadastro | `POST identitytoolkit/v1/accounts:signUp?key=…` | a chave pública da API web vem dentro do aplicativo desktop do ADCode |
| verificação | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | o link é lido da caixa de correio com `GET temp.tf/api/check`; um reenvio deixa dois links, então todo código visto é tentado |
| token | `POST accounts:signInWithPassword` | o novo token de ID diz `email_verified:true` — o único requisito do relay |
| portão | `POST /v1/ai/tagflow/chat/completions` | 200 com conteúdo (ou `reasoning_content`) = mantenha a credencial |
| servir | `node src/bridge.js` | endpoint localhost compatível com OpenAI apoiado nessa credencial |

O relay nunca vê uma chave de API, então não há nada para rotacionar — mas um `403 verify-account` significa que a conta perdeu ou nunca gastou seu link de verificação (cunhe de novo), `401` significa que o token de 1 hora morreu (a ponte o renova, `--verify-only` faz o mesmo manualmente), e `403 blocked` significa que um administrador desativou aquela conta (cunhe uma nova).

## ⚙️ Opções da CLI

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

| Env | Padrão | Significado |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(não definido)* | pool de saídas, uma linha por proxy — opcional: sem ele a CLI se conecta diretamente |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(não definido)* | o mesmo para a ponte (`ADCODE_PROXY` fixa uma única saída) |
| `ADCODE_STATE` | `credentials.json` | arquivo de credencial que a ponte lê |
| `ADCODE_MODEL` | `tagflow-code-27b` | modelo usado para o portão ao vivo |

## 🛰️ Atrás de um proxy

**Opcional — recomendado em escala (limites por IP, banimentos).** A ferramenta também funciona sem proxy.

- **Com um pool:** passe `--pool <file>` (ou defina `ADCODE_PROXIES`) e toda chamada ao painel/Firebase passa por uma saída dessa lista. Um pool que você pediu mas que está ausente, vazio ou sem nenhuma linha utilizável é um **erro fatal** — a ferramenta nunca recorre silenciosamente ao seu próprio IP. A ponte aceita a mesma flag (`node src/bridge.js --pool exits.txt`) e alterna para a próxima saída quando uma dá erro.
- **Sem um pool:** a CLI imprime `running WITHOUT a proxy (direct)` e a ponte diz `direct` em seu banner; nada mais muda além de onde os pacotes saem.
- A **etapa da caixa de correio é sempre direta**: o temp.tf limita por IP e não faz parte do caminho de confiança do painel, então roteá-la por uma saída do pool só queima endereços.
- Rode `--screen` primeiro: ele testa cada saída contra o ADCode **e** a API de identidade do Firebase, porque uma saída que alcança apenas um dos dois cunha uma meia-conta. O pool medido para esta via foi uma lista mista sem WARP de saídas `http` (CONNECT) e `socks5`, rotacionadas por requisição — toda a cadeia de cunhagem, a ponte e o teste do roteador rodaram nela sem nenhum WARP no caminho.

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | um **token de atualização do Firebase** por conta verificada (com um cabeçalho explicando como transformá-lo em um token de ID) — ignorado pelo git |
| `accounts.jsonl` | o registro completo por tentativa: e-mail, senha, uid, token de atualização, modelo, status do portão, saída |
| `credentials.json` | a credencial no formato que `src/bridge.js` lê (`ADCODE_STATE` sobrescreve) |
| `proxies.txt` | suas saídas — ignorado pelo git |
| `launcher.config.json` | o que o launcher memoriza — ignorado pelo git |

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI. O ADCode não tem chave para registrar, então o conector registra **a ponte** como endpoint do provedor:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

Padrões: `--9router-base http://localhost:20128`, `--9router-password 123456`, `--9router-prefix adcode`, `--9router-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Os modelos são servidos como `adcode/<model id>`, por exemplo `adcode/tagflow-code-27b` — verificado `200` através do roteador.

## 🔑 O que uma conta lhe dá

> Aqui **não há chave de API** para distribuir — o nível gratuito do ADCode está vinculado a uma conta Firebase verificada. Uma cunhagem = uma conta = uma credencial.

| | |
| --- | --- |
| 🏢 Provedor | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 O que o provedor dá | "IA Incluída" gratuita: **4 modelos**, 2000 créditos por sessão de 5 horas / 20000 por semana |
| 🔑 O que uma credencial lhe dá | uma conta com e-mail verificado, todos os quatro modelos, servidos localmente pela ponte incluída |
| 🌐 Formato da API | compatível com OpenAI **através da ponte**: `POST http://127.0.0.1:8917/v1/chat/completions` (chave de preenchimento) |
| 🔒 Seus dados | apenas a API do ADCode, os endpoints de identidade do Firebase e o backend da caixa de correio são contatados; as credenciais ficam na sua máquina |

## 🐞 Problemas

Se o ADCode mudar suas regras de conta, remover o caminho do relay ou começar a exigir algo que a cadeia não tem (um captcha, um telefone), a ferramenta para nessa etapa e imprime a recusa literalmente. **[Abra uma issue](../../issues)** com o comando e a saída exata.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry contributors

</div>

---

## ⚠️ Risco de conta e como minimizá-lo