const fs = require('fs');

const pt = JSON.parse(fs.readFileSync('lang/pt.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('lang/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('lang/es.json', 'utf8'));

const html = fs.readFileSync('passeio-de-buggy-maragogi.html', 'utf8');

const keys = [];
const matches = html.matchAll(/data-i18n(?:-html)?=["']([^"']+)["']/g);
for (const m of matches) keys.push(m[1]);

const uniqueKeys = [...new Set(keys)];
console.log('Total unique i18n keys on page:', uniqueKeys.length);

let missingPt = 0, missingEn = 0, missingEs = 0;

uniqueKeys.forEach(k => {
  if (!pt[k]) { console.error('Missing in PT:', k); missingPt++; }
  if (!en[k]) { console.error('Missing in EN:', k); missingEn++; }
  if (!es[k]) { console.error('Missing in ES:', k); missingEs++; }
});

console.log('Result: PT missing:', missingPt, '| EN missing:', missingEn, '| ES missing:', missingEs);
if (missingPt === 0 && missingEn === 0 && missingEs === 0) {
  console.log('100% OF I18N KEYS EXIST IN PT, EN AND ES!');
}
