"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

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

export default function RentAffordabilityExplorer() {
  const [income, setIncome] = useState(75000);
  const [affordableCounties, setAffordableCounties] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Calculate how many counties have rent ≤ 30% of income
    calculateAffordability(income);
  }, [income]);

  const calculateAffordability = async (annualIncome: number) => {
    setLoading(true);
    
    try {
      const response = await fetch("/data/counties_acs.json");
      const counties = await response.json();
      
      const monthlyIncome = annualIncome / 12;
      const maxAffordableRent = monthlyIncome * 0.30;
      
      let count = 0;
      Object.values(counties).forEach((county: any) => {
        const rent = county.fmr_2br || county.median_gross_rent;
        if (rent && rent <= maxAffordableRent) {
          count++;
        }
      });
      
      setAffordableCounties(count);
    } catch (err) {
      console.error("Failed to load counties:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setIncome(value);
    }
  };

  const monthlyIncome = income / 12;
  const maxAffordableRent = monthlyIncome * 0.30;
  const percentageAffordable = (affordableCounties / 3211) * 100;

  return (
    <div style={cardStyle}>
      <div style={sheenStyle} />
      
      <div style={{ marginBottom: 20 }}>
        <div style={sectionTitleStyle}>Rent Affordability Explorer</div>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          See how many counties you can afford based on the 30% income rule
        </p>
      </div>

      {/* Income Input */}
      <div style={{ marginBottom: 24 }}>
        <label
          htmlFor="income-input"
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "#64748b",
            marginBottom: 8,
          }}
        >
          ANNUAL HOUSEHOLD INCOME
        </label>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            $
          </span>
          <input
            id="income-input"
            type="number"
            value={income}
            onChange={handleIncomeChange}
            style={{
              width: "100%",
              padding: "14px 16px 14px 32px",
              borderRadius: 8,
              border: "2px solid #e2e8f0",
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "'DM Mono', monospace",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#6366f1";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
          Try: $50k, $75k, $100k, $150k
        </div>
      </div>

      {/* Results */}
      <div
        style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, color: "#e0e7ff", fontWeight: 600, marginBottom: 8 }}>
          COUNTIES YOU CAN AFFORD
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 48,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {loading ? "..." : affordableCounties.toLocaleString()}
          </div>
          <div style={{ fontSize: 16, color: "#e0e7ff" }}>/ 3,211</div>
        </div>
        <div style={{ fontSize: 14, color: "#ffffff", opacity: 0.9 }}>
          {percentageAffordable.toFixed(0)}% of all US counties
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#94a3b8",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}
          >
            MONTHLY INCOME
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 20,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {formatCurrency(monthlyIncome)}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#94a3b8",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}
          >
            MAX AFFORDABLE RENT (30%)
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 20,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {formatCurrency(maxAffordableRent)}
          </div>
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
        <strong>30% Rule:</strong> Financial experts recommend spending no more than 30% of your
        gross monthly income on housing to maintain affordability.
      </div>
    </div>
  );
}
