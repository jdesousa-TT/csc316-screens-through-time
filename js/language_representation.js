/**
 * Language Representation in Film & TV Over Time
 * showing language diversity by decade (1980s–2010s)
 */

class LanguageRepresentation {

    constructor(parentElement, data) {
        let vis = this;

        vis.parentElement = parentElement;
        vis.data = data;

        vis.langOrder = ['English', 'East Asian', 'South Asian', 'Spanish', 'Arabic/Turkish', 'French/European', 'Other'];

        vis.colors = {
            'English':         '#C45D3A',
            'East Asian':      '#4ECDC4',
            'South Asian':     '#F7BE57',
            'Spanish':         '#6ABF69',
            'Arabic/Turkish':  '#9B72CF',
            'French/European': '#E8943A',
            'Other':           '#B0A99F'
        };

        vis.decades = [1980, 1990, 2000, 2010];

        vis.initVis();
    }

    initVis() {
        let vis = this;

        vis.tooltip = d3.select('body').append('div')
            .attr('class', 'waffle-tooltip')
            .style('opacity', 0);

        vis.wrangleData();
    }

    getLanguageGroup(country) {
        if (!country) return 'Other';
        let c = country.split(',')[0].trim();

        let english    = new Set(['United States','United Kingdom','Canada','Australia','Ireland','New Zealand','South Africa']);
        let spanish    = new Set(['Spain','Mexico','Argentina','Colombia','Chile','Peru','Venezuela','Ecuador','Bolivia','Uruguay','Panama','Costa Rica','Guatemala','Cuba','Dominican Republic']);
        let french     = new Set(['France','Belgium','Switzerland','Morocco','Senegal','Algeria','Tunisia']);
        let asian      = new Set(['Japan','South Korea','China','Hong Kong','Taiwan','Thailand','Vietnam','Indonesia','Philippines','Malaysia','Singapore']);
        let southAsian = new Set(['India','Pakistan','Bangladesh','Sri Lanka']);
        let arabic     = new Set(['Egypt','Turkey','Saudi Arabia','United Arab Emirates','Lebanon','Jordan','Iraq']);

        if (english.has(c))    return 'English';
        if (spanish.has(c))    return 'Spanish';
        if (french.has(c))     return 'French/European';
        if (asian.has(c))      return 'East Asian';
        if (southAsian.has(c)) return 'South Asian';
        if (arabic.has(c))     return 'Arabic/Turkish';
        return 'Other';
    }

    wrangleData() {
        let vis = this;

        let raw = {};
        vis.decades.forEach(function(d) {
            raw[d] = {};
            vis.langOrder.forEach(function(l) { raw[d][l] = 0; });
        });

        vis.data.forEach(function(row) {
            let year = parseInt(row.release_year);
            if (isNaN(year)) return;
            let decade = Math.floor(year / 10) * 10;
            if (!raw[decade]) return;
            let lang = vis.getLanguageGroup(row.country);
            raw[decade][lang] = (raw[decade][lang] || 0) + 1;
        });

        vis.displayData = vis.decades.map(function(decade) {
            let counts = raw[decade];
            let total  = d3.sum(vis.langOrder, function(l) { return counts[l]; });
            let cells  = [];

            vis.langOrder.forEach(function(lang) {
                let n = Math.round((counts[lang] / total) * 80);
                for (let i = 0; i < n; i++) { cells.push(lang); }
            });

            while (cells.length < 80) { cells.push('Other'); }
            cells.length = 80;

            return { decade: decade, cells: cells, counts: counts, total: total };
        });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let container = d3.select('#' + vis.parentElement);
        container.html('');

        let wrapper = container.append('div').attr('class', 'waffle-wrapper');

        let legend = wrapper.append('div').attr('class', 'waffle-legend');

        vis.langOrder.forEach(function(lang) {
            let item = legend.append('div').attr('class', 'waffle-legend-item');
            item.append('div')
                .attr('class', 'waffle-legend-swatch')
                .style('background-color', vis.colors[lang]);
            item.append('span').text(lang);
        });

        let grid = wrapper.append('div').attr('class', 'waffle-grid');

        vis.displayData.forEach(function(d, di) {
            let col = grid.append('div').attr('class', 'waffle-col');

            col.append('div')
                .attr('class', 'waffle-decade-label')
                .text(d.decade + 's');

            let squares = col.append('div').attr('class', 'waffle-squares');

            d.cells.forEach(function(lang, i) {
                squares.append('div')
                    .attr('class', 'waffle-cell')
                    .style('background-color', vis.colors[lang] || '#B0A99F')
                    .style('animation-delay', (di * 80 + i * 6) + 'ms')
                    .on('mouseover', function(event) {
                        let count = d.counts[lang] || 0;
                        let pct   = ((count / d.total) * 100).toFixed(1);
                        vis.tooltip
                            .style('opacity', 1)
                            .html('<strong>' + lang + '</strong><br/>' + count + ' titles · ' + pct + '%<br/><em style="color:#aaa">' + d.decade + 's</em>')
                            .style('left', (event.pageX + 14) + 'px')
                            .style('top',  (event.pageY - 44) + 'px');
                        d3.select(this).style('outline', '2px solid #1A1A1A');
                    })
                    .on('mousemove', function(event) {
                        vis.tooltip
                            .style('left', (event.pageX + 14) + 'px')
                            .style('top',  (event.pageY - 44) + 'px');
                    })
                    .on('mouseout', function() {
                        vis.tooltip.style('opacity', 0);
                        d3.select(this).style('outline', 'none');
                    });
            });

            // Percentage bar under each waffle
            let bar = col.append('div').attr('class', 'waffle-pct-bar');
            vis.langOrder.forEach(function(lang) {
                let pct = ((d.counts[lang] || 0) / d.total) * 100;
                if (pct < 1) return;
                bar.append('div')
                    .attr('class', 'waffle-pct-seg')
                    .style('width', pct + '%')
                    .style('background-color', vis.colors[lang]);
            });

            col.append('div')
                .attr('class', 'waffle-total')
                .text('n = ' + d.total);
        });
    }
}