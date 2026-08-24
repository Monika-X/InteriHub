// Main Application Logic - InteriHub

// --- State & Config ---
const state = {
    theme: localStorage.getItem('theme') || 'light',
    isRTL: localStorage.getItem('isRTL') === 'true',
    currentRoute: getRoute()
};

// --- DOM Elements ---
const dom = {
    body: document.body,
    themeToggleBtn: document.getElementById('theme-toggle'),
    navbar: document.getElementById('navbar'),
    appRoot: document.getElementById('app-root'),
    pageTransition: document.querySelector('.page-transition'),
    backToTopBtn: document.getElementById('back-to-top'),
    rtlToggleBtn: document.getElementById('rtl-toggle')
};

// --- Theme Management ---
function initTheme() {
    dom.body.classList.remove('theme-light', 'theme-dark');
    dom.body.classList.add(`theme-${state.theme}`);
    
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', state.theme);
            
            dom.body.classList.remove('theme-light', 'theme-dark');
            dom.body.classList.add(`theme-${state.theme}`);
        });
    });
}

// --- RTL Management ---
function initRTL() {
    const applyRTL = () => {
        document.documentElement.setAttribute('dir', state.isRTL ? 'rtl' : 'ltr');
        document.querySelectorAll('.rtl-toggle-btn').forEach(btn => {
            btn.textContent = state.isRTL ? 'LTR' : 'RTL';
        });
    };

    document.querySelectorAll('.rtl-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.isRTL = !state.isRTL;
            localStorage.setItem('isRTL', state.isRTL);
            applyRTL();
        });
    });

    applyRTL();
}

// --- Profile Dropdown ---
function initProfileMenu() {
    const menu = document.getElementById('profile-menu');
    const trigger = document.querySelector('.profile-trigger');
    if(!menu || !trigger) return;

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = menu.classList.toggle('open');
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => closeProfileMenu());
    });

    document.addEventListener('click', (e) => {
        if(!menu.contains(e.target)) {
            closeProfileMenu();
        }
    });
}

function closeProfileMenu() {
    const menu = document.getElementById('profile-menu');
    const trigger = document.querySelector('.profile-trigger');
    if(menu && trigger) {
        menu.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    }
}

// --- Navigation & Scroll ---
function initNavigation() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            dom.navbar.classList.add('scrolled');
        } else {
            dom.navbar.classList.remove('scrolled');
        }
    });

    dom.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    initMobileMenu();
}

function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (!menuBtn || !navLinks) return;

    const MENU_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
    const CLOSE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>';

    const toggle = (open) => {
        navLinks.classList.toggle('open', open);
        document.body.classList.toggle('menu-open', open);
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuBtn.innerHTML = open ? CLOSE_SVG : MENU_SVG;
    };

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle(!navLinks.classList.contains('open'));
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggle(false));
    });

    document.addEventListener('click', (e) => {
        if (!navLinks.classList.contains('open')) return;
        if (navLinks.contains(e.target) || menuBtn.contains(e.target)) return;
        toggle(false);
    });
}

// Detect the GitHub Pages base path (e.g. "/InteriHub") at runtime
const BASE_PATH = (() => {
    const p = window.location.pathname;
    // If served from a subdir like /InteriHub/, the base is everything before the last segment
    const scriptSrc = document.querySelector('script[src*="app.js"]');
    if (scriptSrc) {
        // e.g. "/InteriHub/js/app.js" → base is "/InteriHub"
        const src = scriptSrc.getAttribute('src');
        const idx = src.indexOf('/js/app.js');
        if (idx > 0) return src.slice(0, idx);
    }
    return '';
})();

function getRoute() {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash === '/index.html' ? '/' : hash;
    let path = window.location.pathname;
    // Strip the base path prefix so /InteriHub/about → /about
    if (BASE_PATH && path.startsWith(BASE_PATH)) {
        path = path.slice(BASE_PATH.length) || '/';
    }
    if (!path || path === '/index.html' || path === '/') return '/';
    return path;
}

const routes = {
    '/': renderHome,
    '/index.html': renderHome,
    '/blog-details': renderBlogDetails
    // Other routes will dynamically fetch from /pages/[route].html
};

function getQueryParam(name) {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return null;
    return new URLSearchParams(hash.slice(qIndex + 1)).get(name);
}

async function handleRoute(path) {
    const routeKey = path.split('?')[0];
    // Prevent routing if it's the same page
    if(path === state.currentRoute && dom.appRoot.innerHTML.trim() !== '') return;
    state.currentRoute = path;

    // Close profile dropdown on navigation
    closeProfileMenu();

    // Transition out
    dom.pageTransition.classList.add('active');
    
    // Wait for transition overlay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Render view
    let is404 = false;
    if (routes[routeKey]) {
        dom.appRoot.innerHTML = await routes[routeKey]();
    } else {
        try {
            const pageName = routeKey === '/' ? 'home' : routeKey.replace('/', '');
            const response = await fetch(`pages/${pageName}.html`);
            if (response.ok) {
                dom.appRoot.innerHTML = await response.text();
            } else {
                dom.appRoot.innerHTML = await render404();
                is404 = true;
            }
        } catch (error) {
            dom.appRoot.innerHTML = await render404();
            is404 = true;
        }
    }

    // Minimal pages: hide navbar/footer, show floating controls
    const minimalPages = ['/login', '/signup', '/dashboard', '/admin-dashboard', '/404', '/maintenance'];
    dom.body.classList.toggle('page-auth', minimalPages.includes(routeKey) || is404);
    
    if (path === '/dashboard') {
        initDashboard();
    }
    
    if (path === '/admin-dashboard') {
        initAdminDashboard();
    }
    
    if (path === '/blog') {
        initBlogFilters();
    }
    
    // Re-initialize Lucide icons for new content
    if(window.lucide) {
        window.lucide.createIcons();
    }
    
    // Update Active Nav Link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === routeKey || (routeKey === '/blog-details' && link.getAttribute('href') === '/blog')) {
            link.classList.add('active');
        }
    });
    
    window.scrollTo(0, 0);

    // Transition in
    dom.pageTransition.classList.remove('active');
    
    // Trigger scroll reveal animations after render
    initScrollReveal();
}

function initRouter() {
    document.addEventListener('click', e => {
        const link = e.target.closest('a[data-route]');
        if (link) {
            const path = link.getAttribute('href');
            if (!path || path === '#') return;
            e.preventDefault();
            if (getRoute() === path) return;
            window.location.hash = path;
            handleRoute(path);
        }
    });

    window.addEventListener('hashchange', () => {
        handleRoute(getRoute());
    });

    // Initial load
    handleRoute(getRoute());
}

// --- Scroll Reveal Animation ---
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
}

// --- Views (Simulated Components) ---

async function renderHome() {
    return `
        <section class="home-hero">
            <div class="container">
                <div class="home-hero-grid">
                    <div class="home-hero-text">
                        <span class="home-hero-ghost" aria-hidden="true">Elegance</span>
                        <p class="home-eyebrow reveal-up">Private Interiors — Est. 2020</p>
                        <h1 class="display-1 home-hero-title reveal-up" style="transition-delay: 0.15s;">
                            Where Elegance<br><em>Meets Comfort.</em>
                        </h1>
                        <p class="text-lead home-hero-lead reveal-up" style="transition-delay: 0.3s;">
                            Architectural elegance for modern living. We craft timeless interiors that merge profound artistic vision with sophisticated, livable spaces.
                        </p>
                        <div class="reveal-up" style="transition-delay: 0.45s;">
                            <a href="/services" data-route class="btn btn-primary">Begin Consultation</a>
                            <a href="/about" data-route class="btn btn-outline" style="margin-inline-start: 1rem;">The Studio</a>
                        </div>
                    </div>
                    <div class="home-hero-media reveal-up" style="transition-delay: 0.3s;">
                        <div class="home-hero-frame">
                            <img src="assets/images/hero-interior.jpg" alt="Luxury Interior" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        </div>
                        <div class="home-hero-thumb">
                            <img src="assets/images/project-1.jpg" alt="Detail" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        </div>
                        <div class="home-hero-badge reveal-up" style="transition-delay: 0.6s;">
                            <svg viewBox="0 0 100 100" aria-hidden="true">
                                <defs>
                                    <path id="homeBadgeCircle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"></path>
                                </defs>
                                <text>
                                    <textPath href="#homeBadgeCircle">PRIVATE INTERIORS &bull; EST. 2020 &bull; NEW YORK &bull; LONDON &bull;</textPath>
                                </text>
                            </svg>
                            <span class="home-hero-badge-center" aria-hidden="true">&darr;</span>
                        </div>
                        <div class="home-hero-caption">Plate 01 — The Obsidian Residence</div>
                    </div>
                </div>
                <div class="home-hero-meta reveal-up">
                    <span>New York — London — Dubai</span>
                    <span class="home-hero-scroll">Scroll to explore &darr;</span>
                </div>
            </div>
        </section>

        <section class="home-band">
            <div class="container">
                <span class="home-band-mark reveal-up" aria-hidden="true"></span>
                <p class="home-eyebrow home-eyebrow-center reveal-up">The Studio</p>
                <h2 class="home-statement reveal-up">
                    Every residence is a single, continuous composition — where light, proportion and material converge to shape how a home is <em>felt</em>, not just seen.
                </h2>
                <a href="/about" data-route class="home-underline-link reveal-up">Discover the Studio <span>&rarr;</span></a>
                <div class="home-disciplines reveal-up">
                    <span>Spatial Design</span><i></i>
                    <span>Material Culture</span><i></i>
                    <span>Artisan Craft</span><i></i>
                    <span>Light Studies</span>
                </div>
            </div>
        </section>

        <section class="home-works">
            <div class="container">
                <div class="home-works-head reveal-up">
                    <div>
                        <p class="home-eyebrow">Selected Works</p>
                        <h2 class="home-works-title">Curated spaces, <em>artistic intent</em></h2>
                    </div>
                    <a href="/obsidian-residence" data-route class="home-works-link">View All Works &rarr;</a>
                </div>
            </div>
            <div class="container">
                <div class="home-works-grid reveal-up">
                <a href="/obsidian-residence" data-route class="home-work-card">
                    <span class="home-work-card-num">I</span>
                    <div class="home-work-card-img">
                        <img src="assets/images/project-1.jpg" alt="The Obsidian Residence" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        <span class="home-work-card-arrow" aria-hidden="true">&rarr;</span>
                    </div>
                    <div class="home-work-card-body">
                        <h3>The Obsidian Residence</h3>
                        <p>Living Room Design — New York</p>
                    </div>
                </a>
                <a href="/ivory-coastal-villa" data-route class="home-work-card">
                    <span class="home-work-card-num">II</span>
                    <div class="home-work-card-img">
                        <img src="assets/images/project-2.jpg" alt="Ivory Coastal Villa" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        <span class="home-work-card-arrow" aria-hidden="true">&rarr;</span>
                    </div>
                    <div class="home-work-card-body">
                        <h3>Ivory Coastal Villa</h3>
                        <p>Full Home Renovation — Malibu</p>
                    </div>
                </a>
                <a href="/taupe-penthouse" data-route class="home-work-card">
                    <span class="home-work-card-num">III</span>
                    <div class="home-work-card-img">
                        <img src="assets/images/project-3.jpg" alt="Taupe Penthouse" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        <span class="home-work-card-arrow" aria-hidden="true">&rarr;</span>
                    </div>
                    <div class="home-work-card-body">
                        <h3>Taupe Penthouse</h3>
                        <p>Master Suite — Manhattan</p>
                    </div>
                </a>
            </div>
        </section>

        <section class="home-philosophy">
            <div class="container home-philosophy-grid">
                <div class="reveal-up">
                    <p class="home-eyebrow">Design Philosophy</p>
                    <h2 class="home-statement home-statement-left">Spaces conceived as <em>living architecture</em></h2>
                    <p class="home-philosophy-text">We approach every residence as a unique dialogue between structure and soul — where light, proportion and material converge to shape how a home is felt, not just seen.</p>
                    <a href="/about" data-route class="btn btn-outline">The Studio</a>
                </div>
                <div class="home-stats reveal-up">
                    <div class="home-stat">
                        <h3>12+</h3>
                        <p>Years of practice</p>
                    </div>
                    <div class="home-stat">
                        <h3>240</h3>
                        <p>Projects delivered</p>
                    </div>
                    <div class="home-stat">
                        <h3>18</h3>
                        <p>Design awards won</p>
                    </div>
                    <div class="home-stat">
                        <h3>96%</h3>
                        <p>Client retention</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="home-process">
            <div class="container">
                <div class="home-works-head reveal-up">
                    <div>
                        <p class="home-eyebrow">How We Work</p>
                        <h2 class="home-works-title">A considered path from brief to home</h2>
                    </div>
                </div>
                <div class="home-process-grid">
                    <div class="home-process-step reveal-up">
                        <span class="home-process-num">01</span>
                        <h3>Consult</h3>
                        <p>A private session to understand your rituals, tastes and the life the space must hold.</p>
                    </div>
                    <div class="home-process-step reveal-up" style="transition-delay: 0.1s;">
                        <span class="home-process-num">02</span>
                        <h3>Design</h3>
                        <p>Concept boards, material studies and 3D walkthroughs refined until every detail is resolved.</p>
                    </div>
                    <div class="home-process-step reveal-up" style="transition-delay: 0.2s;">
                        <span class="home-process-num">03</span>
                        <h3>Build</h3>
                        <p>A dedicated crew handles fabrication, procurement and installation with obsessive precision.</p>
                    </div>
                    <div class="home-process-step reveal-up" style="transition-delay: 0.3s;">
                        <span class="home-process-num">04</span>
                        <h3>Live</h3>
                        <p>A styled handover and lifetime care program — the home continues to evolve with you.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="home-journal">
            <div class="container">
                <div class="home-works-head reveal-up">
                    <div>
                        <p class="home-eyebrow">From the Journal</p>
                        <h2 class="home-works-title">Notes on material &amp; light</h2>
                    </div>
                    <a href="/blog" data-route class="btn btn-outline">All Insights</a>
                </div>
                <div class="home-journal-grid">
                    <article class="home-journal-card reveal-up">
                        <a href="/blog-details?post=sourcing-travertine" data-route>
                            <div class="home-journal-img"><img src="https://i.pinimg.com/736x/33/95/70/33957001a5d064a3237a9f689e91b52a.jpg" alt="Sourcing Italian Travertine" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';"></div>
                            <p class="home-journal-num">01</p>
                            <p class="home-journal-tag">Materials — 6 Min Read</p>
                            <h3>Sourcing Italian Travertine</h3>
                            <p class="home-journal-text">A journey to the quarries of Tivoli, east of Rome, where travertine has been pulled from the earth since the days of the Colosseum.</p>
                            <span class="home-journal-read">Read Article &rarr;</span>
                        </a>
                    </article>
                    <article class="home-journal-card reveal-up" style="transition-delay: 0.1s;">
                        <a href="/blog-details?post=layered-light-living" data-route>
                            <div class="home-journal-img"><img src="https://i.pinimg.com/736x/d3/12/a0/d312a07cd64e6018409d811361cdfe34.jpg" alt="Layered Light in the Living Room" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';"></div>
                            <p class="home-journal-num">02</p>
                            <p class="home-journal-tag">Lighting — 4 Min Read</p>
                            <h3>Layered Light in the Living Room</h3>
                            <p class="home-journal-text">Combining daylight, task and accent light to compose rooms that shift through the day — three rooms by dinner, only light can do that.</p>
                            <span class="home-journal-read">Read Article &rarr;</span>
                        </a>
                    </article>
                    <article class="home-journal-card reveal-up" style="transition-delay: 0.2s;">
                        <a href="/blog-details?post=budgeting-invisible" data-route>
                            <div class="home-journal-img"><img src="https://i.pinimg.com/736x/2b/cb/a5/2bcba5fad2e3953134d42035da8b6afa.jpg" alt="Budgeting the Invisible" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';"></div>
                            <p class="home-journal-num">03</p>
                            <p class="home-journal-tag">Process — 6 Min Read</p>
                            <h3>Budgeting the Invisible</h3>
                            <p class="home-journal-text">Why the most important spend in any renovation is the part you never see — the unglamorous skeleton that makes luxury possible.</p>
                            <span class="home-journal-read">Read Article &rarr;</span>
                        </a>
                    </article>
                </div>
            </div>
        </section>

        <section class="home-quote">
            <div class="container">
                <p class="home-quote-mark reveal-up" aria-hidden="true">&ldquo;</p>
                <p class="home-quote-text reveal-up">
                    InteriHub doesn't decorate rooms — they compose them. Every corner feels deliberate, every material speaks.
                </p>
                <p class="home-quote-attr reveal-up">— The Harrison Family, Manhattan</p>
                <div class="home-quote-actions reveal-up">
                    <a href="/services" data-route class="btn btn-primary" style="background-color: var(--color-antique-gold); color: var(--color-obsidian); border: none;">Explore Services</a>
                    <a href="/contact" data-route class="btn btn-outline" style="color: var(--color-warm-ivory); border-color: var(--color-warm-ivory);">Begin Your Project</a>
                </div>
            </div>
        </section>

        <style>
            .reveal-up {
                opacity: 0;
                transform: translateY(40px);
                transition: opacity 0.8s ease, transform 0.8s ease;
            }
            .reveal-up.revealed {
                opacity: 1;
                transform: translateY(0);
            }

            .home-eyebrow {
                font-size: 0.7rem;
                letter-spacing: 0.35em;
                text-transform: uppercase;
                color: var(--color-antique-gold);
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 2rem;
            }
            .home-eyebrow::before {
                content: '';
                width: 28px;
                height: 1px;
                background: var(--color-antique-gold);
                display: inline-block;
            }
            .home-eyebrow-center {
                justify-content: center;
                margin-bottom: 3rem;
            }
            .home-eyebrow-center::before { display: none; }

            .home-hero {
                min-height: 100vh;
                display: flex;
                align-items: center;
                position: relative;
                overflow: hidden;
                padding-top: 110px;
                padding-bottom: 2rem;
                background-color: var(--bg-primary);
            }
            .home-hero-grid {
                display: grid;
                grid-template-columns: 1.1fr 0.9fr;
                gap: 5rem;
                align-items: center;
            }
            .home-hero-text { position: relative; }
            .home-hero-ghost {
                position: absolute;
                top: -5rem;
                left: -2rem;
                font-family: var(--font-heading);
                font-size: clamp(5rem, 13vw, 10rem);
                color: rgba(23, 23, 23, 0.04);
                line-height: 1;
                white-space: nowrap;
                user-select: none;
                pointer-events: none;
                z-index: -1;
            }
            .theme-dark .home-hero-ghost { color: rgba(247, 243, 237, 0.05); }
            .home-hero-title {
                margin-bottom: 2rem;
                letter-spacing: -0.02em;
            }
            .home-hero-title em {
                font-style: italic;
                color: var(--color-antique-gold);
            }
            .home-hero-lead {
                max-width: 500px;
                margin-bottom: 3rem;
            }
            .home-hero-media { position: relative; }
            .home-hero-frame {
                position: relative;
                aspect-ratio: 4/5;
                overflow: hidden;
                background: var(--color-obsidian-light);
            }
            .home-hero-frame::before {
                content: '';
                position: absolute;
                inset: 0;
                transform: translate(1.25rem, 1.25rem);
                border: 1px solid var(--color-antique-gold);
                z-index: 0;
            }
            .home-hero-frame img {
                position: relative;
                z-index: 1;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .home-hero-frame:hover img { transform: scale(1.04); }
            .home-hero-thumb {
                position: absolute;
                left: -18%;
                bottom: 10%;
                width: 44%;
                aspect-ratio: 4/5;
                border: 6px solid var(--bg-primary);
                overflow: hidden;
                z-index: 2;
            }
            .home-hero-thumb img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: saturate(0.92);
                transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .home-hero-thumb:hover img { transform: scale(1.06); }
            .home-hero-badge {
                position: absolute;
                right: -3.25rem;
                bottom: -2.25rem;
                width: 132px;
                height: 132px;
                z-index: 3;
                animation: homeBadgeSpin 16s linear infinite;
            }
            .home-hero-badge svg { width: 100%; height: 100%; }
            .home-hero-badge text {
                font-size: 7.5px;
                letter-spacing: 0.22em;
                text-transform: uppercase;
                fill: var(--color-antique-gold);
                font-family: var(--font-body);
            }
            .home-hero-badge-center {
                position: absolute;
                inset: 0;
                margin: auto;
                width: 42px;
                height: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--color-antique-gold);
                color: var(--color-obsidian);
                border-radius: 50%;
                font-size: 1rem;
            }
            @keyframes homeBadgeSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .home-hero-caption {
                display: flex;
                justify-content: space-between;
                margin-top: 1.25rem;
                font-size: 0.7rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-muted);
            }
            .home-hero-meta {
                display: flex;
                justify-content: space-between;
                border-top: 1px solid var(--border-color);
                padding-top: 1.25rem;
                margin-top: 4rem;
                font-size: 0.7rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-muted);
            }
            .home-hero-scroll { color: var(--color-antique-gold); }

            .home-band {
                padding: 9rem 0;
                background-color: var(--bg-secondary);
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .home-band-mark {
                display: block;
                width: 10px;
                height: 10px;
                margin: 0 auto 2.5rem;
                border: 1px solid var(--color-antique-gold);
                transform: rotate(45deg);
            }
            .home-disciplines {
                display: flex;
                justify-content: center;
                align-items: center;
                flex-wrap: wrap;
                gap: 1.25rem;
                margin-top: 4rem;
                padding-top: 2rem;
                border-top: 1px solid var(--border-color);
            }
            .home-disciplines span {
                font-size: 0.7rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-muted);
            }
            .home-disciplines i {
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: var(--color-antique-gold);
                display: inline-block;
            }
            .home-statement {
                font-family: var(--font-heading);
                font-size: clamp(2.25rem, 5vw, 4rem);
                font-weight: 300;
                line-height: 1.15;
                max-width: 1000px;
                margin: 0 auto;
            }
            .home-statement em { font-style: italic; color: var(--color-antique-gold); }
            .home-underline-link {
                display: inline-flex;
                align-items: center;
                gap: 0.75rem;
                margin-top: 3rem;
                font-size: 0.75rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-primary);
                border-bottom: 1px solid var(--text-primary);
                padding-bottom: 0.5rem;
                transition: gap 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
            .home-underline-link:hover { gap: 1.25rem; color: var(--color-antique-gold); border-color: var(--color-antique-gold); }

            .home-works {
                padding: 6rem 0 7rem;
                background-color: var(--bg-primary);
            }
            .home-works-head {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-bottom: 3rem;
            }
            .home-works-title {
                font-family: var(--font-heading);
                font-size: clamp(1.75rem, 3vw, 2.5rem);
                font-weight: 300;
                margin: 0;
            }
            .home-works-title em {
                font-style: italic;
                color: var(--color-antique-gold);
            }
            .home-works-link {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.7rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-muted);
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 0.4rem;
                transition: gap 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
            .home-works-link:hover { gap: 1rem; color: var(--color-antique-gold); border-color: var(--color-antique-gold); }
            .home-works-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 2.5rem;
                align-items: start;
            }
            .home-work-card { color: var(--text-primary); }
            .home-work-card-num {
                display: inline-block;
                font-family: var(--font-heading);
                font-size: 0.8rem;
                font-style: italic;
                color: var(--color-antique-gold);
                margin-bottom: 0.75rem;
                letter-spacing: 0.15em;
            }
            .home-work-card-img {
                position: relative;
                aspect-ratio: 4/3;
                overflow: hidden;
                background: var(--color-obsidian-light);
                border: 1px solid var(--border-color);
            }
            .home-work-card-img img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .home-work-card:hover .home-work-card-img img { transform: scale(1.05); }
            .home-work-card-arrow {
                position: absolute;
                inset-inline-end: 0.9rem;
                bottom: 0.9rem;
                width: 34px;
                height: 34px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--color-warm-ivory);
                color: var(--color-obsidian);
                font-size: 1rem;
                border-radius: 50%;
                opacity: 0;
                transform: translateY(8px);
                transition: opacity 0.4s ease, transform 0.4s ease;
            }
            .home-work-card:hover .home-work-card-arrow {
                opacity: 1;
                transform: translateY(0);
            }
            .home-work-card-body {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: 1rem;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid var(--border-color);
            }
            .home-work-card-body h3 {
                font-family: var(--font-heading);
                font-size: 1.25rem;
                font-weight: 300;
                margin: 0;
                transition: color 0.4s ease;
            }
            .home-work-card:hover .home-work-card-body h3 { color: var(--color-antique-gold); }
            .home-work-card-body p {
                font-size: 0.65rem;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: var(--text-muted);
                margin: 0;
                text-align: end;
            }

            .home-philosophy {
                padding: 9rem 0;
                background-color: var(--bg-secondary);
            }
            .home-philosophy-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5rem;
                align-items: center;
            }
            .home-statement-left {
                text-align: left;
                margin: 0 0 2rem;
                max-width: 560px;
            }
            .home-philosophy-text {
                color: var(--text-muted);
                max-width: 480px;
                margin-bottom: 2.5rem;
            }
            .home-stats {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 3rem 2rem;
            }
            .home-stat {
                border-top: 1px solid var(--border-color);
                padding-top: 1.5rem;
            }
            .home-stat h3 {
                font-family: var(--font-heading);
                font-size: clamp(2.5rem, 4vw, 3.5rem);
                font-weight: 300;
                color: var(--color-antique-gold);
                margin-bottom: 0.5rem;
            }
            .home-stat p {
                color: var(--text-muted);
                font-size: 0.75rem;
                letter-spacing: 0.2em;
                text-transform: uppercase;
            }

            .home-process {
                padding: 9rem 0;
                background-color: var(--bg-primary);
            }
            .home-process-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 2rem;
            }
            .home-process-step {
                border-top: 1px solid var(--border-color);
                padding-top: 2rem;
            }
            .home-process-num {
                font-family: var(--font-heading);
                font-size: 2.5rem;
                color: var(--color-antique-gold);
                display: block;
                margin-bottom: 1rem;
            }
            .home-process-step h3 {
                font-size: 1rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 0.75rem;
            }
            .home-process-step p {
                color: var(--text-muted);
                font-size: 0.9rem;
            }

            .home-journal {
                padding: 9rem 0;
                background-color: var(--bg-secondary);
            }
            .home-journal-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 2rem;
            }
            .home-journal-card a { display: block; }
            .home-journal-img {
                aspect-ratio: 4/3;
                overflow: hidden;
                margin-bottom: 1.5rem;
                background: var(--color-obsidian-light);
            }
            .home-journal-img img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .home-journal-card:hover .home-journal-img img { transform: scale(1.06); }
            .home-journal-tag {
                color: var(--color-antique-gold);
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.2em;
                margin-bottom: 0.75rem;
            }
            .home-journal-num {
                font-family: var(--font-heading);
                font-size: 1rem;
                font-style: italic;
                color: var(--color-antique-gold);
                margin-bottom: 0.5rem;
            }
            .home-journal-card h3 {
                font-family: var(--font-heading);
                font-size: 1.5rem;
                font-weight: 300;
                margin-bottom: 0.75rem;
                transition: color 0.3s ease;
            }
            .home-journal-card:hover h3 { color: var(--color-antique-gold); }
            .home-journal-text {
                color: var(--text-muted);
                font-size: 0.9rem;
                margin-bottom: 1.25rem;
            }
            .home-journal-read {
                font-size: 0.7rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-primary);
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 0.35rem;
                transition: color 0.3s ease, border-color 0.3s ease;
            }
            .home-journal-card:hover .home-journal-read {
                color: var(--color-antique-gold);
                border-color: var(--color-antique-gold);
            }

            .home-quote {
                padding: 9rem 0;
                background-color: var(--color-obsidian);
                color: var(--color-warm-ivory);
                text-align: center;
            }
            .home-quote-mark {
                font-family: var(--font-heading);
                font-size: clamp(5rem, 10vw, 8rem);
                line-height: 0.4;
                color: var(--color-antique-gold);
                margin-bottom: 2rem;
            }
            .home-quote-text {
                font-family: var(--font-heading);
                font-size: clamp(1.75rem, 4vw, 3.25rem);
                font-style: italic;
                font-weight: 300;
                max-width: 900px;
                margin: 0 auto;
                line-height: 1.35;
                color: var(--color-warm-ivory);
            }
            .home-quote-attr {
                color: var(--color-antique-gold);
                margin-top: 2rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                font-size: 0.75rem;
            }
            .home-quote-actions {
                margin-top: 3rem;
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }

            @media (max-width: 992px) {
                .home-hero-grid { grid-template-columns: 1fr; gap: 3rem; }
                .home-hero-meta { margin-top: 2.5rem; }
                .home-hero-media { max-width: 460px; }
                .home-hero-thumb { left: auto; right: -1rem; width: 40%; }
                .home-hero-badge { right: -1rem; width: 110px; height: 110px; }
                .home-philosophy-grid { grid-template-columns: 1fr; gap: 3rem; }
                .home-process-grid { grid-template-columns: repeat(2, 1fr); gap: 2.5rem; }
                .home-journal-grid { grid-template-columns: 1fr; }
                .home-works-head { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                .home-works-grid { grid-template-columns: 1fr; gap: 2.5rem; }
            }
            @media (max-width: 640px) {
                .home-hero-ghost { font-size: clamp(3rem, 14vw, 5rem); top: -3rem; left: -1rem; }
                .home-hero-badge { width: 92px; height: 92px; }
                .home-works { padding: 5rem 0 6rem; }
                .home-work-card-body { flex-direction: column; gap: 0.25rem; align-items: flex-start; }
                .home-work-card-body p { text-align: start; }
                .home-process-grid { grid-template-columns: 1fr; }
                .home-stats { grid-template-columns: 1fr 1fr; }
            }
        </style>
    `;
}

async function render404() {
    try {
        const response = await fetch('pages/404.html');
        if (response.ok) {
            return await response.text();
        }
    } catch (e) {
        // Fallback
    }
    return `<section style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;padding:120px 24px;background-color:var(--bg-primary);">
        <div style="position:relative;z-index:1;max-width:640px;width:100%;padding:4rem 3rem;border:1px solid var(--border-color);background:var(--bg-primary);box-shadow:0 40px 80px -40px rgba(0,0,0,0.2);">
            <span style="position:absolute;top:-2.5rem;left:50%;transform:translateX(-50%);font-family:var(--font-heading);font-style:italic;font-size:4.5rem;color:rgba(23,23,23,0.05);white-space:nowrap;user-select:none;pointer-events:none;line-height:1;">Error</span>
            <p style="font-family:var(--font-heading);font-size:clamp(5rem,18vw,10rem);font-weight:300;line-height:0.9;color:var(--text-primary);margin:0 0 1.5rem;">4<span style="font-style:italic;color:var(--color-antique-gold);">0</span>4</p>
            <h1 style="font-family:var(--font-heading);font-size:clamp(1.5rem,3.5vw,2.5rem);font-weight:300;margin:0 0 1.25rem;">Space <em style="font-style:italic;color:var(--color-antique-gold);">Not Found</em></h1>
            <p style="color:var(--text-muted);max-width:420px;margin:0 auto 2.5rem;line-height:1.7;font-size:0.95rem;">The page you are looking for has been relocated or never existed — an empty volume awaiting its first line.</p>
            <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
                <a href="/" data-route style="display:inline-block;padding:1rem 2.25rem;border:1px solid var(--color-obsidian);background:var(--color-obsidian);color:var(--color-warm-ivory);font-size:0.72rem;letter-spacing:0.3em;text-transform:uppercase;">Return Home</a>
                <a href="/sitemap" data-route style="display:inline-block;padding:1rem 2.25rem;border:1px solid var(--text-primary);color:var(--text-primary);font-size:0.72rem;letter-spacing:0.3em;text-transform:uppercase;">View Sitemap</a>
            </div>
        </div>
    </section>`;
}

// --- Blog Filters ---
function initBlogFilters() {
    const buttons = document.querySelectorAll('.blog-filter-btn');
    const cards = Array.from(document.querySelectorAll('.blog-card'));
    const viewMore = document.querySelector('.blog-view-more');
    if (!buttons.length || !cards.length) return;

    let visibleCount = 4;

    function apply() {
        const activeFilter = document.querySelector('.blog-filter-btn.active').getAttribute('data-filter');
        cards.forEach((card, idx) => {
            const show = activeFilter === 'all' ? idx < visibleCount : card.getAttribute('data-category') === activeFilter;
            if (show) {
                card.setAttribute('data-hidden', 'false');
                card.style.animation = 'none';
                card.offsetHeight;
                card.style.animation = 'blogCardIn 0.5s ease forwards';
            } else {
                card.setAttribute('data-hidden', 'true');
            }
        });
        if (viewMore) {
            viewMore.style.display = (activeFilter === 'all' && visibleCount < cards.length) ? 'inline-block' : 'none';
        }
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.getAttribute('data-filter') === 'all') {
                visibleCount = 4;
            }
            apply();
        });
    });

    if (viewMore) {
        viewMore.addEventListener('click', () => {
            visibleCount = Math.min(visibleCount + 4, cards.length);
            apply();
        });
    }

    apply();
}

// --- Blog Post Data ---
const BLOG_POSTS = {
    'psychology-of-volume': {
        title: 'The Psychology of Volume', category: 'Architecture', author: 'Elena Rostova',
        date: 'October 12, 2026', readTime: '5 min read',
        image: 'https://i.pinimg.com/736x/04/8f/37/048f37deffa60841e4b3980ce0ffccf3.jpg',
        intro: 'When we enter a space, our first reaction is rarely to the furniture or the color palette; it is to the volume. The distance between the floor and the ceiling, the expanse of the walls — these elements dictate our psychological response before conscious thought begins.',
        sections: [
            { heading: 'Compression and Release', body: 'Frank Lloyd Wright famously utilized the architectural concept of compression and release. By lowering the ceiling in an entryway (compression), the subsequent expansion of a high-ceilinged living room (release) feels exponentially more profound. Our bodies register the shift before our eyes can explain it.' },
            { heading: 'Designing the Invisible', body: 'In our recent Ivory Coastal Villa project, we deliberately compressed the gallery hall using dark obsidian paneling and a dropped soffit, leading to a double-height grand room bathed in natural light. Visitors consistently pause at the threshold — the psychological threshold — before stepping into the light. The effect is transformative, and it costs nothing more than discipline.' }
        ],
        quote: 'Volume is the invisible material with which an architect sculpts emotion.',
        outro: 'The next time you enter a room, notice what you feel before you notice what you see. That gap is where our discipline begins — and where a house becomes a home.'
    },
    'sourcing-travertine': {
        title: 'Sourcing Italian Travertine', category: 'Materials', author: 'Marcus Chen',
        date: 'September 28, 2026', readTime: '6 min read',
        image: 'https://i.pinimg.com/736x/33/95/70/33957001a5d064a3237a9f689e91b52a.jpg',
        intro: 'A journey to the quarries of Tivoli, east of Rome, where travertine has been pulled from the earth since the days of the Colosseum. It is the warmest stone we know — and the most misunderstood.',
        sections: [
            { heading: 'The Quarries of Tivoli', body: 'Each block emerges with its own geological signature — pockets of air formed by ancient thermal springs, veins that no two slabs will ever repeat. We select slabs in person, on our knees, with natural light falling at the same angle it will fall in your living room.' },
            { heading: 'Cross-Cut vs. Vein-Cut', body: 'The same block yields two completely different faces: cross-cut shows the stone\'s soft, cloud-like layers; vein-cut exposes its linear river of sediment. We map both against the scale of the room — a small space calls for the quiet of cross-cut, a grand hall for the drama of the veins.' }
        ],
        quote: 'Travertine is not a material you choose; it is a landscape you bring indoors.',
        outro: 'Our Tivoli selection now graces three residences and a private gallery — each slab numbered, documented, and irreplaceable.'
    },
    'sculpting-shadows': {
        title: 'Sculpting with Shadows', category: 'Lighting', author: 'Elena Rostova',
        date: 'September 10, 2026', readTime: '4 min read',
        image: 'https://i.pinimg.com/736x/d7/0f/93/d70f9333a39fa75874faeca95a1becce.jpg',
        intro: 'The art of concealed architectural illumination and what it teaches us about night. Shadows are not the absence of light — they are light\'s most expressive instrument.',
        sections: [
            { heading: 'The Coved Ceiling', body: 'A coved ceiling throws light upward into a soft pool that never touches a fixture. The room appears to glow from within its own structure. No glare, no source, no argument — just atmosphere, exactly as a quiet evening should be.' },
            { heading: 'Threshold Drama', body: 'We use narrow, grazing light at door thresholds to make passage feel ceremonial. The shadow of a person crossing becomes an event — a moving silhouette against warm stone. Guests remember these moments without knowing why.' }
        ],
        quote: 'A well-designed shadow is worth more than a dozen well-designed lamps.',
        outro: 'Light is easiest to notice when it is wrong. Our work is to make it so right that you only ever feel it.'
    },
    'renovation-12-months': {
        title: 'Inside a 12-Month Renovation', category: 'Process', author: 'Sarah Jenkins',
        date: 'August 22, 2026', readTime: '7 min read',
        image: 'https://i.pinimg.com/736x/e0/c7/05/e0c705772466eca16dd518850b4ba8b7.jpg',
        intro: 'A behind-the-scenes account of our most demanding transformation to date — a Georgian townhouse in London\'s Holland Park, stripped to brick and rebuilt over twelve unbroken months.',
        sections: [
            { heading: 'The First Three Months', body: 'Demolition, structural surveys and the discovery of two original Victorian fireplaces hidden behind 1970s paneling. The schedule absorbed both surprises because we had built contingency into the critical path — never into the design.' },
            { heading: 'The Final Mile', body: 'The last eight weeks are always the true test: joinery arriving from three countries, stone installed while electricians chase their final circuits. Our team sequenced every tradesman by the hour, and handover happened on the date we promised eleven months earlier.' }
        ],
        quote: 'A renovation is a promise made in drawings and kept in calendar.',
        outro: 'The family moved in on a Tuesday. By Friday, the house looked as though it had never been touched — which is, of course, the entire point.'
    },
    'five-rooms': {
        title: 'Five Rooms We Dream About', category: 'Studio Notes', author: 'The Studio',
        date: 'August 05, 2026', readTime: '5 min read',
        image: 'https://i.pinimg.com/736x/4e/f5/14/4ef51472656d283a91ab207b85540084.jpg',
        intro: 'The interiors from cinema and travel that shaped our collective taste — five rooms we would build tomorrow if a client simply said yes.',
        sections: [
            { heading: 'The Glass Study', body: 'From a Danish seaside house: a room of nothing but window, oak and one long table. Rain on three sides, a fire on the fourth. We have sketched it a hundred times.' },
            { heading: 'The Sunken Salon', body: 'From a 1960s Milanese apartment: a seating pit wrapped in cream boucle, a low ceiling of polished plaster, light entering sideways. Conversation becomes architecture in rooms like these.' }
        ],
        quote: 'Every room we love is a room that knows what it is for.',
        outro: 'One day these five rooms will be one house. Until then, they remain our private architecture of longing.'
    },
    'calacatta-veining': {
        title: 'The Veining of Calacatta', category: 'Materials', author: 'Marcus Chen',
        date: 'July 18, 2026', readTime: '5 min read',
        image: 'https://i.pinimg.com/736x/00/07/f7/0007f740a75fddc83d4d89aa38025a83.jpg',
        intro: 'How a single slab\'s geology dictates the composition of an entire room. Calacatta is not decoration — it is a map of ancient currents, and it demands to be read.',
        sections: [
            { heading: 'Reading the Slab', body: 'We bookmatch slabs the way a librarian books manuscripts. The veins must flow uninterrupted across the seam; a careless installer turns a masterpiece into a billboard. Our stone team rehearses the layout in the workshop before a single tile is cut.' },
            { heading: 'The Kitchen as Gallery', body: 'In our last Calacatta kitchen, the island slab was selected first and the entire room — cabinetry, lighting, even the direction of the morning sun — was composed around its veins. The stone is the client; everything else is context.' }
        ],
        quote: 'A great slab is a painting you cook beside.',
        outro: 'When you see Calacatta installed with its veins respected, you understand why it has survived two thousand years of fashion.'
    },
    'layered-light-living': {
        title: 'Layered Light in the Living Room', category: 'Lighting', author: 'Elena Rostova',
        date: 'July 02, 2026', readTime: '4 min read',
        image: 'https://i.pinimg.com/736x/d3/12/a0/d312a07cd64e6018409d811361cdfe34.jpg',
        intro: 'Combining daylight, task and accent light to compose rooms that shift through the day. The living room must be three different rooms by dinner — and only light can do that.',
        sections: [
            { heading: 'The Three Layers', body: 'Daylight sets the mood until noon; low, warm task light takes over the afternoon for reading and work; and by evening, accent pools draw the eye to art, stone and sculpture. Each layer is dimmable and independent, so the room can follow the household\'s mood rather than the other way around.' },
            { heading: 'The Evening Test', body: 'We always photograph our living rooms at 9pm. If a room looks beautiful in daylight but flat after dark, we have failed. The evening test has reshaped more than one of our palettes.' }
        ],
        quote: 'A living room should hold three conversations a day with three different lights.',
        outro: 'Dimmers are not a luxury item. They are the difference between a room and a stage.'
    },
    'budgeting-invisible': {
        title: 'Budgeting the Invisible', category: 'Process', author: 'The Studio',
        date: 'June 15, 2026', readTime: '6 min read',
        image: 'https://i.pinimg.com/736x/2b/cb/a5/2bcba5fad2e3953134d42035da8b6afa.jpg',
        intro: 'Why the most important spend in any renovation is the part you never see. Insulation, damp-proofing, acoustic membrane, rewiring — the unglamorous skeleton that makes luxury possible.',
        sections: [
            { heading: 'The Skeleton Budget', body: 'We allocate a minimum of 15% of every project to invisible systems before a single surface is specified. Clients sometimes resist; none have ever regretted it. A silent ceiling and a warm floor are felt every single day — a marble wall is noticed for a season.' },
            { heading: 'Where We Refuse to Cut', body: 'Windows, roofs and structure are non-negotiable. We would rather halve the budget of a guest bathroom than compromise the thermal envelope. Luxury that leaks heat is not luxury; it is decoration.' }
        ],
        quote: 'You cannot see the budget in the walls — but you will feel it in every room.',
        outro: 'Our most grateful clients are never the ones with the most marble. They are the ones whose homes are simply, invisibly right.'
    },
    'reading-room-country': {
        title: 'Reading Room in the Country', category: 'Studio Notes', author: 'Sarah Jenkins',
        date: 'May 30, 2026', readTime: '4 min read',
        image: 'https://i.pinimg.com/736x/ed/cc/d5/edccd5be23c3caa50ee9bec2d490e64c.jpg',
        intro: 'The quiet project we keep returning to — walls of oak, light from the east, and a room with no other purpose than stillness.',
        sections: [
            { heading: 'The Brief', body: 'The client\'s only instruction: a room where a phone is never answered. We designed it like a chapel — solid oak walls, a single reading chair, a fireplace and a window seat facing the morning. No television. No doorbell. No negotiation.' },
            { heading: 'The Discipline of Restraint', body: 'The hardest part was resisting our own instincts. No art, no bookshelf heroics, no statement rug. The room contains eight objects. It is the most requested room in the house.' }
        ],
        quote: 'Sometimes the most luxurious thing a room can do is nothing at all.',
        outro: 'We have since been asked to design three more of these rooms. The briefs grow shorter every time — and the results better.'
    },
    'european-oak': {
        title: 'A Field Guide to European Oak', category: 'Materials', author: 'Marcus Chen',
        date: 'May 12, 2026', readTime: '5 min read',
        image: 'https://i.pinimg.com/736x/3d/84/29/3d842906a5b548ddf1b2f8f7b7a5fa3a.jpg',
        intro: 'Distinguishing the forests, cuts and finishes behind our favorite timber. Not all oak is oak — the differences between a French, Hungarian and English board are visible in the grain to anyone who looks.',
        sections: [
            { heading: 'Forest to Forest', body: 'English oak grows slowly and tight-grained — dark, heavy, aristocratic. French oak is lighter and straighter, ideal for joinery. Hungarian oak carries the famous flamed figure that appears almost chatoyant in raking light. We specify by character, never by country of convenience.' },
            { heading: 'Finish Philosophy', body: 'We finish oak with hard wax oil, never lacquer. Lacquer seals the wood under a plastic skin; wax lets the grain breathe and age. A waxed oak wall gains warmth and depth every year, exactly the way a good leather chair does.' }
        ],
        quote: 'Oak is not a neutral. It is a personality with a very long memory.',
        outro: 'Ask us about the forest behind your floor — the answer will change how you walk on it.'
    },
    'indirect-glow': {
        title: 'The Warmth of Indirect Glow', category: 'Lighting', author: 'Elena Rostova',
        date: 'April 25, 2026', readTime: '4 min read',
        image: 'https://i.pinimg.com/1200x/da/1b/ac/da1bac4d69d7fea48bb504202795d31f.jpg',
        intro: 'Coves, reveals and reflected pools of light that never show their source. The most sophisticated lighting in any house is the lighting you cannot point at.',
        sections: [
            { heading: 'The Coved Ceiling, Revisited', body: 'A plaster cove throws light upward in a soft wash; the ceiling becomes the lamp. The effect is a room that appears to be lit by weather — diffuse, generous and utterly calm. It is our default for bedrooms for a reason.' },
            { heading: 'The Grazing Reveal', body: 'We bury LED strips in structural reveals — behind panels, under shelf lips, inside skirting channels — so light skims surfaces instead of striking eyes. Stone comes alive when light grazes it at a shallow angle.' }
        ],
        quote: 'The best light source is the one your guests will never find.',
        outro: 'When a guest asks where the light comes from, the installation is a success.'
    },
    'drawing-to-delivery': {
        title: 'From Drawing to Delivery', category: 'Process', author: 'Sarah Jenkins',
        date: 'April 08, 2026', readTime: '6 min read',
        image: 'https://i.pinimg.com/736x/63/ae/cd/63aecdc9ac03dda48a896e1bc5dfc888.jpg',
        intro: 'The full lifecycle of a custom piece, from first sketch to final placement — the dining table that took eleven months and three countries to build.',
        sections: [
            { heading: 'The Sketch', body: 'Every piece begins as a freehand sketch in a workshop notebook — no CAD, no render. The hand decides proportions the computer cannot. Only after the sketch is approved do we move to drawings and scale models.' },
            { heading: 'The Assembly', body: 'Our table\'s legs were forged in Milan, its top milled in northern Germany, its leather inlay stitched in London. Three fabricators, one set of drawings, zero compromises. It arrived wrapped in felt and was carried in by six people at 7am on a Sunday.' }
        ],
        quote: 'A custom piece is not ordered. It is composed.',
        outro: 'The clients now host dinners for twelve around it. Nobody asks where it came from; everyone asks to touch it.'
    },
    'objects-we-return-to': {
        title: 'Objects We Keep Returning To', category: 'Studio Notes', author: 'The Studio',
        date: 'March 20, 2026', readTime: '5 min read',
        image: 'https://i.pinimg.com/736x/0f/1a/b3/0f1ab31f6c27f9ad79106a972e30a9c2.jpg',
        intro: 'The tableware, brass and ceramics that anchor our most-loved interiors — the small objects that make a room feel lived-in, even on the day it is photographed.',
        sections: [
            { heading: 'The Dozen', body: 'Across all our projects, roughly a dozen objects reappear: the hand-thrown bowl, the brass candlestick, the linen runner, the unlabeled glassware. They are not decorations; they are habits. Rooms need habits the way people do.' },
            { heading: 'Where We Find Them', body: 'Two are from a potter in Kyushu who fires once a year. One is from a flea market in Lyon, bought in the rain for six euros. Objects carry stories better when the stories are long.' }
        ],
        quote: 'A room is furnished twice: once by the architect, once by the objects.',
        outro: 'We photograph every project twice — once empty, once with the objects. The second photograph is always the truer portrait.'
    },
    'patina-designing-age': {
        title: 'Patina: Designing for Age', category: 'Materials', author: 'Marcus Chen',
        date: 'March 02, 2026', readTime: '5 min read',
        image: 'https://i.pinimg.com/736x/c6/4a/12/c64a12e57021d76021ae04f54cc16baf.jpg',
        intro: 'Why we choose surfaces that grow more beautiful with every year of use — and why the newest material is often the least luxurious one.',
        sections: [
            { heading: 'The Case for Living Finishes', body: 'Brass that darkens, marble that etches, leather that creases, oak that warms. We call these living finishes, and we specify them wherever a hand will touch. A mark of use is not damage; it is biography.' },
            { heading: 'The Myth of the Perfect Surface', body: 'Clients sometimes ask for surfaces that will never change. We gently refuse. A home that cannot age is a museum without artifacts — beautiful, sterile and slightly sad.' }
        ],
        quote: 'The most luxurious material is the one that remembers being lived with.',
        outro: 'In twenty years, your children will recognize the house by its scars. Design them well.'
    },
    'daylight-studies': {
        title: 'Daylight Studies: South-Facing Rooms', category: 'Lighting', author: 'Elena Rostova',
        date: 'February 14, 2026', readTime: '4 min read',
        image: 'https://i.pinimg.com/1200x/ad/bc/bb/adbcbb6638f00604ede175a1b8fcb712.jpg',
        intro: 'Tracking the arc of the sun to place each room in its best possible light. A south-facing room is a gift — but only if you know what to do with it.',
        sections: [
            { heading: 'The Daily Arc', body: 'South light is constant, generous and low in winter. We place kitchens and reading rooms to the south, bedrooms to the east, and media rooms to the north. The sun does the decorating; we just stay out of its way.' },
            { heading: 'The Overhang Equation', body: 'A correctly sized overhang admits winter sun deep into the room while shading the same glass in July. It is the oldest passive trick in architecture, and it still outperforms every dimmer we own.' }
        ],
        quote: 'The sun is the only designer who works for free — and never misses a deadline.',
        outro: 'Before we specify a single fixture, we ask one question: what will the room look like at 4pm in February?'
    },
    'site-visit-art': {
        title: 'The Art of the Site Visit', category: 'Process', author: 'The Studio',
        date: 'January 28, 2026', readTime: '5 min read',
        image: 'https://i.pinimg.com/736x/5f/ff/7f/5fff7f51be5e8fafd33f95dcfeeb7a75.jpg',
        intro: 'What we look for on the ground before a single line is drawn. The best site information never appears on any survey — it has to be felt.',
        sections: [
            { heading: 'The Three-Hour Walk', body: 'We walk every site three times: once at 9am, once at noon, once at dusk. We listen to the street noise, watch the neighbors\' windows, feel the drafts. By the third walk, the house has usually told us what it wants to be.' },
            { heading: 'What We Never Trust', body: 'Renderings, photographs and other architects\' floor plans. The only truth is on site, at the exact hour the room will be lived in.' }
        ],
        quote: 'A site visit is not inspection. It is listening.',
        outro: 'Half our best ideas are born standing in empty rooms, looking at light that no drawing can capture.'
    },
    'studio-morning-elena': {
        title: 'A Studio Morning with Elena', category: 'Studio Notes', author: 'Elena Rostova',
        date: 'January 10, 2026', readTime: '3 min read',
        image: 'https://i.pinimg.com/736x/1a/0c/9a/1a0c9a283ef3da46beab7b9aa5ac1413.jpg',
        intro: 'Coffee, swatches and the first sketch of a penthouse in the making — a day in the life of the studio, 7am to 11am.',
        sections: [
            { heading: '7:00 — The Board', body: 'Every morning the material board is rebuilt: yesterday\'s stones and fabrics off, today\'s candidates on. The board is our collective memory; when a client asks why a project feels cohesive, the answer is this ritual.' },
            { heading: '9:30 — The First Sketch', body: 'The penthouse brief had one line: a room that holds forty people and one conversation. By 9:45 the sketch was done — a long, low, dark room with a single band of south light. It took eight seconds to draw and twelve years to learn.' }
        ],
        quote: 'Every great project starts as a small, quiet drawing.',
        outro: 'By 11am the coffee was cold and the sketch was on the wall. Some mornings, that is the whole job — and it is enough.'
    }
};

async function renderBlogDetails() {
    const slug = getQueryParam('post') || 'psychology-of-volume';
    const post = BLOG_POSTS[slug] || BLOG_POSTS['psychology-of-volume'];
    return buildBlogPostHTML(post);
}

function buildBlogPostHTML(post) {
    const postOrder = Object.keys(BLOG_POSTS);
    const idx = postOrder.indexOf(Object.keys(BLOG_POSTS).find(k => BLOG_POSTS[k] === post));
    const issue = String(idx + 1).padStart(2, '0');
    const prev = idx > 0 ? BLOG_POSTS[postOrder[idx - 1]] : null;
    const next = idx < postOrder.length - 1 ? BLOG_POSTS[postOrder[idx + 1]] : null;
    const prevSlug = prev ? Object.keys(BLOG_POSTS).find(k => BLOG_POSTS[k] === prev) : null;
    const nextSlug = next ? Object.keys(BLOG_POSTS).find(k => BLOG_POSTS[k] === next) : null;

    const sections = post.sections.map((s, i) => `
        <div class="bd-section">
            <p class="bd-section-num">${String(i + 1).padStart(2, '0')}</p>
            <h2 class="bd-section-title">${s.heading}</h2>
            <p class="bd-section-body">${s.body}</p>
        </div>
    `).join('');

    const prevCard = prev && prevSlug ? `
        <a href="/blog-details?post=${prevSlug}" data-route class="bd-pn bd-prev">
            <span class="bd-pn-img"><img src="${prev.image}" alt="${prev.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';"></span>
            <span class="bd-pn-body">
                <span class="bd-pn-label">&larr; Previous Essay</span>
                <span class="bd-pn-title">${prev.title}</span>
            </span>
        </a>` : '<span></span>';

    const nextCard = next && nextSlug ? `
        <a href="/blog-details?post=${nextSlug}" data-route class="bd-pn bd-next">
            <span class="bd-pn-img"><img src="${next.image}" alt="${next.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';"></span>
            <span class="bd-pn-body">
                <span class="bd-pn-label">Next Essay &rarr;</span>
                <span class="bd-pn-title">${next.title}</span>
            </span>
        </a>` : '<span></span>';

    return `
        <section class="bd-hero">
            <div class="container">
                <span class="bd-ghost" aria-hidden="true">Essay</span>
                <div class="bd-topline reveal-up">
                    <p class="bd-cat">${post.category}</p>
                    <p class="bd-issue">The Journal &mdash; Issue 04 &middot; ${issue}</p>
                </div>
                <h1 class="bd-title reveal-up">${post.title}</h1>
                <div class="bd-meta reveal-up">
                    <span><b>By</b> ${post.author}</span>
                    <span>${post.date}</span>
                    <span>${post.readTime}</span>
                </div>
                <p class="bd-standfirst reveal-up">${post.intro}</p>
            </div>
        </section>
        <section class="bd-article">
            <div class="container bd-article-inner">
                <figure class="bd-media reveal-up">
                    <img src="${post.image}" alt="${post.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                    <figcaption><span>Plate ${issue}</span> ${post.category}</figcaption>
                </figure>
                <div class="bd-body reveal-up">
                    ${sections}
                    <blockquote class="bd-quote">
                        <span class="bd-quote-mark" aria-hidden="true">&ldquo;</span>
                        <p>${post.quote}</p>
                    </blockquote>
                    <p class="bd-outro">${post.outro}</p>
                </div>
            </div>
        </section>
        <section class="bd-footer">
            <div class="container">
                <a href="/blog" data-route class="bd-back"><span aria-hidden="true">&larr;</span> Back to The Journal</a>
                <div class="bd-prevnext">
                    ${prevCard}
                    ${nextCard}
                </div>
            </div>
        </section>
        <style>
            /* ---- Blog Details — Premium Editorial ---- */
            .bd-hero {
                position: relative;
                overflow: hidden;
                padding: 190px 0 5rem;
                background-color: var(--bg-primary);
            }
            .bd-ghost {
                position: absolute;
                top: 4rem;
                right: -2rem;
                font-family: var(--font-heading);
                font-style: italic;
                font-size: clamp(5rem, 14vw, 11rem);
                color: rgba(23, 23, 23, 0.04);
                line-height: 1;
                white-space: nowrap;
                user-select: none;
                pointer-events: none;
                z-index: 0;
            }
            .theme-dark .bd-ghost { color: rgba(247, 243, 237, 0.05); }
            .bd-topline {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 2rem;
                margin-bottom: 2.5rem;
                position: relative;
                z-index: 1;
            }
            .bd-cat {
                font-size: 0.7rem;
                letter-spacing: 0.35em;
                text-transform: uppercase;
                color: var(--color-antique-gold);
                margin: 0;
            }
            .bd-issue {
                font-size: 0.7rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-muted);
                margin: 0;
            }
            .bd-title {
                max-width: 960px;
                font-family: var(--font-heading);
                font-size: clamp(2.75rem, 6vw, 5rem);
                font-weight: 300;
                letter-spacing: -0.02em;
                line-height: 1.05;
                margin: 0 0 2.5rem;
                position: relative;
                z-index: 1;
            }
            .bd-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 1.5rem;
                border-top: 1px solid var(--border-color);
                border-bottom: 1px solid var(--border-color);
                padding: 1.25rem 0;
                margin-bottom: 2.5rem;
                position: relative;
                z-index: 1;
            }
            .bd-meta span {
                font-size: 0.7rem;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: var(--text-muted);
            }
            .bd-meta b { color: var(--color-antique-gold); font-weight: 500; }
            .bd-standfirst {
                max-width: 760px;
                font-family: var(--font-heading);
                font-size: clamp(1.4rem, 2.5vw, 1.8rem);
                font-weight: 300;
                font-style: italic;
                line-height: 1.5;
                color: var(--text-secondary);
                margin: 0;
                position: relative;
                z-index: 1;
            }

            .bd-article {
                padding: 0 0 8rem;
                background-color: var(--bg-primary);
            }
            .bd-article-inner {
                max-width: 920px;
            }
            .bd-media {
                margin: 0 0 5rem;
                position: relative;
            }
            .bd-media::after {
                content: '';
                position: absolute;
                inset: 0;
                transform: translate(1rem, 1rem);
                border: 1px solid var(--color-antique-gold);
                z-index: 0;
            }
            .bd-media img {
                position: relative;
                z-index: 1;
                width: 100%;
                aspect-ratio: 21/10;
                object-fit: cover;
                background: var(--color-obsidian-light);
            }
            .bd-media figcaption {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                margin-top: 1.25rem;
                font-size: 0.7rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-muted);
                position: relative;
                z-index: 1;
            }
            .bd-media figcaption span { color: var(--color-antique-gold); }

            .bd-body {
                max-width: 760px;
                margin: 0 auto;
                font-size: 1.1rem;
                line-height: 1.85;
                color: var(--text-secondary);
            }
            .bd-section {
                margin-bottom: 3.5rem;
                border-top: 1px solid var(--border-color);
                padding-top: 2.5rem;
            }
            .bd-section-num {
                font-family: var(--font-heading);
                font-style: italic;
                font-size: 0.9rem;
                letter-spacing: 0.2em;
                color: var(--color-antique-gold);
                margin: 0 0 1.25rem;
            }
            .bd-section-title {
                font-family: var(--font-heading);
                font-size: clamp(1.6rem, 3vw, 2.2rem);
                font-weight: 300;
                letter-spacing: -0.01em;
                color: var(--text-primary);
                margin: 0 0 1.5rem;
            }
            .bd-section-body { margin: 0; }

            .bd-quote {
                margin: 4rem 0;
                padding: 3rem 2rem;
                text-align: center;
                background: var(--bg-secondary);
                border-top: 1px solid var(--color-antique-gold);
                border-bottom: 1px solid var(--color-antique-gold);
            }
            .bd-quote-mark {
                display: block;
                font-family: var(--font-heading);
                font-size: 4rem;
                line-height: 0.6;
                color: var(--color-antique-gold);
                margin-bottom: 1.5rem;
            }
            .bd-quote p {
                font-family: var(--font-heading);
                font-size: clamp(1.5rem, 3vw, 2.25rem);
                font-weight: 300;
                font-style: italic;
                line-height: 1.35;
                color: var(--text-primary);
                margin: 0;
            }
            .bd-outro {
                color: var(--text-muted);
                font-size: 1.05rem;
                border-inline-start: 1px solid var(--color-antique-gold);
                padding-inline-start: 1.5rem;
            }

            .bd-footer {
                padding: 6rem 0 8rem;
                background-color: var(--bg-secondary);
            }
            .bd-back {
                display: inline-flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 0.75rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--text-primary);
                border-bottom: 1px solid var(--text-primary);
                padding-bottom: 0.5rem;
                margin-bottom: 4rem;
                transition: gap 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
            .bd-back:hover { gap: 1.25rem; color: var(--color-antique-gold); border-color: var(--color-antique-gold); }
            .bd-prevnext {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
            }
            .bd-pn {
                display: grid;
                grid-template-columns: 140px 1fr;
                gap: 1.5rem;
                align-items: center;
                padding: 1.5rem;
                border: 1px solid var(--border-color);
                background: var(--bg-primary);
                color: var(--text-primary);
                transition: border-color 0.4s ease, transform 0.4s ease;
            }
            .bd-pn:hover { border-color: var(--color-antique-gold); transform: translateY(-4px); }
            .bd-pn.next { text-align: end; grid-template-columns: 1fr 140px; }
            .bd-pn.next .bd-pn-body { order: 1; }
            .bd-pn.next .bd-pn-img { order: 2; }
            .bd-pn-img { overflow: hidden; display: block; }
            .bd-pn-img img {
                display: block;
                width: 100%;
                aspect-ratio: 16/11;
                object-fit: cover;
                transition: transform 0.6s ease;
            }
            .bd-pn:hover .bd-pn-img img { transform: scale(1.05); }
            .bd-pn-body { display: flex; flex-direction: column; gap: 0.5rem; }
            .bd-pn-label {
                font-size: 0.65rem;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                color: var(--color-antique-gold);
            }
            .bd-pn-title {
                font-family: var(--font-heading);
                font-size: clamp(1.2rem, 2vw, 1.6rem);
                font-weight: 300;
                line-height: 1.2;
            }

            @media (max-width: 992px) {
                .bd-hero { padding-top: 140px; }
                .bd-prevnext { grid-template-columns: 1fr; }
            }
            @media (max-width: 640px) {
                .bd-topline { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
                .bd-media::after { transform: translate(0.5rem, 0.5rem); }
                .bd-media img { aspect-ratio: 16/9; }
                .bd-pn, .bd-pn.next { grid-template-columns: 1fr; text-align: start; }
                .bd-pn.next .bd-pn-body { order: 2; }
                .bd-pn.next .bd-pn-img { order: 1; }
                .bd-pn-img img { aspect-ratio: 16/9; }
            }
        </style>`;
}

// --- Admin Dashboard Logic ---
function initAdminDashboard() {
    // Tab navigation
    const tabs = document.querySelectorAll('.admin-tab');
    const sections = document.querySelectorAll('.admin-section');

    function switchTab(targetId) {
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.style.display = 'none');
        const matchTab = document.querySelector(`.admin-tab[data-target="${targetId}"]`);
        if (matchTab) matchTab.classList.add('active');
        const sec = document.getElementById(targetId);
        if (sec) {
            sec.style.display = 'block';
            sec.querySelectorAll('.reveal-up').forEach(el => {
                el.classList.remove('revealed');
                setTimeout(() => el.classList.add('revealed'), 50);
            });
        }
        if (window.lucide) window.lucide.createIcons();
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', e => {
            e.preventDefault();
            switchTab(tab.getAttribute('data-target'));
        });
    });

    // Quick action buttons
    document.querySelectorAll('.admin-tab-trigger').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-target')));
    });

    // Logout
    const logoutBtn = document.getElementById('adm-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', e => {
            e.preventDefault();
            try { localStorage.removeItem('interihub_user'); } catch (err) {}
            window.location.hash = '/login';
        });
    }

    // Client search & filter
    const clientSearch = document.getElementById('client-search');
    if (clientSearch) {
        clientSearch.addEventListener('input', () => {
            const q = clientSearch.value.toLowerCase();
            document.querySelectorAll('#clients-table tbody tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    }
    document.querySelectorAll('[data-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const f = chip.getAttribute('data-filter');
            document.querySelectorAll('#clients-table tbody tr').forEach(row => {
                row.style.display = (f === 'all' || row.getAttribute('data-status') === f) ? '' : 'none';
            });
        });
    });

    // Photo filter
    document.querySelectorAll('[data-photo-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-photo-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const f = chip.getAttribute('data-photo-filter');
            document.querySelectorAll('.adm-photo-submission').forEach(sub => {
                sub.style.display = (f === 'all' || sub.getAttribute('data-photo-status') === f) ? '' : 'none';
            });
        });
    });

    // Photo approve/retry
    document.querySelectorAll('.adm-photo-approve').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.adm-photo-submission');
            const header = card.querySelector('.adm-chip');
            if (header) { header.textContent = 'Approved'; header.className = 'adm-chip adm-chip-olive adm-chip-sm'; }
            card.setAttribute('data-photo-status', 'approved');
            btn.textContent = '✓ Forwarded to Designer';
            btn.disabled = true;
            btn.style.opacity = '0.6';
            card.querySelector('.adm-photo-retry').style.display = 'none';
        });
    });
    document.querySelectorAll('.adm-photo-retry').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.adm-photo-submission');
            const header = card.querySelector('.adm-chip');
            if (header) { header.textContent = 'Retry Requested'; header.className = 'adm-chip adm-chip-clay adm-chip-sm'; }
            card.setAttribute('data-photo-status', 'retry');
            btn.textContent = '↩ Retry Requested';
            btn.disabled = true;
            btn.style.opacity = '0.6';
            card.querySelector('.adm-photo-approve').style.display = 'none';
        });
    });

    // Mood board dropzone
    const moodDrop = document.getElementById('adm-mood-dropzone');
    const moodFile = document.getElementById('adm-mood-file');
    if (moodDrop && moodFile) {
        moodDrop.addEventListener('click', () => moodFile.click());
        moodFile.addEventListener('change', e => {
            if (e.target.files.length > 0) {
                moodDrop.querySelector('h3').textContent = e.target.files[0].name;
            }
        });
    }

    // Mood board form submit
    const moodSubmit = document.getElementById('adm-mood-submit');
    if (moodSubmit) {
        moodSubmit.closest('form').addEventListener('submit', e => {
            e.preventDefault();
            const suc = document.getElementById('adm-mood-success');
            if (suc) {
                suc.style.display = 'flex';
                setTimeout(() => { suc.style.display = 'none'; }, 4000);
            }
        });
    }

    // Mood board recall / publish
    document.querySelectorAll('.adm-mb-recall').forEach(btn => {
        btn.addEventListener('click', () => {
            const mbTop = btn.closest('.adm-mb-actions').previousElementSibling
                ? btn.closest('.adm-mb-info').querySelector('.adm-mb-top')
                : null;
            const statusChip = btn.closest('.adm-mb-info') ? btn.closest('.adm-mb-info').querySelector('.adm-chip') : null;
            if (statusChip) { statusChip.textContent = 'Recalled'; statusChip.className = 'adm-chip adm-chip-clay adm-chip-sm'; }
            btn.textContent = 'Recalled';
            btn.disabled = true;
            btn.style.opacity = '0.5';
            admToast('Mood board recalled from client portal.');
        });
    });
    document.querySelectorAll('.adm-mb-publish').forEach(btn => {
        btn.addEventListener('click', () => {
            const info = btn.closest('.adm-mb-info');
            const statusChip = info ? info.querySelector('.adm-chip') : null;
            if (statusChip) { statusChip.textContent = 'Pending Approval'; statusChip.className = 'adm-chip adm-chip-dark adm-chip-sm'; }
            btn.textContent = '✓ Published';
            btn.disabled = true;
            btn.style.opacity = '0.5';
            admToast('Mood board published to client portal.');
        });
    });

    // Onboard client form — use specific ID not generic selector
    const onboardForm = document.getElementById('onboard-submit-btn')
        ? document.getElementById('onboard-submit-btn').closest('form')
        : null;
    if (onboardForm) {
        onboardForm.addEventListener('submit', e => {
            e.preventDefault();
            const nameVal = onboardForm.querySelector('input[type="text"]').value.trim();
            const emailVal = onboardForm.querySelector('input[type="email"]').value.trim();
            const designerVal = onboardForm.querySelectorAll('.adm-select')[1].value;
            const typeVal = onboardForm.querySelector('.adm-select').value;
            if (!nameVal || !emailVal) return;
            // Add row to table
            const initials = nameVal.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
            const refNum = 'IH-2026-0' + (17 + Math.floor(Math.random() * 10));
            const tbody = document.querySelector('#clients-table tbody');
            if (tbody) {
                const tr = document.createElement('tr');
                tr.setAttribute('data-status', 'pending');
                tr.innerHTML = `
                    <td>
                        <div class="adm-client-cell">
                            <div class="adm-client-mini-avatar">${initials}</div>
                            <div>
                                <p class="adm-client-name">${nameVal}</p>
                                <p class="adm-client-email">${emailVal}</p>
                            </div>
                        </div>
                    </td>
                    <td><span class="adm-project-id">#${refNum}</span><br><small>${typeVal.split(' ')[0]}</small></td>
                    <td>${designerVal.split(' ')[0]}</td>
                    <td><span class="adm-chip adm-chip-dark adm-chip-sm">Discovery</span></td>
                    <td>
                        <div class="adm-mini-bar-wrap"><div class="adm-mini-bar" style="width:0%;"></div></div>
                        <small>0%</small>
                    </td>
                    <td><span class="adm-chip adm-chip-olive adm-chip-sm">Onboarding</span></td>
                    <td>
                        <div class="adm-table-actions">
                            <button class="adm-tbl-btn" title="View Profile"><i data-lucide="eye" style="width:13px;height:13px;"></i></button>
                            <button class="adm-tbl-btn" title="Message"><i data-lucide="message-circle" style="width:13px;height:13px;"></i></button>
                        </div>
                    </td>`;
                tbody.appendChild(tr);
                if (window.lucide) window.lucide.createIcons();
                // Wire new table action buttons
                bindTableActionBtns(tr);
            }
            // Update KPI
            const clientKpi = document.querySelector('.adm-kpi:nth-child(2) .adm-kpi-value');
            if (clientKpi) clientKpi.textContent = parseInt(clientKpi.textContent) + 1;
            const suc = document.getElementById('onboard-success');
            if (suc) {
                suc.style.display = 'flex';
                setTimeout(() => { suc.style.display = 'none'; onboardForm.reset(); }, 4000);
            }
            // Add to activity feed
            admAddActivity(`${nameVal} onboarded — ${typeVal}`, 'Just now', 'gold', 'New');
        });
    }

    // Approval items
    let resolvedCount = 0;
    const totalApprovals = document.querySelectorAll('.adm-approval-item').length;
    document.querySelectorAll('.adm-approve-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = document.getElementById(btn.getAttribute('data-id'));
            if (!item) return;
            item.classList.add('resolved');
            resolvedCount++;
            if (resolvedCount >= totalApprovals) {
                const empty = document.getElementById('approvals-empty');
                if (empty) empty.style.display = 'block';
            }
            if (window.lucide) window.lucide.createIcons();
        });
    });
    document.querySelectorAll('.adm-escalate-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = document.getElementById(btn.getAttribute('data-id'));
            if (!item) return;
            const type = item.querySelector('.adm-approval-type');
            if (type) type.textContent = 'ESCALATED — Awaiting Director Review';
            const icon = item.querySelector('.adm-approval-icon');
            if (icon) { icon.className = 'adm-approval-icon adm-approval-icon-clay'; }
            btn.textContent = '⚠ Escalated';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    });

    // Admin messaging
    const msgSend = document.getElementById('adm-msg-send');
    const msgInput = document.getElementById('adm-msg-input');
    const msgList = document.getElementById('adm-msg-list');
    if (msgSend && msgInput && msgList) {
        const doSend = () => {
            const txt = msgInput.value.trim();
            if (!txt) return;
            const replyAs = document.querySelector('.adm-reply-as');
            const signer = replyAs ? replyAs.value.replace('Reply as: ', '') : 'Studio Admin';
            msgInput.value = '';
            msgList.innerHTML += `
                <div class="adm-msg adm-msg-out">
                    <div class="adm-msg-bub adm-msg-bub-out">
                        <p>${txt.replace(/</g, '&lt;')}</p>
                        <span>Just now · ${signer}</span>
                    </div>
                </div>`;
            msgList.scrollTop = msgList.scrollHeight;
        };
        msgSend.addEventListener('click', doSend);
        msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });
    }

    // Thread switching with dynamic chat content per client
    const threadChats = {
        'thread-amara': {
            name: 'Amara Chen', avatar: 'AC', project: '#IH-2026-014', designer: 'Elena Rostova',
            msgs: [
                { from: 'in', ava: 'AC', text: 'Good morning! I love the obsidian direction for the mood board.', time: 'Today, 9:45 AM' },
                { from: 'in', ava: 'AC', text: 'Could you share the fabric swatches digitally? I want to show them to my partner.', time: 'Today, 10:30 AM' },
                { from: 'out', text: 'Of course! Elena will prepare a digital swatch pack and share it by end of day.', time: 'Today, 10:40 AM · Elena R.' }
            ]
        },
        'thread-marcus': {
            name: 'Marcus Webb', avatar: 'MW', project: '#IH-2026-009', designer: 'Marco Levi',
            msgs: [
                { from: 'in', ava: 'MW', text: 'The 3D renders look great but the bedroom viewing angle doesn\'t match our brief.', time: 'Today, 9:10 AM' },
                { from: 'in', ava: 'MW', text: 'Can we set up a call this week to go over the revisions together?', time: 'Today, 9:15 AM' }
            ]
        },
        'thread-lena': {
            name: 'Lena Park', avatar: 'LP', project: '#IH-2026-016', designer: 'Jia Kim',
            msgs: [
                { from: 'in', ava: 'LP', text: 'When is our next check-in scheduled? I have some material preferences to share.', time: 'Yesterday, 2:30 PM' }
            ]
        },
        'thread-sofia': {
            name: 'Sofia Reyes', avatar: 'SR', project: '#IH-2026-011', designer: 'Elena Rostova',
            msgs: [
                { from: 'out', text: 'The procurement phase has started. Delivery window is January 2027.', time: 'Aug 22 · Elena R.' },
                { from: 'in', ava: 'SR', text: 'Everything looks perfect, thank you! We\'re so excited to see the final result.', time: 'Aug 22, 4:10 PM' }
            ]
        }
    };

    function renderThreadChat(threadKey) {
        const data = threadChats[threadKey];
        if (!data) return;
        // Update header
        const winAva = document.querySelector('.adm-chat-win-avatar');
        const winName = document.querySelector('.adm-chat-win-name');
        const winSub = document.querySelector('.adm-chat-win-sub');
        if (winAva) winAva.textContent = data.avatar;
        if (winName) winName.textContent = data.name;
        if (winSub) winSub.textContent = `Project ${data.project} · Designer: ${data.designer}`;
        // Render messages
        const msgList = document.getElementById('adm-msg-list');
        if (!msgList) return;
        msgList.innerHTML = data.msgs.map(m => {
            if (m.from === 'in') return `
                <div class="adm-msg adm-msg-in">
                    <div class="adm-msg-ava">${m.ava}</div>
                    <div class="adm-msg-bub adm-msg-bub-in">
                        <p>${m.text}</p><span>${m.time}</span>
                    </div>
                </div>`;
            return `
                <div class="adm-msg adm-msg-out">
                    <div class="adm-msg-bub adm-msg-bub-out">
                        <p>${m.text}</p><span>${m.time}</span>
                    </div>
                </div>`;
        }).join('') + '<div id="adm-typing" style="display:none;" class="adm-typing"><span class="adm-typing-dots"><span></span><span></span><span></span></span>Client is typing...</div>';
        msgList.scrollTop = msgList.scrollHeight;
    }

    document.querySelectorAll('.adm-thread-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.adm-thread-item').forEach(t => t.classList.remove('active'));
            item.classList.add('active');
            const unread = item.querySelector('.adm-thread-unread');
            if (unread) unread.remove();
            renderThreadChat(item.getAttribute('data-thread'));
        });
    });

    // Project stage advance
    document.querySelectorAll('.adm-advance-stage').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.adm-project-card');
            if (!card) return;
            const dots = card.querySelectorAll('.adm-pt-dot');
            const lines = card.querySelectorAll('.adm-pt-line');
            const stages = card.querySelectorAll('.adm-pt-stage');
            let pulsing = card.querySelector('.adm-pt-dot-pulse');
            if (!pulsing) return;
            // Clear pulse from current
            pulsing.classList.remove('adm-pt-dot-pulse', 'adm-pt-dot-clay');
            pulsing.classList.add('adm-pt-dot-gold');
            // Find current stage index
            let curIdx = Array.from(dots).indexOf(pulsing);
            stages[curIdx].classList.remove('adm-pt-active');
            stages[curIdx].classList.add('adm-pt-done');
            if (curIdx + 1 < dots.length) {
                // Advance the line
                if (lines[curIdx]) lines[curIdx].classList.add('adm-pt-line-done');
                dots[curIdx + 1].classList.add('adm-pt-dot-pulse');
                stages[curIdx + 1].classList.add('adm-pt-active');
                stages[curIdx + 1].classList.remove('adm-pt-done');
            } else {
                btn.textContent = 'All Stages Done';
                btn.disabled = true;
                btn.style.opacity = '0.5';
            }
        });
    });

    // Notification bell panel
    const notifBtn = document.getElementById('adm-notif-btn');
    if (notifBtn) {
        const notifications = [
            { text: 'Amara Chen submitted 3 photos', time: '10:30 AM', dot: 'gold' },
            { text: 'Marcus Webb requested a revision', time: '9:15 AM', dot: 'clay' },
            { text: 'New booking — Lena Park', time: 'Yesterday', dot: '' },
            { text: 'Mood board V2 approved by Sofia', time: 'Yesterday', dot: 'gold' },
            { text: 'Designer reply pending — #IH-016', time: 'Aug 21', dot: 'clay' },
            { text: 'Studio capacity at 67%', time: 'Aug 21', dot: '' }
        ];
        let panel = null;
        notifBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (panel) { panel.remove(); panel = null; return; }
            panel = document.createElement('div');
            panel.className = 'adm-notif-panel';
            panel.innerHTML = `
                <div class="adm-notif-panel-head">
                    <p class="adm-label" style="margin:0;">Notifications</p>
                    <span class="adm-notif-clear" id="adm-notif-clear">Clear all</span>
                </div>
                ${notifications.map(n => `
                    <div class="adm-notif-row">
                        <span class="adm-act-dot ${n.dot ? 'adm-act-dot-' + n.dot : ''}"></span>
                        <div class="adm-act-body">
                            <p class="adm-act-title">${n.text}</p>
                            <p class="adm-act-meta">${n.time}</p>
                        </div>
                    </div>`).join('')}
            `;
            notifBtn.style.position = 'relative';
            notifBtn.appendChild(panel);
            document.getElementById('adm-notif-clear').addEventListener('click', () => {
                const count = notifBtn.querySelector('.adm-notif-count');
                if (count) count.remove();
                panel.remove(); panel = null;
            });
        });
        document.addEventListener('click', () => { if (panel) { panel.remove(); panel = null; } });
    }

    // Table action buttons (eye = view profile modal, message = go to messages tab)
    function bindTableActionBtns(scope) {
        (scope || document).querySelectorAll('.adm-tbl-btn[title="View Profile"]').forEach(btn => {
            if (btn._bound) return; btn._bound = true;
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                const name = row ? row.querySelector('.adm-client-name').textContent : 'Client';
                const ref = row ? row.querySelector('.adm-project-id').textContent : '';
                admToast(`Viewing profile: ${name} ${ref}`);
            });
        });
        (scope || document).querySelectorAll('.adm-tbl-btn[title="Message"]').forEach(btn => {
            if (btn._bound) return; btn._bound = true;
            btn.addEventListener('click', () => {
                switchTab('adm-messages');
            });
        });
        (scope || document).querySelectorAll('.adm-tbl-btn[title="Archive"]').forEach(btn => {
            if (btn._bound) return; btn._bound = true;
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                if (row) { row.style.opacity = '0'; setTimeout(() => row.remove(), 400); }
                admToast('Client archived successfully.');
            });
        });
    }
    bindTableActionBtns();

    // Toast helper
    function admToast(msg) {
        const t = document.createElement('div');
        t.className = 'adm-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add('adm-toast-show'), 10);
        setTimeout(() => { t.classList.remove('adm-toast-show'); setTimeout(() => t.remove(), 400); }, 3200);
    }

    // Activity feed helper
    function admAddActivity(title, time, dot, tag) {
        const list = document.querySelector('.adm-activity-list');
        if (!list) return;
        const tagClass = { gold: 'adm-act-tag-new', clay: 'adm-act-tag-warn', ok: 'adm-act-tag-ok' }[dot] || 'adm-act-tag-new';
        const dotClass = dot === 'gold' ? 'adm-act-dot-gold' : dot === 'clay' ? 'adm-act-dot-clay' : '';
        const item = document.createElement('div');
        item.className = 'adm-act-item adm-act-item-new';
        item.innerHTML = `
            <span class="adm-act-dot ${dotClass}"></span>
            <div class="adm-act-body">
                <p class="adm-act-title">${title}</p>
                <p class="adm-act-meta">${time}</p>
            </div>
            <span class="adm-act-tag ${tagClass}">${tag}</span>`;
        list.insertBefore(item, list.firstChild);
    }

    // Reveal initial section
    const firstSection = document.getElementById('adm-overview');
    if (firstSection) {
        firstSection.querySelectorAll('.reveal-up').forEach(el => {
            setTimeout(() => el.classList.add('revealed'), 100);
        });
    }

    if (window.lucide) window.lucide.createIcons();
}

// --- Dashboard Logic ---
function initDashboard() {
    const tabs = document.querySelectorAll('.dashboard-tab');
    const sections = document.querySelectorAll('.dashboard-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active class
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.style.display = 'none');
            
            // Add active class
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if(targetSection) {
                targetSection.style.display = 'block';
                // Trigger reveal animations if needed
                const reveals = targetSection.querySelectorAll('.reveal-up');
                reveals.forEach(el => {
                    el.classList.remove('revealed');
                    setTimeout(() => el.classList.add('revealed'), 50);
                });
            }
        });
    });

    // Logout: clear stored session and return to the login page
    const logoutBtn = document.getElementById('dash-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            try { localStorage.removeItem('interihub_user'); } catch (err) { /* storage unavailable */ }
            window.location.hash = '/login';
        });
    }

    // File Upload Simulation
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('room-photos');
    if(uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                const fileNames = Array.from(e.target.files).map(f => f.name).join(', ');
                document.getElementById('upload-status').innerHTML = `<p style="color: var(--color-antique-gold);">Successfully queued: ${fileNames}</p>`;
            }
        });
    }

    // Mood Board Approvals
    document.querySelectorAll('.mood-approve').forEach(btn => {
        btn.addEventListener('click', () => setMoodStatus(btn, 'approved'));
    });
    document.querySelectorAll('.mood-revise').forEach(btn => {
        btn.addEventListener('click', () => setMoodStatus(btn, 'revised'));
    });

    // Timeline Stage Approvals
    document.querySelectorAll('.stage-approve').forEach(btn => {
        btn.addEventListener('click', () => {
            const stage = btn.closest('.stage');
            const status = stage ? stage.querySelector('.stage-status') : null;
            if(status) {
                status.textContent = 'Approved';
                status.style.backgroundColor = 'var(--color-antique-gold)';
                status.style.color = '#fff';
            }
            if(stage) stage.setAttribute('data-approved', 'true');
            btn.remove();
            const revise = btn.closest('div').querySelector('.stage-revise');
            if(revise) revise.remove();
            updateProgress();
        });
    });
    document.querySelectorAll('.stage-revise').forEach(btn => {
        btn.addEventListener('click', () => {
            const stage = btn.closest('.stage');
            const status = stage ? stage.querySelector('.stage-status') : null;
            if(status) {
                status.textContent = 'Changes Requested';
                status.style.backgroundColor = 'var(--color-clay)';
                status.style.color = '#fff';
            }
            if(stage) stage.setAttribute('data-approved', 'false');
            btn.remove();
            const approve = btn.closest('div').querySelector('.stage-approve');
            if(approve) approve.remove();
            document.getElementById('msg-list').innerHTML += `
                <div class="ds-msg ds-msg-out">
                    <div class="ds-msg-bubble ds-msg-bubble-out">
                        <p>We'd like some changes to the Concept stage — details to follow.</p>
                        <span>Just now</span>
                    </div>
                </div>`;
        });
    });

    // Personalize the greeting with the signed-up client's name
    applyUserGreeting();
}

function updateProgress() {
    const bar = document.getElementById('progress-bar');
    if(!bar) return;
    const total = document.querySelectorAll('.stage').length;
    if(!total) return;
    const approved = document.querySelectorAll('.stage[data-approved="true"]').length;
    const pct = Math.min(Math.round((approved / total) * 100), 100);
    bar.style.width = pct + '%';
    const pctEl = document.getElementById('progress-pct');
    if(pctEl) pctEl.textContent = pct + '%';
    const caption = document.getElementById('progress-caption');
    if(caption) caption.textContent = pct + '% complete — ' + caption.getAttribute('data-desc');
}

function applyUserGreeting() {
    const nameEl = document.getElementById('dash-user-name');
    const avatarEl = document.getElementById('dash-user-avatar');
    if (!nameEl && !avatarEl) return;
    let name = '';
    try {
        const raw = localStorage.getItem('interihub_user');
        if (raw) name = (JSON.parse(raw).name || '').trim();
    } catch (e) { /* storage unavailable */ }
    if (!name) return;
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) {
        const parts = name.split(/\s+/).filter(Boolean);
        const initials = parts.map(p => p.charAt(0).toUpperCase()).join('').slice(0, 2);
        avatarEl.textContent = initials || 'AC';
    }
}

function setMoodStatus(btn, state) {
    const card = btn.closest('div').parentElement;
    const status = card.querySelector('.mood-status');
    const feedback = card.querySelector('.mood-feedback');
    const approveBtn = card.querySelector('.mood-approve');
    const reviseBtn = card.querySelector('.mood-revise');
    if(!status) return;

    if(state === 'approved') {
        status.textContent = 'Approved';
        status.style.backgroundColor = 'var(--color-olive-gray)';
        feedback.style.display = 'block';
        feedback.innerHTML = `<span style="color: var(--color-olive-gray);">Concept approved. Our design team has been notified and will begin the 3D phase shortly.</span>`;
    } else {
        status.textContent = 'Revision Requested';
        status.style.backgroundColor = 'var(--color-clay)';
        feedback.style.display = 'block';
        feedback.innerHTML = `<span style="color: var(--color-clay);">Revision requested. Elena will follow up with an updated direction within 3 business days.</span>`;
    }
    if(approveBtn) approveBtn.remove();
    if(reviseBtn) reviseBtn.remove();
    updateProgress();
}

// --- Messages (Dashboard) ---
const DESIGNER_REPLIES = [
    "Thanks for the note! I'll have a look and get back to you shortly.",
    "Great question — I'll fold that into the next revision of the mood board.",
    "Noted. I'll share updated material samples at our next check-in.",
    "Perfect, that helps a lot. Anything else on the lighting plan?",
    "I've added that to the project brief. Will confirm by end of day."
];

function sendMessage() {
    const input = document.getElementById('msg-input');
    const list = document.getElementById('msg-list');
    if(!input || !list) return;
    const text = input.value.trim();
    if(!text) return;
    input.value = '';

    list.innerHTML += `
        <div class="ds-msg ds-msg-out">
            <div class="ds-msg-bubble ds-msg-bubble-out">
                <p>${text.replace(/</g, '&lt;')}</p>
                <span>Just now</span>
            </div>
        </div>`;

    const typing = document.getElementById('typing-indicator');
    if(typing) typing.style.display = 'flex';
    list.scrollTop = list.scrollHeight;

    const reply = DESIGNER_REPLIES[Math.floor(Math.random() * DESIGNER_REPLIES.length)];
    setTimeout(() => {
        if(typing) typing.style.display = 'none';
        list.innerHTML += `
            <div class="ds-msg ds-msg-in">
                <div class="ds-msg-avatar">ER</div>
                <div class="ds-msg-bubble ds-msg-bubble-in">
                    <p>${reply}</p>
                    <span>Just now</span>
                </div>
            </div>`;
        list.scrollTop = list.scrollHeight;
    }, 1600);
}

// --- Global Form Success Handling ---
function formSuccessMessage(form) {
    const isNewsletter = form.classList.contains('newsletter-form-inline');
    const hasPassword = !!form.querySelector('input[type="password"]');
    const hasTel = !!form.querySelector('input[type="tel"]');
    const hasSelect = !!form.querySelector('select');
    const hasTextarea = !!form.querySelector('textarea');

    if (isNewsletter) {
        return {
            title: "You're on the list.",
            sub: "Welcome to The Private List — issue No. 05 arrives soon."
        };
    }
    if (hasPassword && hasTel) {
        return {
            title: "Welcome aboard.",
            sub: "Your account is being prepared — redirecting you to sign in."
        };
    }
    if (hasPassword) {
        return {
            title: "Welcome back.",
            sub: "You've signed in successfully."
        };
    }
    if (hasSelect && !hasTextarea) {
        return {
            title: "Request received.",
            sub: "Our team will review your access request within 48 hours."
        };
    }
    if (hasTextarea) {
        return {
            title: "Message sent.",
            sub: "Thank you — we'll respond within two business days."
        };
    }
    return {
        title: "Thank you.",
        sub: "Your submission has been received."
    };
}

function showFormSuccess(form) {
    const msg = formSuccessMessage(form);
    const savedHTML = form.innerHTML;
    const hasPassword = !!form.querySelector('input[type="password"]');
    const hasTel = !!form.querySelector('input[type="tel"]');
    const isLogin = hasPassword && !hasTel;
    const isSignup = hasTel && hasPassword;
    const isAuth = isLogin || isSignup || (!!form.querySelector('select') && !form.querySelector('textarea'));

    // Capture the name + email from login or signup and persist them for the dashboard greeting
    if (isLogin || isSignup) {
        const nameInput = form.querySelector('input[type="text"]');
        const emailInput = form.querySelector('input[type="email"]');
        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        if (name || email) {
            try {
                localStorage.setItem('interihub_user', JSON.stringify({ name: name || '', email: email || '' }));
            } catch (e) { /* storage unavailable */ }
        }
    }

    form.innerHTML = `
        <div class="form-success" role="status">
            <span class="form-success-check" aria-hidden="true">✓</span>
            <p class="form-success-title">${msg.title}</p>
            <p class="form-success-sub">${msg.sub}</p>
        </div>`;

    const restore = () => {
        form.innerHTML = savedHTML;
        form.removeAttribute('data-refreshed');
    };

    if (isAuth) {
        setTimeout(() => {
            window.location.hash = isSignup ? '/login' : '/dashboard';
            setTimeout(restore, 600);
        }, 1600);
    } else {
        setTimeout(restore, 4200);
    }
}

function initGlobalForms() {
    document.addEventListener('submit', (e) => {
        const form = e.target.closest('form');
        if (!form) return;
        if (form.hasAttribute('data-no-success')) return;
        e.preventDefault();
        showFormSuccess(form);
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initRTL();
    initNavigation();
    initProfileMenu();
    initGlobalForms();
    initRouter();
});
