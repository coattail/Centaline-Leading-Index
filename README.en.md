# House Price Dashboard (Centaline-Leading-Index)

[中文说明](./README.md)

A research-oriented dashboard for visualizing second-hand housing price trends in Chinese cities.
It uses a **fully static frontend architecture** (no bundler/build pipeline) and supports dual data sources, rebasing, cross-source comparison, in-chart summary tables, high-resolution export, and mobile-friendly layouts.

---

## 1. Project Scope

This project helps answer two practical questions:

- How do city-level housing trends diverge within the same time window?
- How do different data sources compare for the same city?

Typical use cases:

- Real-estate cycle research
- Macro content creation
- Relative city strength monitoring

---

## 2. Key Features

### 2.1 Dual Data Sources

- Centaline Leading Index (6 cities)
- NBS 70-city second-hand housing index

### 2.2 Chart Interaction

- Compare up to 6 cities simultaneously
- External dual-handle time slider below the chart
- Two-way sync between date dropdowns and slider
- Light / dark theme switch

### 2.3 Analytics

- Rebase by selected range (start month = 100)
- Drawdown analysis (peak, drawdown, recovery)
- Cross-source comparison (available under rule-based conditions)
- In-chart summary table toggle

### 2.4 Export

- Standard PNG
- Ultra-HD PNG
- Export automatically hides non-core UI controls for cleaner output

### 2.5 Recent Maintenance Updates (2026-02-27)

- Interaction and visual behavior are unchanged; updates focus on maintainability and safety.
- Responsive thresholds and layout values are centralized in constants (for example `RESPONSIVE_BREAKPOINTS`, `RESPONSIVE_GRID_LAYOUTS`, `RESPONSIVE_CHART_LAYOUTS`).
- Select options and summary cells now use DOM APIs (`createElement` / `textContent`) instead of dynamic HTML strings.
- Dynamic text in the in-chart stats overlay is consistently sanitized via `escapeHtml`.

---

## 3. Technical Architecture (Portable)

### 3.1 Frontend

- Vanilla HTML / CSS / JavaScript
- ECharts (via CDN) for chart rendering
- html2canvas (via CDN) for screenshot-style export

### 3.2 Data Organization

The frontend reads static data files from the repository directly:

- `house-price-data.js` (Centaline source)
- `house-price-data-nbs-70.js` (NBS source)
- JSON variants for verification/reuse

### 3.3 Update Strategy

- Centaline data: manual updates (optionally via Excel extraction script)
- NBS data: automatic monthly refresh via GitHub Actions

> Even with scheduled updates, runtime remains static: pages load static JS/JSON files from the repo.

---

## 4. Project Structure

```text
Centaline-Leading-Index/
├── index.html
├── style.css
├── app.js
├── house-price-data.js
├── house-price-data.json
├── house-price-data-nbs-70.js
├── house-price-data-nbs-70.json
├── hk-centaline-monthly.json
├── scripts/
│   ├── extract-house-price-data.mjs
│   ├── fetch-hk-centaline-monthly.mjs
│   └── fetch-nbs-70city-secondhand.mjs
├── README.md
└── README.en.md
```

---

## 5. Quick Start

### 5.1 Requirements

- Node.js 18+
- Python 3 (for serving static files locally)
- Modern browsers (latest Chrome / Edge / Safari recommended)

### 5.2 Run Locally

```bash
git clone https://github.com/Sunny-1991/Centaline-Leading-Index.git
cd Centaline-Leading-Index
python3 -m http.server 9013
```

Open in browser:

- <http://127.0.0.1:9013>

> Avoid opening `index.html` directly via `file://`, as browser security policies may block resources.

### 5.3 Local Access Troubleshooting (Proxy / VPN)

If the server is running but the page still cannot be opened, local traffic may be intercepted by proxy settings. You can temporarily start the server without proxy env vars:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY python3 -m http.server 9013 --bind 0.0.0.0
```

Access URLs:

- Same device: <http://127.0.0.1:9013>
- Other devices in LAN: <http://your-lan-ip:9013>

---

## 6. Typical Usage Flow

1. Select data source (Centaline / NBS)
2. Select cities (up to 6)
3. Select start/end months
4. Click "Generate"
5. Optionally enable drawdown and in-chart table
6. Fine-tune range using the external time slider
7. Export standard or ultra-HD chart images

---

## 7. Data Update Guide

### 7.1 Fetch Hong Kong Monthly Data (optional)

```bash
node scripts/fetch-hk-centaline-monthly.mjs
```

Output: `hk-centaline-monthly.json`

### 7.2 Extract Centaline Data from Excel

```bash
node scripts/extract-house-price-data.mjs <excel-file.xlsx>
```

Outputs:

- `house-price-data.js`
- `house-price-data.json`

### 7.3 Fetch and Build NBS 70-city Data

```bash
node scripts/fetch-nbs-70city-secondhand.mjs
```

Outputs:

- `house-price-data-nbs-70.js`
- `house-price-data-nbs-70.json`

### 7.4 NBS 70-city Consistency Audit (Audit-only, No Data Mutation)

```bash
node scripts/audit-nbs-70city-secondhand.mjs house-price-data-nbs-70.json /tmp/nbs-audit-report.json
```

What it does:

- Refetches yearly NBS `A010807` records and verifies local chained values against source data
- Reports long flat segments, sharp monthly moves, source-side zero placeholders, and missing-value carry-forwards
- Exits with non-zero code when `mismatchCount > 0`, which is useful for CI monitoring

---

## 8. Automatic Monthly NBS Updates (GitHub Actions)

Workflow file:

- `.github/workflows/auto-update-nbs-data.yml`

Triggers:

- Monthly scheduled run (UTC)
- Manual `workflow_dispatch`

Workflow behavior:

1. Runs `node scripts/fetch-nbs-70city-secondhand.mjs`
2. Checks whether target data files changed
3. Commits and pushes only when changes are detected

This automation covers NBS updates only. Paid Centaline data should still be updated manually.

---

## 9. Deployment Notes

### 9.1 GitHub Pages

Because this is a static site, deployment is straightforward after pushing repository files.

At minimum, ensure these files are published at the site root:

- `index.html`
- `style.css`
- `app.js`
- `house-price-data.js`
- `house-price-data-nbs-70.js`

### 9.2 Cache Refresh

If changes do not appear immediately:

- Hard refresh (`Cmd/Ctrl + Shift + R`)
- Or bump asset query versions in `index.html` (`?v=...`)

---

## 10. FAQ

### Q1. The page stays on "Loading..."

- Make sure you are serving via `http://`, not `file://`
- Verify `house-price-data*.js` files exist and are valid

### Q2. Exported image does not match on-screen chart

- Click "Generate" before exporting
- Export reflects the current chart state (cities, range, toggles)

### Q3. Is this still a static site if NBS updates are automated?

- Yes. Automation only refreshes repository data files offline
- Runtime still serves static frontend and static JS/JSON assets

### Q4. Server is running but browser still cannot open the page

- Ensure `localhost`, `127.0.0.1`, and your LAN subnet are routed as direct/no-proxy.
- Verify connectivity from terminal: `curl --noproxy '*' -I http://127.0.0.1:9013`.
- If terminal works but browser fails, the browser/proxy rule is usually the root cause.

---

## 11. Compliance Notice

- Data sources may be subject to licensing or usage restrictions.
- Use this project within legal and policy-compliant boundaries.
- The project is intended for research and communication, not investment advice.
