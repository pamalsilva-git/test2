/* =========================================================================
   EFL Carbon Emission Management Platform — Dummy Data Layer
   All figures are SYNTHETIC and for prototype/demo purposes only.
   ========================================================================= */

let __seed = 20260924;
function rnd() {
  __seed = (__seed * 1664525 + 1013904223) % 4294967296;
  return __seed / 4294967296;
}
function jitter(base, pct) { return base * (1 + (rnd() - 0.5) * 2 * pct); }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }

/* ---------- Organisation structure ---------- */
const COUNTRIES = [
  { code: 'LK', name: 'Sri Lanka',   region: 'South Asia',  grid: 0.533, weight: 0.22, lat: 7.0,  lon: 80.8 },
  { code: 'IN', name: 'India',       region: 'South Asia',  grid: 0.713, weight: 0.17, lat: 20.6, lon: 78.9 },
  { code: 'BD', name: 'Bangladesh',  region: 'South Asia',  grid: 0.648, weight: 0.09, lat: 23.7, lon: 90.4 },
  { code: 'SG', name: 'Singapore',   region: 'SE Asia',     grid: 0.412, weight: 0.08, lat: 1.35, lon: 103.8 },
  { code: 'VN', name: 'Vietnam',     region: 'SE Asia',     grid: 0.601, weight: 0.07, lat: 14.1, lon: 108.3 },
  { code: 'CN', name: 'China',       region: 'North Asia',  grid: 0.581, weight: 0.11, lat: 33.0, lon: 112.0 },
  { code: 'JP', name: 'Japan',       region: 'North Asia',  grid: 0.457, weight: 0.06, lat: 36.2, lon: 138.3 },
  { code: 'AE', name: 'UAE',         region: 'Middle East', grid: 0.395, weight: 0.05, lat: 24.4, lon: 54.4 },
  { code: 'NL', name: 'Netherlands', region: 'Europe',      grid: 0.268, weight: 0.06, lat: 52.1, lon: 5.3 },
  { code: 'GB', name: 'United Kingdom', region: 'Europe',   grid: 0.207, weight: 0.04, lat: 54.0, lon: -2.0 },
  { code: 'US', name: 'United States', region: 'Americas',  grid: 0.373, weight: 0.05, lat: 39.5, lon: -98.4 }
];

const FACILITY_COORDS = {
  'EFL Welisara DC': [7.03, 79.92], 'EFL Katunayake CFS': [7.17, 79.88],
  'EFL Colombo HQ': [6.93, 79.86], 'EFL Ekala Fleet Depot': [7.10, 79.91],
  'EFL Biyagama Cold Store': [6.95, 80.00],
  'EFL Chennai DC': [13.08, 80.27], 'EFL Mumbai CFS': [19.08, 72.88],
  'EFL Bengaluru Office': [12.97, 77.59], 'EFL Gurugram DC': [28.46, 77.03],
  'EFL Dhaka DC': [23.81, 90.41], 'EFL Chattogram CFS': [22.35, 91.81],
  'EFL Singapore Hub': [1.33, 103.75], 'EFL Jurong DC': [1.32, 103.70],
  'EFL Ho Chi Minh DC': [10.82, 106.63], 'EFL Hanoi CFS': [21.03, 105.85],
  'EFL Shenzhen Hub': [22.54, 114.06], 'EFL Shanghai CFS': [31.23, 121.47],
  'EFL Ningbo Office': [29.87, 121.55],
  'EFL Tokyo Office': [35.68, 139.69], 'EFL Osaka DC': [34.69, 135.50],
  'EFL Jebel Ali DC': [25.01, 55.06], 'EFL Dubai Office': [25.20, 55.27],
  'EFL Rotterdam DC': [51.92, 4.48], 'EFL Amsterdam Office': [52.37, 4.90],
  'EFL Felixstowe CFS': [51.96, 1.35], 'EFL London Office': [51.51, -0.13],
  'EFL New Jersey DC': [40.73, -74.17], 'EFL LA Office': [34.05, -118.24]
};

const FACILITIES = (() => {
  const names = {
    LK: ['EFL Welisara DC', 'EFL Katunayake CFS', 'EFL Colombo HQ', 'EFL Ekala Fleet Depot', 'EFL Biyagama Cold Store'],
    IN: ['EFL Chennai DC', 'EFL Mumbai CFS', 'EFL Bengaluru Office', 'EFL Gurugram DC'],
    BD: ['EFL Dhaka DC', 'EFL Chattogram CFS'],
    SG: ['EFL Singapore Hub', 'EFL Jurong DC'],
    VN: ['EFL Ho Chi Minh DC', 'EFL Hanoi CFS'],
    CN: ['EFL Shenzhen Hub', 'EFL Shanghai CFS', 'EFL Ningbo Office'],
    JP: ['EFL Tokyo Office', 'EFL Osaka DC'],
    AE: ['EFL Jebel Ali DC', 'EFL Dubai Office'],
    NL: ['EFL Rotterdam DC', 'EFL Amsterdam Office'],
    GB: ['EFL Felixstowe CFS', 'EFL London Office'],
    US: ['EFL New Jersey DC', 'EFL LA Office']
  };
  const out = [];
  let id = 1000;
  COUNTRIES.forEach(c => {
    names[c.code].forEach(n => {
      const type = n.includes('Office') || n.includes('HQ') ? 'Office / HQ'
        : n.includes('CFS') ? 'Freight Station (CFS)'
        : n.includes('Cold') ? 'Cold Store'
        : n.includes('Depot') ? 'Fleet Depot' : 'Warehouse / DC';
      const co = FACILITY_COORDS[n] || [c.lat, c.lon];
      out.push({
        id: 'FAC-' + (++id),
        name: n, country: c.code, countryName: c.name, region: c.region, type,
        lat: co[0], lon: co[1],
        area: Math.round(jitter(type === 'Office / HQ' ? 2200 : 18000, 0.5)),
        headcount: Math.round(jitter(type === 'Office / HQ' ? 90 : 210, 0.6)),
        share: c.weight / names[c.code].length
      });
    });
  });
  return out;
})();

/* ---------- Emission category taxonomy ---------- */
const CATEGORIES = [
  { id: 's1-fleet',   scope: 1, name: 'Owned fleet — diesel',       source: 'Fuel card / telematics', tier: 'Primary' },
  { id: 's1-gen',     scope: 1, name: 'Standby generators',          source: 'Fuel purchase logs',     tier: 'Primary' },
  { id: 's1-mhe',     scope: 1, name: 'MHE / forklifts (LPG)',       source: 'Supplier invoices',      tier: 'Primary' },
  { id: 's1-ref',     scope: 1, name: 'Refrigerant fugitives',       source: 'Service reports',        tier: 'Modelled' },
  { id: 's2-elec-lb', scope: 2, name: 'Purchased electricity (LB)',  source: 'Utility bills',          tier: 'Primary' },
  { id: 's3-c1',      scope: 3, name: 'Cat 1 — Purchased goods & services', source: 'Spend / AP ledger', tier: 'Secondary' },
  { id: 's3-c2',      scope: 3, name: 'Cat 2 — Capital goods',       source: 'Fixed asset register',   tier: 'Secondary' },
  { id: 's3-c3',      scope: 3, name: 'Cat 3 — Fuel & energy related', source: 'Derived from S1/S2',   tier: 'Modelled' },
  { id: 's3-c4',      scope: 3, name: 'Cat 4 — Upstream transport (subcontracted freight)', source: 'TMS / CargoWise', tier: 'Mixed' },
  { id: 's3-c5',      scope: 3, name: 'Cat 5 — Waste generated',     source: 'Waste contractor',       tier: 'Secondary' },
  { id: 's3-c6',      scope: 3, name: 'Cat 6 — Business travel',     source: 'TMC feed',               tier: 'Primary' },
  { id: 's3-c7',      scope: 3, name: 'Cat 7 — Employee commuting',  source: 'Annual survey',          tier: 'Modelled' },
  { id: 's3-c8',      scope: 3, name: 'Cat 8 — Upstream leased assets', source: 'Lease register',      tier: 'Secondary' },
  { id: 's3-c9',      scope: 3, name: 'Cat 9 — Downstream transport', source: 'TMS / CargoWise',       tier: 'Mixed' },
  { id: 's3-c13',     scope: 3, name: 'Cat 13 — Downstream leased assets', source: 'Lease register',   tier: 'Secondary' }
];

const CATEGORY_WEIGHT = {
  's1-fleet': 0.052, 's1-gen': 0.011, 's1-mhe': 0.007, 's1-ref': 0.005,
  's2-elec-lb': 0.083,
  's3-c1': 0.061, 's3-c2': 0.014, 's3-c3': 0.022,
  's3-c4': 0.494, 's3-c5': 0.006, 's3-c6': 0.018, 's3-c7': 0.021,
  's3-c8': 0.009, 's3-c9': 0.181, 's3-c13': 0.016
};

/* ---------- Monthly time series 2023 → 2026 ---------- */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS = [2023, 2024, 2025, 2026];
const CURRENT_MONTH_INDEX = 8;
const BASE_ANNUAL_TCO2E = 486400;

const SERIES = (() => {
  const rows = [];
  const yearFactor = { 2023: 1.0, 2024: 0.985, 2025: 0.941, 2026: 0.902 };
  const seasonal = [0.94, 0.89, 1.02, 0.98, 1.01, 0.99, 1.03, 1.05, 1.04, 1.09, 1.08, 0.98];
  YEARS.forEach(y => {
    MONTHS.forEach((m, mi) => {
      if (y === 2026 && mi > CURRENT_MONTH_INDEX) return;
      CATEGORIES.forEach(cat => {
        const w = CATEGORY_WEIGHT[cat.id] || 0;
        FACILITIES.forEach(f => {
          const base = BASE_ANNUAL_TCO2E * w * f.share * seasonal[mi] / 12;
          let v = jitter(base * yearFactor[y], 0.14);
          if (cat.id === 's2-elec-lb') v *= (COUNTRIES.find(c => c.code === f.country).grid / 0.50);
          if (cat.scope === 3 && f.type === 'Office / HQ') v *= 0.35;
          rows.push({
            year: y, monthIndex: mi, month: m, period: `${y}-${String(mi + 1).padStart(2, '0')}`,
            facilityId: f.id, country: f.country, region: f.region, facilityType: f.type,
            categoryId: cat.id, scope: cat.scope, tCO2e: +v.toFixed(2),
            dataTier: cat.tier, verified: y < 2026 || mi < 7
          });
        });
      });
    });
  });
  return rows;
})();

/* ---------- Freight shipments (ISO 14083 / GLEC data points) ---------- */
const MODES = [
  { mode: 'Ocean',  ef: 12.4,  sub: ['Container 8k+ TEU','Container 3–8k TEU','Break bulk'] },
  { mode: 'Air',    ef: 866.0, sub: ['Belly-hold widebody','Freighter B777F','Belly-hold narrowbody'] },
  { mode: 'Road',   ef: 96.2,  sub: ['Artic >33t diesel','Rigid 7.5–12t','Van <3.5t','Artic >33t HVO'] },
  { mode: 'Rail',   ef: 24.1,  sub: ['Electric intermodal','Diesel intermodal'] },
  { mode: 'Inland waterway', ef: 31.5, sub: ['Barge 1–2k t'] }
];

const LANES = [
  ['CNSHA','LKCMB','Ocean'], ['LKCMB','NLRTM','Ocean'], ['INMAA','LKCMB','Ocean'],
  ['BDDAC','SGSIN','Ocean'], ['VNSGN','USNYC','Ocean'], ['LKCMB','GBFXT','Ocean'],
  ['LKCMB','AEJEA','Ocean'], ['CNSZX','JPTYO','Ocean'],
  ['LKCMB','GBLHR','Air'],   ['INBLR','NLAMS','Air'],  ['CNPVG','USLAX','Air'],
  ['NLRTM','DEHAM','Road'],  ['LKCMB','LKKDY','Road'], ['INMAA','INBLR','Road'],
  ['CNSZX','CNSHA','Rail'],  ['NLRTM','DEDUI','Inland waterway']
];

const CARRIERS = ['Maersk','MSC','CMA CGM','ONE','Emirates SkyCargo','Qatar Airways Cargo',
  'Cathay Cargo','DB Schenker Rail','EFL Own Fleet','Subcontractor — Lanka Trans',
  'Subcontractor — Bharat Roadways','Contargo Barge'];

const DQ_TIERS = ['Primary (carrier fuel)', 'Modelled (route + load)', 'Default (GLEC factor)'];

const SHIPMENTS = (() => {
  const out = [];
  for (let i = 0; i < 420; i++) {
    const lane = pick(LANES);
    const modeDef = MODES.find(m => m.mode === lane[2]);
    const sub = pick(modeDef.sub);
    const dist = lane[2] === 'Ocean' ? Math.round(jitter(8200, 0.6))
      : lane[2] === 'Air' ? Math.round(jitter(7400, 0.5))
      : lane[2] === 'Rail' ? Math.round(jitter(1500, 0.5))
      : Math.round(jitter(420, 0.8));
    const grossT = +(jitter(lane[2] === 'Air' ? 2.4 : 17.5, 0.8)).toFixed(2);
    const loadFactor = +(jitter(0.72, 0.28)).toFixed(2);
    const empty = +(jitter(lane[2] === 'Road' ? 0.19 : 0.07, 0.6)).toFixed(2);
    const tier = rnd() < 0.28 ? DQ_TIERS[0] : rnd() < 0.6 ? DQ_TIERS[1] : DQ_TIERS[2];
    const efAdj = modeDef.ef * (0.72 / loadFactor) * (1 + empty * 0.35) * (sub.includes('HVO') ? 0.18 : 1);
    const tkm = grossT * dist;
    const wtw = tkm * efAdj / 1000;
    const ttw = wtw * (lane[2] === 'Air' ? 0.80 : 0.79);
    const month = Math.floor(rnd() * (CURRENT_MONTH_INDEX + 1));
    out.push({
      id: 'SHP-2026-' + String(10500 + i),
      origin: lane[0], destination: lane[1], mode: lane[2], assetClass: sub,
      carrier: pick(CARRIERS),
      fuel: sub.includes('HVO') ? 'HVO100' : lane[2] === 'Ocean' ? 'VLSFO' : lane[2] === 'Air' ? 'Jet A-1'
        : lane[2] === 'Rail' && sub.includes('Electric') ? 'Grid electricity' : 'Diesel (B7)',
      distanceKm: dist, grossWeightT: grossT, tkm: +tkm.toFixed(0),
      loadFactor, emptyRunning: empty, efApplied: +efAdj.toFixed(1),
      wtwTco2e: +(wtw / 1000).toFixed(3),
      ttwTco2e: +(ttw / 1000).toFixed(3),
      wttTco2e: +((wtw - ttw) / 1000).toFixed(3),
      dataTier: tier,
      ghgCategory: rnd() < 0.72 ? 'Scope 3 Cat 4' : 'Scope 3 Cat 9',
      period: `2026-${String(month + 1).padStart(2, '0')}`,
      customer: pick(['Sagawa Express','SSJB','MAS Holdings','Brandix','Hirdaramani','Unilever LK','Nike APAC','Decathlon','Internal']),
      verified: rnd() < 0.81
    });
  }
  return out;
})();

/* ---------- Data quality & validation ---------- */
const VALIDATION_RULES = [
  { id: 'VR-01', name: 'Electricity kWh within ±35% of 12-month rolling mean', domain: 'Scope 2', severity: 'High', auto: true },
  { id: 'VR-02', name: 'No missing utility bill for an active facility-month', domain: 'Scope 2', severity: 'Critical', auto: true },
  { id: 'VR-03', name: 'Fuel litres reconcile to fuel-card spend ±5%', domain: 'Scope 1', severity: 'High', auto: true },
  { id: 'VR-04', name: 'Shipment distance ≥ great-circle distance between ports', domain: 'Scope 3 Cat 4', severity: 'Medium', auto: true },
  { id: 'VR-05', name: 'Chargeable weight not substituted for gross actual mass', domain: 'Scope 3 Cat 4', severity: 'High', auto: true },
  { id: 'VR-06', name: 'Load factor between 0.15 and 1.00', domain: 'Scope 3 Cat 4', severity: 'Medium', auto: true },
  { id: 'VR-07', name: 'Emission factor vintage ≤ 24 months old', domain: 'Methodology', severity: 'High', auto: true },
  { id: 'VR-08', name: 'Refrigerant top-up volume vs nameplate charge plausibility', domain: 'Scope 1', severity: 'Medium', auto: true },
  { id: 'VR-09', name: 'Unit of measure conforms to master UoM registry', domain: 'All', severity: 'Critical', auto: true },
  { id: 'VR-10', name: 'Duplicate shipment reference across TMS extracts', domain: 'Scope 3', severity: 'High', auto: true },
  { id: 'VR-11', name: 'Market-based Scope 2 ≤ location-based where RECs claimed', domain: 'Scope 2', severity: 'Medium', auto: true },
  { id: 'VR-12', name: 'Intercompany freight not double-counted in Cat 4 and Cat 9', domain: 'Scope 3', severity: 'Critical', auto: false }
];

const ANOMALIES = [
  { id: 'ANO-2041', period: '2026-08', facility: 'EFL Jebel Ali DC', country: 'AE', rule: 'VR-01', severity: 'High', status: 'Open', detail: 'Electricity 214,800 kWh vs rolling mean 138,400 kWh (+55%). No HVAC works logged.', owner: 'Country Ops — UAE', delta: '+55%' },
  { id: 'ANO-2040', period: '2026-08', facility: 'EFL Chattogram CFS', country: 'BD', rule: 'VR-02', severity: 'Critical', status: 'Open', detail: 'No utility invoice received for Aug-26. Estimate currently applied (modelled tier).', owner: 'Finance Shared Services', delta: 'Missing' },
  { id: 'ANO-2039', period: '2026-08', facility: 'Group — TMS feed', country: '—', rule: 'VR-10', severity: 'High', status: 'In review', detail: '37 shipment references appear in both CargoWise and the 3PL manifest extract.', owner: 'Business Systems', delta: '37 recs' },
  { id: 'ANO-2038', period: '2026-07', facility: 'EFL Ekala Fleet Depot', country: 'LK', rule: 'VR-03', severity: 'High', status: 'Resolved', detail: 'Diesel litres under-reported by 8.2% vs fuel-card spend. Telematics re-extract applied.', owner: 'Fleet — LK', delta: '-8.2%' },
  { id: 'ANO-2037', period: '2026-07', facility: 'Group — Air lanes', country: '—', rule: 'VR-05', severity: 'High', status: 'Open', detail: 'Chargeable weight detected on 118 air shipments; gross actual mass required under ISO 14083.', owner: 'Air Product', delta: '118 recs' },
  { id: 'ANO-2036', period: '2026-07', facility: 'EFL Shenzhen Hub', country: 'CN', rule: 'VR-06', severity: 'Medium', status: 'In review', detail: 'Load factor 1.18 reported on 9 road legs — exceeds physical capacity.', owner: 'Country Ops — CN', delta: '1.18' },
  { id: 'ANO-2035', period: '2026-06', facility: 'EFL Biyagama Cold Store', country: 'LK', rule: 'VR-08', severity: 'Medium', status: 'Resolved', detail: 'R-404A top-up 42kg vs 30kg nameplate. Leak confirmed and repaired; figure retained.', owner: 'Group Engineering', delta: '+40%' },
  { id: 'ANO-2034', period: '2026-06', facility: 'EFL Rotterdam DC', country: 'NL', rule: 'VR-11', severity: 'Medium', status: 'Resolved', detail: 'REC claim exceeded metered consumption by 3.1%. Contract volume corrected.', owner: 'Country Ops — NL', delta: '+3.1%' },
  { id: 'ANO-2033', period: '2026-06', facility: 'Group — Factor library', country: '—', rule: 'VR-07', severity: 'High', status: 'Open', detail: 'DEFRA 2024 factors still mapped to 6 waste streams; DEFRA 2026 available.', owner: 'Sustainability', delta: '2 yrs' },
  { id: 'ANO-2032', period: '2026-05', facility: 'EFL Gurugram DC', country: 'IN', rule: 'VR-09', severity: 'Critical', status: 'Resolved', detail: 'Diesel submitted in US gallons against a litres-configured field.', owner: 'Country Ops — IN', delta: '3.79x' }
];

/* ---------- Targets ---------- */
const TARGETS = [
  { id: 'TGT-01', name: 'Near-term: Scope 1+2 absolute reduction', base: 2023, target: 2030, reduction: 0.42, scopes: '1+2', framework: 'SBTi 1.5°C aligned', status: 'On track' },
  { id: 'TGT-02', name: 'Near-term: Scope 3 intensity (tCO2e / M t-km)', base: 2023, target: 2030, reduction: 0.30, scopes: '3', framework: 'SBTi WB2C', status: 'At risk' },
  { id: 'TGT-03', name: 'Renewable electricity share', base: 2023, target: 2030, reduction: null, scopes: '2', framework: 'RE100 aligned', status: 'On track', extra: '100% by 2030 — currently 31%' },
  { id: 'TGT-04', name: 'Owned fleet — low-carbon vehicle share', base: 2024, target: 2028, reduction: null, scopes: '1', framework: 'Internal', status: 'Behind', extra: '25% by 2028 — currently 6%' },
  { id: 'TGT-05', name: 'Sagawa Group alignment — Net Zero', base: 2023, target: 2050, reduction: 1.00, scopes: '1+2+3', framework: 'Sagawa Group', status: 'On track' }
];

/* ---------- Reporting packs ---------- */
const REPORT_PACKS = [
  { id: 'RPT-SGW-M', name: 'Sagawa Express — Monthly Emissions Return', recipient: 'Sagawa', freq: 'Monthly', due: '2026-10-10', period: 'Sep 2026', status: 'In preparation', completeness: 62, format: 'Sagawa XLSX schema v4' },
  { id: 'RPT-SSJB-Q', name: 'SSJB — Quarterly ESG Data Pack', recipient: 'SSJB', freq: 'Quarterly', due: '2026-10-25', period: 'Q3 FY26', status: 'In preparation', completeness: 48, format: 'SSJB ESG template' },
  { id: 'RPT-SGW-A', name: 'Sagawa Group — Annual GHG Inventory', recipient: 'Sagawa', freq: 'Annual', due: '2027-04-30', period: 'FY2026', status: 'Not started', completeness: 0, format: 'GHG Protocol + ISO 14083' },
  { id: 'RPT-CDP', name: 'CDP Climate Change Questionnaire', recipient: 'CDP', freq: 'Annual', due: '2027-06-11', period: 'FY2026', status: 'Not started', completeness: 0, format: 'CDP ORS' },
  { id: 'RPT-EV', name: 'EcoVadis Assessment — Environment pillar', recipient: 'EcoVadis', freq: 'Annual', due: '2027-02-28', period: 'FY2026', status: 'Not started', completeness: 0, format: 'EcoVadis evidence pack' },
  { id: 'RPT-CSRD', name: 'ESRS E1 disaggregation (customer-driven)', recipient: 'Customers (EU)', freq: 'Annual', due: '2027-03-31', period: 'FY2026', status: 'Not started', completeness: 0, format: 'ESRS E1 datapoints' },
  { id: 'RPT-RFI-01', name: 'Customer RFI — MAS Holdings lane footprint', recipient: 'Customer', freq: 'Ad hoc', due: '2026-10-03', period: 'Jan–Sep 2026', status: 'In preparation', completeness: 84, format: 'GLEC shipment-level CSV' },
  { id: 'RPT-RFI-02', name: 'Customer RFI — Decathlon Scope 3 Cat 4 share', recipient: 'Customer', freq: 'Ad hoc', due: '2026-09-30', period: 'FY2025', status: 'Awaiting sign-off', completeness: 96, format: 'PDF attestation' },
  { id: 'RPT-RFI-03', name: 'Tender — EU retailer carbon disclosure annex', recipient: 'Prospect', freq: 'Ad hoc', due: '2026-10-15', period: 'FY2025', status: 'Not started', completeness: 0, format: 'ISO 14083 statement' }
];

/* ---------- Methodology register ---------- */
const METHODOLOGY = [
  { area: 'Consolidation approach', basis: 'Operational control', source: 'GHG Protocol Corporate Standard', vintage: '2015 revision', owner: 'Group Sustainability' },
  { area: 'Base year', basis: 'FY2023, recalculation threshold 5%', source: 'Internal policy EFL-SUS-004', vintage: '2026-01', owner: 'Group Sustainability' },
  { area: 'GWP set', basis: 'IPCC AR6, 100-year', source: 'IPCC AR6 WG1', vintage: '2021', owner: 'Group Sustainability' },
  { area: 'Scope 2 method', basis: 'Dual reporting — location & market based', source: 'GHG Protocol Scope 2 Guidance', vintage: '2015', owner: 'Group Sustainability' },
  { area: 'Grid emission factors', basis: 'National residual/grid average by country', source: 'IEA Emission Factors', vintage: '2026 edition', owner: 'Business Systems' },
  { area: 'Freight — road/rail/sea/air/IWW', basis: 'Well-to-Wheel, tonne-km × modal factor with load & empty-running adjustment', source: 'GLEC Framework v3.2 / EN ISO 14083:2023', vintage: '2025-10', owner: 'Business Systems' },
  { area: 'Freight — hubs & transhipment', basis: 'Hub energy allocated by throughput tonnage', source: 'ISO 14083 §hub operations', vintage: '2023', owner: 'Business Systems' },
  { area: 'Allocation — shared vehicle', basis: 'Mass-based; volume-based for density < 200 kg/m³', source: 'GLEC v3.2 allocation rules', vintage: '2025-10', owner: 'Business Systems' },
  { area: 'Distance determination', basis: 'Actual routed distance; SFD + detour factor fallback', source: 'GLEC v3.2 Annex', vintage: '2025-10', owner: 'Business Systems' },
  { area: 'Refrigerants', basis: 'Screening method — top-up mass × GWP', source: 'IPCC AR6 / EPA', vintage: '2021', owner: 'Group Engineering' },
  { area: 'Spend-based Scope 3', basis: 'Supplier spend × EEIO factor by commodity class', source: 'EXIOBASE v3.9', vintage: '2025', owner: 'Group Sustainability' },
  { area: 'Data quality scoring', basis: 'Four-tier hierarchy: primary / modelled / default / estimated', source: 'GLEC v3.2 data quality', vintage: '2025-10', owner: 'Business Systems' }
];

/* ---------- Audit trail ---------- */
const AUDIT = [
  { ts: '2026-09-23 16:42', user: 'Pranith Fernando', action: 'Approved', object: 'Aug-26 Group consolidation — Scope 1 & 2', note: 'All 28 facilities closed; 2 estimates flagged.' },
  { ts: '2026-09-23 14:08', user: 'Yathushi Chandramohan', action: 'Recalculated', object: 'Scope 3 Cat 4 — Aug-26', note: 'Reapplied GLEC v3.2 ocean factors after vintage update.' },
  { ts: '2026-09-22 11:55', user: 'System', action: 'Rule triggered', object: 'VR-10 duplicate shipment references', note: '37 records quarantined pending review.' },
  { ts: '2026-09-22 09:31', user: 'Tharindu Jayasuriya', action: 'Restated', object: 'FY2025 Scope 2 — Netherlands', note: 'REC contract volume corrected; -1,140 tCO2e market-based.' },
  { ts: '2026-09-19 17:20', user: 'Abbas Sethwala', action: 'Signed off', object: 'Decathlon Cat 4 attestation FY2025', note: 'Released to customer with methodology annex.' },
  { ts: '2026-09-18 13:04', user: 'System', action: 'Ingested', object: 'CargoWise shipment extract W38', note: '18,442 legs; 81% auto-matched to lane master.' },
  { ts: '2026-09-17 10:12', user: 'Yathushi Chandramohan', action: 'Updated factor', object: 'IEA grid factors 2026 edition', note: '11 countries updated; FY2026 recalculated forward only.' },
  { ts: '2026-09-15 15:47', user: 'Pranith Fernando', action: 'Locked period', object: 'Jul-26', note: 'Period locked for Sagawa monthly return.' },
  { ts: '2026-09-12 08:55', user: 'System', action: 'Rule triggered', object: 'VR-02 missing utility invoice — Chattogram', note: 'Estimate applied, tier downgraded to modelled.' },
  { ts: '2026-09-10 12:30', user: 'External — SGS', action: 'Evidence requested', object: 'FY2025 limited assurance', note: 'Sampled 40 shipment calculations + 12 utility bills.' }
];

/* ---------- Data source connectors ---------- */
const CONNECTORS = [
  { name: 'CargoWise One', type: 'Freight TMS', scope: 'Scope 3 Cat 4 & 9', status: 'Connected', freq: 'Daily', lastSync: '2026-09-24 04:15', records: '18,442 legs (W38)', coverage: 94 },
  { name: 'SAP S/4HANA — AP ledger', type: 'ERP', scope: 'Scope 3 Cat 1, 2', status: 'Connected', freq: 'Monthly', lastSync: '2026-09-05 02:00', records: '61,208 lines', coverage: 88 },
  { name: 'Utility bill OCR service', type: 'Document AI', scope: 'Scope 2', status: 'Connected', freq: 'Monthly', lastSync: '2026-09-21 19:40', records: '26 of 28 sites', coverage: 93 },
  { name: 'Fleet telematics (Webfleet)', type: 'Telematics', scope: 'Scope 1', status: 'Connected', freq: 'Daily', lastSync: '2026-09-24 03:50', records: '612 vehicles', coverage: 100 },
  { name: 'Fuel card — IOC / Shell', type: 'Card feed', scope: 'Scope 1', status: 'Connected', freq: 'Weekly', lastSync: '2026-09-22 06:10', records: '4,381 txns', coverage: 97 },
  { name: 'TMC travel feed', type: 'Travel', scope: 'Scope 3 Cat 6', status: 'Connected', freq: 'Monthly', lastSync: '2026-09-08 07:25', records: '1,104 trips', coverage: 91 },
  { name: 'Waste contractor portal', type: 'Manual upload', scope: 'Scope 3 Cat 5', status: 'Degraded', freq: 'Quarterly', lastSync: '2026-07-14 11:00', records: '3 of 11 countries', coverage: 34 },
  { name: 'Refrigerant service log', type: 'Manual upload', scope: 'Scope 1', status: 'Degraded', freq: 'Ad hoc', lastSync: '2026-08-30 16:22', records: '48 interventions', coverage: 58 },
  { name: 'REC / I-REC registry', type: 'Registry API', scope: 'Scope 2 (market)', status: 'Connected', freq: 'Monthly', lastSync: '2026-09-12 10:05', records: '14 certificates', coverage: 100 },
  { name: 'Commuting survey', type: 'Survey', scope: 'Scope 3 Cat 7', status: 'Scheduled', freq: 'Annual', lastSync: '2026-02-28 00:00', records: '3,880 responses', coverage: 71 }
];

/* ---------- Aggregation helpers ---------- */
const DATA = {
  countries: COUNTRIES, facilities: FACILITIES, categories: CATEGORIES,
  series: SERIES, shipments: SHIPMENTS, validationRules: VALIDATION_RULES,
  anomalies: ANOMALIES, targets: TARGETS, reportPacks: REPORT_PACKS,
  methodology: METHODOLOGY, audit: AUDIT, connectors: CONNECTORS,
  modes: MODES, months: MONTHS, years: YEARS
};

function q(filters = {}) {
  return SERIES.filter(r => {
    if (filters.year && r.year !== filters.year) return false;
    if (filters.scope && r.scope !== filters.scope) return false;
    if (filters.country && filters.country !== 'ALL' && r.country !== filters.country) return false;
    if (filters.region && filters.region !== 'ALL' && r.region !== filters.region) return false;
    if (filters.facilityType && filters.facilityType !== 'ALL' && r.facilityType !== filters.facilityType) return false;
    if (filters.categoryId && r.categoryId !== filters.categoryId) return false;
    return true;
  });
}
const sum = (rows) => rows.reduce((a, r) => a + r.tCO2e, 0);

function groupSum(rows, key) {
  const m = new Map();
  rows.forEach(r => m.set(r[key], (m.get(r[key]) || 0) + r.tCO2e));
  return [...m.entries()].map(([k, v]) => ({ key: k, value: v })).sort((a, b) => b.value - a.value);
}

function fmt(n, d = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtK(n) {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toFixed(0);
}
