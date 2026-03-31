/**
 * Cinematic Effects — Streaming & Global Media Visibility
 *
 * Effects:
 *   1. Opening countdown screen (3·2·1 → fade to site)
 *   2. Chapter interstitial cards (between viz sections)
 *   3. Film grain + edge vignette overlay
 *   4. Cursor light trail
 */

(function () {

  /* ══════════════════════════════════
     1. OPENING COUNTDOWN
  ══════════════════════════════════ */

  function initCountdown() {
    const screen = document.createElement('div');
    screen.id = 'cinema-countdown';
    screen.innerHTML = `
      <div class="cd-inner">
        <div class="cd-reel">
          <div class="cd-hole tl"></div>
          <div class="cd-hole tr"></div>
          <div class="cd-hole bl"></div>
          <div class="cd-hole br"></div>
          <div class="cd-number" id="cd-num">3</div>
          <div class="cd-arc"></div>
        </div>
        <div class="cd-label">FEATURE PRESENTATION</div>
      </div>
      <div class="cd-scratch"></div>
    `;
    document.body.appendChild(screen);

    const num = document.getElementById('cd-num');
    let count = 3;

    const tick = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(tick);
        screen.classList.add('cd-fade-out');
        setTimeout(() => screen.remove(), 900);
      } else {
        num.classList.add('cd-pop');
        num.textContent = count;
        setTimeout(() => num.classList.remove('cd-pop'), 300);
      }
    }, 900);
  }


  /* ══════════════════════════════════
     2. CHAPTER INTERSTITIALS
  ══════════════════════════════════ */

  const CHAPTERS = [
    { target: 'sec-viz1', number: '01', title: 'Genre Playoffs',              stage: 'Hook' },
    { target: 'sec-viz2', number: '02', title: 'Language Representation',      stage: 'Rising Insight' },
    { target: 'sec-viz3', number: '03', title: 'Genre & Language Connections', stage: 'Rising Insight' },
    { target: 'sec-viz4', number: '04', title: 'Budget vs Revenue',            stage: 'Aha Moment' },
    { target: 'sec-viz5', number: '05', title: 'Global Streaming Map',         stage: 'Resolution' },
  ];

  function initChapterCards() {
    CHAPTERS.forEach(ch => {
      const target = document.getElementById(ch.target);
      if (!target) return;

      const card = document.createElement('div');
      card.className = 'chapter-card';
      card.innerHTML = `
        <div class="chapter-card-inner">
          <span class="chapter-stage">${ch.stage}</span>
          <div class="chapter-number">${ch.number}</div>
          <div class="chapter-title">${ch.title}</div>
          <div class="chapter-line"></div>
        </div>
      `;

      target.parentNode.insertBefore(card, target);

      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            card.classList.add('chapter-visible');
            obs.unobserve(card);
          }
        });
      }, { threshold: 0.3 });

      obs.observe(card);
    });
  }


  /* ══════════════════════════════════
     3. FILM GRAIN + VIGNETTE
  ══════════════════════════════════ */

  function initGrainAndVignette() {
    const overlay = document.createElement('div');
    overlay.id = 'cinema-overlay';
    overlay.innerHTML = `
      <canvas id="grain-canvas"></canvas>
      <div id="vignette"></div>
    `;
    document.body.appendChild(overlay);

    const canvas = document.getElementById('grain-canvas');
    const ctx    = canvas.getContext('2d');
    let   W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function drawGrain() {
      const imageData = ctx.createImageData(W, H);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 18 | 0;
        data[i]     = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = Math.random() * 28 | 0;
      }
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(drawGrain);
    }

    resize();
    drawGrain();
    window.addEventListener('resize', resize);
  }


  /* ══════════════════════════════════
     4. CURSOR LIGHT TRAIL
  ══════════════════════════════════ */

  function initCursorTrail() {
    const COUNT = 10;
    const dots  = [];

    for (let i = 0; i < COUNT; i++) {
      const d = document.createElement('div');
      d.className = 'cursor-dot';
      d.style.opacity = (1 - i / COUNT) * 0.55;
      d.style.width   = d.style.height = (4 - i * 0.28) + 'px';
      document.body.appendChild(d);
      dots.push(d);
    }

    let mx = 0, my = 0;
    let positions = Array(COUNT).fill().map(() => ({ x: 0, y: 0 }));

    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    function animate() {
      positions = [{ x: mx, y: my }, ...positions.slice(0, COUNT - 1)];
      dots.forEach((dot, i) => {
        dot.style.transform = `translate(${positions[i].x - 2}px, ${positions[i].y - 2}px)`;
      });
      requestAnimationFrame(animate);
    }
    animate();
  }


  /* ══════════════════════════════════
     BOOT
  ══════════════════════════════════ */

  document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    initChapterCards();
    initGrainAndVignette();
    initCursorTrail();
  });

})();