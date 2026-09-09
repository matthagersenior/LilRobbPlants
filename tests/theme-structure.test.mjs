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

const templateNames = ['index', 'product', 'collection', 'search', 'cart', 'page', '404'];

test('JSON templates only reference sections that exist', () => {
  for (const name of templateNames) {
    const templatePath = `templates/${name}.json`;
    assert.ok(existsSync(join(root, templatePath)), `missing ${templatePath}`);
    const template = JSON.parse(read(templatePath));
    for (const [id, section] of Object.entries(template.sections || {})) {
      assert.ok(
        existsSync(join(root, `sections/${section.type}.liquid`)),
        `${templatePath} section ${id} references missing ${section.type}`
      );
    }
  }
});

test('product experience uses Shopify product form and availability guard', () => {
  const productSection = read('sections/main-product.liquid');
  assert.match(productSection, /form\s+'product'/);
  assert.match(productSection, /selected_or_first_available_variant/);
  assert.match(productSection, /selected_variant\.available/);
  assert.match(productSection, /name="id"/);
  assert.match(productSection, /name="quantity"/);
});

test('plant care reads the complete approved metafield contract', () => {
  const care = read('snippets/plant-care.liquid');
  for (const key of ['species', 'light', 'watering', 'soil', 'growing_conditions', 'difficulty', 'humidity', 'mature_size', 'pet_safety', 'care_notes']) {
    assert.match(care, new RegExp(`metafields\\.plant\\.${key}`), `missing plant.${key}`);
  }
});

test('collection and search render reusable inventory-aware plant cards', () => {
  assert.match(read('sections/main-collection.liquid'), /render\s+'plant-card'/);
  assert.match(read('sections/main-search.liquid'), /render\s+'plant-card'/);
  const card = read('snippets/plant-card.liquid');
  assert.match(card, /render\s+'inventory-status'/);
  assert.match(card, /form\s+'product'/);
  assert.match(card, /product\.metafields\.plant\.species/);
});

test('cart exposes update remove and checkout controls', () => {
  const cart = read('sections/main-cart.liquid');
  assert.match(cart, /form\s+'cart'/);
  assert.match(cart, /updates\[\]/);
  assert.match(cart, /url_to_remove/);
  assert.match(cart, /name="update"/);
  assert.match(cart, /name="checkout"/);
});
