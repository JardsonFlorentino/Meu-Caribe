/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const USER_TXT = path.join(__dirname, 'mare-2026-user.txt');
const DRAFT_JSON = path.join(__dirname, '..', 'assets', 'data', 'mare-maragogi-2026.draft.json');
const OUT_JSON = path.join(__dirname, '..', 'assets', 'data', 'mare-maragogi.json');

const MONTHS_PT = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12
};

const MONTH_ALIASES = [
  { re: /\bjaneiro\b/i, key: 'janeiro' },
  { re: /\bfevereiro\b/i, key: 'fevereiro' },
  { re: /\bmar[çc]o\b/i, key: 'marco' },
  { re: /\babril\b/i, key: 'abril' },
  { re: /\bmaio\b/i, key: 'maio' },
  { re: /\bjunho\b/i, key: 'junho' },
  { re: /\bjulho\b/i, key: 'julho' },
  { re: /\bagosto\b/i, key: 'agosto' },
  { re: /\bsetembro\b/i, key: 'setembro' },
  { re: /\boutubro\b/i, key: 'outubro' },
  { re: /\bnovembro\b/i, key: 'novembro' },
  { re: /\bdezembro\b/i, key: 'dezembro' }
];

function parseHeight(s) {
  if (s == null) return null;
  const n = Number(String(s).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function timeToMinutes(t) {
  const m = /^([0-9]{2}):([0-9]{2})$/.exec(String(t || '').trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const am = timeToMinutes(a.time);
    const bm = timeToMinutes(b.time);
    if (am == null && bm == null) return 0;
    if (am == null) return 1;
    if (bm == null) return -1;
    return am - bm;
  });
}

function buildRecordFromTypedEvents(day, typedEvents) {
  const lows = typedEvents.filter(e => e.type === 'baixa');
  const highs = typedEvents.filter(e => e.type === 'alta');

  return {
    dia: day,
    mareBaixa1: lows[0]?.time ?? null,
    altura1: lows[0]?.height ?? null,
    mareAlta1: highs[0]?.time ?? null,
    altura_alta1: highs[0]?.height ?? null,
    mareBaixa2: lows[1]?.time ?? null,
    altura2: lows[1]?.height ?? null,
    mareAlta2: highs[1]?.time ?? null,
    altura_alta2: highs[1]?.height ?? null
  };
}

function inferTypesByAlternation(events) {
  const sorted = sortEvents(events).filter(e => e.time && e.height != null);
  if (!sorted.length) return [];

  if (sorted.length === 1) {
    const only = sorted[0];
    const guess = only.height >= 1.0 ? 'alta' : 'baixa';
    return [{ ...only, type: guess }];
  }

  const first = sorted[0];
  const second = sorted[1];
  const firstIsHigh = first.height > second.height;

  return sorted.map((ev, idx) => {
    const type = ((idx % 2) === 0)
      ? (firstIsHigh ? 'alta' : 'baixa')
      : (firstIsHigh ? 'baixa' : 'alta');
    return { ...ev, type };
  });
}

function extractEventsFromDraftDay(rec) {
  const slots = [
    { time: rec.mareBaixa1, height: rec.altura1 },
    { time: rec.mareAlta1, height: rec.altura_alta1 },
    { time: rec.mareBaixa2, height: rec.altura2 },
    { time: rec.mareAlta2, height: rec.altura_alta2 }
  ];

  const events = [];
  for (const s of slots) {
    const time = typeof s.time === 'string' ? s.time.trim() : null;
    const height = parseHeight(s.height);
    if (!time || height == null) continue;
    events.push({ time, height });
  }

  // de-dup by time+height
  const seen = new Set();
  const dedup = [];
  for (const e of events) {
    const k = `${e.time}|${e.height}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(e);
  }

  return dedup;
}

function parseUserText(text) {
  const lines = String(text).split(/\r?\n/);
  let currentMonthKey = null;

  /** @type {Record<string, Record<number, Array<{time:string,height:number,type:'alta'|'baixa'}>>>} */
  const out = Object.create(null);

  function ensureMonth(key) {
    if (!out[key]) out[key] = Object.create(null);
  }

  function detectMonth(line) {
    for (const a of MONTH_ALIASES) {
      if (a.re.test(line)) return a.key;
    }
    return null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const mKey = detectMonth(line);
    if (mKey && /t[áa]bua/i.test(line)) {
      currentMonthKey = mKey;
      ensureMonth(mKey);
      continue;
    }

    // date at start
    const dm = /^([0-9]{2})\/([0-9]{2})(?:\/([0-9]{2,4}))?\b/.exec(line);
    if (!dm) continue;

    const day = Number(dm[1]);
    const month = Number(dm[2]);
    if (!Number.isFinite(day) || !Number.isFinite(month)) continue;

    // infer month key if section missing
    let key = currentMonthKey;
    if (!key) {
      key = Object.entries(MONTHS_PT).find(([, num]) => num === month)?.[0] || null;
      if (key) ensureMonth(key);
    }
    if (!key) continue;

    // Extract events in a tolerant way.
    const events = [];

    // 1) Parentheses: 04:21 (2.05↑)
    const reParen = /([0-9]{2}:[0-9]{2})\s*\(\s*(-?[0-9]+(?:[.,][0-9]+)?)\s*([↑↓])\s*\)/g;
    let m;
    while ((m = reParen.exec(line))) {
      const time = m[1];
      const height = parseHeight(m[2]);
      const arrow = m[3];
      if (height == null) continue;
      events.push({
        time,
        height,
        type: arrow === '↑' ? 'alta' : 'baixa'
      });
    }

    // 2) time arrow height: 01:42 ↑ 1.87
    const reTAH = /([0-9]{2}:[0-9]{2})\s*([↑↓])\s*(-?[0-9]+(?:[.,][0-9]+)?)/g;
    while ((m = reTAH.exec(line))) {
      const time = m[1];
      const arrow = m[2];
      const height = parseHeight(m[3]);
      if (height == null) continue;
      events.push({
        time,
        height,
        type: arrow === '↑' ? 'alta' : 'baixa'
      });
    }

    // 3) time height arrow: 03:25 2.02 ↑
    const reTHA = /([0-9]{2}:[0-9]{2})\s*(-?[0-9]+(?:[.,][0-9]+)?)\s*([↑↓])/g;
    while ((m = reTHA.exec(line))) {
      const time = m[1];
      const height = parseHeight(m[2]);
      const arrow = m[3];
      if (height == null) continue;
      events.push({
        time,
        height,
        type: arrow === '↑' ? 'alta' : 'baixa'
      });
    }

    // Dedup by time+type
    const seen = new Set();
    const dedup = [];
    for (const e of events) {
      const k = `${e.time}|${e.type}|${e.height}`;
      if (seen.has(k)) continue;
      seen.add(k);
      dedup.push(e);
    }

    if (!dedup.length) continue;

    out[key][day] = sortEvents(dedup);
  }

  return out;
}

function main() {
  const userText = fs.readFileSync(USER_TXT, 'utf8');
  const user = parseUserText(userText);

  const draft = JSON.parse(fs.readFileSync(DRAFT_JSON, 'utf8'));

  const year = 2026;
  const dadosBase = Object.create(null);

  for (const monthKey of Object.keys(MONTHS_PT)) {
    const draftMonth = Array.isArray(draft?.dadosBase?.[monthKey]) ? draft.dadosBase[monthKey] : [];

    // Build quick day->events from draft
    const draftByDay = new Map();
    for (const rec of draftMonth) {
      if (!rec || typeof rec.dia !== 'number') continue;
      const events = extractEventsFromDraftDay(rec);
      draftByDay.set(rec.dia, events);
    }

    const daysInMonth = new Date(year, MONTHS_PT[monthKey], 0).getDate();
    const monthArr = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const userEvents = user?.[monthKey]?.[day] || null;
      const draftEvents = draftByDay.get(day) || [];

      /** @type {Array<{time:string,height:number,type:'alta'|'baixa'}>} */
      let typed = [];

      if (userEvents && userEvents.length) {
        // User events already typed.
        typed = userEvents;

        // Fill missing with draft events when possible.
        const times = new Set(typed.map(e => e.time));
        const inferred = inferTypesByAlternation(draftEvents);
        for (const ev of inferred) {
          if (!times.has(ev.time)) typed.push(ev);
        }
      } else {
        // No user line for this day: infer from draft.
        typed = inferTypesByAlternation(draftEvents);
      }

      typed = sortEvents(typed).slice(0, 4);

      monthArr.push(buildRecordFromTypedEvents(day, typed));
    }

    dadosBase[monthKey] = monthArr;
  }

  // Summary
  const summary = {};
  let totalNull = 0;
  let totalSlots = 0;
  for (const [monthKey, arr] of Object.entries(dadosBase)) {
    let nullSlots = 0;
    for (const rec of arr) {
      const slots = [
        [rec.mareBaixa1, rec.altura1],
        [rec.mareAlta1, rec.altura_alta1],
        [rec.mareBaixa2, rec.altura2],
        [rec.mareAlta2, rec.altura_alta2]
      ];
      for (const [t, h] of slots) {
        totalSlots++;
        if (!t || h == null) {
          nullSlots++;
          totalNull++;
        }
      }
    }
    summary[monthKey] = nullSlots;
  }

  const out = {
    location: 'Maragogi-AL',
    year,
    generatedAt: new Date().toISOString(),
    source: 'User-provided CHM table (partial) + OCR fallback',
    dadosBase
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + '\n', 'utf8');

  console.log('Wrote:', OUT_JSON);
  console.log('Null slots by month:', summary);
  console.log(`Total null slots: ${totalNull} / ${totalSlots}`);
}

main();
