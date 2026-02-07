"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ratioColor } from "@/lib/utils";
import type { StateData } from "@/lib/data";

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

interface StateCompareBarProps {
  states: StateData[];
}

export default function StateCompareBar({ states }: StateCompareBarProps) {
  return (
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
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 4,
              color: "#0f172a",
            }}
          >
            State Affordability Rankings
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>
            Affordability ratio by state · Sorted most → least expensive
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
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={states} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
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
            tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "'DM Mono', monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                const d = payload[0].payload as StateData;
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
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                      <div>
                        Ratio:{" "}
                        <span style={{ color: ratioColor(d.ratio), fontWeight: 700 }}>
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
            {states.map((s, i) => (
              <Cell key={i} fill={ratioColor(s.ratio)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
