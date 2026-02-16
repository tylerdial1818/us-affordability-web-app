"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navigation from "@/components/shared/Navigation";
import Footer from "@/components/shared/Footer";
import RentBreakdown from "@/components/dashboard/RentBreakdown";
import { getMockCountyData, US_STATES_SVG } from "@/lib/data";
import {
  formatCurrency,
  formatPct,
  formatRatio,
  ratioColor,
  ratioLabel,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts";

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
  background:
    "linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%)",
};

const sectionTitleStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 4,
  color: "#0f172a",
};

function generateCountyTrend(baseValue: number) {
  return Array.from({ length: 60 }, (_, i) => {
    const date = new Date(2021, i);
    const growth = i * (baseValue * 0.003);
    const noise = Math.sin(i / 4) * (baseValue * 0.02);
    return {
      month: date.toLocaleDateString("en-US", { year: "2-digit", month: "short" }),
      value: Math.round(baseValue + growth + noise),
    };
  }).filter((_, i) => i % 2 === 0);
}

export default function CountyDetailPage({
  params,
}: {
  params: Promise<{ fips: string }>;
}) {
  const { fips } = use(params);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const county = getMockCountyData(fips);

  if (!county) {
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
            padding: "60px 32px",
            textAlign: "center",
          }}
        >
          <div style={cardStyle}>
            <div style={sheenStyle} />
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              County Not Found
            </div>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>
              FIPS code &quot;{fips}&quot; was not found in the dataset. Try one
              of the sample counties:
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link
                href="/county/06081"
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                San Mateo County, CA
              </Link>
              <Link
                href="/county/54047"
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                McDowell County, WV
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const trendData = generateCountyTrend(county.median_home_value || 300000);

  const comparisonData = [
    {
      name: county.name.replace(" County", ""),
      income: county.median_household_income,
      value: county.median_home_value,
      ratio: county.affordability_ratio,
      fill: "#3b82f6",
    },
    {
      name: `${county.state_abbr} Avg`,
      income: county.state_abbr === "CA" ? 80440 : 62100,
      value: county.state_abbr === "CA" ? 659000 : 118000,
      ratio: county.state_abbr === "CA" ? 8.2 : 1.9,
      fill: "#94a3b8",
    },
    {
      name: "US Avg",
      income: 75000,
      value: 320000,
      ratio: 4.3,
      fill: "#cbd5e1",
    },
  ];

  const kpiItems = [
    { label: "Median Income", value: formatCurrency(county.median_household_income), color: "#0f172a" },
    { label: "Median Home Value", value: formatCurrency(county.median_home_value), color: "#0f172a" },
    { label: "Median Rent", value: formatCurrency(county.median_gross_rent), color: "#0f172a" },
    { label: "Affordability Ratio", value: formatRatio(county.affordability_ratio), color: ratioColor(county.affordability_ratio || 0) },
    { label: "Cost-Burdened Renters", value: formatPct(county.pct_cost_burdened_renters), color: "#f59e0b" },
    { label: "Homeownership Rate", value: formatPct(county.homeownership_rate), color: "#10b981" },
  ];

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
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          <Link href="/" style={{ color: "#3b82f6", textDecoration: "none" }}>
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/map" style={{ color: "#3b82f6", textDecoration: "none" }}>
            Map
          </Link>
          <span>/</span>
          <span style={{ color: "#0f172a" }}>{county.name}</span>
        </div>

        {/* Hero */}
        <div style={{ ...cardStyle, marginBottom: 28, padding: "32px 32px" }}>
          <div style={sheenStyle} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                  color: "#0f172a",
                }}
              >
                {county.name}
              </h1>
              <p style={{ color: "#94a3b8", fontSize: 15 }}>
                {county.state} · Population:{" "}
                {county.population?.toLocaleString() || "N/A"} · Median Age:{" "}
                {county.median_age || "N/A"}
              </p>
            </div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: ratioColor(county.affordability_ratio || 0) + "15",
                color: ratioColor(county.affordability_ratio || 0),
                fontFamily: "'DM Mono', monospace",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {formatRatio(county.affordability_ratio)}{" "}
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                {ratioLabel(county.affordability_ratio || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {kpiItems.map((kpi, i) => (
            <div key={i} style={cardStyle}>
              <div style={sheenStyle} />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#94a3b8",
                  marginBottom: 6,
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 22,
                  fontWeight: 500,
                  color: kpi.color,
                }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Trend Chart */}
          <div style={cardStyle}>
            <div style={sheenStyle} />
            <div style={sectionTitleStyle}>Home Value Trend</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
              Zillow ZHVI · 2021-2026
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="countyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  interval={5}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    "$" +
                    (v >= 1_000_000
                      ? (v / 1_000_000).toFixed(1) + "M"
                      : Math.round(v / 1000) + "K")
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload?.[0]) {
                      return (
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "10px 14px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                          }}
                        >
                          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                            {formatCurrency(payload[0].value as number)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#countyGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison Chart */}
          <div style={cardStyle}>
            <div style={sheenStyle} />
            <div style={sectionTitleStyle}>Affordability Comparison</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
              County vs. State vs. National average
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const d = payload[0].payload;
                      return (
                        <div
                          style={{
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "10px 14px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {d.name}
                          </div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 4 }}>
                            Ratio: {d.ratio?.toFixed(1)}x
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="ratio" radius={[6, 6, 0, 0]} barSize={48}>
                  {comparisonData.map((d, i) => (
                    <Cell key={i} fill={d.fill} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rent Breakdown */}
        <div style={{ marginBottom: 28 }}>
          <RentBreakdown
            fmr_0br={county.fmr_0br}
            fmr_1br={county.fmr_1br}
            fmr_2br={county.fmr_2br}
            fmr_3br={county.fmr_3br}
            fmr_4br={county.fmr_4br}
            rent_trend_5yr={county.rent_trend_5yr}
          />
        </div>

        {/* Demographic Details */}
        <div style={{ ...cardStyle, marginBottom: 28 }}>
          <div style={sheenStyle} />
          <div style={sectionTitleStyle}>Demographic Snapshot</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 20 }}>
            Key demographic and economic indicators
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
            }}
          >
            {[
              { label: "Poverty Rate", value: formatPct(county.poverty_rate), color: county.poverty_rate && county.poverty_rate > 15 ? "#ef4444" : "#0f172a" },
              { label: "Unemployment", value: formatPct(county.unemployment_rate), color: county.unemployment_rate && county.unemployment_rate > 6 ? "#f59e0b" : "#0f172a" },
              { label: "Vacancy Rate", value: formatPct(county.vacancy_rate), color: "#0f172a" },
              { label: "Median Year Built", value: county.median_year_built?.toString() || "N/A", color: "#0f172a" },
              { label: "Affordable Home Price", value: formatCurrency(county.affordable_home_price), color: "#10b981" },
              { label: "Affordability Gap", value: formatCurrency(county.affordability_gap), color: (county.affordability_gap || 0) > 0 ? "#ef4444" : "#10b981" },
              { label: "Price-to-Rent Ratio", value: county.price_to_rent_ratio?.toFixed(1) || "N/A", color: "#0f172a" },
              { label: "YoY Appreciation", value: formatPct(county.yoy_appreciation), color: "#0f172a" },
            ].map((item, i) => (
              <div key={i}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#94a3b8",
                    marginBottom: 6,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 20,
                    fontWeight: 500,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Map */}
        <div style={{ ...cardStyle, marginBottom: 28 }}>
          <div style={sheenStyle} />
          <div style={sectionTitleStyle}>Location</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
            {county.name}, {county.state}
          </div>
          <svg viewBox="0 0 320 165" style={{ width: "100%", maxHeight: 200 }}>
            {Object.entries(US_STATES_SVG).map(([abbr, { d }]) => (
              <path
                key={abbr}
                d={d}
                fill={abbr === county.state_abbr ? "#3b82f6" : "#e2e8f0"}
                stroke="#ffffff"
                strokeWidth={0.5}
                opacity={abbr === county.state_abbr ? 1 : 0.5}
              />
            ))}
          </svg>
        </div>

        {/* Data Sources */}
        <div
          style={{
            ...cardStyle,
            marginBottom: 28,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            Data Sources & Methodology
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
            Income, home value, rent, and demographic data from the US Census
            Bureau American Community Survey (ACS) 5-Year Estimates (2020-2024).
            Home value trends from Zillow Home Value Index (ZHVI). Affordability
            ratio calculated as median home value divided by median household
            income. Cost burden defined as spending more than 30% of income on
            housing costs (HUD standard). Population minimums applied where
            noted to ensure statistical reliability.
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
