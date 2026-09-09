import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

test('admin backend SQL protects public tables with RLS and owner-only writes', () => {
  const path = 'supabase/lil-robb-admin.sql';
  assert.ok(existsSync(join(root, path)), `missing ${path}`);
  const sql = read(path);
  for (const table of ['lil_robb_products', 'lil_robb_store_settings', 'lil_robb_admin_users']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  }
  assert.match(sql, /for select\s+to anon/i);
  assert.match(sql, /is_published\s*=\s*true/i);
  assert.match(sql, /for (insert|update|delete)[\s\S]*to authenticated/i);
  assert.match(sql, /lil_robb_admin_users/i);
  assert.match(sql, /claim_lil_robb_owner/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = ''/i);
  assert.match(sql, /revoke execute on function public\.claim_lil_robb_owner\(text\) from public, anon/i);
  assert.match(sql, /grant execute on function public\.claim_lil_robb_owner\(text\) to authenticated/i);
  assert.doesNotMatch(sql, /service_role|sb_secret_/i);
});

test('Pages build includes a dedicated admin console and pinned Supabase browser client', () => {
  rmSync(join(root, 'preview/dist'), { recursive: true, force: true });
  const result = spawnSync(process.execPath, ['scripts/build-preview.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  for (const path of ['preview/dist/config.js', 'preview/dist/admin/index.html', 'preview/dist/admin/admin.css', 'preview/dist/admin/admin.js']) {
    assert.ok(existsSync(join(root, path)), `missing built ${path}`);
  }

  const html = read('preview/dist/admin/index.html');
  assert.match(html, /Admin Control Console/i);
  assert.match(html, /type="email"/i);
  assert.match(html, /type="password"/i);
  assert.match(html, /bootstrap/i);
  assert.match(html, /Inventory/i);
  assert.match(html, /Shipping/i);
  assert.match(html, /Coming Soon/i);
  assert.match(html, /@supabase\/supabase-js@2\.116\.0/i);
});

test('storefront supports live Supabase catalog and settings with static fallback', () => {
  const html = read('preview/index.html');
  const app = read('preview/app.js');
  const config = read('preview/config.js');
  assert.match(html, /config\.js/i);
  assert.match(html, /@supabase\/supabase-js@2\.116\.0/i);
  assert.match(config, /LIL_ROBB_SUPABASE/);
  assert.match(app, /lil_robb_products/);
  assert.match(app, /lil_robb_store_settings/);
  assert.match(app, /__LIL_ROBB_PRODUCTS__/);
  assert.match(app, /fallback/i);
});
