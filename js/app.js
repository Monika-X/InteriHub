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
    backToTopBtn: document.getElementById('back-to-top'),
    rtlToggleBtn: document.getElementById('rtl-toggle')
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

// --- RTL Management ---
function initRTL() {
    if(state.isRTL) {
        document.documentElement.setAttribute('dir', 'rtl');
    }
    
    if(dom.rtlToggleBtn) {
        dom.rtlToggleBtn.addEventListener('click', () => {
            state.isRTL = !state.isRTL;
            localStorage.setItem('isRTL', state.isRTL);
            document.documentElement.setAttribute('dir', state.isRTL ? 'rtl' : 'ltr');
            dom.rtlToggleBtn.textContent = state.isRTL ? 'LTR' : 'RTL';
        });
        dom.rtlToggleBtn.textContent = state.isRTL ? 'LTR' : 'RTL';
    }
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

    document.addEventListener('click', (e) => {
        if(!menu.contains(e.target)) {
            menu.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
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
    if(path === state.currentRoute && dom.appRoot.innerHTML.trim() !== '') return;
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
