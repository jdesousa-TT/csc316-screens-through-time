/**
 * Genre Playoffs
 * Interactive bracket hook built from Netflix, Disney+, and Amazon Prime.
 */

const genrePlayoffPalette = {
    'Drama': '#d9897b',
    'Comedy': '#6fc4a7',
    'Action': '#e3a34f',
    'Kids & Family': '#f0cf6b',
    'Thriller': '#88b84b',
    'Documentary': '#8eb7d9',
    'Animation': '#eb7aa4',
    'Horror': '#6e7fd8'
};

function ensurePlayoffRuntimeStyles() {
    if (document.getElementById('playoff-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'playoff-runtime-styles';
    style.textContent = `
        .genre-playoffs-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .genre-playoffs-header.align-left {
            justify-content: flex-start;
        }

        .genre-playoffs-intro {
            text-align: left;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 0.9rem;
            flex-wrap: wrap;
            max-width: 820px;
        }

        .genre-playoffs-actions {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 0.6rem;
        }

        .genre-playoffs-actions.align-left {
            justify-content: flex-start;
        }

        .genre-playoffs-button {
            border: 1px solid rgba(26, 26, 26, 0.14);
            border-radius: 999px;
            background: #1a1a1a;
            color: white;
            padding: 0.6rem 1rem;
            font-size: 0.84rem;
            letter-spacing: 0.04em;
            cursor: pointer;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .genre-playoffs-button.secondary {
            background: transparent;
            color: var(--color-text);
        }

        .genre-playoffs-button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        .genre-pool {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: stretch;
        }

        .genre-pool-card {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.08rem;
            min-width: 116px;
            padding: 0.42rem 0.55rem;
            border: 2px solid rgba(26, 26, 26, 0.08);
            border-radius: 12px;
            box-shadow: 0 5px 14px rgba(26, 26, 26, 0.08);
            text-align: left;
            cursor: grab;
        }

        .genre-pool-card:active {
            cursor: grabbing;
        }

        .genre-playoffs-heading {
            font-family: var(--font-display);
            font-size: clamp(1.9rem, 3.8vw, 2.9rem);
            line-height: 0.95;
            margin: 0;
            white-space: nowrap;
        }

        .genre-playoffs-copy {
            margin: 0;
            color: var(--color-text-muted);
            font-size: 0.9rem;
        }

        .genre-playoffs-footnote {
            margin: 0;
            font-size: 0.82rem;
            color: var(--color-text-muted);
        }

        .genre-playoffs-shell {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
            height: 100%;
        }

        .genre-playoffs-bracket {
            position: relative;
            width: 100%;
            min-height: 380px;
            display: grid;
            grid-template-columns: 1.2fr 1fr 1.05fr 1fr 1.2fr;
            gap: 0.5rem;
            align-items: stretch;
        }

        .genre-playoffs-connectors {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 1;
        }

        .genre-playoffs-column {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
        }

        .slot-stack {
            display: flex;
            flex-direction: column;
            flex: 1;
        }

        .left-quarter,
        .right-quarter {
            justify-content: space-evenly;
            gap: 0.55rem;
        }

        .left-semi,
        .right-semi {
            justify-content: space-around;
            padding-top: 1.65rem;
            padding-bottom: 1.65rem;
            gap: 0.85rem;
        }

        .center-final {
            justify-content: center;
            gap: 0.75rem;
        }

        .genre-drop-slot,
        .genre-winner-slot {
            min-height: 54px;
            display: flex;
            align-items: stretch;
            justify-content: stretch;
        }

        .genre-drop-slot {
            border: 2px dashed rgba(26, 26, 26, 0.16);
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.35);
            transition: border-color 0.2s ease, background 0.2s ease;
        }

        .genre-drop-slot.filled {
            border-style: solid;
            background: transparent;
        }

        .genre-drop-slot.drag-over {
            border-color: var(--color-accent);
            background: rgba(196, 93, 58, 0.08);
        }

        .genre-slot-placeholder {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.55rem;
            font-size: 0.68rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--color-text-muted);
            text-align: center;
        }

        .genre-slot-placeholder.winner {
            border: 2px dashed rgba(26, 26, 26, 0.12);
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.28);
        }

        .genre-playoffs-round-label {
            font-size: 0.66rem;
            font-weight: 600;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--color-text-muted);
            margin-bottom: 0.4rem;
        }

        .genre-playoff-card {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.08rem;
            padding: 0.38rem 0.5rem 0.42rem;
            border-radius: 12px;
            border: 2px solid rgba(26, 26, 26, 0.08);
            color: var(--color-text);
            text-align: left;
            box-shadow: 0 6px 16px rgba(26, 26, 26, 0.08);
            cursor: pointer;
            transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
            width: 100%;
        }

        .genre-playoff-card:hover,
        .genre-playoff-card:focus-visible,
        .genre-playoff-card.is-active {
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(26, 26, 26, 0.14);
            border-color: rgba(26, 26, 26, 0.32);
            outline: none;
        }

        .genre-playoff-card-finalist {
            padding-top: 0.46rem;
            padding-bottom: 0.46rem;
        }

        .genre-playoff-card.interactive {
            cursor: grab;
        }

        .genre-playoff-name {
            font-family: var(--font-display);
            font-size: 1.12rem;
            line-height: 0.95;
        }

        .genre-playoff-count {
            font-size: 0.78rem;
            font-weight: 700;
        }

        .genre-playoff-meta {
            font-size: 0.66rem;
            color: rgba(26, 26, 26, 0.68);
            letter-spacing: 0.03em;
        }

        .genre-playoff-hint {
            font-size: 0.62rem;
            color: rgba(26, 26, 26, 0.68);
            letter-spacing: 0.03em;
        }

        .revealed {
            animation: playoffReveal 0.55s ease both;
        }

        .genre-playoff-connector {
            fill: none;
            stroke: rgba(26, 26, 26, 0.45);
            stroke-width: 2;
            stroke-linejoin: round;
        }

        .genre-playoffs-callout {
            position: relative;
            align-self: center;
            margin-top: 0.9rem;
            width: min(320px, 92%);
            padding: 0.8rem 0.95rem;
            border-radius: 18px;
            background: rgba(26, 26, 26, 0.96);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(6px);
            text-align: center;
        }

        .genre-playoffs-callout-label {
            display: inline-block;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.62);
            margin-bottom: 0.28rem;
        }

        .genre-playoffs-callout-winner {
            font-family: var(--font-display);
            font-size: 2rem;
            line-height: 0.95;
            color: white;
            margin-bottom: 0.35rem;
        }

        .genre-playoffs-callout-copy {
            margin: 0;
            font-size: 0.76rem;
            color: rgba(255, 255, 255, 0.78);
        }

        .genre-playoffs-callout-btn {
            margin-top: 0.6rem;
            padding: 0.45rem 1.1rem;
            border: 1.5px solid rgba(255,255,255,0.35);
            border-radius: 100px;
            background: transparent;
            color: white;
            font-family: var(--font-body);
            font-size: 0.72rem;
            font-weight: 500;
            letter-spacing: 0.06em;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
        }
        .genre-playoffs-callout-btn:hover {
            background: rgba(255,255,255,0.15);
            border-color: rgba(255,255,255,0.6);
        }

        .genre-playoff-tooltip {
            position: absolute;
            max-width: 260px;
            padding: 0.8rem 0.9rem;
            border-radius: 14px;
            background: rgba(26, 26, 26, 0.95);
            color: white;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
            transition: opacity 0.15s ease;
        }

        .genre-tooltip-title {
            font-family: var(--font-display);
            font-size: 1.25rem;
            line-height: 1;
            margin-bottom: 0.35rem;
        }

        .genre-tooltip-countries {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
            margin-top: 0.45rem;
        }

        .genre-tooltip-pill {
            padding: 0.25rem 0.5rem;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.12);
            font-size: 0.72rem;
            font-weight: 600;
        }

        .genre-fly-card {
            position: fixed;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            gap: 0.08rem;
            padding: 0.38rem 0.5rem 0.42rem;
            border-radius: 12px;
            border: 2px solid rgba(26, 26, 26, 0.08);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.14);
            color: var(--color-text);
            pointer-events: none;
            z-index: 1200;
            transform: translate(0, 0);
            transition: transform 0.44s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
        }

        .genre-fly-card.is-moving {
            opacity: 0.9;
        }

        .genre-fly-name {
            font-family: var(--font-display);
            font-size: 1.12rem;
            line-height: 0.95;
        }

        .genre-fly-meta {
            font-size: 0.66rem;
            color: rgba(26, 26, 26, 0.68);
            letter-spacing: 0.03em;
        }

        @keyframes playoffReveal {
            from {
                opacity: 0;
                transform: scale(0.96);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        /* Director popup overlay */
        .genre-director-backdrop {
            position: fixed;
            inset: 0;
            z-index: 2000;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            overflow-y: auto;
            padding: 1rem;
            transition: opacity 0.25s ease;
            backdrop-filter: blur(4px);
        }
        .genre-director-backdrop.visible { opacity: 1; }

        .genre-director-popup {
            position: relative;
            background: var(--color-bg);
            border-radius: 24px;
            padding: 1.8rem 2rem 1.6rem;
            max-width: 1160px;
            width: 96vw;
            max-height: 96vh;
            overflow-y: auto;
            box-shadow: 0 28px 56px rgba(0,0,0,0.25);
            transform: translateY(16px) scale(0.96);
            transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .genre-director-backdrop.visible .genre-director-popup {
            transform: translateY(0) scale(1);
        }

        .genre-director-close {
            position: absolute;
            top: 16px; right: 20px;
            background: none;
            border: none;
            font-size: 1.8rem;
            line-height: 1;
            color: #aaa;
            cursor: pointer;
            transition: color 0.15s;
            z-index: 1;
        }
        .genre-director-close:hover { color: #333; }

        .genre-director-header {
            text-align: center;
            margin-bottom: 1.4rem;
        }
        .genre-director-genre {
            font-family: var(--font-display);
            font-size: 2.2rem;
            font-weight: 500;
            line-height: 1;
            margin-bottom: 0.3rem;
        }
        .genre-director-sub {
            font-size: 0.85rem;
            color: var(--color-text-muted);
        }
        .genre-director-cards {
            display: flex;
            flex-wrap: nowrap;
            justify-content: center;
            gap: var(--space-md);
            padding: var(--space-sm) 0;
        }
        .genre-director-cards .trading-card {
            opacity: 1;
            transform: none;
            animation: none;
            width: 0;
            flex: 1 1 0;
            min-width: 0;
            max-width: 340px;
        }
        .genre-director-empty {
            text-align: center;
            color: #999;
            font-size: 0.9rem;
            padding: 2rem 0;
        }

        .genre-playoffs-click-tip {
            text-align: center;
            font-size: 0.8rem;
            color: var(--color-text-muted);
            margin: 0.6rem 0 0;
            letter-spacing: 0.03em;
            opacity: 0;
            animation: playoffReveal 0.5s ease 0.3s forwards;
        }

        @media (max-width: 768px) {
            .genre-playoffs-intro {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .genre-playoffs-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .genre-playoffs-actions {
                align-items: flex-start;
                justify-content: flex-start;
            }

            .genre-playoffs-bracket {
                grid-template-columns: 1fr;
                min-height: auto;
            }

            .left-quarter,
            .right-quarter,
            .left-semi,
            .right-semi,
            .center-final {
                padding: 0;
                gap: 0.75rem;
            }

            .genre-playoffs-callout {
                width: 100%;
                margin-top: 0.75rem;
            }

            .genre-playoffs-connectors {
                display: none;
            }

            .genre-director-popup {
                padding: 1.2rem 0.8rem;
            }
            .genre-director-cards {
                gap: var(--space-sm);
            }
            .genre-director-cards .trading-card .first-name { font-size: 1.4rem; }
            .genre-director-cards .trading-card .last-name  { font-size: 1rem; }
            .genre-director-cards .trading-card .total-badge { width: 44px; height: 44px; }
            .genre-director-cards .trading-card .badge-number { font-size: 1.1rem; }
            .genre-director-cards .trading-card .photo-container { width: 100px; height: 130px; }
            .genre-director-cards .trading-card .progress-container { display: none; }
            .genre-director-cards .trading-card .genre-name { width: auto; }
        }
    `;

    document.head.appendChild(style);
}

const genrePlayoffStructure = {
    quarterfinals: [
        { id: 'qf-1', side: 'left', pair: 1 },
        { id: 'qf-2', side: 'left', pair: 1 },
        { id: 'qf-3', side: 'left', pair: 2 },
        { id: 'qf-4', side: 'left', pair: 2 },
        { id: 'qf-5', side: 'right', pair: 3 },
        { id: 'qf-6', side: 'right', pair: 3 },
        { id: 'qf-7', side: 'right', pair: 4 },
        { id: 'qf-8', side: 'right', pair: 4 }
    ],
    semifinals: [
        { id: 'sf-1', side: 'left', source: ['qf-1', 'qf-2'] },
        { id: 'sf-2', side: 'left', source: ['qf-3', 'qf-4'] },
        { id: 'sf-3', side: 'right', source: ['qf-5', 'qf-6'] },
        { id: 'sf-4', side: 'right', source: ['qf-7', 'qf-8'] }
    ],
    finals: [
        { id: 'f-1', source: ['sf-1', 'sf-2'] },
        { id: 'f-2', source: ['sf-3', 'sf-4'] }
    ]
};

// Language labels for ISO codes
const LANG_LABELS = {
    en:'English', fr:'French', es:'Spanish', ja:'Japanese', ko:'Korean',
    de:'German', hi:'Hindi', zh:'Chinese', it:'Italian', ru:'Russian',
    pt:'Portuguese', cn:'Chinese', ta:'Tamil', te:'Telugu', tr:'Turkish',
    sv:'Swedish', da:'Danish', nl:'Dutch', th:'Thai', ar:'Arabic',
};
function langLabel(code) { return LANG_LABELS[code] || code.toUpperCase(); }

function parseMetadataGenres(raw) {
    if (!raw || raw.length < 3) return [];
    try {
        return JSON.parse(raw.replace(/'/g, '"')).map(g => g.name).filter(Boolean);
    } catch { return []; }
}

function buildLanguagesByGenre(metadataRows) {
    const map = new Map();
    metadataRows.forEach(row => {
        const lang = (row.original_language || '').trim();
        if (!lang) return;
        const genres = parseMetadataGenres(row.genres);
        genres.forEach(g => {
            if (!map.has(g)) map.set(g, new Map());
            const lm = map.get(g);
            lm.set(lang, (lm.get(lang) || 0) + 1);
        });
    });
    return map;
}

function buildDirectorsByGenre(rows) {
    const dirMap = new Map();

    rows.forEach(row => {
        if (!row.director || !row.director.trim()) return;
        const directors = row.director.split(',').map(d => d.trim()).filter(Boolean);
        const rawGenres = row.listed_in ? row.listed_in.split(',').map(g => g.trim()) : [];
        const normGenres = getNormalizedGenres(row.listed_in);

        directors.forEach(dir => {
            if (!dirMap.has(dir)) dirMap.set(dir, { name: dir, totalTitles: 0, rawGenres: new Map(), normGenres: new Map() });
            const d = dirMap.get(dir);
            d.totalTitles++;
            rawGenres.forEach(g => d.rawGenres.set(g, (d.rawGenres.get(g) || 0) + 1));
            normGenres.forEach(g => d.normGenres.set(g, (d.normGenres.get(g) || 0) + 1));
        });
    });

    const fullProfiles = new Map();
    dirMap.forEach((d, name) => {
        fullProfiles.set(name, {
            name: d.name,
            totalTitles: d.totalTitles,
            topGenres: [...d.rawGenres.entries()]
                .map(([genre, count]) => ({ genre, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
        });
    });

    const byGenre = new Map();
    dirMap.forEach((d, name) => {
        d.normGenres.forEach((count, genre) => {
            if (!byGenre.has(genre)) byGenre.set(genre, []);
            byGenre.get(genre).push({ name, genreCount: count });
        });
    });

    const result = new Map();
    byGenre.forEach((directors, genre) => {
        result.set(genre, directors
            .sort((a, b) => b.genreCount - a.genreCount)
            .slice(0, 3)
            .map(d => fullProfiles.get(d.name)));
    });
    return result;
}

function initGenrePlayoffs() {
    const container = d3.select('#viz-1');

    if (container.empty()) return;
    ensurePlayoffRuntimeStyles();

    Promise.all([
        d3.csv('data/netflix_titles.csv'),
        d3.csv('data/disney_plus_titles.csv'),
        d3.csv('data/amazon_prime_titles.csv'),
        d3.csv('data/movies/movies_metadata.csv')
    ]).then(([netflixTitles, disneyTitles, amazonTitles, metadata]) => {
        const langByGenre = buildLanguagesByGenre(metadata);
        const allTitles = [...netflixTitles, ...disneyTitles, ...amazonTitles];
        const stats = buildGenrePlayoffData(allTitles, langByGenre);
        const dirsByGenre = buildDirectorsByGenre(allTitles);
        renderGenrePlayoffs(container, stats, dirsByGenre);
    }).catch(error => {
        console.error('Error loading genre playoff data:', error);
        container.html('<p class="placeholder-text">Error loading genre playoffs</p>');
    });
}

function buildGenrePlayoffData(rows, langByGenre) {
    const counts = new Map();
    const countriesByGenre = new Map();

    rows.forEach(row => {
        const genres = getNormalizedGenres(row.listed_in);
        const countries = (row.country || '')
            .split(',')
            .map(country => country.trim())
            .filter(Boolean);

        genres.forEach(genre => {
            counts.set(genre, (counts.get(genre) || 0) + 1);

            if (!countriesByGenre.has(genre)) {
                countriesByGenre.set(genre, new Map());
            }

            const genreCountries = countriesByGenre.get(genre);
            countries.forEach(country => {
                genreCountries.set(country, (genreCountries.get(country) || 0) + 1);
            });
        });
    });

    const selectedGenres = [
        'Drama',
        'Comedy',
        'Action',
        'Kids & Family',
        'Thriller',
        'Documentary',
        'Animation',
        'Horror'
    ];

    const seededGenres = selectedGenres
        .map(genre => {
            const summary = createGenreSummary(genre, counts.get(genre) || 0, countriesByGenre.get(genre) || new Map());
            const lm = langByGenre ? langByGenre.get(genre) : null;
            summary.topLanguages = lm
                ? [...lm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([code, n]) => ({ code, label: langLabel(code), count: n }))
                : [];
            return summary;
        })
        .sort((a, b) => b.count - a.count)
        .map((genre, index) => ({
            ...genre,
            seed: index + 1
        }));

    return {
        genres: seededGenres,
        byName: new Map(seededGenres.map(genre => [genre.genre, genre]))
    };
}

function getNormalizedGenres(listedIn) {
    const ignoredGenres = new Set([
        'Arts',
        'Entertainment',
        'and Culture',
        'Special Interest',
        'TV Shows',
        'International',
        'International Movies',
        'International TV Shows',
        'Independent Movies'
    ]);

    const mapping = {
        'Action-Adventure': 'Action',
        'Action & Adventure': 'Action',
        'Adventure': 'Action',
        'Suspense': 'Thriller',
        'Thrillers': 'Thriller',
        'Science Fiction': 'Sci-Fi',
        'Sci-Fi & Fantasy': 'Sci-Fi',
        'Kids': 'Kids & Family',
        'Family': 'Kids & Family',
        'Children & Family Movies': 'Kids & Family',
        'Dramas': 'Drama',
        'TV Dramas': 'Drama',
        'Comedies': 'Comedy',
        'Documentaries': 'Documentary',
        'Romantic Movies': 'Romance',
        'Horror Movies': 'Horror',
        'Anime Features': 'Animation',
        'Anime Series': 'Animation'
    };

    return (listedIn || '')
        .split(',')
        .map(genre => genre.trim())
        .filter(Boolean)
        .map(genre => mapping[genre] || genre)
        .filter(genre => !genre.includes('TV'))
        .filter(genre => !genre.includes('Movies') || genre === 'Romance')
        .filter(genre => !ignoredGenres.has(genre));
}

function createGenreSummary(genre, count, countryMap) {
    const topCountries = Array.from(countryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([country, titles]) => ({ country, titles }));

    return {
        genre,
        count,
        color: genrePlayoffPalette[genre] || '#d6cec2',
        topCountries,
        countrySpread: countryMap.size
    };
}

function pickWinner(first, second) {
    return first.count >= second.count ? first : second;
}

function renderGenrePlayoffs(container, stats, dirsByGenre) {
    container.html('');

    const state = {
        assignments: new Map(),
        winners: {
            semifinals: new Map(),
            finals: new Map(),
            champion: null
        },
        justRevealed: new Set(),
        draggingGenre: null,
        revealing: false,
        randomizing: false
    };

    const shell = container.append('div')
        .attr('class', 'genre-playoffs-shell');

    const header = shell.append('div')
        .attr('class', 'genre-playoffs-header align-left');

    const intro = header.append('div')
        .attr('class', 'genre-playoffs-intro');

    const actions = header.append('div')
        .attr('class', 'genre-playoffs-actions align-left');

    const revealButton = actions.append('button')
        .attr('type', 'button')
        .attr('class', 'genre-playoffs-button')
        .property('disabled', true)
        .text('Reveal Winners');

    const randomizeButton = actions.append('button')
        .attr('type', 'button')
        .attr('class', 'genre-playoffs-button secondary')
        .text('Randomize Bracket');

    const resetButton = actions.append('button')
        .attr('type', 'button')
        .attr('class', 'genre-playoffs-button secondary')
        .text('Reset');

    actions.append('p')
        .attr('class', 'genre-playoffs-footnote')
        .text('Hover for stats · Drag to fill bracket');

    const pool = shell.append('div')
        .attr('class', 'genre-pool');

    const board = shell.append('div')
        .attr('class', 'genre-playoffs-bracket interactive');

    const connectorLayer = board.append('svg')
        .attr('class', 'genre-playoffs-connectors');

    const tooltip = d3.select('body')
        .selectAll('.genre-playoff-tooltip')
        .data([null])
        .join('div')
        .attr('class', 'genre-playoff-tooltip')
        .style('opacity', 0);

    const columns = [
        { key: 'left-quarter', label: 'Quarterfinals', slots: genrePlayoffStructure.quarterfinals.filter(slot => slot.side === 'left') },
        { key: 'left-semi', label: 'Semifinals', slots: genrePlayoffStructure.semifinals.filter(slot => slot.side === 'left') },
        { key: 'center-final', label: 'Final', slots: genrePlayoffStructure.finals },
        { key: 'right-semi', label: 'Semifinals', slots: genrePlayoffStructure.semifinals.filter(slot => slot.side === 'right') },
        { key: 'right-quarter', label: 'Quarterfinals', slots: genrePlayoffStructure.quarterfinals.filter(slot => slot.side === 'right') }
    ];

    const columnSelection = board.selectAll('.genre-playoffs-column')
        .data(columns)
        .enter()
        .append('div')
        .attr('class', d => `genre-playoffs-column ${d.key}`);

    columnSelection.append('div')
        .attr('class', 'genre-playoffs-round-label')
        .text(d => d.label);

    columnSelection.each(function(column) {
        d3.select(this).append('div')
            .attr('class', `slot-stack ${column.key}`);
    });

    revealButton.on('click', async () => {
        if (state.revealing || state.randomizing || !isBracketReady(state)) return;
        state.revealing = true;
        revealButton.property('disabled', true).text('Revealing...');
        resetWinners(state);
        renderBoard();
        await revealRound('semifinals');
        await revealRound('finals');
        await revealChampion();
        state.revealing = false;
        revealButton.property('disabled', false).text('Replay Reveal');
        renderBoard();
    });

    randomizeButton.on('click', async () => {
        if (state.revealing || state.randomizing) return;

        state.randomizing = true;
        state.assignments.clear();
        resetWinners(state);
        revealButton.text('Reveal Winners');
        renderBoard();
        syncControls();

        const assignmentEntries = shuffleArray(stats.genres.map(genre => genre.genre))
            .map((genreName, index) => [genrePlayoffStructure.quarterfinals[index].id, genreName]);

        await animateAssignmentsIntoSlots(assignmentEntries);

        state.randomizing = false;
        renderBoard();
    });

    resetButton.on('click', () => {
        state.assignments.clear();
        state.draggingGenre = null;
        state.revealing = false;
        state.randomizing = false;
        resetWinners(state);
        renderPool();
        renderBoard();
        revealButton.text('Reveal Winners');
        syncControls();
    });

    function renderPool() {
        const assignedGenres = new Set(state.assignments.values());
        const available = stats.genres.filter(genre => !assignedGenres.has(genre.genre));

        const cards = pool.selectAll('.genre-pool-card')
            .data(available, d => d.genre);

        cards.exit().remove();

        const entered = cards.enter()
            .append('button')
            .attr('type', 'button')
            .attr('class', 'genre-pool-card');

        const merged = entered.merge(cards)
            .attr('data-genre', d => d.genre)
            .attr('draggable', state.revealing ? null : true)
            .style('background-color', d => d.color)
            .on('dragstart', (event, d) => {
                if (state.revealing || state.randomizing) {
                    event.preventDefault();
                    return;
                }
                state.draggingGenre = d.genre;
                event.dataTransfer.setData('text/plain', d.genre);
            })
            .on('dragend', () => {
                state.draggingGenre = null;
            })
            .on('mouseenter', (event, d) => showTooltip(event, d))
            .on('mousemove', moveTooltip)
            .on('mouseleave', hideTooltip)
            .on('focus', (event, d) => showTooltip(event, d))
            .on('blur', hideTooltip)
            .on('click', (event, d) => {
                if (event.defaultPrevented) return;
                showDirectorPopup(d, dirsByGenre);
            });

        merged.html('');
        merged.append('span')
            .attr('class', 'genre-playoff-name')
            .text(d => d.genre);
        merged.append('span')
            .attr('class', 'genre-playoff-meta')
            .text(d => `${d.countrySpread} countries`);
    }

    function renderBoard() {
        renderQuarterfinals();
        renderWinners('left-semi', genrePlayoffStructure.semifinals.filter(slot => slot.side === 'left'), state.winners.semifinals);
        renderWinners('right-semi', genrePlayoffStructure.semifinals.filter(slot => slot.side === 'right'), state.winners.semifinals);
        renderWinners('center-final', genrePlayoffStructure.finals, state.winners.finals);
        renderChampionCallout();
        renderPool();
        syncControls();
        requestAnimationFrame(drawConnectors);

        shell.selectAll('.genre-playoffs-click-tip').remove();
        if (state.winners.champion) {
            shell.append('p')
                .attr('class', 'genre-playoffs-click-tip')
                .text('Click any genre to see their top directors');
        }
    }

    function renderQuarterfinals() {
        ['left-quarter', 'right-quarter'].forEach(columnKey => {
            const slots = genrePlayoffStructure.quarterfinals.filter(slot => slot.side === (columnKey === 'left-quarter' ? 'left' : 'right'));
            const stack = board.select(`.${columnKey}.slot-stack`);

            const slotSelection = stack.selectAll('.genre-drop-slot')
                .data(slots, d => d.id);

            slotSelection.exit().remove();

            const entered = slotSelection.enter()
                .append('div')
                .attr('class', 'genre-drop-slot');

            const merged = entered.merge(slotSelection)
                .attr('data-slot-id', d => d.id)
                .classed('filled', d => state.assignments.has(d.id))
                .classed('drag-over', false)
                .on('dragover', function(event) {
                    if (state.revealing || state.randomizing) return;
                    event.preventDefault();
                    d3.select(this).classed('drag-over', true);
                })
                .on('dragleave', function() {
                    d3.select(this).classed('drag-over', false);
                })
                .on('drop', function(event, slot) {
                    if (state.revealing || state.randomizing) return;
                    event.preventDefault();
                    d3.select(this).classed('drag-over', false);
                    const genreName = event.dataTransfer.getData('text/plain') || state.draggingGenre;
                    assignGenreToSlot(genreName, slot.id);
                });

            merged.html('');

            merged.each(function(slot) {
                const slotNode = d3.select(this);
                const genreName = state.assignments.get(slot.id);

                if (!genreName) {
                    slotNode.append('div')
                        .attr('class', 'genre-slot-placeholder')
                        .text(`Drop genre ${slot.id.replace('qf-', '')}`);
                    return;
                }

                const genre = stats.byName.get(genreName);
                renderGenreCard(slotNode, genre, 'genre-playoff-card interactive', true, false);
            });
        });
    }

    function renderWinners(columnKey, slots, winnerMap) {
        const stack = board.select(`.${columnKey}.slot-stack`);
        const slotSelection = stack.selectAll('.genre-winner-slot')
            .data(slots, d => d.id);

        slotSelection.exit().remove();

        const entered = slotSelection.enter()
            .append('div')
            .attr('class', 'genre-winner-slot');

        const merged = entered.merge(slotSelection)
            .attr('data-slot-id', d => d.id);

        merged.html('');

        merged.each(function(slot) {
            const slotNode = d3.select(this);
            const winnerName = winnerMap.get(slot.id);

            if (!winnerName) {
                slotNode.append('div')
                    .attr('class', 'genre-slot-placeholder winner')
                    .text(columnKey === 'center-final' ? 'Winner reveals here' : 'Winner reveals next');
                return;
            }

            const genre = stats.byName.get(winnerName);
            const revealClass = state.justRevealed.has(slot.id) ? ' revealed' : '';
            renderGenreCard(slotNode, genre, `genre-playoff-card genre-playoff-card-finalist${revealClass}`, false, true);
        });
    }

    function renderChampionCallout() {
        board.select('.center-final.slot-stack').selectAll('.genre-playoffs-callout').remove();
        if (!state.winners.champion) return;

        const champion = stats.byName.get(state.winners.champion);
        const callout = board.select('.center-final.slot-stack')
            .append('div')
            .attr('class', `genre-playoffs-callout${state.justRevealed.has('champion') ? ' revealed' : ''}`);

        callout.append('span')
            .attr('class', 'genre-playoffs-callout-label')
            .text('Overall Winner');

        callout.append('div')
            .attr('class', 'genre-playoffs-callout-winner')
            .text(champion.genre);

        callout.append('p')
            .attr('class', 'genre-playoffs-callout-copy')
            .text(`${d3.format(',')(champion.count)} titles across ${champion.countrySpread} countries`);

        if (champion.topLanguages && champion.topLanguages.length) {
            callout.append('p')
                .attr('class', 'genre-playoffs-callout-copy')
                .style('margin-top', '4px')
                .style('font-size', '0.7rem')
                .html('Top languages: ' + champion.topLanguages.map(l => `<strong>${l.label}</strong>`).join(', '));
        }

        callout.append('button')
            .attr('class', 'genre-playoffs-callout-btn')
            .text(`Top ${champion.genre} Directors →`)
            .on('click', () => showDirectorPopup(champion, dirsByGenre));
    }

    function renderGenreCard(parent, genre, className, removable, showCount) {
        const card = parent.append('button')
            .attr('type', 'button')
            .attr('class', className)
            .attr('data-genre', genre.genre)
            .style('background-color', genre.color)
            .on('mouseenter', (event) => showTooltip(event, genre))
            .on('mousemove', moveTooltip)
            .on('mouseleave', hideTooltip)
            .on('focus', (event) => showTooltip(event, genre))
            .on('blur', hideTooltip)
            .on('click', (event) => {
                if (event.defaultPrevented) return;
                showDirectorPopup(genre, dirsByGenre);
            });

        if (removable && !state.revealing) {
            card.attr('draggable', true)
                .on('dragstart', (event) => {
                    if (state.randomizing) {
                        event.preventDefault();
                        return;
                    }
                    state.draggingGenre = genre.genre;
                    event.dataTransfer.setData('text/plain', genre.genre);
                })
                .on('dragend', () => {
                    state.draggingGenre = null;
                });
        }

        card.append('span')
            .attr('class', 'genre-playoff-name')
            .text(genre.genre);

        card.append('span')
            .attr('class', showCount ? 'genre-playoff-count' : 'genre-playoff-meta')
            .text(showCount ? d3.format(',')(genre.count) : `${genre.countrySpread} countries`);

        if (removable && !state.revealing) {
            card.append('span')
                .attr('class', 'genre-playoff-hint')
                .text('Drag to move');
        }
    }

    function assignGenreToSlot(genreName, slotId) {
        if (!genreName || !stats.byName.has(genreName)) return;

        resetWinners(state);

        let previousSlot = null;
        state.assignments.forEach((assignedGenre, assignedSlotId) => {
            if (assignedGenre === genreName) previousSlot = assignedSlotId;
        });

        const displacedGenre = state.assignments.get(slotId);

        if (previousSlot) {
            state.assignments.delete(previousSlot);
        }

        state.assignments.set(slotId, genreName);

        if (displacedGenre && previousSlot && displacedGenre !== genreName) {
            state.assignments.set(previousSlot, displacedGenre);
        }

        renderBoard();
    }

    function syncControls() {
        revealButton.property('disabled', !isBracketReady(state) || state.revealing || state.randomizing);
        randomizeButton.property('disabled', state.revealing || state.randomizing);
        resetButton.property('disabled', state.revealing || state.randomizing);
    }

    function showTooltip(event, genre) {
        tooltip.html(buildTooltipHtml(genre)).style('opacity', 1);
        moveTooltip(event);
    }

    function moveTooltip(event) {
        const x = Math.min(event.pageX + 16, window.innerWidth - 280);
        const y = Math.max(event.pageY - 28, 24);

        tooltip.style('left', `${x}px`).style('top', `${y}px`);
    }

    function hideTooltip() {
        tooltip.style('opacity', 0);
    }

    async function revealRound(roundName) {
        const targets = roundName === 'semifinals'
            ? genrePlayoffStructure.semifinals
            : genrePlayoffStructure.finals;

        for (const slot of targets) {
            const winner = pickWinnerFromSlots(slot.source);
            state.justRevealed.clear();
            state.justRevealed.add(slot.id);
            if (roundName === 'semifinals') {
                state.winners.semifinals.set(slot.id, winner.genre);
            } else {
                state.winners.finals.set(slot.id, winner.genre);
            }
            renderBoard();
            await delay(650);
        }
        state.justRevealed.clear();
    }

    async function revealChampion() {
        const finalLeft = stats.byName.get(state.winners.finals.get('f-1'));
        const finalRight = stats.byName.get(state.winners.finals.get('f-2'));
        state.justRevealed.clear();
        state.justRevealed.add('champion');
        state.winners.champion = pickWinner(finalLeft, finalRight).genre;
        renderBoard();
        await delay(500);
        state.justRevealed.clear();
    }

    function pickWinnerFromSlots(sourceIds) {
        const [firstId, secondId] = sourceIds;
        const firstName = state.winners.semifinals.get(firstId) || state.assignments.get(firstId);
        const secondName = state.winners.semifinals.get(secondId) || state.assignments.get(secondId);
        return pickWinner(stats.byName.get(firstName), stats.byName.get(secondName));
    }

    function drawConnectors() {
        const boardNode = board.node();
        if (!boardNode) return;

        const boardRect = boardNode.getBoundingClientRect();
        const width = boardNode.clientWidth;
        const height = boardNode.clientHeight;

        connectorLayer
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        const paths = [];

        [
            ['qf-1', 'sf-1'], ['qf-2', 'sf-1'],
            ['qf-3', 'sf-2'], ['qf-4', 'sf-2'],
            ['qf-5', 'sf-3'], ['qf-6', 'sf-3'],
            ['qf-7', 'sf-4'], ['qf-8', 'sf-4'],
            ['sf-1', 'f-1'], ['sf-2', 'f-1'],
            ['sf-3', 'f-2'], ['sf-4', 'f-2']
        ].forEach(([fromId, toId]) => {
            const fromEl = boardNode.querySelector(`[data-slot-id="${fromId}"]`);
            const toEl = boardNode.querySelector(`[data-slot-id="${toId}"]`);
            if (!fromEl || !toEl) return;

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();
            const fromY = fromRect.top - boardRect.top + fromRect.height / 2;
            const toY = toRect.top - boardRect.top + toRect.height / 2;
            const goingRight = fromRect.left < toRect.left;
            const startX = goingRight ? fromRect.right - boardRect.left : fromRect.left - boardRect.left;
            const endX = goingRight ? toRect.left - boardRect.left : toRect.right - boardRect.left;
            const elbowX = startX + ((endX - startX) / 2);

            paths.push({ d: `M ${startX} ${fromY} H ${elbowX} V ${toY} H ${endX}` });
        });

        const connectorSelection = connectorLayer.selectAll('path')
            .data(paths);

        connectorSelection.enter()
            .append('path')
            .merge(connectorSelection)
            .attr('class', 'genre-playoff-connector')
            .attr('d', d => d.d);

        connectorSelection.exit().remove();
    }

    async function animateAssignmentsIntoSlots(assignmentEntries) {
        for (const [slotId, genreName] of assignmentEntries) {
            const genre = stats.byName.get(genreName);
            const source = pool.node().querySelector(`[data-genre="${CSS.escape(genreName)}"]`);
            const target = board.node().querySelector(`[data-slot-id="${slotId}"]`);

            if (!source || !target) {
                state.assignments.set(slotId, genreName);
                renderBoard();
                continue;
            }

            const sourceRect = source.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const ghost = document.createElement('div');
            ghost.className = 'genre-fly-card';
            ghost.style.backgroundColor = genre.color;
            ghost.style.left = `${sourceRect.left}px`;
            ghost.style.top = `${sourceRect.top}px`;
            ghost.style.width = `${sourceRect.width}px`;
            ghost.style.height = `${sourceRect.height}px`;
            ghost.innerHTML = `
                <div class="genre-fly-name">${genre.genre}</div>
                <div class="genre-fly-meta">${genre.countrySpread} countries</div>
            `;
            document.body.appendChild(ghost);

            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    ghost.classList.add('is-moving');
                    ghost.style.transform = `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px) scale(0.96)`;
                });

                window.setTimeout(() => {
                    ghost.remove();
                    state.assignments.set(slotId, genreName);
                    renderBoard();
                    resolve();
                }, 520);
            });

            await delay(110);
        }
    }

    renderBoard();
    window.addEventListener('resize', drawConnectors, { passive: true });
}

function isBracketReady(state) {
    return state.assignments.size === genrePlayoffStructure.quarterfinals.length;
}

function resetWinners(state) {
    state.winners.semifinals.clear();
    state.winners.finals.clear();
    state.winners.champion = null;
}

function buildTooltipHtml(genre) {
    const countries = genre.topCountries.length
        ? genre.topCountries
            .map(country => `<span class="genre-tooltip-pill">${country.country} (${d3.format(',')(country.titles)})</span>`)
            .join('')
        : '<span class="genre-tooltip-pill">No country metadata</span>';

    const languages = (genre.topLanguages && genre.topLanguages.length)
        ? '<div style="margin-top:6px;font-size:0.68rem;color:#aaa;letter-spacing:0.06em;text-transform:uppercase;">Top Languages</div>'
          + genre.topLanguages
              .map(l => `<span class="genre-tooltip-pill">${l.label} (${d3.format(',')(l.count)})</span>`)
              .join('')
        : '';

    return `
        <div class="genre-tooltip-title">${genre.genre} (#${genre.seed})</div>
        <div class="genre-tooltip-countries">${countries}</div>
        ${languages}
    `;
}

function delay(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
}

function shuffleArray(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function showDirectorPopup(genre, dirsByGenre) {
    d3.select('.genre-director-backdrop').remove();

    const directors = dirsByGenre.get(genre.genre) || [];

    const backdrop = d3.select('body').append('div')
        .attr('class', 'genre-director-backdrop')
        .on('click', function (event) {
            if (event.target === this) closeDirectorPopup();
        });

    const popup = backdrop.append('div')
        .attr('class', 'genre-director-popup');

    popup.append('button')
        .attr('class', 'genre-director-close')
        .html('&times;')
        .on('click', closeDirectorPopup);

    const header = popup.append('div')
        .attr('class', 'genre-director-header');

    header.append('div')
        .attr('class', 'genre-director-genre')
        .style('color', genre.color)
        .text(genre.genre);

    header.append('div')
        .attr('class', 'genre-director-sub')
        .text(directors.length
            ? `Top ${directors.length} directors by ${genre.genre} titles`
            : 'No director data available for this genre');

    if (!directors.length) {
        popup.append('div')
            .attr('class', 'genre-director-empty')
            .text('Director information not available.');
    } else {
        const cardsWrap = popup.append('div')
            .attr('class', 'genre-director-cards');

        directors.forEach((dir, i) => {
            if (typeof createTradingCard === 'function') {
                createTradingCard(cardsWrap, dir, i);
            }
        });
    }

    requestAnimationFrame(() => backdrop.classed('visible', true));
}

function closeDirectorPopup() {
    const backdrop = d3.select('.genre-director-backdrop');
    backdrop.classed('visible', false);
    setTimeout(() => backdrop.remove(), 300);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.querySelector('.genre-director-backdrop')) {
        closeDirectorPopup();
    }
});

window.initGenrePlayoffs = initGenrePlayoffs;
