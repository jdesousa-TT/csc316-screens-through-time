/**
 * Director Trading Cards Visualization
 * Displays top 10 Disney+ directors with their genre breakdown
 */

// Genre icons mapping (emoji fallbacks)
const genreIcons = {
    'Animation': '✏️',
    'Comedy': '😈',
    'Family': '👨‍👩‍👧',
    'Action-Adventure': '⚔️',
    'Documentary': '🎬',
    'Drama': '🎭',
    'Musical': '🎵',
    'Fantasy': '✨',
    'Science Fiction': '🚀',
    'Kids': '🧒',
    'Superhero': '🦸',
    'Romance': '💕',
    'Thriller': '😱',
    'Horror': '👻',
    'default': '🎞️'
};

// Genre colors for progress bars
const genreColors = {
    'Animation': '#E8943A',
    'Comedy': '#F0E150',
    'Family': '#E8943A',
    'Action-Adventure': '#E85A5A',
    'Documentary': '#5AA8E8',
    'Drama': '#9B5AE8',
    'Musical': '#E85AAD',
    'Fantasy': '#5AE8B8',
    'Science Fiction': '#5A7EE8',
    'Kids': '#7EE85A',
    'Superhero': '#E8515A',
    'Romance': '#E85AAD',
    'default': '#E8943A'
};

// Convert director name to a URL-friendly slug
// "Jack Hannah" → "jack-hannah"
function nameToSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '-');      // Replace spaces with hyphens
}

// Try loading an image with different formats
// Falls back to placeholder if none work
function tryLoadImage(container, slug, formats, index, altText) {
    if (index >= formats.length) {
        // All formats failed, show placeholder
        container.classed('photo-placeholder', true);
        return;
    }
    
    const photoPath = `photos/directors/${slug}.${formats[index]}`;
    
    const img = container.append('img')
        .attr('class', 'director-photo')
        .attr('alt', altText)
        .attr('src', photoPath)
        .on('error', function() {
            // This format failed, try next one
            d3.select(this).remove();
            tryLoadImage(container, slug, formats, index + 1, altText);
        });
}

// Initialize the trading cards visualization
function initTradingCards() {
    d3.csv('data/disney_plus_titles.csv').then(data => {
        // Process data to get director statistics
        const directorStats = processDirectorData(data);
        
        // Get top 10 directors
        const top10Directors = directorStats.slice(0, 10);
        
        // Log expected photo filenames for reference
        console.log('📸 Expected photo filenames (place in photos/directors/):');
        console.log('   Supported formats: .webp, .jpg, .jpeg, .png');
        top10Directors.forEach(d => {
            console.log(`   ${nameToSlug(d.name)}.[webp|jpg|png]  ←  "${d.name}"`);
        });
        
        // Clear placeholder
        const container = d3.select('#viz-1');
        container.html('');
        
        // Create cards container
        const cardsContainer = container.append('div')
            .attr('class', 'trading-cards-container');
        
        // Create a card for each director
        top10Directors.forEach((director, index) => {
            createTradingCard(cardsContainer, director, index);
        });
    }).catch(error => {
        console.error('Error loading data:', error);
        d3.select('#viz-1').html('<p class="placeholder-text">Error loading data</p>');
    });
}

// Process director data from CSV
function processDirectorData(data) {
    const directorMap = new Map();
    
    data.forEach(row => {
        if (!row.director || row.director.trim() === '') return;
        
        // Handle multiple directors per title
        const directors = row.director.split(',').map(d => d.trim());
        const genres = row.listed_in ? row.listed_in.split(',').map(g => g.trim()) : [];
        
        directors.forEach(director => {
            if (!director) return;
            
            if (!directorMap.has(director)) {
                directorMap.set(director, {
                    name: director,
                    totalTitles: 0,
                    genres: new Map()
                });
            }
            
            const dirData = directorMap.get(director);
            dirData.totalTitles++;
            
            // Count genres
            genres.forEach(genre => {
                if (!genre) return;
                const currentCount = dirData.genres.get(genre) || 0;
                dirData.genres.set(genre, currentCount + 1);
            });
        });
    });
    
    // Convert to array and sort by total titles
    const directorArray = Array.from(directorMap.values())
        .map(d => ({
            name: d.name,
            totalTitles: d.totalTitles,
            topGenres: Array.from(d.genres.entries())
                .map(([genre, count]) => ({ genre, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
        }))
        .sort((a, b) => b.totalTitles - a.totalTitles);
    
    return directorArray;
}

// Create a single trading card
function createTradingCard(container, director, index) {
    // Split name into first and last
    const nameParts = director.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    // Find max genre count for this director (for progress bar scaling)
    const maxGenreCount = director.topGenres.length > 0 
        ? Math.max(...director.topGenres.map(g => g.count))
        : 1;
    
    // Create card element
    const card = container.append('div')
        .attr('class', 'trading-card')
        .style('animation-delay', `${index * 0.1}s`);
    
    // Card inner container
    const cardInner = card.append('div')
        .attr('class', 'card-inner');
    
    // Header section
    const header = cardInner.append('div')
        .attr('class', 'card-header');
    
    // Name section
    const nameSection = header.append('div')
        .attr('class', 'card-name');
    
    nameSection.append('div')
        .attr('class', 'first-name')
        .text(firstName.toUpperCase());
    
    if (lastName) {
        nameSection.append('div')
            .attr('class', 'last-name')
            .text(lastName.toUpperCase());
    }
    
    // Total count badge (Movie Points)
    const badge = header.append('div')
        .attr('class', 'total-badge');
    
    badge.append('span')
        .attr('class', 'badge-label')
        .text('MP:');
    
    badge.append('span')
        .attr('class', 'badge-number')
        .text(director.totalTitles);
    
    // Divider
    cardInner.append('div')
        .attr('class', 'card-divider');
    
    // Photo section
    const photoSection = cardInner.append('div')
        .attr('class', 'photo-section');
    
    const photoContainer = photoSection.append('div')
        .attr('class', 'photo-container')
        .attr('data-director', director.name);
    
    // Try to load director photo from photos/directors/
    // Supports: .webp, .jpg, .jpeg, .png
    const slug = nameToSlug(director.name);
    const imageFormats = ['webp', 'jpg', 'jpeg', 'png'];
    
    tryLoadImage(photoContainer, slug, imageFormats, 0, director.name);
    
    // Genre bars section
    const genreSection = cardInner.append('div')
        .attr('class', 'genre-section');
    
    // Create genre bars (up to 3)
    director.topGenres.forEach(genreData => {
        createGenreBar(genreSection, genreData, maxGenreCount);
    });
    
    // If fewer than 3 genres, add empty placeholders
    for (let i = director.topGenres.length; i < 3; i++) {
        genreSection.append('div')
            .attr('class', 'genre-row empty');
    }
}

// Create a genre progress bar
function createGenreBar(container, genreData, maxCount) {
    const row = container.append('div')
        .attr('class', 'genre-row');
    
    // Icon
    const icon = genreIcons[genreData.genre] || genreIcons['default'];
    row.append('span')
        .attr('class', 'genre-icon')
        .text(icon);
    
    // Genre name
    row.append('span')
        .attr('class', 'genre-name')
        .text(genreData.genre.toUpperCase());
    
    // Progress bar container
    const progressContainer = row.append('div')
        .attr('class', 'progress-container');
    
    // Create 8 segments for the progress bar
    const totalSegments = 8;
    const filledSegments = Math.ceil((genreData.count / maxCount) * totalSegments);
    const color = genreColors[genreData.genre] || genreColors['default'];
    
    for (let i = 0; i < totalSegments; i++) {
        progressContainer.append('div')
            .attr('class', `progress-segment ${i < filledSegments ? 'filled' : ''}`)
            .style('background-color', i < filledSegments ? color : 'transparent');
    }
    
    // Count number
    row.append('span')
        .attr('class', 'genre-count')
        .text(genreData.count);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the trading cards page (page 1)
    // We'll call this when navigating to the page
});

// Export for use in main.js
window.initTradingCards = initTradingCards;

