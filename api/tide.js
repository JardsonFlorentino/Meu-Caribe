const fs = require('node:fs');
const path = require('node:path');

const TIME_ZONE = 'America/Maceio';

async function scrapeTabuaDeMaresToday() {
  const url = 'https://www.tabuademares.com/br/alagoas/maragogi';

  const r = await fetch(url, {
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'MeuCaribeBot/1.0 (+https://meucaribemaragogi.com.br)'
    }
  });

  if (!r.ok) return null;
  const html = await r.text();

  // Page embeds arrays like gm.mareas_x[0]=123; gm.mareas_y[0]=1.23;
  const xMatches = [...html.matchAll(/gm\.mareas_x\[(\d+)\]=(\d+)/g)];
  const yMatches = [...html.matchAll(/gm\.mareas_y\[(\d+)\]=([\d.]+)/g)];
  if (xMatches.length < 4 || yMatches.length < 4) return null;

  // Build map by index to avoid relying on ordering.
  const xByIdx = new Map();
  for (const m of xMatches) xByIdx.set(Number(m[1]), Number(m[2]));
  const yByIdx = new Map();
  for (const m of yMatches) yByIdx.set(Number(m[1]), Number(m[2]));

  const combined = [];
  for (const [idx, minutes] of xByIdx.entries()) {
    const height = yByIdx.get(idx);
    if (!Number.isFinite(minutes) || !Number.isFinite(height)) continue;
    combined.push({ idx, minutes, height });
  }

  // Keep only events within today's 0..1440 minutes.
  const today = combined
    .filter(m => m.minutes >= 0 && m.minutes <= 1440)
    .sort((a, b) => a.minutes - b.minutes);

  if (today.length < 2) return null;

  return today.map(m => {
    const hours = Math.floor(m.minutes / 60);
    const mins = m.minutes % 60;
    const time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const type = m.height >= 1.0 ? 'alta' : 'baixa';
    return { type, time, height: m.height };
  });
}

function getTodayISOInTimeZone(timeZone) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function parseISODate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { year, month, day };
}

function monthKey(monthNumber) {
  const months = [
    'janeiro',
    'fevereiro',
    'marco',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro'
  ];
  return months[monthNumber - 1] || null;
}

function buildTidesFromDayRecord(dayRecord) {
  const items = [];

  if (dayRecord.mareBaixa1) {
    items.push({ type: 'baixa', time: dayRecord.mareBaixa1, height: dayRecord.altura1 });
  }
  if (dayRecord.mareAlta1) {
    items.push({ type: 'alta', time: dayRecord.mareAlta1, height: dayRecord.altura_alta1 });
  }
  if (dayRecord.mareBaixa2) {
    items.push({ type: 'baixa', time: dayRecord.mareBaixa2, height: dayRecord.altura2 });
  }
  if (dayRecord.mareAlta2) {
    items.push({ type: 'alta', time: dayRecord.mareAlta2, height: dayRecord.altura_alta2 });
  }

  const timeToMinutes = (hhmm) => {
    const m = /^([0-9]{1,2}):([0-9]{2})$/.exec(String(hhmm || '').trim());
    if (!m) return NaN;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (!Number.isInteger(h) || !Number.isInteger(min)) return NaN;
    if (h < 0 || h > 23) return NaN;
    if (min < 0 || min > 59) return NaN;
    return h * 60 + min;
  };

  items.sort((a, b) => {
    const am = timeToMinutes(a.time);
    const bm = timeToMinutes(b.time);
    if (!Number.isFinite(am) && !Number.isFinite(bm)) return 0;
    if (!Number.isFinite(am)) return 1;
    if (!Number.isFinite(bm)) return -1;
    return am - bm;
  });

  return items;
}

module.exports = function handler(req, res) {
  try {
    const dateStr = typeof req.query?.date === 'string' ? req.query.date : getTodayISOInTimeZone(TIME_ZONE);
    const parsed = parseISODate(dateStr);
    if (!parsed) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Invalid date. Use YYYY-MM-DD.' }));
      return;
    }

    const todayStr = getTodayISOInTimeZone(TIME_ZONE);

    const key = monthKey(parsed.month);
    if (!key) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Invalid month.' }));
      return;
    }

    // Prefer live free source for *today* (same approach you used before),
    // but keep local JSON as a reliable fallback.
    if (dateStr === todayStr) {
      // If scraping fails (network/layout change), fallback below.
      // Note: module.exports isn't async; use a small IIFE.
      return (async () => {
        let scraped = null;
        try {
          scraped = await scrapeTabuaDeMaresToday();
        } catch (_) {
          scraped = null;
        }

        if (Array.isArray(scraped) && scraped.length) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
          res.end(
            JSON.stringify({
              location: 'Maragogi, AL',
              date: dateStr,
              tides: scraped,
              source: 'tabuademares.com'
            })
          );
          return;
        }

        // Fall through to local JSON response.
        const filePath = path.join(process.cwd(), 'assets', 'data', 'mare-maragogi.json');
        const raw = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(raw);

        const monthData = json?.dadosBase?.[key];
        if (!Array.isArray(monthData)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'No data for month.' }));
          return;
        }

        const dayRecord = monthData.find(d => Number(d?.dia) === parsed.day);
        if (!dayRecord) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'No data for day.' }));
          return;
        }

        const tides = buildTidesFromDayRecord(dayRecord);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.end(
          JSON.stringify({
            location: 'Maragogi, AL',
            date: dateStr,
            tides,
            source: 'assets/data/mare-maragogi.json'
          })
        );
      })();
    }

    const filePath = path.join(process.cwd(), 'assets', 'data', 'mare-maragogi.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);

    const monthData = json?.dadosBase?.[key];
    if (!Array.isArray(monthData)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'No data for month.' }));
      return;
    }

    const dayRecord = monthData.find(d => Number(d?.dia) === parsed.day);
    if (!dayRecord) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'No data for day.' }));
      return;
    }

    const tides = buildTidesFromDayRecord(dayRecord);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Cache a bit at the edge; data is effectively static.
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(
      JSON.stringify({
        location: 'Maragogi, AL',
        date: dateStr,
        tides,
        source: 'assets/data/mare-maragogi.json'
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal error.' }));
  }
};
