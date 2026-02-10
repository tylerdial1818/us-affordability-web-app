"use client";

import { MAP_METRICS, type MapMetricKey } from "@/lib/constants";

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

interface MapControlsProps {
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  incomeRange: [number, number];
  onIncomeRangeChange: (range: [number, number]) => void;
  viewMode: "rent" | "buy";
  onViewModeChange: (mode: "rent" | "buy") => void;
}

export default function MapControls({
  selectedMetric,
  onMetricChange,
  incomeRange,
  onIncomeRangeChange,
  viewMode,
  onViewModeChange,
}: MapControlsProps) {
  // Simplified metric options for the demo (matching the demo JSX)
  const metricOptions = [
    { key: "ratio", label: "Affordability Ratio", desc: "Home Value ÷ Income" },
    { key: "value", label: "Median Home Value", desc: "Dollar amount" },
    { key: "income", label: "Median Income", desc: "Household annual" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* View Mode Toggle */}
      <div style={cardStyle}>
        <div style={sheenStyle} />
        <div style={sectionTitleStyle}>View Mode</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
          Switch between rent and home value
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            background: "#f1f5f9",
            padding: 4,
            borderRadius: 10,
          }}
        >
          <button
            onClick={() => onViewModeChange("buy")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: viewMode === "buy" ? "#ffffff" : "transparent",
              color: viewMode === "buy" ? "#0f172a" : "#64748b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: viewMode === "buy" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            🏠 Buy
          </button>
          <button
            onClick={() => onViewModeChange("rent")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: viewMode === "rent" ? "#ffffff" : "transparent",
              color: viewMode === "rent" ? "#0f172a" : "#64748b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: viewMode === "rent" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            🔑 Rent
          </button>
        </div>
      </div>

      {/* Metric Selector */}
      <div style={cardStyle}>
        <div style={sheenStyle} />
        <div style={sectionTitleStyle}>Metric</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
          Select what the map displays
        </div>
        {metricOptions.map((m) => (
          <button
            key={m.key}
            onClick={() => onMetricChange(m.key)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "12px 14px",
              borderRadius: 10,
              border:
                selectedMetric === m.key
                  ? "1px solid #3b82f6"
                  : "1px solid #e2e8f0",
              background:
                selectedMetric === m.key ? "#3b82f620" : "transparent",
              cursor: "pointer",
              marginBottom: 6,
              transition: "all 0.2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: selectedMetric === m.key ? "#2563eb" : "#0f172a",
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              {m.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Income Filter */}
      <div style={cardStyle}>
        <div style={sheenStyle} />
        <div style={sectionTitleStyle}>Income Filter</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
          Filter by median household income range
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 20,
            fontWeight: 500,
            color: "#0f172a",
            marginBottom: 12,
          }}
        >
          ${incomeRange[0]}K - ${incomeRange[1]}K
        </div>
        <div style={{ marginBottom: 8 }}>
          <label
            style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}
          >
            Minimum
          </label>
          <input
            type="range"
            min={10}
            max={150}
            value={incomeRange[0]}
            onChange={(e) =>
              onIncomeRangeChange([
                +e.target.value,
                Math.max(+e.target.value + 10, incomeRange[1]),
              ])
            }
            style={{ width: "100%", accentColor: "#3b82f6" }}
          />
        </div>
        <div>
          <label
            style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}
          >
            Maximum
          </label>
          <input
            type="range"
            min={20}
            max={200}
            value={incomeRange[1]}
            onChange={(e) =>
              onIncomeRangeChange([
                Math.min(incomeRange[0], +e.target.value - 10),
                +e.target.value,
              ])
            }
            style={{ width: "100%", accentColor: "#3b82f6" }}
          />
        </div>
      </div>

      {/* Legend */}
      <div style={cardStyle}>
        <div style={sheenStyle} />
        <div style={sectionTitleStyle}>Legend</div>
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: 12,
              borderRadius: 6,
              background:
                viewMode === "rent"
                  ? "linear-gradient(90deg, #059669 0%, #10b981 30%, #fbbf24 50%, #f97316 70%, #ef4444 100%)"
                  : selectedMetric === "income"
                  ? "linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #93c5fd 100%)"
                  : "linear-gradient(90deg, #059669 0%, #10b981 25%, #fbbf24 50%, #f97316 75%, #ef4444 100%)",
              marginBottom: 6,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "#94a3b8",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {viewMode === "rent" ? (
              <>
                <span>Affordable (&lt;25%)</span>
                <span>Moderate (30%)</span>
                <span>Burdened (40%+)</span>
              </>
            ) : selectedMetric === "ratio" ? (
              <>
                <span>Affordable (2x)</span>
                <span>Moderate</span>
                <span>Severe (8x+)</span>
              </>
            ) : selectedMetric === "value" ? (
              <>
                <span>$100K</span>
                <span>$300K</span>
                <span>$500K+</span>
              </>
            ) : (
              <>
                <span>$30K</span>
                <span>$65K</span>
                <span>$100K+</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pro Tip */}
      <div
        style={{
          ...cardStyle,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
        }}
      >
        <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, marginBottom: 6 }}>
          Pro Tip
        </div>
        <div style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.6 }}>
          {viewMode === "rent"
            ? "Toggle to Rent view to see which areas have affordable rents. Green means less than 30% of income goes to rent."
            : "Drag the income sliders to reveal which areas are affordable for a specific income bracket. States outside the range will dim."}
        </div>
      </div>
    </div>
  );
}
