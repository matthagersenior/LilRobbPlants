import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = ['layout/theme.liquid','config/settings_schema.json','config/settings_data.json','locales/en.default.json','assets/manifest.webmanifest','snippets/pwa-install.liquid'];
const read = (path) => readFileSync(join(root, path), 'utf8');
const parseShopifyJson = (path) => JSON.parse(read(path).replace(/^\/\*[\s\S]*?\*\/\s*/, ''));

test('Shopify theme skeleton exposes required global files', () => { for (const path of required) assert.ok(existsSync(join(root, path)), `missing ${path}`); });
test('theme layout exposes Shopify rendering seams', () => { const layout = read('layout/theme.liquid'); assert.match(layout,/content_for_header/); assert.match(layout,/content_for_layout/); assert.match(layout,/sections\s+'header-group'/); assert.match(layout,/sections\s+'footer-group'/); });
test('theme JSON parses and store mode is merchant configurable', () => {
  const settings=parseShopifyJson('config/settings_schema.json');
  parseShopifyJson('config/settings_data.json'); parseShopifyJson('locales/en.default.json');
  const allSettings=settings.flatMap((group)=>group.settings||[]);
  const threshold=allSettings.find((setting)=>setting.id==='low_stock_threshold');
  const comingSoon=allSettings.find((setting)=>setting.id==='coming_soon');
  const shipping=allSettings.find((setting)=>setting.id==='standard_shipping_rate');
  assert.ok(threshold,'missing low_stock_threshold setting'); assert.equal(threshold.type,'range');
  assert.ok(comingSoon,'missing coming_soon setting'); assert.equal(comingSoon.type,'checkbox');
  assert.ok(shipping,'missing standard_shipping_rate setting');
});
const templateNames=['index','product','collection','search','cart','page','404'];
test('JSON templates only reference sections that exist',()=>{for(const name of templateNames){const templatePath=`templates/${name}.json`;assert.ok(existsSync(join(root,templatePath)),`missing ${templatePath}`);const template=parseShopifyJson(templatePath);for(const [id,section] of Object.entries(template.sections||{})){assert.ok(existsSync(join(root,`sections/${section.type}.liquid`)),`${templatePath} section ${id} references missing ${section.type}`);}}});
test('home theme mirrors the Pages storefront composition',()=>{
  const home=parseShopifyJson('templates/index.json');
  for (const id of ['hero','shipping','categories','care']) assert.ok(home.sections[id], `missing home section ${id}`);
  assert.ok(home.order.includes('hero'));
  assert.ok(home.order.includes('shipping'));
  assert.ok(home.order.includes('categories'));
  assert.ok(home.order.includes('care'));
  assert.ok(existsSync(join(root,'sections/shipping-strip.liquid')));
  assert.ok(existsSync(join(root,'sections/care-at-glance.liquid')));
});
test('product experience uses Shopify product form and availability guard',()=>{const productSection=read('sections/main-product.liquid');assert.match(productSection,/form\s+'product'/);assert.match(productSection,/selected_or_first_available_variant/);assert.match(productSection,/selected_variant\.available/);assert.match(productSection,/name="id"/);assert.match(productSection,/name="quantity"/);assert.match(productSection,/Representative image/);});
test('plant care reads the complete approved metafield contract',()=>{const care=read('snippets/plant-care.liquid');for(const key of ['species','light','watering','soil','growing_conditions','difficulty','humidity','mature_size','pet_safety','care_notes'])assert.match(care,new RegExp(`metafields\\.plant\\.${key}`),`missing plant.${key}`);});
test('collection and search render reusable inventory-aware plant cards',()=>{assert.match(read('sections/main-collection.liquid'),/render\s+'plant-card'/);assert.match(read('sections/main-search.liquid'),/render\s+'plant-card'/);const card=read('snippets/plant-card.liquid');assert.match(card,/render\s+'inventory-status'/);assert.match(card,/form\s+'product'/);assert.match(card,/product\.metafields\.plant\.species/);assert.match(card,/product\.tags contains 'Representative image'/);});
test('cart exposes update/remove controls and blocks checkout in coming-soon mode',()=>{const cart=read('sections/main-cart.liquid');assert.match(cart,/form\s+'cart'/);assert.match(cart,/updates\[\]/);assert.match(cart,/url_to_remove/);assert.match(cart,/name="update"/);assert.match(cart,/settings\.coming_soon/);assert.match(cart,/name="checkout"/);});
test('announcement branding no longer contains the old store name',()=>{assert.doesNotMatch(read('sections/header-group.json'),/Lil Robb Plants/i);assert.doesNotMatch(read('sections/announcement-bar.liquid'),/Lil Robb Plants/i);});
const approvedPlants=[['Monstera deliciosa','Swiss Cheese Plant'],['Epipremnum aureum','Golden Pothos'],['Dracaena trifasciata','Snake Plant'],['Zamioculcas zamiifolia','ZZ Plant'],['Philodendron hederaceum','Heartleaf Philodendron'],['Chlorophytum comosum','Spider Plant'],['Spathiphyllum','Peace Lily'],['Ficus elastica','Rubber Plant'],['Ficus lyrata','Fiddle-Leaf Fig'],['Pilea peperomioides','Chinese Money Plant']];
const parseSimpleCsv=(source)=>{const lines=source.trim().split(/\r?\n/);const headers=lines[0].split(',');return lines.slice(1).map((line)=>Object.fromEntries(line.split(',').map((value,index)=>[headers[index],value])));};
test('sample Shopify catalog includes all ten approved plants with price and inventory',()=>{assert.ok(existsSync(join(root,'data/sample-products.csv')),'missing sample-products.csv');const rows=parseSimpleCsv(read('data/sample-products.csv'));assert.equal(rows.length,10);for(const [species,commonName] of approvedPlants){const row=rows.find((entry)=>entry.Title===commonName);assert.ok(row,`missing ${commonName}`);assert.equal(row['product.metafields.plant.species'],species);assert.ok(row.Price,`${commonName} missing Price`);assert.ok(row['Inventory quantity'],`${commonName} missing Inventory quantity`);}});
test('sample metafield matrix supplies every plant care field for every example',()=>{assert.ok(existsSync(join(root,'data/sample-plant-metafields.csv')),'missing sample-plant-metafields.csv');const rows=parseSimpleCsv(read('data/sample-plant-metafields.csv'));assert.equal(rows.length,10);for(const row of rows){for(const key of ['species','light','watering','soil','growing_conditions','difficulty','humidity','mature_size','pet_safety','care_notes'])assert.ok(row[`product.metafields.plant.${key}`],`${row.Title} missing ${key}`);}});
test('owner documentation covers Shopify setup and routine updates',()=>{for(const path of ['README.md','docs/shopify-setup.md','docs/owner-workflow.md'])assert.ok(existsSync(join(root,path)),`missing ${path}`);const setup=read('docs/shopify-setup.md');assert.match(setup,/Settings\s*>\s*Custom data\s*>\s*Products/i);assert.match(setup,/multiple locations/i);assert.match(setup,/Shop\s*\/\s*Plant Care\s*\/\s*About\s*\/\s*Shipping\s*\/\s*Cart/i);const owner=read('docs/owner-workflow.md');assert.match(owner,/photos.*price.*inventory.*care.*publish/is);});

test('PWA manifest is installable and branded for The Robb Store',()=>{
  const manifest=parseShopifyJson('assets/manifest.webmanifest');
  assert.equal(manifest.name,'The Robb Store');
  assert.equal(manifest.short_name,'Robb Store');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.scope,'/');
  assert.ok(manifest.start_url.startsWith('/'));
  assert.equal(manifest.prefer_related_applications,false);
  assert.ok(manifest.icons.some((icon)=>icon.sizes==='192x192'));
  assert.ok(manifest.icons.some((icon)=>icon.sizes==='512x512'));
  assert.ok(manifest.shortcuts.some((shortcut)=>shortcut.url.includes('launch-collection')));
});
test('theme exposes PWA manifest and install experience',()=>{
  const layout=read('layout/theme.liquid');
  const header=read('sections/site-header.liquid');
  const script=read('assets/theme.js');
  assert.match(layout,/rel="manifest"/);
  assert.match(layout,/render\s+'pwa-install'/);
  assert.match(header,/data-pwa-install/);
  assert.match(script,/beforeinstallprompt/);
  assert.match(script,/appinstalled/);
  assert.match(script,/display-mode:\s*standalone/);
});
