// ─── CORE AFFORDABILITY METRICS ──────────────────────────────────
// Matches notebook logic (cells 3-6) extended for personalization

export interface CountyMetrics {
  fips: string;
  name: string;
  state: string;
  state_abbr: string;
  population: number | null;
  median_age: number | null;
  median_household_income: number | null;
  median_home_value: number | null;
  median_gross_rent: number | null;
  total_housing_units: number | null;
  owner_occupied: number | null;
  renter_occupied: number | null;
  vacant_units: number | null;
  median_year_built: number | null;
  poverty_rate: number | null;
  unemployment_rate: number | null;
  population_growth_rate?: number | null;
  // Derived
  affordability_ratio: number | null;
  affordable_home_price: number | null;
  affordability_gap: number | null;
  price_to_rent_ratio: number | null;
  pct_cost_burdened_renters: number | null;
  pct_cost_burdened_owners: number | null;
  vacancy_rate: number | null;
  homeownership_rate: number | null;
  monthly_income: number | null;
  // Zillow-derived
  yoy_appreciation: number | null;
  five_year_cagr: number | null;
}

export interface AreaData {
  affordabilityRatio: number | null;
  population: number | null;
  unemploymentRate: number | null;
  povertyRate: number | null;
  populationGrowthRate: number | null;
  medianHomeValue: number | null;
  medianIncome: number | null;
}

// ─── NOTEBOOK CELL 3-6: Core Affordability ───────────────────────

/** df['affordability_ratio'] = homevalue / (income + 1) */
export function affordabilityRatio(
  homeValue: number | null,
  income: number | null
): number | null {
  if (!homeValue || !income || income <= 0) return null;
  return Math.round((homeValue / income) * 100) / 100;
}

/** df['affordable_home_price'] = income * 3 */
export function affordableHomePrice(income: number | null): number | null {
  if (!income || income <= 0) return null;
  return Math.round(income * 3);
}

/** df['affordability_gap'] = homevalue - affordable_home_price */
export function affordabilityGap(
  homeValue: number | null,
  income: number | null
): number | null {
  const affordable = affordableHomePrice(income);
  if (!homeValue || !affordable) return null;
  return Math.round(homeValue - affordable);
}

/** Notebook cell 6: status labels */
export function affordabilityStatus(ratio: number | null) {
  if (ratio === null)
    return { label: "No Data", icon: "\u2014", color: "#94a3b8" };
  if (ratio <= 3)
    return { label: "Within reach", icon: "\u2713", color: "#059669" };
  if (ratio <= 5)
    return { label: "A stretch", icon: "\u26a0", color: "#d97706" };
  return { label: "Likely out of reach", icon: "\u2717", color: "#dc2626" };
}

/** gap_text = f"+${gap:,.0f} over" if gap > 0 else f"${abs(gap):,.0f} under" */
export function gapText(gap: number | null): string {
  if (gap === null) return "N/A";
  if (gap > 0) return `+$${gap.toLocaleString()} over`;
  return `$${Math.abs(gap).toLocaleString()} under`;
}

// ─── RATES ───────────────────────────────────────────────────────

/** df['pct_renter'] = RENTER / (OWNER + RENTER + 0.001) */
export function pctRenter(owners: number, renters: number): number | null {
  const total = owners + renters;
  if (total <= 0) return null;
  return Math.round((renters / total) * 1000) / 10;
}

export function costBurdenRate(
  burdened: number,
  total: number
): number | null {
  if (total <= 0) return null;
  return Math.round((burdened / total) * 1000) / 10;
}

export function vacancyRate(vacant: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((vacant / total) * 1000) / 10;
}

export function homeownershipRate(
  owner: number,
  renter: number
): number | null {
  const total = owner + renter;
  if (total <= 0) return null;
  return Math.round((owner / total) * 1000) / 10;
}

// ─── PERSONALIZED MAP COLORING ───────────────────────────────────

/** Color by budget relationship (when user has income) */
export function budgetColor(
  medianHomeValue: number,
  userAffordablePrice: number
): string {
  const ratio = medianHomeValue / userAffordablePrice;
  if (ratio <= 1.0) return "#059669"; // within budget
  if (ratio <= 1.3) return "#34d399"; // slight stretch
  if (ratio <= 1.7) return "#fbbf24"; // stretch
  if (ratio <= 2.0) return "#f97316"; // significant stretch
  return "#dc2626"; // out of reach
}

/** Color by standard affordability ratio (no income) */
export function ratioColor(ratio: number): string {
  if (ratio < 3) return "#059669";
  if (ratio < 4) return "#34d399";
  if (ratio < 5) return "#fbbf24";
  if (ratio < 6) return "#f97316";
  if (ratio < 7) return "#ef4444";
  return "#dc2626";
}

export function ratioLabel(ratio: number): string {
  if (ratio >= 7) return "Severely Unaffordable";
  if (ratio >= 5) return "Stretched";
  if (ratio >= 3) return "Moderate";
  return "Affordable";
}

// ─── LIVABILITY-ADJUSTED RANKING ─────────────────────────────────

/**
 * Prevents purely-distressed areas from dominating "most affordable" lists.
 * Score is internal only — never shown to users as a number.
 */
export function livabilityScore(area: AreaData): number | null {
  if (!area.affordabilityRatio || !area.population) return null;

  let score = 0;

  // Affordability (40 points max — most weight)
  score += Math.max(0, 40 - (area.affordabilityRatio - 1) * 8);

  // Employment (20 points max)
  if (area.unemploymentRate !== null) {
    score += Math.max(0, 20 - (area.unemploymentRate - 2) * 4);
  }

  // Population stability (20 points max)
  if (area.populationGrowthRate !== null) {
    score +=
      area.populationGrowthRate > 0
        ? 20
        : area.populationGrowthRate > -1
          ? 10
          : 0;
  }

  // Poverty (20 points max)
  if (area.povertyRate !== null) {
    score += Math.max(0, 20 - area.povertyRate * 1.2);
  }

  return Math.round(score);
}

// ─── FILTERED SUMMARY STATS (notebook cell 6) ───────────────────

export interface TractData {
  medianIncome: number;
  affordabilityRatio: number | null;
}

export function computeFilteredSummary(
  tracts: TractData[],
  incomeRange: [number, number]
) {
  const filtered = tracts.filter(
    (t) =>
      t.medianIncome >= incomeRange[0] &&
      t.medianIncome <= incomeRange[1] &&
      t.affordabilityRatio !== null
  );
  if (filtered.length === 0) return null;

  const ratios = filtered.map((t) => t.affordabilityRatio!);
  const sum = ratios.reduce((a, b) => a + b, 0);

  return {
    totalTracts: tracts.length,
    filteredTracts: filtered.length,
    avgRatio: Math.round((sum / ratios.length) * 10) / 10,
    pctAffordable:
      Math.round(
        (ratios.filter((r) => r <= 3).length / ratios.length) * 1000
      ) / 10,
    pctStretched:
      Math.round(
        (ratios.filter((r) => r > 3 && r <= 5).length / ratios.length) * 1000
      ) / 10,
    pctUnaffordable:
      Math.round(
        (ratios.filter((r) => r > 5).length / ratios.length) * 1000
      ) / 10,
  };
}

// ─── MORTGAGE & PAYMENT CALCULATIONS ─────────────────────────────

/**
 * Calculate standard down payment amount (typically 20%)
 * @param homeValue - Home price
 * @param downPaymentPct - Down payment percentage (default 20%)
 * @returns Down payment amount
 */
export function calculateDownPayment(
  homeValue: number | null,
  downPaymentPct: number = 0.20
): number | null {
  if (!homeValue || homeValue <= 0) return null;
  return Math.round(homeValue * downPaymentPct);
}

/**
 * Calculate monthly mortgage payment (principal + interest only)
 * @param homeValue - Home price
 * @param downPaymentPct - Down payment percentage (default 0.20 = 20%)
 * @param annualInterestRate - Annual interest rate (default 0.07 = 7%)
 * @param years - Loan term in years (default 30)
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  homeValue: number | null,
  downPaymentPct: number = 0.20,
  annualInterestRate: number = 0.07,
  years: number = 30
): number | null {
  if (!homeValue || homeValue <= 0) return null;
  
  const downPayment = homeValue * downPaymentPct;
  const principal = homeValue - downPayment;
  const monthlyRate = annualInterestRate / 12;
  const numPayments = years * 12;
  
  // Standard mortgage payment formula: M = P[r(1+r)^n]/[(1+r)^n - 1]
  const payment = 
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return Math.round(payment);
}

/**
 * Calculate full monthly housing cost including taxes and insurance estimates
 * @param homeValue - Home price
 * @param downPaymentPct - Down payment percentage (default 0.20)
 * @param annualInterestRate - Annual interest rate (default 0.07)
 * @param years - Loan term in years (default 30)
 * @param propertyTaxRate - Annual property tax rate (default 0.011 = 1.1%)
 * @param insuranceRate - Annual insurance rate (default 0.0035 = 0.35%)
 * @returns Total monthly payment (PITI: Principal, Interest, Taxes, Insurance)
 */
export function calculateFullMonthlyPayment(
  homeValue: number | null,
  downPaymentPct: number = 0.20,
  annualInterestRate: number = 0.07,
  years: number = 30,
  propertyTaxRate: number = 0.011,
  insuranceRate: number = 0.0035
): number | null {
  const piPayment = calculateMonthlyPayment(homeValue, downPaymentPct, annualInterestRate, years);
  if (!piPayment || !homeValue) return null;
  
  const monthlyTax = (homeValue * propertyTaxRate) / 12;
  const monthlyInsurance = (homeValue * insuranceRate) / 12;
  
  return Math.round(piPayment + monthlyTax + monthlyInsurance);
}

// ─── LEGACY COMPAT (used by existing components) ─────────────────

export const calcAffordabilityRatio = affordabilityRatio;
export const calcAffordableHomePrice = affordableHomePrice;
export const calcAffordabilityGap = affordabilityGap;

export function calcPriceToRentRatio(
  homeValue: number | null,
  rent: number | null
): number | null {
  if (!homeValue || !rent || rent === 0) return null;
  return homeValue / (rent * 12);
}

export function isSmallSample(population: number | null): boolean {
  return population != null && population < 500;
}

export function computeDerivedMetrics(raw: {
  median_home_value: number | null;
  median_household_income: number | null;
  median_gross_rent: number | null;
  owner_occupied: number | null;
  renter_occupied: number | null;
  vacant_units: number | null;
  total_housing_units: number | null;
  cost_burdened_renters?: number | null;
  total_renters?: number | null;
  cost_burdened_owners?: number | null;
  total_owners?: number | null;
}) {
  const ratio = affordabilityRatio(
    raw.median_home_value,
    raw.median_household_income
  );
  const affordable = affordableHomePrice(raw.median_household_income);
  const gap = affordabilityGap(raw.median_home_value, raw.median_household_income);
  const ptr = calcPriceToRentRatio(raw.median_home_value, raw.median_gross_rent);

  const vr =
    raw.vacant_units != null && raw.total_housing_units
      ? vacancyRate(raw.vacant_units, raw.total_housing_units)
      : null;
  const hr =
    raw.owner_occupied != null && raw.renter_occupied != null
      ? homeownershipRate(raw.owner_occupied, raw.renter_occupied)
      : null;
  const mi = raw.median_household_income
    ? raw.median_household_income / 12
    : null;

  let pcbr: number | null = null;
  if (
    raw.cost_burdened_renters != null &&
    raw.total_renters &&
    raw.total_renters > 0
  ) {
    pcbr = costBurdenRate(raw.cost_burdened_renters, raw.total_renters);
  }

  let pcbo: number | null = null;
  if (
    raw.cost_burdened_owners != null &&
    raw.total_owners &&
    raw.total_owners > 0
  ) {
    pcbo = costBurdenRate(raw.cost_burdened_owners, raw.total_owners);
  }

  return {
    affordability_ratio: ratio,
    affordable_home_price: affordable,
    affordability_gap: gap,
    price_to_rent_ratio: ptr,
    vacancy_rate: vr,
    homeownership_rate: hr,
    monthly_income: mi,
    pct_cost_burdened_renters: pcbr,
    pct_cost_burdened_owners: pcbo,
  };
}
