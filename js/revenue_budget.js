/**
 * Revenue vs Budget — Arrow Chart
 * Vertical arrows from budget → revenue, animated, interactive
 * Budget range slider dynamically filters films and rescales Y axis
 */

// Styles 
function rbInjectStyles() {
  if (document.getElementById('rb-css')) return;
  const el = document.createElement('style');
  el.id = 'rb-css';
  el.textContent = `
    #viz-4 {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 24px 24px 16px !important;
      box-sizing: border-box;
    }

    /* ── Top controls row ── */
    #rb-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      margin-bottom: 12px;
      padding: 0 4px;
      width: 100%;
      box-sizing: border-box;
    }
    .rb-pill {
      padding: 5px 16px;
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
    .rb-pill:hover  { border-color: #c9a84c; color: #c9a84c; }
    .rb-pill.rb-active {
      background: #c9a84c;
      border-color: #c9a84c;
      color: #fff;
    }
    #rb-legend {
      margin-left: auto;
      display: flex;
      gap: 18px;
      align-items: center;
      font-size: 12px;
      color: #999;
    }
    .rb-leg { display: flex; align-items: center; gap: 5px; }

    /* ── Slider row ── */
    #rb-slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
      padding: 0 4px;
      width: 100%;
      box-sizing: border-box;
    }
    #rb-slider-label {
      font-size: 11px;
      color: #aaa;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
      flex-shrink: 0;
    }
    #rb-slider-wrap {
      position: relative;
      flex: 1;
      height: 28px;
      display: flex;
      align-items: center;
    }
    /* Track */
    #rb-slider-wrap::before {
      content: '';
      position: absolute;
      left: 0; right: 0;
      height: 3px;
      background: rgba(0,0,0,0.08);
      border-radius: 2px;
      pointer-events: none;
    }
    /* Active range highlight */
    #rb-slider-track {
      position: absolute;
      height: 3px;
      background: #c9a84c;
      border-radius: 2px;
      pointer-events: none;
    }
    /* Both range inputs stacked */
    #rb-slider-wrap input[type=range] {
      position: absolute;
      width: 100%;
      height: 3px;
      background: transparent;
      -webkit-appearance: none;
      appearance: none;
      pointer-events: none;
      margin: 0;
    }
    #rb-slider-wrap input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #c9a84c;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      pointer-events: all;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    #rb-slider-wrap input[type=range]::-webkit-slider-thumb:hover {
      transform: scale(1.25);
      box-shadow: 0 2px 8px rgba(201,168,76,0.4);
    }
    #rb-slider-wrap input[type=range]::-moz-range-thumb {
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #c9a84c;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      pointer-events: all;
      cursor: pointer;
    }
    #rb-range-display {
      font-size: 11px;
      color: #888;
      white-space: nowrap;
      flex-shrink: 0;
      min-width: 130px;
      text-align: right;
    }
    #rb-range-display span {
      color: #c9a84c;
      font-weight: 500;
    }

    /* ── Tooltip ── */
    #rb-tooltip {
      position: fixed;
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
      background: rgba(255,255,255,0.97);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 12px;
      padding: 14px 18px;
      min-width: 210px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.1);
      font-size: 12px;
      line-height: 1.6;
      transition: opacity 0.15s ease, transform 0.15s ease;
      transform: translateY(6px);
    }
    #rb-tooltip.rb-tt-show { opacity: 1; transform: translateY(0); }
    #rb-tooltip .rb-tt-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 16px; font-style: italic;
      margin-bottom: 2px; color: #222; line-height: 1.2;
    }
    #rb-tooltip .rb-tt-year {
      font-size: 10px; letter-spacing: 0.12em;
      color: #bbb; margin-bottom: 10px; text-transform: uppercase;
    }
    #rb-tooltip hr { border: none; border-top: 1px solid rgba(0,0,0,0.06); margin: 8px 0; }
    #rb-tooltip .rb-row { display: flex; justify-content: space-between; gap: 20px; }
    #rb-tooltip .rb-key { color: #bbb; font-size: 11px; }
    #rb-tooltip .rb-val { font-weight: 500; color: #333; }
    #rb-tooltip .rb-val.profit { color: #4a9e6b; }
    #rb-tooltip .rb-val.loss   { color: #c0504a; }
    #rb-tooltip .rb-roi { font-size: 10px; color: #ccc; text-align: right; margin-top: 5px; }

    .rb-film-group { cursor: default; }
  `;
  document.head.appendChild(el);
}

// Main entry point
function initRevenueBudget() {
  rbInjectStyles();
  d3.csv('data/movies/movies_metadata.csv')
    .then(rows => rbDraw(rbProcess(rows)))
    .catch(err => console.error('Failed to load movies_metadata.csv', err));
}

// Process CSV — return ALL valid films (slider will filter) 
function rbProcess(rows) {
  return rows
    .map(d => {
      const budget  = parseFloat(d.budget)  || 0;
      const revenue = parseFloat(d.revenue) || 0;
      const title   = (d.title || d.original_title || '').trim() || 'Unknown';
      const year    = (d.release_date || '').slice(0, 4) || '—';
      return { title, budget, revenue, year };
    })
    .filter(d => d.budget >= 10_000_000 && d.revenue > 0)
    .map(d => ({ ...d, isLoss: d.revenue < d.budget, roi: (d.revenue - d.budget) / d.budget * 100 }));
}

// Pick a representative sample from a filtered subset 
function rbSample(films, maxN = 20) {
  if (films.length <= maxN) return [...films].sort((a, b) => a.budget - b.budget);

  const losses  = films.filter(d =>  d.isLoss).sort((a, b) => b.budget - a.budget);
  const profits = films.filter(d => !d.isLoss).sort((a, b) => b.revenue - a.revenue);

  const nLoss   = Math.min(losses.length,  Math.round(maxN * 0.35));
  const nProfit = Math.min(profits.length, maxN - nLoss);

  const picked = [];

  // From profits: evenly spaced by revenue rank
  if (nProfit > 0) {
    const step = profits.length / nProfit;
    for (let i = 0; i < nProfit; i++) picked.push(profits[Math.floor(i * step)]);
  }
  // From losses: top by budget
  losses.slice(0, nLoss).forEach(d => picked.push(d));

  return [...new Map(picked.map(d => [d.title, d])).values()]
    .sort((a, b) => a.budget - b.budget);
}

// Format money
const rbFmt = v =>
  v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` :
  v >= 1e6 ? `$${(v / 1e6).toFixed(0)}M` : `$${(v/1e3).toFixed(0)}K`;

// Draw 
function rbDraw(allFilms) {
  const container = d3.select('#viz-4');
  container.html('');

  // Budget range across all films
  const globalMin = d3.min(allFilms, d => d.budget);
  const globalMax = d3.max(allFilms, d => d.budget);

  // Slider steps in $M
  const STEP = 5e6;
  let sliderLo = globalMin;
  let sliderHi = globalMax;
  let active    = 'all';

  // Top controls row
  const ctrlDiv = container.append('div').attr('id', 'rb-controls');

  const filters = [
    { id: 'all',    label: 'All Films'  },
    { id: 'profit', label: 'Profitable' },
    { id: 'loss',   label: 'Losses'     },
  ];

  filters.forEach(f => {
    ctrlDiv.append('button')
      .attr('class', 'rb-pill' + (f.id === 'all' ? ' rb-active' : ''))
      .text(f.label)
      .on('click', function () {
        ctrlDiv.selectAll('.rb-pill').classed('rb-active', false);
        d3.select(this).classed('rb-active', true);
        active = f.id;
        refresh(false);
      });
  });

  ctrlDiv.append('div').attr('id', 'rb-legend').html(`
    <div class="rb-leg">
      <span style="color:#4a9e6b;font-size:16px">↑</span><span>Profit</span>
    </div>
    <div class="rb-leg">
      <span style="color:#c0504a;font-size:16px">↓</span><span>Loss</span>
    </div>
  `);

  // Slider row 
  const sliderRow = container.append('div').attr('id', 'rb-slider-row');
  sliderRow.append('div').attr('id', 'rb-slider-label').text('Budget range');

  const sliderWrap = sliderRow.append('div').attr('id', 'rb-slider-wrap');
  sliderWrap.append('div').attr('id', 'rb-slider-track'); // gold highlight

  const inputLo = sliderWrap.append('input')
    .attr('type', 'range').attr('id', 'rb-input-lo')
    .attr('min', globalMin).attr('max', globalMax).attr('step', STEP)
    .attr('value', globalMin)
    .style('z-index', 3);

  const inputHi = sliderWrap.append('input')
    .attr('type', 'range').attr('id', 'rb-input-hi')
    .attr('min', globalMin).attr('max', globalMax).attr('step', STEP)
    .attr('value', globalMax)
    .style('z-index', 4);

  const rangeDisplay = sliderRow.append('div').attr('id', 'rb-range-display');

  function updateTrack() {
    const pctLo = (sliderLo - globalMin) / (globalMax - globalMin) * 100;
    const pctHi = (sliderHi - globalMin) / (globalMax - globalMin) * 100;
    document.getElementById('rb-slider-track').style.left  = pctLo + '%';
    document.getElementById('rb-slider-track').style.width = (pctHi - pctLo) + '%';
    rangeDisplay.html(`<span>${rbFmt(sliderLo)}</span> — <span>${rbFmt(sliderHi)}</span>`);
  }
  updateTrack();

  inputLo.on('input', function() {
    sliderLo = Math.min(+this.value, sliderHi - STEP);
    this.value = sliderLo;
    updateTrack();
    refresh(false);
  });
  inputHi.on('input', function() {
    sliderHi = Math.max(+this.value, sliderLo + STEP);
    this.value = sliderHi;
    updateTrack();
    refresh(false);
  });

  // SVG setup 
  const node   = document.getElementById('viz-4');
  const fullW  = (node.offsetWidth || node.clientWidth || 900) - 48;
  const fullH  = Math.max(500, Math.min(580, window.innerHeight * 0.52));
  const margin = { top: 20, right: 36, bottom: 130, left: 74 };
  const W      = fullW - margin.left - margin.right;
  const H      = fullH - margin.top  - margin.bottom;

  const svg = container.append('svg').attr('width', fullW).attr('height', fullH);

  // Defs
  const defs = svg.append('defs');

  const glowFilter = defs.append('filter').attr('id', 'rb-glow')
    .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
  glowFilter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur');
  const fm = glowFilter.append('feMerge');
  fm.append('feMergeNode').attr('in', 'blur');
  fm.append('feMergeNode').attr('in', 'SourceGraphic');

  ['profit','loss'].forEach(type => {
    const c = type === 'profit' ? '#4a9e6b' : '#c0504a';
    const id = `rb-grad-${type}`;
    const grad = defs.append('linearGradient').attr('id', id)
      .attr('x1','0').attr('x2','0')
      .attr('y1', type === 'profit' ? '0' : '1')
      .attr('y2', type === 'profit' ? '1' : '0');
    grad.append('stop').attr('offset','0%').attr('stop-color',c).attr('stop-opacity', 0.45);
    grad.append('stop').attr('offset','100%').attr('stop-color',c).attr('stop-opacity', 0.04);
  });

  ['profit','loss'].forEach(type => {
    const c = type === 'profit' ? '#4a9e6b' : '#c0504a';
    defs.append('marker')
      .attr('id', `rb-head-${type}`)
      .attr('viewBox','0 0 10 10').attr('refX',5).attr('refY',5)
      .attr('markerWidth',6).attr('markerHeight',6)
      .attr('orient','auto-start-reverse')
      .append('path').attr('d','M 0 1 L 5 5 L 0 9')
      .attr('stroke',c).attr('stroke-width',1.5)
      .attr('fill','none').attr('stroke-linecap','round');
  });

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Static Y label
  g.append('text')
    .attr('transform','rotate(-90)')
    .attr('x', -H/2).attr('y', -58)
    .attr('text-anchor','middle')
    .style('font-size','10px').style('letter-spacing','0.1em').style('fill','#aaa')
    .text('Amount (USD)');

  // Layers (appended in z-order, reused on refresh)
  const gridG    = g.append('g').attr('class', 'rb-grid-g');
  const yAxisG   = g.append('g').attr('class', 'rb-yaxis-g');
  const baseline = g.append('line')
    .attr('y1', H).attr('y2', H).attr('stroke','rgba(0,0,0,0.12)').attr('stroke-width',1);
  const filmsG   = g.append('g').attr('class', 'rb-films-g');

  // X axis label row (redrawn each time)
  const xLabelsG = g.append('g').attr('class', 'rb-xlabels-g');

  // Tooltip 
  const oldTT = document.getElementById('rb-tooltip');
  if (oldTT) oldTT.remove();
  const tt = document.createElement('div');
  tt.id = 'rb-tooltip';
  tt.innerHTML = `
    <div class="rb-tt-title" id="rb-tt-title"></div>
    <div class="rb-tt-year"  id="rb-tt-year"></div>
    <hr>
    <div class="rb-row"><span class="rb-key">Budget</span><span class="rb-val" id="rb-tt-budget"></span></div>
    <div class="rb-row"><span class="rb-key">Revenue</span><span class="rb-val" id="rb-tt-rev"></span></div>
    <div class="rb-row"><span class="rb-key">Net</span><span class="rb-val" id="rb-tt-net"></span></div>
    <div class="rb-roi" id="rb-tt-roi"></div>
  `;
  document.body.appendChild(tt);

  // Refresh: called on slider move or filter click
  let isFirstDraw = true;

  function refresh(animate) {
    // 1. Filter by slider range
    let visible = allFilms.filter(d => d.budget >= sliderLo && d.budget <= sliderHi);

    // 2. Apply profit/loss filter
    if (active === 'profit') visible = visible.filter(d => !d.isLoss);
    if (active === 'loss')   visible = visible.filter(d => d.isLoss);

    // 3. Sample to max 20 for readability
    const data = rbSample(visible, 20);

    if (data.length === 0) {
      filmsG.selectAll('*').remove();
      xLabelsG.selectAll('*').remove();
      gridG.selectAll('*').remove();
      yAxisG.selectAll('*').remove();
      baseline.attr('x1', 0).attr('x2', 0);
      return;
    }

    // 4. Scales
    const xScale = d3.scalePoint()
      .domain(data.map(d => d.title))
      .range([0, W]).padding(0.5);

    const yLo  = d3.min(data, d => Math.min(d.budget, d.revenue)) * 0.85;
    const yHi  = d3.max(data, d => Math.max(d.budget, d.revenue)) * 1.12;
    const yScale = d3.scaleLinear().domain([Math.max(0, yLo), yHi]).range([H, 0]);

    const dur = isFirstDraw ? 0 : 400; // no transition on very first paint (arrows handle their own)

    // 5. Grid
    gridG.selectAll('*').remove();
    gridG.attr('opacity', 0)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-W).tickFormat(''))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('line')
        .attr('stroke','rgba(0,0,0,0.06)')
        .attr('stroke-dasharray','3,4'))
      .transition().duration(500).attr('opacity', 1);

    // 6. Y axis
    yAxisG.selectAll('*').remove();
    yAxisG.attr('opacity', 0)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(4).tickFormat(rbFmt))
      .call(ax => ax.select('.domain').attr('stroke','rgba(0,0,0,0.12)'))
      .call(ax => ax.selectAll('text').style('font-size','11px').attr('dx','-4'))
      .transition().duration(500).attr('opacity', 1);

    // 7. Baseline
    baseline.attr('x1', 0).attr('x2', 0)
      .transition().duration(600).ease(d3.easeCubicOut).attr('x2', W);

    // 8. Films — full redraw
    filmsG.selectAll('*').remove();
    xLabelsG.selectAll('*').remove();

    const groups = filmsG.selectAll('.rb-film-group')
      .data(data, d => d.title)
      .enter().append('g').attr('class', 'rb-film-group');

    // Gradient rect
    groups.each(function(d, i) {
      const grp  = d3.select(this);
      const x    = xScale(d.title);
      const bw   = Math.max(10, xScale.step() * 0.22);
      const yTop = yScale(Math.max(d.budget, d.revenue));
      const yBot = yScale(Math.min(d.budget, d.revenue));
      const rh   = yBot - yTop;
      if (rh < 2) return;
      grp.append('rect')
        .attr('x', x - bw/2).attr('y', yBot).attr('width', bw).attr('height', 0)
        .attr('fill', d.isLoss ? 'url(#rb-grad-loss)' : 'url(#rb-grad-profit)').attr('rx', 2)
        .transition().duration(700).delay(350 + i*40).ease(d3.easeCubicOut)
        .attr('y', yTop).attr('height', rh);
    });

    // Budget dot
    groups.append('circle')
      .attr('cx', d => xScale(d.title)).attr('cy', d => yScale(d.budget))
      .attr('r', 0).attr('fill','#c9a84c')
      .attr('stroke','rgba(201,168,76,0.3)').attr('stroke-width', 6)
      .transition().duration(400).delay((_, i) => 300 + i*40)
      .ease(d3.easeBackOut.overshoot(2)).attr('r', 4);

    // Arrow
    groups.each(function(d, i) {
      const grp    = d3.select(this);
      const x      = xScale(d.title);
      const yStart = yScale(d.budget);
      const yEnd   = yScale(d.revenue);
      const len    = Math.abs(yEnd - yStart);
      if (len < 4) return;
      const color = d.isLoss ? '#c0504a' : '#4a9e6b';
      grp.append('line')
        .attr('class','rb-arrow-line')
        .attr('x1',x).attr('y1',yStart).attr('x2',x).attr('y2',yEnd)
        .attr('stroke', color).attr('stroke-width', 2).attr('stroke-linecap','round')
        .attr('marker-end', `url(#rb-head-${d.isLoss ? 'loss' : 'profit'})`)
        .attr('filter','url(#rb-glow)')
        .attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
        .transition().duration(700).delay(350 + i*40).ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    });

    // Film name labels (in separate group so they're always on top)
    xLabelsG.selectAll('text')
      .data(data).enter().append('text')
      .attr('x', d => xScale(d.title))
      .attr('y', H + 14)
      .attr('text-anchor','end')
      .attr('transform', d => `rotate(-42, ${xScale(d.title)}, ${H + 14})`)
      .style('font-size','10px').style('fill','#999').style('font-family','inherit')
      .attr('opacity', 0)
      .text(d => d.title.length > 22 ? d.title.slice(0, 21) + '…' : d.title)
      .transition().duration(400).delay((_, i) => 800 + i*25).attr('opacity', 1);

    // Hit areas
    groups.append('rect')
      .attr('x',      d => xScale(d.title) - 16)
      .attr('y',      d => Math.min(yScale(d.budget), yScale(d.revenue)) - 10)
      .attr('width',  32)
      .attr('height', d => Math.abs(yScale(d.budget) - yScale(d.revenue)) + 20)
      .attr('fill', 'transparent')
      .on('mousemove', function(event, d) {
        const currentOpacity = parseFloat(d3.select(this.parentNode).style('opacity'));
        if (currentOpacity < 0.5) return;

        const net   = d.revenue - d.budget;
        const isPro = net >= 0;
        document.getElementById('rb-tt-title').textContent  = d.title;
        document.getElementById('rb-tt-year').textContent   = d.year;
        document.getElementById('rb-tt-budget').textContent = rbFmt(d.budget);
        document.getElementById('rb-tt-rev').textContent    = rbFmt(d.revenue);
        const netEl = document.getElementById('rb-tt-net');
        netEl.textContent = (isPro ? '+' : '−') + rbFmt(Math.abs(net));
        netEl.className   = 'rb-val ' + (isPro ? 'profit' : 'loss');
        document.getElementById('rb-tt-roi').textContent =
          `ROI: ${d.roi >= 0 ? '+' : ''}${d.roi.toFixed(1)}%`;
        tt.style.left = (event.clientX + 20) + 'px';
        tt.style.top  = (event.clientY - 24) + 'px';
        tt.classList.add('rb-tt-show');
        groups.style('opacity', dd => dd.title === d.title ? 1 : 0.12);
        d3.select(this.parentNode).select('.rb-arrow-line').attr('stroke-width', 3);
      })
      .on('mouseleave', function() {
        tt.classList.remove('rb-tt-show');
        groups.style('opacity', 1);
        d3.select(this.parentNode).select('.rb-arrow-line').attr('stroke-width', 2);
      });

    isFirstDraw = false;
  }

  // Initial draw
  refresh(true);
}

window.initRevenueBudget = initRevenueBudget;
