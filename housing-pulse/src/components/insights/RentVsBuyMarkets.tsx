"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

interface RentInsights {
  buy_better_count: number;
  rent_better_count: number;
  median_ptr: number;
}

const COLORS = {
  buy: "#10b981",    // Green
  rent: "#6366f1",   // Purple
  mixed: "#94a3b8",  // Gray
};

export default function RentVsBuyMarkets() {
  const [insights, setInsights] = useState<RentInsights | null>(null);

  useEffect(() => {
    fetch("/data/rent_insights.json")
      .then((res) => res.json())
      .then((data) => setInsights(data))
      .catch((err) => console.error("Failed to load rent insights:", err));
  }, []);

  if (!insights) return null;

  const total = insights.buy_better_count + insights.rent_better_count;
  const mixed = 3211 - total; // Total counties minus buy/rent counties

  const chartData = [
    { name: "Better to Buy", value: insights.buy_better_count, color: COLORS.buy },
    { name: "Mixed Market", value: mixed, color: COLORS.mixed },
    { name: "Better to Rent", value: insights.rent_better_count, color: COLORS.rent },
  ];

  return (
    <div style={cardStyle}>
      <div style={sheenStyle} />
      
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #10b981 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          ⚖️
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Rent vs. Buy Markets
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            Based on price-to-rent ratio analysis
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {/* Pie Chart */}
        <div style={{ flex: "0 0 140px" }}>
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={chartData}
                cx={70}
                cy={70}
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const data = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{data.name}</div>
                        <div style={{ color: "#64748b" }}>
                          {data.value.toLocaleString()} counties
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {chartData.map((item) => (
            <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {item.value.toLocaleString()} counties
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: 8,
          fontSize: 12,
          color: "#0c4a6e",
        }}
      >
        <strong>Ratio Guide:</strong> &lt;15x = Buy favored, 15-20x = Mixed, &gt;20x = Rent favored
      </div>
    </div>
  );
}
