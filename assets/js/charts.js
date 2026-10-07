/* =========================================================================
   Dependency-free SVG chart library — EFL brand palette
   ========================================================================= */
const PALETTE = ['#e2620d', '#1d4260', '#f2a04a', '#2f7d8c', '#8a5a33',
                 '#c23b2e', '#5b7f9e', '#d98f2b', '#3f6b52', '#9a8fb5'];
const SCOPE_COLOR = { 1: '#1d4260', 2: '#2f7d8c', 3: '#e2620d' };

/* Heat ramp: pale sand → EFL orange → deep ember */
const HEAT_STOPS = [
  [0.00, [255, 247, 237]],
  [0.20, [253, 224, 186]],
  [0.40, [249, 186, 118]],
  [0.60, [242, 138, 47]],
  [0.80, [214, 88, 13]],
  [1.00, [140, 43, 12]]
];
function heatColor(t) {
  t = Math.min(Math.max(t, 0), 1);
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    if (t <= HEAT_STOPS[i][0]) {
      const [p0, c0] = HEAT_STOPS[i - 1], [p1, c1] = HEAT_STOPS[i];
      const k = (t - p0) / (p1 - p0 || 1);
      return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * k)},${Math.round(c0[1] + (c1[1] - c0[1]) * k)},${Math.round(c0[2] + (c1[2] - c0[2]) * k)})`;
    }
  }
  return 'rgb(140,43,12)';
}

const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text !== undefined) n.textContent = text;
  return n;
}
function svgRoot(w, h) {
  return el('svg', { viewBox: `0 0 ${w} ${h}`, class: 'chart', preserveAspectRatio: 'xMidYMid meet' });
}
function tip(host) {
  let t = host.querySelector('.chart-tip');
  if (!t) { t = document.createElement('div'); t.className = 'chart-tip'; host.appendChild(t); }
  return t;
}
function bindTip(host, node, html) {
  const t = tip(host);
  node.addEventListener('mousemove', e => {
    const r = host.getBoundingClientRect();
    t.innerHTML = html;
    t.style.opacity = 1;
    t.style.left = Math.min(Math.max(e.clientX - r.left, 70), r.width - 70) + 'px';
    t.style.top = (e.clientY - r.top - 12) + 'px';
  });
  node.addEventListener('mouseleave', () => { t.style.opacity = 0; });
}
function legend(items) {
  const d = document.createElement('div');
  d.className = 'legend';
  items.forEach(i => {
    const x = document.createElement('span');
    x.className = 'legend-item';
    x.innerHTML = `<i style="background:${i.color}"></i>${i.name}`;
    d.appendChild(x);
  });
  return d;
}

/* ---------------- Line / area ---------------- */
function lineChart(host, { labels, series, yLabel = 'tCO2e', area = true }) {
  host.innerHTML = '';
  const W = 760, H = 300, P = { t: 18, r: 18, b: 34, l: 58 };
  const s = svgRoot(W, H);
  const maxV = Math.max(...series.flatMap(x => x.values)) * 1.12 || 1;
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const X = i => P.l + (labels.length === 1 ? iw / 2 : (i * iw) / (labels.length - 1));
  const Y = v => P.t + ih - (v / maxV) * ih;

  for (let g = 0; g <= 4; g++) {
    const y = P.t + (ih * g) / 4;
    s.appendChild(el('line', { x1: P.l, x2: W - P.r, y1: y, y2: y, class: 'gl' }));
    s.appendChild(el('text', { x: P.l - 10, y: y + 4, class: 'axis', 'text-anchor': 'end' }, fmtK(maxV - (maxV * g) / 4)));
  }
  labels.forEach((l, i) => {
    if (labels.length > 14 && i % 2) return;
    s.appendChild(el('text', { x: X(i), y: H - 12, class: 'axis', 'text-anchor': 'middle' }, l));
  });

  series.forEach((ser, si) => {
    const color = ser.color || PALETTE[si % PALETTE.length];
    const pts = ser.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
    if (area) {
      const gid = 'g' + Math.random().toString(36).slice(2, 8);
      const defs = el('defs');
      const lg = el('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
      lg.appendChild(el('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.24 }));
      lg.appendChild(el('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0.02 }));
      defs.appendChild(lg); s.appendChild(defs);
      s.appendChild(el('polygon', { points: `${P.l},${P.t + ih} ${pts} ${X(labels.length - 1)},${P.t + ih}`, fill: `url(#${gid})` }));
    }
    s.appendChild(el('polyline', { points: pts, fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    ser.values.forEach((v, i) => {
      const c = el('circle', { cx: X(i), cy: Y(v), r: 3.2, fill: '#fff', stroke: color, 'stroke-width': 2 });
      bindTip(host, c, `<b>${labels[i]}</b><br>${ser.name}: ${fmt(v, 0)} ${yLabel}`);
      s.appendChild(c);
    });
  });
  host.appendChild(s);
  host.appendChild(legend(series.map((x, i) => ({ name: x.name, color: x.color || PALETTE[i % PALETTE.length] }))));
}

/* ---------------- Stacked bars ---------------- */
function stackedBar(host, { labels, series, yLabel = 'tCO2e' }) {
  host.innerHTML = '';
  const W = 760, H = 300, P = { t: 18, r: 18, b: 34, l: 58 };
  const s = svgRoot(W, H);
  const totals = labels.map((_, i) => series.reduce((a, x) => a + x.values[i], 0));
  const maxV = Math.max(...totals) * 1.12 || 1;
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const bw = Math.min(46, (iw / labels.length) * 0.62);
  const X = i => P.l + (iw / labels.length) * (i + 0.5);
  const Y = v => P.t + ih - (v / maxV) * ih;

  for (let g = 0; g <= 4; g++) {
    const y = P.t + (ih * g) / 4;
    s.appendChild(el('line', { x1: P.l, x2: W - P.r, y1: y, y2: y, class: 'gl' }));
    s.appendChild(el('text', { x: P.l - 10, y: y + 4, class: 'axis', 'text-anchor': 'end' }, fmtK(maxV - (maxV * g) / 4)));
  }
  labels.forEach((l, i) => {
    let acc = 0;
    series.forEach((ser, si) => {
      const v = ser.values[i];
      const y0 = Y(acc), y1 = Y(acc + v);
      const r = el('rect', { x: X(i) - bw / 2, y: y1, width: bw, height: Math.max(0, y0 - y1),
        fill: ser.color || PALETTE[si % PALETTE.length], rx: 2 });
      bindTip(host, r, `<b>${l}</b><br>${ser.name}: ${fmt(v, 0)} ${yLabel}<br>Total: ${fmt(totals[i], 0)}`);
      s.appendChild(r); acc += v;
    });
    s.appendChild(el('text', { x: X(i), y: H - 12, class: 'axis', 'text-anchor': 'middle' }, l));
  });
  host.appendChild(s);
  host.appendChild(legend(series.map((x, i) => ({ name: x.name, color: x.color || PALETTE[i % PALETTE.length] }))));
}

/* ---------------- Horizontal bars ---------------- */
function hBar(host, { items, unit = 'tCO2e', color, max }) {
  host.innerHTML = '';
  const maxV = max || Math.max(...items.map(i => i.value)) || 1;
  const wrap = document.createElement('div');
  wrap.className = 'hbar-wrap';
  items.forEach((it, i) => {
    const row = document.createElement('div');
    row.className = 'hbar-row';
    row.innerHTML = `
      <span class="hbar-label" title="${it.key}">${it.key}</span>
      <span class="hbar-track"><span class="hbar-fill" style="width:${(it.value / maxV) * 100}%;color:${color || PALETTE[i % PALETTE.length]}"></span></span>
      <span class="hbar-val">${fmt(it.value, it.decimals ?? 0)}</span>`;
    wrap.appendChild(row);
  });
  const foot = document.createElement('div');
  foot.className = 'chart-foot'; foot.textContent = unit;
  host.appendChild(wrap); host.appendChild(foot);
}

/* ---------------- Donut ---------------- */
function donut(host, { items, centerLabel, centerValue }) {
  host.innerHTML = '';
  const W = 260, H = 260, R = 108, r = 70, cx = W / 2, cy = H / 2;
  const s = svgRoot(W, H);
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  let ang = -Math.PI / 2;
  items.forEach((it, i) => {
    const a2 = ang + (it.value / total) * Math.PI * 2;
    const large = a2 - ang > Math.PI ? 1 : 0;
    const p = el('path', {
      d: `M ${cx + R * Math.cos(ang)} ${cy + R * Math.sin(ang)}
          A ${R} ${R} 0 ${large} 1 ${cx + R * Math.cos(a2)} ${cy + R * Math.sin(a2)}
          L ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)}
          A ${r} ${r} 0 ${large} 0 ${cx + r * Math.cos(ang)} ${cy + r * Math.sin(ang)} Z`,
      fill: it.color || PALETTE[i % PALETTE.length], stroke: '#fff', 'stroke-width': 2
    });
    bindTip(host, p, `<b>${it.key}</b><br>${fmt(it.value, 0)} tCO2e<br>${((it.value / total) * 100).toFixed(1)}%`);
    s.appendChild(p); ang = a2;
  });
  s.appendChild(el('text', { x: cx, y: cy - 4, class: 'donut-val', 'text-anchor': 'middle' }, centerValue));
  s.appendChild(el('text', { x: cx, y: cy + 18, class: 'donut-lab', 'text-anchor': 'middle' }, centerLabel));
  host.appendChild(s);
  host.appendChild(legend(items.map((x, i) => ({ name: x.key, color: x.color || PALETTE[i % PALETTE.length] }))));
}

/* ---------------- Target pathway ---------------- */
function pathwayChart(host, { years, actual, pathway, labelA = 'Actual', labelB = 'Required pathway' }) {
  host.innerHTML = '';
  const W = 760, H = 300, P = { t: 18, r: 18, b: 34, l: 62 };
  const s = svgRoot(W, H);
  const maxV = Math.max(...actual.filter(v => v != null), ...pathway) * 1.12;
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const X = i => P.l + (i * iw) / (years.length - 1);
  const Y = v => P.t + ih - (v / maxV) * ih;
  for (let g = 0; g <= 4; g++) {
    const y = P.t + (ih * g) / 4;
    s.appendChild(el('line', { x1: P.l, x2: W - P.r, y1: y, y2: y, class: 'gl' }));
    s.appendChild(el('text', { x: P.l - 10, y: y + 4, class: 'axis', 'text-anchor': 'end' }, fmtK(maxV - (maxV * g) / 4)));
  }
  years.forEach((y, i) => s.appendChild(el('text', { x: X(i), y: H - 12, class: 'axis', 'text-anchor': 'middle' }, y)));
  s.appendChild(el('polyline', { points: pathway.map((v, i) => `${X(i)},${Y(v)}`).join(' '),
    fill: 'none', stroke: '#a9b8c4', 'stroke-width': 1.8, 'stroke-dasharray': '6 5' }));
  const av = actual.map((v, i) => v == null ? null : `${X(i)},${Y(v)}`).filter(Boolean).join(' ');
  s.appendChild(el('polyline', { points: av, fill: 'none', stroke: '#e2620d', 'stroke-width': 2.8, 'stroke-linecap': 'round' }));
  actual.forEach((v, i) => {
    if (v == null) return;
    const c = el('circle', { cx: X(i), cy: Y(v), r: 4, fill: '#fff', stroke: '#e2620d', 'stroke-width': 2.4 });
    bindTip(host, c, `<b>${years[i]}</b><br>${labelA}: ${fmt(v, 0)} tCO2e<br>${labelB}: ${fmt(pathway[i], 0)}`);
    s.appendChild(c);
  });
  host.appendChild(s);
  host.appendChild(legend([{ name: labelA, color: '#e2620d' }, { name: labelB, color: '#a9b8c4' }]));
}

/* ---------------- Hotspot strip ---------------- */
function hotspotGrid(host, items) {
  host.innerHTML = '';
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  const maxV = Math.max(...items.map(i => i.value)) || 1;
  const wrap = document.createElement('div');
  wrap.className = 'hotspot-grid';
  items.forEach(it => {
    const pct = (it.value / total) * 100;
    const d = document.createElement('div');
    d.className = 'hotspot';
    d.style.flex = Math.max(pct, 3);
    d.style.background = heatColor(it.value / maxV);
    if (it.value / maxV < 0.42) d.classList.add('dark-text');
    d.innerHTML = `<span class="hs-k">${it.key}</span><span class="hs-v">${fmtK(it.value)}</span><span class="hs-p">${pct.toFixed(1)}%</span>`;
    wrap.appendChild(d);
  });
  host.appendChild(wrap);
}

/* ---------------- Segmented ring gauge ---------------- */
function ringGauge(host, { pct, label, sub, color, size = 148, segments = 42 }) {
  const W = size, H = size, cx = W / 2, cy = H / 2;
  const R = size * 0.42, r = size * 0.31;
  const s = svgRoot(W, H);
  const col = color || (pct >= 85 ? '#2f7d8c' : pct >= 60 ? '#e2620d' : pct >= 40 ? '#d98f2b' : '#c23b2e');
  const START = -Math.PI * 0.75, SWEEP = Math.PI * 1.5;
  const lit = Math.round((Math.min(Math.max(pct, 0), 100) / 100) * segments);
  for (let i = 0; i < segments; i++) {
    const a = START + (i / segments) * SWEEP;
    s.appendChild(el('line', {
      x1: cx + r * Math.cos(a), y1: cy + r * Math.sin(a),
      x2: cx + R * Math.cos(a), y2: cy + R * Math.sin(a),
      stroke: i < lit ? col : '#e8eef3', 'stroke-width': size * 0.032, 'stroke-linecap': 'round'
    }));
  }
  s.appendChild(el('text', { x: cx, y: cy + 3, 'text-anchor': 'middle',
    style: `font-family:var(--font);font-size:${size * 0.20}px;font-weight:700;fill:#132c42` }, Math.round(pct) + '%'));
  if (label) s.appendChild(el('text', { x: cx, y: cy + size * 0.165, 'text-anchor': 'middle',
    style: `font-family:var(--font);font-size:${size * 0.078}px;fill:#4a6478;font-weight:600` }, label));
  const cell = document.createElement('div');
  cell.className = 'gauge-cell';
  cell.appendChild(s);
  if (sub) { const d = document.createElement('div'); d.className = 'g-sub'; d.textContent = sub; cell.appendChild(d); }
  bindTip(host, s, `<b>${label || ''}</b><br>${sub || ''}<br>${pct.toFixed(1)}%`);
  host.appendChild(cell);
}
function gaugeRow(host, items) {
  host.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'gauge-row';
  host.appendChild(row);
  items.forEach(i => ringGauge(row, i));
}

/* ---------------- Central emission sphere ---------------- */
function emissionOrb(host, { value, unit = 'tCO₂e', label = 'Total Carbon Emission', size = 250 }) {
  host.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'orb-wrap';
  const W = size, H = size, cx = W / 2, cy = H / 2;
  const s = svgRoot(W, H);

  const defs = el('defs');
  const rg = el('radialGradient', { id: 'orbg', cx: '36%', cy: '30%', r: '74%' });
  rg.appendChild(el('stop', { offset: '0%', 'stop-color': '#ffffff' }));
  rg.appendChild(el('stop', { offset: '46%', 'stop-color': '#fdf0e2' }));
  rg.appendChild(el('stop', { offset: '100%', 'stop-color': '#f6d6b4' }));
  defs.appendChild(rg); s.appendChild(defs);

  const cr = size * 0.30;
  s.appendChild(el('circle', { cx, cy, r: cr * 1.30, fill: '#e2620d', opacity: .05 }));
  s.appendChild(el('circle', { cx, cy, r: cr * 1.12, fill: '#e2620d', opacity: .08 }));
  s.appendChild(el('circle', { cx, cy, r: cr, fill: 'url(#orbg)', stroke: '#eab887', 'stroke-width': 1.2 }));
  for (let i = 1; i <= 4; i++) {
    const ry = cr * Math.sin((i / 5) * Math.PI / 2);
    s.appendChild(el('ellipse', { cx, cy, rx: cr, ry, fill: 'none', stroke: '#eec9a0', 'stroke-width': .8 }));
  }
  for (let i = 0; i < 6; i++) {
    const rx = cr * Math.abs(Math.cos((i / 6) * Math.PI));
    s.appendChild(el('ellipse', { cx, cy, rx: Math.max(rx, 1), ry: cr, fill: 'none', stroke: '#eec9a0', 'stroke-width': .8 }));
  }
  const ring = el('g');
  const segments = 72;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const R1 = cr * 1.40, R2 = cr * (i % 6 === 0 ? 1.55 : 1.47);
    ring.appendChild(el('line', {
      x1: cx + R1 * Math.cos(a), y1: cy + R1 * Math.sin(a),
      x2: cx + R2 * Math.cos(a), y2: cy + R2 * Math.sin(a),
      stroke: i % 6 === 0 ? '#e2620d' : '#d8e0e7', 'stroke-width': i % 6 === 0 ? 1.8 : 1
    }));
  }
  ring.appendChild(el('animateTransform', { attributeName: 'transform', type: 'rotate',
    from: `0 ${cx} ${cy}`, to: `360 ${cx} ${cy}`, dur: '60s', repeatCount: 'indefinite' }));
  s.appendChild(ring);

  const arcG = el('g');
  const AR = cr * 1.66;
  arcG.appendChild(el('path', {
    d: `M ${cx + AR} ${cy} A ${AR} ${AR} 0 0 1 ${cx - AR * 0.5} ${cy + AR * 0.866}`,
    fill: 'none', stroke: '#1d4260', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .5 }));
  arcG.appendChild(el('animateTransform', { attributeName: 'transform', type: 'rotate',
    from: `360 ${cx} ${cy}`, to: `0 ${cx} ${cy}`, dur: '38s', repeatCount: 'indefinite' }));
  s.appendChild(arcG);

  wrap.appendChild(s);
  const cap = document.createElement('div');
  cap.className = 'orb-caption';
  cap.innerHTML = `<div class="oc-l">${label}</div><div class="oc-v">${value}</div><div class="oc-u">${unit}</div>`;
  wrap.appendChild(cap);
  host.appendChild(wrap);
}

/* =========================================================================
   Geographic heatmap — equirectangular, density field + site markers
   ========================================================================= */
const LANDMASS = [
  "M 62,40 L 96,34 L 140,32 L 176,38 L 196,52 L 214,50 L 224,62 L 206,78 L 196,96 L 184,112 L 172,126 L 160,120 L 150,132 L 140,124 L 126,104 L 106,86 L 84,72 L 66,58 Z",
  "M 160,132 L 176,140 L 190,152 L 200,164 L 192,168 L 178,158 L 164,146 Z",
  "M 196,166 L 216,162 L 232,172 L 240,192 L 238,214 L 228,238 L 216,258 L 204,264 L 196,250 L 190,226 L 186,200 L 190,180 Z",
  "M 246,20 L 278,16 L 296,28 L 288,46 L 266,52 L 250,40 Z",
  "M 312,52 L 344,46 L 372,50 L 388,60 L 380,74 L 360,82 L 344,92 L 326,86 L 314,72 Z",
  "M 320,104 L 356,98 L 386,104 L 398,124 L 392,150 L 380,176 L 366,200 L 350,218 L 336,212 L 328,188 L 320,160 L 314,132 Z",
  "M 392,84 L 424,78 L 448,86 L 452,104 L 436,116 L 412,112 L 396,100 Z",
  "M 400,40 L 452,32 L 508,34 L 556,44 L 584,58 L 574,76 L 548,86 L 516,92 L 486,98 L 458,92 L 430,80 L 406,64 Z",
  "M 508,104 L 536,100 L 552,112 L 546,128 L 524,132 L 508,122 Z",
  "M 520,142 L 556,138 L 578,146 L 570,158 L 540,158 L 522,152 Z",
  "M 552,176 L 592,170 L 616,182 L 620,204 L 602,220 L 574,218 L 556,202 Z",
  "M 636,222 L 648,216 L 654,228 L 644,238 Z"
];

function geoHeatmap(host, { points, unit = 'tCO₂e', label = 'site' }) {
  host.innerHTML = '';
  const W = 700, H = 300;
  const s = svgRoot(W, H);
  s.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#f7fafc', rx: 8 }));
  for (let x = 0; x <= W; x += 50) s.appendChild(el('line', { x1: x, y1: 0, x2: x, y2: H, stroke: '#eef3f7', 'stroke-width': 1 }));
  for (let y = 0; y <= H; y += 50) s.appendChild(el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#eef3f7', 'stroke-width': 1 }));
  LANDMASS.forEach(d => s.appendChild(el('path', { d, fill: '#e6ecf1', stroke: '#d3dee6', 'stroke-width': 1, 'stroke-linejoin': 'round' })));

  const maxV = Math.max(...points.map(p => p.value)) || 1;
  const proj = (lat, lon) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];

  /* radial heat blooms — larger + softer underneath */
  const defs = el('defs');
  points.forEach((p, i) => {
    const gid = 'hg' + i;
    const t = p.value / maxV;
    const rg = el('radialGradient', { id: gid });
    rg.appendChild(el('stop', { offset: '0%', 'stop-color': heatColor(Math.min(t + .28, 1)), 'stop-opacity': 0.72 }));
    rg.appendChild(el('stop', { offset: '38%', 'stop-color': heatColor(t), 'stop-opacity': 0.30 }));
    rg.appendChild(el('stop', { offset: '100%', 'stop-color': heatColor(t), 'stop-opacity': 0 }));
    defs.appendChild(rg);
  });
  s.appendChild(defs);

  const sorted = points.slice().sort((a, b) => b.value - a.value);
  points.forEach((p, i) => {
    const [x, y] = proj(p.lat, p.lon);
    const t = p.value / maxV;
    const rad = 11 + Math.sqrt(t) * 27;
    s.appendChild(el('circle', { cx: x, cy: y, r: rad, fill: `url(#hg${i})` }));
  });

  /* crisp site markers on top */
  sorted.forEach(p => {
    const [x, y] = proj(p.lat, p.lon);
    const t = p.value / maxV;
    const g = el('g');
    g.appendChild(el('circle', { cx: x, cy: y, r: 4.6 + t * 4.5, fill: heatColor(Math.min(t + .2, 1)), stroke: '#fff', 'stroke-width': 1.6 }));
    bindTip(host, g, `<b>${p.key}</b><br>${fmt(p.value, 0)} ${unit}<br>${p.sub || ''}<br>${(t * 100).toFixed(0)}% of peak ${label}`);
    s.appendChild(g);
  });

  /* labels with simple collision avoidance */
  const placed = [];
  const LW = 62, LH = 13;
  sorted.slice(0, 10).forEach(p => {
    const [x, y] = proj(p.lat, p.lon);
    const t = p.value / maxV;
    const offsets = [[0, -(11 + t * 5)], [0, 18 + t * 4], [46, 3], [-46, 3], [40, -13], [-40, -13]];
    for (const [dx, dy] of offsets) {
      const lx = x + dx, ly = y + dy;
      if (lx < LW / 2 || lx > W - LW / 2 || ly < 10 || ly > H - 4) continue;
      const hit = placed.some(q => Math.abs(q.x - lx) < LW && Math.abs(q.y - ly) < LH);
      if (hit) continue;
      placed.push({ x: lx, y: ly });
      s.appendChild(el('line', { x1: x, y1: y, x2: lx, y2: ly - 3,
        stroke: '#b0c0cc', 'stroke-width': .8, opacity: dx || Math.abs(dy) > 16 ? .8 : 0 }));
      const bg = el('rect', { x: lx - LW / 2, y: ly - 9, width: LW, height: 12.5, rx: 3,
        fill: '#ffffff', opacity: .86 });
      s.appendChild(bg);
      s.appendChild(el('text', { x: lx, y: ly, 'text-anchor': 'middle',
        style: 'font-family:var(--font);font-size:9px;font-weight:700;fill:#132c42' },
        p.key.length > 15 ? p.key.slice(0, 14) + '…' : p.key));
      break;
    }
  });

  host.appendChild(s);

  /* continuous heat scale legend */
  const lg = document.createElement('div');
  lg.className = 'heat-legend';
  const ramp = HEAT_STOPS.map(([p, c]) => `rgb(${c.join(',')}) ${p * 100}%`).join(',');
  lg.innerHTML = `<span class="hl-lab">Low</span>
    <span class="hl-ramp" style="background:linear-gradient(90deg,${ramp})"></span>
    <span class="hl-lab">High</span>
    <span class="hl-note">Colour &amp; bloom intensity ∝ ${unit} YTD · peak ${fmt(maxV, 0)}</span>`;
  host.appendChild(lg);
}

/* =========================================================================
   Matrix heatmap — location × month
   ========================================================================= */
function matrixHeatmap(host, { rows, cols, values, unit = 'tCO₂e', rowLabelWidth = 150 }) {
  host.innerHTML = '';
  const flat = values.flat();
  const maxV = Math.max(...flat) || 1;
  const minV = Math.min(...flat);

  const table = document.createElement('div');
  table.className = 'matrix-heat';
  table.style.setProperty('--rlw', rowLabelWidth + 'px');
  table.style.setProperty('--cols', cols.length);

  const head = document.createElement('div');
  head.className = 'mh-row mh-head';
  head.innerHTML = `<div class="mh-rowlab"></div>` + cols.map(c => `<div class="mh-colhead">${c}</div>`).join('');
  table.appendChild(head);

  rows.forEach((r, ri) => {
    const row = document.createElement('div');
    row.className = 'mh-row';
    const lab = document.createElement('div');
    lab.className = 'mh-rowlab';
    lab.innerHTML = `<span title="${r.label}">${r.label}</span><small>${r.sub || ''}</small>`;
    row.appendChild(lab);
    cols.forEach((c, ci) => {
      const v = values[ri][ci];
      const t = (v - minV) / ((maxV - minV) || 1);
      const cell = document.createElement('div');
      cell.className = 'mh-cell' + (t > 0.55 ? ' light-text' : '');
      cell.style.background = heatColor(t);
      cell.textContent = fmtK(v);
      bindTip(host, cell, `<b>${r.label}</b><br>${c}: ${fmt(v, 0)} ${unit}<br>${(t * 100).toFixed(0)}% of range peak`);
      row.appendChild(cell);
    });
    table.appendChild(row);
  });
  host.appendChild(table);

  const lg = document.createElement('div');
  lg.className = 'heat-legend';
  const ramp = HEAT_STOPS.map(([p, c]) => `rgb(${c.join(',')}) ${p * 100}%`).join(',');
  lg.innerHTML = `<span class="hl-lab">${fmtK(minV)}</span>
    <span class="hl-ramp" style="background:linear-gradient(90deg,${ramp})"></span>
    <span class="hl-lab">${fmtK(maxV)}</span>
    <span class="hl-note">${unit} per location-month</span>`;
  host.appendChild(lg);
}
