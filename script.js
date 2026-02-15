(() => {
    'use strict';

    /* ===== CONFIG ===== */
    const TOTAL_FRAMES = 210;
    const FRAME_PATH = 'images/ezgif-frame-';
    const FRAME_EXT = '.jpg';

    /* ===== DOM ===== */
    const canvas = document.getElementById('intro-canvas');
    const ctx = canvas.getContext('2d');
    const introWrapper = document.getElementById('intro-wrapper');
    const introOverlay = document.getElementById('intro-overlay');
    const loader = document.getElementById('loader');
    const loaderPct = document.getElementById('loader-pct');
    const navbar = document.getElementById('navbar');

    /* ===== STATE ===== */
    const frames = [];
    let loaded = 0;
    let curFrame = -1;
    let ticking = false;

    /* ===== HELPERS ===== */
    const pad = n => String(n).padStart(3, '0');

    /* Resize canvas to fill viewport exactly */
    function sizeCanvas() {
        canvas.width = window.innerWidth * devicePixelRatio;
        canvas.height = window.innerHeight * devicePixelRatio;
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        drawFrame(Math.max(curFrame, 0));
    }

    /* Draw frame to canvas with cover-fit */
    function drawFrame(idx) {
        const img = frames[idx];
        if (!img || !img.naturalWidth) return;

        const cw = canvas.width, ch = canvas.height;
        const iw = img.naturalWidth, ih = img.naturalHeight;

        // object-fit: cover math
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale, dh = ih * scale;
        const dx = (cw - dw) / 2, dy = (ch - dh) / 2;

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
    }

    /* ===== PRELOAD ===== */
    function preload() {
        return new Promise(resolve => {
            for (let i = 1; i <= TOTAL_FRAMES; i++) {
                const img = new Image();
                img.src = `${FRAME_PATH}${pad(i)}${FRAME_EXT}`;
                img.onload = img.onerror = () => {
                    loaded++;
                    loaderPct.textContent = Math.round((loaded / TOTAL_FRAMES) * 100) + '%';
                    if (loaded === TOTAL_FRAMES) resolve();
                };
                frames.push(img);
            }
        });
    }

    /* ===== SCROLL HANDLER ===== */
    function onScroll() {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
            const rect = introWrapper.getBoundingClientRect();
            const scrollable = introWrapper.offsetHeight - window.innerHeight;
            const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);

            /* Frame index */
            const idx = Math.min(Math.floor(progress * TOTAL_FRAMES), TOTAL_FRAMES - 1);
            if (idx !== curFrame) {
                curFrame = idx;
                drawFrame(curFrame);
            }

            /* Fade overlay text out between 10%-40% scroll */
            const overlayOpacity = 1 - Math.min(Math.max((progress - 0.1) / 0.3, 0), 1);
            introOverlay.style.opacity = overlayOpacity;

            /* Show navbar after intro ends (~95% scroll or past intro) */
            const pastIntro = rect.bottom <= window.innerHeight + 50;
            navbar.classList.toggle('show', pastIntro);
            navbar.classList.toggle('scrolled', pastIntro);

            ticking = false;
        });
    }

    /* ===== INIT ===== */
    async function init() {
        sizeCanvas();
        window.addEventListener('resize', sizeCanvas);

        await preload();

        /* Hide loader */
        loader.classList.add('done');
        setTimeout(() => loader.remove(), 600);

        /* First frame */
        curFrame = 0;
        drawFrame(0);

        /* Scroll listener */
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    init();
})();


/* ===== MOBILE NAV ===== */
(() => {
    const btn = document.getElementById('nav-hamburger');
    const menu = document.getElementById('nav-links');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        menu.classList.toggle('active');
    });
    menu.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => {
            btn.classList.remove('active');
            menu.classList.remove('active');
        })
    );
})();


/* ===== FADE-IN OBSERVER ===== */
(() => {
    const els = document.querySelectorAll('.fade-in, .fade-in-stagger');
    if (!els.length) return;

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => obs.observe(el));
})();


/* ===== SMOOTH ANCHOR SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
});
