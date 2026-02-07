"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/shared/Navigation";
import USMap from "@/components/map/USMap";
import MapControls from "@/components/map/MapControls";
import { STATES_DATA } from "@/lib/data";

export default function MapPage() {
  const [animIn, setAnimIn] = useState(false);
  const [mapMetric, setMapMetric] = useState("ratio");
  const [incomeRange, setIncomeRange] = useState<[number, number]>([20, 160]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const visibleCount = STATES_DATA.filter(
    (s) => s.income >= incomeRange[0] * 1000 && s.income <= incomeRange[1] * 1000
  ).length;

  const cardStyle = {
    background: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        color: "#0f172a",
      }}
    >
      <Navigation />
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "28px 32px",
          opacity: animIn ? 1 : 0,
          transform: animIn ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: 20,
            minHeight: "calc(100vh - 140px)",
          }}
        >
          {/* Sidebar Controls */}
          <MapControls
            selectedMetric={mapMetric}
            onMetricChange={setMapMetric}
            incomeRange={incomeRange}
            onIncomeRangeChange={setIncomeRange}
          />

          {/* Map Area */}
          <div
            style={{
              ...cardStyle,
              padding: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
                  {mapMetric === "ratio"
                    ? "Affordability Ratio"
                    : mapMetric === "value"
                      ? "Median Home Value"
                      : "Median Household Income"}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  Hover over states for details · Production version uses
                  county-level polygons
                </div>
              </div>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "#f1f5f9",
                  fontSize: 11,
                  color: "#94a3b8",
                  fontFamily: "'DM Mono', monospace",
                  border: "1px solid #e2e8f0",
                }}
              >
                {visibleCount} / {STATES_DATA.length} states visible
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: 20,
                minHeight: 500,
                position: "relative",
              }}
            >
              <USMap selectedMetric={mapMetric} incomeRange={incomeRange} />
              {/* Demo overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 12,
                  color: "#94a3b8",
                  fontFamily: "'DM Mono', monospace",
                  textAlign: "center",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                }}
              >
                <span style={{ color: "#2563eb" }}>Demo:</span> State-level
                preview · Full app uses{" "}
                <span style={{ color: "#0f172a" }}>3,100+ county polygons</span>{" "}
                via Mapbox GL JS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
