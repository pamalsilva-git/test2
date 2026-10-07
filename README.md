# EFL Carbon Emission Management Platform — Prototype

A working front-end prototype of a group-level ESG and emissions data management platform for EFL,
built against the requirements agreed for Sagawa / SSJB reporting. Styled in the EFL brand palette —
deep orange `#E2620D` primary, deep navy `#132C42` secondary.

**All data in this build is synthetic.** No EFL, Sagawa, SSJB or customer data is used.

---

## Running it

No build step, no dependencies, no network calls at runtime.

**Simplest:** double-click `index.html`. It runs straight from `file://`.

If you prefer a local server (note: npm package names are lowercase):

```bash
npm start                  # uses the script in package.json
npx --yes serve .          # all lowercase
npx --yes http-server .    # alternative
```

### GitHub Pages
Push the repository and enable Pages on the root of the default branch — the app runs as-is
because it is pure static HTML, CSS and vanilla JavaScript.

---

## Modules

| Module | Requirement addressed |
|---|---|
| **Executive Dashboard** | Metric band, command view with activity tiles around the emission sphere, **global site heatmap**, **site × month heatmap**, ring-gauge performance banks, shipment ledger, exception and disclosure queues |
| **Emissions Explorer** | Centralised data across countries, facilities and activity categories; **country × category heatmap**; location vs market-based Scope 2; full ledgers |
| **Freight & Logistics** | Shipment-level Scope 3 Cat 4 & 9 under EN ISO 14083:2023 with full evidence chain; **lane × month heatmap** |
| **Data Sources** | Connector register, ingestion coverage, manual-upload dependency, four-stage pipeline |
| **Data Quality** | 12 automated validation rules, anomaly queue with severity, owner and disposition |
| **ISO 14083 Calculator** | Interactive shipment emissions engine with the required-data-point reference |
| **Reporting Hub** | Sagawa and SSJB returns, CDP, EcoVadis, ESRS E1 and customer RFIs from one verified dataset |
| **Targets & Pathway** | Base year, SBTi-style pathways, target register, modelled abatement levers |
| **Methodology & Audit** | Calculation basis register, factor vintages, immutable audit trail, retained evidence |

---

## Heatmaps

Four heat visualisations share a single continuous ramp (pale sand → EFL orange → deep ember):

1. **Global site heatmap** — all 28 operating sites plotted geographically, with colour and radial
   bloom intensity proportional to YTD emissions. Filterable to Scope 1, 2 or 3 only. Paired with a
   heat-ranked table showing absolute tCO₂e and kgCO₂e/m² intensity.
2. **Site × month matrix** — top 12 emitting locations by month, for spotting seasonal ramps and
   unexplained spikes before a period is locked.
3. **Country × category matrix** (Explorer) — where each activity concentrates geographically.
4. **Lane × month matrix** (Freight) — top trade lanes by month, well-to-wheel.

---

## Methodology basis represented

- GHG Protocol Corporate Standard — operational control consolidation
- GHG Protocol Scope 2 Guidance — dual location/market-based reporting
- **EN ISO 14083:2023** — transport chain GHG quantification
- **GLEC Framework v3.2** — modal factors, load factor and empty-running adjustment, four-tier data quality hierarchy
- Well-to-Wheel boundary with WTT / TTW disaggregation
- IPCC AR6 GWP100

---

## Structure

```
index.html
assets/
  css/styles.css      EFL brand design system
  js/data.js          synthetic data model + aggregation helpers
  js/charts.js        dependency-free SVG chart + heatmap library
  js/app.js           views, router, CSV exports
```

## Extending it

`assets/js/data.js` is the only file that needs to change to swap synthetic data for a real feed —
every view reads through the `DATA` object and the `q()` / `sum()` / `groupSum()` helpers.
Replacing those with API calls against a real warehouse leaves the entire presentation layer intact.
