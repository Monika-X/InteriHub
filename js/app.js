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
}

function getRoute() {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash === '/index.html' ? '/' : hash;
    const path = window.location.pathname;
    if (path === '/index.html' || path === '/') return '/';
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
    const minimalPages = ['/login', '/signup', '/dashboard'];
    dom.body.classList.toggle('page-auth', minimalPages.includes(routeKey) || is404);
    
    if (path === '/dashboard') {
        initDashboard();
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
        <section class="hero" style="min-height: 100vh; display: flex; align-items: center; position: relative; overflow: hidden; padding-top: 100px;">
            <div class="container" style="position: relative; z-index: 2;">
                <h1 class="display-1 reveal-up" style="max-width: 800px; margin-bottom: 2rem; transform: translateY(50px); opacity: 0; animation: fadeUp 1s forwards 0.5s;">
                    Where Elegance Meets Comfort.
                </h1>
                <p class="text-lead reveal-up" style="max-width: 500px; margin-bottom: 3rem; transform: translateY(50px); opacity: 0; animation: fadeUp 1s forwards 0.7s;">
                    Architectural elegance for modern living. We craft timeless interiors that merge profound artistic vision with sophisticated, livable spaces.
                </p>
                <div class="reveal-up" style="transform: translateY(50px); opacity: 0; animation: fadeUp 1s forwards 0.9s;">
                    <a href="/services" data-route class="btn btn-primary">Begin Consultation</a>
                </div>
            </div>
            
            <!-- Hero Image Background -->
            <div style="position: absolute; top: 0; right: 0; width: 50%; height: 100%; z-index: 1;">
                <img src="assets/images/hero-interior.jpg" alt="Luxury Interior" style="width: 100%; height: 100%; object-fit: cover; opacity: 0; animation: fadeIn 2s forwards 0.2s;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
            </div>
        </section>

        <section class="section-padding" style="background-color: var(--bg-secondary);">
            <div class="container">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4rem;">
                    <h2 class="heading-1 reveal-up">Curated spaces <br>with artistic intent</h2>
                    <a href="/portfolio" data-route class="btn btn-outline reveal-up">View Selected Works</a>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
                    <!-- Card 1 -->
                    <div class="reveal-up" style="transition-delay: 0.1s;">
                        <div style="aspect-ratio: 3/4; overflow: hidden; margin-bottom: 1rem;">
                            <img src="assets/images/project-1.jpg" alt="Project 1" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        </div>
                        <h3>The Obsidian Residence</h3>
                        <p style="color: var(--text-muted)">Living Room Design</p>
                    </div>
                    <!-- Card 2 -->
                    <div class="reveal-up" style="transition-delay: 0.3s; transform: translateY(40px);">
                        <div style="aspect-ratio: 3/4; overflow: hidden; margin-bottom: 1rem;">
                            <img src="assets/images/project-2.jpg" alt="Project 2" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        </div>
                        <h3>Ivory Coastal Villa</h3>
                        <p style="color: var(--text-muted)">Full Home Renovation</p>
                    </div>
                    <!-- Card 3 -->
                    <div class="reveal-up" style="transition-delay: 0.5s;">
                        <div style="aspect-ratio: 3/4; overflow: hidden; margin-bottom: 1rem;">
                            <img src="assets/images/project-3.jpg" alt="Project 3" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        </div>
                        <h3>Taupe Penthouse</h3>
                        <p style="color: var(--text-muted)">Master Suite</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="section-padding" style="background-color: var(--bg-primary);">
            <div class="container">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;" class="reveal-up">
                    <div>
                        <p style="color: var(--color-antique-gold); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 1rem;">Design Philosophy</p>
                        <h2 class="heading-1">Spaces conceived as living architecture</h2>
                        <p style="color: var(--text-muted); margin-top: 1.5rem; max-width: 480px;">
                            We treat every residence as a single, continuous composition — where light, proportion and material converge to shape how a home is felt, not just seen.
                        </p>
                        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                            <a href="/about" data-route class="btn btn-outline">The Studio</a>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem;">
                        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                            <h3 style="font-family: var(--font-heading); font-size: 3.5rem; color: var(--color-antique-gold);">12+</h3>
                            <p style="color: var(--text-muted); font-size: 0.875rem;">Years of practice</p>
                        </div>
                        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                            <h3 style="font-family: var(--font-heading); font-size: 3.5rem; color: var(--color-antique-gold);">240</h3>
                            <p style="color: var(--text-muted); font-size: 0.875rem;">Projects delivered</p>
                        </div>
                        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                            <h3 style="font-family: var(--font-heading); font-size: 3.5rem; color: var(--color-antique-gold);">18</h3>
                            <p style="color: var(--text-muted); font-size: 0.875rem;">Design awards won</p>
                        </div>
                        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                            <h3 style="font-family: var(--font-heading); font-size: 3.5rem; color: var(--color-antique-gold);">96%</h3>
                            <p style="color: var(--text-muted); font-size: 0.875rem;">Client retention</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section-padding" style="background-color: var(--color-obsidian); color: var(--color-warm-ivory); text-align: center;">
            <div class="container">
                <p class="reveal-up" style="font-family: var(--font-heading); font-size: clamp(1.75rem, 3vw, 2.75rem); font-style: italic; max-width: 900px; margin: 0 auto; line-height: 1.4; color: var(--color-warm-ivory);">
                    "InteriHub doesn't decorate rooms — they compose them. Every corner feels deliberate, every material speaks."
                </p>
                <p class="reveal-up" style="color: var(--color-antique-gold); margin-top: 2rem; letter-spacing: 0.15em; text-transform: uppercase; font-size: 0.8rem;">— The Harrison Family, Manhattan</p>
                <div class="reveal-up" style="margin-top: 3rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="/services" data-route class="btn btn-primary" style="background-color: var(--color-antique-gold); color: var(--color-obsidian); border: none;">Explore Services</a>
                    <a href="/contact" data-route class="btn btn-outline" style="color: var(--color-warm-ivory); border-color: var(--color-warm-ivory);">Begin Your Project</a>
                </div>
            </div>
        </section>

        <section class="section-padding" style="background-color: var(--bg-secondary);">
            <div class="container">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4rem;" class="reveal-up">
                    <div>
                        <p style="color: var(--color-antique-gold); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 1rem;">How We Work</p>
                        <h2 class="heading-1">A considered path from brief to home</h2>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem;">
                    <div class="reveal-up" style="border-top: 1px solid var(--border-color); padding-top: 2rem;">
                        <p style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--color-antique-gold); margin-bottom: 1rem;">01</p>
                        <h3 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem;">Consult</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">A private session to understand your rituals, tastes and the life the space must hold.</p>
                    </div>
                    <div class="reveal-up" style="transition-delay: 0.15s; border-top: 1px solid var(--border-color); padding-top: 2rem;">
                        <p style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--color-antique-gold); margin-bottom: 1rem;">02</p>
                        <h3 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem;">Design</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Concept boards, material studies and 3D walkthroughs refined until every detail is resolved.</p>
                    </div>
                    <div class="reveal-up" style="transition-delay: 0.3s; border-top: 1px solid var(--border-color); padding-top: 2rem;">
                        <p style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--color-antique-gold); margin-bottom: 1rem;">03</p>
                        <h3 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem;">Build</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">A dedicated crew handles fabrication, procurement and installation with obsessive precision.</p>
                    </div>
                    <div class="reveal-up" style="transition-delay: 0.45s; border-top: 1px solid var(--border-color); padding-top: 2rem;">
                        <p style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--color-antique-gold); margin-bottom: 1rem;">04</p>
                        <h3 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem;">Live</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">A styled handover and lifetime care program — the home continues to evolve with you.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="section-padding" style="background-color: var(--bg-primary);">
            <div class="container">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4rem;" class="reveal-up">
                    <div>
                        <p style="color: var(--color-antique-gold); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 1rem;">From the Journal</p>
                        <h2 class="heading-1">Notes on material & light</h2>
                    </div>
                    <a href="/blog" data-route class="btn btn-outline">All Insights</a>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
                    <article class="reveal-up">
                        <div style="aspect-ratio: 4/3; overflow: hidden; margin-bottom: 1.5rem;">
                            <img src="https://i.pinimg.com/1200x/54/4a/69/544a69bcc199297c4c7b6386d81d58af.jpg" alt="Journal" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        </div>
                        <p style="color: var(--color-antique-gold); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 0.5rem;">Materials — 4 Min Read</p>
                        <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">The Quiet Power of Honest Stone</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Why we let raw surfaces age gracefully — and how texture becomes memory.</p>
                    </article>
                    <article class="reveal-up" style="transition-delay: 0.15s;">
                        <div style="aspect-ratio: 4/3; overflow: hidden; margin-bottom: 1.5rem;">
                            <img src="https://i.pinimg.com/736x/a9/0a/59/a90a59ecce0c3a7e1352f913a0110929.jpg" alt="Journal" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        </div>
                        <p style="color: var(--color-antique-gold); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 0.5rem;">Lighting — 6 Min Read</p>
                        <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">Light as the Fifth Wall</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Layering daylight, task and accent light to compose rooms that shift through the day.</p>
                    </article>
                    <article class="reveal-up" style="transition-delay: 0.3s;">
                        <div style="aspect-ratio: 4/3; overflow: hidden; margin-bottom: 1.5rem;">
                            <img src="https://i.pinimg.com/736x/5d/56/86/5d5686bf3c8b0356ddd96e829a0f8b55.jpg" alt="Journal" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlYmU2ZGYiLz48L3N2Zz4=';">
                        </div>
                        <p style="color: var(--color-antique-gold); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 0.5rem;">Process — 5 Min Read</p>
                        <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">Renovating Without Displacing a Life</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">A behind-the-scenes look at how we stage construction around the families who call it home.</p>
                    </article>
                </div>
            </div>
        </section>
        
        <style>
            @keyframes fadeUp {
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeIn {
                to { opacity: 1; }
            }
            .reveal-up {
                opacity: 0;
                transform: translateY(40px);
                transition: opacity 0.8s ease, transform 0.8s ease;
            }
            .reveal-up.revealed {
                opacity: 1;
                transform: translateY(0);
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
    return `<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; background-color: var(--bg-primary);">
        <div>
            <h1 class="display-1">404</h1>
            <p class="text-lead">Page not found.</p>
            <a href="/" data-route class="btn btn-primary" style="margin-top: 2rem;">Return Home</a>
        </div>
    </div>`;
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
    const idx = postOrder.indexOf(post.title ? Object.keys(BLOG_POSTS).find(k => BLOG_POSTS[k] === post) : -1);
    const prev = idx > 0 ? BLOG_POSTS[postOrder[idx - 1]] : null;
    const next = idx < postOrder.length - 1 ? BLOG_POSTS[postOrder[idx + 1]] : null;
    const prevSlug = prev ? Object.keys(BLOG_POSTS).find(k => BLOG_POSTS[k] === prev) : null;
    const nextSlug = next ? Object.keys(BLOG_POSTS).find(k => BLOG_POSTS[k] === next) : null;

    const sections = post.sections.map(s => `
        <h2 class="heading-1" style="margin: 3rem 0 1.5rem; color: var(--text-primary);">${s.heading}</h2>
        <p style="margin-bottom: 2rem;">${s.body}</p>
    `).join('');

    return `
        <section class="section-padding" style="padding-top: 150px; background-color: var(--bg-primary);">
            <div class="container" style="max-width: 900px;">
                <p style="color: var(--color-antique-gold); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem;" class="reveal-up">${post.category}</p>
                <h1 class="display-2 reveal-up" style="margin-bottom: 2rem;">${post.title}</h1>
                <div style="display: flex; gap: 2rem; color: var(--text-muted); font-size: 0.875rem; border-bottom: 1px solid var(--border-color); padding-bottom: 2rem; margin-bottom: 4rem;" class="reveal-up">
                    <span>By ${post.author}</span>
                    <span>${post.date}</span>
                    <span>${post.readTime}</span>
                </div>
                <div class="reveal-up" style="margin-bottom: 4rem;">
                    <img src="${post.image}" alt="${post.title}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;">
                </div>
                <div class="reveal-up" style="font-size: 1.125rem; line-height: 1.8; color: var(--text-secondary);">
                    <p style="margin-bottom: 2rem;">${post.intro}</p>
                    ${sections}
                    <blockquote style="border-left: 2px solid var(--color-antique-gold); padding-left: 2rem; margin: 3rem 0; font-family: var(--font-heading); font-size: 2rem; color: var(--text-primary); font-style: italic;">
                        &ldquo;${post.quote}&rdquo;
                    </blockquote>
                    <p style="margin-bottom: 2rem;">${post.outro}</p>
                </div>
                <div class="reveal-up" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 2rem; margin-top: 4rem;">
                    ${prev && prevSlug ? `<a href="/blog-details?post=${prevSlug}" data-route class="btn btn-outline">&larr; ${prev.title}</a>` : '<span></span>'}
                    ${next && nextSlug ? `<a href="/blog-details?post=${nextSlug}" data-route class="btn btn-outline">${next.title} &rarr;</a>` : ''}
                </div>
            </div>
        </section>`;
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
            const status = btn.closest('div').parentElement.querySelector('.stage-status');
            if(status) {
                status.textContent = 'Approved';
                status.style.backgroundColor = 'var(--color-antique-gold)';
                status.style.color = '#fff';
            }
            btn.remove();
            const revise = btn.closest('div').querySelector('.stage-revise');
            if(revise) revise.remove();
            updateProgress();
        });
    });
    document.querySelectorAll('.stage-revise').forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.closest('div').parentElement.querySelector('.stage-status');
            if(status) {
                status.textContent = 'Changes Requested';
                status.style.backgroundColor = 'var(--color-clay)';
                status.style.color = '#fff';
            }
            btn.remove();
            const approve = btn.closest('div').querySelector('.stage-approve');
            if(approve) approve.remove();
            document.getElementById('msg-list').innerHTML += `
                <div style="display: flex; justify-content: flex-end; margin-bottom: 1.5rem;">
                    <div style="background-color: var(--color-obsidian); color: var(--color-warm-ivory); border-radius: 12px 12px 2px 12px; padding: 0.9rem 1.2rem; max-width: 80%;">
                        <p style="font-size: 0.9rem;">We'd like some changes to the Concept stage — details to follow.</p>
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">Just now</p>
                    </div>
                </div>`;
        });
    });
}

function updateProgress() {
    const bar = document.getElementById('progress-bar');
    if(!bar) return;
    const approved = document.querySelectorAll('.stage-status').length;
    const steps = document.querySelectorAll('.stage-status').length + 2;
    const pct = Math.min(Math.round((approved / steps) * 100), 100);
    bar.style.width = pct + '%';
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
        <div style="display: flex; justify-content: flex-end; margin-bottom: 1.5rem;">
            <div style="background-color: var(--color-obsidian); color: var(--color-warm-ivory); border-radius: 12px 12px 2px 12px; padding: 0.9rem 1.2rem; max-width: 80%;">
                <p style="font-size: 0.9rem;">${text.replace(/</g, '&lt;')}</p>
                <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">Just now</p>
            </div>
        </div>`;

    const typing = document.getElementById('typing-indicator');
    if(typing) typing.style.display = 'flex';
    list.scrollTop = list.scrollHeight;

    const reply = DESIGNER_REPLIES[Math.floor(Math.random() * DESIGNER_REPLIES.length)];
    setTimeout(() => {
        if(typing) typing.style.display = 'none';
        list.innerHTML += `
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem; max-width: 80%;">
                <div style="flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-obsidian); color: var(--color-warm-ivory); display: flex; align-items: center; justify-content: center; font-family: var(--font-heading); font-size: 0.75rem;">ER</div>
                <div style="background-color: var(--bg-secondary); border-radius: 12px 12px 12px 2px; padding: 0.9rem 1.2rem;">
                    <p style="font-size: 0.9rem;">${reply}</p>
                    <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">Just now</p>
                </div>
            </div>`;
        list.scrollTop = list.scrollHeight;
    }, 1600);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initRTL();
    initNavigation();
    initProfileMenu();
    initRouter();
});
