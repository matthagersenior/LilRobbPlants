import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

test('GitHub Pages preview has a build script, source files, and deployment workflow', () => {
  for (const path of [
    'scripts/build-preview.mjs',
    'preview/index.html',
    'preview/styles.css',
    'preview/app.js',
    '.github/workflows/pages.yml'
  ]) {
    assert.ok(existsSync(join(root, path)), `missing ${path}`);
  }

  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['build:preview'], 'node scripts/build-preview.mjs');

  const workflow = read('.github/workflows/pages.yml');
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /npm run build:preview/);
  assert.match(workflow, /preview\/dist/);
});

test('Pages preview build emits all ten sample products and a coming-soon checkout state', () => {
  rmSync(join(root, 'preview/dist'), { recursive: true, force: true });
  const result = spawnSync(process.execPath, ['scripts/build-preview.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  for (const path of ['preview/dist/index.html', 'preview/dist/styles.css', 'preview/dist/app.js', 'preview/dist/products.json', 'preview/dist/.nojekyll']) {
    assert.ok(existsSync(join(root, path)), `missing built ${path}`);
  }

  const products = JSON.parse(read('preview/dist/products.json'));
  assert.equal(products.length, 10);
  for (const product of products) {
    assert.ok(product.title);
    assert.ok(product.species);
    assert.ok(Number(product.price) > 0);
    assert.ok(Number.isInteger(product.inventory));
    assert.ok(product.light && product.watering && product.soil && product.growingConditions);
  }

  const html = read('preview/dist/index.html');
  assert.match(html, /Coming soon/i);
  assert.match(html, /\$10 standard shipping/i);
  assert.match(html, /free shipping.*\$75/i);
  assert.match(html, /local pickup/i);
  assert.doesNotMatch(html, /type=["']submit["'][^>]*>\s*(Pay|Checkout)/i);
});
