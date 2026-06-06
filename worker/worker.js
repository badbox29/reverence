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
 * SECURITY NOTE:
 *   The user token acts as both the key and the secret. Anyone who
 *   knows a token can read and overwrite that user's data. Keep your
 *   token private. For production use, add an Authorization header
 *   check or Cloudflare Access in front of the worker.
 * ─────────────────────────────────────────────────────────────────
 */

export default {
  async fetch(request, env) {
    const url     = new URL(request.url);
    const method  = request.method.toUpperCase();

    // ── CORS — allow the app to call the worker from any origin ───
    const corsHeaders = {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if(method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ── Route: /kv/:token ─────────────────────────────────────────
    const match = url.pathname.match(/^\/kv\/([^/]+)$/);
    if(!match) {
      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    const token = decodeURIComponent(match[1]);

    // Validate token — only alphanumeric + hyphens, 8–64 chars
    if(!/^[a-zA-Z0-9_-]{8,64}$/.test(token)) {
      return new Response('Invalid token', { status: 400, headers: corsHeaders });
    }

    // ── GET: retrieve data ────────────────────────────────────────
    if(method === 'GET') {
      const data = await env.REVERENCE_KV.get(token, { type: 'text' });
      if(data === null) {
        return new Response('Not found', { status: 404, headers: corsHeaders });
      }
      return new Response(data, {
        status:  200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── PUT: store data ───────────────────────────────────────────
    if(method === 'PUT') {
      let body;
      try {
        body = await request.text();
        JSON.parse(body); // validate it's real JSON before storing
      } catch {
        return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
      }

      // Cap payload at 5 MB (KV limit is 25 MB but let's be safe)
      if(body.length > 5 * 1024 * 1024) {
        return new Response('Payload too large', { status: 413, headers: corsHeaders });
      }

      // Store with 1-year expiry (Cloudflare KV TTL in seconds)
      await env.REVERENCE_KV.put(token, body, {
        expirationTtl: 60 * 60 * 24 * 365,
      });

      return new Response(JSON.stringify({ ok: true }), {
        status:  200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  },
};
