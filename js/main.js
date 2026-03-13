/**
 * Screens Through Time - Navigation Controller
 *
 * Architecture:
 *   Pages 0-1 (Title + Hub) live in a scroll-snap container.
 *   Pages 2-9 (visualizations) are fixed overlays toggled on/off.
 */

const scrollLanding = document.getElementById('scroll-landing');
const overlayPages = document.querySelectorAll('.overlay-page');
let activeOverlay = null;

/* ── Show an overlay viz page ── */
function goToPage(pageIndex) {
    if (pageIndex <= 1) {
        goToStoryHub();
        return;
    }

    const target = document.querySelector(`.overlay-page[data-page="${pageIndex}"]`);
    if (!target) return;

    if (activeOverlay && activeOverlay !== target) {
        activeOverlay.classList.remove('active');
    }

    target.classList.add('active');
    activeOverlay = target;
    initVisualization(pageIndex);
}

/* ── Return to hub (close any overlay, scroll to hub section) ── */
function goToStoryHub() {
    if (activeOverlay) {
        activeOverlay.classList.remove('active');
        activeOverlay = null;
    }
    const hubSection = document.querySelector('.snap-section[data-page="1"]');
    if (hubSection) {
        hubSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/* ── Draw hub connector lines when hub section is visible ── */
const hubObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !hubConnectorsDrawn) {
            drawHubConnectors();
            hubConnectorsDrawn = true;
        }
    });
}, { threshold: 0.4 });

let hubConnectorsDrawn = false;
const hubSection = document.querySelector('.snap-section[data-page="1"]');
if (hubSection) hubObserver.observe(hubSection);

/* ── Visualization init (lazy, once per page) ── */
const initializedViz = new Set();

function initVisualization(pageIndex) {
    if (initializedViz.has(pageIndex)) return;

    switch (pageIndex) {
        case 2:
            if (typeof initGenrePlayoffs === 'function') {
                initGenrePlayoffs();
                initializedViz.add(pageIndex);
            }
            break;
        case 4:
            d3.csv('data/netflix_titles.csv').then(function (data) {
                new LanguageRepresentation('viz-language', data);
                initializedViz.add(pageIndex);
            });
            break;
        case 5:
            if (typeof initGenreLanguage === 'function') {
                initGenreLanguage();
                initializedViz.add(pageIndex);
            }
            break;
        case 6:
            if (typeof initRevenueBudget === 'function') {
                initRevenueBudget();
                initializedViz.add(pageIndex);
            }
            break;
        case 7:
            initializedViz.add(pageIndex);
            break;
        case 8:
            if (typeof initCountryPlayoffs === 'function') {
                initCountryPlayoffs();
                initializedViz.add(pageIndex);
            }
            break;
        case 9:
            d3.csv('data/netflix_titles.csv').then(function (data) {
                new NetflixSeasons('viz-seasons', data);
                initializedViz.add(pageIndex);
            });
            break;
    }
}

/* ── Hub connector lines (SVG drawn from live card positions) ── */

function drawHubConnectors() {
    const arc = document.getElementById('hub-arc');
    const svg = document.getElementById('hub-connectors');
    if (!arc || !svg) return;

    const arcRect = arc.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${arcRect.width} ${arcRect.height}`);
    svg.innerHTML = '';

    const ids = ['hook', 'ri1', 'ri2', 'aha', 'res'];
    const nodes = {};
    ids.forEach(id => {
        nodes[id] = arc.querySelector(`[data-hub-id="${id}"]`);
    });

    function edgeOf(el, side) {
        const r = el.getBoundingClientRect();
        return {
            x: (side === 'right' ? r.right : r.left) - arcRect.left,
            y: (r.top + r.bottom) / 2 - arcRect.top
        };
    }

    const connections = [
        { from: edgeOf(nodes.hook, 'right'), to: edgeOf(nodes.ri1, 'left') },
        { from: edgeOf(nodes.hook, 'right'), to: edgeOf(nodes.ri2, 'left') },
        { from: edgeOf(nodes.ri1, 'right'),  to: edgeOf(nodes.aha, 'left') },
        { from: edgeOf(nodes.ri2, 'right'),  to: edgeOf(nodes.aha, 'left') },
        { from: edgeOf(nodes.aha, 'right'),  to: edgeOf(nodes.res, 'left') },
    ];

    const NS = 'http://www.w3.org/2000/svg';

    const defs = document.createElementNS(NS, 'defs');
    const marker = document.createElementNS(NS, 'marker');
    marker.setAttribute('id', 'hub-arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const mPath = document.createElementNS(NS, 'path');
    mPath.setAttribute('d', 'M 0 1 L 6 5 L 0 9');
    mPath.setAttribute('stroke', '#bbb');
    mPath.setAttribute('stroke-width', '1.5');
    mPath.setAttribute('fill', 'none');
    marker.appendChild(mPath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    connections.forEach(({ from, to }) => {
        const mx = (from.x + to.x) / 2;
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M${from.x},${from.y} C${mx},${from.y} ${mx},${to.y} ${to.x},${to.y}`);
        path.setAttribute('stroke', '#ccc');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#hub-arrow)');
        svg.appendChild(path);
    });
}

let hubResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(hubResizeTimer);
    hubResizeTimer = setTimeout(() => {
        if (hubConnectorsDrawn) drawHubConnectors();
    }, 150);
});

/* ── Pre-initialize heavy visualizations ── */
document.addEventListener('DOMContentLoaded', () => {
    initVisualization(2);
    initVisualization(6);
});
