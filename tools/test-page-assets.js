const fs = require('fs');
const http = require('http');

const html = fs.readFileSync('passeio-de-buggy-maragogi.html', 'utf8');

// Match any /assets/... or ./assets/... ending with .webp, .png, .jpg, .svg
const matches = html.match(/(?:\.\/|\/)assets\/[^\s"',\)>]+/g) || [];
const cleanUrls = [...new Set(matches.map(m => m.startsWith('/') ? m : '/' + m.replace(/^\.\//, '')))];

console.log('Clean URLs to test:', cleanUrls.length);

let pending = cleanUrls.length;
let errors = 0;

cleanUrls.forEach(u => {
  http.get('http://localhost:3000' + u, res => {
    if (res.statusCode !== 200) {
      console.error('FAIL:', u, '->', res.statusCode);
      errors++;
    } else {
      // console.log('OK:', u);
    }
    pending--;
    if (pending === 0) {
      console.log('FINISHED! Total errors:', errors);
      if (errors === 0) console.log('ALL 100% ASSETS FOUND AND 200 OK!');
    }
  }).on('error', e => {
    console.error('NET ERROR:', u, e.message);
    errors++;
    pending--;
  });
});
