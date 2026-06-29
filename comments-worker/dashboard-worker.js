const json = (data, status = 200, corsHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });

function cors(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = env.ALLOWED_ORIGIN || 'https://perust.github.io';
  const headers = {
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
  };

  if (origin === allowed || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    headers['access-control-allow-origin'] = origin;
  }
  return headers;
}

function cleanText(value, fallback, max) {
  const text = String(value || fallback)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, max);
}

function maskIp(ip) {
  if (!ip) return 'unknown';
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    return `${parts.slice(0, 3).join(':')}:xxxx`;
  }
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
  return 'unknown';
}

async function sha256(input) {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) formData.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });
  const result = await response.json();
  return result.success === true;
}

function hasTooManyLinks(body) {
  const links = body.match(/https?:\/\//gi) || [];
  return links.length > 2;
}

async function isRateLimited(env, ipHash) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare('SELECT last_comment_at, comment_count FROM rate_limits WHERE ip_hash = ?')
    .bind(ipHash)
    .first();

  if (row && now - row.last_comment_at < 60) return true;

  if (row) {
    await env.DB.prepare('UPDATE rate_limits SET last_comment_at = ?, comment_count = comment_count + 1 WHERE ip_hash = ?')
      .bind(now, ipHash)
      .run();
  } else {
    await env.DB.prepare('INSERT INTO rate_limits (ip_hash, last_comment_at, comment_count) VALUES (?, ?, 1)')
      .bind(ipHash, now)
      .run();
  }
  return false;
}

async function listComments(request, env, corsHeaders) {
  const url = new URL(request.url);
  const postSlug = cleanText(url.searchParams.get('slug'), '', 140);
  if (!postSlug) return json({ error: 'post slug is required' }, 400, corsHeaders);

  const rows = await env.DB.prepare(
    `SELECT id, post_slug AS postSlug, nickname, body, ip_prefix AS ipPrefix, created_at AS createdAt
     FROM comments
     WHERE post_slug = ? AND status = 'approved'
     ORDER BY created_at ASC`
  ).bind(postSlug).all();

  return json({ comments: rows.results || [] }, 200, corsHeaders);
}

async function createComment(request, env, corsHeaders) {
  const payload = await request.json().catch(() => ({}));
  const postSlug = cleanText(payload.postSlug, '', 140);
  const nickname = cleanText(payload.nickname, '익명', 40) || '익명';
  const body = cleanText(payload.body, '', 800);

  if (!postSlug) return json({ error: 'post slug is required' }, 400, corsHeaders);
  if (body.length < 2) return json({ error: '댓글을 2자 이상 입력해 주세요.' }, 400, corsHeaders);
  if (hasTooManyLinks(body)) return json({ error: '링크는 2개까지만 넣을 수 있습니다.' }, 400, corsHeaders);

  const turnstileOk = await verifyTurnstile(payload.turnstileToken, request, env);
  if (!turnstileOk) return json({ error: '봇 방지 확인에 실패했습니다.' }, 400, corsHeaders);

  const rawIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const ipPrefix = maskIp(rawIp);
  const ipHash = await sha256(`${rawIp}:${env.IP_SALT || 'change-me'}`);

  if (await isRateLimited(env, ipHash)) {
    return json({ error: '댓글은 1분에 한 번만 작성할 수 있습니다.' }, 429, corsHeaders);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO comments (id, post_slug, nickname, body, ip_prefix, ip_hash, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`
  ).bind(id, postSlug, nickname, body, ipPrefix, ipHash).run();

  return json({ ok: true, status: 'pending', message: '댓글이 저장되었습니다. 확인 후 공개됩니다.' }, 201, corsHeaders);
}

async function adminUpdate(request, env, corsHeaders) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return json({ error: 'unauthorized' }, 401, corsHeaders);

  const body = await request.json().catch(() => ({}));
  if (!body.id || !body.status || !['approved', 'rejected'].includes(body.status)) {
    return json({ error: 'id and status are required' }, 400, corsHeaders);
  }

  await env.DB.prepare(`UPDATE comments SET status = ?, approved_at = datetime('now') WHERE id = ?`)
    .bind(body.status, body.id)
    .run();
  return json({ ok: true }, 200, corsHeaders);
}

export default {
  async fetch(request, env) {
    const corsHeaders = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    const url = new URL(request.url);
    try {
      if (request.method === 'GET' && url.pathname === '/comments') return listComments(request, env, corsHeaders);
      if (request.method === 'POST' && url.pathname === '/comments') return createComment(request, env, corsHeaders);
      if (request.method === 'POST' && url.pathname === '/admin/comments') return adminUpdate(request, env, corsHeaders);
      return json({ error: 'not found' }, 404, corsHeaders);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'server error' }, 500, corsHeaders);
    }
  },
};
