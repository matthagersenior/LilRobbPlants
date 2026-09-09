import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'layout/theme.liquid',
  'config/settings_schema.json',
  'config/settings_data.json',
  'locales/en.default.json'
];

const read = (path) => readFileSync(join(root, path), 'utf8');

test('Shopify theme skeleton exposes required global files', () => {
  for (const path of required) {
    assert.ok(existsSync(join(root, path)), `missing ${path}`);
  }
});

test('theme layout exposes Shopify rendering seams', () => {
  const layout = read('layout/theme.liquid');
  assert.match(layout, /content_for_header/);
  assert.match(layout, /content_for_layout/);
  assert.match(layout, /sections\s+'header-group'/);
  assert.match(layout, /sections\s+'footer-group'/);
});

test('theme JSON parses and low-stock threshold is merchant configurable', () => {
  const settings = JSON.parse(read('config/settings_schema.json'));
  JSON.parse(read('config/settings_data.json'));
  JSON.parse(read('locales/en.default.json'));
  const allSettings = settings.flatMap((group) => group.settings || []);
  const threshold = allSettings.find((setting) => setting.id === 'low_stock_threshold');
  assert.ok(threshold, 'missing low_stock_threshold setting');
  assert.equal(threshold.type, 'range');
});
