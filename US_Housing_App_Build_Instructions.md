# US Housing Affordability & Statistics Web App — Build Instructions

> **Purpose:** Hand this document to Claude Code, Cursor, or any AI coding assistant to build the full application.

---

## 1. Project Overview

Build a production-ready React + Node.js web application deployed on Vercel that serves as an interactive **US Housing Affordability Dashboard**. The app has two core views:

1. **Dashboard (Home Page):** National housing statistics with rich data visualizations — charts, KPIs, trends, and comparisons.
2. **GIS Affordability Map:** An interactive choropleth map of the entire United States (county-level) showing affordability metrics, filterable by income bracket and other variables. This is modeled after the Utah block-group prototype in the attached notebook (`GISappIDEA.ipynb`), but scaled to all ~3,100 US counties.

The app should feel like a Bloomberg terminal for housing — clean, data-dense, highly interactive, and analytically rigorous.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 18+ (Next.js App Router) | SSR for SEO, file-based routing |
| **Styling** | Tailwind CSS + shadcn/ui | Dark mode support, consistent design system |
| **Charts** | Recharts or Plotly.js | Interactive, responsive, tooltips |
| **Map** | Mapbox GL JS (free tier) or Deck.gl + react-map-gl | Performant county-level choropleth. Alternative: Leaflet with Canvas renderer |
| **Backend/API** | Next.js API Routes (serverless) | Data fetching, caching, transformations |
| **Data Processing** | Python scripts (offline ETL) | Pre-process Census/Zillow data → JSON for the app |
| **Database (optional)** | Vercel KV or Supabase (Postgres) | Only if data exceeds static JSON feasibility |
| **Deployment** | Vercel | Free tier works for this project |
| **State Management** | React Context + URL search params | Filters should be URL-shareable |

---

## 3. Data Sources (All Free & Public)

### 3.1 Primary: US Census Bureau — American Community Survey (ACS) 5-Year Estimates

This is the gold standard. Use the **2020–2024 ACS 5-Year** (or latest available release). Data is available at county, tract, and block group levels via API.

**API Base URL:**
```
https://api.census.gov/data/2024/acs/acs5
```

**Get a free API key:** https://api.census.gov/data/key_signup.html

**Key Variables to Pull (by ACS table code):**

| Metric | ACS Variable(s) | Table |
|--------|-----------------|-------|
| Median Household Income | `B19013_001E` | B19013 |
| Median Home Value | `B25077_001E` | B25077 |
| Median Gross Rent | `B25064_001E` | B25064 |
| Total Housing Units | `B25001_001E` | B25001 |
| Owner-Occupied Units | `B25003_002E` | B25003 |
| Renter-Occupied Units | `B25003_003E` | B25003 |
| Vacant Units | `B25002_003E` | B25002 |
| Median Year Built | `B25035_001E` | B25035 |
| Housing Cost as % of Income (owner) | `B25091_001E` through `B25091_011E` | B25091 |
| Housing Cost as % of Income (renter) | `B25070_001E` through `B25070_010E` | B25070 |
| Total Population | `B01003_001E` | B01003 |
| Median Age | `B01002_001E` | B01002 |
| Population Growth (compare vintages) | Compare across ACS years | — |
| Poverty Rate | `B17001_002E` / `B17001_001E` | B17001 |
| Unemployment Rate | `B23025_005E` / `B23025_002E` | B23025 |

**Example API Call (all counties):**
```
https://api.census.gov/data/2024/acs/acs5?get=NAME,B19013_001E,B25077_001E,B25064_001E,B25001_001E,B25003_002E,B25003_003E&for=county:*&key=YOUR_KEY
```

**For state-level summary:**
```
https://api.census.gov/data/2024/acs/acs5?get=NAME,B19013_001E,B25077_001E&for=state:*&key=YOUR_KEY
```

### 3.2 Supplementary: Zillow Research Data (CSV Downloads)

**URL:** https://www.zillow.com/research/data/

Download these CSV files (county or metro level):

| Dataset | Description | Granularity |
|---------|-------------|-------------|
| **ZHVI All Homes** (SFR + Condo) | Typical home value, time series | County, Metro, ZIP, State |
| **ZORI** (Zillow Observed Rent Index) | Typical rent, time series | Metro, ZIP |
| **Inventory** (For-Sale Listings) | Active listings count | County, Metro |
| **Days to Pending** | Market speed indicator | County, Metro |
| **Price Cuts** | % of listings with price reductions | County, Metro |
| **New Listings** | Monthly new listings | County, Metro |

These provide **time-series trends** the ACS doesn't (ACS is a 5-year rolling average). Use Zillow for the trend line charts on the dashboard. Attribution required: "Data from Zillow Research."

### 3.3 Geographic Boundaries

**County-level GeoJSON (for choropleth map):**

- **TopoJSON (recommended, ~700KB):** `https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json`
  - Convert to GeoJSON at runtime using the `topojson-client` npm package
  - FIPS codes in the `id` field match Census GEOID (state FIPS + county FIPS)
- **Alternative GeoJSON:** https://eric.clst.org/tech/usgeojson/ (Census-derived, various resolutions)

**State-level GeoJSON:**
- `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`

### 3.4 Optional Enrichment Sources

| Source | What It Adds | URL |
|--------|-------------|-----|
| **FRED (Federal Reserve)** | Mortgage rates (MORTGAGE30US), CPI, HPI | https://fred.stlouisfed.org/docs/api/ |
| **HUD CHAS Data** | Housing problems by income level | https://data.hud.gov/ |
| **BLS** | Local area unemployment, CPI | https://www.bls.gov/developers/ |
| **FHFA HPI** | House Price Index by state/MSA | https://www.fhfa.gov/data |

---

## 4. Data Pipeline (ETL — Run Offline Before Build)

Create a `/scripts` directory with Python ETL scripts that produce static JSON files consumed by the app. This keeps the frontend fast and avoids rate-limiting issues with Census API calls at runtime.

### 4.1 Script: `fetch_census_data.py`

```
Purpose: Pull ACS 5-year data for all ~3,100 counties
Output:  /public/data/counties_acs.json

Steps:
1. Call Census API for all counties (for=county:*) with all variables listed above
2. Parse CSV-like API response into structured JSON
3. Compute derived metrics:
   - affordability_ratio = median_home_value / median_household_income
   - price_to_rent_ratio = median_home_value / (median_gross_rent * 12)
   - pct_cost_burdened_renters = renters paying 30%+ of income / total renters
   - pct_cost_burdened_owners = owners paying 30%+ of income / total owners
   - vacancy_rate = vacant_units / total_units
   - homeownership_rate = owner_occupied / (owner_occupied + renter_occupied)
4. Add FIPS codes as the key (5-digit string, zero-padded)
5. Output as JSON keyed by FIPS: { "01001": { name, state, metrics... }, ... }
```

### 4.2 Script: `fetch_zillow_trends.py`

```
Purpose: Download and reshape Zillow ZHVI/ZORI CSVs
Output:  /public/data/zhvi_trends.json, /public/data/national_trends.json

Steps:
1. Download ZHVI CSV for counties from Zillow Research
2. Pivot wide-format monthly columns into time-series arrays
3. Compute YoY appreciation, 5-year CAGR per county
4. Aggregate national/state-level trend lines
5. Output time-series JSON for chart consumption
```

### 4.3 Script: `build_geo_data.py`

```
Purpose: Merge census data into GeoJSON properties for map rendering
Output:  /public/data/counties_geo.json (or keep separate and join client-side)

Steps:
1. Load TopoJSON, convert to GeoJSON
2. Join ACS metrics by FIPS code into each Feature's properties
3. Simplify geometry if file exceeds 5MB (use topojson simplification)
4. Output optimized GeoJSON
```

**Important Data Science Notes:**
- Always handle missing/null Census values (coded as `-666666666` or null)
- Use margin of error (MOE) fields when available to flag unreliable estimates
- For small counties with high MOE, consider flagging or dimming on the map
- FIPS codes must be treated as strings (leading zeros matter: "01001" not 1001)

---

## 5. Application Architecture

```
/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (nav, footer, theme)
│   ├── page.tsx                # Dashboard (home page)
│   ├── map/
│   │   └── page.tsx            # GIS Affordability Map
│   ├── county/
│   │   └── [fips]/
│   │       └── page.tsx        # Individual county detail page
│   └── api/
│       ├── counties/route.ts   # Serve county data (or use static JSON)
│       └── trends/route.ts     # Serve trend data
├── components/
│   ├── dashboard/
│   │   ├── KPICards.tsx         # National summary cards
│   │   ├── AffordabilityChart.tsx
│   │   ├── TrendLineChart.tsx
│   │   ├── TopBottomTable.tsx   # Most/least affordable counties
│   │   ├── StateCompareBar.tsx  # State-level bar chart
│   │   └── CostBurdenDonut.tsx  # % cost-burdened renters/owners
│   ├── map/
│   │   ├── ChoroplethMap.tsx    # Main GIS map component
│   │   ├── MapControls.tsx      # Layer toggles, filters
│   │   ├── MapLegend.tsx        # Color scale legend
│   │   ├── CountyTooltip.tsx    # Hover tooltip with stats
│   │   └── IncomeFilter.tsx     # Income bracket slider
│   ├── shared/
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── FilterPanel.tsx
│   │   └── DataSourceBadge.tsx  # Attribution
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── data.ts                 # Data loading + caching utilities
│   ├── calculations.ts         # All derived metrics (affordability ratio, etc.)
│   ├── constants.ts            # Color scales, income brackets, thresholds
│   └── utils.ts                # Formatting (currency, %, etc.)
├── public/
│   └── data/                   # Pre-built static JSON from ETL scripts
│       ├── counties_acs.json
│       ├── zhvi_trends.json
│       └── national_trends.json
├── scripts/                    # Python ETL scripts
│   ├── fetch_census_data.py
│   ├── fetch_zillow_trends.py
│   └── build_geo_data.py
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 6. Page Specifications

### 6.1 Dashboard (Home Page: `/`)

The dashboard should provide a national overview at a glance. Layout: responsive grid, 2-3 columns on desktop, single column on mobile.

**Row 1 — KPI Summary Cards (4 cards across):**

| Card | Value | Subtext |
|------|-------|---------|
| Median Home Value (US) | e.g., $320,000 | ▲ 5.2% YoY |
| Median Household Income (US) | e.g., $75,000 | ▲ 3.1% YoY |
| National Affordability Ratio | e.g., 4.3x | (Home Value ÷ Income) |
| Cost-Burdened Households | e.g., 31.2% | (Paying >30% of income on housing) |

**Row 2 — Trend Charts (2 side-by-side):**

- **Left:** Line chart: National median home value over time (Zillow ZHVI, monthly, last 10 years) with shaded recession bands
- **Right:** Line chart: Affordability ratio over time (compute from ZHVI ÷ BLS/Census income proxy)

**Row 3 — State-Level Comparison:**

- Horizontal bar chart: All 50 states ranked by affordability ratio (or median home value). Color-coded green → yellow → red. Clickable to filter.

**Row 4 — Distribution & Deep-Cuts (2-3 charts):**

- **Histogram:** Distribution of county-level affordability ratios (how many counties at each affordability level)
- **Scatter plot:** Median Income vs. Median Home Value (each dot = a county, sized by population, colored by region). This reveals clusters and outliers.
- **Donut chart:** % of renters who are cost-burdened vs. not, nationally

**Row 5 — Ranked Tables (2 side-by-side):**

- **Left table:** Top 10 most affordable counties (lowest affordability ratio, min population 10,000)
- **Right table:** Top 10 least affordable counties (highest ratio, min population 10,000)
- Columns: Rank, County, State, Median Income, Median Home Value, Affordability Ratio
- Clicking a row navigates to `/county/[fips]`

### 6.2 GIS Affordability Map (`/map`)

This is the centerpiece — a full-screen interactive choropleth map of all US counties, inspired by the Utah prototype in the notebook.

**Map Features:**

1. **Choropleth Fill:** Counties colored by selected metric on a continuous gradient:
   - Green (#1a9850) → Yellow (#fee08b) → Red (#d73027)
   - Default metric: Affordability Ratio (home value ÷ income)
   - Thresholds: <3x (green/affordable), 3-5x (yellow/stretched), 5-7x (orange), 7x+ (red/severely unaffordable)

2. **Metric Selector Dropdown:** Switch the choropleth between:
   - Affordability Ratio (default)
   - Median Home Value
   - Median Household Income
   - Median Gross Rent
   - Homeownership Rate
   - Cost-Burdened Renters (%)
   - Vacancy Rate
   - YoY Home Value Appreciation (from Zillow)

3. **Income Bracket Filter (Slider):**
   - Dual-range slider: filter counties by median household income range
   - Example: Show only counties with median income $40K–$60K
   - Counties outside the range should dim (low opacity) but remain visible
   - This directly mirrors the `create_affordability_map(income_min, income_max)` function from the notebook

4. **Hover Tooltip (CountyTooltip):**
   On hovering a county, show a card with:
   - County Name, State
   - Population
   - Median Household Income (formatted as currency)
   - Median Home Value (formatted as currency)
   - Affordability Ratio (with color indicator)
   - Median Rent
   - Homeownership Rate
   - "Affordable Home Price" = income × 3 (the 3x rule)
   - "Affordability Gap" = median home value − affordable home price

5. **Click → Detail Panel or Navigate:**
   Clicking a county opens a slide-in detail panel (or navigates to `/county/[fips]`) with full stats and mini charts.

6. **Map Controls:**
   - Zoom to state (dropdown or click state boundary)
   - Reset view button
   - Toggle state boundary outlines
   - Legend with color scale + metric label

7. **Performance Considerations:**
   - Use TopoJSON (700KB) not GeoJSON (15MB+) for county boundaries
   - Use Mapbox GL JS vector tiles or Deck.gl GeoJsonLayer for GPU-accelerated rendering
   - If using Leaflet, use Canvas renderer (`preferCanvas: true`)
   - Pre-join data so no client-side data merge on every filter change

### 6.3 County Detail Page (`/county/[fips]`)

**Full single-county profile page:**

- Hero: County name, state, population
- KPI cards: Income, Home Value, Rent, Affordability Ratio, Cost Burden, Homeownership Rate
- Mini map: Highlight this county on a small US map
- Time-series chart: ZHVI trend for this county (if Zillow data available)
- Comparison bar: This county vs. state average vs. national average
- Demographic snapshot: Age, poverty rate, unemployment
- Data sources and methodology footnote

---

## 7. Data Science Logic & Derived Metrics

All calculations should be implemented in `lib/calculations.ts` and documented inline. Use the same formulas from the notebook, scaled nationally.

```typescript
// Core affordability metrics
affordability_ratio = median_home_value / median_household_income
// Interpretation: <3 = affordable, 3-5 = moderate, 5-7 = stretched, 7+ = severe

monthly_income = median_household_income / 12

affordable_home_price = median_household_income * 3
// Rule of thumb: home should cost ≤3x annual income

affordability_gap = median_home_value - affordable_home_price
// Positive = unaffordable, negative = within reach

price_to_rent_ratio = median_home_value / (median_gross_rent * 12)
// >20 favors renting, <15 favors buying

pct_cost_burdened_renters = renters_paying_30pct_plus / total_renters * 100
// HUD standard: >30% of income on housing = "cost burdened"

pct_cost_burdened_owners = owners_paying_30pct_plus / total_owners * 100

vacancy_rate = vacant_units / total_units * 100

homeownership_rate = owner_occupied / (owner_occupied + renter_occupied) * 100

// Zillow-derived (from ZHVI time series)
yoy_appreciation = (current_zhvi - zhvi_12mo_ago) / zhvi_12mo_ago * 100
five_year_cagr = ((current_zhvi / zhvi_5yr_ago) ^ (1/5) - 1) * 100
```

**Handling Edge Cases:**
- If income is 0 or null, set affordability_ratio to null (don't divide by zero)
- If population < 1,000, flag as "small sample" in the UI
- If Census MOE > 50% of estimate, show a warning icon
- Null/missing values should display as "N/A" not 0

---

## 8. Design & UX Guidelines

### Color Palette

```
Primary:      #1E3A5F (deep navy)
Secondary:    #3B82F6 (blue)
Accent:       #10B981 (green for "affordable")
Warning:      #F59E0B (amber for "stretched")
Danger:       #EF4444 (red for "unaffordable")
Background:   #0F172A (dark mode) / #F8FAFC (light mode)
Surface:      #1E293B (dark mode) / #FFFFFF (light mode)
Text:         #F1F5F9 (dark mode) / #1E293B (light mode)
```

### Typography
- Headings: Inter or DM Sans (clean, modern)
- Body: Inter
- Data/Numbers: JetBrains Mono or Tabular nums from Inter

### UX Principles
- **Data density over whitespace** — users want information, not decorative filler
- **Every number should be formatted** — currency ($123,456), percentages (31.2%), ratios (4.3x)
- **Color = meaning** — green/yellow/red should always map to good/moderate/bad
- **Filters should update the URL** — so users can share filtered views via link
- **Mobile-first responsive** — map goes full-screen on mobile, charts stack vertically
- **Loading states** — skeleton loaders while data fetches, not blank screens
- **Attribution footer** — "Data: US Census Bureau ACS, Zillow Research. Map: Census TIGER/Line."

---

## 9. Vercel Deployment

### `next.config.js` considerations:
```javascript
module.exports = {
  output: 'standalone',  // optional, for Docker
  images: { unoptimized: true },  // if no external image optimization needed
  // Static JSON files in /public/data/ are served automatically
}
```

### Environment Variables (`.env.local`):
```
CENSUS_API_KEY=your_key_here
MAPBOX_TOKEN=your_token_here  # if using Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here  # client-side map access
```

### Deployment Steps:
1. Push to GitHub
2. Connect repo to Vercel
3. Set env vars in Vercel dashboard
4. Deploy (auto-builds on push)

### Performance Budget:
- First Contentful Paint: <1.5s
- Static JSON files: <2MB each (compress with gzip, Vercel handles this)
- Map GeoJSON: Use TopoJSON to stay under 1MB
- Lighthouse score target: 90+ on Performance

---

## 10. Build Sequence (Recommended Order)

Phase 1 — Data Foundation:
1. Create Python ETL scripts and run them to generate static JSON
2. Validate data: spot-check 5-10 known counties for accuracy
3. Commit JSON files to `/public/data/`

Phase 2 — Scaffolding:
4. `npx create-next-app@latest` with TypeScript, Tailwind, App Router
5. Install: `recharts`, `mapbox-gl` (or `leaflet` + `react-leaflet`), `topojson-client`, `shadcn/ui`
6. Build layout: navigation, routing, dark mode toggle

Phase 3 — Dashboard:
7. Build KPI cards with national aggregates
8. Build trend line charts (Zillow data)
9. Build state comparison bar chart
10. Build scatter plot, histogram, ranked tables

Phase 4 — GIS Map:
11. Load TopoJSON, render base choropleth
12. Add metric selector dropdown
13. Add income bracket slider filter
14. Add hover tooltips
15. Add click → county detail panel
16. Add legend and map controls
17. Performance optimize (memoize, virtualize)

Phase 5 — County Detail:
18. Build county profile page
19. Add comparison charts (county vs. state vs. national)

Phase 6 — Polish:
20. Mobile responsive pass
21. Loading states and error boundaries
22. SEO meta tags
23. Attribution and methodology page
24. Lighthouse audit and optimization

---

## 11. Reference: Original Notebook Logic

The attached `GISappIDEA.ipynb` contains the prototype for Utah block groups. Key patterns to replicate at national county level:

**Derived Variables (from notebook cell 4-5):**
```python
df['pct_renter'] = df['OwnerRenter_RENTER_CY'] / (df['OwnerRenter_OWNER_CY'] + df['OwnerRenter_RENTER_CY'] + 0.001)
df['affordability_ratio'] = df['homevalue_MEDVAL_CY'] / (df['householdincome_MEDHINC_CY'] + 1)
df['monthly_income'] = df['householdincome_MEDHINC_CY'] / 12
df['affordable_home_price'] = df['householdincome_MEDHINC_CY'] * 3
df['affordability_gap'] = df['homevalue_MEDVAL_CY'] - df['affordable_home_price']
```

**Map Configuration (from notebook cell 6):**
```python
# Color scale: green (affordable) → yellow → red (unaffordable)
colors = ['#1a9850', '#fee08b', '#d73027']
# Ratio range: 2 (affordable) to 10 (severely unaffordable)
# Filter by income bracket: income_min to income_max
```

**The notebook used Esri-sourced data** (GEOID20, block group level, Utah only). The web app replaces this with Census ACS API data (county level, all US) and Zillow trend data.

---

## 12. Key Gotchas & Tips

1. **FIPS codes are strings, not numbers.** Alabama's FIPS is "01", not 1. Always zero-pad to 2 digits (state) or 5 digits (county). Use: `fips.padStart(5, '0')`.

2. **Census API returns data as arrays of strings.** The first row is headers. Parse accordingly and cast numbers.

3. **Zillow CSVs use wide format** (one column per month). You'll need to melt/pivot these into time-series format for charting.

4. **TopoJSON county IDs** in `us-atlas` match Census FIPS codes. Join on this field.

5. **ACS 5-year data is a rolling average**, not a point-in-time snapshot. It smooths out noise but lags current conditions. Zillow ZHVI is monthly and more current — use both to tell the full story.

6. **Cost burden data (B25070, B25091)** comes in bins (e.g., "paying 30-34.9%", "paying 35%+"). You'll need to sum the bins above 30% to get total cost-burdened count.

7. **Some counties have suppressed data** (too few respondents). Handle nulls gracefully — these should show as gray on the map.

8. **Vercel serverless functions have a 10s timeout** on the free tier. Keep API routes fast; pre-compute everything possible.

9. **Map rendering with 3,100+ polygons** can be slow with SVG. Use Canvas/WebGL renderers (Mapbox GL, Deck.gl, or Leaflet Canvas).

10. **Alaska and Hawaii** need special treatment on the map. Use an AlbersUSA projection or inset them manually.

---

## Appendix: Quick API Test Commands

Test Census API (paste in browser):
```
https://api.census.gov/data/2023/acs/acs5?get=NAME,B19013_001E,B25077_001E&for=county:*&in=state:49&key=YOUR_KEY
```
(This returns all Utah counties — similar to your notebook's data)

Test all states:
```
https://api.census.gov/data/2023/acs/acs5?get=NAME,B19013_001E,B25077_001E&for=state:*&key=YOUR_KEY
```

Zillow ZHVI download page:
```
https://www.zillow.com/research/data/
→ Select "ZHVI All Homes (SFR, Condo/Co-op)" → Geography: "County" → Download CSV
```

Census GeoJSON boundaries:
```
https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html
→ Counties → cb_2023_us_county_500k (or 5m for smaller file)
```
