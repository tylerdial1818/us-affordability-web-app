"use client";

import { useState } from "react";
import { US_STATES_SVG, STATES_DATA } from "@/lib/data";
import { ratioColor, ratioLabel, formatCurrency } from "@/lib/utils";

interface USMapProps {
  selectedMetric: string;
  incomeRange: [number, number];
}

export default function USMap({ selectedMetric, incomeRange }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    name: string;
    income: number;
    value: number;
    ratio: number;
    x: number;
    y: number;
  } | null>(null);

  const getStateColor = (abbr: string) => {
    const s = STATES_DATA.find((st) => st.abbr === abbr);
    if (!s) return "#f1f5f9";
    if (s.income < incomeRange[0] * 1000 || s.income > incomeRange[1] * 1000)
      return "#e2e8f0";

    if (selectedMetric === "ratio") {
      if (s.ratio < 3) return "#059669";
      if (s.ratio < 4) return "#10b981";
      if (s.ratio < 5) return "#fbbf24";
      if (s.ratio < 6) return "#f97316";
      if (s.ratio < 7) return "#ef4444";
      return "#dc2626";
    }
    if (selectedMetric === "value") {
      const val = s.value / 100000;
      if (val < 2) return "#059669";
      if (val < 3) return "#10b981";
      if (val < 4) return "#fbbf24";
      if (val < 5) return "#f97316";
      return "#ef4444";
    }
    return "#3b82f6";
  };

  const getStateOpacity = (abbr: string) => {
    const s = STATES_DATA.find((st) => st.abbr === abbr);
    if (!s) return 0.3;
    if (s.income < incomeRange[0] * 1000 || s.income > incomeRange[1] * 1000)
      return 0.15;
    return 1;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg viewBox="0 0 320 165" style={{ width: "100%", height: "100%" }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {Object.entries(US_STATES_SVG).map(([abbr, { d }]) => (
          <path
            key={abbr}
            d={d}
            fill={getStateColor(abbr)}
            stroke={hoveredState === abbr ? "#0f172a" : "#ffffff"}
            strokeWidth={hoveredState === abbr ? 1.5 : 0.5}
            style={{
              cursor: "pointer",
              transition: "fill 0.3s, stroke-width 0.2s",
              filter: hoveredState === abbr ? "url(#glow)" : "none",
              opacity: getStateOpacity(abbr),
            }}
            onMouseEnter={(e) => {
              setHoveredState(abbr);
              const s = STATES_DATA.find((st) => st.abbr === abbr);
              if (s) {
                const rect = (e.target as SVGPathElement).getBoundingClientRect();
                setTooltip({
                  ...s,
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10,
                });
              }
            }}
            onMouseLeave={() => {
              setHoveredState(null);
              setTooltip(null);
            }}
          />
        ))}
        {/* Alaska inset */}
        <g transform="translate(30,120) scale(0.35)">
          <rect
            x="-2"
            y="-2"
            width="60"
            height="40"
            rx="3"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <path
            d="M5,25L15,10L30,8L45,15L50,30L35,32L15,30Z"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="0.5"
          />
          <text
            x="25"
            y="38"
            textAnchor="middle"
            fill="#64748b"
            fontSize="6"
            fontFamily="monospace"
          >
            AK
          </text>
        </g>
        {/* Hawaii inset */}
        <g transform="translate(85,130) scale(0.35)">
          <rect
            x="-2"
            y="-2"
            width="50"
            height="30"
            rx="3"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <circle cx="12" cy="14" r="4" fill={getStateColor("HI")} stroke="#cbd5e1" strokeWidth="0.5" />
          <circle cx="22" cy="12" r="5" fill={getStateColor("HI")} stroke="#cbd5e1" strokeWidth="0.5" />
          <circle cx="32" cy="10" r="3" fill={getStateColor("HI")} stroke="#cbd5e1" strokeWidth="0.5" />
          <text
            x="22"
            y="26"
            textAnchor="middle"
            fill="#64748b"
            fontSize="6"
            fontFamily="monospace"
          >
            HI
          </text>
        </g>
      </svg>
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "14px 18px",
            pointerEvents: "none",
            zIndex: 1000,
            minWidth: 220,
            boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
          }}
        >
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            {tooltip.name}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 16px",
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
            }}
          >
            <span style={{ color: "#94a3b8" }}>Income</span>
            <span style={{ color: "#0f172a", textAlign: "right" }}>
              {formatCurrency(tooltip.income)}
            </span>
            <span style={{ color: "#94a3b8" }}>Home Value</span>
            <span style={{ color: "#0f172a", textAlign: "right" }}>
              {formatCurrency(tooltip.value)}
            </span>
            <span style={{ color: "#94a3b8" }}>Ratio</span>
            <span
              style={{
                textAlign: "right",
                fontWeight: 700,
                color: ratioColor(tooltip.ratio),
              }}
            >
              {tooltip.ratio.toFixed(1)}x
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "4px 8px",
              borderRadius: 6,
              background: ratioColor(tooltip.ratio) + "20",
              color: ratioColor(tooltip.ratio),
              fontSize: 11,
              fontWeight: 600,
              textAlign: "center",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {ratioLabel(tooltip.ratio)}
          </div>
        </div>
      )}
    </div>
  );
}
