/**
 * Revenue vs Budget Arrow Scatter Plot
 * Shows top 20 highest budget films with arrows from budget to revenue
 */

// Initialize the revenue budget visualization
function initRevenueBudget() {
    d3.csv('data/movies/movies_metadata.csv').then(data => {
        // Process and filter data
        const processedData = processMovieData(data);
        
        // Clear container
        const container = d3.select('#viz-4');
        container.html('');
        
        // Create the visualization
        createArrowChart(container, processedData);
        
    }).catch(error => {
        console.error('Error loading movie data:', error);
        d3.select('#viz-4').html('<p class="placeholder-text">Error loading data</p>');
    });
}

// Process movie data - sample from explicit budget bins for even distribution
function processMovieData(data) {
    // Clean and parse data
    const cleanData = data
        .map(d => ({
            title: d.title,
            budget: +d.budget,
            revenue: +d.revenue,
            year: d.release_date ? d.release_date.split('-')[0] : 'Unknown',
            isLoss: +d.revenue < +d.budget
        }))
        .filter(d => d.budget >= 10000000 && d.revenue > 0);
    
    // Define budget bins (in millions) for even x-axis distribution
    const budgetBins = [
        { min: 10e6, max: 30e6 },
        { min: 30e6, max: 50e6 },
        { min: 50e6, max: 80e6 },
        { min: 80e6, max: 120e6 },
        { min: 120e6, max: 180e6 },
        { min: 180e6, max: 300e6 }
    ];
    
    const result = [];
    
    // Sample from each budget bin
    budgetBins.forEach(bin => {
        const inBin = cleanData.filter(d => d.budget >= bin.min && d.budget < bin.max);
        
        // Get losses in this bin (take up to 1)
        const binLosses = inBin.filter(d => d.isLoss);
        if (binLosses.length > 0) {
            result.push(binLosses[Math.floor(Math.random() * binLosses.length)]);
        }
        
        // Get profits in this bin (take up to 2)
        const binProfits = inBin.filter(d => !d.isLoss);
        const profitCount = Math.min(2, binProfits.length);
        for (let i = 0; i < profitCount; i++) {
            // Pick varied ones - one high revenue, one lower
            if (i === 0 && binProfits.length > 0) {
                // Highest revenue in bin
                const sorted = binProfits.sort((a, b) => b.revenue - a.revenue);
                result.push(sorted[0]);
            } else if (i === 1 && binProfits.length > 1) {
                // A middle one
                const sorted = binProfits.sort((a, b) => b.revenue - a.revenue);
                result.push(sorted[Math.floor(sorted.length / 2)]);
            }
        }
    });
    
    // Remove duplicates and sort by budget
    const uniqueResult = [...new Map(result.map(d => [d.title, d])).values()]
        .sort((a, b) => a.budget - b.budget);
    
    const lossCount = uniqueResult.filter(d => d.isLoss).length;
    console.log(`📊 Sampled ${uniqueResult.length} movies: ${lossCount} losses, ${uniqueResult.length - lossCount} profits`);
    console.log('Budget range:', formatMoney(d3.min(uniqueResult, d => d.budget)), '-', formatMoney(d3.max(uniqueResult, d => d.budget)));
    
    return uniqueResult;
}

// Create the arrow scatter chart
function createArrowChart(container, data) {
    // Dimensions
    const margin = { top: 40, right: 40, bottom: 80, left: 100 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('class', 'arrow-chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    // Define arrow markers
    const defs = svg.append('defs');
    
    // Arrow marker for profit (green, pointing up)
    defs.append('marker')
        .attr('id', 'arrow-up')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 5)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#22c55e');
    
    // Arrow marker for loss (red, pointing down)
    defs.append('marker')
        .attr('id', 'arrow-down')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 5)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#ef4444');
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales - fit to actual data with small padding
    const maxBudget = d3.max(data, d => d.budget);
    const maxRevenue = d3.max(data, d => d.revenue);
    
    // X scale based on budget range
    const xScale = d3.scaleLinear()
        .domain([0, Math.max(maxBudget * 1.1, 300e6)]) // At least $300M
        .range([0, width]);
    
    // Y scale based on max of budget and revenue  
    const yMax = Math.max(maxBudget, maxRevenue) * 1.05;
    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, 0]);
    
    // Axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(6)
        .tickFormat(d => formatMoney(d));
    
    const yAxis = d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat(d => formatMoney(d));
    
    // Add X axis
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-35)')
        .style('text-anchor', 'end');
    
    // Add Y axis
    g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);
    
    // Axis labels
    g.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .text('Budget');
    
    g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20)
        .attr('text-anchor', 'middle')
        .text('Amount ($)');
    
    // Add break-even line (diagonal where revenue = budget)
    g.append('line')
        .attr('class', 'break-even-line')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(d3.min([d3.max(data, d => d.budget), yMax])))
        .attr('y2', yScale(d3.min([d3.max(data, d => d.budget), yMax])))
        .attr('stroke', '#888')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5);
    
    // Add break-even label
    g.append('text')
        .attr('class', 'break-even-label')
        .attr('x', width - 80)
        .attr('y', yScale(xScale.invert(width - 80)) - 10)
        .attr('fill', '#888')
        .attr('font-size', '10px')
        .text('Break-even');
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'arrow-tooltip')
        .style('opacity', 0);
    
    // Draw arrows for each movie
    const arrows = g.selectAll('.movie-arrow')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'movie-arrow');
    
    // Draw the arrow lines
    arrows.append('line')
        .attr('class', d => d.revenue > d.budget ? 'arrow-line profit' : 'arrow-line loss')
        .attr('x1', d => xScale(d.budget))
        .attr('y1', d => yScale(d.budget))
        .attr('x2', d => xScale(d.budget))
        .attr('y2', d => yScale(d.revenue))
        .attr('stroke', d => d.revenue > d.budget ? '#22c55e' : '#ef4444')
        .attr('stroke-width', 3)
        .attr('marker-end', d => d.revenue > d.budget ? 'url(#arrow-up)' : 'url(#arrow-down)')
        .style('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .style('opacity', 1);
    
    // Add budget point (starting point)
    arrows.append('circle')
        .attr('class', 'budget-point')
        .attr('cx', d => xScale(d.budget))
        .attr('cy', d => yScale(d.budget))
        .attr('r', 5)
        .attr('fill', '#64748b')
        .style('opacity', 0)
        .transition()
        .duration(400)
        .delay((d, i) => i * 50)
        .style('opacity', 1);
    
    // Add invisible hover area for tooltip
    arrows.append('rect')
        .attr('class', 'hover-area')
        .attr('x', d => xScale(d.budget) - 15)
        .attr('y', d => Math.min(yScale(d.budget), yScale(d.revenue)) - 10)
        .attr('width', 30)
        .attr('height', d => Math.abs(yScale(d.revenue) - yScale(d.budget)) + 20)
        .attr('fill', 'transparent')
        .on('mouseover', function(event, d) {
            const profit = d.revenue - d.budget;
            const profitPercent = ((profit / d.budget) * 100).toFixed(1);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            tooltip.html(`
                <strong>${d.title}</strong> (${d.year})<br/>
                <span class="label">Budget:</span> ${formatMoney(d.budget)}<br/>
                <span class="label">Revenue:</span> ${formatMoney(d.revenue)}<br/>
                <span class="label ${profit >= 0 ? 'profit' : 'loss'}">
                    ${profit >= 0 ? 'Profit' : 'Loss'}:
                </span> 
                <span class="${profit >= 0 ? 'profit' : 'loss'}">
                    ${formatMoney(Math.abs(profit))} (${profit >= 0 ? '+' : ''}${profitPercent}%)
                </span>
            `)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 30) + 'px');
            
            // Highlight arrow
            d3.select(this.parentNode).select('.arrow-line')
                .attr('stroke-width', 5);
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            
            d3.select(this.parentNode).select('.arrow-line')
                .attr('stroke-width', 3);
        });
    
    // Add legend (positioned in top-left corner inside chart)
    const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(20, 10)');
    
    // Legend background
    legend.append('rect')
        .attr('x', -10)
        .attr('y', -5)
        .attr('width', 130)
        .attr('height', 35)
        .attr('fill', 'white')
        .attr('stroke', '#ddd')
        .attr('rx', 4);
    
    // Profit legend
    legend.append('line')
        .attr('x1', 5).attr('y1', 20)
        .attr('x2', 5).attr('y2', 5)
        .attr('stroke', '#22c55e')
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#arrow-up)');
    
    legend.append('text')
        .attr('x', 18).attr('y', 16)
        .attr('font-size', '11px')
        .attr('fill', 'var(--color-text)')
        .text('Profit');
    
    // Loss legend
    legend.append('line')
        .attr('x1', 70).attr('y1', 5)
        .attr('x2', 70).attr('y2', 20)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#arrow-down)');
    
    legend.append('text')
        .attr('x', 83).attr('y', 16)
        .attr('font-size', '11px')
        .attr('fill', 'var(--color-text)')
        .text('Loss');
}

// Format money values
function formatMoney(value) {
    if (value >= 1e9) {
        return '$' + (value / 1e9).toFixed(1) + 'B';
    } else if (value >= 1e6) {
        return '$' + (value / 1e6).toFixed(0) + 'M';
    } else if (value >= 1e3) {
        return '$' + (value / 1e3).toFixed(0) + 'K';
    }
    return '$' + value;
}

// Export for use in main.js
window.initRevenueBudget = initRevenueBudget;
