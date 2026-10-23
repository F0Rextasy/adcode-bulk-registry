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

**ADCode (Bluethenics) ücretsiz yapay zekâ hesaplarını toplu oluşturun — her biri doğrulanmış bir Firebase kimlik bilgisi — ayrıca yerel bir OpenAI uyumlu köprü + 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-4%20served-412991?style=for-the-badge)](https://adcode.bluethenics.com/v1/ai/tagflow/config)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-4-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

ADCode, Bluethenics'in yapay zekâ kod düzenleyicisidir. Kaynak kodu açıktır (Apache-2.0: `github.com/bluethenics/adcode`), sitesi ve API'si Cloudflare üzerinde çalışır ve **"Included AI" ücretsizdir** — iki iş ortağı ana bilgisayarının (Tagflow AI, Heabsy) önündeki ADCode'un kendi aktarıcısı tarafından sunulan dört model.

Tek bir pürüz var ve bu bir captcha değil: **aktarıcının hiç API anahtarı yok.** Bir ADCode hesabının (proje `adcode-idle`) **Firebase ID token'ına** güvenir, dolayısıyla kalıcı kimlik bilgisi hesabın kendisidir. Canlı zincir üzerinde ölçüldü: captcha yok, Turnstile yok, telefon yok, SMS yok — **tek** kapı hesabın e-posta doğrulamasıdır (`requiresVerifiedAccount: true`; anonim bir kayıt Firebase tarafından kabul edilir ve ardından aktarıcı tarafından `403 verify-account` ile reddedilir).

Bu depo bu nedenle anahtar değil **hesap** üretir ve bir CLI veya IDE'nin ihtiyaç duyduğu parçayı sunar: `src/bridge.js`, hesabın 1 saatlik ID token'ını sizin için değiştiren yerel bir OpenAI uyumlu uç nokta. Bu bir **kayıt** deposudur — `keys.txt` doğrulanmış hesap başına bir Firebase yenileme token'ı tutar ve hiçbir türde anahtar asla istenmez.

## 🎁 Ücretsiz katman — ne kadar alırsınız

| Ne | Değer |
| --- | --- |
| Nasıl alınır | bir e-posta ile doğrulanmış **ADCode hesabı** (Firebase) — kart yok, captcha yok, telefon yok |
| Oturum kredisi | 5 saatlik oturum başına **2000** |
| Haftalık kredi | hafta başına **20000** |
| Dahil edilen modeller | **4**, her biri kendi `creditRate` değerinde |
| Kayıt ödeneği | yok — krediler ücretsiz katmanın kendisidir, oturum/hafta başına yenilenir |
| Ölçeklenen birim | **bir hesap = bir kimlik bilgisi** |

Yukarıdaki sayılar doğrudan hesap gerektirmeyen yapılandırma uç noktasından gelir, 2026-10-21'de ölçüldü:

```bash
curl -s https://adcode.bluethenics.com/v1/ai/tagflow/config

# {"available":true,"defaultModel":"tagflow-code-27b",
#  "models":[…4 models…],"requiresVerifiedAccount":true,"unlimited":true,
#  "credits":{"sessionCredits":2000,"weeklyCredits":20000,"sessionHours":5}}
```

Aktarıcı ayrıca her hesap için günlük istek ve harcama üst sınırlarının yanı sıra dakika başına bir sınır uygular ve bir iş ortağının kendi `429`'u geldiğinde aktarıcı sessizce başka bir dahil edilmiş modele geri döner — "model eksik" okuması genellikle bu geri dönüştür, boş bir katalog değil.

> 💡 Ücretsiz katman ADCode tarafından belirlenir ve değişebilir. Canlı sayıları [adcode.bluethenics.com](https://adcode.bluethenics.com) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # keys.txt içindeki her kimlik bilgisi gerçek bir sohbet çağrısıyla yeniden test edilir
```

## 🤖 Modeller — dördü de

Hesap gerektirmeyen yapılandırma uç noktası tam olarak bu dördünü listeler; **dördü de** üretim zincirinin oluşturduğu hesaplarda gerçek içerikle `200` yanıtı verdi:

| Model Kimliği | Notlar | Doğrulandı |
| --- | --- | --- |
| `tagflow-code-27b` | Tagflow Code 27B · 262.144 ctx · `creditRate 1` | **chat-200** `"ok"` |
| `heabsy-qwen38` | Qwen3.8 27B · 131.072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-glm53-flash-unc` | GLM 5.3 Flash Uncensored · 131.072 ctx · `creditRate 0.2` | **chat-200** |
| `heabsy-mimo-v26-flash` | Xiaomi MiMo V2.6 Flash · 131.072 ctx · `creditRate 0.2` | **chat-200** |

Yalnızca metin: bir `image_url`/`image` içerik parçası `400 images-not-supported` ile yanıtlanır ve aktarıcı tam olarak şu gövde anahtarlarını kabul eder — `model`, `messages`, `tools`, `tool_choice`, `stream`, `stream_options`, `max_tokens`, `max_completion_tokens`, `reasoning_effort`. Başka her şey `400 bad-request` olur, bu yüzden köprü yalnızca bunları iletir ve gerisini düşürür.

## 🧪 API nasıl kullanılır

Herhangi bir OpenAI istemcisini **köprüye** yönlendirin (aktarıcının protokolünü konuşan parça odur):

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

Herhangi bir yer tutucu anahtar kabul edilir — aktarıcının kontrol ettiği kimlik bilgisi, köprünün kendi başına yenilediği hesabın ID token'ıdır. `GET /v1/models` dört kimliği listeler, `stream: true` SSE `chat.completion.chunk` çerçevelerini olduğu gibi geçirir ve 1 saatlik token ölmüşken köprü üzerinden bir istek gelirse, köprü iletmeden önce yeniden oturum açar (ölçüldü: kasıtlı olarak eskimiş bir token yine de `200` yanıtı verdi).

Doğrudan `https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions` adresine gitmek de mümkündür, ancak o zaman token yaşam döngüsünün ve tam gövde beyaz listesinin sahibi siz olursunuz.

## 🛠 Hızlı başlangıç

```bash
cd adcode-bulk-registry
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js                    # interactive: mint / verify / screen / settings
# or: node src/cli.js --count 1 --pool proxies.txt

# then serve the credential to any OpenAI client:
node src/bridge.js --port 8917
# OPENAI_BASE_URL=http://127.0.0.1:8917/v1
```

Kimlik bilgisi başına bir hesap ve bir kimlik bilgisi `keys.txt` dosyasına **yalnızca** aktarıcı gerçek içerikle `200` yanıtı verdikten sonra ulaşır. Posta kutusu ayağı doğrudan çağrılır (temp.tf IP'ye göre sınırlar ve panelin güven yolunun parçası değildir); geri kalan her şey bir havuz ilettiğinizde havuzunuzu izler.

### 🖱️ Başlatıcı

Başlatıcı proxy listesini (isteğe bağlı — olmadan CLI doğrudan çalışır) ve sayıyı sorar, bunları `launcher.config.json` içinde hatırlar ve CLI'yi çalıştırır — üret, doğrula, çıkışları tara, ayarlar, yardım, 9Router'a Bağlan. Kelime işareti bu README ile aynı ASCII banner'dır.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

> **Kalite kapıları.** Buradaki her anahtar `keys.txt` dosyasına yazılmadan önce canlı bir `chat-200` geçti
> (ölü anahtarlar asla gönderilmez). Yönlendirici kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtı veriyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine düşürülür. **9Router ve OmniRoute** ile çalışır.

| Kontrol | Sonuç |
| --- | --- |
| `GET /v1/health` | **200** `{"ok":true}` |
| `GET /v1/ai/tagflow/config` (kimlik doğrulama yok) | **200** — 4 model, `requiresVerifiedAccount:true`, `sessionCredits 2000`, `weeklyCredits 20000` |
| Firebase `accounts:signUp` | **200** — `localId` + `idToken`, `email_verified:false` |
| Firebase `accounts:sendOobCode` (VERIFY_EMAIL) | **200** — eylem bağlantısı posta kutusuna **~30–60 sn** içinde ulaşır |
| Firebase `accounts:update` (`oobCode`) | **200** — `emailVerified:true` |
| Firebase `accounts:signInWithPassword` | **200** — yeni token `email_verified:true` taşır, aktarıcının okuduğu da budur |
| `POST /v1/ai/tagflow/chat/completions` `tagflow-code-27b` | **200** `choices[0].message.content = "ok"` |
| diğer üç `heabsy-*` modeli | her biri **200** (kataloğun 4/4'ü) |
| `stream:true` | **200** — SSE `data: {…chat.completion.chunk}` çerçeveleri, ardından `[DONE]` |
| yeniden doğrulamayı beklet (17 dakika sonra, aynı kimlik bilgileri) | dört modelde de **200** |
| `src/bridge.js` `GET /v1/models` + `POST /v1/chat/completions` | **200** — OpenAI şekli, yer tutucu anahtar kabul edilir, SSE geçişi (`delta.content`) |
| kasıtlı olarak eskimiş token ile köprü | **200** — başarısız olmak yerine yeniden oturum açtı |
| 9Router `adcode/tagflow-code-27b` | yönlendirici üzerinden **200** `"ok"` |
| `node src/cli.js --verify-only` | `keys.txt` içindeki her kimlik bilgisini canlı bir sohbet çağrısıyla yeniden kontrol eder; herhangi biri ölüyse çıkış 1 |
| `node src/cli.js --screen` | her çıkışı **hem** ADCode hem de Firebase kimlik API'sine karşı test eder (yalnızca birini taşıyan bir çıkış üretimde başarısız olur) |

Sohbet kapısında başarısız olan bir kimlik bilgisi, ret yanıtıyla birlikte `accounts.jsonl` dosyasına yazılır ve **asla** `keys.txt` dosyasına yazılmaz.

## 🧭 Nasıl çalışır

```
inbox (temp.tf plus-alias)                                one address per account
   │
   ├─▶ sign-up: Firebase accounts:signUp → e-mail + password
   ├─▶ verify: the Firebase action link out of the inbox → accounts:update
   ├─▶ token: signInWithPassword → an ID token that says email_verified:true (the relay's only gate)
   └─▶ live proof: POST /v1/ai/tagflow/chat/completions → real content = the credential is live
```

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| posta kutusu | `GET temp.tf/api/account?providers=outlook,hotmail&plus=1` | gerçek bir Microsoft posta kutusunda artı takma ad, hesap başına bir tane; IP başına sınırlandırılır (429 + geri çekilme) |
| kayıt | `POST identitytoolkit/v1/accounts:signUp?key=…` | genel web API anahtarı ADCode'un masaüstü uygulamasının içinde gelir |
| doğrulama | `POST accounts:sendOobCode {VERIFY_EMAIL}` → `POST accounts:update {oobCode}` | bağlantı posta kutusundan `GET temp.tf/api/check` ile okunur; yeniden gönderim iki bağlantı bırakır, bu yüzden görülen her kod denenir |
| token | `POST accounts:signInWithPassword` | yeni ID token `email_verified:true` der — aktarıcının tek gereksinimi |
| kapı | `POST /v1/ai/tagflow/chat/completions` | içerikle (veya `reasoning_content` ile) 200 = kimlik bilgisini sakla |
| sun | `node src/bridge.js` | o kimlik bilgisiyle desteklenen OpenAI uyumlu localhost uç noktası |

Aktarıcı hiçbir zaman bir API anahtarı görmez, dolayısıyla döndürülecek bir şey yoktur — ancak `403 verify-account`, hesabın doğrulama bağlantısını kaybettiği veya hiç kullanmadığı anlamına gelir (yeniden üretin), `401` 1 saatlik token'ın öldüğü anlamına gelir (köprü yeniler, `--verify-only` de aynısını elle yapar) ve `403 blocked` bir yöneticinin o hesabı devre dışı bıraktığı anlamına gelir (yeni bir tane üretin).

## ⚙️ CLI seçenekleri

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

| Ortam değişkeni | Varsayılan | Anlamı |
| --- | --- | --- |
| `ADCODE_PROXIES` | *(ayarlanmamış)* | çıkış havuzu, proxy başına bir satır — isteğe bağlı: olmadan CLI doğrudan bağlanır |
| `ADCODE_POOL` / `ADCODE_PROXY` | *(ayarlanmamış)* | köprü için aynısı (`ADCODE_PROXY` tek bir çıkışı sabitler) |
| `ADCODE_STATE` | `credentials.json` | köprünün okuduğu kimlik bilgisi dosyası |
| `ADCODE_MODEL` | `tagflow-code-27b` | canlı kapı için kullanılan model |

## 🛰️ Proxy arkasında

**İsteğe bağlı — ölçekte önerilir (IP başına sınırlar, yasaklar).** Araç proxy olmadan da çalışır.

- **Havuz ile:** `--pool <dosya>` iletin (veya `ADCODE_PROXIES` ayarlayın) ve her panel/Firebase çağrısı o listeden bir çıkış üzerinden gider. İstediğiniz ama eksik, boş veya kullanılabilir satır içermeyen bir havuz **kesin bir hatadır** — araç asla sessizce kendi IP'nize geri dönmez. Köprü aynı bayrağı alır (`node src/bridge.js --pool exits.txt`) ve biri hata verdiğinde bir sonraki çıkışa döner.
- **Havuz olmadan:** CLI `running WITHOUT a proxy (direct)` yazdırır ve köprü banner'ında `direct` der; paketlerin nereden çıktığı dışında hiçbir şey değişmez.
- **Posta kutusu ayağı her zaman doğrudandır**: temp.tf IP başına sınırlar ve panelin güven yolunun parçası değildir, bu yüzden onu bir havuz çıkışı üzerinden yönlendirmek yalnızca adresleri tüketir.
- Önce `--screen` çalıştırın: her çıkışı ADCode **ve** Firebase kimlik API'sine karşı test eder, çünkü ikisinden yalnızca birine ulaşabilen bir çıkış yarım hesap üretir. Bu hat için ölçülen havuz, istek başına döndürülen `http` (CONNECT) ve `socks5` çıkışlarından oluşan WARP'sız karma bir listeydi — tüm üretim zinciri, köprü ve yönlendirici duman testi, yolda WARP olmadan bunun üzerinde çalıştı.

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | doğrulanmış hesap başına bir **Firebase yenileme token'ı** (nasıl ID token'a dönüştürüleceğini açıklayan bir başlıkla) — git tarafından yok sayılır |
| `accounts.jsonl` | deneme başına tam kayıt: e-posta, parola, uid, yenileme token'ı, model, kapı durumu, çıkış |
| `credentials.json` | `src/bridge.js` dosyasının okuduğu biçimdeki kimlik bilgisi (`ADCODE_STATE` geçersiz kılar) |
| `proxies.txt` | çıkışlarınız — git tarafından yok sayılır |
| `launcher.config.json` | başlatıcının hatırladıkları — git tarafından yok sayılır |

## 🔌 9Router'a bağlan

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. ADCode'un kaydedilecek anahtarı yoktur, bu yüzden bağlayıcı **köprüyü** sağlayıcı uç noktası olarak kaydeder:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-9router         # terminal 2 — idempotent
```

Varsayılanlar: `--9router-base http://localhost:20128`, `--9router-password 123456`, `--9router-prefix adcode`, `--9router-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Modeller `adcode/<model id>` olarak sunulur, örn. `adcode/tagflow-code-27b` — yönlendirici üzerinden `200` doğrulandı.

## 🔌 OmniRoute'a bağlan

[OmniRoute](https://omniroute.online) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. ADCode'un kaydedilecek anahtarı yoktur, bu yüzden bağlayıcı **köprüyü** sağlayıcı uç noktası olarak kaydeder:

```bash
node src/bridge.js --port 8917            # terminal 1 (leave it running)
node src/cli.js --connect-omniroute         # terminal 2 — idempotent
```

Varsayılanlar: `--omniroute-base http://localhost:20128`, `--omniroute-password 123456`, `--omniroute-prefix adcode`, `--omniroute-name ADCode`, `--bridge-url http://127.0.0.1:8917/v1`. Modeller `adcode/<model id>` olarak sunulur, örn. `adcode/tagflow-code-27b` — yönlendirici üzerinden `200` doğrulandı.
## 🔑 Bir hesap size ne kazandırır

> Burada dağıtılacak **API anahtarı yoktur** — ADCode'un ücretsiz katmanı doğrulanmış bir Firebase hesabına bağlıdır. Bir üretim = bir hesap = bir kimlik bilgisi.

| | |
| --- | --- |
| 🏢 Sağlayıcı | **ADCode** (Bluethenics) — [adcode.bluethenics.com](https://adcode.bluethenics.com) |
| 🎁 Sağlayıcının verdikleri | ücretsiz "Included AI": **4 model**, 5 saatlik oturum başına 2000 kredi / hafta başına 20000 |
| 🔑 Bir kimlik bilgisinin size kazandırdıkları | bir e-posta ile doğrulanmış hesap, dört modelin tümü, paketlenmiş köprü tarafından yerel olarak sunulur |
| 🌐 API şekli | **köprü üzerinden** OpenAI uyumlu: `POST http://127.0.0.1:8917/v1/chat/completions` (yer tutucu anahtar) |
| 🔒 Verileriniz | yalnızca ADCode'un API'si, Firebase kimlik uç noktaları ve posta kutusu arka ucuyla iletişim kurulur; kimlik bilgileri makinenizde kalır |

## 🐞 Sorunlar

ADCode hesap kurallarını değiştirirse, aktarıcı yolunu kaldırırsa veya zincirde olmayan bir şey gerektirmeye başlarsa (bir captcha, bir telefon), araç o adımda durur ve ret yanıtını kelimesi kelimesine yazdırır. Komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 adcode-bulk-registry katkıda bulunanlar

</div>

---

## ⚠️ Hesap riski ve nasıl en aza indirilir