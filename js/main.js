/**
 * Screens Through Time - Page Navigation & Story Controller
 *
 * Page order (storyboard):
 *   0  Title
 *   1  Genre Playoffs          (Hook)
 *   2  Director Trading Cards  (Hook pt 2 — filtered from playoffs)
 *   3  Language Representation  (Rising Insight 1)
 *   4  Genre–Language Alluvial  (Rising Insight 2)
 *   5  Revenue vs Budget        (Main Message)
 *   6  Streaming Map            (Resolution)
 *   7  Country Playoffs         (Appendix)
 *   8  Netflix Seasons          (Appendix)
 */

let currentPage = 0;
const pages = document.querySelectorAll('.page');
const totalPages = pages.length;

function updatePageIndicator() {
    const currentDisplay = document.querySelector('.current-page');
    const totalDisplay = document.querySelector('.total-pages');
    if (currentDisplay) currentDisplay.textContent = currentPage + 1;
    if (totalDisplay) totalDisplay.textContent = totalPages;
}

function goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= totalPages || pageIndex === currentPage) return;

    const currentPageEl = pages[currentPage];
    const nextPageEl = pages[pageIndex];
    const direction = pageIndex > currentPage ? 'right' : 'left';

    pages.forEach(page => {
        page.classList.remove('slide-out-left', 'slide-in-right', 'slide-out-right', 'slide-in-left');
    });

    if (direction === 'right') {
        currentPageEl.classList.add('slide-out-left');
        nextPageEl.classList.add('slide-in-right');
    } else {
        currentPageEl.classList.add('slide-out-right');
        nextPageEl.classList.add('slide-in-left');
    }

    setTimeout(() => {
        currentPageEl.classList.remove('active');
        nextPageEl.classList.add('active');
        currentPage = pageIndex;
        updatePageIndicator();
        initVisualization(currentPage);
    }, 600);
}

function nextPage() {
    if (currentPage < totalPages - 1) goToPage(currentPage + 1);
}

function prevPage() {
    if (currentPage > 0) goToPage(currentPage - 1);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextPage(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); }
});

const initializedViz = new Set();

function initVisualization(pageIndex) {
    if (initializedViz.has(pageIndex)) return;

    switch (pageIndex) {
        case 1:
            if (typeof initGenrePlayoffs === 'function') {
                initGenrePlayoffs();
                initializedViz.add(pageIndex);
            }
            break;
        case 2:
            if (typeof initTradingCards === 'function') {
                initTradingCards();
                initializedViz.add(pageIndex);
            }
            break;
        case 3:
            d3.csv('data/netflix_titles.csv').then(function (data) {
                new LanguageRepresentation('viz-language', data);
                initializedViz.add(pageIndex);
            });
            break;
        case 4:
            if (typeof initGenreLanguage === 'function') {
                initGenreLanguage();
                initializedViz.add(pageIndex);
            }
            break;
        case 5:
            if (typeof initRevenueBudget === 'function') {
                initRevenueBudget();
                initializedViz.add(pageIndex);
            }
            break;
        case 6:
            initializedViz.add(pageIndex);
            break;
        case 7:
            if (typeof initCountryPlayoffs === 'function') {
                initCountryPlayoffs();
                initializedViz.add(pageIndex);
            }
            break;
        case 8:
            d3.csv('data/netflix_titles.csv').then(function (data) {
                new NetflixSeasons('viz-seasons', data);
                initializedViz.add(pageIndex);
            });
            break;
    }
}

/**
 * Navigate to Director Cards page with an optional genre filter.
 * Called from genre_playoffs.js when the champion is clicked.
 */
function goToFilteredCards(genre) {
    window.selectedGenreFilter = genre || null;
    initializedViz.delete(2);
    goToPage(2);
}

document.addEventListener('DOMContentLoaded', () => {
    updatePageIndicator();
    if (pages.length > 0) pages[0].classList.add('active');

    initVisualization(1);
    initVisualization(2);
    initVisualization(5);
});
