import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── VAPID JWT helpers ────────────────────────────────────────────────────────

function base64UrlEncode(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function buildVapidJwt(
  audience: string,
  subject: string,
  privateKeyB64: string
): Promise<string> {
  const header = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    new TextEncoder().encode(
      JSON.stringify({ aud: audience, exp: now + 43200, sub: subject })
    )
  );

  const signingInput = `${header}.${payload}`;

  // Import private key (raw 32-byte scalar)
  const rawKey = base64UrlDecode(privateKeyB64);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );

  // Re-export as JWK to get d, then import as ECDSA signing key
  const jwk = await crypto.subtle.exportKey('jwk', cryptoKey) as JsonWebKey;
  const signingKey = await crypto.subtle.importKey(
    'jwk',
    { ...jwk, key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

// ─── Web Push encryption (RFC 8291 / aes128gcm) ──────────────────────────────

async function encrypt(
  plaintext: string,
  receiverPublicKeyB64: string,
  authB64: string
): Promise<{ ciphertext: ArrayBuffer; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();

  // Generate ephemeral EC key pair
  const ephemeralPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const serverPublicKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', ephemeralPair.publicKey)
  );

  const receiverPublicKey = await crypto.subtle.importKey(
    'raw',
    base64UrlDecode(receiverPublicKeyB64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: receiverPublicKey },
      ephemeralPair.privateKey,
      256
    )
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authSecret = base64UrlDecode(authB64);
  const receiverPubKeyRaw = base64UrlDecode(receiverPublicKeyB64);

  // HKDF-SHA-256 PRK
  const ikm = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveBits']);

  const prkInfo = concat(encoder.encode('WebPush: info\x00'), receiverPubKeyRaw, serverPublicKey);
  const prk = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: prkInfo },
      ikm,
      256
    )
  );

  const prkKey = await crypto.subtle.importKey('raw', prk, 'HKDF', false, ['deriveBits']);

  // CEK + nonce
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\x00');
  const nonceInfo = encoder.encode('Content-Encoding: nonce\x00');

  const cekBytes = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo }, prkKey, 128)
  );
  const nonceBytes = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo }, prkKey, 96)
  );

  const cek = await crypto.subtle.importKey('raw', cekBytes, 'AES-GCM', false, ['encrypt']);

  // Plaintext with padding delimiter
  const data = concat(encoder.encode(plaintext), new Uint8Array([2]));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonceBytes, tagLength: 128 },
    cek,
    data
  );

  return { ciphertext, salt, serverPublicKey };
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

function uint32Be(n: number): Uint8Array {
  const buf = new Uint8Array(4);
  new DataView(buf.buffer).setUint32(0, n, false);
  return buf;
}

function buildHttpBody(
  ciphertext: ArrayBuffer,
  salt: Uint8Array,
  serverPublicKey: Uint8Array,
  rs = 4096
): Uint8Array {
  // aes128gcm record structure header
  return concat(
    salt,
    uint32Be(rs),
    new Uint8Array([serverPublicKey.length]),
    serverPublicKey,
    new Uint8Array(ciphertext)
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { user_id, title, body, url } = await req.json() as {
      user_id: string;
      title: string;
      body: string;
      url?: string;
    };

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'user_id, title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all subscriptions for the user
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id);

    if (subErr) throw subErr;
    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      url: url ?? '/',
    });

    const results: { endpoint: string; status: number | string }[] = [];

    for (const sub of subs) {
      try {
        const origin = new URL(sub.endpoint).origin;
        const jwt = await buildVapidJwt(
          origin,
          'mailto:ntigibeshyagedeon@gmail.com',
          VAPID_PRIVATE_KEY
        );

        const { ciphertext, salt, serverPublicKey } = await encrypt(
          payload,
          sub.p256dh,
          sub.auth
        );

        const body = buildHttpBody(ciphertext, salt, serverPublicKey);

        const res = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            TTL: '86400',
          },
          body,
        });

        // 410 Gone = subscription expired; clean it up
        if (res.status === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }

        results.push({ endpoint: sub.endpoint.slice(0, 40) + '...', status: res.status });
      } catch (e) {
        results.push({ endpoint: sub.endpoint.slice(0, 40) + '...', status: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ sent: results.length, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
