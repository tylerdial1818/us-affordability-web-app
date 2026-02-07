"use client";

import Link from "next/link";

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

const fmt = (n: number) =>
  "$" +
  (n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1000
      ? Math.round(n).toLocaleString()
      : String(n));

interface TableRow {
  rank: number;
  county: string;
  state: string;
  income: number;
  value: number;
  ratio: number;
  fips?: string;
}

interface TableSection {
  title: string;
  data: TableRow[];
  accent: string;
}

interface TopBottomTableProps {
  sections: TableSection[];
}

export default function TopBottomTable({ sections }: TopBottomTableProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 28,
      }}
    >
      {sections.map(({ title, data, accent }, ti) => (
        <div key={ti} style={cardStyle}>
          <div style={sheenStyle} />
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 4,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 4,
                height: 20,
                borderRadius: 2,
                background: accent,
              }}
            />
            {title}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
            Min population 10,000
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["#", "County", "St", "Income", "Value", "Ratio"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "County" ? "left" : "right",
                      padding: "8px 6px",
                      color: "#64748b",
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.rank}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#f1f5f9")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 6px",
                      color: "#64748b",
                    }}
                  >
                    {row.rank}
                  </td>
                  <td
                    style={{
                      textAlign: "left",
                      padding: "10px 6px",
                      color: "#0f172a",
                      fontWeight: 500,
                    }}
                  >
                    {row.fips ? (
                      <Link
                        href={`/county/${row.fips}`}
                        style={{ color: "#0f172a", textDecoration: "none" }}
                      >
                        {row.county}
                      </Link>
                    ) : (
                      row.county
                    )}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 6px",
                      color: "#94a3b8",
                    }}
                  >
                    {row.state}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 6px",
                      color: "#94a3b8",
                    }}
                  >
                    {fmt(row.income)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 6px",
                      color: "#94a3b8",
                    }}
                  >
                    {fmt(row.value)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 6px",
                      fontWeight: 700,
                      color: accent,
                    }}
                  >
                    {row.ratio}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
