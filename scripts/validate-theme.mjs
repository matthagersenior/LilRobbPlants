import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const required = [
  'layout/theme.liquid',
  'config/settings_schema.json',
  'config/settings_data.json',
  'locales/en.default.json'
];

const read = (path) => readFileSync(join(root, path), 'utf8');
for (const path of required) {
  if (!existsSync(join(root, path))) errors.push(`Missing required file: ${path}`);
}

for (const directory of ['config', 'locales', 'templates', 'sections']) {
  const dir = join(root, directory);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const path = `${directory}/${file}`;
    try { JSON.parse(read(path)); } catch (error) { errors.push(`Invalid JSON ${path}: ${error.message}`); }
  }
}

if (existsSync(join(root, 'layout/theme.liquid'))) {
  const layout = read('layout/theme.liquid');
  for (const token of ['content_for_header', 'content_for_layout', "sections 'header-group'", "sections 'footer-group'"]) {
    if (!layout.includes(token)) errors.push(`layout/theme.liquid missing ${token}`);
  }
}

const sectionsDir = join(root, 'sections');
if (existsSync(sectionsDir)) {
  for (const file of readdirSync(sectionsDir).filter((name) => name.endsWith('.liquid'))) {
    const source = read(`sections/${file}`);
    const match = source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
    if (match) {
      try { JSON.parse(match[1].trim()); } catch (error) { errors.push(`Invalid section schema sections/${file}: ${error.message}`); }
    }
  }
  for (const file of readdirSync(sectionsDir).filter((name) => name.endsWith('-group.json'))) {
    const group = JSON.parse(read(`sections/${file}`));
    for (const [id, section] of Object.entries(group.sections || {})) {
      if (!existsSync(join(root, 'sections', `${section.type}.liquid`))) errors.push(`sections/${file} entry ${id} references missing sections/${section.type}.liquid`);
    }
  }
}

const templatesDir = join(root, 'templates');
if (existsSync(templatesDir)) {
  for (const file of readdirSync(templatesDir).filter((name) => name.endsWith('.json'))) {
    const template = JSON.parse(read(`templates/${file}`));
    for (const [id, section] of Object.entries(template.sections || {})) {
      const sectionPath = join(root, 'sections', `${section.type}.liquid`);
      if (!existsSync(sectionPath)) errors.push(`templates/${file} section ${id} references missing sections/${section.type}.liquid`);
    }
  }
}

let sampleCount = null;
const samplePath = join(root, 'data/sample-products.csv');
if (existsSync(samplePath)) {
  const lines = read('data/sample-products.csv').trim().split(/\r?\n/);
  sampleCount = Math.max(0, lines.length - 1);
  if (sampleCount !== 10) errors.push(`Expected 10 sample products, found ${sampleCount}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Theme validation passed: required files and JSON are valid${sampleCount === null ? '' : `; ${sampleCount} sample products found`}.`);
