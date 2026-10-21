// === MODAL PROMOÇÃO ESPECIAL (NOVO) ===
document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('promo-modal');
    if (!modal) return;
    var closeBtn = modal.querySelector('.promo-modal-close');
    var ctaBtn = modal.querySelector('.promo-modal-cta');
    var adventuresLink = modal.querySelector('.promo-modal-link');

    function showModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        sessionStorage.setItem('promoModalClosed', '1');
    }

    // Só mostra se não fechou nesta sessão
    if (!sessionStorage.getItem('promoModalClosed')) {
        setTimeout(showModal, 5000);
    }

    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) hideModal();
    });
    // Acessibilidade: ESC fecha
    document.addEventListener('keydown', function (e) {
        if (modal.classList.contains('show') && (e.key === 'Escape' || e.key === 'Esc')) hideModal();
    });
    // Botão principal (opcional, já é <a>)
    if (ctaBtn) {
        ctaBtn.addEventListener('click', function() {
            hideModal();
        });
    }
    // Link de aventuras
    if (adventuresLink) {
        adventuresLink.addEventListener('click', function() {
            hideModal();
        });
    }
});
// ===================================================

// --- YOUTUBE SEQUENCIAL (vídeos das páginas de passeios e aventura) ---
document.addEventListener('DOMContentLoaded', function () {
    // Detecta se está em uma das páginas de vídeo
    const isAventura = window.location.pathname.includes('aventura-aquatica');
    const isLancha = window.location.pathname.includes('passeios-lancha') || window.location.pathname.includes('passeio-de-lancha');
    if (!isAventura && !isLancha) return;

    // IDs dos iframes em ordem
    const ytIds = isAventura
        ? ['yt-aventura-1', 'yt-aventura-2', 'yt-aventura-3', 'yt-aventura-4']
        : ['yt-lancha-1', 'yt-lancha-2', 'yt-lancha-3', 'yt-lancha-4', 'yt-lancha-5', 'yt-lancha-6', 'yt-lancha-7', 'yt-lancha-8', 'yt-lancha-9'];

    // Carrega o script do YouTube IFrame (se necessário)
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
    }

    // Armazena os players
    let ytPlayers = [];
    let ytReady = false;

    window.onYouTubeIframeAPIReady = function () {
        ytReady = true;
        ytPlayers = ytIds.map((id, idx) => {
            const el = document.getElementById(id);
            if (!el) return null;
            return new YT.Player(id, {
                events: {
                    'onStateChange': function (event) {
                        // Quando terminar, vai para o próximo
                        if (event.data === YT.PlayerState.ENDED) {
                            const nextIdx = idx + 1;
                            if (ytPlayers[nextIdx]) {
                                ytPlayers[nextIdx].playVideo();
                                // Scroll suave até o próximo vídeo
                                ytPlayers[nextIdx].getIframe().scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }
                    }
                }
            });
        });
    };

    // Se o script já estiver pronto (caso de navegação SPA), inicializa imediatamente
    if (window.YT && window.YT.Player && !ytReady) {
        window.onYouTubeIframeAPIReady();
    }
});
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
    // --- SELETOR DE IDIOMA COMPACTO NO MOBILE ---
    // No celular o cabeçalho não cabe três bandeiras, e o CSS as escondia sem
    // repor em lugar nenhum — o site ficava sem troca de idioma no mobile.
    // Agora mostramos só a bandeira do idioma ativo, ao lado do hambúrguer;
    // tocar nela revela as outras. No desktop nada muda.
    (function () {
        const seletor = document.querySelector('.lang-selector');
        if (!seletor) return;

        const mq = window.matchMedia('(max-width: 900px)');

        function idiomaAtivo() {
            try {
                if (window.I18N && window.I18N.currentLang) return window.I18N.currentLang;
                return localStorage.getItem('meucaribe_lang') || 'pt';
            } catch (_) { return 'pt'; }
        }

        function marcarAtivo() {
            const lang = idiomaAtivo();
            let ordem = 1;
            seletor.querySelectorAll('.lang-btn').forEach(b => {
                const atual = b.getAttribute('data-lang') === lang;
                b.classList.toggle('lang-btn--atual', atual);
                // a ativa fica no topo (0); as demais empilham abaixo
                b.style.setProperty('--ordem', atual ? '0' : String(ordem++));
            });
        }

        function fechar() {
            seletor.classList.remove('lang-selector--aberto');
            seletor.setAttribute('aria-expanded', 'false');
        }

        function aoClicar(e) {
            if (!mq.matches) return;
            const btn = e.target.closest('.lang-btn');
            if (!btn) return;
            // fechado: o primeiro toque só abre a lista
            if (!seletor.classList.contains('lang-selector--aberto')) {
                e.preventDefault();
                e.stopPropagation();
                seletor.classList.add('lang-selector--aberto');
                seletor.setAttribute('aria-expanded', 'true');
                return;
            }
            setTimeout(fechar, 60);
        }

        seletor.setAttribute('aria-label', 'Selecionar idioma');
        seletor.setAttribute('aria-expanded', 'false');
        seletor.addEventListener('click', aoClicar, true);

        document.addEventListener('click', function (e) {
            if (!seletor.contains(e.target)) fechar();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') fechar();
        });

        marcarAtivo();
        document.addEventListener('langchange', function () { marcarAtivo(); fechar(); });
        if (typeof mq.addEventListener === 'function') mq.addEventListener('change', fechar);
    })();

    // --- FORMULÁRIO PARA WHATSAPP ---
    const formWhats = document.getElementById('form-whatsapp');
    if (formWhats) {
        formWhats.addEventListener('submit', function (e) {
            e.preventDefault();
            const nome = formWhats.querySelector('#nome').value.trim();
            const email = formWhats.querySelector('#email').value.trim();
            const assunto = formWhats.querySelector('#assunto').value.trim();
            const mensagem = formWhats.querySelector('#mensagem').value.trim();
            let texto = `*Novo contato pelo site*%0A`;
            if (nome) texto += `*Nome:* ${nome}%0A`;
            if (email) texto += `*E-mail:* ${email}%0A`;
            if (assunto) texto += `*Assunto:* ${assunto}%0A`;
            if (mensagem) texto += `*Mensagem:* ${mensagem}%0A`;
            const fone = '558181211006'; // Substitua pelo seu número com DDI e DDD
            const url = `https://wa.me/${fone}?text=${encodeURI(texto)}`;
            window.open(url, '_blank');
        });
    }

    // --- SCROLL PROGRESS BAR ---
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    scrollProgress.style.width = '0%';
    document.body.prepend(scrollProgress);

    // --- BACK TO TOP BUTTON ---
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.setAttribute('aria-label', 'Voltar ao topo');
    // anel externo mostra o quanto da pagina ja foi percorrido
    backToTop.innerHTML =
        '<svg class="btt-anel" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
        '<circle class="btt-trilho" cx="24" cy="24" r="21"></circle>' +
        '<circle class="btt-progresso" cx="24" cy="24" r="21"></circle>' +
        '</svg>' +
        '<span class="btt-nucleo"><i class="fas fa-arrow-up"></i></span>';
    document.body.appendChild(backToTop);

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- WHATSAPP FLUTUANTE: some sobre o herói ---
    // Usa IntersectionObserver em vez de checar no scroll: o navegador avisa
    // só quando o herói entra ou sai da tela, sem trabalho a cada rolagem.
    (function () {
        const zap = document.querySelector('.whatsapp-flutuante');
        const heroi = document.querySelector('#banner, #banner-lancha, #banner-aventura, #banner-sobre, #banner-contato, #banner-mareas');
        if (!zap || !heroi || !('IntersectionObserver' in window)) return;

        const obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                // visível em mais de 35% da altura do herói = ainda no topo da página
                zap.classList.toggle('no-heroi', e.intersectionRatio > 0.35);
            });
        }, { threshold: [0, 0.35, 0.6, 1] });

        obs.observe(heroi);
    })();

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
        // alimenta o anel do botao de voltar ao topo (0 a 1)
        backToTop.style.setProperty('--progresso', (progress / 100).toFixed(3));

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

    // --- BARRA DO TOPO — Maré + Clima (fontes oficiais) ---
    const barraInfo = document.getElementById('barra-mare-info');
    if (barraInfo) {
        fetchTideData(barraInfo);
    }

    // --- VIDEO CAROUSEL ---
    document.querySelectorAll('.video-carousel').forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const cards = track.querySelectorAll('.video-experience-card');
        const arrowLeft = carousel.querySelector('.carousel-arrow-left');
        const arrowRight = carousel.querySelector('.carousel-arrow-right');
        const indicatorsContainer = carousel.closest('.video-experience-section').querySelector('.carousel-indicators');

        if (!track || cards.length === 0) return;

        let currentIndex = 0;

        function getVisibleCount() {
            if (window.innerWidth <= 600) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 4;
        }

        function getMaxIndex() {
            return Math.max(0, cards.length - getVisibleCount());
        }

        function getCardWidthPercent() {
            const visible = getVisibleCount();
            const gap = visible === 1 ? 16 : 24;
            return { visible, gap };
        }

        function updateCarousel() {
            const { visible, gap } = getCardWidthPercent();
            const cardWidth = (track.offsetWidth - gap * (visible - 1)) / visible;
            const offset = currentIndex * (cardWidth + gap);
            track.style.transform = `translateX(-${offset}px)`;

            if (arrowLeft) arrowLeft.disabled = currentIndex <= 0;
            if (arrowRight) arrowRight.disabled = currentIndex >= getMaxIndex();

            updateIndicators();
        }

        function buildIndicators() {
            if (!indicatorsContainer) return;
            indicatorsContainer.innerHTML = '';
            const totalDots = getMaxIndex() + 1;
            for (let i = 0; i < totalDots; i++) {
                const dot = document.createElement('button');
                dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Slide ${i + 1}`);
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                });
                indicatorsContainer.appendChild(dot);
            }
        }

        function updateIndicators() {
            if (!indicatorsContainer) return;
            indicatorsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }

        if (arrowLeft) {
            arrowLeft.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateCarousel();
                }
            });
        }

        if (arrowRight) {
            arrowRight.addEventListener('click', () => {
                if (currentIndex < getMaxIndex()) {
                    currentIndex++;
                    updateCarousel();
                }
            });
        }

        // Swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        track.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0 && currentIndex < getMaxIndex()) currentIndex++;
                else if (diff < 0 && currentIndex > 0) currentIndex--;
                updateCarousel();
            }
        }, { passive: true });

        // Resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
                buildIndicators();
                updateCarousel();
            }, 150);
        });

        buildIndicators();
        updateCarousel();
    });

    initConsoleEasterEgg();

});

// Barra do topo (maré + clima) — via /api (Vercel)
function formatISODateInTimeZone(date, timeZone) {
    try {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(date);
        const get = (type) => (parts.find(p => p.type === type) || {}).value;
        const y = get('year');
        const m = get('month');
        const d = get('day');
        if (y && m && d) return `${y}-${m}-${d}`;
    } catch (_) {
        // ignore
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const r = await fetch(url, {
            signal: controller.signal,
            headers: { 'accept': 'application/json' }
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
    } finally {
        clearTimeout(t);
    }
}

function mapOpenMeteoWeatherCode(code) {
    const c = Number(code);
    if (Number.isNaN(c)) return 'cloudy';
    if (c === 0) return 'clear';
    if (c === 1 || c === 2) return 'partly_cloudy';
    if (c === 3) return 'cloudy';
    if (c === 45 || c === 48) return 'fog';
    if ([51, 53, 55, 56, 57].includes(c)) return 'drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return 'rain';
    if ([71, 73, 75, 77, 85, 86].includes(c)) return 'snow';
    if ([95, 96, 99].includes(c)) return 'storm';
    return 'cloudy';
}

async function fetchWeatherDirectOpenMeteo() {
    // Same data as /api/weather, but works on static dev servers.
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', '-9.0122');
    url.searchParams.set('longitude', '-35.2225');
    url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
    url.searchParams.set('timezone', 'America/Maceio');

    const json = await fetchJsonWithTimeout(url.toString(), 6500);
    const current = json?.current || {};
    const temperatureC = Number(current.temperature_2m);
    const windKmh = Number(current.wind_speed_10m);
    const conditionKey = mapOpenMeteoWeatherCode(current.weather_code);

    return {
        location: 'Maragogi, AL',
        temperatureC: Number.isFinite(temperatureC) ? temperatureC : null,
        windKmh: Number.isFinite(windKmh) ? windKmh : null,
        conditionKey,
        source: 'open-meteo'
    };
}

function monthKeyPt(monthNumber) {
    const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return months[monthNumber - 1] || null;
}

async function fetchTideFromLocalJson(dateStr) {
    // Le apenas o arquivo do mes corrente (~5 KB) em vez do ano inteiro (~97 KB).
    // Fonte: tabua oficial fornecida pelo cliente (PDFs 2026 e 2027).
    const parsed = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateStr);
    if (!parsed) return null;
    const year = Number(parsed[1]);
    const month = Number(parsed[2]);
    const day = Number(parsed[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

    const file = `/assets/data/mares/${year}-${String(month).padStart(2, '0')}.json`;
    const data = await fetchJsonWithTimeout(file, 6500);
    const eventos = data?.dias?.[String(day)];
    if (!Array.isArray(eventos) || !eventos.length) return null;

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

    const tides = eventos
        .filter(e => e && e.h && Number.isFinite(Number(e.a)))
        .map(e => ({ type: e.t === 'alta' ? 'alta' : 'baixa', time: e.h, height: Number(e.a), flag: e.c }))
        .sort((a, b) => {
            const am = timeToMinutes(a.time);
            const bm = timeToMinutes(b.time);
            if (!Number.isFinite(am) && !Number.isFinite(bm)) return 0;
            if (!Number.isFinite(am)) return 1;
            if (!Number.isFinite(bm)) return -1;
            return am - bm;
        });

    return tides.length ? tides : null;
}

async function fetchTideData(barraEl) {
    const tz = 'America/Maceio';
    const dateStr = formatISODateInTimeZone(new Date(), tz);

    // Sempre usa apenas dados locais e open-meteo, nunca chama /api/tide ou /api/weather
    let finalTides = null;
    let finalWeather = null;

    try { finalWeather = await fetchWeatherDirectOpenMeteo(); } catch (_) { /* ignore */ }
    try { finalTides = await fetchTideFromLocalJson(dateStr); } catch (_) { /* ignore */ }

    window._tideData = finalTides;
    window._weatherData = finalWeather;
    renderTopBar(barraEl, finalTides, finalWeather);
}

function renderTopBar(el, tides, weather) {
    var _t = function (k, fb) { return window.I18N ? window.I18N.t(k, fb) : fb; };

    const tideFallback = _t('topbar.fallback', 'Hor\u00e1rios conforme a t\u00e1bua da mar\u00e9');
    const locationLabel = 'Maragogi, AL';

    let tideItemsHtml = '';
    if (Array.isArray(tides) && tides.length) {
        const icons = { alta: 'fa-arrow-up', baixa: 'fa-arrow-down' };
        const labels = {
            alta: _t('topbar.tide_high', 'Mar\u00e9 Alta'),
            baixa: _t('topbar.tide_low', 'Mar\u00e9 Baixa')
        };
        const limited = tides.slice(0, 4);
        tideItemsHtml = limited.map(t => {
            const icon = icons[t.type] || 'fa-water';
            const label = labels[t.type] || '';
            const h = (t.height != null && !Number.isNaN(Number(t.height))) ? ` (${Number(t.height).toFixed(2)}m)` : '';
            return `<span class="tide-item"><i class="fas ${icon}" style="font-size:0.7em"></i> <strong>${label}</strong> ${t.time}${h}</span>`;
        }).join('<span class="tide-sep">·</span> ');
    }

    let weatherHtml = '';
    if (weather && (weather.temperatureC != null || weather.conditionKey)) {
        const temp = Number(weather.temperatureC);
        const tempTxt = Number.isFinite(temp) ? `${Math.round(temp)}°C` : '';
        const wind = Number(weather.windKmh);
        const windTxt = Number.isFinite(wind) ? `${Math.round(wind)} km/h` : '';
        const conditionKey = String(weather.conditionKey || '');
        const conditionTxt = conditionKey ? _t(`weather.${conditionKey}`, '') : '';

        const iconByKey = {
            clear: 'fa-sun',
            partly_cloudy: 'fa-cloud-sun',
            cloudy: 'fa-cloud',
            fog: 'fa-smog',
            drizzle: 'fa-cloud-rain',
            rain: 'fa-cloud-showers-heavy',
            snow: 'fa-snowflake',
            storm: 'fa-bolt'
        };
        const icon = iconByKey[conditionKey] || 'fa-cloud-sun';

        const parts = [tempTxt, conditionTxt].filter(Boolean);
        const hasMain = parts.length > 0;
        const hasWind = Boolean(windTxt);

        if (hasMain || hasWind) {
            const main = hasMain
                ? `<span class="weather-item tide-item"><i class="fas ${icon}" aria-hidden="true"></i> ${parts.join(' • ')}</span>`
                : '';
            const windHtml = hasWind
                ? `<span class="weather-item tide-item"><i class="fas fa-wind" aria-hidden="true"></i> ${windTxt}</span>`
                : '';

            weatherHtml = `<span class="tide-sep">·</span> ${[main, windHtml].filter(Boolean).join(' <span class="tide-sep">·</span> ')}`;
        }
    }

    if (tideItemsHtml) {
        el.innerHTML = `<span class="tide-item"><i class="fas fa-water" aria-hidden="true"></i></span> ${tideItemsHtml}${weatherHtml} <span class="tide-item">\u2014 ${locationLabel} <i class="fas fa-umbrella-beach" aria-hidden="true"></i></span>`;
        return;
    }

    // Fallback simples.
    el.innerHTML = `<span class="tide-item"><i class="fas fa-water" aria-hidden="true"></i></span> <span class="tide-item">${tideFallback}</span>${weatherHtml} <span class="tide-item">\u2014 ${locationLabel} <i class="fas fa-umbrella-beach" aria-hidden="true"></i></span>`;
}

// Re-render tide bar on language change
document.addEventListener('langchange', function () {
    var barraEl = document.getElementById('barra-mare-info');
    if (!barraEl) return;

    if (window._tideData || window._weatherData) {
        renderTopBar(barraEl, window._tideData, window._weatherData);
        return;
    }

    fetchTideData(barraEl);
});


/* ----------------------------------------------------------------------------
 * Console Easter Egg
 * ------------------------------------------------------------------------- */
function initConsoleEasterEgg() {
  const styles = [
    'color: #3B82F6',
    'font-size: 16px',
    'font-weight: bold',
    'padding: 10px'
  ].join(';');

  const styles2 = [
    'color: #60A5FA',
    'font-size: 14px'
  ].join(';');

  console.log('%c👋 Olá, Dev Curioso!', styles);
  console.log('%cInteressado no código? Vamos conversar!', styles2);
  console.log('%c💼 jardsonflorentino@gmail.com', styles2);
  console.log('%c🔗 https://github.com/JardsonFlorentino', styles2);
  console.log('%c🌐 https://www.jardsonflorentino.com.br/', styles2);
  console.log('%c\n🚀 Site construído com HTML, CSS e JavaScript', 'color: #9ca3af; font-size: 12px');
}

/* ----------------------------------------------------------------------------
 * Google Ads - Conversão "WhatsApp - Reserva"
 * Dispara quando o visitante abre uma conversa no WhatsApp (qualquer botão do site).
 * Valor: R$150 para intenção de reserva ("Reservar"/"Agendar"), R$60 para consulta.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var SEND_TO = 'AW-18054628931/FipMCIe-uN8cEMOMj6FD';

  function enviarConversao(origem, alta) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'conversion', {
      send_to: SEND_TO,
      value: alta ? 150.0 : 60.0,
      currency: 'BRL',
      transaction_id: 'wa-' + Date.now()
    });
    if (window.console && console.debug) {
      console.debug('[Ads] conversão WhatsApp enviada:', origem, alta ? 'R$150' : 'R$60');
    }
  }

  // 1) Qualquer link de WhatsApp do site
  document.addEventListener('click', function (e) {
    var alvo = e.target;
    if (!alvo || typeof alvo.closest !== 'function') return;

    var link = alvo.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="web.whatsapp.com"]');
    if (!link) return;

    var rotulo = (link.innerText || link.getAttribute('aria-label') || link.title || '').toLowerCase();
    var href = (link.getAttribute('href') || '').toLowerCase();
    var textoTotal = rotulo + ' ' + decodeURIComponent(href);

    // "Reservar", "Reserve", "Agendar", "Agende", "Quero reservar" => intenção alta
    var alta = /reserv|agend/.test(textoTotal);

    enviarConversao(rotulo || 'botao-whatsapp', alta);
  }, true);

  // 2) Formulário de contato que abre o WhatsApp via window.open
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form && form.id === 'form-whatsapp') {
      enviarConversao('formulario-contato', true);
    }
  }, true);
})();
