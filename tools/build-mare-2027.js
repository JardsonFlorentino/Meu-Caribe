/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'mare-2027-user.txt');
const OUT_JSON = path.join(__dirname, '..', 'assets', 'data', 'mare-maragogi-2027.json');

const MONTHS = {
  JANEIRO: 'janeiro',
  FEVEREIRO: 'fevereiro',
  MARCO: 'marco',
  ABRIL: 'abril',
  MAIO: 'maio',
  JUNHO: 'junho',
  JULHO: 'julho',
  AGOSTO: 'agosto',
  SETEMBRO: 'setembro',
  OUTUBRO: 'outubro',
  NOVEMBRO: 'novembro',
  DEZEMBRO: 'dezembro'
};

function parseMonthLine(line) {
  const m = /^##\s+([A-ZÇÃÕÁÉÍÓÚÂÊÔ]+)\s*$/.exec(line.trim());
  if (!m) return null;
  const key = m[1]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  return MONTHS[key] || null;
}

function parseDayLine(line) {
  const dm = /^(\d{2})\/(\d{2})\/(\d{2})\s+/.exec(line);
  if (!dm) return null;

  const day = Number(dm[1]);
  const month = Number(dm[2]);
  const yy = Number(dm[3]);
  if (yy !== 27) return null;

  const events = [];
  const re = /(\d{2}:\d{2})\s*\((-?\d+(?:\.\d+)?)\)\s*([↑↓])/g;
  let m;
  while ((m = re.exec(line))) {
    events.push({
      time: m[1],
      height: Number(m[2]),
      type: m[3] === '↑' ? 'alta' : 'baixa'
    });
  }

  const lows = events.filter((e) => e.type === 'baixa');
  const highs = events.filter((e) => e.type === 'alta');

  return {
    day,
    month,
    rec: {
      dia: day,
      mareBaixa1: lows[0]?.time ?? null,
      altura1: Number.isFinite(lows[0]?.height) ? lows[0].height : null,
      mareAlta1: highs[0]?.time ?? null,
      altura_alta1: Number.isFinite(highs[0]?.height) ? highs[0].height : null,
      mareBaixa2: lows[1]?.time ?? null,
      altura2: Number.isFinite(lows[1]?.height) ? lows[1].height : null,
      mareAlta2: highs[1]?.time ?? null,
      altura_alta2: Number.isFinite(highs[1]?.height) ? highs[1].height : null
    }
  };
}

function build() {
  const txt = fs.readFileSync(INPUT, 'utf8');
  const lines = txt.split(/\r?\n/);

  const dadosBase = {
    janeiro: [], fevereiro: [], marco: [], abril: [], maio: [], junho: [],
    julho: [], agosto: [], setembro: [], outubro: [], novembro: [], dezembro: []
  };

  let currentMonth = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('# ')) continue;

    const mk = parseMonthLine(line);
    if (mk) {
      currentMonth = mk;
      continue;
    }

    if (!currentMonth) continue;

    const parsed = parseDayLine(line);
    if (!parsed) continue;

    dadosBase[currentMonth].push(parsed.rec);
  }

  const out = {
    location: 'Maragogi-AL',
    year: 2027,
    generatedAt: new Date().toISOString(),
    source: 'Manual entry from tools/mare-2027-user.txt',
    dadosBase
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + '\n', 'utf8');

  const summary = Object.entries(dadosBase).map(([k, arr]) => `${k}:${arr.length}`).join(', ');
  console.log('Wrote:', OUT_JSON);
  console.log('Days by month:', summary);
}

build();
