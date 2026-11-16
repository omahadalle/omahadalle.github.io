/* Somalia coastal locations map. Data comes from data/locations.js and data/land.js. */
(function () {
  "use strict";

  const P = window.COAST_LOCATIONS || [];
  const LAND = window.COAST_LAND || { type: "FeatureCollection", features: [] };
  const REGIONS = window.COAST_REGIONS || { type: "FeatureCollection", features: [] };
  const WORLD = window.COAST_WORLD || { type: "FeatureCollection", features: [] };

  // Layer groups: must match the order in tools/build_data.py
  const GROUPS = [
    { name: "Settlements",                   color: "#ff3b30" },
    { name: "Water (wells, springs, wadis)", color: "#00c8ff" },
    { name: "Capes, points & bays",          color: "#39ff14" },
    { name: "Islands, reefs & shoals",       color: "#ff4fd8" },
    { name: "Hills, dunes & land",           color: "#ffd400" },
    { name: "Other (localities, areas)",     color: "#ffffff" },
  ];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const map = L.map("map", { preferCanvas: true, zoomSnap: 0.5, minZoom: 2, worldCopyJump: true,
    maxBounds: [[-85, -400], [85, 400]], maxBoundsViscosity: 0.8 });

  // ---- Backgrounds ----
  // The whole world (lighter outlines), then the detailed countries near Somalia on top
  const countryStyle = { color: "#6b6b6b", weight: 0.6, fillColor: "#e4e1d8", fillOpacity: 1 };
  const nameTip = (f, layer) => layer.bindTooltip(esc(f.properties.name), { sticky: true, className: "region-tip" });
  const world = L.geoJSON(WORLD, { style: countryStyle, onEachFeature: nameTip });
  const neighbours = L.geoJSON(LAND, {
    onEachFeature: (f, layer) => { if (!f.properties.base) nameTip(f, layer); },
    // the "base" shape is Somalia in sand colour with no outline, under the regions,
    // so small differences between the two datasets' borders leave no gaps
    style: f => f.properties.base
      ? { stroke: false, fillColor: "#f1e4c3", fillOpacity: 1 }
      : { color: "#6b6b6b", weight: 0.8, fillColor: "#e4e1d8", fillOpacity: 1 },
  });
  // Somalia as one country, divided into its 18 regions (amCharts geodata)
  const regions = L.geoJSON(REGIONS, {
    style: { color: "#8a7650", weight: 0.8, fillColor: "#f1e4c3", fillOpacity: 1 },
    onEachFeature: (f, layer) => {
      layer.bindTooltip(esc(f.properties.name), { sticky: true, className: "region-tip" });
      layer.on("mouseover", () => layer.setStyle({ fillColor: "#ead7a6" }));
      layer.on("mouseout", () => layer.setStyle({ fillColor: "#f1e4c3" }));
    },
  });
  // Region names, shown when zoomed in
  const regionNames = L.layerGroup(REGIONS.features.map(f => {
    const c = L.geoJSON(f).getBounds().getCenter();
    const p = (window.REGION_LABEL_AT || {})[f.properties.name] || [c.lat, c.lng];
    return L.marker(p, { interactive: false, keyboard: false,
      icon: L.divIcon({ className: "reg", html: esc(f.properties.name), iconSize: null }) });
  }));
  const label = (ll, text, cls) =>
    L.marker(ll, { interactive: false, keyboard: false, icon: L.divIcon({ className: cls, html: text, iconSize: null }) });
  const landMap = L.layerGroup([
    world, neighbours, regions,
    label([4.6, 44.5], "SOMALIA", "so"), label([8.2, 40.2], "ETHIOPIA", "lbl"), label([1.0, 38.6], "KENYA", "lbl"),
    label([11.85, 42.15], "DJIBOUTI", "lbl"), label([14.6, 47.0], "YEMEN", "lbl"),
    label([12.6, 46.6], "Gulf of Aden", "sea"), label([4.0, 51.0], "INDIAN OCEAN", "sea"),
  ]);
  const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 18, attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics" });
  const satLabels = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 18, attribution: "Labels &copy; Esri" });
  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" });

  landMap.addTo(map);
  L.control.layers({
    "Land map": landMap,
    "Satellite": L.layerGroup([sat, satLabels]),
    "Street map": osm,
  }, null, { collapsed: true }).addTo(map);
  const scale = L.control.scale();
  const fitScale = () => { const small = map.getSize().x < 560;
    small ? scale.remove() : scale.addTo(map); };
  map.attributionControl.addAttribution('Regions: <a href="https://www.amcharts.com/" target="_blank" rel="noopener">amCharts</a> · Land: Natural Earth');
  // Region names appear from zoom 7 on the land map
  const toggleRegionNames = () => {
    const show = map.getZoom() >= 7 && map.hasLayer(landMap);
    show ? regionNames.addTo(map) : map.removeLayer(regionNames);
  };
  map.on("zoomend baselayerchange", toggleRegionNames);
  // Country and sea labels only from zoom 4, so they don't pile up on the world view
  const labelsLayer = L.layerGroup();
  landMap.eachLayer(l => { if (l instanceof L.Marker) { landMap.removeLayer(l); labelsLayer.addLayer(l); } });
  const toggleLabels = () => (map.getZoom() >= 4 && map.hasLayer(landMap)) ? labelsLayer.addTo(map) : map.removeLayer(labelsLayer);
  map.on("zoomend baselayerchange", toggleLabels);

  // ---- Points ----
  const layers = GROUPS.map(() => L.layerGroup());
  const markers = [];
  P.forEach(p => {
    const m = L.circleMarker([p.y, p.x], { radius: 4, weight: 1, color: "#111", fillColor: GROUPS[p.g].color, fillOpacity: 1 })
      .bindTooltip(esc(p.n) + (p.u ? " †" : ""))
      .bindPopup(
        `<b>${esc(p.n)}</b>${p.u ? " †" : ""}<br>${esc(p.t)} · ${esc(p.r)}<br>${esc(p.c)}`
        + (p.a ? `<br><i>Also: ${esc(p.a)}</i>` : ""));
    m.addTo(layers[p.g]);
    markers.push([p, m]);
  });
  // Add in reverse so settlements are drawn on top
  [...layers].reverse().forEach(l => l.addTo(map));
  const restack = () => [...layers].reverse().forEach(l => map.hasLayer(l) && l.eachLayer(m => m.bringToFront()));

  // Dots grow as you zoom in, so the coastline stays visible from far out
  const sizeDots = () => {
    const z = map.getZoom();
    const r = z <= 5 ? 2.5 : z <= 6 ? 3.5 : z <= 8 ? 5 : z <= 10 ? 6.5 : 8;
    markers.forEach(([, m]) => m.setStyle({ radius: r, weight: z <= 6 ? 1 : 2 }));
  };
  map.on("zoomend", sizeDots);

  // ---- Legend with on/off per group ----
  const legend = L.control({ position: "bottomleft" });
  legend.onAdd = () => {
    const d = L.DomUtil.create("div", "panel legend");
    d.innerHTML = `<h3>${P.length.toLocaleString()} places</h3><div class="rows">`
      + GROUPS.map((g, i) => {
          const n = P.filter(p => p.g === i).length;
          return n ? `<label><input type="checkbox" checked data-i="${i}"> <span class="dot" style="background:${g.color}"></span>${esc(g.name)} (${n})</label>` : "";
        }).join("")
      + `</div><button class="btn legend-toggle" type="button">Legend</button>`;
    d.querySelectorAll("input").forEach(cb => cb.addEventListener("change", e => {
      const l = layers[+e.target.dataset.i];
      e.target.checked ? l.addTo(map) : map.removeLayer(l);
      restack();
    }));
    d.querySelector(".legend-toggle").addEventListener("click", () => d.classList.toggle("open"));
    // In a small map (phone, or embedded in a page) the legend folds into a button
    const fit = () => {
      const s = map.getSize();
      d.classList.toggle("compact", s.x < 760 || s.y < 620);
    };
    map.on("resize", fit); setTimeout(fit, 0);
    L.DomEvent.disableClickPropagation(d);
    return d;
  };
  legend.addTo(map);

  // ---- Search by name (also matches other spellings), in the top bar ----
  const q = document.getElementById("q"), res = document.getElementById("res");
  const closeRes = () => { res.hidden = true; res.innerHTML = ""; if (window.__reportHeight) window.__reportHeight(); };
  const go = (p, m) => {
    if (document.body.classList.contains("map-hidden")) window.__showMap();
    layers[p.g].addTo(map); restack(); map.setView([p.y, p.x], 12); m.openPopup();
    q.value = p.n; closeRes();
  };
  q.addEventListener("input", () => {
    const s = q.value.trim().toLowerCase();
    res.innerHTML = "";
    if (s.length < 2) { res.hidden = true; return; }
    // Best matches first: exact name, name starts with it, a word starts with it, anywhere in the name, other spellings
    const rank = p => {
      const n = p.n.toLowerCase(), a = p.a.toLowerCase();
      if (n === s) return 0;
      if (n.startsWith(s)) return 1;
      if (n.split(/[\s,()'-]+/).some(w => w.startsWith(s))) return 2;
      if (n.includes(s)) return 3;
      if (a.split(/;\s*/).some(v => v === s || v.startsWith(s))) return 4;
      if (a.includes(s)) return 5;
      return -1;
    };
    const hits = markers.map(([p, m]) => [p, m, rank(p)]).filter(x => x[2] >= 0)
      .sort((x, y) => x[2] - y[2] || x[0].n.localeCompare(y[0].n)).slice(0, 30);
    hits.forEach(([p, m]) => {
      const row = document.createElement("div");
      row.tabIndex = 0;
      row.setAttribute("role", "option");
      row.innerHTML = `<span class="dot" style="background:${GROUPS[p.g].color}"></span>${esc(p.n)} <span class="muted">${esc(p.t)}</span>`;
      row.addEventListener("click", () => go(p, m));
      row.addEventListener("keydown", e => { if (e.key === "Enter") go(p, m); });
      res.appendChild(row);
    });
    if (!hits.length) res.innerHTML = '<div class="muted none">No matches</div>';
    res.hidden = false;
    if (window.__reportHeight) window.__reportHeight();
  });
  q.addEventListener("keydown", e => {
    if (e.key === "Enter") { const first = res.querySelector("[role=option]"); if (first) first.click(); }
    if (e.key === "Escape") closeRes();
    if (e.key === "ArrowDown") { const first = res.querySelector("[role=option]"); if (first) { e.preventDefault(); first.focus(); } }
  });
  document.addEventListener("click", e => { if (!e.target.closest(".search")) closeRes(); });

  // ---- Start view ----
  const startView = () => {
    if (P.length) map.fitBounds(L.latLngBounds(P.map(p => [p.y, p.x])).pad(0.05));
    else map.setView([5.5, 46.5], 5);
  };
  startView();
  sizeDots();
  fitScale(); map.on("resize", fitScale);
  toggleRegionNames();
  toggleLabels();

  // ---- Eye button: show / hide the map (hidden when the page opens) ----
  const eyeBtn = document.getElementById("eyeBtn");
  let firstShow = true, settleUntil = 0, settleTimer;
  // When embedded, the frame grows after the eye is clicked: re-measure, and re-centre on the first opening
  window.addEventListener("resize", () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (document.body.classList.contains("map-hidden")) return;
      map.invalidateSize();
      if (Date.now() < settleUntil) startView();
    }, 120);
  });
  const setMapShown = shown => {
    document.body.classList.toggle("map-hidden", !shown);
    document.body.classList.toggle("map-shown", shown);
    eyeBtn.setAttribute("aria-expanded", String(shown));
    eyeBtn.title = shown ? "Hide map" : "Show map";
    if (shown) {
      map.invalidateSize();              // the map was hidden, so measure it again
      if (firstShow) { startView(); firstShow = false; settleUntil = Date.now() + 1500; }
      map.fire("resize");
    }
    if (window.__reportHeight) window.__reportHeight();
  };
  eyeBtn.addEventListener("click", () => setMapShown(document.body.classList.contains("map-hidden")));
  window.__showMap = () => setMapShown(true);

  // ---- About dialog ----
  const dlg = document.getElementById("about");
  document.getElementById("aboutBtn").addEventListener("click", () => {
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    reportHeight();
  });
  dlg.addEventListener("close", () => reportHeight());

  // ---- Embedded in another page (iframe): tell the page how tall to make the frame ----
  // The page's embed snippet listens for these messages; see embed-snippet.html.
  function reportHeight() {
    if (window.parent === window) return;
    const shown = !document.body.classList.contains("map-hidden");
    let h = document.querySelector(".topbar").getBoundingClientRect().height;
    if (!res.hidden) h = Math.max(h, res.getBoundingClientRect().bottom + 8);   // search results
    if (dlg.open) h = Math.max(h, dlg.getBoundingClientRect().height + 80);     // About box
    window.parent.postMessage({ type: "somalia-coast-map", shown, height: Math.ceil(h) }, "*");
  }
  window.__reportHeight = reportHeight;
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => reportHeight());
    ro.observe(document.querySelector(".topbar"));
    ro.observe(res);
  }
  reportHeight();
})();
