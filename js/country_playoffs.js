/**
 * Country Playoffs
 * Interactive bracket for the top 8 production countries across Netflix, Disney+, and Amazon Prime.
 */

(() => {
    const countryPlayoffPalette = {
        'United States': '#7f8ee8',
        'India': '#e38c5d',
        'United Kingdom': '#67b9a8',
        'Canada': '#d9688f',
        'France': '#8cb36b',
        'Japan': '#c78ae0',
        'Germany': '#d9b35c',
        'Spain': '#7db4d8'
    };

    const countryPlayoffStructure = {
        quarterfinals: [
            { id: 'cqf-1', side: 'left' },
            { id: 'cqf-2', side: 'left' },
            { id: 'cqf-3', side: 'left' },
            { id: 'cqf-4', side: 'left' },
            { id: 'cqf-5', side: 'right' },
            { id: 'cqf-6', side: 'right' },
            { id: 'cqf-7', side: 'right' },
            { id: 'cqf-8', side: 'right' }
        ],
        semifinals: [
            { id: 'csf-1', side: 'left', source: ['cqf-1', 'cqf-2'] },
            { id: 'csf-2', side: 'left', source: ['cqf-3', 'cqf-4'] },
            { id: 'csf-3', side: 'right', source: ['cqf-5', 'cqf-6'] },
            { id: 'csf-4', side: 'right', source: ['cqf-7', 'cqf-8'] }
        ],
        finals: [
            { id: 'cf-1', source: ['csf-1', 'csf-2'] },
            { id: 'cf-2', source: ['csf-3', 'csf-4'] }
        ]
    };

    function initCountryPlayoffs() {
        const container = d3.select('#viz-2');
        if (container.empty()) return;
        if (typeof ensurePlayoffRuntimeStyles === 'function') {
            ensurePlayoffRuntimeStyles();
        }

        Promise.all([
            d3.csv('data/netflix_titles.csv'),
            d3.csv('data/disney_plus_titles.csv'),
            d3.csv('data/amazon_prime_titles.csv')
        ]).then(([netflixTitles, disneyTitles, amazonTitles]) => {
            const stats = buildCountryPlayoffData([...netflixTitles, ...disneyTitles, ...amazonTitles]);
            renderCountryPlayoffs(container, stats);
        }).catch(error => {
            console.error('Error loading country playoff data:', error);
            container.html('<p class="placeholder-text">Error loading country playoffs</p>');
        });
    }

    function buildCountryPlayoffData(rows) {
        const countryCounts = new Map();
        const genresByCountry = new Map();

        rows.forEach(row => {
            const countries = (row.country || '')
                .split(',')
                .map(country => country.trim())
                .filter(Boolean);
            const genres = normalizeCountryGenres(row.listed_in);

            countries.forEach(country => {
                countryCounts.set(country, (countryCounts.get(country) || 0) + 1);

                if (!genresByCountry.has(country)) {
                    genresByCountry.set(country, new Map());
                }

                const genreMap = genresByCountry.get(country);
                genres.forEach(genre => {
                    genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
                });
            });
        });

        const topCountries = Array.from(countryCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([country, count], index) => {
                const genreMap = genresByCountry.get(country) || new Map();
                const topGenres = Array.from(genreMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([genre, titles]) => ({ genre, titles }));

                return {
                    country,
                    count,
                    seed: index + 1,
                    color: countryPlayoffPalette[country] || '#d6cec2',
                    topGenres,
                    genreSpread: genreMap.size
                };
            });

        return {
            countries: topCountries,
            byName: new Map(topCountries.map(country => [country.country, country]))
        };
    }

    function normalizeCountryGenres(listedIn) {
        const ignoredGenres = new Set([
            'Arts',
            'Entertainment',
            'and Culture',
            'Special Interest',
            'TV Shows',
            'International',
            'International Movies',
            'International TV Shows',
            'Independent Movies',
            'British TV Shows',
            "Kids' TV",
            'Spanish-Language TV Shows'
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

    function pickCountryWinner(first, second) {
        return first.count >= second.count ? first : second;
    }

    function renderCountryPlayoffs(container, stats) {
        container.html('');

        const state = {
            assignments: new Map(),
            winners: {
                semifinals: new Map(),
                finals: new Map(),
                champion: null
            },
            justRevealed: new Set(),
            draggingCountry: null,
            revealing: false,
            randomizing: false
        };

        const shell = container.append('div').attr('class', 'genre-playoffs-shell');
        const header = shell.append('div').attr('class', 'genre-playoffs-header country-playoffs-header');
        const actions = header.append('div').attr('class', 'genre-playoffs-actions');
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
            .text('Hover for top genres.');

        const pool = shell.append('div').attr('class', 'genre-pool');
        const board = shell.append('div').attr('class', 'genre-playoffs-bracket interactive');
        const connectorLayer = board.append('svg').attr('class', 'genre-playoffs-connectors');
        const tooltip = d3.select('body')
            .selectAll('.country-playoff-tooltip')
            .data([null])
            .join('div')
            .attr('class', 'genre-playoff-tooltip country-playoff-tooltip')
            .style('opacity', 0);

        const columns = [
            { key: 'left-quarter', label: 'Quarterfinals', slots: countryPlayoffStructure.quarterfinals.filter(slot => slot.side === 'left') },
            { key: 'left-semi', label: 'Semifinals', slots: countryPlayoffStructure.semifinals.filter(slot => slot.side === 'left') },
            { key: 'center-final', label: 'Final', slots: countryPlayoffStructure.finals },
            { key: 'right-semi', label: 'Semifinals', slots: countryPlayoffStructure.semifinals.filter(slot => slot.side === 'right') },
            { key: 'right-quarter', label: 'Quarterfinals', slots: countryPlayoffStructure.quarterfinals.filter(slot => slot.side === 'right') }
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
            d3.select(this).append('div').attr('class', `slot-stack ${column.key}`);
        });

        revealButton.on('click', async () => {
            if (state.revealing || state.randomizing || !isCountryBracketReady(state)) return;
            state.revealing = true;
            revealButton.property('disabled', true).text('Revealing...');
            resetCountryWinners(state);
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
            resetCountryWinners(state);
            revealButton.text('Reveal Winners');
            renderBoard();
            syncControls();

            const assignmentEntries = shuffleCountryArray(stats.countries.map(country => country.country))
                .map((countryName, index) => [countryPlayoffStructure.quarterfinals[index].id, countryName]);

            await animateAssignmentsIntoSlots(assignmentEntries);
            state.randomizing = false;
            renderBoard();
        });

        resetButton.on('click', () => {
            state.assignments.clear();
            state.draggingCountry = null;
            state.revealing = false;
            state.randomizing = false;
            resetCountryWinners(state);
            renderBoard();
            revealButton.text('Reveal Winners');
            syncControls();
        });

        function renderPool() {
            const assignedCountries = new Set(state.assignments.values());
            const available = stats.countries.filter(country => !assignedCountries.has(country.country));

            const cards = pool.selectAll('.genre-pool-card')
                .data(available, d => d.country);

            cards.exit().remove();

            const entered = cards.enter()
                .append('button')
                .attr('type', 'button')
                .attr('class', 'genre-pool-card');

            const merged = entered.merge(cards)
                .attr('data-country', d => d.country)
                .attr('draggable', state.revealing ? null : true)
                .style('background-color', d => d.color)
                .on('dragstart', (event, d) => {
                    if (state.revealing || state.randomizing) {
                        event.preventDefault();
                        return;
                    }
                    state.draggingCountry = d.country;
                    event.dataTransfer.setData('text/plain', d.country);
                })
                .on('dragend', () => {
                    state.draggingCountry = null;
                })
                .on('mouseenter', (event, d) => showTooltip(event, d))
                .on('mousemove', moveTooltip)
                .on('mouseleave', hideTooltip)
                .on('focus', (event, d) => showTooltip(event, d))
                .on('blur', hideTooltip);

            merged.html('');
            merged.append('span').attr('class', 'genre-playoff-name').text(d => d.country);
            merged.append('span').attr('class', 'genre-playoff-meta').text(d => `${d.genreSpread} genres`);
        }

        function renderBoard() {
            renderQuarterfinals();
            renderWinners('left-semi', countryPlayoffStructure.semifinals.filter(slot => slot.side === 'left'), state.winners.semifinals);
            renderWinners('right-semi', countryPlayoffStructure.semifinals.filter(slot => slot.side === 'right'), state.winners.semifinals);
            renderWinners('center-final', countryPlayoffStructure.finals, state.winners.finals);
            renderChampionCallout();
            renderPool();
            syncControls();
            requestAnimationFrame(drawConnectors);
        }

        function renderQuarterfinals() {
            ['left-quarter', 'right-quarter'].forEach(columnKey => {
                const slots = countryPlayoffStructure.quarterfinals.filter(slot => slot.side === (columnKey === 'left-quarter' ? 'left' : 'right'));
                const stack = board.select(`.${columnKey}.slot-stack`);
                const slotSelection = stack.selectAll('.genre-drop-slot').data(slots, d => d.id);
                slotSelection.exit().remove();

                const entered = slotSelection.enter().append('div').attr('class', 'genre-drop-slot');
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
                        const countryName = event.dataTransfer.getData('text/plain') || state.draggingCountry;
                        assignCountryToSlot(countryName, slot.id);
                    });

                merged.html('');

                merged.each(function(slot) {
                    const slotNode = d3.select(this);
                    const countryName = state.assignments.get(slot.id);
                    if (!countryName) {
                        slotNode.append('div').attr('class', 'genre-slot-placeholder').text(`Drop country ${slot.id.replace('cqf-', '')}`);
                        return;
                    }
                    const country = stats.byName.get(countryName);
                    renderCountryCard(slotNode, country, 'genre-playoff-card interactive', true, false);
                });
            });
        }

        function renderWinners(columnKey, slots, winnerMap) {
            const stack = board.select(`.${columnKey}.slot-stack`);
            const slotSelection = stack.selectAll('.genre-winner-slot').data(slots, d => d.id);
            slotSelection.exit().remove();
            const entered = slotSelection.enter().append('div').attr('class', 'genre-winner-slot');
            const merged = entered.merge(slotSelection).attr('data-slot-id', d => d.id);

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

                const country = stats.byName.get(winnerName);
                const revealClass = state.justRevealed.has(slot.id) ? ' revealed' : '';
                renderCountryCard(slotNode, country, `genre-playoff-card genre-playoff-card-finalist${revealClass}`, false, true);
            });
        }

        function renderChampionCallout() {
            board.select('.center-final.slot-stack').selectAll('.genre-playoffs-callout').remove();
            if (!state.winners.champion) return;

            const champion = stats.byName.get(state.winners.champion);
            const callout = board.select('.center-final.slot-stack')
                .append('div')
                .attr('class', `genre-playoffs-callout${state.justRevealed.has('champion') ? ' revealed' : ''}`);

            callout.append('span').attr('class', 'genre-playoffs-callout-label').text('Overall Winner');
            callout.append('div').attr('class', 'genre-playoffs-callout-winner').text(champion.country);
            callout.append('p').attr('class', 'genre-playoffs-callout-copy').text(`${d3.format(',')(champion.count)} titles across ${champion.genreSpread} genres`);
        }

        function renderCountryCard(parent, country, className, removable, showCount) {
            const card = parent.append('button')
                .attr('type', 'button')
                .attr('class', className)
                .attr('data-country', country.country)
                .style('background-color', country.color)
                .on('mouseenter', (event) => showTooltip(event, country))
                .on('mousemove', moveTooltip)
                .on('mouseleave', hideTooltip)
                .on('focus', (event) => showTooltip(event, country))
                .on('blur', hideTooltip);

            if (removable && !state.revealing) {
                card.attr('draggable', true)
                    .on('dragstart', (event) => {
                        if (state.randomizing) {
                            event.preventDefault();
                            return;
                        }
                        state.draggingCountry = country.country;
                        event.dataTransfer.setData('text/plain', country.country);
                    })
                    .on('dragend', () => {
                        state.draggingCountry = null;
                    });
            }

            card.append('span').attr('class', 'genre-playoff-name').text(country.country);
            card.append('span')
                .attr('class', showCount ? 'genre-playoff-count' : 'genre-playoff-meta')
                .text(showCount ? d3.format(',')(country.count) : `${country.genreSpread} genres`);

            if (removable && !state.revealing) {
                card.append('span').attr('class', 'genre-playoff-hint').text('Drag to move');
            }
        }

        function assignCountryToSlot(countryName, slotId) {
            if (!countryName || !stats.byName.has(countryName)) return;
            resetCountryWinners(state);

            let previousSlot = null;
            state.assignments.forEach((assignedCountry, assignedSlotId) => {
                if (assignedCountry === countryName) previousSlot = assignedSlotId;
            });

            const displacedCountry = state.assignments.get(slotId);
            if (previousSlot) state.assignments.delete(previousSlot);
            state.assignments.set(slotId, countryName);
            if (displacedCountry && previousSlot && displacedCountry !== countryName) {
                state.assignments.set(previousSlot, displacedCountry);
            }
            renderBoard();
        }

        function syncControls() {
            revealButton.property('disabled', !isCountryBracketReady(state) || state.revealing || state.randomizing);
            randomizeButton.property('disabled', state.revealing || state.randomizing);
            resetButton.property('disabled', state.revealing || state.randomizing);
        }

        function showTooltip(event, country) {
            tooltip.html(buildCountryTooltipHtml(country)).style('opacity', 1);
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
            const targets = roundName === 'semifinals' ? countryPlayoffStructure.semifinals : countryPlayoffStructure.finals;
            for (const slot of targets) {
                const winner = pickWinnerFromSlots(slot.source);
                state.justRevealed.clear();
                state.justRevealed.add(slot.id);
                if (roundName === 'semifinals') {
                    state.winners.semifinals.set(slot.id, winner.country);
                } else {
                    state.winners.finals.set(slot.id, winner.country);
                }
                renderBoard();
                await countryDelay(650);
            }
            state.justRevealed.clear();
        }

        async function revealChampion() {
            const left = stats.byName.get(state.winners.finals.get('cf-1'));
            const right = stats.byName.get(state.winners.finals.get('cf-2'));
            state.justRevealed.clear();
            state.justRevealed.add('champion');
            state.winners.champion = pickCountryWinner(left, right).country;
            renderBoard();
            await countryDelay(500);
            state.justRevealed.clear();
        }

        function pickWinnerFromSlots(sourceIds) {
            const [firstId, secondId] = sourceIds;
            const firstName = state.winners.semifinals.get(firstId) || state.assignments.get(firstId);
            const secondName = state.winners.semifinals.get(secondId) || state.assignments.get(secondId);
            return pickCountryWinner(stats.byName.get(firstName), stats.byName.get(secondName));
        }

        function drawConnectors() {
            const boardNode = board.node();
            if (!boardNode) return;
            const boardRect = boardNode.getBoundingClientRect();
            const width = boardNode.clientWidth;
            const height = boardNode.clientHeight;

            connectorLayer.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

            const paths = [];
            [
                ['cqf-1', 'csf-1'], ['cqf-2', 'csf-1'],
                ['cqf-3', 'csf-2'], ['cqf-4', 'csf-2'],
                ['cqf-5', 'csf-3'], ['cqf-6', 'csf-3'],
                ['cqf-7', 'csf-4'], ['cqf-8', 'csf-4'],
                ['csf-1', 'cf-1'], ['csf-2', 'cf-1'],
                ['csf-3', 'cf-2'], ['csf-4', 'cf-2']
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

            const connectorSelection = connectorLayer.selectAll('path').data(paths);
            connectorSelection.enter().append('path').merge(connectorSelection).attr('class', 'genre-playoff-connector').attr('d', d => d.d);
            connectorSelection.exit().remove();
        }

        async function animateAssignmentsIntoSlots(assignmentEntries) {
            for (const [slotId, countryName] of assignmentEntries) {
                const country = stats.byName.get(countryName);
                const source = pool.node().querySelector(`[data-country="${CSS.escape(countryName)}"]`);
                const target = board.node().querySelector(`[data-slot-id="${slotId}"]`);

                if (!source || !target) {
                    state.assignments.set(slotId, countryName);
                    renderBoard();
                    continue;
                }

                const sourceRect = source.getBoundingClientRect();
                const targetRect = target.getBoundingClientRect();
                const ghost = document.createElement('div');
                ghost.className = 'genre-fly-card';
                ghost.style.backgroundColor = country.color;
                ghost.style.left = `${sourceRect.left}px`;
                ghost.style.top = `${sourceRect.top}px`;
                ghost.style.width = `${sourceRect.width}px`;
                ghost.style.height = `${sourceRect.height}px`;
                ghost.innerHTML = `
                    <div class="genre-fly-name">${country.country}</div>
                    <div class="genre-fly-meta">${country.genreSpread} genres</div>
                `;
                document.body.appendChild(ghost);

                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        ghost.classList.add('is-moving');
                        ghost.style.transform = `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px) scale(0.96)`;
                    });

                    window.setTimeout(() => {
                        ghost.remove();
                        state.assignments.set(slotId, countryName);
                        renderBoard();
                        resolve();
                    }, 520);
                });

                await countryDelay(110);
            }
        }

        renderBoard();
        window.addEventListener('resize', drawConnectors, { passive: true });
    }

    function isCountryBracketReady(state) {
        return state.assignments.size === countryPlayoffStructure.quarterfinals.length;
    }

    function resetCountryWinners(state) {
        state.winners.semifinals.clear();
        state.winners.finals.clear();
        state.winners.champion = null;
    }

    function buildCountryTooltipHtml(country) {
        const genres = country.topGenres.length
            ? country.topGenres.map(genre => `<span class="genre-tooltip-pill">${genre.genre} (${d3.format(',')(genre.titles)})</span>`).join('')
            : '<span class="genre-tooltip-pill">No genre metadata</span>';

        return `
            <div class="genre-tooltip-title">${country.country}</div>
            <div class="genre-tooltip-countries">${genres}</div>
        `;
    }

    function countryDelay(ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
    }

    function shuffleCountryArray(items) {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    window.initCountryPlayoffs = initCountryPlayoffs;
})();
