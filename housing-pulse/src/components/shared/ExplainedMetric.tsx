"use client";

import { useState } from "react";

const GLOSSARY: Record<string, string> = {
  "Affordability Ratio":
    "How many years of income the typical home costs. Under 3x is considered affordable. Over 5x means most families would struggle to buy.",
  "Cost-Burdened":
    "A household spending more than 30% of income on housing. This is the US Dept. of Housing and Urban Development\u2019s threshold for financial strain.",
  "Median Home Value":
    "The middle value \u2014 half of homes cost more, half less. More reliable than averages, which can be skewed by a few expensive homes.",
  "Median Household Income":
    "The middle income for all households in the area. Includes all earners in the household combined.",
  "3x Income Rule":
    "A widely-used guideline: you can comfortably afford a home costing about 3\u00d7 your annual income. Assumes ~20% down payment and typical mortgage terms. It\u2019s a rough guide \u2014 your real budget depends on debts, savings, and interest rates.",
  "Census Tract":
    "A small area defined by the Census Bureau, typically 1,200\u20138,000 people. Roughly equivalent to a neighborhood.",
  "ACS 5-Year Estimates":
    "Census data collected over 5 years and averaged. More reliable than single-year data for small areas, but may not reflect very recent changes.",
  "Median Gross Rent":
    "The middle rent amount \u2014 half of renters pay more, half less. Includes estimated utility costs.",
  "Vacancy Rate":
    "The percentage of housing units that are unoccupied. High vacancy can indicate a weak market or seasonal housing.",
  "Homeownership Rate":
    "The percentage of occupied housing units that are owner-occupied rather than rented.",
};

interface ExplainedMetricProps {
  term: string;
  children?: React.ReactNode;
}

export default function ExplainedMetric({ term, children }: ExplainedMetricProps) {
  const [open, setOpen] = useState(false);
  const definition = GLOSSARY[term];

  if (!definition) return <>{children}</>;

  return (
    <span style={{ position: "relative", display: "inline" }}>
      {children}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1px solid #cbd5e1",
          background: open ? "#2563eb" : "transparent",
          color: open ? "#fff" : "#94a3b8",
          fontSize: 10,
          fontWeight: 700,
          cursor: "pointer",
          marginLeft: 6,
          verticalAlign: "middle",
          lineHeight: 1,
          transition: "all 0.2s",
        }}
        aria-label={`What is ${term}?`}
      >
        i
      </button>
      {open && (
        <span
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: 280,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "12px 16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.10)",
            zIndex: 50,
            fontSize: 12,
            color: "#475569",
            lineHeight: 1.6,
            fontWeight: 400,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span
            style={{
              display: "block",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 4,
              fontSize: 13,
            }}
          >
            {term}
          </span>
          {definition}
        </span>
      )}
    </span>
  );
}
