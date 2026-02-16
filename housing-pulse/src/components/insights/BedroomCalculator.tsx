"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

// National median rents by bedroom count (from analysis)
const NATIONAL_RENTS = {
  "0br": 552,
  "1br": 721,
  "2br": 848,
  "3br": 1018,
  "4br": 1187,
};

export default function BedroomCalculator() {
  const [selectedBedroom, setSelectedBedroom] = useState<"0br" | "1br" | "2br" | "3br" | "4br">("2br");
  
  const bedroomData = [
    { label: "Studio", value: "0br", rent: NATIONAL_RENTS["0br"], fill: "#6366f1" },
    { label: "1BR", value: "1br", rent: NATIONAL_RENTS["1br"], fill: "#8b5cf6" },
    { label: "2BR", value: "2br", rent: NATIONAL_RENTS["2br"], fill: "#a855f7" },
    { label: "3BR", value: "3br", rent: NATIONAL_RENTS["3br"], fill: "#c084fc" },
    { label: "4BR+", value: "4br", rent: NATIONAL_RENTS["4br"], fill: "#d8b4fe" },
  ];

  const selectedRent = NATIONAL_RENTS[selectedBedroom];
  const baseRent = NATIONAL_RENTS["2br"];
  const percentDiff = ((selectedRent - baseRent) / baseRent) * 100;

  return (
    <div style={cardStyle}>
      <div style={sheenStyle} />
      
      <div style={{ marginBottom: 20 }}>
        <div style={sectionTitleStyle}>Bedroom Size Calculator</div>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          Compare median national rent by apartment size
        </p>
      </div>

      {/* Bedroom Selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 12 }}>
          SELECT BEDROOM COUNT
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {bedroomData.map((bedroom) => (
            <button
              key={bedroom.value}
              onClick={() => setSelectedBedroom(bedroom.value as any)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 8,
                border: selectedBedroom === bedroom.value ? "2px solid #6366f1" : "1px solid #e2e8f0",
                background: selectedBedroom === bedroom.value ? "#f0f9ff" : "#ffffff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                color: selectedBedroom === bedroom.value ? "#6366f1" : "#64748b",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = selectedBedroom === bedroom.value ? "#f0f9ff" : "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedBedroom === bedroom.value ? "#f0f9ff" : "#ffffff";
              }}
            >
              {bedroom.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Rent Display */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 48,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            {formatCurrency(selectedRent)}
          </div>
          <div style={{ fontSize: 16, color: "#94a3b8" }}>/month</div>
        </div>
        
        {selectedBedroom !== "2br" && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              background: percentDiff > 0 ? "#fef2f2" : "#f0fdf4",
              fontSize: 13,
              fontWeight: 600,
              color: percentDiff > 0 ? "#dc2626" : "#16a34a",
            }}
          >
            <span>{percentDiff > 0 ? "↑" : "↓"}</span>
            <span>{Math.abs(percentDiff).toFixed(0)}% vs 2BR baseline</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bedroomData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
            }}
            formatter={(value) => [`${formatCurrency(value as number)}/mo`, "Median Rent"]}
          />
          <Bar dataKey="rent" radius={[8, 8, 0, 0]}>
            {bedroomData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={selectedBedroom === entry.value ? entry.fill : "#cbd5e1"}
                opacity={selectedBedroom === entry.value ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: 8,
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <strong>Note:</strong> National median rents. Actual rents vary significantly by location.
      </div>
    </div>
  );
}
