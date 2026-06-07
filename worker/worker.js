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

// Rate limiting — sliding window
const RATE_WINDOW_SECONDS = 60 * 60;       // 1 hour window
const MAX_REQUESTS_PER_WINDOW = 60;        // max GET attempts per IP per hour
const RATE_KEY_TTL = RATE_WINDOW_SECONDS * 2; // KV TTL for rate limit entries

// Google OAuth — set this to your Google Cloud OAuth Client ID when ready.
// The worker uses it to verify ID tokens issued by Google.
const GOOGLE_CLIENT_ID = '816310286560-4tgoor67vdu5jh65nlul0lr78rkrc5bc.apps.googleusercontent.com';

// ── Google JWT verification (stub) ───────────────────────────────
// Verifies a Google ID token by checking the signature against
// Google's public keys and validating aud, iss, and exp claims.
// STUB: returns null until GOOGLE_CLIENT_ID is set and implementation
// is complete. Safe to call — callers check for null return.
async function verifyGoogleJWT(idToken) {
  if(!GOOGLE_CLIENT_ID) {
    console.warn('[Auth] verifyGoogleJWT called but GOOGLE_CLIENT_ID not set.');
    return null;
  }
  // TODO: fetch https://www.googleapis.com/oauth2/v3/certs
  // Decode JWT header to get kid, find matching key, verify RS256 signature.
  // Validate: aud === GOOGLE_CLIENT_ID, iss in ['accounts.google.com',
  // 'https://accounts.google.com'], exp > Date.now()/1000.
  // Return decoded payload { sub, email, name, picture } on success, null on failure.
  console.log('[Auth] verifyGoogleJWT() stub called — not yet implemented.');
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────
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
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

      // ── Auth routes (Google OAuth — stub, not yet implemented) ────
      // POST /auth/google  — verify Google ID token, return KV key (sub)
      // POST /auth/verify  — verify an existing Google session is still valid
      // POST /auth/migrate — migrate a token account to Google (10-min TTL flow)
      if(url.pathname === '/auth/google') {
        if(method !== 'POST') return respondText('Method not allowed', 405, cors);
        if(!GOOGLE_CLIENT_ID) {
          return respond(JSON.stringify({ error: 'Google auth not configured' }), 501, cors);
        }
        // TODO: read idToken from request body, call verifyGoogleJWT(),
        // derive KV key from sub claim, return { ok, kvKey } to app.
        return respond(JSON.stringify({ error: 'Not implemented' }), 501, cors);
      }

      if(url.pathname === '/auth/verify') {
        if(method !== 'POST') return respondText('Method not allowed', 405, cors);
        if(!GOOGLE_CLIENT_ID) {
          return respond(JSON.stringify({ error: 'Google auth not configured' }), 501, cors);
        }
        // TODO: verify the stored credential is still valid (not expired).
        return respond(JSON.stringify({ error: 'Not implemented' }), 501, cors);
      }

      if(url.pathname === '/auth/migrate') {
        if(method !== 'POST') return respondText('Method not allowed', 405, cors);
        if(!GOOGLE_CLIENT_ID) {
          return respond(JSON.stringify({ error: 'Google auth not configured' }), 501, cors);
        }
        // TODO: implement one-way token→Google migration flow.
        // Verify token ownership + Google JWT, copy data atomically,
        // invalidate old token, write migration record.
        return respond(JSON.stringify({ error: 'Not implemented' }), 501, cors);
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
      // Both patterns share the same character set so one regex covers both:
      const tokenValid = /^[a-zA-Z0-9_-]{8,128}$/.test(token);
      if(!tokenValid) {
        return respondText('Invalid token format', 400, cors);
      }

      // ── Rate limiting (GET only — writes require knowing the token) ──
      if(method === 'GET') {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const { allowed, remaining } = await checkRateLimit(env, ip);

        if(!allowed) {
          return respondText('Too many requests — try again later.', 429, {
            ...cors,
            'Retry-After': String(RATE_WINDOW_SECONDS),
            'X-RateLimit-Limit':     String(MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': '0',
          });
        }

        // ── Legacy forwarding pointer check ───────────────────────
        // When a token is migrated to a new secure token, a pointer is
        // written at "legacy:<oldtoken>" containing the new token string.
        // Subsequent devices using the old token are transparently served
        // the new token's data and told to adopt the new token via header.
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
          // Pointer exists but new key is gone — fall through to 404
        }

        // Normal fetch
        const data = await env.REVERENCE_KV.get(token, { type: 'text' });
        if(data === null) {
          return respondText('Not found', 404, cors);
        }
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
          parsed = JSON.parse(body); // validate JSON before storing
        } catch {
          return respondText('Invalid JSON', 400, cors);
        }

        // Cap payload at 5 MB (KV limit is 25 MB but let's be safe)
        if(body.length > 5 * 1024 * 1024) {
          return respondText('Payload too large', 413, cors);
        }

        // ── Legacy forwarding pointer ──────────────────────────────
        // If the app signals a token migration by including _legacyToken
        // in the payload, write a forwarding pointer at "legacy:<oldtoken>"
        // pointing to the new token. The pointer TTL is 90 days — long
        // enough for all devices to naturally cycle through and self-migrate.
        // Strip _legacyToken from the stored data blob before saving.
        const legacyToken = parsed._legacyToken;
        if(legacyToken && typeof legacyToken === 'string' &&
           /^[a-zA-Z0-9_-]{8,128}$/.test(legacyToken) &&
           legacyToken !== token) {
          delete parsed._legacyToken;
          body = JSON.stringify(parsed);

          await env.REVERENCE_KV.put(`legacy:${legacyToken}`, token, {
            expirationTtl: 60 * 60 * 24 * 90, // 90 days
          });
        }

        await env.REVERENCE_KV.put(token, body, {
          expirationTtl: 60 * 60 * 24 * 365, // 1 year
        });

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
