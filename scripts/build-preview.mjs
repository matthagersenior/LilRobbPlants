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
      if (ch === '"' && source[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(value);
      value = '';
    } else if (ch === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
    } else value += ch;
  }

  if (value || row.length) {
    row.push(value.replace(/\r$/, ''));
    rows.push(row);
  }

  const [headers, ...records] = rows.filter((entry) => entry.some(Boolean));
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])));
}

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
  artVariant: index % 5
}));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const file of ['styles.css', 'app.js', 'config.js']) {
  copyFileSync(join(sourceDir, file), join(outDir, file));
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
copyDir(join(sourceDir, 'admin'), join(outDir, 'admin'));
const sourceHtml = readFileSync(join(sourceDir, 'index.html'), 'utf8');
const embeddedProducts = `<script>window.__LIL_ROBB_PRODUCTS__ = ${JSON.stringify(products).replace(/</g, '\\u003c')};</script>`;
writeFileSync(join(outDir, 'index.html'), sourceHtml.replace('<!--PRODUCT_DATA-->', embeddedProducts));
writeFileSync(join(outDir, 'products.json'), `${JSON.stringify(products, null, 2)}\n`);
writeFileSync(join(outDir, '.nojekyll'), '');
console.log(`Built GitHub Pages preview with ${products.length} products.`);
