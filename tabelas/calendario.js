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
    'months.january', 'months.february', 'months.march', 'months.april',
    'months.may', 'months.june', 'months.july', 'months.august',
    'months.september', 'months.october', 'months.november', 'months.december'
  ];

  var MONTH_FALLBACK_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  var WEEKDAY_I18N_KEYS = [
    'weekdays.monday', 'weekdays.tuesday', 'weekdays.wednesday',
    'weekdays.thursday', 'weekdays.friday', 'weekdays.saturday', 'weekdays.sunday'
  ];

  var WEEKDAY_FALLBACK_PT = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
  ];

  // Cor oficial da tábua impressa -> classe visual
  var COR_CLASSE = {
    alta: 'vermelho',
    baixa_ruim: 'amarelo',
    baixa_boa: 'verde'
  };

  var COR_I18N = {
    alta: ['tide.flag.high', 'Maré alta — sugerimos passeio de orla'],
    baixa_ruim: ['tide.flag.low_bad', 'Maré baixa, mas o horário ou a altura não permite o passeio às piscinas naturais'],
    baixa_boa: ['tide.flag.low_good', 'Maré baixa — é possível conhecer as piscinas naturais']
  };

  var runtimeConfig = null;
  var runtimeDays = null;

  function getWeekdayName(idx) {
    return t(WEEKDAY_I18N_KEYS[idx], WEEKDAY_FALLBACK_PT[idx]);
  }

  function getWeekdayAbbrev(idx) {
    var full = getWeekdayName(idx);
    return full.split('-')[0].slice(0, 3);
  }

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
    var location = String(root.getAttribute('data-local') || 'Maragogi-AL').trim();
    return { year: year, monthIndex: monthIndex, monthKey: monthKey, location: location };
  }

  function getMonthLabel(config) {
    var idx = Number(config && config.monthIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 11) return '';
    return t(MONTH_I18N_KEYS[idx], MONTH_FALLBACK_PT[idx] || '');
  }

  function buildPageTitle(config) {
    var base = t('tide.calendar.title', 'Tábua de Marés');
    var month = getMonthLabel(config);
    var year = config && config.year ? String(config.year) : '';
    if (month && year) return base + ' - ' + month + ' ' + year;
    return base;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setStatus(text) {
    var el = document.getElementById('mareCalStatus');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? '' : 'none';
  }

  function setStatusKey(key, fallback) {
    setStatus(key ? t(key, fallback) : '');
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function formatAltura(v) {
    if (!Number.isFinite(v)) return '';
    return v.toFixed(2).replace('.', ',') + 'm';
  }

  function timeToMinutes(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
    if (!m) return NaN;
    var h = Number(m[1]), mi = Number(m[2]);
    if (h > 23 || mi > 59) return NaN;
    return h * 60 + mi;
  }

  async function loadMonthData(year, monthIndex) {
    var file = year + '-' + pad2(monthIndex + 1) + '.json';
    var res = await fetch('../assets/data/mares/' + file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var json = await res.json();
    return (json && json.dias) ? json.dias : null;
  }

  function eventosDoDia(dias, dia) {
    var arr = dias ? dias[String(dia)] : null;
    if (!Array.isArray(arr)) return [];
    return arr.filter(function (e) {
      return e && Number.isFinite(Number(e.a)) && Number.isFinite(timeToMinutes(e.h));
    }).map(function (e) {
      return {
        hora: e.h,
        altura: Number(e.a),
        tipo: e.t,
        cor: e.c,
        classe: COR_CLASSE[e.c] || 'amarelo',
        min: timeToMinutes(e.h)
      };
    }).sort(function (a, b) { return a.min - b.min; });
  }

  function dominioMes(dias) {
    var lo = Infinity, hi = -Infinity;
    Object.keys(dias || {}).forEach(function (k) {
      (dias[k] || []).forEach(function (e) {
        var v = Number(e.a);
        if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
      });
    });
    if (!Number.isFinite(lo)) { lo = 0; hi = 2.5; }
    var pad = Math.max(0.12, (hi - lo) * 0.12);
    return { lo: lo - pad, hi: hi + pad };
  }

  // margem interna para a curva nunca encostar na borda do quadro
  var PAD_TOPO = 5;
  var PAD_BASE = 3;

  function construirCurva(eventos, dom, W, H) {
    if (eventos.length < 2) return null;
    var yMin = PAD_TOPO, yMax = H - PAD_BASE;
    var faixa = yMax - yMin;
    var prender = function (y) { return Math.max(yMin, Math.min(yMax, y)); };
    var esc = function (ev) {
      var x = (ev.min / 1440) * W;
      var y = yMax - ((ev.altura - dom.lo) / (dom.hi - dom.lo)) * faixa;
      return [x, prender(y)];
    };
    var pts = eventos.map(esc);
    // prolonga as bordas mantendo a tendencia, para a curva encostar em 0h e 24h
    var first = pts[0], second = pts[1];
    var last = pts[pts.length - 1], prev = pts[pts.length - 2];
    var y0 = first[1] + (first[1] - second[1]) * (first[0] / Math.max(1, second[0] - first[0]));
    var yF = last[1] + (last[1] - prev[1]) * ((W - last[0]) / Math.max(1, last[0] - prev[0]));
    var all = [[0, prender(y0)]].concat(pts, [[W, prender(yF)]]);
    var d = 'M ' + all[0][0].toFixed(1) + ' ' + all[0][1].toFixed(1);
    for (var i = 1; i < all.length; i++) {
      var p = all[i], q = all[i - 1];
      var cx = (q[0] + p[0]) / 2;
      d += ' C ' + cx.toFixed(1) + ' ' + q[1].toFixed(1) + ', ' + cx.toFixed(1) + ' ' + p[1].toFixed(1) + ', ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    }
    return { d: d, pts: pts };
  }

  function svgDoDia(eventos, dom) {
    var W = 100, H = 40;
    var curva = construirCurva(eventos, dom, W, H);
    if (!curva) return '';
    var partes = [];
    // faixa da janela boa (maré baixa visitavel)
    eventos.forEach(function (ev, i) {
      if (ev.cor !== 'baixa_boa') return;
      var x = (ev.min / 1440) * W;
      partes.push('<rect class="mare-dia__janela" x="' + Math.max(0, x - 8).toFixed(1) + '" y="0" width="16" height="' + H + '" />');
    });
    partes.push('<path class="mare-dia__area" d="' + curva.d + ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z" />');
    partes.push('<path class="mare-dia__linha" d="' + curva.d + '" />');
    curva.pts.forEach(function (p, i) {
      partes.push('<circle class="mare-dia__ponto mare-dia__ponto--' + eventos[i].classe + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.2" />');
    });
    return '<svg class="mare-dia__curva" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + partes.join('') + '</svg>';
  }

  function listaDoDia(eventos) {
    var itens = eventos.map(function (ev) {
      var titulo = t(COR_I18N[ev.cor][0], COR_I18N[ev.cor][1]);
      var d = ev.tipo === 'alta'
        ? 'M6 10.5 V2.6 M2.6 6 L6 2.2 L9.4 6'
        : 'M6 1.5 V9.4 M2.6 6 L6 9.8 L9.4 6';
      var seta = '<svg class="mare-ev__seta" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
        '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      return '<li class="mare-ev mare-ev--' + ev.classe + '" title="' + titulo.replace(/"/g, '&quot;') + '">' +
        seta +
        '<span class="mare-ev__hora">' + ev.hora + '</span>' +
        '<span class="mare-ev__alt">' + formatAltura(ev.altura) + '</span>' +
        '<span class="sr-only">' + titulo + '</span>' +
        '</li>';
    });
    return '<ul class="mare-dia__lista">' + itens.join('') + '</ul>';
  }

  function ehHoje(year, monthIndex, dia) {
    var h = new Date();
    return h.getFullYear() === year && h.getMonth() === monthIndex && h.getDate() === dia;
  }

  function celulaDia(dia, eventos, dom, dataLabel, hoje) {
    if (!eventos.length) {
      return '<div class="mare-dia mare-dia--vazio"><span class="mare-dia__num">' + pad2(dia) + '</span></div>';
    }
    var melhor = eventos.filter(function (e) { return e.cor === 'baixa_boa'; })[0];
    var cls = 'mare-dia' + (melhor ? ' mare-dia--tem-janela' : '') + (hoje ? ' mare-dia--hoje' : '');
    return '<div class="' + cls + '"' + (hoje ? ' aria-current="date"' : '') + '>' +
      '<div class="mare-dia__topo">' +
        '<span class="mare-dia__num">' + pad2(dia) + '</span>' +
        (hoje ? '<span class="mare-dia__hojeTag">' + t('tide.calendar.today', 'hoje') + '</span>' : '') +
        (melhor ? '<span class="mare-dia__badge">' + melhor.hora + '</span>' : '') +
      '</div>' +
      '<div class="mare-dia__grafico">' + svgDoDia(eventos, dom) +
        '<div class="mare-dia__eixo" aria-hidden="true"><span>0h</span><span>12h</span><span>24h</span></div>' +
      '</div>' +
      listaDoDia(eventos) +
      '<span class="sr-only">' + dataLabel + '</span>' +
      '</div>';
  }

  function buildCalendar(config, dias) {
    var tbody = document.getElementById('mareCalBody');
    if (!tbody) return;
    var dom = dominioMes(dias);
    var year = config.year, monthIndex = config.monthIndex;
    var first = new Date(year, monthIndex, 1);
    var daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    var offset = (first.getDay() + 6) % 7; // 0 = Segunda
    var totalCells = offset + daysInMonth;
    var rows = Math.ceil(totalCells / 7);
    var mesLabel = getMonthLabel(config);

    var html = '';
    var cell = 0;
    for (var r = 0; r < rows; r++) {
      html += '<tr>';
      for (var c = 0; c < 7; c++) {
        var dia = cell - offset + 1;
        cell++;
        if (dia < 1 || dia > daysInMonth) {
          html += '<td class="mare-cal-empty"></td>';
          continue;
        }
        var evs = eventosDoDia(dias, dia);
        var label = pad2(dia) + ' ' + mesLabel + ' ' + year;
        var hoje = ehHoje(year, monthIndex, dia);
        html += '<td class="mare-cal-cell' + (hoje ? ' mare-cal-cell--hoje' : '') + '">' + celulaDia(dia, evs, dom, label, hoje) + '</td>';
      }
      html += '</tr>';
    }
    tbody.innerHTML = html;
    buildCards(config, dias, dom);
  }

  function buildCards(config, dias, dom) {
    var wrap = document.querySelector('.mare-cal-cards');
    if (!wrap) {
      var tableWrap = document.querySelector('.mare-cal-tableWrap');
      if (!tableWrap || !tableWrap.parentNode) return;
      wrap = document.createElement('div');
      wrap.className = 'mare-cal-cards';
      tableWrap.parentNode.insertBefore(wrap, tableWrap.nextSibling);
    }
    var year = config.year, monthIndex = config.monthIndex;
    var daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    var mesLabel = getMonthLabel(config);
    var out = '';
    for (var d = 1; d <= daysInMonth; d++) {
      var evs = eventosDoDia(dias, d);
      if (!evs.length) continue;
      var wd = new Date(year, monthIndex, d).getDay();
      var wdIdx = (wd + 6) % 7;
      var hoje = ehHoje(year, monthIndex, d);
      out += '<article class="mare-card' + (hoje ? ' mare-card--hoje' : '') + '"' + (hoje ? ' aria-current="date"' : '') + '>' +
        '<header class="mare-card__cab">' +
          '<span class="mare-card__dia">' + pad2(d) + '</span>' +
          '<span class="mare-card__sem">' + getWeekdayAbbrev(wdIdx) + '</span>' +
          (hoje ? '<span class="mare-dia__hojeTag">' + t('tide.calendar.today', 'hoje') + '</span>' : '') +
          '<span class="mare-card__mes">' + mesLabel + '</span>' +
        '</header>' +
        '<div class="mare-dia__grafico">' + svgDoDia(evs, dom) + '</div>' +
        listaDoDia(evs) +
        '</article>';
    }
    wrap.innerHTML = out;
  }

  function renderResumo(dias) {
    var todos = [];
    Object.keys(dias || {}).forEach(function (k) {
      eventosDoDia(dias, k).forEach(function (e) { todos.push(e); });
    });
    if (!todos.length) return;
    var altas = todos.filter(function (e) { return e.tipo === 'alta'; });
    var baixas = todos.filter(function (e) { return e.tipo === 'baixa'; });
    var pico = altas.reduce(function (a, b) { return (!a || b.altura > a.altura) ? b : a; }, null);
    var preame = baixas.reduce(function (a, b) { return (!a || b.altura < a.altura) ? b : a; }, null);
    var boas = todos.filter(function (e) { return e.cor === 'baixa_boa'; }).length;

    var elPico = document.getElementById('legendPico');
    var elPre = document.getElementById('legendPreame');
    var elMed = document.getElementById('legendMedia');
    if (elPico && pico) {
      elPico.innerHTML = '<strong>' + t('tide.legend.high', 'Pico:') + '</strong> ' + pico.hora + ' (' + formatAltura(pico.altura) + ')';
    }
    if (elPre && preame) {
      elPre.innerHTML = '<strong>' + t('tide.legend.low', 'Preamar:') + '</strong> ' + preame.hora + ' (' + formatAltura(preame.altura) + ')';
    }
    if (elMed) {
      elMed.innerHTML = '<strong>' + t('tide.legend.windows', 'Janelas para as piscinas:') + '</strong> ' + boas;
    }
  }

  function applyI18nDynamic() {
    if (!runtimeConfig) return;
    document.title = buildPageTitle(runtimeConfig);
    setText('mareCalTitle', buildPageTitle(runtimeConfig));
    setText('mareCalSubtitle', runtimeConfig.location);
    if (runtimeDays) {
      buildCalendar(runtimeConfig, runtimeDays);
      renderResumo(runtimeDays);
    }
  }

  async function init() {
    var config = getConfig();
    runtimeConfig = config;

    document.title = buildPageTitle(config);
    setText('mareCalTitle', buildPageTitle(config));
    setText('mareCalSubtitle', config.location);
    setStatusKey('tide.calendar.loading', 'Carregando dados…');

    try {
      var dias = await loadMonthData(config.year, config.monthIndex);
      if (!dias || !Object.keys(dias).length) {
        setStatusKey('tide.calendar.no_data', 'Dados não disponíveis para este mês.');
        return;
      }
      runtimeDays = dias;
      buildCalendar(config, dias);
      renderResumo(dias);
      setStatus('');
      try { window.dispatchEvent(new Event('resize')); } catch (_) { }
    } catch (e) {
      setStatusKey('tide.calendar.offline_error', 'Falha ao carregar os dados da tábua.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('langchange', applyI18nDynamic);
})();
