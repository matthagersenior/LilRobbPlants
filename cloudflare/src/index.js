import { INITIAL_PRODUCTS } from './seed-products.js';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const PRODUCT_FIELDS = [
  'id', 'title', 'description', 'species', 'price', 'inventory', 'light', 'watering', 'soil',
  'growing_conditions', 'difficulty', 'humidity', 'mature_size', 'pet_safety', 'care_notes',
  'image_url', 'art_variant', 'is_published'
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(request, env)) return json({ error: 'Origin not allowed' }, 403, cors);
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (!env.DB) return json({ error: 'D1 binding DB is not configured' }, 503, cors);
      await ensureDatabase(env.DB);

      if (request.method === 'GET' && url.pathname === '/api/health') {
        return json({ ok: true, service: 'lil-robb-plants-api' }, 200, cors);
      }
      if (request.method === 'GET' && url.pathname === '/api/catalog') {
        const { results = [] } = await env.DB.prepare('SELECT * FROM products WHERE is_published = 1 ORDER BY title').all();
        return json(results.map(publicProduct), 200, cors);
      }
      if (request.method === 'GET' && url.pathname === '/api/settings') {
        return json(await getSettings(env.DB), 200, cors);
      }
      if (request.method === 'POST' && url.pathname === '/api/admin/login') {
        if (!isAllowedOrigin(request, env)) return json({ error: 'Origin not allowed' }, 403, cors);
        return handleLogin(request, env, cors);
      }

      if (url.pathname.startsWith('/api/admin/')) {
        if (!isAllowedOrigin(request, env)) return json({ error: 'Origin not allowed' }, 403, cors);
        const session = await requireAdmin(request, env.DB);
        if (!session) return json({ error: 'Unauthorized' }, 401, cors);

        if (request.method === 'POST' && url.pathname === '/api/admin/logout') {
          await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(session.tokenHash).run();
          return json({ ok: true }, 200, cors);
        }
        if (request.method === 'GET' && url.pathname === '/api/admin/products') {
          const { results = [] } = await env.DB.prepare('SELECT * FROM products ORDER BY title').all();
          return json(results.map(adminProduct), 200, cors);
        }
        if (request.method === 'POST' && url.pathname === '/api/admin/products') {
          const body = normalizeProduct(await readJson(request));
          const now = Date.now();
          await env.DB.prepare(`INSERT INTO products (${PRODUCT_FIELDS.join(',')}, created_at, updated_at) VALUES (${PRODUCT_FIELDS.map(() => '?').join(',')}, ?, ?)`)
            .bind(...PRODUCT_FIELDS.map((field) => body[field]), now, now).run();
          return json(adminProduct(await getProduct(env.DB, body.id)), 201, cors);
        }
        const productMatch = url.pathname.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
        if (productMatch && request.method === 'PUT') {
          const id = productMatch[1];
          const body = normalizeProduct({ ...(await readJson(request)), id });
          const assignments = PRODUCT_FIELDS.filter((field) => field !== 'id').map((field) => `${field} = ?`).join(', ');
          const result = await env.DB.prepare(`UPDATE products SET ${assignments}, updated_at = ? WHERE id = ?`)
            .bind(...PRODUCT_FIELDS.filter((field) => field !== 'id').map((field) => body[field]), Date.now(), id).run();
          if (!result.meta?.changes) return json({ error: 'Plant not found' }, 404, cors);
          return json(adminProduct(await getProduct(env.DB, id)), 200, cors);
        }
        if (productMatch && request.method === 'DELETE') {
          const result = await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(productMatch[1]).run();
          if (!result.meta?.changes) return json({ error: 'Plant not found' }, 404, cors);
          return json({ ok: true }, 200, cors);
        }
        if (request.method === 'GET' && url.pathname === '/api/admin/settings') {
          return json(await getSettings(env.DB), 200, cors);
        }
        if (request.method === 'PUT' && url.pathname === '/api/admin/settings') {
          const body = await readJson(request);
          const settings = normalizeSettings(body);
          await env.DB.prepare(`UPDATE store_settings SET announcement = ?, standard_shipping = ?, free_shipping_threshold = ?, local_pickup_enabled = ?, coming_soon = ?, updated_at = ? WHERE id = 1`)
            .bind(settings.announcement, settings.standard_shipping, settings.free_shipping_threshold, settings.local_pickup_enabled, settings.coming_soon, Date.now()).run();
          return json(await getSettings(env.DB), 200, cors);
        }
      }

      return json({ error: 'Not found' }, 404, cors);
    } catch (error) {
      console.error(error);
      const message = error instanceof ClientError ? error.message : 'Unexpected server error';
      const status = error instanceof ClientError ? error.status : 500;
      return json({ error: message }, status, cors);
    }
  }
};

class ClientError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

async function ensureDatabase(db) {
  const now = Date.now();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',species TEXT NOT NULL DEFAULT '',price REAL NOT NULL DEFAULT 0,inventory INTEGER NOT NULL DEFAULT 0,light TEXT NOT NULL DEFAULT '',watering TEXT NOT NULL DEFAULT '',soil TEXT NOT NULL DEFAULT '',growing_conditions TEXT NOT NULL DEFAULT '',difficulty TEXT NOT NULL DEFAULT '',humidity TEXT NOT NULL DEFAULT '',mature_size TEXT NOT NULL DEFAULT '',pet_safety TEXT NOT NULL DEFAULT '',care_notes TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',art_variant INTEGER NOT NULL DEFAULT 0,is_published INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS store_settings (id INTEGER PRIMARY KEY,announcement TEXT NOT NULL,standard_shipping REAL NOT NULL,free_shipping_threshold REAL NOT NULL,local_pickup_enabled INTEGER NOT NULL,coming_soon INTEGER NOT NULL,updated_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY,failures INTEGER NOT NULL DEFAULT 0,locked_until INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL)`),
    db.prepare(`INSERT OR IGNORE INTO store_settings (id,announcement,standard_shipping,free_shipping_threshold,local_pickup_enabled,coming_soon,updated_at) VALUES (1,?,?,?,?,?,?)`)
      .bind('online ordering is not open yet. Browse the launch collection and build a cart now.', 10, 75, 1, 1, now),
    db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now)
  ]);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM products').first();
  if (Number(count?.count || 0) === 0) {
    const statements = INITIAL_PRODUCTS.map((product) => {
      const fields = PRODUCT_FIELDS;
      return db.prepare(`INSERT INTO products (${fields.join(',')},created_at,updated_at) VALUES (${fields.map(() => '?').join(',')},?,?)`)
        .bind(...fields.map((field) => product[field]), now, now);
    });
    await db.batch(statements);
  }

  // Upgrade only original placeholder/Wikimedia images; never replace merchant-supplied photography.
  const representativeImageUpdates = INITIAL_PRODUCTS.map((product) =>
    db.prepare("UPDATE products SET image_url = ?, updated_at = ? WHERE id = ? AND (image_url = '' OR image_url LIKE 'https://commons.wikimedia.org/%')")
      .bind(product.image_url, now, product.id)
  );
  await db.batch(representativeImageUpdates);
}

async function handleLogin(request, env, cors) {
  if (!env.ADMIN_PASSWORD) return json({ error: 'ADMIN_PASSWORD secret is not configured' }, 503, cors);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const attempt = await env.DB.prepare('SELECT failures, locked_until FROM login_attempts WHERE ip = ?').bind(ip).first();
  if (Number(attempt?.locked_until || 0) > now) {
    return json({ error: 'Too many failed attempts. Try again later.' }, 429, cors);
  }
  const body = await readJson(request);
  const supplied = typeof body.password === 'string' ? body.password : '';
  const matches = await secretEqual(supplied, env.ADMIN_PASSWORD);
  if (!matches) {
    const failures = Number(attempt?.failures || 0) + 1;
    const lockedUntil = failures >= MAX_LOGIN_FAILURES ? now + LOGIN_LOCK_MS : 0;
    await env.DB.prepare(`INSERT INTO login_attempts (ip,failures,locked_until,updated_at) VALUES (?,?,?,?) ON CONFLICT(ip) DO UPDATE SET failures=excluded.failures,locked_until=excluded.locked_until,updated_at=excluded.updated_at`)
      .bind(ip, failures, lockedUntil, now).run();
    return json({ error: lockedUntil ? 'Too many failed attempts. Try again in 15 minutes.' : 'Incorrect password' }, lockedUntil ? 429 : 401, cors);
  }
  await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
  const token = randomToken();
  const tokenHash = await sha256(token);
  const expiresAt = now + SESSION_TTL_MS;
  await env.DB.prepare('INSERT INTO admin_sessions (token_hash,expires_at,created_at) VALUES (?,?,?)').bind(tokenHash, expiresAt, now).run();
  return json({ token, expiresAt }, 200, cors);
}

async function requireAdmin(request, db) {
  const auth = request.headers.get('Authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const tokenHash = await sha256(match[1]);
  const row = await db.prepare('SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).first();
  if (!row || Number(row.expires_at) <= Date.now()) {
    if (row) await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return { tokenHash, expiresAt: Number(row.expires_at) };
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function secretEqual(a, b) {
  const [leftHex, rightHex] = await Promise.all([sha256(a), sha256(b)]);
  const left = new TextEncoder().encode(leftHex);
  const right = new TextEncoder().encode(rightHex);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) diff |= (left[i % left.length] || 0) ^ (right[i % right.length] || 0);
  return diff === 0;
}

async function readJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new ClientError('Expected application/json');
  try { return await request.json(); }
  catch { throw new ClientError('Invalid JSON'); }
}

function normalizeProduct(input) {
  const id = String(input.id || '').trim();
  if (!/^[a-z0-9-]{2,80}$/.test(id)) throw new ClientError('Plant ID must use lowercase letters, numbers, and hyphens');
  const title = String(input.title || '').trim();
  if (!title) throw new ClientError('Plant name is required');
  return {
    id,
    title,
    description: text(input.description),
    species: text(input.species),
    price: nonNegativeNumber(input.price, 'Price'),
    inventory: Math.floor(nonNegativeNumber(input.inventory, 'Inventory')),
    light: text(input.light),
    watering: text(input.watering),
    soil: text(input.soil),
    growing_conditions: text(input.growing_conditions),
    difficulty: text(input.difficulty),
    humidity: text(input.humidity),
    mature_size: text(input.mature_size),
    pet_safety: text(input.pet_safety),
    care_notes: text(input.care_notes),
    image_url: text(input.image_url),
    art_variant: Math.min(4, Math.max(0, Math.floor(Number(input.art_variant) || 0))),
    is_published: truthy(input.is_published) ? 1 : 0
  };
}

function normalizeSettings(input) {
  return {
    announcement: text(input.announcement) || 'online ordering is not open yet. Browse the launch collection and build a cart now.',
    standard_shipping: nonNegativeNumber(input.standard_shipping, 'Standard shipping'),
    free_shipping_threshold: nonNegativeNumber(input.free_shipping_threshold, 'Free shipping threshold'),
    local_pickup_enabled: truthy(input.local_pickup_enabled) ? 1 : 0,
    coming_soon: truthy(input.coming_soon) ? 1 : 0
  };
}

function text(value) { return value == null ? '' : String(value).trim(); }
function truthy(value) { return value === true || value === 1 || value === '1' || value === 'true' || value === 'on'; }
function nonNegativeNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new ClientError(`${label} must be zero or greater`);
  return number;
}

async function getProduct(db, id) {
  const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  if (!row) throw new ClientError('Plant not found', 404);
  return row;
}

async function getSettings(db) {
  const row = await db.prepare('SELECT * FROM store_settings WHERE id = 1').first();
  return settingsJson(row || {});
}

function publicProduct(row) { return adminProduct(row); }
function adminProduct(row) {
  return {
    ...row,
    price: Number(row.price),
    inventory: Number(row.inventory),
    art_variant: Number(row.art_variant || 0),
    is_published: Boolean(row.is_published)
  };
}
function settingsJson(row) {
  return {
    announcement: row.announcement || '',
    standard_shipping: Number(row.standard_shipping ?? 10),
    free_shipping_threshold: Number(row.free_shipping_threshold ?? 75),
    local_pickup_enabled: Boolean(row.local_pickup_enabled),
    coming_soon: row.coming_soon !== 0
  };
}

function allowedOrigin(env) { return env.ALLOWED_ORIGIN || 'https://matthagersenior.github.io'; }
function isAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  if (origin === allowedOrigin(env)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  });
  if (origin && isAllowedOrigin(request, env)) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}
function json(data, status, extraHeaders) {
  const headers = new Headers(extraHeaders);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { status, headers });
}
