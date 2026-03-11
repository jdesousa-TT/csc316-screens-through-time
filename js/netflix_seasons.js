/**
 * How Many Seasons Do Netflix TV Shows Typically Have?
 */

class NetflixSeasons {

    constructor(parentElement, data) {
        let vis = this;

        vis.parentElement = parentElement;
        vis.data = data;

        vis.initVis();
    }

    initVis() {
        let vis = this;

        // Tooltip
        vis.tooltip = d3.select('body').append('div')
            .attr('class', 'seasons-tooltip')
            .style('opacity', 0);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Count TV shows by number of seasons (1–8)
        let counts = {};

        vis.data.forEach(function(row) {
            if (row.type !== 'TV Show' || !row.duration) return;
            let match = row.duration.match(/^(\d+)\s+Season/);
            if (!match) return;
            let n = parseInt(match[1]);
            if (n >= 1 && n <= 8) {
                counts[n] = (counts[n] || 0) + 1;
            }
        });

        // Convert to sorted array
        vis.displayData = Object.entries(counts)
            .map(function(entry) {
                return { seasons: +entry[0], count: entry[1] };
            })
            .sort(function(a, b) { return a.seasons - b.seasons; });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let container = d3.select('#' + vis.parentElement);
        container.html('');

        let maxCount = d3.max(vis.displayData, function(d) { return d.count; });
        let total    = d3.sum(vis.displayData, function(d) { return d.count; });

        let wrapper = container.append('div').attr('class', 'seasons-wrapper');

        // Insight text
        wrapper.append('p')
            .attr('class', 'seasons-insight')
            .html('Most recent Netflix TV shows have <strong>just 1 season</strong>, nowadays, streaming platforms favour limited series over longer shows.');

        let chartArea = wrapper.append('div').attr('class', 'seasons-chart');

        // Draw one column per season count
        vis.displayData.forEach(function(d, i) {
            let col = chartArea.append('div')
                .attr('class', 'seasons-col')
                .style('animation-delay', (i * 120) + 'ms');

            // Number of screen icons to stack (max 10)
            let maxScreens = 10;
            let numScreens = Math.max(1, Math.round((d.count / maxCount) * maxScreens));

            let stack = col.append('div').attr('class', 'screen-stack');

            for (let s = 0; s < numScreens; s++) {
                let screen = stack.append('div')
                    .attr('class', 'screen-icon')
                    .style('animation-delay', (i * 120 + s * 40) + 'ms');

                let inner = screen.append('div').attr('class', 'screen-inner');

                // Play button triangle
                inner.append('div').attr('class', 'screen-play');

                // Side dots
                let dots = inner.append('div').attr('class', 'screen-dots');
                dots.append('div').attr('class', 'screen-dot');
                dots.append('div').attr('class', 'screen-dot');
            }

            // Count label
            col.append('div')
                .attr('class', 'seasons-count')
                .text(d.count.toLocaleString());

            // Season label
            col.append('div')
                .attr('class', 'seasons-label')
                .text(d.seasons === 1 ? '1 Season' : d.seasons + ' Seasons');

            // Hover tooltip
            col.on('mouseover', function(event) {
                let pct = ((d.count / total) * 100).toFixed(1);
                vis.tooltip
                    .style('opacity', 1)
                    .html('<strong>' + (d.seasons === 1 ? '1 Season' : d.seasons + ' Seasons') + '</strong><br/>' + d.count.toLocaleString() + ' shows<br/>' + pct + '% of all TV shows')
                    .style('left', (event.pageX + 14) + 'px')
                    .style('top',  (event.pageY - 44) + 'px');
            })
                .on('mousemove', function(event) {
                    vis.tooltip
                        .style('left', (event.pageX + 14) + 'px')
                        .style('top',  (event.pageY - 44) + 'px');
                })
                .on('mouseout', function() {
                    vis.tooltip.style('opacity', 0);
                });
        });
    }
}