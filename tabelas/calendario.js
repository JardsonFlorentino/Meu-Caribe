(function () {
  'use strict';

  function t(key, fallback) {
    try {
      if (window.I18N && typeof window.I18N.t === 'function') {
        return window.I18N.t(key, fallback);
      }
    } catch (_) { }
    return fallback || '';
  }

  var MONTH_I18N_KEYS = [
    'months.january',
    'months.february',
    'months.march',
    'months.april',
    'months.may',
    'months.june',
    'months.july',
    'months.august',
    'months.september',
    'months.october',
    'months.november',
    'months.december'
  ];

  var MONTH_FALLBACK_PT = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];

  var WEEKDAY_I18N_KEYS = [
    'weekdays.sunday',
    'weekdays.monday',
    'weekdays.tuesday',
    'weekdays.wednesday',
    'weekdays.thursday',
    'weekdays.friday',
    'weekdays.saturday'
  ];

  function getWeekdayName(idx) {
    try {
      var key = WEEKDAY_I18N_KEYS[idx] || WEEKDAY_I18N_KEYS[0];
      var fb = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'][idx] || '';
      return t(key, fb);
    } catch (_) { return ''; }
  }

  function getWeekdayAbbrev(idx) {
    try {
      var full = getWeekdayName(idx) || '';
      if (!full) return '';
      var parts = full.split(/\s|-/);
      return (parts[0] || full).slice(0,3);
    } catch (_) { return ''; }
  }

  var runtimeConfig = null;
  var lastStatusKey = '';
  var lastStatusFallback = '';

  function getConfig() {
    var root = document.documentElement;
    var rootYear = Number(root.getAttribute('data-ano'));
    var queryYear = NaN;
    try {
      var p = new URLSearchParams(window.location.search || '');
      queryYear = Number(p.get('ano'));
    } catch (_) { }
    var year = Number.isFinite(queryYear) && queryYear >= 2000 ? queryYear : (Number.isFinite(rootYear) ? rootYear : new Date().getFullYear());
    var monthIndex = Number(root.getAttribute('data-mes-index')) || 0;
    var monthKey = String(root.getAttribute('data-mes-key') || '').trim();
    var title = String(root.getAttribute('data-titulo') || '').trim();
    var location = String(root.getAttribute('data-local') || 'Maragogi-AL').trim();

    return { year: year, monthIndex: monthIndex, monthKey: monthKey, title: title, location: location };
  }

  function getMonthLabel(config) {
    var idx = Number(config && config.monthIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 11) return '';
    var key = MONTH_I18N_KEYS[idx];
    var fb = MONTH_FALLBACK_PT[idx] || '';
    return t(key, fb);
  }

  function buildPageTitle(config) {
    var base = t('tide.calendar.title', 'Tábua de Marés');
    var month = getMonthLabel(config);
    var year = config && config.year ? String(config.year) : '';
    if (month && year) return base + ' - ' + month + ' ' + year;
    if (month) return base + ' - ' + month;
    if (year) return base + ' - ' + year;
    return base;
  }

  function applyI18nDynamic() {
    if (!runtimeConfig) return;
    var title = buildPageTitle(runtimeConfig);
    if (title) {
      setText('mareCalTitle', title);
      document.title = title;
    }

    if (lastStatusKey) {
      setStatus(t(lastStatusKey, lastStatusFallback));
    }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
  }

  function setStatus(text) {
    var el = document.getElementById('mareCalStatus');
    if (!el) return;

    if (!text) {
      el.hidden = true;
      el.textContent = '';
      return;
    }

    el.hidden = false;
    el.textContent = text;
  }

  function setStatusKey(key, fallback) {
    lastStatusKey = key || '';
    lastStatusFallback = fallback || '';
    setStatus(lastStatusKey ? t(lastStatusKey, lastStatusFallback) : '');
  }

  function formatHora(value) {
    var s = String(value || '').trim();
    return s ? s : '—';
  }

  function parseAltura(value) {
    if (value === null || value === undefined || value === '') return NaN;
    if (typeof value === 'number') return value;
    var s = String(value).trim().replace(',', '.');
    var n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function formatAltura(value) {
    var n = typeof value === 'number' ? value : parseAltura(value);
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(2).replace('.', ',') + 'm';
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatDateLabel(year, monthIndex, day) {
    return pad2(day) + '/' + pad2(monthIndex + 1) + '/' + String(year);
  }

  function makeEvent(type, day, hora, altura) {
    var h = formatHora(hora);
    var a = parseAltura(altura);
    return {
      type: type,
      day: day,
      hora: h,
      alturaNum: a,
      alturaText: formatAltura(altura)
    };
  }

  function isValidEvent(ev) {
    return ev && ev.hora && ev.hora !== '—' && Number.isFinite(ev.alturaNum);
  }

  function timeToMinutes(hhmm) {
    var s = String(hhmm || '').trim();
    var m = /^([0-9]{1,2}):([0-9]{2})$/.exec(s);
    if (!m) return NaN;
    var h = Number(m[1]);
    var min = Number(m[2]);
    if (!Number.isInteger(h) || !Number.isInteger(min)) return NaN;
    if (h < 0 || h > 23) return NaN;
    if (min < 0 || min > 59) return NaN;
    return h * 60 + min;
  }

  async function loadMonthData(year, monthKey) {
    var file = 'mare-maragogi.json';
    if (Number(year) === 2027) file = 'mare-maragogi-2027.json';

    var res = await fetch('../assets/data/' + file, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var json = await res.json();

    var month = json && json.dadosBase && json.dadosBase[monthKey];
    return Array.isArray(month) ? month : [];
  }

  function buildStats(monthDays) {
    var highs = [];
    var lows = [];

    monthDays.forEach(function (d) {
      if (!d || typeof d.dia !== 'number') return;
      var day = d.dia;

      var e1 = makeEvent('baixa', day, d.mareBaixa1, d.altura1);
      var e2 = makeEvent('alta', day, d.mareAlta1, d.altura_alta1);
      var e3 = makeEvent('baixa', day, d.mareBaixa2, d.altura2);
      var e4 = makeEvent('alta', day, d.mareAlta2, d.altura_alta2);

      [e1, e2, e3, e4].forEach(function (ev) {
        if (!isValidEvent(ev)) return;
        if (ev.type === 'alta') highs.push(ev);
        if (ev.type === 'baixa') lows.push(ev);
      });
    });

    var peak = highs.reduce(function (best, ev) {
      if (!best) return ev;
      return ev.alturaNum > best.alturaNum ? ev : best;
    }, null);

    var minLow = lows.reduce(function (best, ev) {
      if (!best) return ev;
      return ev.alturaNum < best.alturaNum ? ev : best;
    }, null);

    var avgLow = null;
    if (lows.length) {
      var sum = lows.reduce(function (acc, ev) { return acc + ev.alturaNum; }, 0);
      var avg = sum / lows.length;

      var closest = lows.reduce(function (best, ev) {
        if (!best) return ev;
        return Math.abs(ev.alturaNum - avg) < Math.abs(best.alturaNum - avg) ? ev : best;
      }, null);

      avgLow = {
        avg: avg,
        closest: closest
      };
    }

    return { peak: peak, minLow: minLow, avgLow: avgLow };
  }

  function getLegendLevel(alturaNum) {
    if (!Number.isFinite(alturaNum)) return null;

    // Faixas iguais ao "Como Entender":
    // Verde: 0.00–0.35 | Amarelo: 0.35–0.60 | Vermelho: 0.60+
    if (alturaNum <= 0.35) return { key: 'verde', arrow: '↓' };
    if (alturaNum <= 0.60) return { key: 'amarelo', arrow: '→' };
    return { key: 'vermelho', arrow: '↑' };
  }

  function renderLegends(stats) {
    var pico = document.getElementById('legendPico');
    var preame = document.getElementById('legendPreame');
    var media = document.getElementById('legendMedia');

    if (pico && stats.peak) {
      pico.innerHTML = '<strong>' + t('tide.legend.high', 'Pico:') + '</strong> ' + stats.peak.hora + ' (' + stats.peak.alturaText + ')';
    }

    if (preame && stats.minLow) {
      preame.innerHTML = '<strong>' + t('tide.legend.low', 'Preame:') + '</strong> ' + stats.minLow.hora + ' (' + stats.minLow.alturaText + ')';
    }

    if (media) {
      if (stats.avgLow && stats.avgLow.closest) {
        var avg = stats.avgLow.avg;
        var closest = stats.avgLow.closest;
        media.innerHTML = '<strong>' + t('tide.calendar.height', 'Média baixa:') + '</strong> ~ ' + avg.toFixed(2).replace('.', ',') + 'm (ex.: ' + closest.hora + ' — ' + closest.alturaText + ')';
      } else {
        media.textContent = t('tide.calendar.height', 'Média baixa:') + ' —';
      }
    }
  }

  function createEventNode(hora, alturaText, alturaNum) {
    var row = document.createElement('div');
    row.className = 'mare-cal-eventRow';

    var hourCell = document.createElement('div');
    hourCell.className = 'mare-cal-hourCell';

    var hourText = document.createElement('span');
    hourText.className = 'mare-cal-hourText';
    hourText.textContent = hora;
    // aria: marca a hora com label traduzido
    try { hourText.setAttribute('aria-label', t('tide.calendar.hour', 'Hora') + ': ' + (hora || '—')); } catch (_) {}

    hourCell.appendChild(hourText);

    var heightCell = document.createElement('div');
    heightCell.className = 'mare-cal-heightCell';

    var level = getLegendLevel(alturaNum);
    var heightText = document.createElement('span');
    heightText.className = 'mare-cal-heightText';
    heightText.textContent = alturaText;
    try { heightText.setAttribute('aria-label', t('tide.calendar.height', 'Altura') + ': ' + (alturaText || '—')); } catch (_) {}
    heightCell.appendChild(heightText);

    if (level) {
      var arrow = document.createElement('span');
      arrow.className = 'mare-cal-arrow mare-cal-arrow--' + level.key;
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = level.arrow;
      heightCell.appendChild(arrow);
    }

    row.appendChild(hourCell);
    row.appendChild(heightCell);
    return row;
  }

  function buildCalendar(config, monthDays) {
    var map = Object.create(null);
    monthDays.forEach(function (d) {
      if (d && typeof d.dia === 'number') map[d.dia] = d;
    });

    var year = config.year;
    var monthIndex = config.monthIndex;

    var first = new Date(year, monthIndex, 1);
    var daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // JS: 0=Dom..6=Sáb | Queremos 0=Seg..6=Dom
    var offset = (first.getDay() + 6) % 7;

    var totalCells = offset + daysInMonth;
    var rows = Math.ceil(totalCells / 7);

    var tbody = document.getElementById('mareCalBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Mobile cards container (cria/zera)
    var cardsWrap = document.querySelector('.mare-cal-cards');
    if (!cardsWrap) {
      cardsWrap = document.createElement('div');
      cardsWrap.className = 'mare-cal-cards';
      var tableWrap = document.querySelector('.mare-cal-tableWrap');
      if (tableWrap && tableWrap.parentNode) tableWrap.parentNode.insertBefore(cardsWrap, tableWrap.nextSibling);
    }
    cardsWrap.innerHTML = '';

    var day = 1;
    for (var r = 0; r < rows; r++) {
      var tr = document.createElement('tr');

      for (var c = 0; c < 7; c++) {
        var td = document.createElement('td');
        var cellIndex = r * 7 + c;

        if (cellIndex < offset || day > daysInMonth) {
          td.className = 'mare-cal-empty';
          tr.appendChild(td);
          continue;
        }

        var dn = document.createElement('div');
        dn.className = 'mare-cal-date';
        dn.textContent = formatDateLabel(year, monthIndex, day);
        td.appendChild(dn);

        var d = map[day] || {};

        var events = [
          makeEvent('baixa', day, d.mareBaixa1, d.altura1),
          makeEvent('alta', day, d.mareAlta1, d.altura_alta1),
          makeEvent('baixa', day, d.mareBaixa2, d.altura2),
          makeEvent('alta', day, d.mareAlta2, d.altura_alta2)
        ].filter(isValidEvent);

        events.sort(function (a, b) {
          var am = timeToMinutes(a.hora);
          var bm = timeToMinutes(b.hora);
          if (!Number.isFinite(am) && !Number.isFinite(bm)) return 0;
          if (!Number.isFinite(am)) return 1;
          if (!Number.isFinite(bm)) return -1;
          return am - bm;
        });

        events.forEach(function (ev) {
          td.appendChild(createEventNode(ev.hora, ev.alturaText, ev.alturaNum));
        });

        // Acessibilidade: adiciona role/aria-label com resumo do dia (útil em layout empilhado)
        try {
          var dt = new Date(year, monthIndex, day);
          var wk = getWeekdayName(dt.getDay()) || '';
          var eventsSummary = events.map(function(ev){ return ev.hora + ' — ' + ev.alturaText; }).join('; ');
          var aria = wk + ' ' + formatDateLabel(year, monthIndex, day) + (eventsSummary ? ': ' + eventsSummary : '');
          td.setAttribute('role', 'group');
          td.setAttribute('aria-label', aria);
        } catch (_) {
          // silencioso
        }

        tr.appendChild(td);
        day++;
      }

      tbody.appendChild(tr);
    }

    // Também gera versão em cartões (um cartão por dia) para layout móvel
    try {
      for (var d = 1; d <= daysInMonth; d++) {
        var cellData = map[d] || {};
        var dayEvents = [
          makeEvent('baixa', d, cellData.mareBaixa1, cellData.altura1),
          makeEvent('alta', d, cellData.mareAlta1, cellData.altura_alta1),
          makeEvent('baixa', d, cellData.mareBaixa2, cellData.altura2),
          makeEvent('alta', d, cellData.mareAlta2, cellData.altura_alta2)
        ].filter(isValidEvent);

        var card = document.createElement('article');
        card.className = 'mare-day-card';

        var hd = document.createElement('div');
        hd.className = 'mare-day-card__head';
        var dtLabel = document.createElement('div');
        dtLabel.className = 'mare-day-card__date';
        var dt = new Date(year, monthIndex, d);
        dtLabel.textContent = (getWeekdayAbbrev(dt.getDay()) || '') + ' ' + formatDateLabel(year, monthIndex, d);
        hd.appendChild(dtLabel);
        card.appendChild(hd);

        var bd = document.createElement('div');
        bd.className = 'mare-day-card__body';

        if (dayEvents.length) {
          dayEvents.forEach(function (ev) {
            bd.appendChild(createEventNode(ev.hora, ev.alturaText, ev.alturaNum));
          });
        } else {
          var empty = document.createElement('div');
          empty.className = 'mare-cal-empty-day';
          empty.textContent = '—';
          bd.appendChild(empty);
        }

        card.appendChild(bd);

        // aria: resumo do dia
        try {
          var eventsSummary = dayEvents.map(function(ev){ return ev.hora + ' — ' + ev.alturaText; }).join('; ');
          card.setAttribute('aria-label', dtLabel.textContent + (eventsSummary ? ': ' + eventsSummary : ''));
        } catch (_) {}

        // Classe de destaque por nível (usa a menor altura do dia para representar "baixa")
        try {
          var minAlt = null;
          dayEvents.forEach(function(ev){ if (Number.isFinite(ev.alturaNum)) { minAlt = minAlt === null ? ev.alturaNum : Math.min(minAlt, ev.alturaNum); } });
          var lvl = getLegendLevel(minAlt);
          if (lvl && lvl.key) card.classList.add('mare-day-card--' + lvl.key);
        } catch (_) {}

        cardsWrap.appendChild(card);
      }
    } catch (_) {
      // silencioso
    }
  }

  async function init() {
    var config = getConfig();
    runtimeConfig = config;
    applyI18nDynamic();

    setText('mareCalSubtitle', config.location);

    if (!config.monthKey) {
      setStatusKey('tide.calendar.month_missing', 'Mês não informado.');
      return;
    }

    setStatusKey('tide.calendar.loading', 'Carregando dados…');

    try {
      var monthDays = await loadMonthData(config.year, config.monthKey);
      if (!monthDays.length) {
        setStatusKey('tide.calendar.no_data', 'Dados não disponíveis para este mês.');
        return;
      }

      buildCalendar(config, monthDays);
      var stats = buildStats(monthDays);
      renderLegends(stats);

      setStatusKey('', '');

      // ajuda o iframe a recalcular altura
      try { window.dispatchEvent(new Event('resize')); } catch (_) { }
    } catch (e) {
      setStatusKey('tide.calendar.offline_error', 'Falha ao carregar dados offline.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('langchange', function () {
    applyI18nDynamic();
  });
})();
