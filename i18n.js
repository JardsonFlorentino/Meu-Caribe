// ===================================================
// MEU CARIBE — i18n ENGINE
// Multi-language support: PT, EN, ES
// ===================================================
(function () {
    'use strict';

    var PAGE_TITLE_MAP = {
        'index': 'index.title',
        'passeios-lancha': 'lancha.title',
        'passeio-de-lancha': 'lancha.title',
        'passeio-de-lancha-maragogi': 'lancha.title',
        'aventura-aquatica': 'aventura.title',
        'sobre': 'sobre.title',
        'contato': 'contato.title',
        'tabua-mares': 'tide.title',
        'tabua-mares-maragogi': 'tide.title',
        'politica-de-privacidade': 'privacy.title'
    };

    var LANG_HTML = { pt: 'pt-br', en: 'en', es: 'es' };

    var I18N = {
        currentLang: 'pt',
        translations: {},
        supported: ['pt', 'en', 'es'],

        init: async function () {
            this.currentLang = localStorage.getItem('meucaribe_lang') || this._detectLang();
            await this._loadLang(this.currentLang);
            this._apply();
            this._bindSelector();
            this._bindStorageSync();
        },

        _detectLang: function () {
            var bl = (navigator.language || '').slice(0, 2);
            return this.supported.indexOf(bl) !== -1 ? bl : 'pt';
        },

        _loadLang: async function (lang) {
            try {
                var base = document.querySelector('script[src*="i18n.js"]');
                var prefix = base ? base.src.replace(/i18n\.js.*$/, '') : '';
                var res = await fetch(prefix + 'lang/' + lang + '.json');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                this.translations = await res.json();
                this.currentLang = lang;
            } catch (e) {
                if (lang !== 'pt') {
                    await this._loadLang('pt');
                }
            }
        },

        t: function (key, fallback) {
            return this.translations[key] || fallback || '';
        },

        _apply: function () {
            // Update <html lang>
            document.documentElement.lang = LANG_HTML[this.currentLang] || this.currentLang;

            // Update <title>
            var page = (location.pathname.split('/').pop() || '').replace('.html', '') || 'index';
            var titleKey = PAGE_TITLE_MAP[page];
            if (titleKey && this.translations[titleKey]) {
                document.title = this.translations[titleKey];
            }

            // data-i18n → textContent
            var self = this;
            document.querySelectorAll('[data-i18n]').forEach(function (el) {
                var key = el.getAttribute('data-i18n');
                var val = self.translations[key];
                if (val) {
                    el.textContent = val;
                }
            });

            // data-i18n-html → innerHTML (for content with <strong> etc.)
            document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
                var val = self.translations[el.getAttribute('data-i18n-html')];
                if (val) el.innerHTML = val;
            });

            // data-i18n-placeholder
            document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
                var val = self.translations[el.getAttribute('data-i18n-placeholder')];
                if (val) el.placeholder = val;
            });

            // data-i18n-aria-label
            document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
                var val = self.translations[el.getAttribute('data-i18n-aria-label')];
                if (val) el.setAttribute('aria-label', val);
            });

            // Save preference
            localStorage.setItem('meucaribe_lang', this.currentLang);

            // Update selector buttons
            document.querySelectorAll('.lang-btn').forEach(function (btn) {
                btn.classList.toggle('active', btn.getAttribute('data-lang') === self.currentLang);
            });

            document.querySelectorAll('.lang-active-code').forEach(function (codeEl) {
                codeEl.textContent = self.currentLang.toUpperCase();
            });

            // Notify other scripts (e.g. tide bar)
            document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: this.currentLang } }));
        },

        _bindSelector: function () {
            var self = this;
            document.querySelectorAll('.lang-btn').forEach(function (btn) {
                btn.addEventListener('click', async function () {
                    var lang = btn.getAttribute('data-lang');
                    if (lang === self.currentLang) return;
                    await self._loadLang(lang);
                    self._apply();
                });
            });
        },

        _bindStorageSync: function () {
            var self = this;
            window.addEventListener('storage', function (e) {
                if (!e || e.key !== 'meucaribe_lang') return;
                if (!e.newValue) return;

                var lang = String(e.newValue);
                if (lang === self.currentLang) return;
                if (self.supported.indexOf(lang) === -1) return;

                self._loadLang(lang).then(function () {
                    self._apply();
                });
            });
        }
    };

    window.I18N = I18N;

    document.addEventListener('DOMContentLoaded', function () {
        I18N.init();
    });
})();
