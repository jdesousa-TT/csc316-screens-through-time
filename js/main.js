/**
 * Screens Through Time - Page Navigation & Story Controller
 */

// Current page state
let currentPage = 0;
const pages = document.querySelectorAll('.page');
const totalPages = pages.length;

// Update page indicator
function updatePageIndicator() {
    const currentDisplay = document.querySelector('.current-page');
    const totalDisplay = document.querySelector('.total-pages');
    
    if (currentDisplay) currentDisplay.textContent = currentPage + 1;
    if (totalDisplay) totalDisplay.textContent = totalPages;
}

// Navigate to a specific page
function goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= totalPages || pageIndex === currentPage) {
        return;
    }
    
    const currentPageEl = pages[currentPage];
    const nextPageEl = pages[pageIndex];
    const direction = pageIndex > currentPage ? 'right' : 'left';
    
    // Remove any existing animation classes
    pages.forEach(page => {
        page.classList.remove('slide-out-left', 'slide-in-right', 'slide-out-right', 'slide-in-left');
    });
    
    // Animate out current page
    if (direction === 'right') {
        currentPageEl.classList.add('slide-out-left');
        nextPageEl.classList.add('slide-in-right');
    } else {
        currentPageEl.classList.add('slide-out-right');
        nextPageEl.classList.add('slide-in-left');
    }
    
    // Update active states after animation
    setTimeout(() => {
        currentPageEl.classList.remove('active');
        nextPageEl.classList.add('active');
        currentPage = pageIndex;
        updatePageIndicator();
    }, 50);
}

// Navigate to next page
function nextPage() {
    if (currentPage < totalPages - 1) {
        goToPage(currentPage + 1);
    }
}

// Navigate to previous page
function prevPage() {
    if (currentPage > 0) {
        goToPage(currentPage - 1);
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextPage();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
    }
});

// Track which visualizations have been initialized
const initializedViz = new Set();

// Initialize visualizations for a page
function initVisualization(pageIndex) {
    if (initializedViz.has(pageIndex)) return;
    
    switch(pageIndex) {
        case 1:
            // Genre playoffs visualization
            if (typeof initGenrePlayoffs === 'function') {
                initGenrePlayoffs();
                initializedViz.add(pageIndex);
            }
            break;
        case 2:
            // Country playoffs visualization
            if (typeof initCountryPlayoffs === 'function') {
                initCountryPlayoffs();
                initializedViz.add(pageIndex);
            }
            break;
        case 3:
            // Trading cards visualization
            if (typeof initTradingCards === 'function') {
                initTradingCards();
                initializedViz.add(pageIndex);
            }
            break;
        case 4:
            // Revenue vs Budget arrow chart
            if (typeof initRevenueBudget === 'function') {
                initRevenueBudget();
                initializedViz.add(pageIndex);
            }
            break;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updatePageIndicator();
    
    // Ensure first page is active
    if (pages.length > 0) {
        pages[0].classList.add('active');
    }
    
    // Pre-initialize visualizations
    initVisualization(1);
    initVisualization(2);
    initVisualization(3);
    initVisualization(4);
});
