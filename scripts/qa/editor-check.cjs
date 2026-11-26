// Editor check (runs before every build, and by hand: node scripts/qa/editor-check.cjs [--verbose]).
// 1. .pages.yml must be valid YAML, or the editor (Pages CMS) won't open at all: this fails the build.
// 2. Every key used in the content files should have a box in its Pages CMS form, because Pages CMS drops
//    keys its form doesn't know when someone saves. Missing boxes are printed as a warning.
const fs = require('fs'), p = require('path');
const root = p.join(__dirname, '..', '..') + '/';
const YAML = require('module').createRequire(root + 'package.json')('yaml');
const verbose = process.argv.includes('--verbose');

let conf;
try {
  conf = YAML.parse(fs.readFileSync(root + '.pages.yml', 'utf8'));
} catch (e) {
  console.error('Editor check: .pages.yml is not valid YAML, so the editor (Pages CMS) would not open.');
  console.error(e.message);
  process.exit(1);
}

const frontMatter = (file) => {
  const s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  if (file.endsWith('.yaml') || file.endsWith('.yml')) return YAML.parse(s);
  const m = s.match(/^---\n([\s\S]*?)\n---/);
  const data = m ? YAML.parse(m[1]) ?? {} : {};
  const body = m ? s.slice(m[0].length).trim() : s.trim();
  if (body) data.body = body;
  return data;
};
// key paths in data: "a", "a.b", "list[].c"
const paths = (v, pre = '') => {
  if (Array.isArray(v)) return v.flatMap((x) => (x && typeof x === 'object' && !(x instanceof Date) ? paths(x, pre + '[]') : []));
  if (v && typeof v === 'object' && !(v instanceof Date)) return Object.entries(v).flatMap(([k, x]) => [pre ? `${pre}.${k}` : k, ...paths(x, pre ? `${pre}.${k}` : k)]);
  return [];
};
const formPaths = (fields, pre = '') =>
  (fields ?? []).flatMap((f) => {
    const here = pre ? `${pre}.${f.name}` : f.name;
    const sub = f.type === 'object' ? formPaths(f.fields, f.list ? here + '[]' : here) : [];
    return [here, ...sub];
  });

let problems = 0;
for (const c of conf.content) {
  const files = c.type === 'file' ? [root + c.path] : fs.existsSync(root + c.path) ? fs.readdirSync(root + c.path).filter((f) => /\.(md|ya?ml)$/.test(f)).map((f) => root + c.path + '/' + f) : [];
  const used = new Set();
  for (const f of files) paths(frontMatter(f)).forEach((k) => used.add(k));
  const form = new Set(formPaths(c.fields));
  const missing = [...used].filter((k) => !form.has(k) && !form.has(k.replace(/\.[^.]+$/, '')));
  // ignore children of keys whose form field isn't an object (e.g. lists of plain strings)
  const realMissing = missing.filter((k) => ![...form].some((f) => k.startsWith(f + '.') && !form.has(f + '.' + k.slice(f.length + 1).split('.')[0])) || !form.has(k.split('.')[0]));
  if (realMissing.length) problems++;
  if (verbose || realMissing.length) {
    const unused = [...form].filter((k) => !used.has(k) && !k.includes('[]'));
    console.log(`${realMissing.length ? 'MISSING' : 'ok     '} ${c.label} (${files.length} file${files.length === 1 ? '' : 's'})${realMissing.length ? '\n         not in form: ' + realMissing.join(', ') : ''}${verbose && unused.length ? '\n         form boxes no file uses yet: ' + unused.join(', ') : ''}`);
  }
}
console.log(problems ? `Editor check: WARNING, ${problems} form(s) are missing boxes (saving those entries in the editor would drop the fields listed).` : 'Editor check: ok (the editor settings are valid and every content field has a box).');
