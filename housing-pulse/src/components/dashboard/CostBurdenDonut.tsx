"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

interface CostBurdenData {
  name: string;
  value: number;
  color: string;
}

interface CostBurdenDonutProps {
  data: CostBurdenData[];
}

export default function CostBurdenDonut({ data }: CostBurdenDonutProps) {
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
        Cost Burden
      </div>
      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
        US renter households · % of income on housing
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                return (
                  <div
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                      <span
                        style={{
                          color: (payload[0].payload as CostBurdenData).color,
                          fontWeight: 700,
                        }}
                      >
                        {payload[0].value}%
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: d.color,
                }}
              />
              <span style={{ color: "#94a3b8" }}>{d.name}</span>
            </div>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontWeight: 600,
                color: d.color,
              }}
            >
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
