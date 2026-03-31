const host = d3.select("#viz-streaming-map");
host.html("");

const wrapper = host.append("div").attr("class", "streaming-map-wrapper");
const svg = wrapper.append("svg").attr("class", "streaming-map-svg");
const tooltip = wrapper.append("div").attr("class", "streaming-map-tooltip hidden");
const container = wrapper.node();

const width = container.clientWidth || 1100;
const height = Math.max(520, Math.round(window.innerHeight * 0.75));
svg.attr("viewBox", `0 0 ${width} ${height}`);

const baseScale = Math.min(width, height) * 0.39;
let zoomLevel = 1;

const projection = d3.geoOrthographic()
  .scale(baseScale * zoomLevel)
  .translate([width / 2, height / 2 + 18])
  .clipAngle(90);

const path = d3.geoPath(projection);

const root = svg.append("g");
const globeGroup = root.append("g");
const pinGroup = root.append("g");
const labelGroup = root.append("g");

const platformColors = {
  "Netflix":       "#e04e45",
  "Amazon Prime":  "#4a82d4",
  "Disney+":       "#7b52b8"
};

// Muted versions for the "contested" state (nearly equal split)
const platformColorsMuted = {
  "Netflix":       "#e04e4566",
  "Amazon Prime":  "#4a82d466",
  "Disney+":       "#7b52b866"
};

let selectedYear = 2023;

const countryCoords = {
  "United States": [-98, 39], "Canada": [-106, 56], "Mexico": [-102, 23],
  "Brazil": [-52, -10], "Argentina": [-64, -34], "Chile": [-71, -30],
  "Colombia": [-74, 4], "Peru": [-75, -10], "Venezuela": [-66, 7],
  "Uruguay": [-56, -33], "Paraguay": [-58, -23], "Ecuador": [-78, -1],
  "Bolivia": [-64, -17], "Guatemala": [-90, 15], "Costa Rica": [-84, 10],
  "Panama": [-80, 8], "Dominican Republic": [-70, 19], "Puerto Rico": [-66, 18],
  "Cuba": [-79, 21], "Jamaica": [-77, 18], "Honduras": [-86.5, 15],
  "Nicaragua": [-85, 13], "El Salvador": [-88.9, 13.8],
  "United Kingdom": [-2, 54], "France": [2, 46], "Germany": [10, 51],
  "Spain": [-4, 40], "Italy": [12, 42.5], "Ireland": [-8, 53],
  "Belgium": [4.5, 50.5], "Switzerland": [8.2, 46.8], "Austria": [14, 47.5],
  "Netherlands": [5.5, 52.2], "Poland": [19, 52], "Denmark": [10, 56],
  "Sweden": [15, 62], "Norway": [9, 61], "Finland": [26, 64],
  "Portugal": [-8, 39.5], "Czech Republic": [15.5, 49.8], "Czechia": [15.5, 49.8],
  "Hungary": [19, 47], "Romania": [25, 45.8], "Greece": [22, 39],
  "Ukraine": [32, 49], "Russia": [90, 61], "Soviet Union": [60, 55],
  "Iceland": [-19, 65], "Luxembourg": [6.1, 49.8], "Serbia": [21, 44],
  "Croatia": [16, 45.1],
  "South Africa": [24, -29], "Nigeria": [8, 9], "Egypt": [30, 26],
  "Kenya": [37, 0.5], "Ghana": [-1, 7.8], "Morocco": [-6, 31.8],
  "Algeria": [2, 28], "Tunisia": [9, 34], "Senegal": [-14, 14],
  "Ethiopia": [40, 9], "Namibia": [18, -22], "Zimbabwe": [30, -19],
  "Cameroon": [12, 5.5], "Mauritius": [57.5, -20.2],
  "Turkey": [35, 39], "United Arab Emirates": [54, 24], "Saudi Arabia": [45, 24],
  "Iran": [53, 32], "Iraq": [44, 33], "Israel": [35, 31.5],
  "Jordan": [36, 31], "Lebanon": [35.8, 33.8], "Qatar": [51.2, 25.3],
  "Kuwait": [47.5, 29.3], "Syria": [38, 35], "Palestine": [35.2, 31.9],
  "India": [78, 22], "Pakistan": [69, 30], "Bangladesh": [90, 24],
  "Sri Lanka": [80.7, 7.8], "Nepal": [84, 28], "Afghanistan": [66, 34],
  "Japan": [138, 37], "China": [104, 35], "South Korea": [127.5, 36],
  "Hong Kong": [114.2, 22.3], "Taiwan": [121, 23.7], "Mongolia": [103, 46],
  "Thailand": [101, 15], "Indonesia": [113, -2], "Malaysia": [102, 4],
  "Philippines": [122, 13], "Vietnam": [108, 16], "Singapore": [103.8, 1.35],
  "Cambodia": [105, 12.7],
  "Australia": [134, -25], "New Zealand": [172, -42]
};

function setZoom(nextZoom) {
  zoomLevel = Math.max(1, Math.min(5, nextZoom)); // min 1x, max 5x
  projection.scale(baseScale * zoomLevel);
  refreshAll();
}

function normalizeType(type) {
  if (type === "TV Show") return "TV";
  if (type === "Movie") return "Film";
  return type;
}

function splitCountries(value) {
  if (!value || typeof value !== "string") return [];
  return value.split(",").map(d => d.trim()).filter(Boolean);
}

function isVisible(coords) {
  const rotation = projection.rotate();
  const lon0 = -rotation[0], lat0 = -rotation[1];
  const lambda  = coords[0] * Math.PI / 180;
  const phi     = coords[1] * Math.PI / 180;
  const lambda0 = lon0 * Math.PI / 180;
  const phi0    = lat0 * Math.PI / 180;
  const cosc =
    Math.sin(phi0) * Math.sin(phi) +
    Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0);
  return cosc > 0;
}

function isCountryVisible(feature) {
  return isVisible(d3.geoCentroid(feature));
}

// ─── Data wrangling ───────────────────────────────────────────────────────────

function buildPlatformCountryCounts(datasets) {
  const grouped = new Map();
  datasets.forEach(({ platform, rows }) => {
    rows.forEach(row => {
      const format = normalizeType(row.type);
      if (format !== "TV" && format !== "Film") return;
      if (+row.release_year > selectedYear) return;
      splitCountries(row.country)
        .filter(c => countryCoords[c])
        .forEach(country => {
          const key = `${country}|${platform}|${format}`;
          if (!grouped.has(key)) {
            grouped.set(key, { country, platform, format, count: 0, coords: countryCoords[country] });
          }
          grouped.get(key).count += 1;
        });
    });
  });
  return Array.from(grouped.values());
}

let worldCountries = null;
let allCounts = [];
let groupedPins = [];

// Each entry: { country, coords, dominant, dominantCount, total, counts, margin }
// margin = how dominant the leader is (0 = tied, 1 = complete monopoly)
function wranglePins() {
  const selectedType = document.getElementById("typeFilter").value;

  const filtered = allCounts.filter(d =>
    selectedType === "All" || d.format === selectedType
  );

  const byCountry = d3.rollup(
    filtered,
    v => ({
      "Netflix":       d3.sum(v.filter(d => d.platform === "Netflix"),       d => d.count),
      "Amazon Prime":  d3.sum(v.filter(d => d.platform === "Amazon Prime"),  d => d.count),
      "Disney+":       d3.sum(v.filter(d => d.platform === "Disney+"),       d => d.count),
    }),
    d => d.country
  );

  groupedPins = [];
  byCountry.forEach((counts, country) => {
    const total = counts["Netflix"] + counts["Amazon Prime"] + counts["Disney+"];
    if (total === 0) return;

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [dominant, dominantCount] = sorted[0];
    const runnerUp = sorted[1][1];

    // margin: 0 = perfectly tied, 1 = complete monopoly
    const margin = (dominantCount - runnerUp) / total;

    groupedPins.push({
      country,
      coords: countryCoords[country],
      dominant,
      dominantCount,
      total,
      counts,
      margin
    });
  });
}

// ─── Radius scale ─────────────────────────────────────────────────────────────

const rScale = d3.scaleSqrt().range([4, 36]);

// ─── Globe rendering ──────────────────────────────────────────────────────────

function drawGlobe() {
  globeGroup.selectAll("*").remove();
  globeGroup.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "sphere")
    .attr("d", path);
  globeGroup.append("path")
    .datum(d3.geoGraticule10())
    .attr("class", "graticule")
    .attr("d", path);
  globeGroup.selectAll(".country")
    .data(worldCountries.features)
    .enter().append("path")
    .attr("class", d => isCountryVisible(d) ? "country" : "country backface")
    .attr("d", path);
}

function updateGlobePaths() {
  globeGroup.selectAll(".sphere").attr("d", path);
  globeGroup.selectAll(".graticule").attr("d", path);
  globeGroup.selectAll(".country")
    .attr("d", path)
    .attr("class", d => isCountryVisible(d) ? "country" : "country backface");
}

// ─── Pin rendering ────────────────────────────────────────────────────────────

function updatePins() {
  wranglePins();

  const visiblePins = groupedPins.filter(d => isVisible(d.coords));

  const pinSel = pinGroup.selectAll(".pin-group")
    .data(visiblePins, d => d.country);

  pinSel.exit().remove();

  const pinEnter = pinSel.enter()
    .append("g")
    .attr("class", "pin-group")
    .style("cursor", "pointer")
    .on("mouseenter", function(event, d) {
      // Dim everything else
      d3.selectAll(".pin-group").style("opacity", 0.15);
      d3.select(this).style("opacity", 1).raise();

      // Build mini bar chart in tooltip
      const platforms = ["Netflix", "Amazon Prime", "Disney+"];
      const barMax = Math.max(...platforms.map(p => d.counts[p]));
      const bars = platforms.map(p => {
        const count = d.counts[p];
        const pct = barMax > 0 ? (count / barMax) * 100 : 0;
        const isDominant = p === d.dominant;
        return `
          <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
            <span style="width:80px;font-size:11px;opacity:${isDominant ? 1 : 0.65};font-weight:${isDominant ? 600 : 400}">${p}</span>
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.12);border-radius:3px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${platformColors[p]};border-radius:3px;transition:width 0.2s"></div>
            </div>
            <span style="width:28px;font-size:11px;text-align:right;opacity:${isDominant ? 1 : 0.6}">${count}</span>
          </div>`;
      }).join("");

      const marginPct = Math.round(d.margin * 100);
      const dominanceLabel = marginPct > 40
        ? "Strong lead"
        : marginPct > 15
          ? "Moderate lead"
          : "Contested";

      tooltip
        .classed("hidden", false)
        .html(`
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;letter-spacing:0.01em">${d.country}</div>
          ${bars}
          <div style="margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;opacity:0.55;display:flex;justify-content:space-between">
            <span>${dominanceLabel}</span>
            <span>${d.total} titles total</span>
          </div>
        `);
    })
    .on("mousemove", function(event) {
      const bounds = container.getBoundingClientRect();
      tooltip
        .style("left", `${event.clientX - bounds.left + 16}px`)
        .style("top",  `${event.clientY - bounds.top  + 16}px`);
    })
    .on("mouseleave", function() {
      d3.selectAll(".pin-group").style("opacity", 0.9);
      tooltip.classed("hidden", true);
    });

  // Draw or redraw each pin
  pinEnter.merge(pinSel).each(function(d) {
    const g = d3.select(this);
    const projected = projection(d.coords);
    if (!projected) return;
    const [cx, cy] = projected;
    const r = rScale(d.total);

    g.attr("transform", `translate(${cx},${cy})`);
    g.selectAll("*").remove();

    const color = platformColors[d.dominant];

    // Outer ring — full opacity shows dominant color clearly
    g.append("circle")
      .attr("r", r)
      .attr("fill", color)
      .attr("fill-opacity", 0.15 + d.margin * 0.55)   // stronger margin = more saturated
      .attr("stroke", color)
      .attr("stroke-width", 1.8)
      .attr("stroke-opacity", 0.85);

    // Inner dot — anchors the pin visually
    g.append("circle")
      .attr("r", Math.max(2.5, r * 0.28))
      .attr("fill", color)
      .attr("fill-opacity", 0.95);

    // Contested marker: thin dashed ring for close races
    if (d.margin < 0.12) {
      g.append("circle")
        .attr("r", r + 3)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 0.8)
        .attr("stroke-dasharray", "3 2.5")
        .attr("stroke-opacity", 0.5);
    }
  });
}

// ─── Legend & labels ──────────────────────────────────────────────────────────

function drawLabels() {
  labelGroup.selectAll("*").remove();

  labelGroup.append("text")
    .attr("class", "hint")
    .attr("x", width / 2)
    .attr("y", 38)
    .text("Drag to rotate · hover a pin for breakdown · Use two fingers to zoom");

  // Color key
  const legend = labelGroup.append("g")
    .attr("transform", `translate(${width - 210}, 52)`);

  legend.append("text")
    .attr("class", "platform-label")
    .attr("x", 0).attr("y", 0)
    .attr("fill-opacity", 0.5)
    .text("Color = platform with most content");

  Object.entries(platformColors).forEach(([label, color], i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${22 + i * 20})`);
    row.append("circle")
      .attr("cx", 6).attr("cy", 0).attr("r", 5)
      .attr("fill", color).attr("fill-opacity", 0.9);
    row.append("text")
      .attr("class", "platform-label")
      .attr("x", 16).attr("y", 4)
      .text(label);
  });
}

// ─── Interaction ──────────────────────────────────────────────────────────────

function refreshAll() {
  updateGlobePaths();
  updatePins();
  drawLabels();
}


svg.call(
  d3.zoom()
    .filter((event) => {
      return event.type === "wheel";
    })
    .scaleExtent([1, 5])
    .on("zoom", function(event) {
      event.sourceEvent?.preventDefault();
      setZoom(event.transform.k);
    })
);

let m0, o0;

svg.call(
  d3.drag()
    .on("start", function(event) {
      m0 = [event.x, event.y];
      o0 = (() => {
        const r = projection.rotate();
        return [-r[0], -r[1]];
      })();
    })
    .on("drag", function(event) {
      if (!m0) return;
      const m1 = [event.x, event.y];
      projection.rotate([
        -(o0[0] + (m0[0] - m1[0]) / 4),
        -(o0[1] + (m1[1] - m0[1]) / 4)
      ]);
      refreshAll();
    })
);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
  d3.csv("data/netflix_titles.csv"),
  d3.csv("data/amazon_prime_titles.csv"),
  d3.csv("data/disney_plus_titles.csv")
]).then(([world, netflix, amazon, disney]) => {
  worldCountries = topojson.feature(world, world.objects.countries);

  const yearLabel  = document.getElementById("yearLabel");
  const yearSlider = document.getElementById("yearSlider");
  if (yearLabel)  yearLabel.textContent = selectedYear;
  if (yearSlider) yearSlider.value      = selectedYear;

  function rebuildAndRender() {
    allCounts = buildPlatformCountryCounts([
      { platform: "Netflix",      rows: netflix },
      { platform: "Amazon Prime", rows: amazon  },
      { platform: "Disney+",      rows: disney  }
    ]);
    const maxTotal = d3.max(
      d3.rollups(allCounts, v => d3.sum(v, d => d.count), d => d.country),
      ([, v]) => v
    ) || 1;
    rScale.domain([0, maxTotal]);
    updatePins();
  }

  drawGlobe();
  rebuildAndRender();
  drawLabels();

  document.getElementById("typeFilter").addEventListener("change", rebuildAndRender);

  if (yearSlider) {
    yearSlider.addEventListener("input", function() {
      selectedYear = +this.value;
      if (yearLabel) yearLabel.textContent = selectedYear;
      rebuildAndRender();
    });
  }
});