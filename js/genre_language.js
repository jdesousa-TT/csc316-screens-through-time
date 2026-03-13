/**
 * Genre–Language Alluvial Chart
 * Curved flows from Genre (left) → Original Language (right)
 * Width ∝ number of films; colour = genre
 */

const GL_GENRE_COLORS = {
  'Action':      '#e04244',
  'Comedy':      '#e87d2f',
  'Drama':       '#c0504a',
  'Romance':     '#d94973',
  'Horror':      '#7b4fb0',
  'Thriller':    '#4a7ec9',
  'Animation':   '#4db89e',
  'Adventure':   '#2da8d8',
  'Science Fiction': '#5e81c9',
  'Crime':       '#8a7042',
  'Fantasy':     '#a76ec4',
  'Documentary': '#6aab5e',
  'Family':      '#e6a933',
  'Music':       '#ca6ea0',
  'Mystery':     '#5b8a8a',
  'War':         '#7e6654',
  'History':     '#9c8a56',
  'Western':     '#b07843',
  'TV Movie':    '#88a0b8',
};

const GL_LANG_LABELS = {
  en: 'English', fr: 'French', es: 'Spanish', ja: 'Japanese',
  ko: 'Korean', de: 'German', hi: 'Hindi', zh: 'Chinese',
  it: 'Italian', ru: 'Russian', pt: 'Portuguese', sv: 'Swedish',
  da: 'Danish', nl: 'Dutch', pl: 'Polish', th: 'Thai',
  cn: 'Chinese', ta: 'Tamil', te: 'Telugu', tr: 'Turkish',
  no: 'Norwegian', fi: 'Finnish', cs: 'Czech', el: 'Greek',
  he: 'Hebrew', ar: 'Arabic', id: 'Indonesian', ms: 'Malay',
};

function glLangName(code) {
  return GL_LANG_LABELS[code] || code.toUpperCase();
}

function glGenreColor(name) {
  return GL_GENRE_COLORS[name] || '#999';
}

function glInjectStyles() {
  if (document.getElementById('gl-css')) return;
  const el = document.createElement('style');
  el.id = 'gl-css';
  el.textContent = `
    #viz-genre-lang {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding: 24px 24px 16px !important;
      box-sizing: border-box;
      overflow: visible;
    }
    #gl-controls {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .gl-pill {
      padding: 5px 14px;
      border-radius: 100px;
      border: 1.5px solid rgba(0,0,0,0.15);
      background: transparent;
      font-family: inherit;
      font-size: 11px;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      cursor: pointer;
      color: #888;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
    }
    .gl-pill:hover { border-color: #c9a84c; color: #c9a84c; }
    .gl-pill.gl-active {
      color: #fff;
    }
    #gl-tooltip {
      position: fixed;
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
      background: rgba(255,255,255,0.97);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 12px;
      padding: 14px 18px;
      min-width: 180px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.1);
      font-size: 12px;
      line-height: 1.6;
      transition: opacity 0.15s ease, transform 0.15s ease;
      transform: translateY(6px);
    }
    #gl-tooltip.gl-show { opacity: 1; transform: translateY(0); }
    #gl-tooltip .gl-tt-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; font-style: italic; margin-bottom: 4px; color: #222; }
    #gl-tooltip .gl-tt-row { display: flex; justify-content: space-between; gap: 16px; }
    #gl-tooltip .gl-tt-key { color: #bbb; font-size: 11px; }
    #gl-tooltip .gl-tt-val { font-weight: 500; color: #333; }
  `;
  document.head.appendChild(el);
}

function initGenreLanguage() {
  glInjectStyles();
  d3.csv('data/movies/movies_metadata.csv')
    .then(rows => glDraw(glProcess(rows)))
    .catch(err => console.error('Failed to load movies_metadata.csv for genre-language viz', err));
}

function glParseGenres(raw) {
  if (!raw || raw.length < 3) return [];
  try {
    const json = raw.replace(/'/g, '"');
    const arr = JSON.parse(json);
    return arr.map(g => g.name).filter(Boolean);
  } catch { return []; }
}

function glProcess(rows) {
  const pairs = [];
  rows.forEach(d => {
    const lang = (d.original_language || '').trim();
    if (!lang) return;
    const genres = glParseGenres(d.genres);
    genres.forEach(g => pairs.push({ genre: g, lang }));
  });
  return pairs;
}

function glDraw(pairs) {
  const container = d3.select('#viz-genre-lang');
  container.html('');

  const TOP_GENRES = 8;
  const TOP_LANGS = 8;

  // Count genres and languages
  const genreCounts = d3.rollup(pairs, v => v.length, d => d.genre);
  const langCounts = d3.rollup(pairs, v => v.length, d => d.lang);

  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_GENRES)
    .map(d => d[0]);

  const topLangs = [...langCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LANGS)
    .map(d => d[0]);

  // Cross-tab: genre × lang counts
  const filtered = pairs.filter(d => topGenres.includes(d.genre) && topLangs.includes(d.lang));
  const crossCounts = d3.rollup(filtered, v => v.length, d => d.genre, d => d.lang);

  let activeGenres = new Set(topGenres);
  let excludeEnglish = false;

  // Render controls into sidebar
  const sidebar = d3.select('#gl-sidebar');
  sidebar.html('');

  const ctrlDiv = sidebar.append('div').attr('id', 'gl-controls');
  const allBtn = ctrlDiv.append('button')
    .attr('class', 'gl-pill gl-active')
    .style('background', '#c9a84c').style('border-color', '#c9a84c')
    .text('All Genres')
    .on('click', () => {
      activeGenres = new Set(topGenres);
      syncPills();
      refresh();
    });

  topGenres.forEach(g => {
    ctrlDiv.append('button')
      .attr('class', 'gl-pill gl-active gl-genre-pill')
      .attr('data-genre', g)
      .style('background', glGenreColor(g))
      .style('border-color', glGenreColor(g))
      .text(g)
      .on('click', function () {
        if (activeGenres.has(g)) activeGenres.delete(g);
        else activeGenres.add(g);
        syncPills();
        refresh();
      });
  });

  const engBtn = ctrlDiv.append('button')
    .attr('class', 'gl-pill')
    .style('margin-top', '6px')
    .text('Exclude English')
    .on('click', () => {
      excludeEnglish = !excludeEnglish;
      syncPills();
      refresh();
    });

  function syncPills() {
    const allActive = activeGenres.size === topGenres.length;
    allBtn
      .classed('gl-active', allActive)
      .style('background', allActive ? '#c9a84c' : 'transparent')
      .style('border-color', allActive ? '#c9a84c' : null)
      .style('color', allActive ? '#fff' : null);
    ctrlDiv.selectAll('.gl-genre-pill').each(function () {
      const g = d3.select(this).attr('data-genre');
      const on = activeGenres.has(g);
      d3.select(this)
        .classed('gl-active', on)
        .style('background', on ? glGenreColor(g) : 'transparent')
        .style('border-color', on ? glGenreColor(g) : null)
        .style('color', on ? '#fff' : null);
    });
    engBtn
      .classed('gl-active', excludeEnglish)
      .style('background', excludeEnglish ? '#555' : 'transparent')
      .style('border-color', excludeEnglish ? '#555' : null)
      .style('color', excludeEnglish ? '#fff' : null);
  }

  // SVG
  const node = document.getElementById('viz-genre-lang');
  const fullW = (node.offsetWidth || node.clientWidth || 900) - 48;
  const fullH = Math.max(500, Math.round(window.innerHeight * 0.72));
  const margin = { top: 30, right: 120, bottom: 20, left: 120 };
  const W = fullW - margin.left - margin.right;
  const H = fullH - margin.top - margin.bottom;

  const svg = container.append('svg')
    .attr('width', fullW).attr('height', fullH);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Column headers
  g.append('text').attr('x', 0).attr('y', -12)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px').style('letter-spacing', '0.1em')
    .style('fill', '#aaa').style('text-transform', 'uppercase')
    .text('Genre');

  g.append('text').attr('x', W).attr('y', -12)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px').style('letter-spacing', '0.1em')
    .style('fill', '#aaa').style('text-transform', 'uppercase')
    .text('Original Language');

  const flowsG = g.append('g').attr('class', 'gl-flows');
  const leftLabelsG = g.append('g');
  const rightLabelsG = g.append('g');

  // Tooltip
  const oldTT = document.getElementById('gl-tooltip');
  if (oldTT) oldTT.remove();
  const tt = document.createElement('div');
  tt.id = 'gl-tooltip';
  tt.innerHTML = `
    <div class="gl-tt-title" id="gl-tt-title"></div>
    <div class="gl-tt-row"><span class="gl-tt-key">Films</span><span class="gl-tt-val" id="gl-tt-count"></span></div>
  `;
  document.body.appendChild(tt);

  function refresh() {
    const visGenres = topGenres.filter(g => activeGenres.has(g));
    const visLangs = excludeEnglish ? topLangs.filter(l => l !== 'en') : topLangs;

    // Build flows: [{genre, lang, count}]
    const flows = [];
    visGenres.forEach(genre => {
      const langMap = crossCounts.get(genre);
      if (!langMap) return;
      visLangs.forEach(lang => {
        const c = langMap.get(lang) || 0;
        if (c > 0) flows.push({ genre, lang, count: c });
      });
    });

    // Use sqrt of counts for sizing so English doesn't dominate
    const sqrtVal = c => Math.sqrt(c);

    // Y scales — stacked layout for each column
    const genreTotals = d3.rollup(flows, v => d3.sum(v, d => sqrtVal(d.count)), d => d.genre);
    const langTotals = d3.rollup(flows, v => d3.sum(v, d => sqrtVal(d.count)), d => d.lang);

    const orderedGenres = visGenres.filter(g => genreTotals.has(g));
    const orderedLangs = visLangs.filter(l => langTotals.has(l));

    const GAP = 8;
    const totalGenreSqrt = d3.sum(orderedGenres, g => genreTotals.get(g));
    const totalLangSqrt = d3.sum(orderedLangs, l => langTotals.get(l));

    const genreScale = (H - GAP * (orderedGenres.length - 1)) / (totalGenreSqrt || 1);
    const langScale = (H - GAP * (orderedLangs.length - 1)) / (totalLangSqrt || 1);
    const flowScale = Math.min(genreScale, langScale);

    // Compute y positions for genres
    const genreY = {};
    let gy = 0;
    orderedGenres.forEach(g => {
      const h = (genreTotals.get(g) || 0) * flowScale;
      genreY[g] = { y: gy, h };
      gy += h + GAP;
    });

    // Compute y positions for languages
    const langY = {};
    let ly = 0;
    orderedLangs.forEach(l => {
      const h = (langTotals.get(l) || 0) * flowScale;
      langY[l] = { y: ly, h };
      ly += h + GAP;
    });

    // Assign offsets within each genre/lang stack
    const genreOffset = {};
    orderedGenres.forEach(g => genreOffset[g] = 0);
    const langOffset = {};
    orderedLangs.forEach(l => langOffset[l] = 0);

    const flowData = [];
    orderedGenres.forEach(genre => {
      orderedLangs.forEach(lang => {
        const f = flows.find(d => d.genre === genre && d.lang === lang);
        if (!f) return;
        const w = sqrtVal(f.count) * flowScale;
        const y0 = genreY[genre].y + genreOffset[genre];
        const y1 = langY[lang].y + langOffset[lang];
        genreOffset[genre] += w;
        langOffset[lang] += w;
        flowData.push({ genre, lang, count: f.count, y0, y1, w });
      });
    });

    // Draw flows
    const paths = flowsG.selectAll('.gl-flow').data(flowData, d => d.genre + '|' + d.lang);
    paths.exit().transition().duration(300).attr('opacity', 0).remove();

    const enter = paths.enter().append('path').attr('class', 'gl-flow')
      .attr('opacity', 0);

    enter.merge(paths)
      .attr('fill', d => glGenreColor(d.genre))
      .attr('stroke', 'none')
      .on('mousemove', function (event, d) {
        document.getElementById('gl-tt-title').textContent = `${d.genre} → ${glLangName(d.lang)}`;
        document.getElementById('gl-tt-count').textContent = d.count.toLocaleString();
        tt.style.left = (event.clientX + 16) + 'px';
        tt.style.top = (event.clientY - 20) + 'px';
        tt.classList.add('gl-show');
        flowsG.selectAll('.gl-flow').attr('opacity', f =>
          f.genre === d.genre && f.lang === d.lang ? 0.85 : 0.08
        );
      })
      .on('mouseleave', () => {
        tt.classList.remove('gl-show');
        flowsG.selectAll('.gl-flow').attr('opacity', 0.55);
      })
      .transition().duration(500)
      .attr('d', d => {
        const x0 = 0, x1 = W;
        const cpx = W * 0.45;
        return `M${x0},${d.y0}
                C${cpx},${d.y0} ${x1 - cpx},${d.y1} ${x1},${d.y1}
                L${x1},${d.y1 + d.w}
                C${x1 - cpx},${d.y1 + d.w} ${cpx},${d.y0 + d.w} ${x0},${d.y0 + d.w}
                Z`;
      })
      .attr('opacity', 0.55);

    // Left labels (genres)
    leftLabelsG.selectAll('*').remove();
    orderedGenres.forEach(genre => {
      const info = genreY[genre];
      if (!info) return;
      leftLabelsG.append('text')
        .attr('x', -12)
        .attr('y', info.y + info.h / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('fill', glGenreColor(genre))
        .style('font-weight', '500')
        .text(genre);
    });

    // Right labels (languages)
    rightLabelsG.selectAll('*').remove();
    orderedLangs.forEach(lang => {
      const info = langY[lang];
      if (!info) return;
      rightLabelsG.append('text')
        .attr('x', W + 12)
        .attr('y', info.y + info.h / 2)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .style('font-weight', '400')
        .text(glLangName(lang));
    });
  }

  refresh();
}

window.initGenreLanguage = initGenreLanguage;
