"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
import { useIncome } from "@/components/shared/IncomeContext";
import MapboxChoropleth from "@/components/map/MapboxChoropleth";
import type { CountyTooltipData } from "@/components/map/MapboxChoropleth";
import { STATES_DATA } from "@/lib/data";
import {
  ratioColor,
  budgetColor,
  affordabilityGap,
  gapText,
  affordabilityStatus,
  calculateDownPayment,
  calculateMonthlyPayment,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";

// ─── STYLE CONSTANTS ─────────────────────────────────────────────

const cardStyle = {
  background: "#ffffff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 24,
  position: "relative" as const,
  overflow: "hidden" as const,
};

const sheenStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  height: 1,
  background:
    "linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%)",
};

const sectionTitleStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 13,
  fontWeight: 700 as const,
  color: "#0f172a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  marginBottom: 12,
};

// ─── HARDCODED TOP PICKS (counties with livability info) ─────────

const TOP_PICKS = [
  {
    county: "McDowell County",
    state: "West Virginia",
    medianHomeValue: 38500,
    unemployment: 9.8,
    growth: "Stable",
    livability: "Rural charm",
  },
  {
    county: "Phillips County",
    state: "Arkansas",
    medianHomeValue: 58200,
    unemployment: 5.4,
    growth: "Growing",
    livability: "Small-town feel",
  },
  {
    county: "Macon County",
    state: "Alabama",
    medianHomeValue: 52000,
    unemployment: 4.9,
    growth: "Growing",
    livability: "Community-oriented",
  },
];

// ─── REGION MAPPING ──────────────────────────────────────────────

const REGIONS: Record<string, string[]> = {
  West: ["CA", "HI", "WA", "OR", "NV", "AZ", "UT", "CO", "ID", "MT", "WY", "NM"],
  Northeast: ["NY", "MA", "NJ", "CT", "PA", "MD", "VA", "VT", "NH", "ME", "DE"],
  South: ["TX", "FL", "GA", "NC", "TN", "AR", "MS", "OK", "WV", "SC", "AL", "LA", "KY"],
  Midwest: ["OH", "IN", "MI", "IA", "KS", "MO", "MN", "WI", "IL", "NE", "ND", "SD"],
};

function getRegion(abbr: string): string {
  for (const [region, states] of Object.entries(REGIONS)) {
    if (states.includes(abbr)) return region;
  }
  return "Other";
}

// ─── COMPONENT ───────────────────────────────────────────────────

export default function ExplorePage() {
  const router = useRouter();
  const { income, setIncome, affordablePrice, hasIncome } = useIncome();
  const [animIn, setAnimIn] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [tooltip, setTooltip] = useState<CountyTooltipData | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Filters (active state only)
  const [regionFilter, setRegionFilter] = useState("All");
  const [minPopulation, setMinPopulation] = useState(0);
  const [filterGrowing, setFilterGrowing] = useState(false);
  const [filterLowUnemployment, setFilterLowUnemployment] = useState(false);

  // Whether the user dismissed the entry overlay without entering income
  const [skippedEntry, setSkippedEntry] = useState(false);

  // No-income fallback controls
  const [mapMetric, setMapMetric] = useState("ratio");
  const [incomeRange, setIncomeRange] = useState<[number, number]>([20, 160]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Sync income input field with context
  useEffect(() => {
    if (income) {
      setIncomeInput(income.toLocaleString());
    }
  }, [income]);

  // ─── COMPUTED VALUES ─────────────────────────────────────────────

  const budgetStats = useMemo(() => {
    if (!affordablePrice) return null;

    const withinBudget = STATES_DATA.filter(
      (s) => s.value <= affordablePrice
    ).length;

    const stretchBudget = STATES_DATA.filter(
      (s) => s.value > affordablePrice && s.value <= affordablePrice * 1.3
    ).length;

    const statesWithAffordable = new Set(
      STATES_DATA.filter((s) => s.value <= affordablePrice).map((s) => s.abbr)
    );

    return {
      withinBudget,
      stretchBudget,
      affordableStates: statesWithAffordable.size,
    };
  }, [affordablePrice]);

  // ─── HANDLERS ────────────────────────────────────────────────────

  function handleIncomeSubmit() {
    const cleaned = incomeInput.replace(/[^0-9]/g, "");
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setIncome(parsed);
      setIsEditing(false);
    }
  }

  function handleSkip() {
    setSkippedEntry(true);
  }

  function handleIncomeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleIncomeSubmit();
  }

  function formatIncomeInput(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return "";
    return parseInt(digits, 10).toLocaleString();
  }

  // ─── MAP CALLBACKS ─────────────────────────────────────────────

  const handleCountyHover = useCallback((data: CountyTooltipData | null) => {
    setTooltip(data);
  }, []);

  const handleCountyClick = useCallback(
    (fips: string) => {
      router.push(`/area/${fips}`);
    },
    [router]
  );

  function getBudgetStatusForCounty(value: number) {
    if (!affordablePrice) return null;
    const priceRatio = value / affordablePrice;
    if (priceRatio <= 1.0)
      return { label: "Within budget", icon: "\u2713", color: "#059669", bg: "#ecfdf5" };
    if (priceRatio <= 1.3)
      return { label: "Stretch", icon: "\u26a0", color: "#d97706", bg: "#fffbeb" };
    return { label: "Out of reach", icon: "\u2717", color: "#dc2626", bg: "#fef2f2" };
  }

  // ─── RENDER ──────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        color: "#0f172a",
      }}
    >
      <Navigation />

      <div
        style={{
          opacity: animIn ? 1 : 0,
          transform: animIn ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            minHeight: "calc(100vh - 65px)",
          }}
        >
          {/* ──────────────────── SIDEBAR ──────────────────── */}
          <div
            style={{
              padding: "24px 20px",
              borderRight: "1px solid #e2e8f0",
              background: "#ffffff",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {hasIncome && affordablePrice && budgetStats ? (
              /* ── PERSONALIZED SIDEBAR ── */
              <>
                {/* Income Display */}
                <div style={cardStyle}>
                  <div style={sheenStyle} />
                  <div style={sectionTitleStyle}>Your Income</div>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={incomeInput}
                        onChange={(e) =>
                          setIncomeInput(formatIncomeInput(e.target.value))
                        }
                        onKeyDown={handleIncomeKeyDown}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1px solid #3b82f6",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 18,
                          fontWeight: 500,
                          color: "#0f172a",
                          outline: "none",
                          background: "#f8fafc",
                        }}
                      />
                      <button
                        onClick={handleIncomeSubmit}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: "none",
                          background:
                            "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                          color: "#ffffff",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 26,
                          fontWeight: 500,
                          color: "#0f172a",
                        }}
                      >
                        {formatCurrency(income)}
                      </div>
                      <button
                        onClick={() => setIsEditing(true)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Budget Card */}
                <div
                  style={{
                    ...cardStyle,
                    background:
                      "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  <div style={sheenStyle} />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#059669",
                      marginBottom: 8,
                    }}
                  >
                    Your Budget
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: "#065f46" }}>
                      You can comfortably afford a home up to
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 32,
                      fontWeight: 500,
                      color: "#059669",
                      marginBottom: 8,
                    }}
                  >
                    {formatCurrency(affordablePrice)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      fontStyle: "italic",
                      marginBottom: 12,
                    }}
                  >
                    Based on the 3x income guideline
                  </div>
                  
                  {/* Estimated Costs */}
                  <div
                    style={{
                      borderTop: "1px solid #d1fae5",
                      paddingTop: 12,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#6b7280",
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        Down Payment (20%)
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#059669",
                        }}
                      >
                        {formatCurrency(calculateDownPayment(affordablePrice) || 0)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#6b7280",
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        Monthly Payment
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#059669",
                        }}
                      >
                        {formatCurrency(calculateMonthlyPayment(affordablePrice) || 0)}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#94a3b8",
                      marginTop: 8,
                      fontStyle: "italic",
                    }}
                  >
                    Assumes 7% interest, 30-year mortgage
                  </div>
                </div>

                {/* Legend */}
                <div style={cardStyle}>
                  <div style={sheenStyle} />
                  <div style={sectionTitleStyle}>Legend</div>
                  {[
                    {
                      color: "#059669",
                      label: "Within your budget",
                      detail: `Under ${formatCurrency(affordablePrice)}`,
                    },
                    {
                      color: "#fbbf24",
                      label: "Stretch",
                      detail: `${formatCurrency(affordablePrice)} - ${formatCurrency(Math.round(affordablePrice * 1.3))}`,
                    },
                    {
                      color: "#dc2626",
                      label: "Out of reach",
                      detail: `Over ${formatCurrency(Math.round(affordablePrice * 1.3))}`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          background: item.color,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {item.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div style={cardStyle}>
                  <div style={sheenStyle} />
                  <div style={sectionTitleStyle}>Quick Stats</div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        padding: "14px 12px",
                        borderRadius: 12,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 28,
                          fontWeight: 500,
                          color: "#059669",
                        }}
                      >
                        {budgetStats.withinBudget}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 2,
                        }}
                      >
                        states within budget
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "14px 12px",
                        borderRadius: 12,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 28,
                          fontWeight: 500,
                          color: "#3b82f6",
                        }}
                      >
                        {budgetStats.affordableStates}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 2,
                        }}
                      >
                        states with affordable areas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Picks */}
                <div style={cardStyle}>
                  <div style={sheenStyle} />
                  <div style={sectionTitleStyle}>Top Picks</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      marginBottom: 14,
                      marginTop: -4,
                    }}
                  >
                    Affordable counties with strong livability
                  </div>
                  {TOP_PICKS.map((pick, i) => (
                    <div
                      key={pick.county}
                      style={{
                        padding: "14px 12px",
                        borderRadius: 12,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        marginBottom: i < TOP_PICKS.length - 1 ? 8 : 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            {pick.county}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 2,
                            }}
                          >
                            {pick.state}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "#ecfdf5",
                            color: "#059669",
                            fontSize: 10,
                            fontWeight: 600,
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {pick.growth}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "4px 12px",
                          fontSize: 11,
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Home Value</span>
                        <span
                          style={{ color: "#0f172a", textAlign: "right" }}
                        >
                          {formatCurrency(pick.medianHomeValue)}
                        </span>
                        <span style={{ color: "#94a3b8" }}>Unemployment</span>
                        <span
                          style={{ color: "#0f172a", textAlign: "right" }}
                        >
                          {pick.unemployment}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div style={cardStyle}>
                  <div style={sheenStyle} />
                  <div style={sectionTitleStyle}>Filters</div>

                  {/* Region */}
                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Region
                    </label>
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: "#0f172a",
                        background: "#ffffff",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="All">All Regions</option>
                      <option value="West">West</option>
                      <option value="Northeast">Northeast</option>
                      <option value="South">South</option>
                      <option value="Midwest">Midwest</option>
                    </select>
                  </div>

                  {/* Min Population */}
                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Min Population
                    </label>
                    <select
                      value={minPopulation}
                      onChange={(e) =>
                        setMinPopulation(parseInt(e.target.value, 10))
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: "#0f172a",
                        background: "#ffffff",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value={0}>No minimum</option>
                      <option value={50000}>50,000+</option>
                      <option value={100000}>100,000+</option>
                      <option value={250000}>250,000+</option>
                      <option value={500000}>500,000+</option>
                    </select>
                  </div>

                  {/* Checkboxes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filterGrowing}
                        onChange={(e) => setFilterGrowing(e.target.checked)}
                        style={{ accentColor: "#3b82f6" }}
                      />
                      Growing population
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filterLowUnemployment}
                        onChange={(e) =>
                          setFilterLowUnemployment(e.target.checked)
                        }
                        style={{ accentColor: "#3b82f6" }}
                      />
                      Below-average unemployment
                    </label>
                  </div>
                </div>

                {/* Clear Income */}
                <button
                  onClick={() => {
                    setIncome(null);
                    setIncomeInput("");
                    setIsEditing(false);
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#94a3b8",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  Clear income and explore all data
                </button>
              </>
            ) : (
              /* ── NON-PERSONALIZED SIDEBAR (MapControls pattern) ── */
              <>
                {/* Metric Selector */}
                <div style={cardStyle}>
                  <div style={sheenStyle} />
                  <div style={sectionTitleStyle}>Metric</div>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: 12,
                      marginBottom: 12,
                      marginTop: -4,
                    }}
                  >
                    Select what the map displays
                  </div>
                  {[
                    {
                      key: "ratio",
                      label: "Affordability Ratio",
                      desc: "Home Value / Income",
                    },
                    {
                      key: "value",
                      label: "Median Home Value",
                      desc: "Dollar amount",
                    },
                    {
                      key: "income",
                      label: "Median Income",
                      desc: "Household annual",
                    },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMapMetric(m.key)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 10,
                        border:
                          mapMetric === m.key
                            ? "1px solid #3b82f6"
                            : "1px solid #e2e8f0",
                        background:
                          mapMetric === m.key ? "#3b82f620" : "transparent",
                        cursor: "pointer",
                        marginBottom: 6,
                        transition: "all 0.2s",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            mapMetric === m.key ? "#2563eb" : "#0f172a",
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 2,
                        }}
                      >
                        {m.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Income Filter */}
                <div style={cardStyle}>
                  <div style={sheenStyle} />
                  <div style={sectionTitleStyle}>Income Filter</div>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: 12,
                      marginBottom: 16,
                      marginTop: -4,
                    }}
                  >
                    Filter by median household income range
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 20,
                      fontWeight: 500,
                      color: "#0f172a",
                      marginBottom: 12,
                    }}
                  >
                    ${incomeRange[0]}K - ${incomeRange[1]}K
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Minimum
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={150}
                      value={incomeRange[0]}
                      onChange={(e) =>
                        setIncomeRange([
                          +e.target.value,
                          Math.max(+e.target.value + 10, incomeRange[1]),
                        ])
                      }
                      style={{ width: "100%", accentColor: "#3b82f6" }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Maximum
                    </label>
                    <input
                      type="range"
                      min={20}
                      max={200}
                      value={incomeRange[1]}
                      onChange={(e) =>
                        setIncomeRange([
                          Math.min(incomeRange[0], +e.target.value - 10),
                          +e.target.value,
                        ])
                      }
                      style={{ width: "100%", accentColor: "#3b82f6" }}
                    />
                  </div>
                </div>

                {/* Legend */}
                <div style={cardStyle}>
                  <div style={sheenStyle} />
                  <div style={sectionTitleStyle}>Legend</div>
                  <div style={{ marginTop: 4 }}>
                    <div
                      style={{
                        height: 12,
                        borderRadius: 6,
                        background:
                          mapMetric === "income"
                            ? "linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #93c5fd 100%)"
                            : "linear-gradient(90deg, #059669 0%, #10b981 25%, #fbbf24 50%, #f97316 75%, #ef4444 100%)",
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "#94a3b8",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {mapMetric === "ratio" ? (
                        <>
                          <span>Affordable (2x)</span>
                          <span>Moderate</span>
                          <span>Severe (8x+)</span>
                        </>
                      ) : mapMetric === "value" ? (
                        <>
                          <span>$100K</span>
                          <span>$300K</span>
                          <span>$500K+</span>
                        </>
                      ) : (
                        <>
                          <span>$30K</span>
                          <span>$65K</span>
                          <span>$100K+</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personalize CTA */}
                <div
                  style={{
                    ...cardStyle,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#2563eb",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Personalize this map
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#1e40af",
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    Enter your household income to see which states are within
                    your budget, a stretch, or out of reach.
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "none",
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                      color: "#ffffff",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Enter my income
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ──────────────────── MAP AREA ──────────────────── */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              background: "#f8fafc",
            }}
          >
            {/* Map Header */}
            <div
              style={{
                padding: "16px 28px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#ffffff",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "#0f172a",
                  }}
                >
                  {hasIncome
                    ? "Your Affordability Map"
                    : mapMetric === "ratio"
                      ? "Affordability Ratio by County"
                      : mapMetric === "value"
                        ? "Median Home Value by County"
                        : "Median Household Income by County"}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {hasIncome
                    ? `Personalized for ${formatCurrency(income)} household income · Click a county for details`
                    : "Hover over counties for details · Click to view area profile"}
                </div>
              </div>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "#f1f5f9",
                  fontSize: 11,
                  color: "#94a3b8",
                  fontFamily: "'DM Mono', monospace",
                  border: "1px solid #e2e8f0",
                }}
              >
                3,222 counties
              </div>
            </div>

            {/* Mapbox GL Map */}
            <div
              ref={mapContainerRef}
              style={{
                flex: 1,
                position: "relative",
                minHeight: 500,
              }}
            >
              <MapboxChoropleth
                hasIncome={hasIncome}
                income={income}
                affordablePrice={affordablePrice}
                mapMetric={mapMetric}
                incomeRange={incomeRange}
                onCountyHover={handleCountyHover}
                onCountyClick={handleCountyClick}
              />
            </div>

            {/* ──────── ENTRY OVERLAY (no income) ──────── */}
            {!hasIncome && !isEditing && !skippedEntry && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(248, 250, 252, 0.85)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    ...cardStyle,
                    maxWidth: 440,
                    width: "100%",
                    padding: 40,
                    textAlign: "center",
                    boxShadow:
                      "0 25px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={sheenStyle} />
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      fontSize: 24,
                    }}
                  >
                    <span role="img" aria-label="house">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </span>
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: "#0f172a",
                      marginBottom: 8,
                      lineHeight: 1.2,
                    }}
                  >
                    Where can you afford to live?
                  </h2>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#64748b",
                      lineHeight: 1.6,
                      marginBottom: 28,
                      maxWidth: 340,
                      marginLeft: "auto",
                      marginRight: "auto",
                    }}
                  >
                    Enter your household income and we&apos;ll show you
                    which areas are within reach.
                  </p>
                  <div style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        display: "block",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: 8,
                      }}
                    >
                      Annual household income
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        padding: "0 16px",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 18,
                          color: "#94a3b8",
                          fontWeight: 500,
                        }}
                      >
                        $
                      </span>
                      <input
                        type="text"
                        value={incomeInput}
                        onChange={(e) =>
                          setIncomeInput(
                            formatIncomeInput(e.target.value)
                          )
                        }
                        onKeyDown={handleIncomeKeyDown}
                        placeholder="75,000"
                        style={{
                          flex: 1,
                          padding: "14px 8px",
                          border: "none",
                          background: "transparent",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 18,
                          fontWeight: 500,
                          color: "#0f172a",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleIncomeSubmit}
                    style={{
                      width: "100%",
                      padding: "14px 24px",
                      borderRadius: 12,
                      border: "none",
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                      color: "#ffffff",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: 12,
                      letterSpacing: "0.01em",
                      boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                  >
                    Show me the map &rarr;
                  </button>
                  <div
                    style={{
                      marginTop: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: "#e2e8f0",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      or skip and explore all data
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: "#e2e8f0",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSkip}
                    style={{
                      marginTop: 12,
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: "transparent",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    Explore without income
                  </button>
                </div>
              </div>
            )}

            {/* ──────── INLINE EDIT OVERLAY (editing from sidebar CTA) ──────── */}
            {!hasIncome && isEditing && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(248, 250, 252, 0.85)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    ...cardStyle,
                    maxWidth: 400,
                    width: "100%",
                    padding: 36,
                    textAlign: "center",
                    boxShadow:
                      "0 25px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={sheenStyle} />
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: 16,
                    }}
                  >
                    Enter your income
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      padding: "0 16px",
                      borderRadius: 12,
                      border: "1px solid #3b82f6",
                      background: "#f8fafc",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 18,
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      $
                    </span>
                    <input
                      type="text"
                      value={incomeInput}
                      onChange={(e) =>
                        setIncomeInput(
                          formatIncomeInput(e.target.value)
                        )
                      }
                      onKeyDown={handleIncomeKeyDown}
                      placeholder="75,000"
                      autoFocus
                      style={{
                        flex: 1,
                        padding: "14px 8px",
                        border: "none",
                        background: "transparent",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 18,
                        fontWeight: 500,
                        color: "#0f172a",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleIncomeSubmit}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "none",
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                        color: "#ffffff",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Show my map
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──────── COUNTY TOOLTIP ──────── */}
      {tooltip && tooltip.ratio && mapContainerRef.current && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + (mapContainerRef.current.getBoundingClientRect?.().left || 320),
            top: tooltip.y + (mapContainerRef.current.getBoundingClientRect?.().top || 65),
            transform: "translate(-50%, calc(-100% - 12px))",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "14px 18px",
            pointerEvents: "none",
            zIndex: 1000,
            minWidth: 260,
            boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
          }}
        >
          {/* County name */}
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 2,
            }}
          >
            {tooltip.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              marginBottom: 10,
            }}
          >
            {tooltip.state}{tooltip.population ? ` · Pop. ${tooltip.population.toLocaleString()}` : ""}
          </div>

          {hasIncome && affordablePrice ? (
            /* ── PERSONALIZED TOOLTIP ── */
            <>
              {/* Budget status badge */}
              {(() => {
                const status = getBudgetStatusForCounty(tooltip.value);
                if (!status) return null;
                return (
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: status.bg,
                      color: status.color,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "'DM Mono', monospace",
                      marginBottom: 10,
                    }}
                  >
                    {status.icon} {status.label}
                  </div>
                );
              })()}

              {/* Details grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 16px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#94a3b8" }}>Typical Home</span>
                <span style={{ color: "#0f172a", textAlign: "right" }}>
                  {formatCurrency(tooltip.value)}
                </span>
                <span style={{ color: "#94a3b8" }}>Your Budget</span>
                <span
                  style={{
                    color: "#059669",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(affordablePrice)}
                </span>
                <span style={{ color: "#94a3b8" }}>Gap</span>
                <span
                  style={{
                    textAlign: "right",
                    fontWeight: 600,
                    color:
                      tooltip.value <= affordablePrice
                        ? "#059669"
                        : "#dc2626",
                  }}
                >
                  {gapText(affordabilityGap(tooltip.value, income))}
                </span>
                <span style={{ color: "#94a3b8" }}>Local Income</span>
                <span style={{ color: "#0f172a", textAlign: "right" }}>
                  {formatCurrency(tooltip.income)}
                </span>
                {tooltip.unemployment != null && (
                  <>
                    <span style={{ color: "#94a3b8" }}>Unemployment</span>
                    <span style={{ color: "#0f172a", textAlign: "right" }}>
                      {tooltip.unemployment}%
                    </span>
                  </>
                )}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                Click to view full area profile
              </div>
            </>
          ) : (
            /* ── STANDARD TOOLTIP ── */
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 16px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#94a3b8" }}>Income</span>
                <span style={{ color: "#0f172a", textAlign: "right" }}>
                  {formatCurrency(tooltip.income)}
                </span>
                <span style={{ color: "#94a3b8" }}>Home Value</span>
                <span style={{ color: "#0f172a", textAlign: "right" }}>
                  {formatCurrency(tooltip.value)}
                </span>
                <span style={{ color: "#94a3b8" }}>Ratio</span>
                <span
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color: ratioColor(tooltip.ratio),
                  }}
                >
                  {tooltip.ratio.toFixed(1)}x
                </span>
                {tooltip.unemployment != null && (
                  <>
                    <span style={{ color: "#94a3b8" }}>Unemployment</span>
                    <span style={{ color: "#0f172a", textAlign: "right" }}>
                      {tooltip.unemployment}%
                    </span>
                  </>
                )}
              </div>
              <div
                style={{
                  marginTop: 8,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: ratioColor(tooltip.ratio) + "20",
                  color: ratioColor(tooltip.ratio),
                  fontSize: 11,
                  fontWeight: 600,
                  textAlign: "center",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {affordabilityStatus(tooltip.ratio).label}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                Click to view full area profile
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
