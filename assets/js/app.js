/* =========================================================================
   EFL Carbon Emission Management Platform — Application Controller
   ========================================================================= */

const STATE = {
  view: 'dashboard', year: 2026, region: 'ALL', country: 'ALL', facilityType: 'ALL',
  shipMode: 'ALL', shipTier: 'ALL', shipSearch: '', heatScope: 'ALL'
};

const VIEW_META = {
  dashboard:  ['Carbon Emission Management Dashboard', 'Group emissions position — FY2026 year to date'],
  explorer:   ['Emissions Explorer',      'Scope 1, 2 and 3 across countries, facilities and activities'],
  freight:    ['Freight & Logistics',     'Shipment-level Scope 3 Cat 4 & 9 under EN ISO 14083:2023'],
  sources:    ['Data Sources',            'Connectors, ingestion coverage and refresh status'],
  quality:    ['Data Quality & Validation','Automated rules, anomaly detection and remediation'],
  calculator: ['ISO 14083 Calculator',    'Shipment emissions engine — GLEC Framework v3.2'],
  reporting:  ['Reporting Hub',           'Sagawa, SSJB, CDP, EcoVadis and customer disclosures'],
  targets:    ['Targets & Pathway',       'Decarbonisation targets and progress tracking'],
  audit:      ['Methodology & Audit',     'Calculation basis, factor register and full audit trail']
};

const YTD_MONTHS = CURRENT_MONTH_INDEX + 1;
function baseFilters() { return { region: STATE.region, country: STATE.country, facilityType: STATE.facilityType }; }
function ytd(year, extra = {}) {
  return q({ ...baseFilters(), ...extra, year }).filter(r => r.monthIndex <= CURRENT_MONTH_INDEX);
}
function deltaPill(curr, prev) {
  if (!prev) return '<span class="delta flat">— no comparative</span>';
  const d = ((curr - prev) / prev) * 100;
  const cls = d < -0.5 ? 'down' : d > 0.5 ? 'up' : 'flat';
  const arrow = d < -0.5 ? '▼' : d > 0.5 ? '▲' : '■';
  return `<span class="delta ${cls}">${arrow} ${Math.abs(d).toFixed(1)}% vs YTD ${STATE.year - 1}</span>`;
}

/* =========================================================================
   VIEW: DASHBOARD
   ========================================================================= */
function viewDashboard() {
  const cur = ytd(STATE.year), prev = ytd(STATE.year - 1);
  const t = sum(cur), tPrev = sum(prev);
  const s = n => sum(cur.filter(r => r.scope === n));
  const sp = n => sum(prev.filter(r => r.scope === n));
  const openAnoms = DATA.anomalies.filter(a => a.status !== 'Resolved').length;
  const primaryShare = (sum(cur.filter(r => r.dataTier === 'Primary')) / (t || 1)) * 100;

  const shipCount = DATA.shipments.length;
  const totTkm = DATA.shipments.reduce((a, x) => a + x.tkm, 0);
  const freightWtw = DATA.shipments.reduce((a, x) => a + x.wtwTco2e, 0);
  const avoided = freightWtw * 0.184;

  const drivers = groupSum(cur, 'categoryId').slice(0, 8).map(g => {
    const c = DATA.categories.find(x => x.id === g.key) || {};
    const p = sum(prev.filter(r => r.categoryId === g.key));
    const chg = p ? ((g.value - p) / p) * 100 : 0;
    return { name: (c.name || g.key).replace(/^Cat \d+ — /, ''), value: g.value,
      pct: (g.value / (t || 1)) * 100, chg, band: chg > 5 ? 'red' : chg > 0 ? 'amber' : 'lime' };
  });
  const L = drivers.slice(0, 4), R = drivers.slice(4, 8);
  const tile = x => `
    <div class="kpi ${x.band}">
      <div class="lab">${x.name}</div>
      <div class="val">${fmtK(x.value)}<small>tCO₂e</small></div>
      <span class="delta ${x.chg < 0 ? 'down' : 'up'}">${x.pct.toFixed(1)}% of total ·
        ${x.chg > 0 ? '▲' : '▼'} ${Math.abs(x.chg).toFixed(1)}% YoY</span>
    </div>`;

  const el = document.createElement('div');
  el.innerHTML = `
  ${filterBar()}

  <div class="metric-band g6">
    <div class="mb"><div class="l">Total Emissions</div>
      <div class="v">${fmt(t / 1000, 1)}<small>kt CO₂e</small></div><div class="d">${deltaPill(t, tPrev)}</div></div>
    <div class="mb"><div class="l">Scope 1 — Direct</div>
      <div class="v">${fmt(s(1) / 1000, 1)}<small>kt</small></div><div class="d">${deltaPill(s(1), sp(1))}</div></div>
    <div class="mb"><div class="l">Scope 2 — Electricity</div>
      <div class="v">${fmt(s(2) / 1000, 1)}<small>kt</small></div><div class="d">${deltaPill(s(2), sp(2))}</div></div>
    <div class="mb"><div class="l">Scope 3 — Value Chain</div>
      <div class="v">${fmt(s(3) / 1000, 1)}<small>kt</small></div><div class="d">${deltaPill(s(3), sp(3))}</div></div>
    <div class="mb hl2"><div class="l">Transport Activity</div>
      <div class="v">${fmt(totTkm / 1000, 0)}<small>k t-km</small></div>
      <div class="d muted" style="font-size:10.5px">${fmt(shipCount)} shipment legs</div></div>
    <div class="mb hl"><div class="l">CO₂e Avoided</div>
      <div class="v">${fmt(avoided, 0)}<small>tCO₂e</small></div>
      <div class="d delta down">modal shift &amp; HVO</div></div>
  </div>

  <div class="grid g23" style="margin-top:14px">
    <div class="card cmd">
      <div class="card-h">
        <div><h3>Group Emission Command View</h3>
          <p>Top contributing activities · YTD ${STATE.year} · tCO₂e</p></div>
        <div class="right status-legend">
          <span><i style="background:#e2620d"></i>Reducing</span>
          <span><i style="background:#d98f2b"></i>Above plan 0–5%</span>
          <span><i style="background:#c23b2e"></i>Above plan &gt;5%</span>
        </div>
      </div>
      <div class="cmd-grid">
        <div class="cmd-col">${L.map(tile).join('')}</div>
        <div class="chart-host" id="c-orb"></div>
        <div class="cmd-col">${R.map(tile).join('')}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card">
        <div class="card-h"><div><h3>Emission Load Trend</h3>
          <p>Monthly consolidated by scope · ${STATE.year}</p></div>
          <span class="chip right">Updated 2026-09-24</span></div>
        <div class="chart-host" id="c-trend"></div>
      </div>
      <div class="card">
        <div class="card-h"><div><h3>Scope Composition</h3><p>YTD ${STATE.year}</p></div></div>
        <div class="chart-host donut-host" id="c-donut"></div>
      </div>
    </div>
  </div>

  <!-- ===== LOCATION HEATMAP ===== -->
  <div class="section-title">Location Emission Heatmap</div>
  <div class="grid g23">
    <div class="card">
      <div class="card-h">
        <div><h3>Global Site Heatmap</h3>
          <p>All ${DATA.facilities.length} operating sites · colour and bloom intensity by YTD ${STATE.year} emissions</p></div>
        <div class="right">
          <select data-state="heatScope" style="min-width:132px">
            <option value="ALL">All scopes</option>
            <option value="1" ${STATE.heatScope === '1' ? 'selected' : ''}>Scope 1 only</option>
            <option value="2" ${STATE.heatScope === '2' ? 'selected' : ''}>Scope 2 only</option>
            <option value="3" ${STATE.heatScope === '3' ? 'selected' : ''}>Scope 3 only</option>
          </select>
        </div>
      </div>
      <div class="chart-host" id="c-heatmap"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Heat Ranking</h3>
        <p>Sites ordered by intensity · kgCO₂e per m²</p></div></div>
      <div class="tbl-wrap" style="border:0;box-shadow:none;max-height:398px">
        <table class="tbl-sm"><thead><tr>
          <th>Site</th><th>Country</th><th class="num">tCO₂e</th><th class="num">Intensity</th></tr></thead>
          <tbody id="heat-rank"></tbody></table>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:14px">
    <div class="card-h"><div><h3>Site × Month Heatmap</h3>
      <p>Top 12 emitting locations by month · ${STATE.year} year to date · tCO₂e</p></div></div>
    <div class="chart-host" id="c-matrix"></div>
    <div class="note">Darker cells indicate higher emissions for that site-month. Seasonal ramps and
    unexplained spikes surface here first and are cross-checked against the validation rule library
    before a period is locked for Sagawa or SSJB reporting.</div>
  </div>

  <!-- ===== Performance ===== -->
  <div class="section-title">Performance Indicators</div>
  <div class="grid g2">
    <div class="card">
      <div class="card-h"><div><h3>Data Integrity Performance</h3>
        <p>Platform readiness · YTD ${STATE.year}</p></div></div>
      <div class="chart-host" id="c-gauges"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Regional Reporting Completeness</h3>
        <p>Period close status by region · Aug 2026</p></div></div>
      <div class="chart-host" id="c-gauges2"></div>
    </div>
  </div>

  <div class="grid g3" style="margin-top:14px">
    <div class="card">
      <div class="card-h"><div><h3>Activity Hotspots</h3><p>Contribution by activity</p></div></div>
      <div class="chart-host" id="c-hotspot"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Top Countries</h3><p>YTD ${STATE.year} · tCO₂e</p></div></div>
      <div class="chart-host" id="c-country"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Annual Position by Scope</h3><p>2023–2025 full year · 2026 YTD</p></div></div>
      <div class="chart-host" id="c-yoy"></div>
    </div>
  </div>

  <div class="section-title">Shipment Emissions Ledger — Latest Movements</div>
  <div class="tbl-wrap" style="max-height:340px">
    <table class="tbl-sm"><thead><tr>
      <th>Reference</th><th>Lane</th><th>Mode</th><th>Carrier</th><th>Fuel</th>
      <th class="num">Distance km</th><th class="num">Gross t</th><th class="num">t-km</th>
      <th class="num">CO₂e WTW</th><th class="num">WTT</th><th class="num">TTW</th>
      <th class="num">g/t-km</th><th>Tier</th><th>Customer</th></tr></thead><tbody>
      ${DATA.shipments.slice(0, 40).map(x => `<tr>
        <td class="mono">${x.id}</td><td class="mono">${x.origin} → ${x.destination}</td>
        <td>${x.mode}</td><td class="muted">${x.carrier}</td><td class="muted">${x.fuel}</td>
        <td class="num">${fmt(x.distanceKm)}</td><td class="num">${fmt(x.grossWeightT, 2)}</td>
        <td class="num">${fmt(x.tkm)}</td><td class="num"><strong>${fmt(x.wtwTco2e, 3)}</strong></td>
        <td class="num muted">${fmt(x.wttTco2e, 3)}</td><td class="num muted">${fmt(x.ttwTco2e, 3)}</td>
        <td class="num">${x.efApplied}</td>
        <td>${tierBadge(x.dataTier)}</td><td class="muted">${x.customer}</td></tr>`).join('')}
    </tbody></table>
  </div>
  <p class="count-note">Showing the 40 most recent legs of ${fmt(shipCount)}. Full ledger with the complete
  ISO 14083 evidence chain is available under Freight &amp; Logistics.</p>

  <div class="section-title">Attention Required</div>
  <div class="grid g2">
    <div class="card">
      <div class="card-h"><div><h3>Open Data Exceptions</h3><p>Highest severity first</p></div>
        <button class="btn right" data-goto="quality">View all</button></div>
      <div class="tbl-wrap" style="border:0;box-shadow:none"><table class="tbl-sm"><thead><tr>
        <th>ID</th><th>Entity</th><th>Finding</th><th>Severity</th></tr></thead><tbody>
        ${DATA.anomalies.filter(a => a.status !== 'Resolved').slice(0, 6).map(a => `
          <tr><td class="mono">${a.id}</td><td><strong>${a.facility}</strong></td>
          <td class="muted" style="max-width:260px">${a.detail}</td>
          <td>${sevPill(a.severity)}</td></tr>`).join('')}
      </tbody></table></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Upcoming Disclosures</h3><p>Next 60 days</p></div>
        <button class="btn right" data-goto="reporting">Reporting hub</button></div>
      <div class="tbl-wrap" style="border:0;box-shadow:none"><table class="tbl-sm"><thead><tr>
        <th>Pack</th><th>Recipient</th><th>Due</th><th class="num">Readiness</th></tr></thead><tbody>
        ${DATA.reportPacks.filter(r => r.due <= '2026-11-30').map(r => `<tr>
          <td><strong>${r.name}</strong></td><td>${r.recipient}</td><td class="mono">${r.due}</td>
          <td class="num"><div style="display:flex;gap:7px;align-items:center;justify-content:flex-end">
            <div class="progress" style="width:60px"><i style="width:${r.completeness}%"></i></div>
            <span style="min-width:30px">${r.completeness}%</span></div></td></tr>`).join('')}
      </tbody></table></div>
    </div>
  </div>`;

  mount(el);

  /* ---- visuals ---- */
  emissionOrb(document.getElementById('c-orb'), {
    value: fmtK(t), unit: 'tCO₂e YTD', label: 'Group Carbon Emission', size: 252
  });

  const months = DATA.months.slice(0, STATE.year === 2026 ? YTD_MONTHS : 12);
  lineChart(document.getElementById('c-trend'), {
    labels: months,
    series: [1, 2, 3].map(sc => ({
      name: 'Scope ' + sc, color: SCOPE_COLOR[sc],
      values: months.map((_, i) => sum(q({ ...baseFilters(), year: STATE.year, scope: sc }).filter(r => r.monthIndex === i)))
    }))
  });
  donut(document.getElementById('c-donut'), {
    items: [1, 2, 3].map(sc => ({ key: 'Scope ' + sc, value: s(sc), color: SCOPE_COLOR[sc] })),
    centerValue: fmtK(t), centerLabel: 'tCO₂e YTD'
  });

  /* ---- location heatmap ---- */
  const heatRows = STATE.heatScope === 'ALL' ? cur : cur.filter(r => r.scope === +STATE.heatScope);
  const byFac = groupSum(heatRows, 'facilityId');
  const heatPoints = byFac.map(g => {
    const f = DATA.facilities.find(x => x.id === g.key);
    return f ? { key: f.name.replace('EFL ', ''), value: g.value, lat: f.lat, lon: f.lon,
      sub: `${f.countryName} · ${f.type}`, fac: f } : null;
  }).filter(Boolean);

  geoHeatmap(document.getElementById('c-heatmap'), {
    points: heatPoints,
    unit: 'tCO₂e',
    label: STATE.heatScope === 'ALL' ? 'site' : 'Scope ' + STATE.heatScope
  });

  const maxHeat = Math.max(...heatPoints.map(p => p.value)) || 1;
  document.getElementById('heat-rank').innerHTML = heatPoints.map(p => {
    const inten = (p.value / p.fac.area) * 1000;
    return `<tr>
      <td><span style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:7px;
        background:${heatColor(p.value / maxHeat)}"></span><strong>${p.key}</strong></td>
      <td class="muted">${p.fac.countryName}</td>
      <td class="num">${fmt(p.value)}</td>
      <td class="num">${inten.toFixed(1)}</td></tr>`;
  }).join('');

  /* ---- site × month matrix ---- */
  const topFacs = groupSum(cur, 'facilityId').slice(0, 12)
    .map(g => DATA.facilities.find(f => f.id === g.key)).filter(Boolean);
  matrixHeatmap(document.getElementById('c-matrix'), {
    rows: topFacs.map(f => ({ label: f.name.replace('EFL ', ''), sub: `${f.countryName} · ${f.type}` })),
    cols: months,
    values: topFacs.map(f => months.map((_, mi) =>
      sum(cur.filter(r => r.facilityId === f.id && r.monthIndex === mi))))
  });

  /* ---- gauges ---- */
  const conn = DATA.connectors.reduce((a, c) => a + c.coverage, 0) / DATA.connectors.length;
  gaugeRow(document.getElementById('c-gauges'), [
    { pct: primaryShare, label: 'Primary data', sub: 'GLEC tier 1 share' },
    { pct: conn, label: 'Source coverage', sub: `${DATA.connectors.length} connectors` },
    { pct: 99.4, label: 'Auto-validated', sub: '84,206 rows YTD' },
    { pct: 78, label: 'Automated feed', sub: 'of inventory by tCO₂e' }
  ]);
  const regions = [...new Set(DATA.countries.map(c => c.region))];
  gaugeRow(document.getElementById('c-gauges2'), regions.map((rg, i) => {
    const pct = [100, 96, 88, 100, 74, 92][i % 6];
    return { pct, label: rg.split(' ')[0], sub: `${rg} · close`, size: 132 };
  }));

  hotspotGrid(document.getElementById('c-hotspot'),
    groupSum(cur, 'categoryId').slice(0, 6).map(g => ({
      key: ((DATA.categories.find(c => c.id === g.key) || {}).name || '').replace(/^Cat \d+ — /, ''), value: g.value
    })));
  hBar(document.getElementById('c-country'), {
    items: groupSum(cur, 'country').slice(0, 8).map(g => ({
      key: (DATA.countries.find(c => c.code === g.key) || {}).name, value: g.value
    })), color: '#e2620d'
  });
  stackedBar(document.getElementById('c-yoy'), {
    labels: DATA.years.map(y => y === 2026 ? '2026 YTD' : String(y)),
    series: [1, 2, 3].map(sc => ({
      name: 'Scope ' + sc, color: SCOPE_COLOR[sc],
      values: DATA.years.map(y => sum(q({ ...baseFilters(), year: y, scope: sc })))
    }))
  });
}

/* =========================================================================
   VIEW: EMISSIONS EXPLORER
   ========================================================================= */
function viewExplorer() {
  const cur = ytd(STATE.year), prev = ytd(STATE.year - 1);
  const catRows = DATA.categories.map(c => {
    const v = sum(cur.filter(r => r.categoryId === c.id));
    const p = sum(prev.filter(r => r.categoryId === c.id));
    return { ...c, value: v, prev: p, chg: p ? ((v - p) / p) * 100 : null };
  }).sort((a, b) => b.value - a.value);
  const total = catRows.reduce((a, c) => a + c.value, 0);

  const el = document.createElement('div');
  el.innerHTML = `
  ${filterBar()}
  <div class="grid g2">
    <div class="card">
      <div class="card-h"><div><h3>Emissions by Country</h3><p>YTD ${STATE.year} · tCO₂e</p></div></div>
      <div class="chart-host" id="e-country"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Emissions by Facility Type</h3><p>YTD ${STATE.year} · tCO₂e</p></div></div>
      <div class="chart-host donut-host" id="e-ftype"></div>
    </div>
  </div>

  <div class="card" style="margin-top:14px">
    <div class="card-h"><div><h3>Country × Category Heatmap</h3>
      <p>Where each activity concentrates geographically · YTD ${STATE.year} · tCO₂e</p></div></div>
    <div class="chart-host" id="e-matrix"></div>
  </div>

  <div class="grid g2" style="margin-top:14px">
    <div class="card">
      <div class="card-h"><div><h3>Regional Trend</h3><p>Monthly, ${STATE.year}</p></div></div>
      <div class="chart-host" id="e-region"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Scope 2 — Location vs Market Based</h3><p>YTD ${STATE.year} · renewable claims applied</p></div></div>
      <div class="chart-host" id="e-s2"></div>
      <div class="note">Market-based figures reflect I-REC and PPA volumes contracted in Netherlands, UK,
      Singapore and India. Residual-mix factors applied where no instrument is held.</div>
    </div>
  </div>

  <div class="section-title">Category Ledger</div>
  <div class="tbl-wrap">
    <table><thead><tr>
      <th>Scope</th><th>Category</th><th>Primary source system</th><th>Data tier</th>
      <th class="num">YTD ${STATE.year}</th><th class="num">YTD ${STATE.year - 1}</th>
      <th class="num">Change</th><th class="num">% of total</th></tr></thead><tbody>
      ${catRows.map(c => `<tr>
        <td><span class="pill ${c.scope === 1 ? 'navy' : c.scope === 2 ? 'blue' : 'efl'}">Scope ${c.scope}</span></td>
        <td><strong>${c.name}</strong></td><td class="muted">${c.source}</td>
        <td>${tierPill(c.tier)}</td>
        <td class="num">${fmt(c.value, 0)}</td><td class="num muted">${fmt(c.prev, 0)}</td>
        <td class="num ${c.chg < 0 ? 'delta down' : 'delta up'}">${c.chg == null ? '—' : (c.chg > 0 ? '+' : '') + c.chg.toFixed(1) + '%'}</td>
        <td class="num">${((c.value / (total || 1)) * 100).toFixed(1)}%</td></tr>`).join('')}
      <tr class="total-row"><td colspan="4">Group total</td>
        <td class="num">${fmt(total, 0)}</td><td class="num">${fmt(sum(prev), 0)}</td>
        <td class="num">${sum(prev) ? (((total - sum(prev)) / sum(prev)) * 100).toFixed(1) + '%' : '—'}</td>
        <td class="num">100%</td></tr>
    </tbody></table>
  </div>

  <div class="section-title">Facility Ledger</div>
  <div class="tbl-wrap">
    <table><thead><tr><th>Facility</th><th>Country</th><th>Type</th>
      <th class="num">Scope 1</th><th class="num">Scope 2</th><th class="num">Scope 3</th>
      <th class="num">Total YTD</th><th class="num">Intensity</th><th>Status</th></tr></thead><tbody>
      ${DATA.facilities.map(f => {
        const rows = cur.filter(r => r.facilityId === f.id);
        if (!rows.length) return '';
        const tt = sum(rows);
        return `<tr><td><strong>${f.name}</strong><br><span class="mono">${f.id}</span></td>
          <td>${f.countryName}</td><td class="muted">${f.type}</td>
          <td class="num">${fmt(sum(rows.filter(r => r.scope === 1)), 0)}</td>
          <td class="num">${fmt(sum(rows.filter(r => r.scope === 2)), 0)}</td>
          <td class="num">${fmt(sum(rows.filter(r => r.scope === 3)), 0)}</td>
          <td class="num"><strong>${fmt(tt, 0)}</strong></td>
          <td class="num muted">${(tt / f.area * 1000).toFixed(1)} kg/m²</td>
          <td>${rows.every(r => r.verified) ? '<span class="pill green">Closed</span>' : '<span class="pill amber">In period</span>'}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
  </div>
  <p class="count-note">Intensity expressed as kgCO₂e per m² of operated floor area, YTD basis.</p>`;

  mount(el);

  hBar(document.getElementById('e-country'), {
    items: groupSum(cur, 'country').map(g => ({ key: (DATA.countries.find(c => c.code === g.key) || {}).name, value: g.value })),
    color: '#e2620d'
  });
  donut(document.getElementById('e-ftype'), {
    items: groupSum(cur, 'facilityType').map(g => ({ key: g.key, value: g.value })),
    centerValue: fmtK(sum(cur)), centerLabel: 'tCO₂e YTD'
  });

  const cCodes = groupSum(cur, 'country').map(g => g.key);
  const cats = groupSum(cur, 'categoryId').slice(0, 9).map(g => g.key);
  if (cCodes.length && cats.length) {
    matrixHeatmap(document.getElementById('e-matrix'), {
      rows: cCodes.map(cc => {
        const c = DATA.countries.find(x => x.code === cc) || {};
        return { label: c.name || cc, sub: c.region || '' };
      }),
      cols: cats.map(id => ((DATA.categories.find(c => c.id === id) || {}).name || id)
        .replace(/^Cat \d+ — /, '').slice(0, 14)),
      values: cCodes.map(cc => cats.map(id => sum(cur.filter(r => r.country === cc && r.categoryId === id)))),
      rowLabelWidth: 140
    });
  }

  const months = DATA.months.slice(0, STATE.year === 2026 ? YTD_MONTHS : 12);
  const regions = [...new Set(DATA.countries.map(c => c.region))];
  lineChart(document.getElementById('e-region'), {
    labels: months, area: false,
    series: regions.map((rg, i) => ({
      name: rg, color: PALETTE[i % PALETTE.length],
      values: months.map((_, mi) => sum(cur.filter(r => r.region === rg && r.monthIndex === mi)))
    }))
  });
  const lb = sum(cur.filter(r => r.scope === 2));
  stackedBar(document.getElementById('e-s2'), {
    labels: ['Q1', 'Q2', 'Q3 (part)'],
    series: [
      { name: 'Location-based', color: '#1d4260', values: [lb * .36, lb * .37, lb * .27] },
      { name: 'Market-based', color: '#e2620d', values: [lb * .36 * .69, lb * .37 * .67, lb * .27 * .64] }
    ]
  });
}

/* =========================================================================
   VIEW: FREIGHT
   ========================================================================= */
function viewFreight() {
  let ships = DATA.shipments;
  if (STATE.shipMode !== 'ALL') ships = ships.filter(s => s.mode === STATE.shipMode);
  if (STATE.shipTier !== 'ALL') ships = ships.filter(s => s.dataTier === STATE.shipTier);
  if (STATE.shipSearch) {
    const t = STATE.shipSearch.toLowerCase();
    ships = ships.filter(s => JSON.stringify(s).toLowerCase().includes(t));
  }
  const totWtw = ships.reduce((a, s) => a + s.wtwTco2e, 0);
  const totTkm = ships.reduce((a, s) => a + s.tkm, 0);
  const primaryPct = (ships.filter(s => s.dataTier.startsWith('Primary')).length / (ships.length || 1)) * 100;

  const byMode = DATA.modes.map(m => {
    const r = ships.filter(s => s.mode === m.mode);
    return { mode: m.mode, n: r.length, tkm: r.reduce((a, s) => a + s.tkm, 0),
      wtw: r.reduce((a, s) => a + s.wtwTco2e, 0), ef: m.ef,
      lf: r.length ? r.reduce((a, s) => a + s.loadFactor, 0) / r.length : 0,
      empty: r.length ? r.reduce((a, s) => a + s.emptyRunning, 0) / r.length : 0 };
  }).filter(m => m.n);

  const el = document.createElement('div');
  el.innerHTML = `
  <div class="filters">
    <div><label>Mode</label><select data-state="shipMode">
      <option value="ALL">All modes</option>
      ${DATA.modes.map(m => `<option ${STATE.shipMode === m.mode ? 'selected' : ''}>${m.mode}</option>`).join('')}
    </select></div>
    <div><label>Data quality tier</label><select data-state="shipTier">
      <option value="ALL">All tiers</option>
      ${DQ_TIERS.map(t => `<option ${STATE.shipTier === t ? 'selected' : ''}>${t}</option>`).join('')}
    </select></div>
    <div style="flex:1;min-width:220px"><label>Search shipment / lane / carrier / customer</label>
      <input type="search" data-state="shipSearch" value="${STATE.shipSearch}" placeholder="e.g. LKCMB, Maersk, Sagawa…" style="width:100%"></div>
    <div><button class="btn primary" data-export="shipments">Export GLEC CSV</button></div>
  </div>

  <div class="grid g4">
    <div class="kpi lime"><div class="lab">Freight Emissions (WTW)</div>
      <div class="val">${fmt(totWtw, 0)}<small>tCO₂e</small></div>
      <span class="delta down">${fmt(ships.length, 0)} shipments in scope</span></div>
    <div class="kpi s2"><div class="lab">Transport Activity</div>
      <div class="val">${fmtK(totTkm / 1000)}<small>M t-km</small></div>
      <span class="delta flat">gross actual mass basis</span></div>
    <div class="kpi"><div class="lab">Blended Intensity</div>
      <div class="val">${fmt((totWtw * 1e6) / (totTkm || 1), 1)}<small>gCO₂e/t-km</small></div>
      <span class="delta down">▼ 4.8% vs FY2025</span></div>
    <div class="kpi ${primaryPct < 40 ? 'warn' : ''}"><div class="lab">Carrier Primary Data</div>
      <div class="val">${primaryPct.toFixed(0)}<small>%</small></div>
      <span class="delta ${primaryPct < 40 ? 'up' : 'down'}">CountEmissions EU target: &gt;60%</span></div>
  </div>

  <div class="grid g2" style="margin-top:14px">
    <div class="card">
      <div class="card-h"><div><h3>Emissions by Mode</h3><p>Well-to-Wheel, tCO₂e</p></div></div>
      <div class="chart-host" id="f-mode"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>WTT / TTW Split by Mode</h3><p>ISO 14083 requires both components</p></div></div>
      <div class="chart-host" id="f-split"></div>
    </div>
  </div>

  <div class="card" style="margin-top:14px">
    <div class="card-h"><div><h3>Lane Emission Heatmap</h3>
      <p>Top trade lanes by month · tCO₂e well-to-wheel</p></div></div>
    <div class="chart-host" id="f-matrix"></div>
  </div>

  <div class="section-title">Modal Performance</div>
  <div class="tbl-wrap"><table><thead><tr>
    <th>Mode</th><th class="num">Shipments</th><th class="num">t-km</th><th class="num">WTW tCO₂e</th>
    <th class="num">GLEC default factor</th><th class="num">Avg load factor</th><th class="num">Avg empty running</th>
    <th class="num">Realised intensity</th></tr></thead><tbody>
    ${byMode.map(m => `<tr>
      <td><strong>${m.mode}</strong></td><td class="num">${fmt(m.n)}</td>
      <td class="num">${fmt(m.tkm)}</td><td class="num"><strong>${fmt(m.wtw, 1)}</strong></td>
      <td class="num muted">${m.ef} g/t-km</td><td class="num">${(m.lf * 100).toFixed(0)}%</td>
      <td class="num">${(m.empty * 100).toFixed(0)}%</td>
      <td class="num">${((m.wtw * 1e6) / (m.tkm || 1)).toFixed(1)} g/t-km</td></tr>`).join('')}
  </tbody></table></div>

  <div class="section-title">Shipment Ledger — ISO 14083 Data Points</div>
  <div class="tbl-wrap" style="max-height:620px">
    <table class="tbl-sm"><thead><tr>
      <th>Shipment</th><th>Lane</th><th>Mode / asset class</th><th>Carrier</th><th>Fuel</th>
      <th class="num">Distance km</th><th class="num">Gross t</th><th class="num">t-km</th>
      <th class="num">Load</th><th class="num">Empty</th><th class="num">EF applied</th>
      <th class="num">WTT</th><th class="num">TTW</th><th class="num">WTW tCO₂e</th>
      <th>Tier</th><th>GHG cat</th><th>Customer</th><th>Status</th></tr></thead><tbody>
      ${ships.slice(0, 250).map(s => `<tr>
        <td class="mono">${s.id}</td><td class="mono">${s.origin} → ${s.destination}</td>
        <td>${s.mode}<br><span class="muted" style="font-size:11px">${s.assetClass}</span></td>
        <td class="muted">${s.carrier}</td><td class="muted">${s.fuel}</td>
        <td class="num">${fmt(s.distanceKm)}</td><td class="num">${fmt(s.grossWeightT, 2)}</td>
        <td class="num">${fmt(s.tkm)}</td><td class="num">${(s.loadFactor * 100).toFixed(0)}%</td>
        <td class="num">${(s.emptyRunning * 100).toFixed(0)}%</td><td class="num muted">${s.efApplied}</td>
        <td class="num muted">${fmt(s.wttTco2e, 3)}</td><td class="num muted">${fmt(s.ttwTco2e, 3)}</td>
        <td class="num"><strong>${fmt(s.wtwTco2e, 3)}</strong></td>
        <td>${tierBadge(s.dataTier)}</td><td class="muted">${s.ghgCategory.replace('Scope 3 ', '')}</td>
        <td class="muted">${s.customer}</td>
        <td>${s.verified ? '<span class="pill green">Verified</span>' : '<span class="pill amber">Pending</span>'}</td>
      </tr>`).join('')}
    </tbody></table>
  </div>
  <p class="count-note">Showing ${Math.min(ships.length, 250)} of ${fmt(ships.length)} shipment legs.
  Every leg retains origin/destination, mode, asset class, fuel, routed distance, gross actual mass,
  load factor, empty running, applied factor and its vintage — the full evidence chain required for assurance.</p>`;

  mount(el);

  hBar(document.getElementById('f-mode'), {
    items: byMode.map(m => ({ key: m.mode, value: m.wtw, decimals: 1 })).sort((a, b) => b.value - a.value),
    unit: 'tCO₂e well-to-wheel', color: '#e2620d'
  });
  stackedBar(document.getElementById('f-split'), {
    labels: byMode.map(m => m.mode),
    series: [
      { name: 'Tank-to-Wheel', color: '#e2620d', values: byMode.map(m => ships.filter(s => s.mode === m.mode).reduce((a, s) => a + s.ttwTco2e, 0)) },
      { name: 'Well-to-Tank', color: '#f2a04a', values: byMode.map(m => ships.filter(s => s.mode === m.mode).reduce((a, s) => a + s.wttTco2e, 0)) }
    ]
  });

  const laneMap = new Map();
  ships.forEach(s => {
    const k = `${s.origin} → ${s.destination}`;
    if (!laneMap.has(k)) laneMap.set(k, { key: k, mode: s.mode, total: 0, months: Array(YTD_MONTHS).fill(0) });
    const e = laneMap.get(k);
    const mi = parseInt(s.period.slice(5), 10) - 1;
    e.total += s.wtwTco2e;
    if (mi >= 0 && mi < YTD_MONTHS) e.months[mi] += s.wtwTco2e;
  });
  const lanes = [...laneMap.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  const lmonths = DATA.months.slice(0, YTD_MONTHS);
  if (lanes.length) {
    matrixHeatmap(document.getElementById('f-matrix'), {
      rows: lanes.map(l => ({ label: l.key, sub: l.mode })),
      cols: lmonths, values: lanes.map(l => l.months), rowLabelWidth: 132
    });
  } else {
    document.getElementById('f-matrix').innerHTML = '<p class="count-note">No lanes match the current filter.</p>';
  }
}

/* =========================================================================
   VIEW: DATA SOURCES
   ========================================================================= */
function viewSources() {
  const el = document.createElement('div');
  const avg = DATA.connectors.reduce((a, c) => a + c.coverage, 0) / DATA.connectors.length;
  el.innerHTML = `
  <div class="grid g4">
    <div class="kpi"><div class="lab">Active Connectors</div><div class="val">${DATA.connectors.filter(c => c.status === 'Connected').length}<small>/ ${DATA.connectors.length}</small></div><span class="delta down">2 degraded · 1 scheduled</span></div>
    <div class="kpi"><div class="lab">Average Source Coverage</div><div class="val">${avg.toFixed(0)}<small>%</small></div><span class="delta down">▲ 12 pts vs FY2025</span></div>
    <div class="kpi lime"><div class="lab">Automated Ingestion</div><div class="val">78<small>%</small></div><span class="delta down">of inventory by tCO₂e</span></div>
    <div class="kpi warn"><div class="lab">Manual Upload Dependency</div><div class="val">3<small>sources</small></div><span class="delta up">Waste, refrigerants, commuting</span></div>
  </div>

  <div class="section-title">Connector Register</div>
  <div class="tbl-wrap"><table><thead><tr>
    <th>Source system</th><th>Type</th><th>Feeds</th><th>Frequency</th><th>Last sync</th>
    <th>Latest volume</th><th class="num">Coverage</th><th>Status</th></tr></thead><tbody>
    ${DATA.connectors.map(c => `<tr>
      <td><strong>${c.name}</strong></td><td class="muted">${c.type}</td><td>${c.scope}</td>
      <td class="muted">${c.freq}</td><td class="mono">${c.lastSync}</td><td class="muted">${c.records}</td>
      <td class="num"><div style="display:flex;gap:7px;align-items:center;justify-content:flex-end">
        <div class="progress" style="width:64px"><i style="width:${c.coverage}%;background:${c.coverage > 80 ? 'var(--efl)' : c.coverage > 50 ? 'var(--amber)' : 'var(--red)'}"></i></div>
        <span style="min-width:32px">${c.coverage}%</span></div></td>
      <td>${c.status === 'Connected' ? '<span class="pill green">Connected</span>'
        : c.status === 'Degraded' ? '<span class="pill amber">Degraded</span>' : '<span class="pill grey">Scheduled</span>'}</td>
    </tr>`).join('')}
  </tbody></table></div>

  <div class="section-title">Ingestion Pipeline</div>
  <div class="grid g4">
    ${[['1. Ingest', 'API, SFTP, OCR and template upload into the staging layer with source fingerprinting.'],
       ['2. Standardise', 'Unit of measure normalisation, entity mapping to the facility master, currency and period alignment.'],
       ['3. Validate', 'Twelve automated rules run on every load; failures quarantine the record rather than the batch.'],
       ['4. Calculate', 'Factor library applied by activity, geography and vintage; result written with full lineage.']
      ].map(([t, d]) => `<div class="card"><div class="card-h"><div><h3>${t}</h3></div></div>
        <p class="muted" style="margin:0;font-size:12px">${d}</p></div>`).join('')}
  </div>

  <div class="note" style="margin-top:18px">Each calculated figure stores the source record ID, the transformation applied,
  the factor and factor vintage used, and the approver — so any number in a Sagawa or SSJB return can be traced back
  to the originating invoice, manifest or telematics record without re-opening the source system.</div>`;
  mount(el);
}

/* =========================================================================
   VIEW: DATA QUALITY
   ========================================================================= */
function viewQuality() {
  const open = DATA.anomalies.filter(a => a.status === 'Open');
  const review = DATA.anomalies.filter(a => a.status === 'In review');
  const resolved = DATA.anomalies.filter(a => a.status === 'Resolved');
  const cur = ytd(STATE.year);
  const tierTotals = ['Primary', 'Mixed', 'Modelled', 'Secondary'].map(t => ({
    key: t, value: sum(cur.filter(r => r.dataTier === t))
  })).filter(t => t.value > 0);

  const el = document.createElement('div');
  el.innerHTML = `
  <div class="grid g4">
    <div class="kpi warn"><div class="lab">Open Exceptions</div><div class="val">${open.length}</div>
      <span class="delta up">${open.filter(a => a.severity === 'Critical').length} critical</span></div>
    <div class="kpi"><div class="lab">In Review</div><div class="val">${review.length}</div><span class="delta flat">avg age 3.2 days</span></div>
    <div class="kpi lime"><div class="lab">Resolved This Quarter</div><div class="val">${resolved.length}</div><span class="delta down">100% with documented rationale</span></div>
    <div class="kpi"><div class="lab">Records Auto-Validated</div><div class="val">99.4<small>%</small></div><span class="delta down">of 84,206 rows loaded YTD</span></div>
  </div>

  <div class="grid g2" style="margin-top:14px">
    <div class="card">
      <div class="card-h"><div><h3>Inventory by Data Quality Tier</h3><p>GLEC four-tier hierarchy, YTD ${STATE.year}</p></div></div>
      <div class="chart-host donut-host" id="q-tier"></div>
      <div class="note">Moving Scope 3 Cat 4 from default factors to carrier-supplied fuel data is the single
      largest available improvement in inventory quality and the explicit direction of travel under CountEmissions EU.</div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Exceptions by Severity</h3><p>All statuses</p></div></div>
      <div class="chart-host" id="q-sev"></div>
    </div>
  </div>

  <div class="section-title">Exception Queue</div>
  <div class="tbl-wrap"><table><thead><tr>
    <th>ID</th><th>Period</th><th>Entity</th><th>Rule</th><th>Finding</th>
    <th class="num">Deviation</th><th>Owner</th><th>Severity</th><th>Status</th></tr></thead><tbody>
    ${DATA.anomalies.map(a => `<tr>
      <td class="mono">${a.id}</td><td class="mono">${a.period}</td><td><strong>${a.facility}</strong></td>
      <td class="mono" title="${(DATA.validationRules.find(r => r.id === a.rule) || {}).name}">${a.rule}</td>
      <td class="muted" style="min-width:300px">${a.detail}</td>
      <td class="num">${a.delta}</td><td class="muted">${a.owner}</td>
      <td>${sevPill(a.severity)}</td>
      <td>${a.status === 'Open' ? '<span class="pill red">Open</span>'
        : a.status === 'In review' ? '<span class="pill amber">In review</span>' : '<span class="pill green">Resolved</span>'}</td>
    </tr>`).join('')}
  </tbody></table></div>

  <div class="section-title">Validation Rule Library</div>
  <div class="tbl-wrap"><table><thead><tr>
    <th>Rule</th><th>Test</th><th>Applies to</th><th>Severity</th><th>Execution</th><th class="num">Triggers YTD</th></tr></thead><tbody>
    ${DATA.validationRules.map((r, i) => `<tr>
      <td class="mono">${r.id}</td><td>${r.name}</td><td class="muted">${r.domain}</td>
      <td>${sevPill(r.severity)}</td>
      <td>${r.auto ? '<span class="pill green">Automated</span>' : '<span class="pill grey">Manual review</span>'}</td>
      <td class="num">${[14, 6, 21, 9, 118, 12, 6, 4, 3, 37, 5, 2][i]}</td></tr>`).join('')}
  </tbody></table></div>`;
  mount(el);

  donut(document.getElementById('q-tier'), { items: tierTotals, centerValue: fmtK(sum(cur)), centerLabel: 'tCO₂e YTD' });
  const sevs = ['Critical', 'High', 'Medium'];
  stackedBar(document.getElementById('q-sev'), {
    labels: sevs,
    series: [
      { name: 'Open', color: '#c23b2e', values: sevs.map(s => open.filter(a => a.severity === s).length) },
      { name: 'In review', color: '#d98f2b', values: sevs.map(s => review.filter(a => a.severity === s).length) },
      { name: 'Resolved', color: '#2f7d5e', values: sevs.map(s => resolved.filter(a => a.severity === s).length) }
    ], yLabel: 'exceptions'
  });
}

/* =========================================================================
   VIEW: CALCULATOR
   ========================================================================= */
function viewCalculator() {
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="grid g32">
    <div class="card">
      <div class="card-h"><div><h3>Shipment Inputs</h3><p>Minimum ISO 14083 / GLEC v3.2 data points</p></div></div>
      <div class="calc-grid">
        <div class="field"><label>Mode</label><select id="i-mode">
          ${DATA.modes.map(m => `<option>${m.mode}</option>`).join('')}</select></div>
        <div class="field"><label>Asset class</label><select id="i-asset"></select></div>
        <div class="field"><label>Origin</label><input type="text" id="i-org" value="LKCMB"></div>
        <div class="field"><label>Destination</label><input type="text" id="i-dst" value="NLRTM"></div>
        <div class="field"><label>Routed distance (km)</label><input type="text" id="i-dist" value="9450"></div>
        <div class="field"><label>Gross actual mass (t)</label><input type="text" id="i-mass" value="24.5"></div>
        <div class="field"><label>Load factor (0–1)</label><input type="text" id="i-load" value="0.74"></div>
        <div class="field"><label>Empty running (0–1)</label><input type="text" id="i-empty" value="0.06"></div>
        <div class="field"><label>Fuel / energy</label><select id="i-fuel">
          <option>VLSFO</option><option>MGO</option><option>LNG</option><option>Diesel (B7)</option>
          <option>HVO100</option><option>Jet A-1</option><option>SAF blend 10%</option><option>Grid electricity</option>
        </select></div>
        <div class="field"><label>Primary fuel data available?</label><select id="i-tier">
          <option>No — GLEC default factor</option><option>Partly — modelled route + load</option>
          <option>Yes — carrier fuel consumption</option></select></div>
        <div class="field"><label>Hub / transhipment legs</label><select id="i-hub">
          <option value="0">None</option><option value="1">1 transhipment</option><option value="2">2 transhipments</option></select></div>
        <div class="field"><label>GHG Protocol category</label><select id="i-cat">
          <option>Scope 3 Cat 4 — Upstream</option><option>Scope 3 Cat 9 — Downstream</option>
          <option>Scope 1 — Own fleet</option></select></div>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn primary" id="btn-calc">Calculate</button>
        <button class="btn" id="btn-reset">Reset</button>
      </div>
      <div id="calc-result"></div>
    </div>

    <div class="card">
      <div class="card-h"><div><h3>Required Data Points</h3><p>What the engine needs, and why</p></div></div>
      <div class="tbl-wrap" style="box-shadow:none;border:0"><table class="tbl-sm"><thead><tr>
        <th>Data point</th><th>Purpose</th><th>Tier</th></tr></thead><tbody>
        ${[
          ['Origin & destination (node-level)', 'Leg definition and distance determination', 'Required'],
          ['Routed distance per leg', 'Denominator of transport activity', 'Required'],
          ['Gross actual mass (tonnes)', 'Numerator of t-km; chargeable weight not permitted', 'Required'],
          ['Volume / density', 'Allocation basis for low-density cargo', 'Conditional'],
          ['Mode per leg', 'Selects the transport operation category', 'Required'],
          ['Vehicle / vessel / aircraft class', 'Determines the applicable factor band', 'Required'],
          ['Fuel or energy type', 'WTT and TTW factor selection', 'Required'],
          ['Actual fuel / energy consumed', 'Primary-data pathway — preferred input', 'Preferred'],
          ['Load factor / utilisation', 'Largest single driver of variance', 'Required'],
          ['Empty running share', 'Adjusts factor for repositioning', 'Required'],
          ['Transhipment & hub nodes', 'Hub energy is a distinct ISO 14083 element', 'Conditional'],
          ['Emission factor source & vintage', 'Auditability and rule VR-07', 'Required'],
          ['System boundary (WTW / TTW)', 'ISO 14083 expects well-to-wheel', 'Required'],
          ['GWP set and gases covered', 'CO₂, CH₄, N₂O expressed as CO₂e', 'Required'],
          ['Allocation method', 'Apportions a shared trip to the consignment', 'Required'],
          ['Operator role (TCO / TAO)', 'Determines who reports the emission', 'Required'],
          ['Data quality tier per leg', 'Feeds the four-tier GLEC hierarchy', 'Required']
        ].map(([a, b, c]) => `<tr><td><strong>${a}</strong></td><td class="muted">${b}</td>
          <td>${c === 'Required' ? '<span class="pill navy">Required</span>'
            : c === 'Preferred' ? '<span class="pill efl">Preferred</span>' : '<span class="pill grey">Conditional</span>'}</td></tr>`).join('')}
      </tbody></table></div>
    </div>
  </div>`;
  mount(el);

  const modeSel = document.getElementById('i-mode');
  const assetSel = document.getElementById('i-asset');
  function fillAssets() {
    const m = DATA.modes.find(x => x.mode === modeSel.value) || DATA.modes[0];
    assetSel.innerHTML = m.sub.map(x => `<option>${x}</option>`).join('');
  }
  fillAssets();
  modeSel.addEventListener('change', fillAssets);
  document.getElementById('btn-calc').addEventListener('click', runCalc);
  document.getElementById('btn-reset').addEventListener('click', () => viewCalculator());
  runCalc();
}

function runCalc() {
  const v = id => document.getElementById(id).value;
  const n = id => parseFloat(v(id)) || 0;
  const mode = v('i-mode');
  const modeDef = DATA.modes.find(m => m.mode === mode) || DATA.modes[0];
  const mass = n('i-mass'), dist = n('i-dist');
  const load = Math.min(Math.max(n('i-load'), 0.05), 1);
  const empty = Math.min(Math.max(n('i-empty'), 0), 0.9);
  const hubs = parseInt(v('i-hub'), 10);
  const fuel = v('i-fuel'), tier = v('i-tier');

  const fuelAdj = fuel === 'HVO100' ? 0.18 : fuel === 'SAF blend 10%' ? 0.92
    : fuel === 'LNG' ? 0.83 : fuel === 'Grid electricity' ? 0.42 : 1;
  const tierAdj = tier.startsWith('Yes') ? 0.94 : tier.startsWith('Partly') ? 0.98 : 1;

  const ef = modeDef.ef * (0.72 / load) * (1 + empty * 0.35) * fuelAdj * tierAdj;
  const tkm = mass * dist;
  const legWtw = (tkm * ef) / 1e6;
  const hubEm = hubs * mass * 0.0031;
  const total = legWtw + hubEm;
  const ttwShare = mode === 'Air' ? 0.80 : fuel === 'Grid electricity' ? 0 : 0.79;
  const ttw = total * ttwShare, wtt = total - ttw;

  const tierPillHtml = tier.startsWith('Yes') ? '<span class="pill green">Primary — tier 1</span>'
    : tier.startsWith('Partly') ? '<span class="pill blue">Modelled — tier 2</span>'
    : '<span class="pill grey">Default — tier 3</span>';

  document.getElementById('calc-result').innerHTML = `
    <div class="result-box">
      <div style="font-size:11px;opacity:.72;text-transform:uppercase;letter-spacing:.06em">Well-to-Wheel emissions · ${v('i-org')} → ${v('i-dst')}</div>
      <div class="big" style="margin-top:8px">${fmt(total, 3)}<small> tCO₂e</small></div>
      <div style="font-size:12px;opacity:.78;margin-top:6px">
        ${fmt(tkm, 0)} t-km × ${ef.toFixed(1)} gCO₂e/t-km${hubs ? ` + ${hubs} hub transfer(s)` : ''}</div>
      <div class="result-split">
        <div><span>Tank-to-Wheel</span><b>${fmt(ttw, 3)} t</b></div>
        <div><span>Well-to-Tank</span><b>${fmt(wtt, 3)} t</b></div>
        <div><span>Intensity</span><b>${ef.toFixed(1)} g/t-km</b></div>
      </div>
    </div>
    <div class="badge-row" style="margin-top:12px">
      ${tierPillHtml}
      <span class="pill navy">${mode} · ${v('i-asset')}</span>
      <span class="pill blue">${fuel}</span>
      <span class="pill grey">GLEC v3.2 factor set (2025-10)</span>
      <span class="pill grey">IPCC AR6 GWP100</span>
      <span class="pill efl">${v('i-cat')}</span>
    </div>
    <div class="note">Factor adjusted from the ${modeDef.ef} gCO₂e/t-km modal default for a load factor of
    ${(load * 100).toFixed(0)}% and empty running of ${(empty * 100).toFixed(0)}%.
    Calculation lineage, inputs and factor vintage are written to the audit trail on save.</div>`;
}

/* =========================================================================
   VIEW: REPORTING HUB
   ========================================================================= */
function viewReporting() {
  const cur = ytd(STATE.year);
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="grid g4">
    <div class="kpi"><div class="lab">Active Disclosure Packs</div><div class="val">${DATA.reportPacks.length}</div><span class="delta flat">5 recurring · 4 ad hoc</span></div>
    <div class="kpi warn"><div class="lab">Due Within 30 Days</div><div class="val">${DATA.reportPacks.filter(r => r.due <= '2026-10-24').length}</div><span class="delta up">Sagawa monthly leads</span></div>
    <div class="kpi lime"><div class="lab">Single Verified Dataset Reuse</div><div class="val">100<small>%</small></div><span class="delta down">no parallel workbooks</span></div>
    <div class="kpi lime"><div class="lab">Manual Consolidation Effort</div><div class="val">-71<small>%</small></div><span class="delta down">vs pre-platform baseline</span></div>
  </div>

  <div class="section-title">Disclosure Calendar</div>
  <div class="tbl-wrap"><table><thead><tr>
    <th>Pack</th><th>Recipient</th><th>Cadence</th><th>Period</th><th>Output format</th>
    <th class="num">Data readiness</th><th>Status</th><th>Due</th><th></th></tr></thead><tbody>
    ${DATA.reportPacks.slice().sort((a, b) => a.due.localeCompare(b.due)).map(r => `<tr>
      <td><strong>${r.name}</strong><br><span class="mono">${r.id}</span></td>
      <td>${r.recipient}</td><td class="muted">${r.freq}</td><td class="muted">${r.period}</td>
      <td class="muted">${r.format}</td>
      <td class="num"><div style="display:flex;gap:7px;align-items:center;justify-content:flex-end">
        <div class="progress" style="width:64px"><i style="width:${r.completeness}%"></i></div>
        <span style="min-width:32px">${r.completeness}%</span></div></td>
      <td>${r.status === 'Awaiting sign-off' ? '<span class="pill blue">Awaiting sign-off</span>'
        : r.status === 'In preparation' ? '<span class="pill amber">In preparation</span>' : '<span class="pill grey">Not started</span>'}</td>
      <td class="mono">${r.due}</td>
      <td><button class="btn" data-export="pack">Generate</button></td></tr>`).join('')}
  </tbody></table></div>

  <div class="section-title">Sagawa / SSJB Group Return — Aug 2026 Preview</div>
  <div class="grid g23">
    <div class="card">
      <div class="card-h"><div><h3>Consolidated Return by Country</h3>
        <p>Mapped to the Sagawa XLSX schema v4 line items</p></div>
        <button class="btn primary right" data-export="sagawa">Export return</button></div>
      <div class="tbl-wrap" style="box-shadow:none"><table class="tbl-sm"><thead><tr>
        <th>Sagawa line</th><th>Country</th><th class="num">Scope 1</th><th class="num">Scope 2 LB</th>
        <th class="num">Scope 2 MB</th><th class="num">Scope 3</th><th class="num">Total</th><th>Assurance</th></tr></thead><tbody>
        ${DATA.countries.map((c, i) => {
          const rows = cur.filter(r => r.country === c.code);
          const s1 = sum(rows.filter(r => r.scope === 1)), s2 = sum(rows.filter(r => r.scope === 2)),
                s3 = sum(rows.filter(r => r.scope === 3));
          return `<tr><td class="mono">SGW-${String(101 + i)}</td><td><strong>${c.name}</strong></td>
            <td class="num">${fmt(s1)}</td><td class="num">${fmt(s2)}</td>
            <td class="num">${fmt(s2 * (c.code === 'NL' || c.code === 'GB' ? 0.34 : 0.78))}</td>
            <td class="num">${fmt(s3)}</td><td class="num"><strong>${fmt(s1 + s2 + s3)}</strong></td>
            <td>${i < 8 ? '<span class="pill green">Ready</span>' : '<span class="pill amber">Pending close</span>'}</td></tr>`;
        }).join('')}
      </tbody></table></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Framework Coverage</h3><p>Same verified dataset, multiple outputs</p></div></div>
      <div class="chart-host donut-host" id="r-frame"></div>
      <div class="note">One consolidation feeds Sagawa monthly and annual returns, SSJB quarterly ESG packs,
      CDP, EcoVadis, customer RFIs and tender annexes — eliminating the parallel spreadsheet reconciliation
      that previously preceded each submission.</div>
    </div>
  </div>

  <div class="section-title">Framework Mapping</div>
  <div class="tbl-wrap"><table><thead><tr>
    <th>Framework / stakeholder</th><th>Data requirement</th><th>Source in platform</th><th>Coverage</th></tr></thead><tbody>
    ${[
      ['Sagawa Group — monthly return', 'Scope 1, 2 (LB & MB), 3 by country and month', 'Consolidation engine → country ledger', 'Complete'],
      ['SSJB — quarterly ESG pack', 'Emissions, energy, intensity, target progress', 'Consolidation + targets module', 'Complete'],
      ['CDP Climate Change', 'C6 emissions data, C7 breakdowns, C5 base year, C10 verification', 'Full inventory + audit trail', 'Complete'],
      ['EcoVadis — Environment', 'Reported footprint, targets, management system evidence', 'Inventory + methodology register', 'Complete'],
      ['ESRS E1 (customer-driven)', 'Gross Scope 1/2/3 by category, intensity, transition plan', 'Category ledger + targets', 'Partial — transition plan narrative external'],
      ['GLEC / ISO 14083 customer RFI', 'Shipment-level t-km, WTW, TTW, load factor, data tier', 'Freight ledger', 'Complete'],
      ['SBTi progress reporting', 'Base year, recalculations, annual actuals vs pathway', 'Targets module', 'Complete'],
      ['Limited assurance (external)', 'Source evidence, calculation lineage, approvals', 'Audit trail + document vault', 'Complete']
    ].map(([a, b, c, d]) => `<tr><td><strong>${a}</strong></td><td class="muted">${b}</td><td>${c}</td>
      <td>${d === 'Complete' ? '<span class="pill green">Complete</span>' : '<span class="pill amber">' + d + '</span>'}</td></tr>`).join('')}
  </tbody></table></div>`;
  mount(el);

  donut(document.getElementById('r-frame'), {
    items: [{ key: 'Sagawa', value: 34 }, { key: 'SSJB', value: 22 },
      { key: 'CDP / EcoVadis', value: 18 }, { key: 'Customer RFI', value: 17 }, { key: 'Tenders', value: 9 }],
    centerValue: '9', centerLabel: 'active packs'
  });
}

/* =========================================================================
   VIEW: TARGETS
   ========================================================================= */
function viewTargets() {
  const years = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const base12 = sum(q({ year: 2023, scope: 1 })) + sum(q({ year: 2023, scope: 2 }));
  const actual12 = years.map(y => {
    if (y > 2026) return null;
    const v = sum(q({ year: y, scope: 1 })) + sum(q({ year: y, scope: 2 }));
    return y === 2026 ? v * (12 / YTD_MONTHS) : v;
  });
  const path12 = years.map((y, i) => base12 * (1 - 0.42 * (i / 7)));
  const base3 = sum(q({ year: 2023, scope: 3 }));
  const actual3 = years.map(y => {
    if (y > 2026) return null;
    const v = sum(q({ year: y, scope: 3 }));
    return y === 2026 ? v * (12 / YTD_MONTHS) : v;
  });
  const path3 = years.map((y, i) => base3 * (1 - 0.30 * (i / 7)));

  const el = document.createElement('div');
  el.innerHTML = `
  <div class="grid g4">
    <div class="kpi"><div class="lab">Base Year (FY2023)</div><div class="val">${fmt(sum(q({ year: 2023 })) / 1000, 1)}<small>kt</small></div><span class="delta flat">recalculation threshold 5%</span></div>
    <div class="kpi lime"><div class="lab">Scope 1+2 vs Base</div><div class="val">${(((actual12[3] - base12) / base12) * 100).toFixed(1)}<small>%</small></div><span class="delta down">target -42% by 2030</span></div>
    <div class="kpi"><div class="lab">Scope 3 vs Base</div><div class="val">${(((actual3[3] - base3) / base3) * 100).toFixed(1)}<small>%</small></div><span class="delta up">target -30% by 2030</span></div>
    <div class="kpi warn"><div class="lab">Gap to 2030 Pathway</div><div class="val">${fmt((actual3[3] - path3[3]) / 1000, 1)}<small>kt</small></div><span class="delta up">Scope 3 behind trajectory</span></div>
  </div>

  <div class="grid g2" style="margin-top:14px">
    <div class="card">
      <div class="card-h"><div><h3>Scope 1 + 2 — Absolute Pathway</h3><p>FY2023 base year · 2030 target · tCO₂e</p></div>
        <span class="pill green right">On track</span></div>
      <div class="chart-host" id="t-12"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Scope 3 — Absolute Pathway</h3><p>FY2023 base year · 2030 target · tCO₂e</p></div>
        <span class="pill amber right">At risk</span></div>
      <div class="chart-host" id="t-3"></div>
    </div>
  </div>

  <div class="section-title">Target Register</div>
  <div class="tbl-wrap"><table><thead><tr>
    <th>Target</th><th>Scopes</th><th>Framework</th><th>Base year</th><th>Target year</th>
    <th class="num">Ambition</th><th>Progress</th><th>Status</th></tr></thead><tbody>
    ${DATA.targets.map((t, i) => `<tr>
      <td><strong>${t.name}</strong>${t.extra ? `<br><span class="muted" style="font-size:11px">${t.extra}</span>` : ''}</td>
      <td><span class="pill navy">Scope ${t.scopes}</span></td><td class="muted">${t.framework}</td>
      <td class="num">${t.base}</td><td class="num">${t.target}</td>
      <td class="num">${t.reduction ? '-' + (t.reduction * 100).toFixed(0) + '%' : '—'}</td>
      <td><div style="display:flex;gap:8px;align-items:center">
        <div class="progress" style="width:90px"><i style="width:${[23, 11, 31, 24, 9][i]}%;background:${t.status === 'On track' ? 'var(--efl)' : t.status === 'At risk' ? 'var(--amber)' : 'var(--red)'}"></i></div>
        <span>${[23, 11, 31, 24, 9][i]}%</span></div></td>
      <td>${t.status === 'On track' ? '<span class="pill green">On track</span>'
        : t.status === 'At risk' ? '<span class="pill amber">At risk</span>' : '<span class="pill red">Behind</span>'}</td>
    </tr>`).join('')}
  </tbody></table></div>

  <div class="section-title">Decarbonisation Levers — Modelled Impact</div>
  <div class="grid g2">
    <div class="card">
      <div class="card-h"><div><h3>Abatement Potential by 2030</h3><p>tCO₂e per annum, modelled</p></div></div>
      <div class="chart-host" id="t-levers"></div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Lever Detail</h3><p>Ownership and dependency</p></div></div>
      <div class="tbl-wrap" style="box-shadow:none"><table class="tbl-sm"><thead><tr>
        <th>Lever</th><th>Scope</th><th>Owner</th><th>Dependency</th></tr></thead><tbody>
        ${[
          ['Modal shift air → ocean on eligible lanes', '3', 'Product / Air', 'Customer lead-time agreement'],
          ['Carrier selection weighted by GLEC intensity', '3', 'Procurement', 'Carrier primary-data supply'],
          ['Load factor optimisation & consolidation', '3', 'Network Ops', 'TMS planning rules'],
          ['Rooftop solar — DC portfolio', '2', 'Group Engineering', 'Capex approval'],
          ['I-REC / PPA procurement expansion', '2', 'Procurement', 'Market availability by country'],
          ['Fleet renewal to Euro VI / HVO', '1', 'Fleet', 'HVO supply in LK and IN'],
          ['Electric MHE conversion', '1', 'Site Ops', 'Charging infrastructure'],
          ['Refrigerant leak programme', '1', 'Group Engineering', 'Service contract change']
        ].map(([a, b, c, d]) => `<tr><td><strong>${a}</strong></td>
          <td><span class="pill ${b === '1' ? 'navy' : b === '2' ? 'blue' : 'efl'}">S${b}</span></td>
          <td class="muted">${c}</td><td class="muted">${d}</td></tr>`).join('')}
      </tbody></table></div>
    </div>
  </div>`;
  mount(el);

  pathwayChart(document.getElementById('t-12'), { years, actual: actual12, pathway: path12 });
  pathwayChart(document.getElementById('t-3'), { years, actual: actual3, pathway: path3 });
  hBar(document.getElementById('t-levers'), {
    items: [
      { key: 'Carrier selection by intensity', value: 28400 },
      { key: 'Load factor optimisation', value: 21900 },
      { key: 'Modal shift air → ocean', value: 18600 },
      { key: 'I-REC / PPA expansion', value: 9800 },
      { key: 'Rooftop solar', value: 6100 },
      { key: 'Fleet renewal / HVO', value: 4700 },
      { key: 'Electric MHE', value: 1300 },
      { key: 'Refrigerant programme', value: 900 }
    ], color: '#e2620d'
  });
}

/* =========================================================================
   VIEW: METHODOLOGY & AUDIT
   ========================================================================= */
function viewAudit() {
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="grid g4">
    <div class="kpi"><div class="lab">Methodology Entries Under Version Control</div><div class="val">${DATA.methodology.length}</div><span class="delta down">all change-logged</span></div>
    <div class="kpi"><div class="lab">Factor Library Vintage</div><div class="val">2026<small>edition</small></div><span class="delta down">GLEC v3.2 · IEA 2026 · AR6</span></div>
    <div class="kpi"><div class="lab">Audit Events (30 Days)</div><div class="val">${DATA.audit.length * 24}</div><span class="delta flat">immutable log</span></div>
    <div class="kpi lime"><div class="lab">Assurance Readiness</div><div class="val">Limited<small>FY2025</small></div><span class="delta down">evidence pack complete</span></div>
  </div>

  <div class="section-title">Calculation Methodology Register</div>
  <div class="tbl-wrap"><table><thead><tr>
    <th>Area</th><th>Basis applied</th><th>Authoritative source</th><th>Vintage</th><th>Owner</th></tr></thead><tbody>
    ${DATA.methodology.map(m => `<tr><td><strong>${m.area}</strong></td><td>${m.basis}</td>
      <td class="muted">${m.source}</td><td class="mono">${m.vintage}</td><td class="muted">${m.owner}</td></tr>`).join('')}
  </tbody></table></div>

  <div class="grid g2" style="margin-top:22px">
    <div class="card">
      <div class="card-h"><div><h3>Audit Trail</h3><p>Every restatement, approval and factor change</p></div></div>
      <div class="timeline">
        ${DATA.audit.map(a => `<div class="tl-item">
          <div class="tl-ts">${a.ts}</div>
          <div class="tl-body"><strong>${a.action}</strong> — ${a.object}
            <p>${a.note} <span class="muted">· ${a.user}</span></p></div></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Evidence Chain</h3><p>What is retained behind every reported figure</p></div></div>
      <div class="tbl-wrap" style="box-shadow:none"><table class="tbl-sm"><thead><tr>
        <th>Artefact</th><th>Retention</th></tr></thead><tbody>
        ${[
          ['Source record (invoice, manifest, telematics extract)', '7 years'],
          ['Ingestion fingerprint and load timestamp', '7 years'],
          ['Unit conversion and entity mapping applied', '7 years'],
          ['Emission factor value, source and vintage', '7 years'],
          ['Allocation and estimation rationale', '7 years'],
          ['Validation rule results and exception disposition', '7 years'],
          ['Preparer, reviewer and approver identity', '7 years'],
          ['Period lock and any subsequent restatement', 'Permanent'],
          ['External assurance sampling correspondence', '7 years']
        ].map(([a, b]) => `<tr><td>${a}</td><td class="muted">${b}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="note">Restatements never overwrite history. A corrected figure creates a new version with
      the prior value, the reason and the approver retained — which is what external assurance providers
      and the Sagawa group audit both test for.</div>
    </div>
  </div>`;
  mount(el);
}

/* =========================================================================
   Shared UI helpers
   ========================================================================= */
function filterBar() {
  const regions = [...new Set(DATA.countries.map(c => c.region))];
  return `<div class="filters">
    <div><label>Reporting year</label><select data-state="year">
      ${DATA.years.map(y => `<option value="${y}" ${STATE.year === y ? 'selected' : ''}>${y}${y === 2026 ? ' (YTD)' : ''}</option>`).join('')}
    </select></div>
    <div><label>Region</label><select data-state="region">
      <option value="ALL">All regions</option>
      ${regions.map(r => `<option ${STATE.region === r ? 'selected' : ''}>${r}</option>`).join('')}
    </select></div>
    <div><label>Country</label><select data-state="country">
      <option value="ALL">All countries</option>
      ${DATA.countries.map(c => `<option value="${c.code}" ${STATE.country === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
    </select></div>
    <div><label>Facility type</label><select data-state="facilityType">
      <option value="ALL">All types</option>
      ${[...new Set(DATA.facilities.map(f => f.type))].map(t => `<option ${STATE.facilityType === t ? 'selected' : ''}>${t}</option>`).join('')}
    </select></div>
    <div style="margin-left:auto;display:flex;gap:8px">
      <button class="btn" data-reset="1">Clear filters</button>
      <button class="btn primary" data-export="inventory">Export inventory</button>
    </div>
  </div>`;
}
function sevPill(s) {
  return s === 'Critical' ? '<span class="pill red">Critical</span>'
    : s === 'High' ? '<span class="pill amber">High</span>' : '<span class="pill grey">Medium</span>';
}
function tierPill(t) {
  return t === 'Primary' ? '<span class="pill green">Primary</span>'
    : t === 'Mixed' ? '<span class="pill blue">Mixed</span>'
    : t === 'Modelled' ? '<span class="pill amber">Modelled</span>'
    : '<span class="pill grey">Secondary</span>';
}
function tierBadge(t) {
  return t.startsWith('Primary') ? '<span class="pill green">Primary</span>'
    : t.startsWith('Modelled') ? '<span class="pill blue">Modelled</span>'
    : '<span class="pill grey">Default</span>';
}
function mount(node) {
  const host = document.getElementById('view');
  host.innerHTML = '';
  host.appendChild(node);
}

/* ---------------- CSV export ---------------- */
function toCsv(rows, headers) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}
function download(name, text) {
  const b = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
function handleExport(kind) {
  if (kind === 'shipments') {
    download('efl_glec_shipment_ledger.csv', toCsv(DATA.shipments, Object.keys(DATA.shipments[0])));
  } else if (kind === 'sagawa') {
    const cur = ytd(STATE.year);
    const rows = DATA.countries.map(c => {
      const r = cur.filter(x => x.country === c.code);
      return { sagawa_line: c.code, country: c.name,
        scope1_tco2e: sum(r.filter(x => x.scope === 1)).toFixed(2),
        scope2_lb_tco2e: sum(r.filter(x => x.scope === 2)).toFixed(2),
        scope3_tco2e: sum(r.filter(x => x.scope === 3)).toFixed(2),
        period: `YTD ${STATE.year}`, basis: 'Operational control / GHG Protocol / ISO 14083' };
    });
    download('efl_sagawa_group_return.csv', toCsv(rows, Object.keys(rows[0])));
  } else {
    download('efl_ghg_inventory.csv', toCsv(ytd(STATE.year), Object.keys(DATA.series[0])));
  }
}

/* ---------------- Router & events ---------------- */
const VIEWS = {
  dashboard: viewDashboard, explorer: viewExplorer, freight: viewFreight,
  sources: viewSources, quality: viewQuality, calculator: viewCalculator,
  reporting: viewReporting, targets: viewTargets, audit: viewAudit
};
function render() {
  const [t, s] = VIEW_META[STATE.view];
  document.getElementById('viewTitle').textContent = t;
  document.getElementById('viewSub').textContent = s;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === STATE.view));
  VIEWS[STATE.view]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', e => {
  const nav = e.target.closest('.nav-item');
  if (nav) { STATE.view = nav.dataset.view; return render(); }
  const goto = e.target.closest('[data-goto]');
  if (goto) { STATE.view = goto.dataset.goto; return render(); }
  const ex = e.target.closest('[data-export]');
  if (ex) return handleExport(ex.dataset.export);
  const rs = e.target.closest('[data-reset]');
  if (rs) { STATE.region = 'ALL'; STATE.country = 'ALL'; STATE.facilityType = 'ALL'; return render(); }
});
document.addEventListener('change', e => {
  const s = e.target.closest('[data-state]');
  if (!s) return;
  const k = s.dataset.state;
  STATE[k] = k === 'year' ? parseInt(s.value, 10) : s.value;
  render();
});
document.addEventListener('input', e => {
  const s = e.target.closest('[data-state="shipSearch"]');
  if (!s) return;
  clearTimeout(window.__t);
  window.__t = setTimeout(() => {
    STATE.shipSearch = s.value;
    render();
    const f = document.querySelector('[data-state="shipSearch"]');
    if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
  }, 320);
});

document.getElementById('navAnomalies').textContent =
  DATA.anomalies.filter(a => a.status !== 'Resolved').length;
render();
