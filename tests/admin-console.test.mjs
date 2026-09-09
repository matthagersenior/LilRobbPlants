import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

test('Cloudflare Worker backend exposes D1, secure admin sessions, CORS, and CRUD routes', () => {
  for (const path of ['cloudflare/wrangler.jsonc', 'cloudflare/src/index.js', 'cloudflare/migrations/0001_initial.sql']) {
    assert.ok(existsSync(join(root, path)), `missing ${path}`);
  }
  const worker = read('cloudflare/src/index.js');
  const migration = read('cloudflare/migrations/0001_initial.sql');
  const config = read('cloudflare/wrangler.jsonc');
  assert.match(config, /"binding"\s*:\s*"DB"/);
  assert.doesNotMatch(config, /ADMIN_PASSWORD\s*[:=]/, 'password secret must never be committed to Wrangler config');
  assert.match(worker, /env\.DB/);
  assert.match(worker, /env\.ADMIN_PASSWORD/);
  assert.match(worker, /crypto\.getRandomValues|crypto\.randomUUID/);
  assert.match(worker, /Authorization/i);
  assert.match(worker, /Access-Control-Allow-Origin/);
  assert.match(worker, /\/api\/catalog/);
  assert.match(worker, /\/api\/settings/);
  assert.match(worker, /\/api\/admin\/login/);
  assert.match(worker, /\/api\/admin\/products/);
  assert.match(migration, /create table if not exists products/i);
  assert.match(migration, /create table if not exists store_settings/i);
  assert.match(migration, /create table if not exists admin_sessions/i);
  assert.doesNotMatch(worker, /service_role|supabase/i);
});

test('Pages source includes a dedicated Cloudflare-backed admin console without Supabase client code', () => {
  for (const path of ['preview/config.js', 'preview/admin/index.html', 'preview/admin/admin.css', 'preview/admin/admin.js']) {
    assert.ok(existsSync(join(root, path)), `missing ${path}`);
  }

  const html = read('preview/admin/index.html');
  const admin = read('preview/admin/admin.js');
  assert.match(html, /Admin Control Console/i);
  assert.match(html, /type="password"/i);
  assert.match(html, /Inventory/i);
  assert.match(html, /Shipping/i);
  assert.match(html, /Coming Soon/i);
  assert.doesNotMatch(html, /supabase/i);
  assert.match(admin, /\/api\/admin\/login/);
  assert.match(admin, /sessionStorage/);
  assert.match(admin, /Authorization/);
});

test('storefront supports live Cloudflare catalog and settings with static fallback', () => {
  const html = read('preview/index.html');
  const app = read('preview/app.js');
  const config = read('preview/config.js');
  assert.match(html, /config\.js/i);
  assert.doesNotMatch(html, /supabase/i);
  assert.match(config, /LIL_ROBB_API/);
  assert.match(app, /\/api\/catalog/);
  assert.match(app, /\/api\/settings/);
  assert.match(app, /__LIL_ROBB_PRODUCTS__/);
  assert.match(app, /fallback/i);
});
