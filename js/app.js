// Main Application Logic - InteriHub

// --- State & Config ---
const state = {
    theme: localStorage.getItem('theme') || 'light',
    isRTL: localStorage.getItem('isRTL') === 'true',
    currentRoute: window.location.pathname
};

// --- DOM Elements ---
const dom = {
    body: document.body,
    themeToggleBtn: document.getElementById('theme-toggle'),
    navbar: document.getElementById('navbar'),
    appRoot: document.getElementById('app-root'),
    pageTransition: document.querySelector('.page-transition'),
    backToTopBtn: document.getElementById('back-to-top')
};

// --- Theme Management ---
function initTheme() {
    dom.body.classList.remove('theme-light', 'theme-dark');
    dom.body.classList.add(`theme-${state.theme}`);
    
    dom.themeToggleBtn.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', state.theme);
        
        dom.body.classList.remove('theme-light', 'theme-dark');
        dom.body.classList.add(`theme-${state.theme}`);
    });
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

// --- Routing (SPA) ---
const routes = {
    '/': renderHome,
    '/dashboard': renderDashboard
    // Other routes will dynamically fetch from /pages/[route].html
};

async function handleRoute(path) {
    // Prevent routing if it's the same page
    if(path === state.currentRoute && dom.appRoot.innerHTML !== '') return;
    state.currentRoute = path;

    // Transition out
    dom.pageTransition.classList.add('active');
    
    // Wait for transition overlay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Render view
    if (routes[path]) {
        dom.appRoot.innerHTML = await routes[path]();
    } else {
        try {
            const pageName = path === '/' ? 'home' : path.replace('/', '');
            const response = await fetch(`pages/${pageName}.html`);
            if (response.ok) {
                dom.appRoot.innerHTML = await response.text();
            } else {
                dom.appRoot.innerHTML = await render404();
            }
        } catch (error) {
            dom.appRoot.innerHTML = await render404();
        }
    }
    
    // Re-initialize Lucide icons for new content
    if(window.lucide) {
        window.lucide.createIcons();
    }
    
    // Update Active Nav Link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
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
            e.preventDefault();
            const path = link.getAttribute('href');
            window.history.pushState({}, '', path);
            handleRoute(path);
        }
    });

    window.addEventListener('popstate', () => {
        handleRoute(window.location.pathname);
    });

    // Initial load
    handleRoute(window.location.pathname);
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
                    Architectural elegance for modern living.
                </h1>
                <p class="text-lead reveal-up" style="max-width: 500px; margin-bottom: 3rem; transform: translateY(50px); opacity: 0; animation: fadeUp 1s forwards 0.7s;">
                    We craft timeless interiors that merge profound artistic vision with sophisticated, livable spaces.
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

async function renderDashboard() {
    return `<div style="min-height: 100vh; padding: 150px 0; background-color: var(--bg-secondary);">
        <div class="container" style="display: flex; gap: 2rem;">
            <!-- Sidebar -->
            <aside style="width: 250px; background-color: var(--bg-primary); border-radius: 8px; padding: 2rem; border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 2rem; font-size: 1.2rem;">Client Portal</h3>
                <ul style="list-style: none;">
                    <li style="margin-bottom: 1rem;"><a href="/dashboard" data-route class="active" style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="layout-dashboard" style="width: 18px;"></i> Overview</a></li>
                    <li style="margin-bottom: 1rem;"><a href="#" style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="image" style="width: 18px;"></i> Mood Boards</a></li>
                    <li style="margin-bottom: 1rem;"><a href="#" style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="calendar" style="width: 18px;"></i> Timeline</a></li>
                    <li style="margin-bottom: 1rem;"><a href="#" style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="file-text" style="width: 18px;"></i> Project Files</a></li>
                </ul>
            </aside>
            
            <!-- Main Content -->
            <main style="flex: 1; background-color: var(--bg-primary); border-radius: 8px; padding: 2rem; border: 1px solid var(--border-color);">
                <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 class="heading-1" style="margin-bottom: 0;">Dashboard Overview</h1>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="color: var(--text-muted);">Welcome, <strong style="color: var(--text-primary);">A. Client</strong></span>
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--color-obsidian); color: var(--color-warm-ivory); display: flex; align-items: center; justify-content: center;">AC</div>
                    </div>
                </header>
                
                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 3rem;">
                    <div style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                        <p style="color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Project Status</p>
                        <p style="font-size: 1.5rem; font-family: var(--font-heading);">Design Phase</p>
                    </div>
                    <div style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                        <p style="color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Next Milestone</p>
                        <p style="font-size: 1.5rem; font-family: var(--font-heading);">Concept Review (Oct 15)</p>
                    </div>
                    <div style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                        <p style="color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Pending Actions</p>
                        <p style="font-size: 1.5rem; font-family: var(--font-heading);">2 Approvals Required</p>
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <section>
                    <h2 class="heading-1" style="font-size: 1.5rem; margin-bottom: 1.5rem;">Recent Activity</h2>
                    <div style="border-left: 2px solid var(--border-color); padding-left: 1.5rem; margin-left: 1rem;">
                        <div style="position: relative; margin-bottom: 2rem;">
                            <div style="position: absolute; left: -1.9rem; top: 0; width: 12px; height: 12px; border-radius: 50%; background-color: var(--color-antique-gold);"></div>
                            <p style="font-weight: 600;">Mood Board Proposal V2 Uploaded</p>
                            <p style="color: var(--text-muted); font-size: 0.875rem;">Today, 10:30 AM</p>
                            <a href="#" class="btn btn-outline" style="padding: 0.5rem 1rem; margin-top: 1rem; font-size: 0.75rem;">Review Proposal</a>
                        </div>
                        <div style="position: relative;">
                            <div style="position: absolute; left: -1.9rem; top: 0; width: 12px; height: 12px; border-radius: 50%; background-color: var(--border-color);"></div>
                            <p style="font-weight: 600;">Initial Consultation Notes Added</p>
                            <p style="color: var(--text-muted); font-size: 0.875rem;">Oct 1, 2026</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>`;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initRouter();
});
