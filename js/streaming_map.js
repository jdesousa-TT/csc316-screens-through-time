// select the container that exists in index.html
const host = d3.select("#viz-streaming-map");

// clear placeholder text
host.html("");

// create wrapper
const wrapper = host.append("div")
  .attr("class", "streaming-map-wrapper");

// create SVG inside wrapper
const svg = wrapper.append("svg")
  .attr("class", "streaming-map-svg");

// create tooltip
const tooltip = wrapper.append("div")
  .attr("class", "streaming-map-tooltip hidden");

// use wrapper as container
const container = wrapper.node();

// set size — fill available viewport
const width = container.clientWidth || 1100;
const height = Math.max(520, Math.round(window.innerHeight * 0.75));

svg.attr("viewBox", `0 0 ${width} ${height}`);

const projection = d3.geoOrthographic()
  .scale(Math.min(width, height) * 0.39)
  .translate([width / 2, height / 2 + 18])
  .clipAngle(90);

const path = d3.geoPath(projection);

const root = svg.append("g");
const globeGroup = root.append("g");
const pinGroup = root.append("g");
const labelGroup = root.append("g");

const platformColors = {
  "Netflix": "#c94b45",
  "Amazon Prime": "#4f7fd9",
  "Disney+": "#7c4fb6"
};

// year state
let selectedYear = 2023;

// Representative coordinates for countries used in CSVs
const countryCoords = {
  "United States": [-98, 39],
  "Canada": [-106, 56],
  "Mexico": [-102, 23],
  "Brazil": [-52, -10],
  "Argentina": [-64, -34],
  "Chile": [-71, -30],
  "Colombia": [-74, 4],
  "Peru": [-75, -10],
  "Venezuela": [-66, 7],
  "Uruguay": [-56, -33],
  "Paraguay": [-58, -23],
  "Ecuador": [-78, -1],
  "Bolivia": [-64, -17],
  "Guatemala": [-90, 15],
  "Costa Rica": [-84, 10],
  "Panama": [-80, 8],
  "Dominican Republic": [-70, 19],
  "Puerto Rico": [-66, 18],
  "Cuba": [-79, 21],
  "Jamaica": [-77, 18],
  "Honduras": [-86.5, 15],
  "Nicaragua": [-85, 13],
  "El Salvador": [-88.9, 13.8],

  "United Kingdom": [-2, 54],
  "France": [2, 46],
  "Germany": [10, 51],
  "Spain": [-4, 40],
  "Italy": [12, 42.5],
  "Ireland": [-8, 53],
  "Belgium": [4.5, 50.5],
  "Switzerland": [8.2, 46.8],
  "Austria": [14, 47.5],
  "Netherlands": [5.5, 52.2],
  "Poland": [19, 52],
  "Denmark": [10, 56],
  "Sweden": [15, 62],
  "Norway": [9, 61],
  "Finland": [26, 64],
  "Portugal": [-8, 39.5],
  "Czech Republic": [15.5, 49.8],
  "Czechia": [15.5, 49.8],
  "Hungary": [19, 47],
  "Romania": [25, 45.8],
  "Greece": [22, 39],
  "Ukraine": [32, 49],
  "Russia": [90, 61],
  "Soviet Union": [60, 55],
  "Iceland": [-19, 65],
  "Luxembourg": [6.1, 49.8],
  "Serbia": [21, 44],
  "Croatia": [16, 45.1],

  "South Africa": [24, -29],
  "Nigeria": [8, 9],
  "Egypt": [30, 26],
  "Kenya": [37, 0.5],
  "Ghana": [-1, 7.8],
  "Morocco": [-6, 31.8],
  "Algeria": [2, 28],
  "Tunisia": [9, 34],
  "Senegal": [-14, 14],
  "Ethiopia": [40, 9],
  "Namibia": [18, -22],
  "Zimbabwe": [30, -19],
  "Cameroon": [12, 5.5],
  "Mauritius": [57.5, -20.2],

  "Turkey": [35, 39],
  "United Arab Emirates": [54, 24],
  "Saudi Arabia": [45, 24],
  "Iran": [53, 32],
  "Iraq": [44, 33],
  "Israel": [35, 31.5],
  "Jordan": [36, 31],
  "Lebanon": [35.8, 33.8],
  "Qatar": [51.2, 25.3],
  "Kuwait": [47.5, 29.3],
  "Syria": [38, 35],
  "Palestine": [35.2, 31.9],

  "India": [78, 22],
  "Pakistan": [69, 30],
  "Bangladesh": [90, 24],
  "Sri Lanka": [80.7, 7.8],
  "Nepal": [84, 28],
  "Afghanistan": [66, 34],

  "Japan": [138, 37],
  "China": [104, 35],
  "South Korea": [127.5, 36],
  "Hong Kong": [114.2, 22.3],
  "Taiwan": [121, 23.7],
  "Mongolia": [103, 46],
  "Thailand": [101, 15],
  "Indonesia": [113, -2],
  "Malaysia": [102, 4],
  "Philippines": [122, 13],
  "Vietnam": [108, 16],
  "Singapore": [103.8, 1.35],
  "Cambodia": [105, 12.7],

  "Australia": [134, -25],
  "New Zealand": [172, -42]
};

// Converts raw dataset type labels into the simplified categories used in the visualization.
function normalizeType(type) {
  if (type === "TV Show") return "TV";
  if (type === "Movie") return "Film";
  return type;
}

// Splits a comma-separated country string into a clean array of individual country names.
function splitCountries(value) {
  if (!value || typeof value !== "string") return [];
  return value.split(",").map(d => d.trim()).filter(Boolean);
}

// Returns true if a longitude/latitude point is on the visible side of the rotated globe.
function isVisible(coords) {
  const rotation = projection.rotate();
  const lon0 = -rotation[0];
  const lat0 = -rotation[1];

  const lambda = coords[0] * Math.PI / 180;
  const phi = coords[1] * Math.PI / 180;
  const lambda0 = lon0 * Math.PI / 180;
  const phi0 = lat0 * Math.PI / 180;

  const cosc =
    Math.sin(phi0) * Math.sin(phi) +
    Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0);

  return cosc > 0;
}

// Checks whether a country feature's centroid is currently visible on the front of the globe.
function isCountryVisible(feature) {
  const centroid = d3.geoCentroid(feature);
  return isVisible(centroid);
}

// Builds a flat list of title counts grouped by country, platform, and format from the CSV datasets.
function buildPlatformCountryCounts(datasets) {
  const grouped = new Map();

  datasets.forEach(({ platform, rows }) => {
    rows.forEach(row => {
      const format = normalizeType(row.type);
      if (format !== "TV" && format !== "Film") return;

      const releaseYear = +row.release_year;
      if (!Number.isFinite(releaseYear) || releaseYear > selectedYear) return;

      const countries = splitCountries(row.country).filter(country => countryCoords[country]);

      countries.forEach(country => {
        const key = `${country}|${platform}|${format}`;

        if (!grouped.has(key)) {
          grouped.set(key, {
            country,
            platform,
            format,
            count: 0,
            coords: countryCoords[country]
          });
        }

        grouped.get(key).count += 1;
      });
    });
  });

  return Array.from(grouped.values());
}

// Assigns circle size based on a platform's rank within a country (largest, middle, smallest).
function rankRadius(rank, count) {
  if (count <= 0) return 0;
  if (rank === 1) return 12;
  if (rank === 2) return 8;
  return 4;
}

// Offsets each platform's pin slightly so the three platform circles do not overlap exactly.
function platformOffset(platform) {
  if (platform === "Netflix") return { dx: 0, dy: -10 };
  if (platform === "Amazon Prime") return { dx: 9, dy: 7 };
  return { dx: -9, dy: 7 }; // Disney+
}

let worldCountries = null;
let allCounts = [];
let groupedPins = [];

// Filters and reshapes the grouped data into the final per-country pin data used for rendering.
function wranglePins() {
  const selectedType = document.getElementById("typeFilter").value;

  const filtered = allCounts.filter(d => {
    const typeMatch = selectedType === "All" || d.format === selectedType;
    return typeMatch;
  });

  const byCountryPlatform = d3.rollup(
    filtered,
    v => d3.sum(v, d => d.count),
    d => d.country,
    d => d.platform
  );

  const result = [];

  byCountryPlatform.forEach((platformMap, country) => {
    const coords = countryCoords[country];
    if (!coords) return;

    const platforms = [
      { platform: "Netflix", count: platformMap.get("Netflix") || 0 },
      { platform: "Amazon Prime", count: platformMap.get("Amazon Prime") || 0 },
      { platform: "Disney+", count: platformMap.get("Disney+") || 0 }
    ];

    const ranked = [...platforms]
      .sort((a, b) => b.count - a.count)
      .map((d, i) => ({ ...d, rank: i + 1 }));

    const rankLookup = new Map(ranked.map(d => [d.platform, d.rank]));

    platforms.forEach(d => {
      if (d.count <= 0) return;

      result.push({
        country,
        platform: d.platform,
        count: d.count,
        rank: rankLookup.get(d.platform),
        coords,
        countsByPlatform: {
          Netflix: platformMap.get("Netflix") || 0,
          "Amazon Prime": platformMap.get("Amazon Prime") || 0,
          "Disney+": platformMap.get("Disney+") || 0
        }
      });
    });
  });

  groupedPins = result;
}

// Draws the globe background, graticule, and visible country shapes for the first render.
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
    .enter()
    .append("path")
    .attr("class", d => isCountryVisible(d) ? "country" : "country backface")
    .attr("d", path);
}

// Recomputes and redraws country and globe paths after the globe is rotated.
function updateGlobePaths() {
  globeGroup.selectAll(".sphere").attr("d", path);
  globeGroup.selectAll(".graticule").attr("d", path);

  globeGroup.selectAll(".country")
    .attr("d", path)
    .attr("class", d => isCountryVisible(d) ? "country" : "country backface");
}

// Draws and updates the platform pins based on the active filters and current globe rotation.
function updatePins() {
  wranglePins();

  const selectedPlatform = document.getElementById("platformFilter").value;

  const filteredPins = groupedPins.filter(d => {
    const platformMatch = selectedPlatform === "All" || d.platform === selectedPlatform;
    return platformMatch;
  });

  const visiblePins = filteredPins.filter(d => isVisible(d.coords));

  const pinSelection = pinGroup.selectAll(".pin")
    .data(visiblePins, d => `${d.country}-${d.platform}`);

  pinSelection.exit().remove();

  const pinEnter = pinSelection.enter()
    .append("circle")
    .attr("class", "pin")
    .on("mouseenter", function(event, d) {
      d3.selectAll(".pin").classed("highlighted", false).style("opacity", 0.18);
      d3.select(this).classed("highlighted", true).style("opacity", 1);

      tooltip
        .classed("hidden", false)
        .html(`
          <strong>${d.country}</strong>
          <div><b>Netflix:</b> ${d.countsByPlatform["Netflix"]}</div>
          <div><b>Amazon Prime:</b> ${d.countsByPlatform["Amazon Prime"]}</div>
          <div><b>Disney+:</b> ${d.countsByPlatform["Disney+"]}</div>
          <div><b>Largest here:</b> ${d.rank === 1 ? d.platform : "Not this platform"}</div>
          <div><b>Year filter:</b> up to ${selectedYear}</div>
        `);
    })
    .on("mousemove", function(event) {
      const bounds = container.getBoundingClientRect();
      tooltip
        .style("left", `${event.clientX - bounds.left + 14}px`)
        .style("top", `${event.clientY - bounds.top + 14}px`);
    })
    .on("mouseleave", function() {
      d3.selectAll(".pin").classed("highlighted", false).style("opacity", 0.9);
      tooltip.classed("hidden", true);
    });

  pinEnter.merge(pinSelection)
    .attr("cx", d => {
      const base = projection(d.coords);
      const offset = platformOffset(d.platform);
      return base[0] + offset.dx;
    })
    .attr("cy", d => {
      const base = projection(d.coords);
      const offset = platformOffset(d.platform);
      return base[1] + offset.dy;
    })
    .attr("r", d => rankRadius(d.rank, d.count))
    .attr("fill", d => platformColors[d.platform])
    .attr("stroke", "#111")
    .attr("stroke-width", 1.6)
    .attr("opacity", 0.9);
}

// Adds instructional text and a small platform legend on top of the globe.
function drawLabels() {
  labelGroup.selectAll("*").remove();

  labelGroup.append("text")
    .attr("class", "hint")
    .attr("x", width / 2)
    .attr("y", 38)
    .text("Drag to rotate the globe");

  const key = labelGroup.append("g")
    .attr("transform", `translate(${width - 180}, 50)`);

  const items = [
    { label: "Netflix", color: platformColors["Netflix"] },
    { label: "Amazon Prime", color: platformColors["Amazon Prime"] },
    { label: "Disney+", color: platformColors["Disney+"] }
  ];

  items.forEach((item, i) => {
    const row = key.append("g").attr("transform", `translate(0, ${i * 22})`);

    row.append("circle")
      .attr("r", 6)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", item.color)
      .attr("stroke", "#111")
      .attr("stroke-width", 1.2);

    row.append("text")
      .attr("class", "platform-label")
      .attr("x", 14)
      .attr("y", 4)
      .attr("text-anchor", "start")
      .text(item.label);
  });
}

// Refreshes all visual layers after interaction, especially during globe rotation.
function refreshAll() {
  updateGlobePaths();
  updatePins();
  drawLabels();
}

let m0;
let o0;

svg.call(
  d3.drag()
    .on("start", function(event) {
      const lastRotation = projection.rotate();
      m0 = [event.x, event.y];
      o0 = [-lastRotation[0], -lastRotation[1]];
    })
    .on("drag", function(event) {
      if (m0) {
        const m1 = [event.x, event.y];
        const o1 = [
          o0[0] + (m0[0] - m1[0]) / 4,
          o0[1] + (m1[1] - m0[1]) / 4
        ];
        projection.rotate([-o1[0], -o1[1]]);
      }

      refreshAll();
    })
);

Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
  d3.csv("data/netflix_titles.csv"),
  d3.csv("data/amazon_prime_titles.csv"),
  d3.csv("data/disney_plus_titles.csv")
]).then(([world, netflix, amazon, disney]) => {
  worldCountries = topojson.feature(world, world.objects.countries);

  const yearLabel = document.getElementById("yearLabel");
  const yearSlider = document.getElementById("yearSlider");

  if (yearLabel) yearLabel.textContent = selectedYear;
  if (yearSlider) yearSlider.value = selectedYear;

  function rebuildAndRender() {
    allCounts = buildPlatformCountryCounts([
      { platform: "Netflix", rows: netflix },
      { platform: "Amazon Prime", rows: amazon },
      { platform: "Disney+", rows: disney }
    ]);

    updatePins();
  }

  drawGlobe();
  rebuildAndRender();
  drawLabels();

  document.getElementById("platformFilter").addEventListener("change", updatePins);
  document.getElementById("typeFilter").addEventListener("change", updatePins);

  if (yearSlider) {
    yearSlider.addEventListener("input", function() {
      selectedYear = +this.value;
      if (yearLabel) yearLabel.textContent = selectedYear;
      rebuildAndRender();
    });
  }
});