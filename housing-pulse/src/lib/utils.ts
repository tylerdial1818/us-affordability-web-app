// ─── NUMBER FORMATTING ───────────────────────────────────────────

/** Format as currency: $123,456 or $1.5M */
export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "N/A";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  return "$" + Math.round(n).toLocaleString();
}

/** Compact format: 1.5M or 320K */
export function formatCompact(n: number | null | undefined): string {
  if (n == null) return "N/A";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return Math.round(n / 1_000) + "K";
  return String(n);
}

/** Format as percentage: 31.2% */
export function formatPct(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "N/A";
  return n.toFixed(decimals) + "%";
}

/** Format as ratio: 4.3x */
export function formatRatio(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return n.toFixed(1) + "x";
}

// ─── COLOR HELPERS ───────────────────────────────────────────────

/** Get color based on affordability ratio */
export function ratioColor(r: number): string {
  if (r >= 7) return "#ef4444";
  if (r >= 5) return "#f97316";
  if (r >= 3) return "#f59e0b";
  return "#10b981";
}

/** Get label based on affordability ratio */
export function ratioLabel(r: number): string {
  if (r >= 7) return "Severely Unaffordable";
  if (r >= 5) return "Stretched";
  if (r >= 3) return "Moderate";
  return "Affordable";
}

/** Get choropleth color for affordability ratio */
export function choroplethColor(ratio: number): string {
  if (ratio < 3) return "#059669";
  if (ratio < 4) return "#10b981";
  if (ratio < 5) return "#fbbf24";
  if (ratio < 6) return "#f97316";
  if (ratio < 7) return "#ef4444";
  return "#dc2626";
}

/** Get choropleth color for home value */
export function homeValueColor(value: number): string {
  const v = value / 100_000;
  if (v < 2) return "#059669";
  if (v < 3) return "#10b981";
  if (v < 4) return "#fbbf24";
  if (v < 5) return "#f97316";
  return "#ef4444";
}

// ─── FIPS HELPERS ────────────────────────────────────────────────

/** Pad a FIPS code to 5 digits */
export function padFips(fips: string | number): string {
  return String(fips).padStart(5, "0");
}

/** Get state FIPS (first 2 digits) from county FIPS */
export function stateFipsFromCounty(countyFips: string): string {
  return countyFips.slice(0, 2);
}

// ─── MISC ────────────────────────────────────────────────────────

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** cn - simple class name joiner */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
