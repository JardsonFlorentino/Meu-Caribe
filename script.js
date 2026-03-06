// ===================================================
// MEU CARIBE - MARAGOGI/AL
// Menu mobile, animações scroll, navegação galeria,
// efeitos premium, contadores, parallax
// ===================================================

// --- CLEAN URLs (remove .html from address bar — production only) ---
// Live Server / localhost não suporta URLs sem extensão no refresh.
// GitHub Pages, Netlify e Vercel resolvem automaticamente.
(function () {
    var h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return;
    var loc = window.location;
    var cleanPath = loc.pathname;
    if (cleanPath.endsWith('/index.html')) {
        cleanPath = cleanPath.replace('/index.html', '/');
    } else if (cleanPath.endsWith('.html')) {
        cleanPath = cleanPath.slice(0, -5);
    }
    if (cleanPath !== loc.pathname) {
        history.replaceState(null, '', cleanPath + loc.search + loc.hash);
    }
})();

document.addEventListener('DOMContentLoaded', () => {

    // --- SCROLL PROGRESS BAR ---
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    scrollProgress.style.width = '0%';
    document.body.prepend(scrollProgress);

    // --- BACK TO TOP BUTTON ---
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.setAttribute('aria-label', 'Voltar ao topo');
    backToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
    document.body.appendChild(backToTop);

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- HERO BUBBLES ---
    document.querySelectorAll('#banner, #banner-lancha, #banner-aventura, #banner-sobre, #banner-contato').forEach(hero => {
        if (!hero.querySelector('.hero-bubbles')) {
            const bubbles = document.createElement('div');
            bubbles.className = 'hero-bubbles';
            for (let i = 0; i < 7; i++) {
                bubbles.appendChild(document.createElement('span'));
            }
            hero.appendChild(bubbles);
        }
    });

    // --- MENU HAMBURGER ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navWrapper = document.getElementById('nav-wrapper');

    if (hamburgerBtn && navWrapper) {
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = navWrapper.classList.toggle('ativo');
            hamburgerBtn.setAttribute('aria-expanded', isOpen);
            const icon = hamburgerBtn.querySelector('i');
            if (icon) {
                icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
            }
        });

        navWrapper.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navWrapper.classList.remove('ativo');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                const icon = hamburgerBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            });
        });
    }

    // --- ANIMAÇÕES DE SCROLL (fade-in) ---
    const fadeElements = document.querySelectorAll('.fade-in');

    if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visivel');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

        fadeElements.forEach(el => observer.observe(el));
    } else {
        fadeElements.forEach(el => el.classList.add('visivel'));
    }

    // --- NUMBER COUNTER ANIMATION ---
    const counters = document.querySelectorAll('.diferencial-numero');

    if (counters.length > 0 && 'IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const text = el.textContent.trim();
                    const match = text.match(/^(\d+)/);
                    if (match) {
                        const target = parseInt(match[1], 10);
                        const suffix = text.replace(match[1], '');
                        const duration = 2000;
                        const startTime = performance.now();

                        const step = (now) => {
                            const elapsed = now - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const eased = 1 - Math.pow(1 - progress, 3);
                            const current = Math.floor(eased * target);
                            el.textContent = current + suffix;

                            if (progress < 1) {
                                requestAnimationFrame(step);
                            } else {
                                el.textContent = target + suffix;
                            }
                        };

                        el.textContent = '0' + suffix;
                        requestAnimationFrame(step);
                    }
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => counterObserver.observe(c));
    }

    // --- NAVEGAÇÃO GALERIA (setas) ---
    document.querySelectorAll('.galeria-wrapper, .depoimentos-wrapper, .galeria-container').forEach(wrapper => {
        const scrollContainer = wrapper.querySelector('.galeria-scroll, .depoimentos-container, .galeria-rolagem-horizontal');
        const btnEsq = wrapper.querySelector('.galeria-seta-esq, .seta-galeria:first-of-type');
        const btnDir = wrapper.querySelector('.galeria-seta-dir, .seta-galeria:last-of-type');

        if (!scrollContainer) return;

        const scrollAmount = 380;

        if (btnEsq) {
            btnEsq.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
        }

        if (btnDir) {
            btnDir.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    });

    // --- HEADER SCROLL EFFECT ---
    const header = document.querySelector('header');
    let ticking = false;

    const onScroll = () => {
        const currentScroll = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // Progress bar
        const progress = docHeight > 0 ? (currentScroll / docHeight) * 100 : 0;
        scrollProgress.style.width = progress + '%';

        // Back to top
        if (currentScroll > 400) {
            backToTop.classList.add('visivel');
        } else {
            backToTop.classList.remove('visivel');
        }

        // Header shadow
        if (header) {
            if (currentScroll > 80) {
                header.style.boxShadow = '0 4px 30px rgba(30, 58, 138, 0.08)';
                header.style.borderBottomColor = 'transparent';
            } else {
                header.style.boxShadow = 'none';
                header.style.borderBottomColor = 'rgba(30, 58, 138, 0.08)';
            }
        }

        // Parallax on hero
        const banner = document.querySelector('#banner, #banner-lancha, #banner-aventura, #banner-sobre, #banner-contato');
        if (banner && currentScroll < banner.offsetHeight) {
            const parallaxSpeed = 0.35;
            banner.style.backgroundPositionY = (currentScroll * parallaxSpeed) + 'px';
        }

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    // --- BUTTON RIPPLE EFFECT ---
    document.querySelectorAll('.btn-primario, .btn-secundario').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    // --- SMOOTH SCROLL para links âncora ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // --- CARD TILT EFFECT (desktop only) ---
    if (window.innerWidth > 768) {
        document.querySelectorAll('.card-servico, .card-passeio, .valor-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // --- FAQ ACCORDION ---
    document.querySelectorAll('.faq-item').forEach(item => {
        const pergunta = item.querySelector('.faq-pergunta');
        if (pergunta) {
            pergunta.addEventListener('click', () => {
                document.querySelectorAll('.faq-item.ativo').forEach(other => {
                    if (other !== item) other.classList.remove('ativo');
                });
                item.classList.toggle('ativo');
            });
        }
    });

    // --- TYPED TEXT EFFECT ON HERO (optional enhancement) ---
    const heroH1 = document.querySelector('#banner h1');
    if (heroH1) {
        heroH1.style.animation = 'fadeInUp 0.8s 0.5s both';
    }

    // --- TÁBUA DA MARÉ — Dados de Maragogi via scraping ---
    const barraInfo = document.getElementById('barra-mare-info');
    if (barraInfo) {
        fetchTideData(barraInfo);
    }

});

// Tábua da maré — módulo separado (fora do DOMContentLoaded)
async function fetchTideData(barraEl) {
    const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';
    const TARGET = 'https://www.tabuademares.com/br/alagoas/maragogi';
    const CACHE_KEY = 'meucaribe_mare';
    const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 horas

    // Verificar cache
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            const today = new Date().toDateString();
            if (data.date === today && Date.now() - data.ts < CACHE_TTL) {
                renderTideBar(barraEl, data.tides);
                return;
            }
        }
    } catch (_) { /* ignora erro de cache */ }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(PROXY + encodeURIComponent(TARGET), {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error('Fetch failed');
        const html = await res.text();

        // Extrair arrays gm.mareas_x e gm.mareas_y
        const xMatches = [...html.matchAll(/gm\.mareas_x\[(\d+)\]=(\d+)/g)];
        const yMatches = [...html.matchAll(/gm\.mareas_y\[(\d+)\]=([\d.]+)/g)];

        if (xMatches.length < 4 || yMatches.length < 4) throw new Error('Data insuficiente');

        const mareas = [];
        for (let i = 0; i < xMatches.length; i++) {
            const idx = parseInt(xMatches[i][1], 10);
            const minutes = parseInt(xMatches[i][2], 10);
            const height = parseFloat(yMatches[i][2]);
            mareas.push({ idx, minutes, height });
        }

        // Filtrar apenas marés do dia (índices 1, 2, 3 tipicamente)
        // Marés com minutos entre 0 e 1440 que não sejam do dia anterior/seguinte
        const todayTides = mareas
            .filter((_, i) => i >= 1 && i <= 3)
            .map(m => {
                const hours = Math.floor(m.minutes / 60);
                const mins = m.minutes % 60;
                const time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                const type = m.height > 1.0 ? 'alta' : 'baixa';
                return { time, height: m.height.toFixed(1), type };
            });

        if (todayTides.length === 0) throw new Error('Sem marés para hoje');

        // Salvar no cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                date: new Date().toDateString(),
                ts: Date.now(),
                tides: todayTides
            }));
        } catch (_) { /* ignora erro de cache */ }

        window._tideData = todayTides;
        renderTideBar(barraEl, todayTides);
    } catch (err) {
        // Fallback: mensagem genérica com link
        var fb = window.I18N ? window.I18N.t('topbar.fallback', 'Hor\u00e1rios conforme a t\u00e1bua da mar\u00e9 \u2014') : 'Hor\u00e1rios conforme a t\u00e1bua da mar\u00e9 \u2014';
        var fl = window.I18N ? window.I18N.t('topbar.fallback_link', 'Consulte aqui') : 'Consulte aqui';
        var fe = window.I18N ? window.I18N.t('topbar.fallback_end', 'ou fale conosco!') : 'ou fale conosco!';
        barraEl.innerHTML = '<i class="fas fa-water"></i> ' + fb + ' <a href="https://www.tabuademares.com/br/alagoas/maragogi" target="_blank" rel="noopener noreferrer" style="color:#F59E0B;text-decoration:underline">' + fl + '</a> ' + fe + ' <i class="fas fa-umbrella-beach"></i>';
    }
}

function renderTideBar(el, tides) {
    var _t = function(k, fb) { return window.I18N ? window.I18N.t(k, fb) : fb; };
    const icons = { alta: 'fa-arrow-up', baixa: 'fa-arrow-down' };
    const labels = { alta: _t('topbar.tide_high', 'Mar\u00e9 Alta'), baixa: _t('topbar.tide_low', 'Mar\u00e9 Baixa') };
    const items = tides.map(t =>
        `<span class="tide-item"><i class="fas ${icons[t.type]}" style="font-size:0.7em"></i> <strong>${labels[t.type]}</strong> ${t.time} (${t.height}m)</span>`
    );
    el.innerHTML = `<span class="tide-item"><i class="fas fa-water"></i></span> ${items.join('<span class="tide-sep">·</span> ')} <span class="tide-item">— <a href="https://www.tabuademares.com/br/alagoas/maragogi" target="_blank" rel="noopener noreferrer" style="color:#F59E0B;text-decoration:underline">Maragogi, AL</a> <i class="fas fa-umbrella-beach"></i></span>`;
}

// Re-render tide bar on language change
document.addEventListener('langchange', function () {
    if (window._tideData) {
        var barraEl = document.getElementById('barra-mare-info');
        if (barraEl) renderTideBar(barraEl, window._tideData);
    }
});
