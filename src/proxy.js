'use strict';

/**
 * Proxy plumbing shared by public-cli.js and bridge.js — zero dependencies.
 *
 * The proxy list is OPTIONAL everywhere in this package: pass one and every
 * upstream call (adcode.bluethenics.com, the Firebase identity endpoints, the
 * temp.tf mailbox) leaves through an exit from it; without one the tool talks
 * to the internet directly. Accepted line shapes:
 *
 *   host:port                            → http
 *   http://host:port                     → CONNECT tunnel
 *   http://user:pass@host:port           → CONNECT + Proxy-Authorization
 *   socks5://host:port                   → SOCKS5 (socks5h = remote DNS, same
 *   socks5://user:pass@host:port            shape here: the host is always sent
 *   # comments and blank lines              to the proxy by name)
 *
 * socks4 is refused on purpose (the CONNECT path and the CLI's TLS wrapper do
 * not carry it), so one bad line can never silently turn into a direct call.
 */

const net = require('net');
const tls = require('tls');
const http = require('http');
const https = require('https');

// A dead exit must free its socket quickly (hundreds of held SYN_SENT slots
// starve the whole host), while a live-but-slow line needs room: measured on
// this line, a healthy tunnel answered in ~8 s but the tail needed ~30 s.
const CONNECT_TIMEOUT_MS = 10000;
const REQUEST_TIMEOUT_MS = 60000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';

function parseProxy(line) {
  const s = String(line || '').trim();
  if (!s || s.startsWith('#')) return null;
  let m = s.match(/^(https?|socks5h?|socks4):\/\/(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)/i);
  if (!m) m = s.match(/^(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)$/);
  if (!m) return null;
  if (m.length === 6) {
    const raw = m[1].toLowerCase();
    if (raw === 'socks4') return null;
    const protocol = raw.startsWith('socks') ? 'socks5' : 'http';
    return { protocol, host: m[4], port: Number(m[5]), auth: m[2] ? `${m[2]}:${m[3]}` : null, line: s };
  }
  return { protocol: 'http', host: m[3], port: Number(m[4]), auth: m[1] ? `${m[1]}:${m[2]}` : null, line: s };
}

/** Reads a pool file: one proxy per line, `#` comments and blanks skipped. */
function loadExits(file) {
  try {
    return require('fs').readFileSync(file, 'utf8').split(/\r?\n/).map(parseProxy).filter(Boolean);
  } catch {
    return null; // caller decides whether a missing pool is fatal
  }
}

/** A raw socket straight to host:port — the direct-mode twin of connectThrough. */
function directConnect(host, port, timeoutMs = CONNECT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host, port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`connect timeout (${host}:${port})`)); }, timeoutMs);
    sock.once('error', (e) => { clearTimeout(t); try { sock.destroy(); } catch {} reject(new Error(`connect failed: ${e.message}`)); });
    sock.once('connect', () => { clearTimeout(t); resolve(sock); });
  });
}

/** One tunnel through one exit: CONNECT for http(s) proxies, handshake for SOCKS5. */
function connectThrough(proxy, host, port, timeoutMs = CONNECT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: proxy.host, port: proxy.port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`proxy timeout (${proxy.host}:${proxy.port})`)); }, timeoutMs);
    const done = (err, s) => { clearTimeout(t); if (err) { try { sock.destroy(); } catch {} reject(err); } else resolve(s); };
    sock.once('error', (e) => done(new Error(`proxy connect failed: ${e.message}`)));
    sock.once('connect', () => {
      if (proxy.protocol === 'socks5') {
        sock.write(proxy.auth ? Buffer.from([5, 2, 0, 2]) : Buffer.from([5, 1, 0]));
        let stage = 0;
        let buf = Buffer.alloc(0);
        const sendConnect = () => {
          const hb = Buffer.from(host);
          sock.write(Buffer.concat([Buffer.from([5, 1, 0, 3, hb.length]), hb, Buffer.from([port >> 8, port & 0xff])]));
        };
        const onData = (d) => {
          try {
            buf = Buffer.concat([buf, d]);
            for (;;) {
              if (stage === 0) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[0] !== 5) return done(new Error('SOCKS5 bad version'));
                if (v[1] === 2) {
                  if (!proxy.auth) return done(new Error('SOCKS5 auth required'));
                  const [u, p] = proxy.auth.split(':');
                  sock.write(Buffer.concat([Buffer.from([1, u.length]), Buffer.from(u), Buffer.from([p.length]), Buffer.from(p)]));
                  stage = 1;
                  continue;
                }
                if (v[1] !== 0) return done(new Error('SOCKS5 no acceptable method'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 1) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[1] !== 0) return done(new Error('SOCKS5 auth failed'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 2) {
                if (buf.length < 5) return;
                const atyp = buf[3];
                const need = 4 + (atyp === 1 ? 4 : atyp === 3 ? 1 + buf[4] : 16) + 2;
                if (buf.length < need) return;
                const rep = buf[1]; buf = buf.slice(need);
                if (rep !== 0) return done(new Error(`SOCKS5 connect failed (code ${rep})`));
                sock.off('data', onData);
                return done(null, sock);
              }
            }
          } catch (e) { done(e); }
        };
        sock.on('data', onData);
        return;
      }
      const auth = proxy.auth ? `Proxy-Authorization: Basic ${Buffer.from(proxy.auth).toString('base64')}\r\n` : '';
      sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
      let buf = '';
      const onData = (d) => {
        buf += d;
        if (!buf.includes('\r\n\r\n')) return;
        sock.off('data', onData);
        if (!/^HTTP\/\d(\.\d)? 200/.test(buf)) return done(new Error(`proxy CONNECT refused: ${buf.split('\r\n')[0]}`));
        done(null, sock);
      };
      sock.on('data', onData);
    });
  });
}

/** One HTTPS request through one exit (or directly when `proxy` is null). */
async function exitFetch(proxy, url, { method = 'GET', headers = {}, body = null, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const u = new URL(url);
  const raw = proxy ? await connectThrough(proxy, u.hostname, u.port || 443, timeoutMs) : await directConnect(u.hostname, u.port || 443, timeoutMs);
  const sock = tls.connect({ socket: raw, servername: u.hostname });
  await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); });
  const chunks = [];
  let resolve, reject;
  const p = new Promise((res, rej) => { resolve = res; reject = rej; });
  const req = http.request({
    method,
    path: u.pathname + u.search,
    createConnection: () => sock,
    headers: { host: u.host, 'user-agent': UA, accept: '*/*', ...headers },
  });
  const t = setTimeout(() => { try { req.destroy(); } catch {} reject(new Error('request timeout')); }, timeoutMs);
  req.on('response', (res) => {
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => { clearTimeout(t); resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }); });
  });
  req.on('error', (e) => { clearTimeout(t); reject(e); });
  if (body != null) req.write(Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)));
  req.end();
  return p;
}

async function exitJson(proxy, url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const body = opts.body;
  // A caller that sets its own content-type keeps it (the caller may send a form).
  if (body != null && !Buffer.isBuffer(body) && !headers['content-type']) headers['content-type'] = 'application/json';
  const r = await exitFetch(proxy, url, { ...opts, headers });
  let json = null;
  try { json = JSON.parse(r.body); } catch { /* html or empty */ }
  return { status: r.status, json, text: r.body, headers: r.headers };
}

/**
 * `https.Agent` whose sockets are opened through the exit and then wrapped in
 * TLS locally, so `https.request({ agent })` exits via the proxy. Used by the
 * bridge, which streams responses instead of buffering them.
 */
class ProxyAgent extends https.Agent {
  constructor(proxy, options = {}) {
    super({ keepAlive: false, ...options });
    this.proxy = proxy;
  }

  createConnection(options, callback) {
    const host = options.host;
    const port = Number(options.port) || 443;
    connectThrough(this.proxy, host, port, this.proxy.timeoutMs || CONNECT_TIMEOUT_MS)
      .then((socket) => {
        if (options.secureEndpoint === false) return socket;
        const tlsSocket = tls.connect({ socket, servername: options.servername || host });
        return new Promise((res, rej) => {
          const t = setTimeout(() => { tlsSocket.destroy(); rej(new Error('TLS handshake timeout')); }, REQUEST_TIMEOUT_MS);
          tlsSocket.once('secureConnect', () => { clearTimeout(t); res(tlsSocket); });
          tlsSocket.once('error', (e) => { clearTimeout(t); try { socket.destroy(); } catch {} rej(e); });
        });
      })
      .then((socket) => callback(null, socket))
      .catch((err) => callback(err));
  }
}

const createAgent = (proxy, options) => (proxy ? new ProxyAgent(proxy, options) : undefined);

module.exports = { parseProxy, loadExits, connectThrough, directConnect, exitFetch, exitJson, ProxyAgent, createAgent, UA, CONNECT_TIMEOUT_MS, REQUEST_TIMEOUT_MS };
