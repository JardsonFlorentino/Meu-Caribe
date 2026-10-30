const fs = require('fs');

const files = [
  'index.html',
  'passeio-de-lancha-maragogi.html',
  'aventura-aquatica.html',
  'tabua-mares-maragogi.html',
  'sobre.html',
  'contato.html',
  'politica-de-privacidade.html'
];

const newItem = '<li><a data-i18n="nav.buggy_quadri" href="/passeio-de-buggy-maragogi">Buggy e Quadri</a></li>';

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let count = 0;

  // Replace each occurrence of <li>...aventura-aquatica...</li>
  // (both in header nav and footer nav)
  const regex = /(<li><a\s+[^>]*href="\/aventura-aquatica"[^>]*>[\s\S]*?<\/a><\/li>)/g;
  
  if (!content.includes('href="/passeio-de-buggy-maragogi"')) {
    content = content.replace(regex, (match) => {
      count++;
      return `${match}\n<li><a data-i18n="nav.buggy_quadri" href="/passeio-de-buggy-maragogi">Buggy e Quadri</a></li>`;
    });

    if (count > 0) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file} (${count} insertions)`);
    } else {
      console.warn(`No match found in ${file}`);
    }
  } else {
    console.log(`${file} already contains buggy link`);
  }
});
