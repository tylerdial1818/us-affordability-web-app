"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
import Footer from "@/components/shared/Footer";
import ExplainedMetric from "@/components/shared/ExplainedMetric";
import { useIncome } from "@/components/shared/IncomeContext";
import {
  generateAffordabilityTrend,
  STATES_DATA,
  COST_BURDEN_DATA,
  US_STATES_SVG,
  KPI_SUMMARY,
} from "@/lib/data";
import { ratioColor, ratioLabel } from "@/lib/calculations";
import { formatCurrency, formatPct } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── CONSTANTS ──────────────────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
  background: "#ffffff",
  boxShadow:
    "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 24,
  position: "relative",
  overflow: "hidden",
};

const CARD_SHEEN: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 3,
  background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)",
  borderRadius: "16px 16px 0 0",
};

const HEADING_FONT = "'Plus Jakarta Sans', sans-serif";
const BODY_FONT = "'DM Sans', sans-serif";
const MONO_FONT = "'DM Mono', monospace";

// ─── INCOME INPUT COMPONENT ─────────────────────────────────────
function IncomeInput({
  onSubmit,
  size = "large",
}: {
  onSubmit: (value: number) => void;
  size?: "large" | "small";
}) {
  const [rawValue, setRawValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const formatInputValue = useCallback((val: string) => {
    const digits = val.replace(/[^0-9]/g, "");
    if (!digits) return "";
    return "$" + parseInt(digits, 10).toLocaleString();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputValue(e.target.value);
    setRawValue(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = rawValue.replace(/[^0-9]/g, "");
    const parsed = parseInt(digits, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onSubmit(parsed);
    }
  };

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <label
        style={{
          display: "block",
          fontFamily: BODY_FONT,
          fontSize: isLarge ? 16 : 14,
          fontWeight: 600,
          color: "#0f172a",
          marginBottom: 8,
        }}
      >
        What&#39;s your household income?
      </label>
      <div
        style={{
          display: "flex",
          gap: 12,
          maxWidth: isLarge ? 520 : 440,
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          value={rawValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="$75,000"
          style={{
            flex: 1,
            padding: isLarge ? "14px 18px" : "10px 14px",
            borderRadius: 10,
            border: `2px solid ${isFocused ? "#3b82f6" : "#e2e8f0"}`,
            outline: "none",
            fontSize: isLarge ? 18 : 15,
            fontFamily: MONO_FONT,
            fontWeight: 500,
            color: "#0f172a",
            background: "#ffffff",
            transition: "border-color 0.2s",
          }}
        />
        <button
          type="submit"
          style={{
            padding: isLarge ? "14px 24px" : "10px 18px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            color: "#ffffff",
            fontFamily: BODY_FONT,
            fontSize: isLarge ? 15 : 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
          }}
        >
          Show me where I can afford to live &rarr;
        </button>
      </div>
    </form>
  );
}

// ─── SECTION HEADING COMPONENT ──────────────────────────────────
function SectionHeading({
  number,
  question,
}: {
  number: number;
  question: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <span
        style={{
          fontFamily: MONO_FONT,
          fontSize: 12,
          fontWeight: 500,
          color: "#94a3b8",
          letterSpacing: "0.04em",
          display: "block",
          marginBottom: 4,
        }}
      >
        SECTION {number}
      </span>
      <h2
        style={{
          fontFamily: HEADING_FONT,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "#0f172a",
          lineHeight: 1.3,
          margin: 0,
        }}
      >
        {question}
      </h2>
    </div>
  );
}

// ─── KPI DATA ───────────────────────────────────────────────────
const fmtCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const KPI_CARDS = [
  {
    label: "Typical Home Price",
    value: fmtCurrency.format(KPI_SUMMARY.nationalMedianHomeValue),
    change: "+4.2%",
    changeUp: true,
    subtitle: "The median value of a US home",
    term: "Median Home Value",
    accentColor: "#3b82f6",
  },
  {
    label: "Typical Household Income",
    value: fmtCurrency.format(KPI_SUMMARY.nationalMedianIncome),
    change: "+3.1%",
    changeUp: true,
    subtitle: "Half of US households earn more, half less",
    term: "Median Household Income",
    accentColor: "#10b981",
  },
  {
    label: "Affordability Ratio",
    value: `${KPI_SUMMARY.nationalRatio}x`,
    change: "+0.2x",
    changeUp: true,
    subtitle: `Home prices are ${KPI_SUMMARY.nationalRatio} years of income \u2014 above the recommended 3x`,
    term: "Affordability Ratio",
    accentColor: "#f59e0b",
  },
  {
    label: "Cost-Burdened Households",
    value: `${KPI_SUMMARY.avgCostBurdenedRenters}%`,
    change: "+1.4pp",
    changeUp: true,
    subtitle:
      "Nearly 1 in 3 households spend over 30% of income on housing",
    term: "Cost-Burdened",
    accentColor: "#ef4444",
  },
];

// ─── TOP/BOTTOM STATES DATA ─────────────────────────────────────
const MOST_AFFORDABLE_STATES = [
  {
    name: "West Virginia",
    ratio: 1.9,
    unemployment: "5.2%",
    popTrend: "declining",
  },
  {
    name: "Mississippi",
    ratio: 2.0,
    unemployment: "5.4%",
    popTrend: "declining",
  },
  {
    name: "Arkansas",
    ratio: 2.1,
    unemployment: "3.5%",
    popTrend: "stable",
  },
];

const LEAST_AFFORDABLE_STATES = [
  {
    name: "Hawaii",
    ratio: 8.9,
    unemployment: "3.1%",
    popTrend: "stable",
  },
  {
    name: "California",
    ratio: 8.2,
    unemployment: "4.8%",
    popTrend: "declining",
  },
  {
    name: "Massachusetts",
    ratio: 6.4,
    unemployment: "3.0%",
    popTrend: "growing",
  },
];

// ─── CUSTOM TOOLTIP ─────────────────────────────────────────────
function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        fontFamily: BODY_FONT,
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO_FONT, color: "#3b82f6", fontWeight: 600 }}>
        {payload[0].value.toFixed(2)}x
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        fontFamily: BODY_FONT,
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>
        {payload[0].name}
      </div>
      <div style={{ fontFamily: MONO_FONT, fontWeight: 600, color: payload[0].payload.color }}>
        {payload[0].value}%
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────
export default function OverviewPage() {
  const [animIn, setAnimIn] = useState(false);
  const router = useRouter();
  const { setIncome } = useIncome();

  useEffect(() => {
    const timer = setTimeout(() => setAnimIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const affordabilityTrend = useMemo(() => generateAffordabilityTrend(), []);

  // Sample every 6 months for a cleaner chart (10 years = ~20 points)
  const chartData = useMemo(() => {
    return affordabilityTrend.filter((_, i) => i % 6 === 0 || i === affordabilityTrend.length - 1);
  }, [affordabilityTrend]);

  // Find the COVID reference point (around index 48 = March 2020)
  const covidIdx = useMemo(() => {
    const covidPoint = chartData.find((d) => d.idx >= 48);
    return covidPoint ? covidPoint.month : chartData[8]?.month;
  }, [chartData]);

  const handleIncomeSubmit = (value: number) => {
    setIncome(value);
    router.push("/explore?income=" + value);
  };

  // State map: build a lookup for coloring
  const stateRatioMap = useMemo(() => {
    const map: Record<string, number> = {};
    STATES_DATA.forEach((s) => {
      map[s.abbr] = s.ratio;
    });
    return map;
  }, []);

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: BODY_FONT,
        color: "#0f172a",
      }}
    >
      <Navigation />

      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 32px 60px",
          opacity: animIn ? 1 : 0,
          transform: animIn ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ═══════════ HERO SECTION ═══════════ */}
        <section
          style={{
            padding: "64px 0 48px",
            textAlign: "center",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontFamily: HEADING_FONT,
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              color: "#0f172a",
              marginBottom: 16,
            }}
          >
            The typical American home costs{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {KPI_SUMMARY.nationalRatio}x
            </span>{" "}
            the median household income
          </h1>
          <p
            style={{
              fontFamily: BODY_FONT,
              fontSize: 18,
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 40,
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            That&#39;s above the{" "}
            <ExplainedMetric term="3x Income Rule">
              <strong style={{ color: "#0f172a" }}>3x threshold</strong>
            </ExplainedMetric>{" "}
            most financial advisors recommend. See how your area compares.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ width: "100%", maxWidth: 520 }}>
              <IncomeInput onSubmit={handleIncomeSubmit} size="large" />
            </div>
          </div>

          <p
            style={{
              fontFamily: BODY_FONT,
              fontSize: 14,
              color: "#94a3b8",
              marginTop: 16,
            }}
          >
            or explore the national data below{" "}
            <span style={{ fontSize: 12 }}>&darr;</span>
          </p>
        </section>

        {/* ═══════════ SECTION 1: NATIONAL SNAPSHOT ═══════════ */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeading number={1} question="National Snapshot" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            {KPI_CARDS.map((card) => (
              <div key={card.label} style={CARD_STYLE}>
                <div style={CARD_SHEEN} />

                {/* Label */}
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#94a3b8",
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  <ExplainedMetric term={card.term}>
                    {card.label}
                  </ExplainedMetric>
                </div>

                {/* Value */}
                <div
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: 1.1,
                    marginBottom: 6,
                  }}
                >
                  {card.value}
                </div>

                {/* YoY change */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: card.changeUp
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(16,185,129,0.08)",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 12,
                      fontWeight: 600,
                      color: card.changeUp ? "#ef4444" : "#10b981",
                    }}
                  >
                    {card.changeUp ? "\u2191" : "\u2193"} {card.change} YoY
                  </span>
                </div>

                {/* Subtitle */}
                <p
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: "#64748b",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {card.subtitle}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ SECTION 2: AFFORDABILITY TREND ═══════════ */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeading
            number={2}
            question="Is housing getting more or less affordable?"
          />

          <div style={CARD_STYLE}>
            <div style={CARD_SHEEN} />

            {/* Takeaway */}
            <p
              style={{
                fontFamily: BODY_FONT,
                fontSize: 15,
                color: "#475569",
                lineHeight: 1.6,
                marginBottom: 24,
                marginTop: 4,
              }}
            >
              Housing affordability has worsened significantly since 2020.
              The ratio crossed the 3x &ldquo;affordable&rdquo; threshold around 2018
              and surged during the pandemic-era housing boom, where it remains today.
            </p>

            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: 20,
                marginBottom: 16,
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: "rgba(16,185,129,0.15)",
                    border: "2px solid #10b981",
                  }}
                />
                <span
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  Affordable zone (&le;3x)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 3,
                    borderRadius: 2,
                    background: "#3b82f6",
                  }}
                />
                <span
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  Affordability ratio
                </span>
              </div>
            </div>

            {/* Chart */}
            <div style={{ width: "100%", height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fontFamily: MONO_FONT,
                      fill: "#94a3b8",
                    }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    domain={[2, "auto"]}
                    tick={{
                      fontSize: 11,
                      fontFamily: MONO_FONT,
                      fill: "#94a3b8",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v.toFixed(1) + "x"}
                    width={50}
                  />
                  <Tooltip content={<TrendTooltip />} />

                  {/* Affordable zone band */}
                  <ReferenceArea
                    y1={2}
                    y2={3}
                    fill="#10b981"
                    fillOpacity={0.06}
                    stroke="none"
                  />

                  {/* 3x threshold line */}
                  <ReferenceLine
                    y={3}
                    stroke="#10b981"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{
                      value: "3x Affordable Threshold",
                      position: "insideTopLeft",
                      style: {
                        fontSize: 11,
                        fontFamily: MONO_FONT,
                        fill: "#10b981",
                        fontWeight: 600,
                      },
                    }}
                  />

                  {/* COVID marker */}
                  <ReferenceLine
                    x={covidIdx}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: "COVID-19",
                      position: "top",
                      style: {
                        fontSize: 10,
                        fontFamily: MONO_FONT,
                        fill: "#94a3b8",
                        fontWeight: 500,
                      },
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="ratio"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#ratioGrad)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#3b82f6",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ═══════════ SECTION 3: STATE MAP + TOP/BOTTOM 3 ═══════════ */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeading
            number={3}
            question="Where is housing most and least affordable?"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {/* Mini US Map */}
            <div style={CARD_STYLE}>
              <div style={CARD_SHEEN} />
              <h3
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 4,
                  marginTop: 0,
                }}
              >
                Affordability by State
              </h3>
              <p
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  color: "#94a3b8",
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                Home price to income ratio
              </p>

              <svg
                viewBox="40 0 280 160"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 260,
                }}
              >
                {Object.entries(US_STATES_SVG).map(([abbr, { d }]) => {
                  const ratio = stateRatioMap[abbr];
                  const fillColor = ratio
                    ? ratioColor(ratio)
                    : "#e2e8f0";
                  return (
                    <path
                      key={abbr}
                      d={d}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      style={{
                        transition: "opacity 0.2s",
                        cursor: "default",
                      }}
                    >
                      <title>
                        {abbr}: {ratio ? ratio.toFixed(1) + "x" : "N/A"}
                      </title>
                    </path>
                  );
                })}
              </svg>

              {/* Color legend */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { color: "#059669", label: "<3x" },
                  { color: "#34d399", label: "3-4x" },
                  { color: "#fbbf24", label: "4-5x" },
                  { color: "#f97316", label: "5-6x" },
                  { color: "#ef4444", label: "6-7x" },
                  { color: "#dc2626", label: "7x+" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: item.color,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 10,
                        color: "#94a3b8",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top / Bottom 3 States */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Most Affordable */}
              <div style={{ ...CARD_STYLE, flex: 1 }}>
                <div style={CARD_SHEEN} />
                <h3
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#059669",
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  Most Affordable States
                </h3>

                {MOST_AFFORDABLE_STATES.map((state, i) => (
                  <div
                    key={state.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom:
                        i < MOST_AFFORDABLE_STATES.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: BODY_FONT,
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {state.name}
                      </div>
                      <div
                        style={{
                          fontFamily: BODY_FONT,
                          fontSize: 11,
                          color: "#94a3b8",
                          marginTop: 2,
                        }}
                      >
                        Unemployment: {state.unemployment} &middot; Population:{" "}
                        {state.popTrend}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#059669",
                      }}
                    >
                      {state.ratio.toFixed(1)}x
                    </div>
                  </div>
                ))}
              </div>

              {/* Least Affordable */}
              <div style={{ ...CARD_STYLE, flex: 1 }}>
                <div style={CARD_SHEEN} />
                <h3
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#dc2626",
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  Least Affordable States
                </h3>

                {LEAST_AFFORDABLE_STATES.map((state, i) => (
                  <div
                    key={state.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom:
                        i < LEAST_AFFORDABLE_STATES.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: BODY_FONT,
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {state.name}
                      </div>
                      <div
                        style={{
                          fontFamily: BODY_FONT,
                          fontSize: 11,
                          color: "#94a3b8",
                          marginTop: 2,
                        }}
                      >
                        Unemployment: {state.unemployment} &middot; Population:{" "}
                        {state.popTrend}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#dc2626",
                      }}
                    >
                      {state.ratio.toFixed(1)}x
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ SECTION 4: COST BURDEN DONUT ═══════════ */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeading
            number={4}
            question="How many Americans struggle to afford housing?"
          />

          <div style={CARD_STYLE}>
            <div style={CARD_SHEEN} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 32,
                alignItems: "center",
              }}
            >
              {/* Left: Donut chart */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div style={{ width: 260, height: 260, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={COST_BURDEN_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {COST_BURDEN_DATA.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#0f172a",
                        lineHeight: 1,
                      }}
                    >
                      31%
                    </div>
                    <div
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 11,
                        color: "#94a3b8",
                        marginTop: 2,
                      }}
                    >
                      burdened
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Explanation */}
              <div>
                <div style={{ marginBottom: 20 }}>
                  <ExplainedMetric term="Cost-Burdened">
                    <span
                      style={{
                        fontFamily: HEADING_FONT,
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      What does &ldquo;cost-burdened&rdquo; mean?
                    </span>
                  </ExplainedMetric>
                  <p
                    style={{
                      fontFamily: BODY_FONT,
                      fontSize: 14,
                      color: "#475569",
                      lineHeight: 1.7,
                      marginTop: 8,
                      marginBottom: 0,
                    }}
                  >
                    A household is <strong>cost-burdened</strong> when it spends
                    more than 30% of its gross income on housing costs. This is
                    the threshold used by the U.S. Department of Housing and
                    Urban Development (HUD) to identify financial strain.
                  </p>
                </div>

                {/* Breakdown */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  {COST_BURDEN_DATA.map((segment) => (
                    <div
                      key={segment.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: segment.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: BODY_FONT,
                          fontSize: 13,
                          color: "#475569",
                          flex: 1,
                        }}
                      >
                        {segment.name}
                      </span>
                      <span
                        style={{
                          fontFamily: MONO_FONT,
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {segment.value}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Absolute number callout */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                  }}
                >
                  <p
                    style={{
                      fontFamily: BODY_FONT,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#991b1b",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    That&#39;s approximately{" "}
                    <span style={{ fontFamily: MONO_FONT }}>40 million</span>{" "}
                    households.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ SECTION 5: CTA FOOTER ═══════════ */}
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              ...CARD_STYLE,
              textAlign: "center",
              padding: "48px 40px",
              background:
                "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)",
            }}
          >
            <div style={CARD_SHEEN} />

            <h2
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#0f172a",
                marginBottom: 8,
                marginTop: 0,
              }}
            >
              Where can you afford to live?
            </h2>
            <p
              style={{
                fontFamily: BODY_FONT,
                fontSize: 15,
                color: "#64748b",
                marginBottom: 32,
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Enter your income to see a personalized map of affordable areas
              across the United States.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div style={{ width: "100%", maxWidth: 480 }}>
                <IncomeInput onSubmit={handleIncomeSubmit} size="small" />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <a
                href="/research"
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#3b82f6",
                  textDecoration: "none",
                  borderBottom: "1px solid transparent",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderBottomColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderBottomColor =
                    "transparent";
                }}
              >
                Or dive into the full research data &rarr;
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
