/**
 * Reverence — Cloudflare Worker
 * Cross-device sync via Cloudflare KV
 *
 * SETUP INSTRUCTIONS:
 * ─────────────────────────────────────────────────────────────────
 * 1. Install Wrangler CLI:
 *      npm install -g wrangler
 *
 * 2. Log in to Cloudflare:
 *      wrangler login
 *
 * 3. Create a KV namespace:
 *      wrangler kv:namespace create "REVERENCE_KV"
 *    Copy the returned id into wrangler.toml below.
 *
 * 4. Create wrangler.toml in the same folder as this file:
 *
 *      name = "reverence"
 *      main = "worker.js"
 *      compatibility_date = "2024-01-01"
 *
 *      [[kv_namespaces]]
 *      binding = "REVERENCE_KV"
 *      id = "PASTE_YOUR_KV_NAMESPACE_ID_HERE"
 *
 * 5. Deploy:
 *      wrangler deploy
 *
 * 6. Copy the deployed URL (e.g. https://reverence.yourname.workers.dev)
 *    and paste it into Reverence → Settings → Worker URL.
 *
 * ENDPOINTS:
 *   GET  /kv/:token  — fetch data for this token
 *   PUT  /kv/:token  — save data for this token (JSON body)
 *
 * SECURITY:
 *   - Origin allowlist: only requests from ALLOWED_ORIGINS are accepted.
 *   - Rate limiting: max MAX_REQUESTS_PER_WINDOW GET requests per IP
 *     per sliding window. Tracked in KV under the prefix "rl:".
 *   - Token validation: accepts both legacy (base-36, ≥8 chars) and
 *     new secure (base64url, 22 chars) tokens for backwards compatibility.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Config ────────────────────────────────────────────────────────
// Origins allowed to call this worker. Add your deployed URL here.
// Requests with no Origin header (e.g. curl, Postman) are blocked.
const ALLOWED_ORIGINS = [
  'https://badbox29.github.io',
  'https://tome2.freedomtothink.social',
];

// Rate limiting — sliding window, applied to both GETs and PUTs
const RATE_WINDOW_SECONDS    = 60 * 60; // 1 hour window
const MAX_REQUESTS_PER_WINDOW = 60;     // max requests per IP per hour (GET + PUT combined)
const RATE_KEY_TTL = RATE_WINDOW_SECONDS * 2;

// KV data TTL — how long account data persists without a write.
// Resets on every sync. 5 years covers long app inactivity periods.
const KV_TTL = 60 * 60 * 24 * 1825; // 5 years in seconds

// Google OAuth Client ID — used to verify ID tokens issued by Google.
const GOOGLE_CLIENT_ID = '816310286560-4tgoor67vdu5jh65nlul0lr78rkrc5bc.apps.googleusercontent.com';

// HMAC config — token accounts sign every request with an HMAC-SHA256
// signature derived from their token via HKDF. The raw token never
// travels as a bare bearer credential.
// HMAC_REQUIRED: set to false during rollout to accept unsigned requests
// from older clients; set to true once all clients are updated.
const HMAC_REQUIRED = false; // flip to true after app.js is deployed

// ── Google JWT verification ───────────────────────────────────────
// Verifies a Google ID token by fetching Google's public JWKS, finding
// the matching key by kid, and verifying the RS256 signature.
// Validates aud, iss, and exp claims. Returns decoded payload on success,
// null on any failure. Safe to call — all errors return null.
async function verifyGoogleJWT(idToken) {
  if(!GOOGLE_CLIENT_ID) return null;
  try {
    // 1. Decode header and payload (no verification yet)
    const parts = idToken.split('.');
    if(parts.length !== 3) return null;

    const header  = JSON.parse(atob(parts[0].replace(/-/g,'+').replace(/_/g,'/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));

    // 2. Validate standard claims before touching crypto
    const now = Math.floor(Date.now() / 1000);
    if(payload.exp < now)                                          return null; // expired
    if(payload.aud !== GOOGLE_CLIENT_ID)                           return null; // wrong audience
    if(!['accounts.google.com','https://accounts.google.com']
        .includes(payload.iss))                                    return null; // wrong issuer
    if(!payload.sub)                                               return null; // no subject

    // 3. Fetch Google's public keys and find the matching key by kid
    const jwksRes = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if(!jwksRes.ok) return null;
    const jwks = await jwksRes.json();
    const jwk  = jwks.keys?.find(k => k.kid === header.kid);
    if(!jwk) return null;

    // 4. Import the JWK as a CryptoKey for RS256 verification
    const cryptoKey = await crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // 5. Verify the signature
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature    = Uint8Array.from(
      atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')),
      c => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', cryptoKey, signature, signingInput
    );
    if(!valid) return null;

    // 6. Return the verified payload
    return {
      sub:     payload.sub,
      email:   payload.email   || null,
      name:    payload.name    || null,
      picture: payload.picture || null,
    };
  } catch(err) {
    console.error('[Auth] verifyGoogleJWT error:', err);
    return null;
  }
}

// ── HMAC helpers (token accounts) ────────────────────────────────
// Token accounts sign every request with HMAC-SHA256. The signing key
// is derived from the token via HKDF so the raw token never travels
// over the wire as a bearer credential.
//
// Client sends two extra headers:
//   X-Timestamp : unix ms string (within ±5 min of server time)
//   X-Signature : base64url HMAC-SHA256 of "<method>:<token>:<timestamp>:<bodyHash>"
//
// deriveHmacKey(token) — derives a 256-bit signing key from the token
// via HKDF-SHA256. Returns a CryptoKey for use with crypto.subtle.sign.
async function deriveHmacKey(token) {
  const enc      = new TextEncoder();
  const keyMat   = await crypto.subtle.importKey(
    'raw', enc.encode(token),
    { name: 'HKDF' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('reverence-hmac-v1'), info: enc.encode('request-signing') },
    keyMat,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
}

// verifyHmacSignature(request, token, body) — verifies the X-Signature header.
// Returns { ok: true } on success, { ok: false, reason } on failure.
// Rejects requests older than 5 minutes to prevent replay attacks.
async function verifyHmacSignature(request, token, body) {
  const timestamp = request.headers.get('X-Timestamp') || '';
  const signature = request.headers.get('X-Signature') || '';
  if(!timestamp || !signature) return { ok: false, reason: 'Missing HMAC headers' };

  // Reject requests outside ±5 minute window
  const age = Math.abs(Date.now() - parseInt(timestamp, 10));
  if(age > 5 * 60 * 1000) return { ok: false, reason: 'Request timestamp expired' };

  // Hash the body for the signing input
  const bodyHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body || '')))
  ).map(b => b.toString(16).padStart(2,'0')).join('');

  const message = `${request.method.toUpperCase()}:${token}:${timestamp}:${bodyHash}`;

  try {
    const key      = await deriveHmacKey(token);
    const sigBytes = Uint8Array.from(atob(signature.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
    const valid    = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(message));
    return valid ? { ok: true } : { ok: false, reason: 'Invalid signature' };
  } catch(err) {
    return { ok: false, reason: 'Signature verification error' };
  }
}
function respond(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function respondText(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain',
      ...extraHeaders,
    },
  });
}

// Build CORS headers for a known-good origin
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

// Check origin against allowlist. Returns the origin string if allowed,
// null if rejected.
function checkOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  if(ALLOWED_ORIGINS.includes(origin)) return origin;
  return null;
}

// Per-IP rate limiting using KV as a counter store.
// Applied to both GET and PUT requests.
// Returns { allowed: bool, remaining: number }
async function checkRateLimit(env, ip) {
  const key     = `rl:${ip}`;
  const raw     = await env.REVERENCE_KV.get(key, { type: 'text' });
  const count   = raw ? parseInt(raw, 10) : 0;
  const allowed = count < MAX_REQUESTS_PER_WINDOW;

  if(allowed) {
    // Increment counter; reset TTL on every write
    await env.REVERENCE_KV.put(key, String(count + 1), {
      expirationTtl: RATE_KEY_TTL,
    });
  }

  return { allowed, remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - count - 1) };
}

export default {
  async fetch(request, env) {
    try {
      const url    = new URL(request.url);
      const method = request.method.toUpperCase();

      // ── Origin check ─────────────────────────────────────────────
      // Preflight (OPTIONS) must also pass the origin check so browsers
      // receive a valid CORS preflight response.
      const origin = checkOrigin(request);
      if(!origin) {
        return respondText('Forbidden', 403);
      }

      const cors = corsHeaders(origin);

      // ── Preflight ─────────────────────────────────────────────────
      if(method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: cors });
      }

      // ── Health check ──────────────────────────────────────────────
      if(url.pathname === '/') {
        return respond(JSON.stringify({ ok: true, service: 'Reverence KV' }), 200, cors);
      }

      // ── Auth routes (Google OAuth) ────────────────────────────────
      // POST /auth/google  — verify Google ID token, return KV key (sub)
      // POST /auth/verify  — re-verify a stored Google credential
      // POST /auth/migrate — one-way token→Google migration
      if(url.pathname === '/auth/google') {
        if(method !== 'POST') return respondText('Method not allowed', 405, cors);

        let idToken;
        try {
          const body = await request.json();
          idToken = body.idToken;
        } catch {
          return respond(JSON.stringify({ error: 'Invalid request body' }), 400, cors);
        }
        if(!idToken) return respond(JSON.stringify({ error: 'idToken required' }), 400, cors);

        const payload = await verifyGoogleJWT(idToken);
        if(!payload) {
          return respond(JSON.stringify({ error: 'Invalid or expired Google token' }), 401, cors);
        }

        // KV key for Google accounts: "google:<sub>"
        // sub is Google's stable, permanent user ID — never changes, never reused.
        const kvKey = `google:${payload.sub}`;

        return respond(JSON.stringify({
          ok:      true,
          kvKey,
          profile: payload,
        }), 200, cors);
      }

      if(url.pathname === '/auth/verify') {
        if(method !== 'POST') return respondText('Method not allowed', 405, cors);

        let idToken;
        try {
          const body = await request.json();
          idToken = body.idToken;
        } catch {
          return respond(JSON.stringify({ error: 'Invalid request body' }), 400, cors);
        }
        if(!idToken) return respond(JSON.stringify({ error: 'idToken required' }), 400, cors);

        const payload = await verifyGoogleJWT(idToken);
        if(!payload) {
          return respond(JSON.stringify({ ok: false, error: 'Token expired or invalid' }), 401, cors);
        }
        return respond(JSON.stringify({ ok: true, profile: payload }), 200, cors);
      }

      if(url.pathname === '/auth/migrate') {
        if(method !== 'POST') return respondText('Method not allowed', 405, cors);

        let body;
        try { body = await request.json(); } catch {
          return respond(JSON.stringify({ error: 'Invalid request body' }), 400, cors);
        }

        const { idToken, oldToken, migrationCode } = body || {};
        if(!idToken || !oldToken) {
          return respond(JSON.stringify({ error: 'idToken and oldToken required' }), 400, cors);
        }

        // Validate old token format
        if(!/^(google:\d{10,30}|[a-zA-Z0-9_-]{8,128})$/.test(oldToken)) {
          return respond(JSON.stringify({ error: 'Invalid token format' }), 400, cors);
        }

        // Verify Google JWT
        const payload = await verifyGoogleJWT(idToken);
        if(!payload) {
          return respond(JSON.stringify({ error: 'Invalid or expired Google token' }), 401, cors);
        }

        // Verify migration code if provided (10-min TTL, stored as "migcode:<oldToken>")
        if(migrationCode) {
          const storedCode = await env.REVERENCE_KV.get(`migcode:${oldToken}`, { type: 'text' });
          if(!storedCode || storedCode !== migrationCode) {
            return respond(JSON.stringify({ error: 'Invalid or expired migration code' }), 401, cors);
          }
        }

        // Fetch existing token data
        const existingData = await env.REVERENCE_KV.get(oldToken, { type: 'text' });
        if(!existingData) {
          return respond(JSON.stringify({ error: 'Source account not found' }), 404, cors);
        }

        // Parse, update authMethod, write to new Google KV key
        const kvKey = `google:${payload.sub}`;
        let parsed;
        try { parsed = JSON.parse(existingData); } catch {
          return respond(JSON.stringify({ error: 'Corrupt source data' }), 500, cors);
        }

        parsed.authMethod   = 'google';
        parsed.linkedGoogle = payload;
        parsed.lastModified = Date.now();

        // Atomic-ish: write new key first, then tombstone old key
        await env.REVERENCE_KV.put(kvKey, JSON.stringify(parsed), {
          expirationTtl: KV_TTL,
        });

        // Tombstone old token — write a migration record so any remaining
        // devices using the old token get a clear "migrated" response
        await env.REVERENCE_KV.put(`migrated:${oldToken}`, kvKey, {
          expirationTtl: 60 * 60 * 24 * 90, // 90 days
        });

        // Clean up migration code if used
        if(migrationCode) {
          await env.REVERENCE_KV.delete(`migcode:${oldToken}`);
        }

        return respond(JSON.stringify({ ok: true, kvKey, profile: payload }), 200, cors);
      }

      // ── Route: /kv/:token ─────────────────────────────────────────
      const match = url.pathname.match(/^\/kv\/([^/]+)$/);
      if(!match) {
        return respondText('Not found', 404, cors);
      }

      const token = decodeURIComponent(match[1]);

      // Token validation — accepts:
      //   Legacy:  base-36 alphanumeric, 8–16 chars  (old Math.random() tokens)
      //   Secure:  base64url [A-Za-z0-9_-], 22 chars (new crypto.getRandomValues() tokens)
      //   Google:  "google:" + numeric sub claim, e.g. google:108676658761373445070
      const tokenValid = /^(google:\d{10,30}|[a-zA-Z0-9_-]{8,128})$/.test(token);
      if(!tokenValid) {
        return respondText('Invalid token format', 400, cors);
      }

      // ── Rate limiting (GET + PUT) ─────────────────────────────────
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { allowed, remaining } = await checkRateLimit(env, ip);
      if(!allowed) {
        return respondText('Too many requests — try again later.', 429, {
          ...cors,
          'Retry-After':           String(RATE_WINDOW_SECONDS),
          'X-RateLimit-Limit':     String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
        });
      }

      // ── Google account credential check ───────────────────────────
      // Google-keyed KV entries (google:<sub>) require a valid ID token
      // in the Authorization header on every read and write.
      // This ensures the Google auth benefit isn't undermined by an
      // open /kv/google:<sub> endpoint.
      const isGoogleKey = token.startsWith('google:');
      if(isGoogleKey) {
        const authHeader = request.headers.get('Authorization') || '';
        const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if(!idToken) {
          return respond(JSON.stringify({ error: 'Authorization required' }), 401, cors);
        }
        const payload = await verifyGoogleJWT(idToken);
        if(!payload) {
          return respond(JSON.stringify({ error: 'Invalid or expired Google token' }), 401, cors);
        }
        // Verify the token in the URL matches the verified sub claim
        if(token !== `google:${payload.sub}`) {
          return respond(JSON.stringify({ error: 'Token mismatch' }), 403, cors);
        }
      }

      // ── HMAC verification (token accounts) ───────────────────────
      // Token accounts must sign requests with HMAC-SHA256 derived from
      // their token via HKDF. Raw token never travels as bearer credential.
      // HMAC_REQUIRED flag allows gradual rollout — set to true once
      // all clients are updated to send signatures.
      if(!isGoogleKey) {
        const hmacResult = await verifyHmacSignature(request, token, '');
        if(!hmacResult.ok && HMAC_REQUIRED) {
          return respond(JSON.stringify({ error: `HMAC verification failed: ${hmacResult.reason}` }), 401, cors);
        }
      }

      // ── GET: retrieve data ────────────────────────────────────────
      if(method === 'GET') {
        // ── Migration tombstone check ─────────────────────────────
        const migratedTo = await env.REVERENCE_KV.get(`migrated:${token}`, { type: 'text' });
        if(migratedTo) {
          return respond(JSON.stringify({ migrated: true, authMethod: 'google' }), 410, {
            ...cors,
            'X-Account-Migrated': 'google',
          });
        }

        // ── Legacy forwarding pointer check ───────────────────────
        const forwardTo = await env.REVERENCE_KV.get(`legacy:${token}`, { type: 'text' });
        if(forwardTo) {
          const newData = await env.REVERENCE_KV.get(forwardTo, { type: 'text' });
          if(newData !== null) {
            return respond(newData, 200, {
              ...cors,
              'X-Token-Migrated':      forwardTo,
              'X-RateLimit-Remaining': String(remaining),
            });
          }
        }

        // Normal fetch
        const data = await env.REVERENCE_KV.get(token, { type: 'text' });
        if(data === null) return respondText('Not found', 404, cors);
        return respond(data, 200, {
          ...cors,
          'X-RateLimit-Remaining': String(remaining),
        });
      }

      // ── PUT: store data ───────────────────────────────────────────
      if(method === 'PUT') {
        let body;
        let parsed;
        try {
          body   = await request.text();
          parsed = JSON.parse(body);
        } catch {
          return respondText('Invalid JSON', 400, cors);
        }

        if(body.length > 5 * 1024 * 1024) {
          return respondText('Payload too large', 413, cors);
        }

        // Re-verify HMAC against the actual body now that we have it.
        // The earlier check used empty body (for GET); PUT needs the real body.
        if(!isGoogleKey) {
          const hmacResult = await verifyHmacSignature(request, token, body);
          if(!hmacResult.ok && HMAC_REQUIRED) {
            return respond(JSON.stringify({ error: `HMAC verification failed: ${hmacResult.reason}` }), 401, cors);
          }
        }

        // ── Legacy forwarding pointer ──────────────────────────────
        const legacyToken = parsed._legacyToken;
        if(legacyToken && typeof legacyToken === 'string' &&
           /^(google:\d{10,30}|[a-zA-Z0-9_-]{8,128})$/.test(legacyToken) &&
           legacyToken !== token) {
          delete parsed._legacyToken;
          body = JSON.stringify(parsed);
          await env.REVERENCE_KV.put(`legacy:${legacyToken}`, token, {
            expirationTtl: 60 * 60 * 24 * 90, // 90 days
          });
        }

        await env.REVERENCE_KV.put(token, body, { expirationTtl: KV_TTL });
        return respond(JSON.stringify({ ok: true }), 200, cors);
      }

      return respondText('Method not allowed', 405, cors);

    } catch(err) {
      // Surface errors without leaking internals; always include CORS
      // headers so browser doesn't misread a 500 as a CORS failure.
      const origin = checkOrigin(request);
      const cors   = origin ? corsHeaders(origin) : {};
      return respondText('Internal error', 500, cors);
    }
  },
};
