// Usage: node privacy-scan.mjs <import-manifest.json> <project-dir>
// Prints a Markdown checklist of imported content worth a privacy second look.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const [manifestPath, projectDir] = process.argv.slice(2);
const { manifest } = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const out = { contact: [], personal: [], children: [], namedPeople: [] };

const phone = /(?:\+44\s?|\b0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g;
const email = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const personalTitle = /birthday|retire|legend|farewell|goodbye|au revoir|members|reunion|jonathan morgan|stig/i;
const childAge = /\bage[sd]?\s+\d{1,2}\b|\(\d{1,2}\)|aged \d{1,2}|under eights|eights and over|year \d\b/i;
const nameish = /\b[A-Z][a-z]+ [A-Z][a-z]+(?:-[A-Z][a-z]+)?\b/g;

const link = (m) => `[${m.title}](src/content/news/${m.id}.md) (${m.date}, [original](${m.source}))`;

for (const m of manifest) {
  const t = m.text ?? '';
  const phones = t.match(phone) ?? [];
  const emails = t.match(email) ?? [];
  if (phones.length || emails.length) out.contact.push(`${link(m)}: ${[...new Set([...phones, ...emails])].join(', ')}`);
  if (personalTitle.test(m.title)) out.personal.push(link(m));
  if (childAge.test(t)) out.children.push(link(m));
  const names = new Set((t.match(nameish) ?? []).filter((n) => !/Bradda Dads|Bradwell|Christmas|Boxing Day|High Peak|Duck Race|Fell Race|Long Tour|St Barnabas|Peak Advertiser|Buxton Advertiser|Derbyshire|Shoulder|White Hart/.test(n)));
  if (names.size >= 5) out.namedPeople.push(`${link(m)}: ${names.size} names`);
}

// Event pages with contact details
for (const f of readdirSync(join(projectDir, 'src/content/events'))) {
  const t = readFileSync(join(projectDir, 'src/content/events', f), 'utf-8');
  const hits = [...new Set([...(t.match(phone) ?? []), ...(t.match(email) ?? [])])];
  if (hits.length) out.contact.unshift(`[events/${f}](src/content/events/${f}) (from the old WordPress Wolf's Pit page): ${hits.join(', ')}`);
}

const section = (title, items, note) =>
  `### ${title} (${items.length})\n\n${note ? note + '\n\n' : ''}${items.map((i) => `- [ ] ${i}`).join('\n') || '- Nothing found.'}\n`;

console.log(
  [
    section('Personal contact details', out.contact, 'Phone numbers and email addresses copied from the old sites.'),
    section('Posts about named individuals', out.personal, 'Birthdays, retirements, farewells, reunions and the members list.'),
    section('Children named with ages or school details', out.children, 'Competition winners and race entrants named alongside their age or school.'),
    section('Posts naming many people', out.namedPeople, 'Posts that name five or more people (captions, thank-yous). Usually fine, but worth a skim.'),
  ].join('\n'),
);
