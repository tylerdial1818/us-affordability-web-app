import type { CountyMetrics } from "./calculations";

// ─── MOCK DATA GENERATORS ────────────────────────────────────────
// These mirror the demo JSX's data patterns exactly.
// In production, these are replaced with static JSON from ETL scripts.

export function generateNationalTrend() {
  return Array.from({ length: 120 }, (_, i) => {
    const date = new Date(2016, i);
    const base = 220000 + i * 1200 + Math.sin(i / 6) * 5000;
    const covid = i > 48 ? (i - 48) * 2800 : 0;
    const correction = i > 84 ? -(i - 84) * 400 : 0;
    return {
      month: date.toLocaleDateString("en-US", { year: "2-digit", month: "short" }),
      value: Math.round(base + covid + correction),
      year: date.getFullYear(),
      idx: i,
    };
  });
}

export function generateIncomeTrend() {
  const nationalTrend = generateNationalTrend();
  return Array.from({ length: 120 }, (_, i) => ({
    month: nationalTrend[i].month,
    income: Math.round(62000 + i * 180 + Math.sin(i / 12) * 1000),
    idx: i,
  }));
}

export function generateAffordabilityTrend() {
  const nationalTrend = generateNationalTrend();
  const incomeTrend = generateIncomeTrend();
  return nationalTrend.map((d, i) => ({
    month: d.month,
    ratio: +(d.value / incomeTrend[i].income).toFixed(2),
    idx: i,
  }));
}

export interface StateData {
  name: string;
  abbr: string;
  ratio: number;
  value: number;
  income: number;
}

export const STATES_DATA: StateData[] = [
  { name: "California", abbr: "CA", ratio: 8.2, value: 659000, income: 80440 },
  { name: "Hawaii", abbr: "HI", ratio: 8.9, value: 722000, income: 81275 },
  { name: "Massachusetts", abbr: "MA", ratio: 6.4, value: 481000, income: 75000 },
  { name: "New York", abbr: "NY", ratio: 5.9, value: 384000, income: 65000 },
  { name: "Colorado", abbr: "CO", ratio: 5.7, value: 415000, income: 72845 },
  { name: "Washington", abbr: "WA", ratio: 5.5, value: 410000, income: 74500 },
  { name: "Oregon", abbr: "OR", ratio: 5.3, value: 372000, income: 70210 },
  { name: "New Jersey", abbr: "NJ", ratio: 5.1, value: 395000, income: 77500 },
  { name: "Utah", abbr: "UT", ratio: 5.6, value: 420000, income: 75000 },
  { name: "Florida", abbr: "FL", ratio: 5.0, value: 330000, income: 66000 },
  { name: "Nevada", abbr: "NV", ratio: 4.8, value: 345000, income: 71900 },
  { name: "Arizona", abbr: "AZ", ratio: 4.5, value: 310000, income: 68900 },
  { name: "Montana", abbr: "MT", ratio: 4.9, value: 295000, income: 60200 },
  { name: "Idaho", abbr: "ID", ratio: 4.7, value: 310000, income: 65900 },
  { name: "Virginia", abbr: "VA", ratio: 4.2, value: 330000, income: 78500 },
  { name: "Maryland", abbr: "MD", ratio: 4.3, value: 352000, income: 81900 },
  { name: "Connecticut", abbr: "CT", ratio: 4.6, value: 310000, income: 67300 },
  { name: "Georgia", abbr: "GA", ratio: 3.6, value: 245000, income: 68200 },
  { name: "North Carolina", abbr: "NC", ratio: 3.4, value: 230000, income: 67600 },
  { name: "Texas", abbr: "TX", ratio: 3.5, value: 238000, income: 68000 },
  { name: "Tennessee", abbr: "TN", ratio: 3.3, value: 222000, income: 67300 },
  { name: "Pennsylvania", abbr: "PA", ratio: 3.2, value: 218000, income: 68100 },
  { name: "Michigan", abbr: "MI", ratio: 2.7, value: 180000, income: 66700 },
  { name: "Ohio", abbr: "OH", ratio: 2.6, value: 170000, income: 65400 },
  { name: "Indiana", abbr: "IN", ratio: 2.5, value: 165000, income: 66000 },
  { name: "Iowa", abbr: "IA", ratio: 2.3, value: 155000, income: 67400 },
  { name: "Kansas", abbr: "KS", ratio: 2.4, value: 160000, income: 66700 },
  { name: "Missouri", abbr: "MO", ratio: 2.5, value: 168000, income: 67200 },
  { name: "Oklahoma", abbr: "OK", ratio: 2.2, value: 142000, income: 64500 },
  { name: "Arkansas", abbr: "AR", ratio: 2.1, value: 135000, income: 64300 },
  { name: "Mississippi", abbr: "MS", ratio: 2.0, value: 125000, income: 62500 },
  { name: "West Virginia", abbr: "WV", ratio: 1.9, value: 118000, income: 62100 },
].sort((a, b) => b.ratio - a.ratio);

export function getScatterData() {
  const westStates = ["CA", "HI", "WA", "OR", "NV", "AZ", "UT", "CO", "ID", "MT"];
  const neStates = ["NY", "MA", "NJ", "CT", "PA", "MD", "VA"];
  const southStates = ["TX", "FL", "GA", "NC", "TN", "AR", "MS", "OK", "WV"];

  return STATES_DATA.map((s) => ({
    ...s,
    pop: Math.round((Math.abs(Math.sin(s.ratio * 7)) * 30 + 2) * 1000000),
    region: westStates.includes(s.abbr)
      ? "West"
      : neStates.includes(s.abbr)
        ? "Northeast"
        : southStates.includes(s.abbr)
          ? "South"
          : "Midwest",
  }));
}

export const COST_BURDEN_DATA = [
  { name: "Severely Burdened (>50%)", value: 14.2, color: "#ef4444" },
  { name: "Cost Burdened (30-50%)", value: 16.8, color: "#f59e0b" },
  { name: "Not Burdened (<30%)", value: 69.0, color: "#10b981" },
];

export const TOP_AFFORDABLE = [
  { rank: 1, county: "McDowell County", state: "WV", income: 27800, value: 38500, ratio: 1.4 },
  { rank: 2, county: "Macon County", state: "AL", income: 31200, value: 52000, ratio: 1.7 },
  { rank: 3, county: "Sumter County", state: "AL", income: 25600, value: 48900, ratio: 1.9 },
  { rank: 4, county: "Phillips County", state: "AR", income: 30100, value: 58200, ratio: 1.9 },
  { rank: 5, county: "Holmes County", state: "MS", income: 24800, value: 50000, ratio: 2.0 },
];

export const LEAST_AFFORDABLE = [
  { rank: 1, county: "San Mateo County", state: "CA", income: 136800, value: 1540000, ratio: 11.3 },
  { rank: 2, county: "Santa Clara County", state: "CA", income: 143600, value: 1490000, ratio: 10.4 },
  { rank: 3, county: "San Francisco", state: "CA", income: 126800, value: 1250000, ratio: 9.9 },
  { rank: 4, county: "Maui County", state: "HI", income: 85400, value: 835000, ratio: 9.8 },
  { rank: 5, county: "Nantucket County", state: "MA", income: 102500, value: 985000, ratio: 9.6 },
];

// ─── US STATES SVG PATHS (from demo) ─────────────────────────────
export const US_STATES_SVG: Record<string, { d: string }> = {
  WA: { d: "M62,18L78,14L84,18L86,36L78,38L62,34Z" },
  OR: { d: "M56,38L82,36L86,56L76,64L54,58Z" },
  CA: { d: "M52,60L76,64L80,90L72,118L48,114L44,80Z" },
  NV: { d: "M76,64L86,56L92,72L84,98L72,96Z" },
  ID: { d: "M84,18L92,16L98,26L96,52L86,56L84,36Z" },
  MT: { d: "M92,16L130,12L132,34L96,38Z" },
  UT: { d: "M86,56L96,52L98,58L96,82L84,80L82,72Z" },
  AZ: { d: "M72,96L84,98L86,118L74,126L60,120Z" },
  CO: { d: "M98,58L126,56L128,78L100,80Z" },
  WY: { d: "M96,38L132,34L130,56L98,58Z" },
  NM: { d: "M86,100L100,98L102,128L84,130L76,126Z" },
  ND: { d: "M132,12L164,12L164,30L132,30Z" },
  SD: { d: "M132,30L164,30L164,48L132,48Z" },
  NE: { d: "M126,48L164,48L166,62L128,64Z" },
  KS: { d: "M128,64L166,62L168,80L130,82Z" },
  OK: { d: "M130,82L168,80L172,88L160,98L130,96Z" },
  TX: { d: "M120,98L160,98L172,100L168,140L142,152L112,142L108,118Z" },
  MN: { d: "M164,12L192,14L192,38L164,38Z" },
  IA: { d: "M166,38L192,38L194,56L168,56Z" },
  MO: { d: "M168,58L196,56L200,78L176,84L170,80Z" },
  AR: { d: "M176,84L200,80L202,100L178,102Z" },
  LA: { d: "M178,102L202,100L208,118L192,126L180,120Z" },
  WI: { d: "M192,14L214,16L216,38L194,38Z" },
  IL: { d: "M196,40L216,38L218,66L200,70L198,56Z" },
  MS: { d: "M202,100L214,98L218,126L208,128L204,118Z" },
  MI: { d: "M216,12L234,14L232,36L216,34Z" },
  IN: { d: "M218,40L232,38L234,62L220,64Z" },
  OH: { d: "M234,36L252,34L254,56L236,58Z" },
  KY: { d: "M220,66L254,58L258,72L228,76L222,74Z" },
  TN: { d: "M218,78L260,72L262,84L222,86Z" },
  AL: { d: "M218,88L236,86L240,114L222,116Z" },
  GA: { d: "M238,86L258,84L262,112L244,116Z" },
  FL: { d: "M240,116L268,112L278,130L266,152L250,140L242,126Z" },
  SC: { d: "M258,82L272,78L270,96L252,96Z" },
  NC: { d: "M252,72L280,68L282,78L256,82Z" },
  VA: { d: "M256,60L282,56L284,68L262,72Z" },
  WV: { d: "M254,52L264,50L266,62L256,66Z" },
  PA: { d: "M252,34L282,30L284,44L256,46Z" },
  NY: { d: "M264,16L290,12L288,32L262,34Z" },
  VT: { d: "M284,10L290,8L292,20L286,22Z" },
  NH: { d: "M290,8L296,8L294,22L290,20Z" },
  ME: { d: "M296,4L306,2L304,20L294,18Z" },
  MA: { d: "M288,26L302,24L302,30L290,30Z" },
  CT: { d: "M288,32L298,30L298,36L290,36Z" },
  NJ: { d: "M282,34L290,32L290,46L284,44Z" },
  DE: { d: "M282,44L288,44L288,50L284,50Z" },
  MD: { d: "M272,48L286,46L288,54L274,56Z" },
};

// ─── COUNTY MOCK DATA (for county detail page) ──────────────────
export function getMockCountyData(fips: string): CountyMetrics | null {
  const counties: Record<string, CountyMetrics> = {
    "06081": {
      fips: "06081",
      name: "San Mateo County",
      state: "California",
      state_abbr: "CA",
      population: 764442,
      median_age: 39.8,
      median_household_income: 136800,
      median_home_value: 1540000,
      median_gross_rent: 2450,
      total_housing_units: 271031,
      owner_occupied: 155892,
      renter_occupied: 103140,
      vacant_units: 11999,
      median_year_built: 1966,
      poverty_rate: 5.8,
      unemployment_rate: 3.2,
      affordability_ratio: 11.3,
      affordable_home_price: 410400,
      affordability_gap: 1129600,
      price_to_rent_ratio: 52.4,
      pct_cost_burdened_renters: 48.2,
      pct_cost_burdened_owners: 32.5,
      vacancy_rate: 4.4,
      homeownership_rate: 60.2,
      monthly_income: 11400,
      yoy_appreciation: 4.8,
      five_year_cagr: 6.2,
    },
    "54047": {
      fips: "54047",
      name: "McDowell County",
      state: "West Virginia",
      state_abbr: "WV",
      population: 18600,
      median_age: 44.2,
      median_household_income: 27800,
      median_home_value: 38500,
      median_gross_rent: 520,
      total_housing_units: 12450,
      owner_occupied: 7200,
      renter_occupied: 2800,
      vacant_units: 2450,
      median_year_built: 1958,
      poverty_rate: 32.1,
      unemployment_rate: 9.8,
      affordability_ratio: 1.4,
      affordable_home_price: 83400,
      affordability_gap: -44900,
      price_to_rent_ratio: 6.2,
      pct_cost_burdened_renters: 38.5,
      pct_cost_burdened_owners: 14.2,
      vacancy_rate: 19.7,
      homeownership_rate: 72.0,
      monthly_income: 2317,
      yoy_appreciation: 1.2,
      five_year_cagr: 0.8,
    },
  };

  return counties[fips] || null;
}
