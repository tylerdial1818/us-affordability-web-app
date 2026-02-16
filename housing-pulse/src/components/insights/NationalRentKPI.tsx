"use client";

import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  national_median_rent: number;
  pct_counties_affordable: number;
  median_ptr: number;
  buy_better_count: number;
  rent_better_count: number;
}

export default function NationalRentKPI() {
  const [insights, setInsights] = useState<RentInsights | null>(null);

  useEffect(() => {
    fetch("/data/rent_insights.json")
      .then((res) => res.json())
      .then((data) => setInsights(data))
      .catch((err) => console.error("Failed to load rent insights:", err));
  }, []);

  if (!insights) return null;

  const medianRent = insights.national_median_rent;
  const affordablePct = insights.pct_counties_affordable;

  return (
    <div style={cardStyle}>
      <div style={sheenStyle} />
      
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          🏠
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
            National Rent Snapshot
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            Median 2-bedroom rent across U.S.
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 40,
          fontWeight: 600,
          color: "#6366f1",
          marginBottom: 4,
        }}
      >
        {formatCurrency(medianRent)}<span style={{ fontSize: 20, color: "#94a3b8" }}>/mo</span>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: 8,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          fontSize: 13,
          fontWeight: 600,
          color: "#166534",
        }}
      >
        <span>✓</span>
        <span>{affordablePct.toFixed(0)}% of counties meet 30% income rule</span>
      </div>

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
        <strong>30% Rule:</strong> Housing costs (rent + utilities) should not exceed
        30% of gross monthly income for affordability.
      </div>
    </div>
  );
}
