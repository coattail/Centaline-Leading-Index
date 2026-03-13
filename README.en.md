# House Price Dashboard (Centaline-Leading-Index)

[![NBS Auto Update](https://github.com/coattail/Centaline-Leading-Index/actions/workflows/auto-update-nbs-data.yml/badge.svg)](https://github.com/coattail/Centaline-Leading-Index/actions/workflows/auto-update-nbs-data.yml)
![Static Site](https://img.shields.io/badge/Architecture-Static%20Site-0ea5e9)
![ECharts 5](https://img.shields.io/badge/Chart-ECharts%205-22c55e)

[中文说明](./README.md)

> A research-focused dashboard for visualizing second-hand housing price trends across Chinese cities.  
> It is a fully static frontend project (no bundler, no backend) with dual data sources, rebasing, cross-source comparison, drawdown analytics, and high-resolution export.

## Table of Contents

- [Highlights](#highlights)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Usage Flow](#usage-flow)
- [Data Workflow & Scripts](#data-workflow--scripts)
- [Automated Monthly Update (GitHub Actions)](#automated-monthly-update-github-actions)
- [Project Structure](#project-structure)
- [FAQ](#faq)
- [Compliance Notice](#compliance-notice)

## Highlights

### 1) Data Sources and Coverage

- **Centaline Leading Index (6 cities)**: main data is generated from local Excel extraction, with optional Hong Kong CCL monthly merge.
- **NBS 70-city index**: fetched from the official NBS endpoint and chained from “previous month = 100”.
- **Static runtime model**: both sources are shipped as local `JS/JSON` files, so the page has no runtime API dependency.

### 2) Interaction and Analytics

- Compare up to **6 cities** at once.
- For NBS source, supports **city/province keyword** search in the city picker.
- Time dropdowns and dual-handle slider are synchronized.
- Range rebasing (selected start month = 100).
- Drawdown analytics (peak, current drawdown, recovery point) when eligibility rules are met.
- Cross-source comparison is enabled only for **single-city selection** among: Beijing, Shanghai, Guangzhou, Shenzhen, Tianjin.
- Toggleable in-chart summary table for key stats (peak, latest, drawdown, etc.).

### 3) Presentation and Export

- Light / dark theme switch with preference persisted to `localStorage`.
- Responsive layout for desktop and mobile.
- Standard and ultra-HD PNG export; non-core controls are hidden during export for cleaner visuals.

## Architecture

- **Frontend**: `index.html` + `style.css` + `app.js` (Vanilla JS)
- **Charting**: local `vendor/echarts.min.js`
- **Export**: tries `html2canvas` capture first, then falls back to ECharts export pipeline
- **Data**: `house-price-data.js`, `house-price-data-nbs-70.js`, plus JSON snapshots
- **Automation**: `.github/workflows/auto-update-nbs-data.yml` refreshes NBS data monthly

## Quick Start

### Requirements

- Node.js 18+
- Python 3
- `curl` and `unzip` (used by data scripts)
- Modern browser (latest Chrome / Edge / Safari recommended)

### Run Locally

```bash
git clone https://github.com/coattail/Centaline-Leading-Index.git
cd Centaline-Leading-Index
python3 -m http.server 9013
```

Open: <http://127.0.0.1:9013>

> Avoid opening `index.html` via `file://` because browser policies may block resource loading.

### Local Access Troubleshooting (Proxy / VPN)

If the server is up but the page is unreachable, temporarily clear proxy env vars:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY python3 -m http.server 9013 --bind 0.0.0.0
```

Connectivity check:

```bash
curl --noproxy '*' -I http://127.0.0.1:9013
```

## Usage Flow

1. Select data source (Centaline / NBS).
2. Select cities (up to 6).
3. Pick start/end months and click **Generate**.
4. Optionally enable **Drawdown** and **Summary Table**.
5. Fine-tune range with the timeline slider.
6. Export standard or ultra-HD images.

## Data Workflow & Scripts

> No build step is required. After data refresh, just reload the page.

| Task | Command | Main Output |
| --- | --- | --- |
| Fetch HK CCL monthly data (optional) | `node scripts/fetch-hk-centaline-monthly.mjs` | `hk-centaline-monthly.json` |
| Extract Centaline base data from Excel | `node scripts/extract-house-price-data.mjs <excel-file.xlsx>` | `house-price-data.js` / `house-price-data.json` |
| Fetch & build NBS chained dataset | `node scripts/fetch-nbs-70city-secondhand.mjs` | `house-price-data-nbs-70.js` / `house-price-data-nbs-70.json` |
| Audit NBS chained consistency (read-only) | `node scripts/audit-nbs-70city-secondhand.mjs house-price-data-nbs-70.json /tmp/nbs-audit-report.json` | `/tmp/nbs-audit-report.json` |
| Rebuild STKaiti subset font (performance) | `python3 scripts/build-stkaiti-subset.py` | `fonts/STKaiti-subset.woff2` / `fonts/STKaiti-subset-chars.txt` |

### Optional Environment Variables for NBS Builder

- `NBS_OUTPUT_MIN_MONTH`: output start month (e.g. `2006-01`)
- `NBS_OUTPUT_BASE_MONTH`: rebasing anchor month (e.g. `2006-01`)
- `NBS_OUTPUT_MAX_MONTH`: output end month (defaults to current UTC month)

Example:

```bash
NBS_OUTPUT_MIN_MONTH=2008-01 \
NBS_OUTPUT_BASE_MONTH=2008-01 \
NBS_OUTPUT_MAX_MONTH=2026-01 \
node scripts/fetch-nbs-70city-secondhand.mjs
```

## Automated Monthly Update (GitHub Actions)

Workflow: `.github/workflows/auto-update-nbs-data.yml`

- Schedule: **02:30 UTC on day 6 of each month**
- Manual trigger: `workflow_dispatch`
- Scope: NBS dataset only
  1. Run `node scripts/fetch-nbs-70city-secondhand.mjs`
  2. Check diffs in `house-price-data-nbs-70.js/.json`
  3. Commit and push only when files changed

> Paid Centaline source should still be refreshed manually.

## Project Structure

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
├── fonts/
├── scripts/
├── vendor/
├── .github/workflows/auto-update-nbs-data.yml
├── README.md
└── README.en.md
```

## FAQ

### The page is stuck at "Loading..."

- Serve via `http://` instead of `file://`.
- Ensure `house-price-data*.js` exists and is valid.

### Why is cross-source comparison disabled?

- It works only when exactly one city is selected.
- Supported cities are Beijing, Shanghai, Guangzhou, Shenzhen, and Tianjin.

### Why is drawdown toggle unavailable?

- It is enabled only when the latest value is sufficiently below its historical peak.

### If updates are automated, why is this still a static site?

- Automation only refreshes repository data files offline.
- Runtime still loads static assets only (no backend API).

## Compliance Notice

- Data providers may impose licensing and usage constraints; use responsibly.
- This project is for research and communication, not investment advice.
