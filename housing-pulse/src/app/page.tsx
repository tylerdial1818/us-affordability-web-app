"use client";

import { useState, useEffect, useMemo } from "react";
import Navigation from "@/components/shared/Navigation";
import Footer from "@/components/shared/Footer";
import KPICards from "@/components/dashboard/KPICards";
import TrendLineChart from "@/components/dashboard/TrendLineChart";
import StateCompareBar from "@/components/dashboard/StateCompareBar";
import ScatterPlot from "@/components/dashboard/ScatterPlot";
import CostBurdenDonut from "@/components/dashboard/CostBurdenDonut";
import TopBottomTable from "@/components/dashboard/TopBottomTable";
import {
  generateNationalTrend,
  generateIncomeTrend,
  generateAffordabilityTrend,
  STATES_DATA,
  getScatterData,
  COST_BURDEN_DATA,
  TOP_AFFORDABLE,
  LEAST_AFFORDABLE,
} from "@/lib/data";

export default function DashboardPage() {
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const nationalTrend = useMemo(() => generateNationalTrend(), []);
  const incomeTrend = useMemo(() => generateIncomeTrend(), []);
  const affordabilityTrend = useMemo(() => generateAffordabilityTrend(), []);
  const scatterData = useMemo(() => getScatterData(), []);

  const currentValue = nationalTrend[nationalTrend.length - 1].value;
  const yoyValue = nationalTrend[nationalTrend.length - 13]?.value || currentValue;
  const yoyPct = (((currentValue - yoyValue) / yoyValue) * 100).toFixed(1);

  const currentIncome = incomeTrend[incomeTrend.length - 1].income;
  const yoyIncome = incomeTrend[incomeTrend.length - 13]?.income || currentIncome;
  const yoyIncomePct = (((currentIncome - yoyIncome) / yoyIncome) * 100).toFixed(1);

  const currentRatio = affordabilityTrend[affordabilityTrend.length - 1].ratio;

  const tableSections = [
    { title: "Most Affordable Counties", data: TOP_AFFORDABLE, accent: "#10b981" },
    { title: "Least Affordable Counties", data: LEAST_AFFORDABLE, accent: "#ef4444" },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#0f172a" }}>
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
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 6,
              color: "#0f172a",
            }}
          >
            US Housing Affordability
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15, fontWeight: 400 }}>
            National overview · Census ACS 5-Year + Zillow ZHVI · Updated Feb 2026
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards
          currentValue={currentValue}
          yoyPct={yoyPct}
          currentIncome={currentIncome}
          yoyIncomePct={yoyIncomePct}
          currentRatio={currentRatio}
        />

        {/* Trend Charts */}
        <TrendLineChart
          nationalTrend={nationalTrend}
          affordabilityTrend={affordabilityTrend}
        />

        {/* State Bar Chart */}
        <StateCompareBar states={STATES_DATA} />

        {/* Scatter + Cost Burden */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <ScatterPlot data={scatterData} />
          <CostBurdenDonut data={COST_BURDEN_DATA} />
        </div>

        {/* Tables */}
        <TopBottomTable sections={tableSections} />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
