#!/usr/bin/env node
'use strict';

/**
 * adcode-bulk-registry CLI — mint ADCode (adcode.bluethenics.com) accounts and
 * keep only the credentials that answered a live chat call.
 *
 * ADCode is Bluethenics' free-AI code editor (Apache-2.0 source: github.com/
 * bluethenics/adcode). Its "Included AI" models are NOT reached with an API
 * key: the relay trusts a **Firebase ID token** of an ADCode account (project
 * `adcode-idle`) and lives at its own path
 * (`POST /v1/ai/tagflow/chat/completions`). The one and only gate is the
 * account's e-mail verification — measured: no captcha, no Turnstile, no
 * phone, no SMS anywhere in the chain; an anonymous sign-up is accepted by
 * Firebase but the relay refuses it with `403 verify-account` because it has
 * no address.
 *
 * So one mint = one account, and the durable credential is the account's
 * **Firebase refresh token** (1-hour ID tokens are derived from it):
 *   1. mailbox    temp.tf `GET /api/account?providers=outlook,hotmail&plus=1`
 *                 → a fresh plus-alias on a real Microsoft mailbox
 *   2. sign-up    POST identitytoolkit accounts:signUp {email,password}
 *                 (the public web API key ships inside the desktop app)
 *   3. verify     POST accounts:sendOobCode {VERIFY_EMAIL, idToken} → the
 *                 mailbox receives the Firebase action link (~30-60 s, read
 *                 with `GET /api/check`); POST accounts:update {oobCode} flips
 *                 `emailVerified`
 *   4. token      signInWithPassword again → the token now carries
 *                 `email_verified: true`, which is what the relay reads
 *   5. gate       POST /v1/ai/tagflow/chat/completions → 200 with real content
 *                 (or `reasoning_content`) = keep; anything else is recorded in
 *                 accounts.jsonl and never written to keys.txt
 *
 * A minted credential is written to `keys.txt` (one refresh token per line),
 * `accounts.jsonl` (the full record) and `credentials.json` (the shape the
 * bundled bridge reads). The mailbox is called DIRECTLY — temp.tf throttles
 * per IP and is not part of the panel's trust path — everything else goes
 * through your exit pool when you pass one.
 *
 * Options:
 *   --count N        accounts to mint                                       [1]
 *   --conc N         accounts in flight at once, max 4                      [1]
 *   --gap MS         pause between accounts                              [1500]
 *   --model <id>     model used for the live gate             [tagflow-code-27b]
 *   --mail-window S  seconds to wait for the verification link            [420]
 *   --boxes N        mailboxes tried per account (fresh alias each)         [3]
 *   --pool <file>    proxy list, one exit per line (env ADCODE_PROXIES)  [optional]
 *   --state <file>   bridge credential file to write          [credentials.json]
 *   --exits N        exits tried per account before giving up               [6]
 *   --timeout MS     per-request timeout                                [60000]
 *   --limit N        cap the credentials --verify-only walks (0 = all)       [0]
 *   --verify-only    re-check every credential in keys.txt with a live chat
 *   --screen         only test the proxy list against ADCode + Firebase
 *   --connect-9router  register the bundled bridge on a local 9Router
 *   --help
 *
 * Zero dependencies. Node.js >= 18. The proxy list is OPTIONAL: pass `--pool`
 * (or ADCODE_PROXIES) and every panel/Firebase call goes through an exit from
 * it — a pool you asked for but that is missing/empty is a hard error, never a
 * silent direct run. Without `--pool` the tool connects directly.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  parseProxy, loadExits: readPool, exitFetch, exitJson, UA,
} = require('./proxy.js');

const ROOT = path.basename(__dirname) === 'src' ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.jsonl');
const DEAD_FILE = path.join(ROOT, 'keys-dead.txt');
/** Dead keys from the last verify run (one `key<TAB># reason` per line). */
const writeDead = (dead) => fs.writeFileSync(DEAD_FILE, dead.map((d) => `${d.key}\t# ${d.why}`).join('\n') + (dead.length ? '\n' : ''));

const BASE = 'https://adcode.bluethenics.com';
const IDT = 'https://identitytoolkit.googleapis.com/v1/accounts:';
const TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';
const TEMPTF = 'https://temp.tf';
// Public web API key of the vendor Firebase project `adcode-idle` (shipped in the
// ADCode desktop app, not a secret). Injected via env so the repo carries no key.
const FB_KEY = process.env.ADCODE_WEB_API_KEY || 'AIzaSyATZzX5Fw2HjR34VxB3UQWTmljprA5uXqE'; // public Firebase web key (ships in ADCode's desktop app)
const MODELS = ['tagflow-code-27b', 'heabsy-qwen38', 'heabsy-glm53-flash-unc', 'heabsy-mimo-v26-flash'];

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}
const has = (name) => argv.includes(`--${name}`) || argv.includes(`-${name}`);

// Only as an entry point: `connect-9router.js` requires this file as a module
// and must be able to print its own --help.
if (require.main === module && (has('help') || has('h'))) {
  console.log(`adcode-bulk-registry — mint ADCode (adcode.bluethenics.com) accounts, verified by a live chat call.

  node src/cli.js --count 1           mint one account (kept only after a chat 200)
  node src/cli.js --verify-only       re-check every credential in keys.txt
  node src/cli.js --screen            test your proxy list against ADCode + Firebase
  node src/cli.js --connect-9router   register the bundled bridge on a local 9Router
  node src/cli.js --help

  --count N        accounts to mint                                        [1]
  --conc N         accounts in flight (max 4)                              [1]
  --model <id>     model used for the live gate             [tagflow-code-27b]
  --mail-window S  seconds to wait for the verification link              [420]
  --boxes N        mailboxes tried per account (fresh alias each)           [3]
  --pool <file>    proxy list, one exit per line (env ADCODE_PROXIES) [optional]
  --state <file>   bridge credential file to write          [credentials.json]
  --limit N        cap the credentials --verify-only walks (0 = all)        [0]

There is no API key to mint: the credential is the account's Firebase refresh
token, and the bundled bridge (src/bridge.js) turns it into a local
OpenAI-compatible endpoint. With --pool every panel/Firebase call leaves
through an exit from that list; an unusable pool is a hard error. Without a
pool the tool connects DIRECTLY. The mailbox is always called directly.`);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '1'), 10) || 1);
const CONC = Math.min(4, Math.max(1, parseInt(arg('conc', '1'), 10) || 1));
const GAP_MS = Math.max(0, parseInt(arg('gap', '1500'), 10) || 0);
const EXITS = Math.max(1, parseInt(arg('exits', '6'), 10) || 6);
const TIMEOUT_MS = Math.max(5000, parseInt(arg('timeout', '60000'), 10) || 60000);
const MAIL_WINDOW_MS = Math.max(30, parseInt(arg('mail-window', '420'), 10) || 420) * 1000;
const BOXES = Math.min(6, Math.max(1, parseInt(arg('boxes', '3'), 10) || 3));
const MODEL = arg('model', process.env.ADCODE_MODEL || MODELS[0]);
const LIMIT = Math.max(0, parseInt(arg('limit', '0'), 10) || 0);
// `--state` is resolved against the working directory; the default credential
// file lives next to this script (and next to `keys.txt` / `accounts.jsonl`).
const STATE_FILE = path.resolve(arg('state', process.env.ADCODE_STATE || path.join(ROOT, 'credentials.json')));
const VERIFY_ONLY = has('verify-only');
const SCREEN = has('screen');
const CONNECT_9ROUTER = has('connect-9router');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const newPassword = () => `Ad${crypto.randomBytes(5).toString('base64url')}!${crypto.randomInt(100, 999)}`;
const jwt = (t) => { try { return JSON.parse(Buffer.from(String(t).split('.')[1], 'base64url').toString('utf8')); } catch { return null; } };

// ------------------------------------------------------------------- pool
/**
 * The pool is the caller's choice: `--pool` (or ADCODE_PROXIES) means "route
 * everything through these exits", so a file that is missing, empty or carries
 * no usable line is a hard error — falling back to a direct run would put the
 * traffic on the caller's own IP without saying so. No pool at all = direct,
 * and that is said out loud.
 */
function loadExits() {
  const poolArg = arg('pool', process.env.ADCODE_PROXIES || '');
  if (!poolArg) {
    console.log('no pool given (--pool / ADCODE_PROXIES) — running WITHOUT a proxy (direct). A pool is recommended at scale: per-IP limits and bans exist.');
    return [null];
  }
  const poolFile = fs.existsSync(path.resolve(poolArg)) ? path.resolve(poolArg) : path.resolve(ROOT, poolArg);
  const exits = readPool(poolFile);
  if (exits === null) { console.error(`[fatal] --pool ${poolArg}: file not found (${poolFile}) — refusing to run direct. Omit --pool to run direct on purpose.`); process.exit(1); }
  if (!exits.length) { console.error(`[fatal] --pool ${poolArg}: no usable exit in ${poolFile} — refusing to run direct. Omit --pool to run direct on purpose.`); process.exit(1); }
  console.log(`pool: ${exits.length} exit(s) from ${poolFile}`);
  return exits;
}
/** A dead exit, not a panel verdict — the flow rotates to the next candidate. */
const isExitError = (e) =>
  /proxy connect failed|proxy CONNECT refused|proxy timeout|connect timeout|connect failed|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ECONNABORTED|EPIPE|ENETUNREACH|EHOSTUNREACH|EAI_AGAIN|socket hang up|secureConnect|TLS|handshake/i.test(
    String((e && e.message) || e),
  );

/** `host:port` of the exit in play, or `direct` when the pool is empty. */
const exitLabel = (e) => (e ? `${e.host}:${e.port}` : 'direct');


/** Every exit that can reach both the panel and the Firebase identity API wins. */
async function screen(exits) {
  let ok = 0;
  for (const e of exits.slice(0, 64)) {
    const label = e ? `${e.host}:${e.port}` : 'direct';
    try {
      const t0 = Date.now();
      const health = await exitFetch(e, `${BASE}/v1/health`, { timeoutMs: 20000 });
      const fb = await exitFetch(e, `https://identitytoolkit.googleapis.com/v1/recaptchaParams?key=${FB_KEY}`, { timeoutMs: 20000 });
      const good = health.status === 200 && /"ok"\s*:\s*true/.test(health.body) && fb.status === 200;
      if (good) ok++;
      console.log(`  ${good ? '✔' : '✘'} ${label} adcode=${health.status} firebase=${fb.status} ${Date.now() - t0}ms`);
    } catch (err) {
      console.log(`  ✘ ${label} ${String(err.message).slice(0, 90)}`);
    }
  }
  console.log(`screened ${Math.min(exits.length, 64)} exit(s): ${ok} carry both ADCode and Firebase`);
  return ok;
}

// ------------------------------------------------------------------- mailbox (direct)
/** temp.tf hands out plus-aliases on real Microsoft mailboxes; throttled per IP. */
async function newMailbox() {
  const r = await exitJson(null, `${TEMPTF}/api/account?providers=outlook,hotmail&dot=0&plus=1`, { timeoutMs: 45000 });
  const address = r.json && r.json.email;
  if (!address) throw new Error(`temp.tf /api/account ${r.status}: ${String(r.text).slice(0, 120)}`);
  return address;
}

/** Reads the box and returns every `oobCode` seen (a resend can leave two links). */
async function boxCodes(address) {
  // temp.tf reads the box through POST /api/check (a GET on that path answers
  // `{"data":[]}` and would look like a mailbox that never receives anything).
  const r = await exitJson(null, `${TEMPTF}/api/check`, { method: 'POST', body: { email: address, wait: false }, timeoutMs: 45000 });
  const list = Array.isArray(r.json) ? r.json : (r.json && r.json.data) || [];
  const out = [];
  for (const m of list) {
    const text = [m.subject, m.text, m.textBody, m.plain, m.body, m.html, m.htmlBody, m.snippet, m.preview, JSON.stringify(m)]
      .filter(Boolean).join('\n').replace(/<[^>]+>/g, ' ');
    for (const re of [/oobCode=([A-Za-z0-9_-]{20,})/g, /oobCode%3D([A-Za-z0-9_-]{20,})/g]) {
      for (const hit of text.matchAll(re)) out.push(hit[1]);
    }
  }
  return out;
}

// ------------------------------------------------------------------- firebase
const fb = (name) => `${IDT}${name}?key=${FB_KEY}`;
const fbErr = (r) => (r.json && r.json.error && r.json.error.message) || String(r.text).slice(0, 180);

async function signUp(exit, email, password) {
  return exitJson(exit, fb('signUp'), { method: 'POST', body: { email, password, returnSecureToken: true }, timeoutMs: TIMEOUT_MS });
}

/** Sends the verification mail, then spends the first `oobCode` the box accepts. */
async function verifyMailbox(exit, state) {
  const sent = await exitJson(exit, fb('sendOobCode'), { method: 'POST', body: { requestType: 'VERIFY_EMAIL', idToken: state.idToken }, timeoutMs: TIMEOUT_MS });
  if (sent.status !== 200) throw new Error(`sendOobCode ${sent.status}: ${fbErr(sent)}`);
  const deadline = Date.now() + MAIL_WINDOW_MS;
  const tried = new Set();
  while (Date.now() < deadline) {
    for (const oob of await boxCodes(state.email).catch(() => [])) {
      if (tried.has(oob)) continue;
      tried.add(oob);
      const upd = await exitJson(exit, fb('update'), { method: 'POST', body: { oobCode: oob }, timeoutMs: TIMEOUT_MS });
      if (upd.status === 200) {
        log(`verification link accepted for ${state.email}`);
        return true;
      }
      log(`accounts:update ${upd.status}: ${fbErr(upd)} — trying the next link`);
    }
    await sleep(10000);
  }
  return false;
}

/** Exchanges the durable credential for a 1-hour ID token. */
async function idTokenFrom(exit, { email, password, refreshToken }) {
  if (email && password) {
    const r = await exitJson(exit, fb('signInWithPassword'), { method: 'POST', body: { email, password, returnSecureToken: true }, timeoutMs: TIMEOUT_MS });
    if (r.status === 200 && r.json.idToken) return { idToken: r.json.idToken, refreshToken: r.json.refreshToken || refreshToken };
    log(`sign-in ${r.status}: ${fbErr(r)} — falling back to the refresh-token grant`);
  }
  // securetoken wants a JSON payload: the form-encoded shape is answered
  // `400 Invalid JSON payload received` (measured on the live endpoint).
  const r = await exitJson(exit, `${TOKEN_URL}?key=${FB_KEY}`, {
    method: 'POST',
    body: { grant_type: 'refresh_token', refresh_token: refreshToken || '' },
    timeoutMs: TIMEOUT_MS,
  });
  if (r.status === 200 && r.json.id_token) return { idToken: r.json.id_token, refreshToken: r.json.refresh_token || refreshToken };
  throw new Error(`refresh-token grant ${r.status}: ${String(r.text).slice(0, 140)}`);
}

// ------------------------------------------------------------------- gate
/** The live gate: 200 + real content (thinking models answer reasoning_content). */
async function chatGate(exit, idToken, model = MODEL) {
  const r = await exitJson(exit, `${BASE}/v1/ai/tagflow/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${idToken}`, 'x-adcode-ai-source': 'chat', 'x-adcode-platform': process.platform === 'win32' ? 'win32' : 'linux' },
    body: { model, messages: [{ role: 'user', content: 'Reply with the single word: ok' }], max_tokens: 64, stream: false },
    timeoutMs: Math.max(TIMEOUT_MS, 120000),
  });
  const msg = r.json && r.json.choices && r.json.choices[0] && r.json.choices[0].message;
  const content = msg ? String(msg.content || '').trim() || String(msg.reasoning_content || '').trim() : '';
  return { ok: r.status === 200 && Boolean(content), status: r.status, content, sample: String(r.text).slice(0, 160) };
}

/** The four models the relay lists for a verified account (default model first). */
async function modelList(exit) {
  const r = await exitJson(exit, `${BASE}/v1/ai/tagflow/config`, { timeoutMs: TIMEOUT_MS });
  const ids = ((r.json && r.json.models) || []).map((m) => m.id).filter(Boolean);
  return ids.length ? ids : MODELS;
}

// ------------------------------------------------------------------- files
function readKeys() {
  return fs.readFileSync(KEYS_FILE, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
}
function appendLine(file, line) {
  let tail = '';
  try { tail = fs.readFileSync(file, 'utf8'); } catch { tail = ''; }
  if (!tail) fs.writeFileSync(file, KEYS_HEADER(file));
  fs.appendFileSync(file, (tail && !tail.endsWith('\n') ? '\n' : '') + line + '\n');
}
const KEYS_HEADER = (file) =>
  `# ADCode has no API key: one line per verified account is that account's Firebase\n` +
  `# refresh token (project adcode-idle). Exchange it for a 1-hour ID token with\n` +
  `#   POST https://securetoken.googleapis.com/v1/token?key=<web api key>\n` +
  `#        {"grant_type":"refresh_token","refresh_token":"<the line>"}\n` +
  `# and send the ID token as Authorization: Bearer to\n` +
  `#   POST https://adcode.bluethenics.com/v1/ai/tagflow/chat/completions\n` +
  `# or let src/bridge.js serve it as an OpenAI-compatible endpoint. ${path.basename(file)} is git-ignored.\n`;

/** The shape src/bridge.js reads (ADCODE_STATE). */
function writeState(rec) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    apiKey: FB_KEY, email: rec.email, password: rec.password, uid: rec.uid, refreshToken: rec.refreshToken,
    relay: BASE, models: rec.models, chat200: { at: rec.at, model: rec.model }, at: rec.at,
  }, null, 2) + '\n');
}

// ------------------------------------------------------------------- mint
/** One account end to end; `credential` is null unless the chat gate answered 200. */
async function mintOne(exit) {
  const password = newPassword();
  let last = null;
  for (let box = 1; box <= BOXES; box++) {
    let email = null;
    for (let a = 1; a <= 4 && !email; a++) {
      try {
        email = await newMailbox();
      } catch (e) {
        log(`mailbox attempt ${a}: ${String(e.message).slice(0, 110)}`);
        await sleep(20000 * a); // temp.tf throttles the address route per IP
      }
    }
    if (!email) throw new Error('temp.tf gave no address after 4 attempts');
    log(`mailbox ${box}/${BOXES}: ${email}`);

    const up = await signUp(exit, email, password);
    if (up.status !== 200) {
      last = new Error(`signUp ${up.status}: ${fbErr(up)}`);
      log(String(last.message).slice(0, 120));
      continue; // a recycled alias can already exist — try the next box
    }
    const state = { email, password, uid: up.json.localId, idToken: up.json.idToken, refreshToken: up.json.refreshToken };
    if (!(await verifyMailbox(exit, state))) {
      last = new Error('no usable verification link inside the window');
      continue;
    }
    const fresh = await idTokenFrom(exit, state);
    if (jwt(fresh.idToken)?.email_verified !== true) {
      last = new Error('fresh token still says email_verified=false');
      continue;
    }
    const models = await modelList(exit);
    const gate = await chatGate(exit, fresh.idToken, MODEL);
    const rec = {
      at: new Date().toISOString(), email, password, uid: state.uid, refreshToken: fresh.refreshToken,
      model: MODEL, models, status: gate.status, exit: exit ? `${exit.host}:${exit.port}` : 'direct',
    };
    if (!gate.ok) {
      fs.appendFileSync(ACCOUNTS_FILE, JSON.stringify({ ...rec, gate: 'fail', sample: gate.sample }) + '\n');
      last = new Error(`chat ${gate.status}: ${gate.sample.replace(/\s+/g, ' ').slice(0, 110)}`);
      log(String(last.message));
      continue;
    }
    appendLine(KEYS_FILE, fresh.refreshToken);
    fs.appendFileSync(ACCOUNTS_FILE, JSON.stringify({ ...rec, gate: 200, contentLen: gate.content.length }) + '\n');
    // The durable credential is already on disk (keys.txt + accounts.jsonl); a
    // state file that cannot be written must not turn a good mint into a failure.
    try { writeState(rec); } catch (e) { log(`  ! wrote the credential to keys.txt but not to ${path.basename(STATE_FILE)}: ${e.message}`); }
    log(`account ✔ chat-200 ${MODEL} · ${fresh.refreshToken.slice(0, 10)}… → keys.txt`);
    return rec;
  }
  throw last || new Error('no account minted');
}

async function mint(exits) {
  const routes = exits[0] === null ? 1 : EXITS;
  log(`adcode · ${COUNT} account(s) · conc ${CONC} · model ${MODEL} · exits ${exits.filter(Boolean).length || 'direct'} · up to ${routes} per account · credentials land in ${path.basename(KEYS_FILE)}`);
  let made = 0;
  let transportDead = 0;
  for (let round = 0; round < COUNT; round += CONC) {
    const jobs = [];
    for (let k = 0; k < CONC && round + k < COUNT; k++) {
      const i = round + k;
      jobs.push((async () => {
        let lastErr = null;
        let lastWasExit = false;
        for (let a = 0; a < routes; a++) {
          const exit = exits[(i + a) % exits.length];
          lastWasExit = false;
          try {
            await mintOne(exit);
            made++;
            return;
          } catch (e) {
            lastErr = e;
            lastWasExit = isExitError(e);
            if (lastWasExit) {
              const where = exit ? `exit ${a + 1}/${routes} ${exitLabel(exit)}` : `direct attempt ${a + 1}/${routes}`;
              log(`account ${i + 1}: ${where} dead (${String(e.message).slice(0, 70)})${exit ? ' → next exit' : ''}`);
            } else {
              log(`account ${i + 1} attempt ${a + 1}: ${String(e.message).slice(0, 130)}`);
            }
          }
        }
        if (lastWasExit) transportDead++;
        log(`account ${i + 1} ✘ ${lastErr ? String(lastErr.message).slice(0, 140) : 'failed'}`);
      })());
    }
    await Promise.all(jobs);
    if (GAP_MS) await sleep(GAP_MS);
  }
  if (!made && transportDead === COUNT) {
    const route = exits[0] === null ? 'direct mode (no proxy list)' : `${exits.length}-exit pool`;
    console.error(`[fatal] no usable route — ${COUNT} account(s) × ${routes} candidate(s) over ${route}: every attempt died at the transport layer.`);
    process.exit(1);
  }
  log(`done — ${made}/${COUNT} credential(s) written to ${KEYS_FILE}`);
  process.exit(made ? 0 : 1);
}

/**
 * `--verify-only`: the recorded refresh tokens are the credentials, so this is
 * the whole acceptance test — derive a fresh ID token, then ask the relay.
 * `accounts.jsonl` supplies the e-mail/password pair when it is there (a
 * sign-in path is more reliable than the grant), then `credentials.json`
 * (`token.json` in the lab) for the account it holds, and otherwise the
 * refresh-token grant is used on its own.
 */
async function verifyOnly(exits) {
  let keys = [];
  try { keys = readKeys(); } catch { keys = []; }
  if (!keys.length) { console.log(`no credentials in ${KEYS_FILE} — mint one first (node src/cli.js --count 1)`); process.exit(0); }
  const accounts = new Map();
  try {
    for (const line of fs.readFileSync(ACCOUNTS_FILE, 'utf8').split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { const r = JSON.parse(line); if (r.refreshToken) accounts.set(r.refreshToken, r); } catch { /* partial line */ }
    }
  } catch { /* no record file yet */ }
  // A single-account install never writes accounts.jsonl; its credential file
  // still carries the e-mail/password that make the sign-in path available.
  for (const f of ['credentials.json', 'token.json']) {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
      if (c.refreshToken && !accounts.has(c.refreshToken)) accounts.set(c.refreshToken, c);
    } catch { /* not there */ }
  }
  const list = LIMIT > 0 ? keys.slice(0, LIMIT) : keys;
  let live = 0;
  const dead = [];
  for (let i = 0; i < list.length; i++) {
    const known = accounts.get(list[i]) || {};
    // A dead exit or a mid-request socket hang-up is not a dead credential:
    // the same token is re-tried on the next exit (--exits, default 6).
    let last = null;
    for (let t = 0; t < EXITS && last === null; t++) {
      const exit = exits[(i + t) % exits.length];
      try {
        const { idToken } = await idTokenFrom(exit, { email: known.email, password: known.password, refreshToken: list[i] });
        const g = await chatGate(exit, idToken, MODEL);
        if (g.ok) live++;
        else dead.push({ key: list[i], why: `chat ${g.status}` });
        console.log(`  ${g.ok ? '✔' : '✘'} ${String(i + 1).padStart(2, '0')}/${list.length} ${list[i].slice(0, 10)}… ${known.email || '(grant only)'} chat=${g.status}${g.ok ? '' : ` ${g.sample.replace(/\s+/g, ' ').slice(0, 90)}`}`);
        last = g;
      } catch (e) {
        last = e;
        if (t < EXITS - 1) log(`  ↻ retrying ${list[i].slice(0, 10)}… on the next exit: ${String(e.message).slice(0, 70)}`);
      }
    }
    if (last instanceof Error) { dead.push({ key: list[i], why: String(last.message).slice(0, 90) }); console.log(`  ✘ ${String(i + 1).padStart(2, '0')}/${list.length} ${list[i].slice(0, 10)}… ${String(last.message).slice(0, 90)}`); }
  }
  writeDead(dead);
  console.log(`verify: ${live}/${list.length} credential(s) live${LIMIT > 0 && keys.length > list.length ? ` (limited; ${keys.length} in ${path.basename(KEYS_FILE)})` : ''}`);
  process.exit(live === list.length ? 0 : 1);
}

// ------------------------------------------------------------- connect 9router
async function login9router(base, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ password: password ?? '123456' }),
  });
  const sc = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  return { ok: res.ok, cookie: sc.map((c) => c.split(';')[0]).join('; '), body: (await res.text()).slice(0, 200) };
}

async function r9(base, cookie, p, init = {}) {
  const res = await fetch(`${base}${p}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA, ...(cookie ? { Cookie: cookie } : {}), ...(init.headers || {}) },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, ok: res.ok, json, text: text.slice(0, 300) };
}

/**
 * Register the provider-node and one connection on a local 9Router. ADCode has
 * no key of its own, so the node points at the bridge (src/bridge.js) — the
 * connection's apiKey is a placeholder the bridge ignores, and the models are
 * served as `adcode/<model id>`. Everything here is loopback, so it is direct.
 */
async function connect9router(opts = {}) {
  const base = (opts.base || arg('9router-base', 'http://localhost:20128')).replace(/\/$/, '');
  const password = opts.password || arg('9router-password', '123456');
  const name = arg('9router-name', 'ADCode');
  const prefix = arg('9router-prefix', 'adcode');
  const bridge = (arg('bridge-url', 'http://127.0.0.1:8917/v1')).replace(/\/$/, '');
  const apiKey = arg('api-key', 'bridge');
  const { cookie, ok, body } = await login9router(base, password);
  console.log(`9Router login: ${ok ? 'ok' : `not required/failed ${body}`}`);
  const nodes = await r9(base, cookie, '/api/provider-nodes');
  let node = (((nodes.json || {}).nodes) || []).find((n) => n.prefix === prefix || n.name === name);
  if (node) {
    console.log(`provider-node exists: ${node.id} (prefix ${node.prefix})`);
  } else {
    const created = await r9(base, cookie, '/api/provider-nodes', {
      method: 'POST',
      body: JSON.stringify({ name, prefix, apiType: 'chat', type: 'openai-compatible', baseUrl: bridge }),
    });
    if (!created.ok) throw new Error(`create node failed ${created.status}: ${created.text}`);
    node = created.json.node;
    console.log(`provider-node created: ${node.id} (${bridge})`);
  }
  const conns = await r9(base, cookie, '/api/providers');
  const mine = (((conns.json || {}).connections) || []).find((c) => c.provider === node.id || c.name === name);
  if (mine) {
    console.log(`connection exists: ${mine.id} (${mine.name})`);
  } else {
    const created = await r9(base, cookie, '/api/providers', {
      method: 'POST',
      body: JSON.stringify({ provider: node.id, apiKey, name, priority: 1, defaultModel: MODEL }),
    });
    if (!created.ok && created.status !== 409) throw new Error(`create connection failed ${created.status}: ${created.text}`);
    console.log(`connection created: ${(created.json && created.json.connection && created.json.connection.id) || '(conflict)'}`);
  }
  console.log(`\nDone. Start the bridge first (node src/bridge.js --port 8917), then use ${prefix}/${MODEL}`);
}

// ------------------------------------------------------------------- main
if (require.main === module) {
  (async () => {
    if (CONNECT_9ROUTER) {
      await connect9router();
      process.exit(0);
    }
    const exits = loadExits();
    if (SCREEN) {
      await screen(exits);
      process.exit(0);
    }
    await (VERIFY_ONLY ? verifyOnly(exits) : mint(exits));
  })().catch((e) => {
    console.error('[fatal]', e.message);
    process.exit(1);
  });
}

// The launcher's 9Router flow calls `connectKeysFile`; this repo has no API
// keys to walk, so it is the same registration with the bridge as the endpoint.
module.exports = { parseProxy, loadExits, chatGate, idTokenFrom, screen, mint, verifyOnly, connect9Router: connect9router, connectKeysFile: (o) => connect9router(o) };
