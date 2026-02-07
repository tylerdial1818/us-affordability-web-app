"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { REGION_COLORS } from "@/lib/constants";

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

const fmt = (n: number) =>
  "$" +
  (n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1000
      ? Math.round(n).toLocaleString()
      : String(n));

const fmtK = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1000 ? Math.round(n / 1000) + "K" : String(n);

interface ScatterDataPoint {
  name: string;
  abbr: string;
  income: number;
  value: number;
  ratio: number;
  region: string;
  pop: number;
}

interface ScatterPlotProps {
  data: ScatterDataPoint[];
}

export default function ScatterPlot({ data }: ScatterPlotProps) {
  return (
    <div style={cardStyle}>
      <div style={sheenStyle} />
      <div
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 4,
          color: "#0f172a",
        }}
      >
        Income vs. Home Value
      </div>
      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>
        Each dot = state · Color = region
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11 }}>
        {Object.entries(REGION_COLORS).map(([r, c]) => (
          <span key={r} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
            {r}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
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
                const d = payload[0].payload as ScatterDataPoint;
                return (
                  <div
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {d.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      Income: {fmt(d.income)} · Home: {fmt(d.value)}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell key={i} fill={REGION_COLORS[d.region]} fillOpacity={0.8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
