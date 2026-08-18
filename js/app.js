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

const routes = {
    '/': renderHome
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
    
    if (path === '/dashboard') {
        initDashboard();
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
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initRouter();
});
