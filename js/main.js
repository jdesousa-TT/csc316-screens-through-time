/**
 * Streaming & Global Media Visibility — Main Controller
 *
 * Architecture (scroll-based):
 *   All sections are normal document flow — no overlays.
 *   Visualizations initialize lazily when their section enters the viewport.
 *   Global particle canvas persists across all sections.
 *   Genre word floats are active only while the hero (#sec-title) is visible.
 */

/* ══════════════════════════════════
   PARTICLES
══════════════════════════════════ */

const particleCanvas = document.getElementById('global-particles');
const pCtx = particleCanvas.getContext('2d');
let PW, PH, particles = [];

function resizeParticles() {
  PW = particleCanvas.width  = window.innerWidth;
  PH = particleCanvas.height = window.innerHeight;
}

function Particle() {
  this.reset = function () {
    this.x     = Math.random() * PW;
    this.y     = Math.random() * PH;
    this.r     = 0.4 + Math.random() * 1.1;
    this.vx    = (Math.random() - 0.5) * 0.22;
    this.vy    = -0.12 - Math.random() * 0.28;
    this.alpha = 0.07 + Math.random() * 0.22;
    this.life  = 0;
    this.maxLife = 220 + Math.random() * 320;
  };
  this.reset();
  this.life = Math.floor(Math.random() * this.maxLife);
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 100; i++) particles.push(new Particle());
}

function drawParticles() {
  pCtx.clearRect(0, 0, PW, PH);
  for (const p of particles) {
    p.life++;
    if (p.life > p.maxLife) p.reset();
    const fade = Math.min(p.life / 50, 1) * Math.min((p.maxLife - p.life) / 50, 1);
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(255,255,255,${p.alpha * fade})`;
    pCtx.fill();
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = PW;
    if (p.x > PW) p.x = 0;
  }
  requestAnimationFrame(drawParticles);
}

resizeParticles();
initParticles();
drawParticles();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { resizeParticles(); }, 150);
});


/* ══════════════════════════════════
   FILM STRIP
══════════════════════════════════ */

function buildFilmStrip(id) {
  const el = document.getElementById(id);
  if (!el) return;
  for (let i = 0; i < 60; i++) {
    const hole = document.createElement('div');
    hole.className = 'film-hole';
    el.appendChild(hole);
    if (i % 2 === 0) {
      const frame = document.createElement('div');
      frame.className = 'film-frame';
      el.appendChild(frame);
    }
  }
}

buildFilmStrip('strip-top');
buildFilmStrip('strip-bot');


/* ══════════════════════════════════
   GENRE FLOATS (hero section only)
══════════════════════════════════ */

const GENRES = [
  'Drama', 'Comedy', 'Action', 'Thriller', 'Romance', 'Documentary',
  'Animation', 'Horror', 'Sci-Fi', 'Fantasy', 'Mystery', 'Crime',
  'Adventure', 'Biography', 'Musical', 'Western', 'History', 'Sport',
  'Family', 'War', 'Anime', 'K-Drama', 'Bollywood', 'Noir', 'Reality',
  'Sitcom', 'Period Drama', 'True Crime', 'Nature'
];

const floatContainer  = document.getElementById('genre-floats');
let   floatInterval   = null;
let   genreFloatsActive = true;

function spawnGenreFloat() {
  if (!genreFloatsActive || !floatContainer) return;
  const word = GENRES[Math.floor(Math.random() * GENRES.length)];
  const el   = document.createElement('div');
  el.className = 'genre-float';
  const size = 13 + Math.random() * 22;
  const dur  = 8 + Math.random() * 10;
  el.style.cssText = [
    `font-size:${size}px`,
    `left:${3 + Math.random() * 90}%`,
    `bottom:${Math.random() * 55}px`,
    `animation-duration:${dur}s`,
    `animation-delay:${Math.random() * 1.5}s`
  ].join(';');
  el.textContent = word;
  floatContainer.appendChild(el);
  setTimeout(() => el.remove(), (dur + 2.5) * 1000);
}

// Seed initial floats
for (let i = 0; i < 14; i++) setTimeout(spawnGenreFloat, i * 350);
floatInterval = setInterval(spawnGenreFloat, 950);

// Watch hero section — disable floats when scrolled past it
const heroSection = document.getElementById('sec-title');

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      genreFloatsActive = true;
      if (!floatInterval) floatInterval = setInterval(spawnGenreFloat, 950);
    } else {
      genreFloatsActive = false;
      clearInterval(floatInterval);
      floatInterval = null;
      // Fade out any remaining floats
      floatContainer.querySelectorAll('.genre-float').forEach(el => {
        el.style.transition = 'opacity 0.6s';
        el.style.opacity    = '0';
        setTimeout(() => el.remove(), 700);
      });
    }
  });
}, { threshold: 0.1 });

if (heroSection) heroObserver.observe(heroSection);


/* ══════════════════════════════════
   SCROLL-REVEAL
══════════════════════════════════ */

const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));


/* ══════════════════════════════════
   NAV DOTS
══════════════════════════════════ */

const navDots    = document.querySelectorAll('.nav-dot');
const sectionIds = [
  'sec-title', 'sec-story',
  'sec-viz1', 'sec-viz2', 'sec-viz3', 'sec-viz4', 'sec-viz5',
  'sec-conclusion'
];

function updateNavDots(activeId) {
  navDots.forEach((dot, i) => {
    dot.classList.toggle('active', sectionIds[i] === activeId);
  });
}

navDots.forEach((dot, i) => {
  dot.addEventListener('click', () => smoothScrollTo(sectionIds[i]));
});

// Track which section is most in-view
const sectionEls = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
  let best = null, bestRatio = 0;
  entries.forEach(entry => {
    if (entry.intersectionRatio > bestRatio) {
      bestRatio = entry.intersectionRatio;
      best = entry.target.id;
    }
  });
  if (best) updateNavDots(best);
}, { threshold: [0, 0.25, 0.5, 0.75, 1] });

sectionEls.forEach(el => sectionObserver.observe(el));


/* ══════════════════════════════════
   SMOOTH SCROLL HELPER
══════════════════════════════════ */

function smoothScrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ══════════════════════════════════
   LAZY VIZ INITIALIZATION
══════════════════════════════════ */

const initializedViz = new Set();

function initVisualization(sectionId) {
  if (initializedViz.has(sectionId)) return;

  switch (sectionId) {
    case 'sec-viz1':
      if (typeof initGenrePlayoffs === 'function') {
        initGenrePlayoffs();
        initializedViz.add(sectionId);
      }
      break;

    case 'sec-viz2':
      d3.csv('data/netflix_titles.csv').then(function (data) {
        new LanguageRepresentation('viz-language', data);
        initializedViz.add(sectionId);
      }).catch(err => console.warn('Language viz data error:', err));
      break;

    case 'sec-viz3':
      if (typeof initGenreLanguage === 'function') {
        initGenreLanguage();
        initializedViz.add(sectionId);
      }
      break;

    case 'sec-viz4':
      if (typeof initRevenueBudget === 'function') {
        initRevenueBudget();
        initializedViz.add(sectionId);
      }
      break;

    case 'sec-viz5':
      // Streaming map — init immediately, it manages its own data loading
      initializedViz.add(sectionId);
      break;
  }
}

// Observe each viz section and init when it enters viewport
const vizSectionIds = ['sec-viz1', 'sec-viz2', 'sec-viz3', 'sec-viz4', 'sec-viz5'];

const vizObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      initVisualization(entry.target.id);
    }
  });
}, { threshold: 0.08 });

vizSectionIds.forEach(id => {
  const el = document.getElementById(id);
  if (el) vizObserver.observe(el);
});


/* ══════════════════════════════════
   EAGER PRE-INIT (heavy viz)
   Genre playoffs & revenue/budget
   start loading immediately so they're
   ready when the user scrolls to them.
══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Pre-warm the two heaviest visualizations
  if (typeof initGenrePlayoffs === 'function') {
    initGenrePlayoffs();
    initializedViz.add('sec-viz1');
  }
  if (typeof initRevenueBudget === 'function') {
    initRevenueBudget();
    initializedViz.add('sec-viz4');
  }
});