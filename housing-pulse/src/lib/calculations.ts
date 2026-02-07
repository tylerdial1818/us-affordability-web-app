// ─── CORE AFFORDABILITY METRICS ──────────────────────────────────
// All derived calculations documented inline per build instructions

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
  // Zillow-derived (optional)
  yoy_appreciation: number | null;
  five_year_cagr: number | null;
}

/**
 * affordability_ratio = median_home_value / median_household_income
 * Interpretation: <3 = affordable, 3-5 = moderate, 5-7 = stretched, 7+ = severe
 */
export function calcAffordabilityRatio(
  homeValue: number | null,
  income: number | null
): number | null {
  if (!homeValue || !income || income === 0) return null;
  return homeValue / income;
}

/**
 * affordable_home_price = median_household_income * 3
 * Rule of thumb: home should cost <= 3x annual income
 */
export function calcAffordableHomePrice(income: number | null): number | null {
  if (!income) return null;
  return income * 3;
}

/**
 * affordability_gap = median_home_value - affordable_home_price
 * Positive = unaffordable, negative = within reach
 */
export function calcAffordabilityGap(
  homeValue: number | null,
  income: number | null
): number | null {
  if (!homeValue || !income) return null;
  const affordable = income * 3;
  return homeValue - affordable;
}

/**
 * price_to_rent_ratio = median_home_value / (median_gross_rent * 12)
 * >20 favors renting, <15 favors buying
 */
export function calcPriceToRentRatio(
  homeValue: number | null,
  rent: number | null
): number | null {
  if (!homeValue || !rent || rent === 0) return null;
  return homeValue / (rent * 12);
}

/**
 * vacancy_rate = vacant_units / total_units * 100
 */
export function calcVacancyRate(
  vacant: number | null,
  total: number | null
): number | null {
  if (vacant == null || !total || total === 0) return null;
  return (vacant / total) * 100;
}

/**
 * homeownership_rate = owner_occupied / (owner_occupied + renter_occupied) * 100
 */
export function calcHomeownershipRate(
  owner: number | null,
  renter: number | null
): number | null {
  if (owner == null || renter == null) return null;
  const total = owner + renter;
  if (total === 0) return null;
  return (owner / total) * 100;
}

/**
 * YoY appreciation from ZHVI time series
 */
export function calcYoyAppreciation(
  current: number | null,
  yearAgo: number | null
): number | null {
  if (!current || !yearAgo || yearAgo === 0) return null;
  return ((current - yearAgo) / yearAgo) * 100;
}

/**
 * Five-year CAGR from ZHVI
 */
export function calcFiveYearCagr(
  current: number | null,
  fiveYearAgo: number | null
): number | null {
  if (!current || !fiveYearAgo || fiveYearAgo === 0) return null;
  return (Math.pow(current / fiveYearAgo, 1 / 5) - 1) * 100;
}

/**
 * Determine if a county estimate is reliable based on population
 */
export function isSmallSample(population: number | null): boolean {
  return population != null && population < 1000;
}

/**
 * Compute all derived metrics for a county
 */
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
  const affordability_ratio = calcAffordabilityRatio(raw.median_home_value, raw.median_household_income);
  const affordable_home_price = calcAffordableHomePrice(raw.median_household_income);
  const affordability_gap = calcAffordabilityGap(raw.median_home_value, raw.median_household_income);
  const price_to_rent_ratio = calcPriceToRentRatio(raw.median_home_value, raw.median_gross_rent);
  const vacancy_rate = calcVacancyRate(raw.vacant_units, raw.total_housing_units);
  const homeownership_rate = calcHomeownershipRate(raw.owner_occupied, raw.renter_occupied);
  const monthly_income = raw.median_household_income ? raw.median_household_income / 12 : null;

  let pct_cost_burdened_renters: number | null = null;
  if (raw.cost_burdened_renters != null && raw.total_renters && raw.total_renters > 0) {
    pct_cost_burdened_renters = (raw.cost_burdened_renters / raw.total_renters) * 100;
  }

  let pct_cost_burdened_owners: number | null = null;
  if (raw.cost_burdened_owners != null && raw.total_owners && raw.total_owners > 0) {
    pct_cost_burdened_owners = (raw.cost_burdened_owners / raw.total_owners) * 100;
  }

  return {
    affordability_ratio,
    affordable_home_price,
    affordability_gap,
    price_to_rent_ratio,
    vacancy_rate,
    homeownership_rate,
    monthly_income,
    pct_cost_burdened_renters,
    pct_cost_burdened_owners,
  };
}
