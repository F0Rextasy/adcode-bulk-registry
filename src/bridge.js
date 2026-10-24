#!/usr/bin/env node
'use strict';
/**
 * ADCode bridge: the included AI as a local OpenAI-compatible endpoint.
 *
 * ADCode's free models are not reached with an API key - the relay trusts a
 * Firebase ID token of the ADCode account (project `adcode-idle`) and lives at
 * its own path (`/v1/ai/tagflow/chat/completions`). A CLI or IDE wants an
 * OpenAI base URL, so this is the thin translation layer: refresh the ID
 * token, forward the request, pass the answer back unchanged.
 *
 *   node src/bridge.js [--port 8917] [--model tagflow-code-27b] [--pool exits.txt] [--keys keys.txt]
 *   OPENAI_BASE_URL=http://127.0.0.1:8917/v1   (and any placeholder key)
 *
 * Credential: `credentials.json` (written by the CLI; ADCODE_STATE overrides it).
 * Accounts: `--keys` / ADCODE_KEYS (or the keys.txt beside the script) lists one
 * Firebase refresh token per line. A client that sends one of those tokens as
 * `Authorization: Bearer <refresh token>` gets that account; anything else gets
 * the default credential above. Only the default account's file is ever written.
 * Proxy: OPTIONAL. Without `--pool` (or ADCODE_POOL / ADCODE_PROXY) the bridge
 * talks to ADCode directly; with one, every upstream call leaves through an
 * exit from that list, rotated on a proxy error. A pool you asked for but that
 * is unusable is a hard error, never a silent direct run.
 */
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { parseProxy, createAgent, loadExits: readPool } = require('./proxy.js');
const argv = process.argv.slice(2);
const arg = (n, d) => {
  const eq = argv.find((a) => a.startsWith(`--${n}=`));
  if (eq) return eq.slice(n.length + 3);
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};
const PORT = Number(arg('port', process.env.ADCODE_BRIDGE_PORT ?? 8917));
const ROOT = path.basename(__dirname) === 'src' ? path.resolve(__dirname, '..') : __dirname;
/**
 * The CLI writes `credentials.json` next to the script; the lab's older mint
 * wrote `token.json`. `--state` / ADCODE_STATE are resolved against the working
 * directory, so a relative path works as it was typed.
 */
const stateArg = process.env.ADCODE_STATE || arg('state');
const STATE = path.resolve(stateArg || path.join(ROOT, ['credentials.json', 'token.json'].find((f) => fs.existsSync(path.join(ROOT, f))) || 'credentials.json'));
const API = 'https://adcode.bluethenics.com';
const IDT = 'https://identitytoolkit.googleapis.com/v1';
const MODEL_IDS = ['tagflow-code-27b', 'heabsy-qwen38', 'heabsy-glm53-flash-unc', 'heabsy-mimo-v26-flash'];
const cred = (() => {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) {
    console.error(`[fatal] cannot read the credential file ${STATE} (${e.message}).\n  Mint one first:   node src/cli.js --count 1\n  or point at one:  ADCODE_STATE=<file> node src/bridge.js --port ${PORT}`);
    process.exit(1);
  }
})();
const KEY = cred.apiKey;
const MODELS = (cred.models && cred.models.length ? cred.models : MODEL_IDS);
const DEFAULT_MODEL = arg('model', MODELS[0]);

// Tokens are secrets: nothing below ever prints or stores one whole.
const mask = (v) => (v ? `${String(v).slice(0, 8)}…` : '(none)');

/**
 * The account pool, one Firebase refresh token per line: `--keys` / ADCODE_KEYS,
 * else the first `keys.txt` that exists beside the script, two levels up (the
 * published repo keeps it at the repository root), in `providers/adcode`, or in
 * the working directory. `#` comments and blank lines are skipped.
 */
const readKeyFile = (file) => {
  try { return fs.readFileSync(file, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')); }
  catch { return null; }
};
const POOL = (() => {
  const given = arg('keys', process.env.ADCODE_KEYS || '');
  if (given) {
    const file = fs.existsSync(path.resolve(given)) ? path.resolve(given) : path.resolve(ROOT, given);
    const list = readKeyFile(file);
    if (!list || !list.length) {
      console.error(`[fatal] --keys ${given}: no refresh token in ${file}`);
      process.exit(1);
    }
    return list;
  }
  for (const f of [path.join(__dirname, 'keys.txt'), path.resolve(__dirname, '../../keys.txt'), path.resolve('providers/adcode/keys.txt'), path.resolve('keys.txt')]) {
    const list = readKeyFile(f);
    if (list && list.length) return list;
  }
  return [];
})();
const POOL_SET = new Set(POOL);
/** Renewal-by-password fallback, keyed by refresh token; read-only, never written. */
const ACCOUNTS = (() => {
  const map = new Map();
  for (const f of [path.join(__dirname, 'accounts.jsonl'), path.join(ROOT, 'accounts.jsonl')]) {
    let text;
    try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { const o = JSON.parse(line); if (o.refreshToken && o.email && o.password) map.set(o.refreshToken, o); } catch { /* skip a malformed line */ }
    }
    break;
  }
  return map;
})();

/** An upstream refusal we hand to the client as-is instead of dressing up. */
class HttpError extends Error {
  constructor(status, body) { super(`upstream answered ${status}`); this.status = status; this.body = body; }
}

/**
 * Exit list, in order of precedence: ADCODE_PROXY (one exit, no rotation) →
 * --pool / ADCODE_POOL → an `exits.txt` shipped next to this script (lab
 * convenience; the published repo has none) → DIRECT.
 */
const EXITS = (() => {
  if (process.env.ADCODE_PROXY !== undefined) return [process.env.ADCODE_PROXY.trim()].filter(Boolean);
  const poolArg = arg('pool', process.env.ADCODE_POOL || '');
  if (poolArg) {
    const file = fs.existsSync(path.resolve(poolArg)) ? path.resolve(poolArg) : path.resolve(ROOT, poolArg);
    const list = readPool(file);
    if (!list || !list.length) {
      console.error(`[fatal] --pool ${poolArg}: no usable exit in ${file} — refusing to run direct. Omit --pool to run direct on purpose.`);
      process.exit(1);
    }
    return list.map((p) => p.line);
  }
  const sidecar = path.join(ROOT, 'exits.txt');
  if (fs.existsSync(sidecar)) return (readPool(sidecar) || []).map((p) => p.line);
  return [];
})();
let exitIdx = 0;
function currentProxy() { return EXITS.length ? EXITS[exitIdx % EXITS.length] : ''; }
function rotateExit() { if (EXITS.length > 1) exitIdx = (exitIdx + 1) % EXITS.length; }
const agentFor = () => { const px = currentProxy(); return px ? createAgent(parseProxy(px)) : undefined; };

function call(url, { method = 'POST', headers = {}, body, form } = {}, tries = 3) {
  const payload = form === undefined ? (body === undefined ? null : JSON.stringify(body)) : new URLSearchParams(form).toString();
  const type = form === undefined ? 'application/json' : 'application/x-www-form-urlencoded';
  const head = { ...headers, ...(payload === null ? {} : { 'content-type': type, 'content-length': Buffer.byteLength(payload) }) };
  return new Promise((resolve, reject) => {
    // Once the response has started, the caller owns the stream: a socket that
    // dies mid-answer must not start a second, orphaned upstream request — that
    // retry could never be delivered to anyone.
    let settled = false;
    const req = https.request(url, { method, headers: head, agent: agentFor() }, (res) => { settled = true; resolve({ res, req }); });
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    req.on('error', (e) => {
      if (settled) return;
      const msg = String((e && e.message) || '');
      if (tries > 1 && /proxy|CONNECT|ECONN|socket|timeout|EPIPE|ECONNRESET/i.test(msg)) { rotateExit(); resolve(call(url, { method, headers, body, form }, tries - 1)); } else reject(e);
    });
    if (payload !== null) req.write(payload);
    req.end();
  });
}

const readJson = (res) => new Promise((resolve, reject) => {
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
    try { resolve(JSON.parse(text)); } catch { reject(new Error(`upstream answered ${res.statusCode} with a non-JSON body: ${text.slice(0, 160)}`)); }
  });
  res.on('aborted', () => reject(new Error('upstream aborted the response')));
  res.on('error', reject);
});

/** The status to echo back for a failed token exchange; callers' 4xx wins. */
const authStatus = (res) => (res.statusCode >= 400 ? res.statusCode : 401);

/** A token good for the next hour; the bridge refreshes it a minute before it dies. */
let token = cred.idToken ?? null;
/** A token that cannot be read is treated as dead, so the bridge refreshes instead of crashing. */
const expOf = (value) => { try { return JSON.parse(Buffer.from(String(value).split('.')[1], 'base64url').toString('utf8')).exp * 1000; } catch { return 0; } };
let tokenExp = expOf(token);
/** ID tokens of the pooled accounts, keyed by their refresh token. */
const poolTokens = new Map();

/** Refresh token → ID token through the Firebase secure-token endpoint. */
async function refreshPooled(refreshToken) {
  const { res } = await call(`${IDT}/token?key=${KEY}`, { form: { grant_type: 'refresh_token', refresh_token: refreshToken } });
  let data;
  try { data = await readJson(res); } catch (e) { throw new HttpError(authStatus(res), String(e.message)); }
  if (!data.id_token) throw new HttpError(authStatus(res), JSON.stringify(data));
  return data.id_token;
}

/** A refresh token whose secure-token exchange failed gets one sign-in retry. */
async function signInPooled(acct) {
  const { res } = await call(`${IDT}/accounts:signInWithPassword?key=${KEY}`, { body: { email: acct.email, password: acct.password, returnSecureToken: true } });
  let data;
  try { data = await readJson(res); } catch (e) { throw new HttpError(authStatus(res), String(e.message)); }
  if (!data.idToken) throw new HttpError(authStatus(res), JSON.stringify(data));
  return data.idToken;
}

/**
 * ID token for the identity this request carries: a pooled refresh token, or
 * the default credential when the client sent a placeholder key.
 */
async function bearerFor(refreshToken) {
  if (!refreshToken) {
    if (token !== null && Date.now() < tokenExp - 60_000) return token;
    const { res } = await call(`${IDT}/accounts:signInWithPassword?key=${KEY}`, { body: { email: cred.email, password: cred.password, returnSecureToken: true } });
    const data = await readJson(res);
    if (data.idToken === undefined) throw new Error(`sign-in failed: ${JSON.stringify(data.error?.message ?? data)}`);
    token = data.idToken;
    tokenExp = expOf(token);
    cred.refreshToken = data.refreshToken;
    fs.writeFileSync(STATE, JSON.stringify({ ...cred, idToken: token }, null, 2));
    return token;
  }
  const hit = poolTokens.get(refreshToken);
  if (hit && Date.now() < hit.expMs - 60_000) return hit.idToken;
  let idToken;
  try {
    idToken = await refreshPooled(refreshToken);
  } catch (e) {
    const acct = ACCOUNTS.get(refreshToken);
    if (!acct) throw e;
    idToken = await signInPooled(acct);
  }
  poolTokens.set(refreshToken, { idToken, expMs: expOf(idToken) });
  return idToken;
}

// A bridge keeps long-lived streams open, so nothing a client, an exit or the
// relay does may end the process (measured 2026-10-21: an unhandled upstream
// socket error took a running bridge down with exit 255 after ~20 minutes).
// Both guards are deliberate last resorts: they log and keep serving.
const logErr = (what, e) => console.error(`[bridge] ${what}: ${(e && e.stack) || e}`);
process.on('uncaughtException', (e) => logErr('uncaught exception (kept alive)', e));
process.on('unhandledRejection', (e) => logErr('unhandled rejection (kept alive)', e));


/**
 * ADCode reads a message's `content` as a plain string: an OpenAI-style part
 * array is answered with `400 invalid-messages` ("Included AI could not read
 * this conversation's message format", measured 2026-10-24 from an omp thread),
 * so the parts are flattened before forwarding.
 */
const toText = (c) => Array.isArray(c)
  ? c.map((p) => (typeof p === 'string' ? p : (p && typeof p.text === 'string' ? p.text : ''))).join('')
  : (c == null ? '' : (typeof c === 'string' ? c : String(c)));
const normMessages = (list) => (Array.isArray(list) ? list : []).map((m) => {
  const out = { role: ['system', 'user', 'assistant', 'tool'].includes(m.role) ? m.role : 'user', content: toText(m.content) };
  if (m.role === 'tool' && m.tool_call_id) out.tool_call_id = m.tool_call_id;
  if (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length) out.tool_calls = m.tool_calls;
  return out;
});
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/v1/models') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ object: 'list', data: MODELS.map((id) => ({ id, object: 'model', owned_by: id.startsWith('heabsy') ? 'heabsy' : 'tagflow' })) }));
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, credentials: POOL.length, default: mask(cred.email) }));
    }
    if (!(req.method === 'POST' && url.pathname === '/v1/chat/completions')) { res.writeHead(404).end('{"error":"not found"}'); return; }
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    // ADCode accepts exactly these keys and rejects the rest, so the client's extras are dropped.
    const forward = {
      model: body.model ?? DEFAULT_MODEL,
      messages: normMessages(body.messages),
      stream: body.stream === true,
      max_tokens: body.max_tokens ?? body.max_completion_tokens ?? 4096,
      ...(body.tools === undefined ? {} : { tools: body.tools }),
      ...(body.tool_choice === undefined ? {} : { tool_choice: body.tool_choice }),
      ...(body.reasoning_effort === undefined ? {} : { reasoning_effort: body.reasoning_effort }),
    };
    // The client's Bearer is either one of the pooled refresh tokens (that
    // account) or a placeholder (the default credential).
    const sent = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || ''));
    const wanted = sent ? sent[1].trim() : '';
    const refreshToken = POOL_SET.has(wanted) ? wanted : '';
    const acct = refreshToken ? ACCOUNTS.get(refreshToken) : null;
    console.log(`[bridge] chat model=${forward.model} cred=${mask(refreshToken || cred.email)}${acct ? ` ${acct.email}` : refreshToken ? '' : ' (default)'}`);
    const { res: up } = await call(`${API}/v1/ai/tagflow/chat/completions`, {
      headers: { authorization: `Bearer ${await bearerFor(refreshToken)}`, 'x-adcode-ai-source': 'chat', 'x-adcode-platform': process.platform === 'win32' ? 'win32' : 'linux' },
      body: forward,
    });
    res.writeHead(up.statusCode, { 'content-type': up.headers['content-type'] ?? 'application/json', ...(up.headers['x-adcode-request-id'] ? { 'x-adcode-request-id': up.headers['x-adcode-request-id'] } : {}) });
    // The answer can die mid-stream (an exit drops the tunnel, a partner 5xx):
    // end the client and let the request go, never the process.
    up.on('error', (e) => { logErr('upstream stream error', e); try { res.end(); } catch { /* client gone */ } });
    res.on('error', () => { try { up.destroy(); } catch { /* already gone */ } });
    res.on('close', () => { if (!res.writableEnded) { try { up.destroy(); } catch { /* already gone */ } } });
    up.pipe(res); // SSE frames pass through untouched
  } catch (e) {
    logErr('request failed', e);
    if (!res.headersSent) res.writeHead(e instanceof HttpError ? e.status : 502, { 'content-type': 'application/json' });
    res.end(e instanceof HttpError ? e.body : JSON.stringify({ error: { message: String(e.message) } }));
  }
});

// A listen failure (EADDRINUSE) is fatal on purpose: the supervisor that runs
// this bridge has to see it and restart, not talk to a deaf port.
server.on('error', (e) => { logErr('server error (exiting)', e); process.exit(1); });
server.on('clientError', (e, sock) => { logErr('client error', e); try { sock.destroy(); } catch { /* gone */ } });
server.listen(PORT, '127.0.0.1', () => console.log(`adcode bridge ${PORT} -> ${API} (model ${DEFAULT_MODEL}, ${EXITS.length ? `${EXITS.length} exit(s)` : 'direct'}, ${POOL.length ? `${POOL.length} credential(s)` : 'single credential'})`));
