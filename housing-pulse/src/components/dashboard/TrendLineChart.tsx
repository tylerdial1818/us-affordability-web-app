"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; color?: string }>;
  label?: string;
  prefix?: string;
}

function ChartTooltip({ active, payload, label, prefix = "$" }: ChartTooltipProps) {
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
  background: "linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%)",
};

const sectionTitleStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 4,
  color: "#0f172a",
};

const fmtK = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1000 ? Math.round(n / 1000) + "K" : String(n);

interface TrendLineChartProps {
  nationalTrend: Array<{ month: string; value: number; idx: number }>;
  affordabilityTrend: Array<{ month: string; ratio: number; idx: number }>;
}

export default function TrendLineChart({ nationalTrend, affordabilityTrend }: TrendLineChartProps) {
  const filteredNational = nationalTrend.filter((_, i) => i % 3 === 0);
  const filteredAffordability = affordabilityTrend.filter((_, i) => i % 3 === 0);
  const covidMonth = nationalTrend[48]?.month;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
      {/* Home Values Chart */}
      <div style={cardStyle}>
        <div style={sheenStyle} />
        <div style={sectionTitleStyle}>Home Values</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
          National median · 2016-2026 · Zillow ZHVI
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={filteredNational}>
            <defs>
              <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#homeGrad)"
              dot={false}
            />
            {covidMonth && (
              <ReferenceLine
                x={covidMonth}
                stroke="#475569"
                strokeDasharray="3 3"
                label={{ value: "COVID", fill: "#94a3b8", fontSize: 10 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Affordability Ratio Chart */}
      <div style={cardStyle}>
        <div style={sheenStyle} />
        <div style={sectionTitleStyle}>Affordability Ratio</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
          Home Value ÷ Income · Lower is better
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={filteredAffordability}>
            <defs>
              <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#ratioGrad)"
              dot={false}
            />
            <ReferenceLine
              y={3}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{ value: "Affordable", fill: "#10b981", fontSize: 10, position: "right" }}
            />
            <ReferenceLine
              y={5}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: "Stretched", fill: "#ef4444", fontSize: 10, position: "right" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
