"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/shared/Navigation";
import Footer from "@/components/shared/Footer";

/* ─── Shared Style Objects ─────────────────────────────────────── */

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

const bodyTextStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  lineHeight: 1.8,
  color: "#475569",
};

const formulaLabelStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 15,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 4,
};

const formulaCodeStyle = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 13,
  color: "#6366f1",
  background: "#f1f5f9",
  padding: "4px 10px",
  borderRadius: 6,
  display: "inline-block" as const,
  marginBottom: 4,
};

const formulaDescStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: "#64748b",
  lineHeight: 1.6,
};

/* ─── Page Component ───────────────────────────────────────────── */

export default function MethodologyPage() {
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
          maxWidth: 960,
          margin: "0 auto",
          padding: "28px 32px",
          opacity: animIn ? 1 : 0,
          transform: animIn ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
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
            Overview
          </Link>
          <span>/</span>
          <span style={{ color: "#0f172a" }}>Methodology</span>
        </div>

        {/* ── Page Header ─────────────────────────────────────────── */}
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
            Methodology
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15, fontWeight: 400 }}>
            How HousingPulse calculates affordability metrics and where the data
            comes from.
          </p>
        </div>

        {/* ── Section 1: Data Sources ─────────────────────────────── */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={sheenStyle} />
          <div style={sectionTitleStyle}>Data Sources</div>
          <div
            style={{ color: "#94a3b8", fontSize: 12, marginBottom: 20 }}
          >
            Primary datasets powering HousingPulse
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* ACS */}
            <div>
              <div style={formulaLabelStyle}>
                US Census Bureau &mdash; American Community Survey (ACS)
                5-Year Estimates, 2020-2024
              </div>
              <div style={bodyTextStyle}>
                The ACS provides the foundational demographic and economic
                data used throughout HousingPulse. We source median household
                income, median home value, median gross rent, poverty rates,
                unemployment rates, housing unit counts (owner-occupied,
                renter-occupied, vacant), and median year built at the county
                level. The 5-year estimates are used instead of 1-year
                estimates for greater statistical reliability, especially for
                smaller geographies.
              </div>
            </div>

            {/* Zillow */}
            <div>
              <div style={formulaLabelStyle}>
                Zillow Research &mdash; Zillow Home Value Index (ZHVI)
              </div>
              <div style={bodyTextStyle}>
                ZHVI provides monthly time-series data on typical home values
                at the county level. We use ZHVI to generate home value
                trends, year-over-year appreciation rates, and five-year
                compound annual growth rates (CAGR). ZHVI represents the
                typical home value for a region, smoothed and seasonally
                adjusted, covering the 35th to 65th percentile range of home
                values.
              </div>
            </div>

            {/* TIGER */}
            <div>
              <div style={formulaLabelStyle}>
                US Census Bureau &mdash; TIGER/Line Shapefiles
              </div>
              <div style={bodyTextStyle}>
                TIGER/Line boundary files provide the geographic shapes used
                to render county and state boundaries on the interactive map.
                These are paired with FIPS codes to link geographic boundaries
                to their corresponding ACS data records.
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Key Formulas ─────────────────────────────── */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={sheenStyle} />
          <div style={sectionTitleStyle}>Key Formulas</div>
          <div
            style={{ color: "#94a3b8", fontSize: 12, marginBottom: 20 }}
          >
            How each metric is calculated
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* Affordability Ratio */}
            <div>
              <div style={formulaLabelStyle}>Affordability Ratio</div>
              <div style={formulaCodeStyle}>
                affordability_ratio = median_home_value / median_household_income
              </div>
              <div style={formulaDescStyle}>
                The ratio of the typical home price to the typical annual
                household income. A ratio of 3.0x or below is generally
                considered &quot;affordable,&quot; 3.0-5.0x is
                &quot;moderate,&quot; 5.0-7.0x is &quot;stretched,&quot; and
                above 7.0x is &quot;severely unaffordable.&quot; This is the
                primary metric used across HousingPulse.
              </div>
            </div>

            {/* Affordable Home Price */}
            <div>
              <div style={formulaLabelStyle}>
                Affordable Home Price (3x Rule)
              </div>
              <div style={formulaCodeStyle}>
                affordable_home_price = median_household_income * 3
              </div>
              <div style={formulaDescStyle}>
                The maximum home price considered affordable based on the
                widely-used 3x income guideline. If a household earns $75,000
                per year, the affordable home price threshold is $225,000.
                This is used as a benchmark to calculate the affordability
                gap.
              </div>
            </div>

            {/* Affordability Gap */}
            <div>
              <div style={formulaLabelStyle}>Affordability Gap</div>
              <div style={formulaCodeStyle}>
                affordability_gap = median_home_value -
                affordable_home_price
              </div>
              <div style={formulaDescStyle}>
                The dollar difference between the typical home price and what
                a typical household can afford. A positive gap means the
                median home is more expensive than what the median household
                can afford; a negative gap means the median home is within
                reach.
              </div>
            </div>

            {/* Cost Burden Rate */}
            <div>
              <div style={formulaLabelStyle}>Cost Burden Rate</div>
              <div style={formulaCodeStyle}>
                cost_burden_rate = cost_burdened_households /
                total_households * 100
              </div>
              <div style={formulaDescStyle}>
                The percentage of households spending more than 30% of their
                gross income on housing costs, following the HUD definition.
                We report separate rates for renters and homeowners. A high
                cost burden rate indicates that many residents in the area
                are financially strained by housing expenses.
              </div>
            </div>

            {/* Homeownership Rate */}
            <div>
              <div style={formulaLabelStyle}>Homeownership Rate</div>
              <div style={formulaCodeStyle}>
                homeownership_rate = owner_occupied / (owner_occupied +
                renter_occupied) * 100
              </div>
              <div style={formulaDescStyle}>
                The percentage of occupied housing units that are
                owner-occupied. This metric indicates the relative balance
                between homeowners and renters in a given area. Vacant units
                are excluded from the denominator.
              </div>
            </div>

            {/* Vacancy Rate */}
            <div>
              <div style={formulaLabelStyle}>Vacancy Rate</div>
              <div style={formulaCodeStyle}>
                vacancy_rate = vacant_units / total_housing_units * 100
              </div>
              <div style={formulaDescStyle}>
                The percentage of total housing units that are vacant.
                High vacancy rates can signal economic distress, seasonal
                housing markets, or areas with excess housing supply.
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: The 3x Rule ──────────────────────────────── */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={sheenStyle} />
          <div style={sectionTitleStyle}>The 3x Income Rule</div>
          <div
            style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}
          >
            The guideline behind our affordability benchmark
          </div>
          <div style={bodyTextStyle}>
            The &quot;3x rule&quot; is a longstanding guideline in personal
            finance and housing policy that suggests a household should spend
            no more than three times its annual gross income on a home
            purchase. It is widely cited by financial advisors and was
            historically used by lenders as a rough qualification threshold.
          </div>
          <div style={{ ...bodyTextStyle, marginTop: 12 }}>
            HousingPulse uses this rule as a{" "}
            <span style={{ fontWeight: 600 }}>
              standardized benchmark for comparison
            </span>
            , not as personalized financial advice. Actual affordability
            depends on many individual factors including debt obligations,
            down payment savings, interest rates, property taxes, insurance
            costs, and local cost of living. The 3x rule is intentionally
            conservative and provides a consistent baseline for comparing
            areas against one another.
          </div>
          <div style={{ ...bodyTextStyle, marginTop: 12 }}>
            Some modern guidelines suggest that up to 4-5x income may be
            acceptable in low-interest-rate environments. HousingPulse
            retains the 3x threshold because it is the most widely
            recognized benchmark and produces the most cautious
            affordability assessments.
          </div>
        </div>

        {/* ── Section 4: Limitations ──────────────────────────────── */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={sheenStyle} />
          <div style={sectionTitleStyle}>Limitations</div>
          <div
            style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}
          >
            Important caveats when interpreting this data
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {[
              {
                title: "ACS data has an inherent time lag.",
                desc: "The 5-year ACS estimates reflect data collected over the 2020-2024 period and may not capture very recent economic shifts, rapid price changes, or post-pandemic recovery dynamics.",
              },
              {
                title: "Medians mask distributional variation.",
                desc: "Median household income and median home value are single-point summaries. They do not show the full range of incomes or home prices within a county. An area with a moderate median ratio may still contain pockets of severe unaffordability or deep affordability.",
              },
              {
                title: "This is not financial advice.",
                desc: "HousingPulse is an informational tool for exploring housing affordability patterns. It does not account for individual financial circumstances, mortgage rates, credit scores, or other factors. Always consult a qualified financial advisor before making housing decisions.",
              },
              {
                title:
                  "Small geographies have higher margins of error.",
                desc: "ACS estimates for counties with small populations (generally under 20,000) carry larger margins of error (MOE). HousingPulse flags small-sample areas where applicable, but users should treat data for these areas as approximate.",
              },
              {
                title: "Zillow ZHVI does not cover every county.",
                desc: "ZHVI data is available for approximately 2,200 of the ~3,100 US counties. Rural and sparsely populated areas are less likely to have ZHVI coverage. Where ZHVI is unavailable, HousingPulse falls back to ACS median home value estimates for trend approximations.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#94a3b8",
                    marginTop: 2,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: 2,
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={formulaDescStyle}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 5: Attribution Footer ───────────────────────── */}
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
            Attribution
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
            HousingPulse uses publicly available data from the US Census
            Bureau and Zillow Research. Census data is sourced from the
            American Community Survey (ACS) 5-Year Estimates via the Census
            API and data.census.gov. Zillow Home Value Index (ZHVI) data is
            provided by Zillow Research and is available at{" "}
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                color: "#3b82f6",
              }}
            >
              zillow.com/research/data
            </span>
            . Geographic boundaries are from the Census TIGER/Line program.
            All data is used in accordance with each provider&apos;s terms of
            use. HousingPulse is an independent project and is not affiliated
            with, endorsed by, or sponsored by the US Census Bureau or Zillow
            Group.
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
