"use client";

import { ratioColor, ratioLabel } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  change: string;
  changeColor: string;
  sub: string;
}

function KPICard({ label, value, change, changeColor, sub }: KPICardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Card sheen */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%)",
        }}
      />
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#94a3b8",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 34,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: changeColor,
            fontWeight: 600,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {change}
        </span>
        <span style={{ fontSize: 11, color: "#64748b" }}>{sub}</span>
      </div>
    </div>
  );
}

interface KPICardsProps {
  currentValue: number;
  yoyPct: string;
  currentIncome: number;
  yoyIncomePct: string;
  currentRatio: number;
}

export default function KPICards({
  currentValue,
  yoyPct,
  currentIncome,
  yoyIncomePct,
  currentRatio,
}: KPICardsProps) {
  const fmt = (n: number) =>
    "$" +
    (n >= 1_000_000
      ? (n / 1_000_000).toFixed(1) + "M"
      : n >= 1000
        ? Math.round(n).toLocaleString()
        : String(n));

  const cards: KPICardProps[] = [
    {
      label: "Median Home Value",
      value: fmt(currentValue),
      change: `▲ ${yoyPct}%`,
      changeColor: "#ef4444",
      sub: "National",
    },
    {
      label: "Median Household Income",
      value: fmt(currentIncome),
      change: `▲ ${yoyIncomePct}%`,
      changeColor: "#10b981",
      sub: "National",
    },
    {
      label: "Affordability Ratio",
      value: `${currentRatio}x`,
      change: ratioLabel(currentRatio),
      changeColor: ratioColor(currentRatio),
      sub: "Value ÷ Income",
    },
    {
      label: "Cost-Burdened Households",
      value: "31.0%",
      change: "▲ 1.2pp YoY",
      changeColor: "#f59e0b",
      sub: "Paying >30% on Housing",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 28,
      }}
    >
      {cards.map((kpi, i) => (
        <KPICard key={i} {...kpi} />
      ))}
    </div>
  );
}
