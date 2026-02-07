// ─── COLOR SCALES ────────────────────────────────────────────────
export const COLORS = {
  primary: "#1E3A5F",
  blue: "#3B82F6",
  indigo: "#6366F1",
  green: "#10B981",
  greenDark: "#059669",
  yellow: "#F59E0B",
  amber: "#D97706",
  orange: "#F97316",
  red: "#EF4444",
  redDark: "#DC2626",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textDim: "#64748B",
} as const;

export const REGION_COLORS: Record<string, string> = {
  West: "#6366f1",
  Northeast: "#06b6d4",
  South: "#f59e0b",
  Midwest: "#10b981",
};

// ─── AFFORDABILITY THRESHOLDS ────────────────────────────────────
export const AFFORDABILITY_THRESHOLDS = {
  affordable: 3,
  moderate: 5,
  stretched: 7,
} as const;

// ─── CHOROPLETH COLOR STOPS ──────────────────────────────────────
export const CHOROPLETH_COLORS = {
  affordable: "#1a9850",
  moderate: "#fee08b",
  unaffordable: "#d73027",
} as const;

// ─── METRIC OPTIONS FOR MAP ──────────────────────────────────────
export const MAP_METRICS = [
  { key: "affordability_ratio", label: "Affordability Ratio", desc: "Home Value ÷ Income", prefix: "", suffix: "x" },
  { key: "median_home_value", label: "Median Home Value", desc: "Dollar amount", prefix: "$", suffix: "" },
  { key: "median_household_income", label: "Median Income", desc: "Household annual", prefix: "$", suffix: "" },
  { key: "median_gross_rent", label: "Median Gross Rent", desc: "Monthly rent", prefix: "$", suffix: "" },
  { key: "homeownership_rate", label: "Homeownership Rate", desc: "% owner-occupied", prefix: "", suffix: "%" },
  { key: "pct_cost_burdened_renters", label: "Cost-Burdened Renters", desc: "% paying >30% on housing", prefix: "", suffix: "%" },
  { key: "vacancy_rate", label: "Vacancy Rate", desc: "% vacant units", prefix: "", suffix: "%" },
] as const;

export type MapMetricKey = typeof MAP_METRICS[number]["key"];

// ─── INCOME BRACKETS ─────────────────────────────────────────────
export const INCOME_RANGE = {
  min: 10,
  max: 200,
  defaultMin: 20,
  defaultMax: 160,
  step: 5,
} as const;

// ─── STATE FIPS TO ABBR MAPPING ──────────────────────────────────
export const STATE_FIPS: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
