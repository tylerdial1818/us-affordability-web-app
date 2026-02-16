"use client";

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

interface RentBreakdownProps {
  fmr_0br?: number;
  fmr_1br?: number;
  fmr_2br?: number;
  fmr_3br?: number;
  fmr_4br?: number;
  rent_trend_5yr?: number;
}

export default function RentBreakdown({
  fmr_0br,
  fmr_1br,
  fmr_2br,
  fmr_3br,
  fmr_4br,
  rent_trend_5yr,
}: RentBreakdownProps) {
  // Return null if no FMR data available
  if (!fmr_0br && !fmr_1br && !fmr_2br && !fmr_3br && !fmr_4br) {
    return null;
  }

  const rentData = [
    { bedroom: "Studio", rent: fmr_0br || 0, fill: "#6366f1" },
    { bedroom: "1BR", rent: fmr_1br || 0, fill: "#8b5cf6" },
    { bedroom: "2BR", rent: fmr_2br || 0, fill: "#a855f7" },
    { bedroom: "3BR", rent: fmr_3br || 0, fill: "#c084fc" },
    { bedroom: "4BR+", rent: fmr_4br || 0, fill: "#d8b4fe" },
  ].filter((d) => d.rent > 0);

  const growth5yr = rent_trend_5yr || 0;
  const growthColor = growth5yr > 0.30 ? "#ef4444" : growth5yr > 0.15 ? "#f59e0b" : "#10b981";

  return (
    <div style={cardStyle}>
      <div style={sheenStyle} />
      
      <div style={{ marginBottom: 20 }}>
        <div style={sectionTitleStyle}>Fair Market Rent by Bedroom</div>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
          HUD Fair Market Rent estimates for different apartment sizes
        </p>
        
        {growth5yr > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              background: `${growthColor}15`,
              fontSize: 13,
              fontWeight: 600,
              color: growthColor,
            }}
          >
            <span>5-Year Growth:</span>
            <span>+{(growth5yr * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Rent Breakdown List */}
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        {rentData.map((item) => (
          <div
            key={item.bedroom}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: item.fill,
                }}
              />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{item.bedroom}</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
              {formatCurrency(item.rent)}/mo
            </span>
          </div>
        ))}
      </div>

      {/* Rent Comparison Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={rentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="bedroom" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
            }}
            formatter={(value) => [`${formatCurrency(value as number)}/mo`, "Rent"]}
          />
          <Bar dataKey="rent" radius={[8, 8, 0, 0]}>
            {rentData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

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
        <strong>Note:</strong> Fair Market Rents (FMR) are HUD&apos;s estimates of what a
        family should expect to pay for moderately-priced rental housing in this area.
      </div>
    </div>
  );
}
