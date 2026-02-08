/**
 * build_app_data.js — Transform ETL output into app-ready JSON
 *
 * Reads:   public/data/counties_acs.json, public/data/national_trends.json
 * Writes:  src/lib/generated-data.json
 *
 * Usage:   node scripts/build_app_data.js
 *
 * This generates the exact data shapes the app pages consume:
 * - statesData: state-level aggregates (name, abbr, ratio, value, income)
 * - affordabilityTrend: monthly ratio trend from ZHVI + ACS income
 * - nationalTrend: monthly median home values
 * - costBurdenData: national cost burden breakdown
 * - topAffordable / leastAffordable: top/bottom 5 counties by ratio
 * - allCounties: full county lookup keyed by FIPS
 */

const fs = require("fs");
const path = require("path");

const PUBLIC_DATA = path.join(__dirname, "..", "public", "data");
const OUTPUT = path.join(__dirname, "..", "src", "lib", "generated-data.json");

// ─── State abbreviation mapping ─────────────────────────────────
const STATE_ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY", "Puerto Rico": "PR",
};

// ─── Load ETL data ──────────────────────────────────────────────
const countiesPath = path.join(PUBLIC_DATA, "counties_acs.json");
const trendsPath = path.join(PUBLIC_DATA, "national_trends.json");

if (!fs.existsSync(countiesPath)) {
  console.error("ERROR: counties_acs.json not found. Run fetch_census_data.py first.");
  process.exit(1);
}

const countiesRaw = JSON.parse(fs.readFileSync(countiesPath, "utf8"));
const counties = Object.values(countiesRaw);

let trendsData = null;
if (fs.existsSync(trendsPath)) {
  trendsData = JSON.parse(fs.readFileSync(trendsPath, "utf8"));
}

console.log(`Loaded ${counties.length} counties`);
if (trendsData) console.log(`Loaded ${trendsData.series.length} months of trend data`);

// ─── 1. Build STATES_DATA ───────────────────────────────────────
// Population-weighted aggregation per state
const stateMap = {};
for (const c of counties) {
  const st = c.state;
  if (!st) continue;
  if (!stateMap[st]) {
    stateMap[st] = { name: st, pop: 0, incomeWeighted: 0, valueWeighted: 0, validCount: 0 };
  }
  const s = stateMap[st];
  const pop = c.population || 0;
  s.pop += pop;
  if (c.median_household_income && c.median_home_value && pop > 0) {
    s.incomeWeighted += c.median_household_income * pop;
    s.valueWeighted += c.median_home_value * pop;
    s.validCount += pop;
  }
}

const statesData = Object.values(stateMap)
  .filter(s => s.validCount > 0)
  .map(s => {
    const income = Math.round(s.incomeWeighted / s.validCount);
    const value = Math.round(s.valueWeighted / s.validCount);
    return {
      name: s.name,
      abbr: STATE_ABBR[s.name] || s.name.slice(0, 2).toUpperCase(),
      ratio: +(value / income).toFixed(1),
      value,
      income,
    };
  })
  .sort((a, b) => b.ratio - a.ratio);

console.log(`Built ${statesData.length} state aggregates`);

// ─── 2. Build affordability trend ───────────────────────────────
// Uses ZHVI national median home values + estimated income growth
let affordabilityTrend = [];
let nationalTrend = [];

if (trendsData && trendsData.series) {
  // National median income from ACS (latest data point)
  const allIncomes = counties
    .filter(c => c.median_household_income && c.population)
    .map(c => ({ income: c.median_household_income, pop: c.population }));

  let totalWeightedIncome = 0, totalPop = 0;
  for (const x of allIncomes) {
    totalWeightedIncome += x.income * x.pop;
    totalPop += x.pop;
  }
  const currentNationalIncome = Math.round(totalWeightedIncome / totalPop);

  // Assume ~3% annual income growth backward from current
  const series = trendsData.series;
  const lastDate = new Date(series[series.length - 1].date);

  nationalTrend = series.map((point, i) => {
    const d = new Date(point.date);
    return {
      month: d.toLocaleDateString("en-US", { year: "2-digit", month: "short" }),
      value: Math.round(point.median),
      year: d.getFullYear(),
      idx: i,
    };
  });

  affordabilityTrend = series.map((point, i) => {
    const d = new Date(point.date);
    const monthsBack = (lastDate.getFullYear() - d.getFullYear()) * 12 + (lastDate.getMonth() - d.getMonth());
    const estimatedIncome = currentNationalIncome / Math.pow(1.03, monthsBack / 12);
    return {
      month: d.toLocaleDateString("en-US", { year: "2-digit", month: "short" }),
      ratio: +(point.median / estimatedIncome).toFixed(2),
      idx: i,
    };
  });

  console.log(`Built ${affordabilityTrend.length} affordability trend points`);
}

// ─── 3. Build cost burden data ──────────────────────────────────
// Compute national averages from county data
let totalCBR = 0, cbrCount = 0;
let totalCBO = 0, cboCount = 0;
for (const c of counties) {
  if (c.pct_cost_burdened_renters != null) { totalCBR += c.pct_cost_burdened_renters; cbrCount++; }
  if (c.pct_cost_burdened_owners != null) { totalCBO += c.pct_cost_burdened_owners; cboCount++; }
}
const avgCBR = cbrCount > 0 ? totalCBR / cbrCount : 30;
const avgCBO = cboCount > 0 ? totalCBO / cboCount : 15;

// Estimate: severely burdened = above 50% threshold (rough split)
const severelyBurdened = +(avgCBR * 0.45).toFixed(1); // ~45% of cost-burdened renters are severely so
const costBurdened = +(avgCBR * 0.55).toFixed(1);
const notBurdened = +(100 - severelyBurdened - costBurdened).toFixed(1);

const costBurdenData = [
  { name: "Severely Burdened (>50%)", value: severelyBurdened, color: "#ef4444" },
  { name: "Cost Burdened (30-50%)", value: costBurdened, color: "#f59e0b" },
  { name: "Not Burdened (<30%)", value: notBurdened, color: "#10b981" },
];

console.log(`Cost burden: ${severelyBurdened}% severe, ${costBurdened}% burdened, ${notBurdened}% not`);

// ─── 4. Build top/bottom affordable counties ────────────────────
const validCounties = counties.filter(
  c => c.affordability_ratio && c.population > 1000 && c.median_household_income > 10000
);

const sortedByRatio = [...validCounties].sort((a, b) => a.affordability_ratio - b.affordability_ratio);

const topAffordable = sortedByRatio.slice(0, 5).map((c, i) => ({
  rank: i + 1,
  county: c.county_name || c.name,
  state: STATE_ABBR[c.state] || c.state,
  income: c.median_household_income,
  value: c.median_home_value,
  ratio: c.affordability_ratio,
}));

const leastAffordable = sortedByRatio.slice(-5).reverse().map((c, i) => ({
  rank: i + 1,
  county: c.county_name || c.name,
  state: STATE_ABBR[c.state] || c.state,
  income: c.median_household_income,
  value: c.median_home_value,
  ratio: c.affordability_ratio,
}));

console.log("Top affordable:", topAffordable.map(c => `${c.county} (${c.ratio})`).join(", "));
console.log("Least affordable:", leastAffordable.map(c => `${c.county} (${c.ratio})`).join(", "));

// ─── 5. Compute national KPI summary ───────────────────────────
const ratios = validCounties.map(c => c.affordability_ratio);
const nationalRatio = +(ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(1);

let totalNationalIncome = 0, totalNationalPop = 0;
for (const c of counties) {
  if (c.median_household_income && c.population) {
    totalNationalIncome += c.median_household_income * c.population;
    totalNationalPop += c.population;
  }
}
const nationalMedianIncome = Math.round(totalNationalIncome / totalNationalPop);

let totalNationalValue = 0, totalValuePop = 0;
for (const c of counties) {
  if (c.median_home_value && c.population) {
    totalNationalValue += c.median_home_value * c.population;
    totalValuePop += c.population;
  }
}
const nationalMedianHomeValue = Math.round(totalNationalValue / totalValuePop);

const pctAffordable = +((validCounties.filter(c => c.affordability_ratio <= 3).length / validCounties.length) * 100).toFixed(1);

const kpiSummary = {
  nationalRatio,
  nationalMedianIncome,
  nationalMedianHomeValue,
  pctAffordable,
  totalCounties: counties.length,
  avgCostBurdenedRenters: +(avgCBR).toFixed(1),
  avgCostBurdenedOwners: +(avgCBO).toFixed(1),
};

console.log(`National KPIs: ratio=${nationalRatio}, income=$${nationalMedianIncome}, value=$${nationalMedianHomeValue}, ${pctAffordable}% affordable`);

// ─── Write output ───────────────────────────────────────────────
const output = {
  statesData,
  affordabilityTrend,
  nationalTrend,
  costBurdenData,
  topAffordable,
  leastAffordable,
  kpiSummary,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output));
const sizeMB = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(2);
console.log(`\nWrote ${OUTPUT} (${sizeMB} MB)`);
console.log("Done.");
