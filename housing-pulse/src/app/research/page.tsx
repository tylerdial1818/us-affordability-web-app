"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import Navigation from "@/components/shared/Navigation";
import Footer from "@/components/shared/Footer";
import BedroomCalculator from "@/components/insights/BedroomCalculator";
import RentAffordabilityExplorer from "@/components/insights/RentAffordabilityExplorer";
import {
  STATES_DATA,
  getScatterData,
  TOP_AFFORDABLE,
  LEAST_AFFORDABLE,
  generateNationalTrend,
  generateAffordabilityTrend,
} from "@/lib/data";
import { ratioColor } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { REGION_COLORS } from "@/lib/constants";

// ─── SHARED STYLES ──────────────────────────────────────────────

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
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 4,
  color: "#0f172a",
};

// ─── FORMATTERS ─────────────────────────────────────────────────

const fmt = (n: number) =>
  "$" +
  (n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1000
      ? Math.round(n).toLocaleString()
      : String(n));

const fmtK = (n: number) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1000
      ? Math.round(n / 1000) + "K"
      : String(n);

// ─── TOOLTIP COMPONENTS ─────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  prefix = "$",
}: {
  active?: boolean;
  payload?: Array<{ value: number; color?: string }>;
  label?: string;
  prefix?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: "10px 14px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            color: "#94a3b8",
            fontSize: 11,
            marginBottom: 4,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {label}
        </div>
        {payload.map((p, i) => (
          <div
            key={i}
            style={{
              color: p.color || "#0f172a",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {prefix}
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ─── TAB DEFINITIONS ────────────────────────────────────────────

type TabKey = "national" | "trends" | "explorer";

const TABS: { key: TabKey; label: string }[] = [
  { key: "national", label: "National Data" },
  { key: "trends", label: "Trends" },
  { key: "explorer", label: "Data Explorer" },
];

// ─── SORTABLE TABLE TYPES ───────────────────────────────────────

type SortField = "name" | "abbr" | "income" | "value" | "ratio";
type SortDir = "asc" | "desc";

// ─── MAIN PAGE COMPONENT ───────────────────────────────────────

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("national");
  const [sortField, setSortField] = useState<SortField>("ratio");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Memoized data
  const scatterData = useMemo(() => getScatterData(), []);
  const nationalTrend = useMemo(() => generateNationalTrend(), []);
  const affordabilityTrend = useMemo(() => generateAffordabilityTrend(), []);
  const sortedStatesForBar = useMemo(
    () => [...STATES_DATA].sort((a, b) => b.ratio - a.ratio),
    []
  );

  // Filtered trend data (every 3rd point for readability)
  const filteredNational = useMemo(
    () => nationalTrend.filter((_, i) => i % 3 === 0),
    [nationalTrend]
  );
  const filteredAffordability = useMemo(
    () => affordabilityTrend.filter((_, i) => i % 3 === 0),
    [affordabilityTrend]
  );
  const covidMonth = nationalTrend[48]?.month;

  // Sortable states for Data Explorer
  const sortedStatesForTable = useMemo(() => {
    const copy = [...STATES_DATA];
    copy.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      aVal = aVal as number;
      bVal = bVal as number;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return copy;
  }, [sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" || field === "abbr" ? "asc" : "desc");
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };

  // ─── TAB 1: NATIONAL DATA ──────────────────────────────────────

  const renderNationalTab = () => (
    <div>
      {/* Full State Ranking Bar Chart */}
      <div style={{ ...cardStyle, marginBottom: 28 }}>
        <div style={sheenStyle} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={sectionTitleStyle}>State Affordability Rankings</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>
              Affordability ratio by state &middot; Sorted most &rarr; least
              expensive &middot; All 32 states
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "#10b981",
                  marginRight: 4,
                }}
              />
              Affordable (&lt;3x)
            </span>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "#f59e0b",
                  marginRight: 4,
                }}
              />
              Moderate (3-5x)
            </span>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "#ef4444",
                  marginRight: 4,
                }}
              />
              Unaffordable (5x+)
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={sortedStatesForBar.length * 24 + 40}>
          <BarChart
            data={sortedStatesForBar}
            layout="vertical"
            margin={{ left: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={{ stroke: "#e2e8f0" }}
              domain={[0, 10]}
            />
            <YAxis
              dataKey="abbr"
              type="category"
              width={30}
              tick={{
                fill: "#94a3b8",
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const d = payload[0].payload as (typeof STATES_DATA)[number];
                  return (
                    <div
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "10px 14px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 4,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {d.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 12,
                        }}
                      >
                        <div>
                          Ratio:{" "}
                          <span
                            style={{
                              color: ratioColor(d.ratio),
                              fontWeight: 700,
                            }}
                          >
                            {d.ratio}x
                          </span>
                        </div>
                        <div>Income: {fmt(d.income)}</div>
                        <div>Home: {fmt(d.value)}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="ratio" radius={[0, 4, 4, 0]} barSize={8}>
              {sortedStatesForBar.map((s, i) => (
                <Cell key={i} fill={ratioColor(s.ratio)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter Plot: Income vs Home Value */}
      <div style={{ ...cardStyle, marginBottom: 28 }}>
        <div style={sheenStyle} />
        <div style={sectionTitleStyle}>Income vs. Home Value</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>
          Each dot = state &middot; Color = region
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 12,
            fontSize: 11,
          }}
        >
          {Object.entries(REGION_COLORS).map(([r, c]) => (
            <span
              key={r}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c,
                }}
              />
              {r}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="income"
              name="Income"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => "$" + fmtK(v)}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              dataKey="value"
              name="Home Value"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => "$" + fmtK(v)}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload as ReturnType<
                    typeof getScatterData
                  >[number];
                  return (
                    <div
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "10px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {d.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Income: {fmt(d.income)} &middot; Home: {fmt(d.value)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={scatterData}>
              {scatterData.map((d, i) => (
                <Cell
                  key={i}
                  fill={REGION_COLORS[d.region]}
                  fillOpacity={0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Most / Least Affordable Counties Tables */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          {
            title: "Most Affordable Counties",
            data: TOP_AFFORDABLE,
            accent: "#10b981",
          },
          {
            title: "Least Affordable Counties",
            data: LEAST_AFFORDABLE,
            accent: "#ef4444",
          },
        ].map(({ title, data, accent }, ti) => (
          <div key={ti} style={cardStyle}>
            <div style={sheenStyle} />
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 4,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  background: accent,
                }}
              />
              {title}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
              Min population 10,000
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  {["#", "County", "St", "Income", "Value", "Ratio"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: h === "County" ? "left" : "right",
                          padding: "8px 6px",
                          color: "#64748b",
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.rank}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#f1f5f9")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        textAlign: "right",
                        padding: "10px 6px",
                        color: "#64748b",
                      }}
                    >
                      {row.rank}
                    </td>
                    <td
                      style={{
                        textAlign: "left",
                        padding: "10px 6px",
                        color: "#0f172a",
                        fontWeight: 500,
                      }}
                    >
                      {row.county}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "10px 6px",
                        color: "#94a3b8",
                      }}
                    >
                      {row.state}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "10px 6px",
                        color: "#94a3b8",
                      }}
                    >
                      {fmt(row.income)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "10px 6px",
                        color: "#94a3b8",
                      }}
                    >
                      {fmt(row.value)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "10px 6px",
                        fontWeight: 700,
                        color: accent,
                      }}
                    >
                      {row.ratio}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── TAB 2: TRENDS ────────────────────────────────────────────

  const renderTrendsTab = () => (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {/* Home Values Area Chart */}
        <div style={cardStyle}>
          <div style={sheenStyle} />
          <div style={sectionTitleStyle}>Home Values</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
            National median &middot; 2016-2026 &middot; Zillow ZHVI
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={filteredNational}>
              <defs>
                <linearGradient id="homeGradResearch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                interval={9}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => "$" + fmtK(v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#homeGradResearch)"
                dot={false}
              />
              {covidMonth && (
                <ReferenceLine
                  x={covidMonth}
                  stroke="#475569"
                  strokeDasharray="3 3"
                  label={{
                    value: "COVID",
                    fill: "#94a3b8",
                    fontSize: 10,
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Affordability Ratio Area Chart */}
        <div style={cardStyle}>
          <div style={sheenStyle} />
          <div style={sectionTitleStyle}>Affordability Ratio</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
            Home Value &divide; Income &middot; Lower is better
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={filteredAffordability}>
              <defs>
                <linearGradient id="ratioGradResearch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                interval={9}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[3, 6]}
              />
              <Tooltip content={<ChartTooltip prefix="" />} />
              <Area
                type="monotone"
                dataKey="ratio"
                stroke="#d97706"
                strokeWidth={2.5}
                fill="url(#ratioGradResearch)"
                dot={false}
              />
              <ReferenceLine
                y={3}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: "Affordable",
                  fill: "#10b981",
                  fontSize: 10,
                  position: "right",
                }}
              />
              <ReferenceLine
                y={5}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: "Stretched",
                  fill: "#ef4444",
                  fontSize: 10,
                  position: "right",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ─── TAB 3: DATA EXPLORER ─────────────────────────────────────

  const renderExplorerTab = () => (
    <div>
      {/* Rent Insights Tools */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        <BedroomCalculator />
        <RentAffordabilityExplorer />
      </div>

      {/* Placeholder Message */}
      <div
        style={{
          ...cardStyle,
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={sheenStyle} />
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
              color: "#3b82f6",
            }}
          >
            DB
          </span>
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 4,
            }}
          >
            Full searchable table of all 3,100+ counties coming soon.
          </div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Run the ETL scripts to populate the data. In the meantime, the 32
            states below are loaded from the demo dataset.
          </div>
        </div>
      </div>

      {/* Sortable States Table */}
      <div style={cardStyle}>
        <div style={sheenStyle} />
        <div style={sectionTitleStyle}>State-Level Data</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
          Click column headers to sort &middot; 32 states from demo dataset
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              {(
                [
                  { key: "name" as SortField, label: "State", align: "left" },
                  { key: "abbr" as SortField, label: "Abbr", align: "left" },
                  { key: "income" as SortField, label: "Income", align: "right" },
                  { key: "value" as SortField, label: "Home Value", align: "right" },
                  { key: "ratio" as SortField, label: "Ratio", align: "right" },
                ] as const
              ).map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    textAlign: col.align,
                    padding: "10px 8px",
                    color: sortField === col.key ? "#2563eb" : "#64748b",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.label}
                  {sortIndicator(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedStatesForTable.map((row, idx) => (
              <tr
                key={row.abbr}
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  background: idx % 2 === 0 ? "transparent" : "#fafbfc",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f1f5f9")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background =
                    idx % 2 === 0 ? "transparent" : "#fafbfc")
                }
              >
                <td
                  style={{
                    textAlign: "left",
                    padding: "10px 8px",
                    color: "#0f172a",
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {row.name}
                </td>
                <td
                  style={{
                    textAlign: "left",
                    padding: "10px 8px",
                    color: "#94a3b8",
                  }}
                >
                  {row.abbr}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "10px 8px",
                    color: "#475569",
                  }}
                >
                  {formatCurrency(row.income)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "10px 8px",
                    color: "#475569",
                  }}
                >
                  {formatCurrency(row.value)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "10px 8px",
                    fontWeight: 700,
                    color: ratioColor(row.ratio),
                  }}
                >
                  {row.ratio}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────

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
          maxWidth: 1360,
          margin: "0 auto",
          padding: "28px 32px",
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 6,
              color: "#0f172a",
            }}
          >
            Research
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15, fontWeight: 400 }}>
            Analyst power tools &middot; Deep-dive into national affordability
            data, trends, and state-level comparisons
          </p>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 28,
            background: "#ffffff",
            padding: 4,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            width: "fit-content",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  transition: "all 0.3s",
                  background: isActive
                    ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                    : "transparent",
                  color: isActive ? "#ffffff" : "#475569",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "national" && renderNationalTab()}
        {activeTab === "trends" && renderTrendsTab()}
        {activeTab === "explorer" && renderExplorerTab()}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
