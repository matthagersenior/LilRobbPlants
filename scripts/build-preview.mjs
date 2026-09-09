import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sourceDir = join(root, 'preview');
const outDir = join(sourceDir, 'dist');

function parseCsv(source) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { value += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else value += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(value); value = ''; }
    else if (ch === '\n') { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
    else value += ch;
  }
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  const [headers, ...records] = rows.filter((entry) => entry.some(Boolean));
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])));
}

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dest = join(to, name);
    if (statSync(src).isDirectory()) copyDir(src, dest);
    else copyFileSync(src, dest);
  }
}

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const attributions = JSON.parse(readFileSync(join(sourceDir, 'images/ATTRIBUTION.json'), 'utf8'));
const attributionById = new Map(attributions.map((entry) => [entry.productId, entry]));
const rawProducts = parseCsv(readFileSync(join(root, 'data/sample-products.csv'), 'utf8'));
const products = rawProducts.map((row, index) => ({
  id: row['URL handle'],
  title: row.Title,
  description: row.Description,
  species: row['product.metafields.plant.species'],
  price: Number(row.Price),
  inventory: Number(row['Inventory quantity']),
  light: row['product.metafields.plant.light'],
  watering: row['product.metafields.plant.watering'],
  soil: row['product.metafields.plant.soil'],
  growingConditions: row['product.metafields.plant.growing_conditions'],
  difficulty: row['product.metafields.plant.difficulty'],
  humidity: row['product.metafields.plant.humidity'],
  matureSize: row['product.metafields.plant.mature_size'],
  petSafety: row['product.metafields.plant.pet_safety'],
  careNotes: row['product.metafields.plant.care_notes'],
  imageUrl: attributionById.get(row['URL handle'])?.imageUrl || '',
  artVariant: index % 5
}));

const missingPhotos = products.filter((product) => !product.imageUrl);
if (missingPhotos.length) throw new Error(`Missing licensed plant photo attribution for: ${missingPhotos.map((item) => item.id).join(', ')}`);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const file of ['styles.css', 'app.js', 'config.js']) copyFileSync(join(sourceDir, file), join(outDir, file));
copyDir(join(sourceDir, 'admin'), join(outDir, 'admin'));
copyDir(join(sourceDir, 'images'), join(outDir, 'images'));

const sourceHtml = readFileSync(join(sourceDir, 'index.html'), 'utf8');
const embeddedProducts = `<script>window.__LIL_ROBB_PRODUCTS__ = ${JSON.stringify(products).replace(/</g, '\\u003c')};</script>`;
writeFileSync(join(outDir, 'index.html'), sourceHtml.replace('<!--PRODUCT_DATA-->', embeddedProducts));
writeFileSync(join(outDir, 'products.json'), `${JSON.stringify(products, null, 2)}\n`);
writeFileSync(join(outDir, '.nojekyll'), '');

const creditRows = attributions.map((item) => {
  const product = products.find((entry) => entry.id === item.productId);
  return `<li><strong>${escapeHtml(product?.title || item.productId)}</strong> — photo by ${escapeHtml(item.author)}, ${escapeHtml(item.license)}. <a href="${escapeHtml(item.source)}" rel="noopener noreferrer">Wikimedia Commons source</a></li>`;
}).join('\n');
const creditsHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lil Robb Plants — Photo credits</title><link rel="stylesheet" href="./styles.css"></head>
<body><main class="credits-page"><p class="eyebrow">Openly licensed photography</p><h1>Plant photo credits</h1><p>These real plant photos are displayed from Wikimedia Commons under the licenses shown below. Product photos are examples until Lil Robb Plants replaces them with its own inventory photography.</p><ol>${creditRows}</ol><p><a class="button secondary" href="./">Back to the store</a></p></main></body></html>`;
writeFileSync(join(outDir, 'photo-credits.html'), creditsHtml);

console.log(`Built GitHub Pages preview with ${products.length} products and ${attributions.length} licensed plant photos.`);
