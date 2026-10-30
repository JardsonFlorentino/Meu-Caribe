const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const buggyDir = 'C:\\Users\\Jardson\\.gemini\\antigravity-ide\\brain\\369604b3-45ea-4af5-8ee2-91b2f5942c52\\scratch\\buggy_temp';
const userDir = 'C:\\Users\\Jardson\\.gemini\\antigravity-ide\\brain\\369604b3-45ea-4af5-8ee2-91b2f5942c52\\.user_uploaded';

const outImg = path.join(__dirname, '..', 'assets', 'img');
const outR = path.join(outImg, 'r');

if (!fs.existsSync(outR)) fs.mkdirSync(outR, { recursive: true });

async function processHero(inputPath, baseName) {
  console.log(`Processing hero: ${baseName}...`);
  const img = sharp(inputPath);
  
  // 1400w
  await img.clone()
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(path.join(outImg, `${baseName}.webp`));

  // 900w
  await img.clone()
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toFile(path.join(outR, `${baseName}-900.webp`));

  // 1400w responsive
  await img.clone()
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(path.join(outR, `${baseName}-1400.webp`));

  console.log(`Hero ${baseName} done!`);
}

async function processCardOrGallery(inputPath, baseName) {
  console.log(`Processing responsive: ${baseName}...`);
  const img = sharp(inputPath);
  
  // Master webp (max 1200)
  await img.clone()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(path.join(outImg, `${baseName}.webp`));

  // 400w
  await img.clone()
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toFile(path.join(outR, `${baseName}-400.webp`));

  // 800w
  await img.clone()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(path.join(outR, `${baseName}-800.webp`));

  // 1200w
  await img.clone()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(path.join(outR, `${baseName}-1200.webp`));

  console.log(`Responsive ${baseName} done!`);
}

async function run() {
  try {
    // 1. Hero
    const heroSrc = path.join(buggyDir, 'WhatsApp Image 2026-10-23 at 13.59.52 (1).jpeg');
    await processHero(heroSrc, 'buggy-hero');

    // 2. Cards
    const buggyNorteSrc = path.join(buggyDir, 'WhatsApp Image 2026-10-23 at 13.59.51 (1).jpeg');
    await processCardOrGallery(buggyNorteSrc, 'buggy-norte');

    const buggyMilagresSrc = path.join(buggyDir, 'WhatsApp Image 2026-10-23 at 13.59.53 (2).jpeg');
    await processCardOrGallery(buggyMilagresSrc, 'buggy-milagres');

    const quadriSrc = path.join(userDir, 'media_1792777736130.jpg');
    await processCardOrGallery(quadriSrc, 'quadriciclo-trilha');

    // 3. Galeria (Fotos reais de Buggy e Quadriciclo)
    const galeriaItems = [
      { src: path.join(buggyDir, 'WhatsApp Image 2026-10-23 at 13.59.50.jpeg'), name: 'galeria-buggy-1' },
      { src: path.join(buggyDir, 'WhatsApp Image 2026-10-23 at 13.59.51 (3).jpeg'), name: 'galeria-buggy-2' },
      { src: path.join(buggyDir, 'WhatsApp Image 2026-10-23 at 13.59.52 (2).jpeg'), name: 'galeria-buggy-3' },
      { src: path.join(buggyDir, 'WhatsApp Image 2026-10-23 at 13.59.54 (3).jpeg'), name: 'galeria-buggy-4' },
      { src: path.join(userDir, 'media_1792777736088.jpg'), name: 'galeria-quadri-1' },
      { src: path.join(userDir, 'media_1792777736104.jpg'), name: 'galeria-quadri-2' },
      { src: path.join(userDir, 'media_1792777736122.jpg'), name: 'galeria-quadri-3' },
      { src: path.join(buggyDir, 'WhatsApp Image 2026-10-23 at 14.00.52 (1).jpeg'), name: 'galeria-buggy-5' }
    ];

    for (const item of galeriaItems) {
      if (fs.existsSync(item.src)) {
        await processCardOrGallery(item.src, item.name);
      } else {
        console.warn('File not found:', item.src);
      }
    }

    console.log('ALL IMAGES SUCCESSFULLY OPTIMIZED!');
  } catch (err) {
    console.error('Error during optimization:', err);
  }
}

run();
