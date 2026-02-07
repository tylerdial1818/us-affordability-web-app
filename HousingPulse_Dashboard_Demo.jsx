import { useState, useEffect, useRef, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";

// ─── MOCK DATA ───────────────────────────────────────────────────
const NATIONAL_TREND = Array.from({ length: 120 }, (_, i) => {
  const date = new Date(2016, i);
  const base = 220000 + i * 1200 + Math.sin(i / 6) * 5000;
  const covid = i > 48 ? (i - 48) * 2800 : 0;
  const correction = i > 84 ? -(i - 84) * 400 : 0;
  return {
    month: date.toLocaleDateString("en-US", { year: "2-digit", month: "short" }),
    value: Math.round(base + covid + correction),
    year: date.getFullYear(),
    idx: i,
  };
});

const INCOME_TREND = Array.from({ length: 120 }, (_, i) => ({
  month: NATIONAL_TREND[i].month,
  income: Math.round(62000 + i * 180 + Math.sin(i / 12) * 1000),
  idx: i,
}));

const AFFORDABILITY_TREND = NATIONAL_TREND.map((d, i) => ({
  month: d.month,
  ratio: +(d.value / INCOME_TREND[i].income).toFixed(2),
  idx: i,
}));

const STATES = [
  { name: "California", abbr: "CA", ratio: 8.2, value: 659000, income: 80440 },
  { name: "Hawaii", abbr: "HI", ratio: 8.9, value: 722000, income: 81275 },
  { name: "Massachusetts", abbr: "MA", ratio: 6.4, value: 481000, income: 75000 },
  { name: "New York", abbr: "NY", ratio: 5.9, value: 384000, income: 65000 },
  { name: "Colorado", abbr: "CO", ratio: 5.7, value: 415000, income: 72845 },
  { name: "Washington", abbr: "WA", ratio: 5.5, value: 410000, income: 74500 },
  { name: "Oregon", abbr: "OR", ratio: 5.3, value: 372000, income: 70210 },
  { name: "New Jersey", abbr: "NJ", ratio: 5.1, value: 395000, income: 77500 },
  { name: "Utah", abbr: "UT", ratio: 5.6, value: 420000, income: 75000 },
  { name: "Florida", abbr: "FL", ratio: 5.0, value: 330000, income: 66000 },
  { name: "Nevada", abbr: "NV", ratio: 4.8, value: 345000, income: 71900 },
  { name: "Arizona", abbr: "AZ", ratio: 4.5, value: 310000, income: 68900 },
  { name: "Montana", abbr: "MT", ratio: 4.9, value: 295000, income: 60200 },
  { name: "Idaho", abbr: "ID", ratio: 4.7, value: 310000, income: 65900 },
  { name: "Virginia", abbr: "VA", ratio: 4.2, value: 330000, income: 78500 },
  { name: "Maryland", abbr: "MD", ratio: 4.3, value: 352000, income: 81900 },
  { name: "Connecticut", abbr: "CT", ratio: 4.6, value: 310000, income: 67300 },
  { name: "Georgia", abbr: "GA", ratio: 3.6, value: 245000, income: 68200 },
  { name: "North Carolina", abbr: "NC", ratio: 3.4, value: 230000, income: 67600 },
  { name: "Texas", abbr: "TX", ratio: 3.5, value: 238000, income: 68000 },
  { name: "Tennessee", abbr: "TN", ratio: 3.3, value: 222000, income: 67300 },
  { name: "Pennsylvania", abbr: "PA", ratio: 3.2, value: 218000, income: 68100 },
  { name: "Michigan", abbr: "MI", ratio: 2.7, value: 180000, income: 66700 },
  { name: "Ohio", abbr: "OH", ratio: 2.6, value: 170000, income: 65400 },
  { name: "Indiana", abbr: "IN", ratio: 2.5, value: 165000, income: 66000 },
  { name: "Iowa", abbr: "IA", ratio: 2.3, value: 155000, income: 67400 },
  { name: "Kansas", abbr: "KS", ratio: 2.4, value: 160000, income: 66700 },
  { name: "Missouri", abbr: "MO", ratio: 2.5, value: 168000, income: 67200 },
  { name: "Oklahoma", abbr: "OK", ratio: 2.2, value: 142000, income: 64500 },
  { name: "Arkansas", abbr: "AR", ratio: 2.1, value: 135000, income: 64300 },
  { name: "Mississippi", abbr: "MS", ratio: 2.0, value: 125000, income: 62500 },
  { name: "West Virginia", abbr: "WV", ratio: 1.9, value: 118000, income: 62100 },
].sort((a, b) => b.ratio - a.ratio);

const SCATTER_DATA = STATES.map((s) => ({
  ...s,
  pop: Math.round(Math.random() * 30 + 2) * 1000000,
  region: ["CA", "HI", "WA", "OR", "NV", "AZ", "UT", "CO", "ID", "MT"].includes(s.abbr) ? "West" : ["NY", "MA", "NJ", "CT", "PA", "MD", "VA"].includes(s.abbr) ? "Northeast" : ["TX", "FL", "GA", "NC", "TN", "AR", "MS", "OK", "WV"].includes(s.abbr) ? "South" : "Midwest",
}));

const COST_BURDEN = [
  { name: "Severely Burdened\n(>50%)", value: 14.2, color: "#ef4444" },
  { name: "Cost Burdened\n(30-50%)", value: 16.8, color: "#f59e0b" },
  { name: "Not Burdened\n(<30%)", value: 69.0, color: "#10b981" },
];

const TOP_AFFORDABLE = [
  { rank: 1, county: "McDowell County", state: "WV", income: 27800, value: 38500, ratio: 1.4 },
  { rank: 2, county: "Macon County", state: "AL", income: 31200, value: 52000, ratio: 1.7 },
  { rank: 3, county: "Sumter County", state: "AL", income: 25600, value: 48900, ratio: 1.9 },
  { rank: 4, county: "Phillips County", state: "AR", income: 30100, value: 58200, ratio: 1.9 },
  { rank: 5, county: "Holmes County", state: "MS", income: 24800, value: 50000, ratio: 2.0 },
];

const LEAST_AFFORDABLE = [
  { rank: 1, county: "San Mateo County", state: "CA", income: 136800, value: 1540000, ratio: 11.3 },
  { rank: 2, county: "Santa Clara County", state: "CA", income: 143600, value: 1490000, ratio: 10.4 },
  { rank: 3, county: "San Francisco", state: "CA", income: 126800, value: 1250000, ratio: 9.9 },
  { rank: 4, county: "Maui County", state: "HI", income: 85400, value: 835000, ratio: 9.8 },
  { rank: 5, county: "Nantucket County", state: "MA", income: 102500, value: 985000, ratio: 9.6 },
];

// ─── HELPERS ─────────────────────────────────────────────────────
const fmt = (n) => "$" + (n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? Math.round(n).toLocaleString() : n);
const fmtK = (n) => (n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? Math.round(n / 1000) + "K" : n);

const ratioColor = (r) => r >= 7 ? "#ef4444" : r >= 5 ? "#f97316" : r >= 3 ? "#f59e0b" : "#10b981";
const ratioLabel = (r) => r >= 7 ? "Severely Unaffordable" : r >= 5 ? "Stretched" : r >= 3 ? "Moderate" : "Affordable";

const REGION_COLORS = { West: "#6366f1", Northeast: "#06b6d4", South: "#f59e0b", Midwest: "#10b981" };

// ─── MAP COMPONENT (SVG US Counties) ────────────────────────────
// Simplified US state outlines for demo
const US_STATES_SVG = {
  WA:{d:"M62,18L78,14L84,18L86,36L78,38L62,34Z",c:[-120.7,47.4]},
  OR:{d:"M56,38L82,36L86,56L76,64L54,58Z",c:[-120.5,43.8]},
  CA:{d:"M52,60L76,64L80,90L72,118L48,114L44,80Z",c:[-119.4,36.8]},
  NV:{d:"M76,64L86,56L92,72L84,98L72,96Z",c:[-116.4,38.8]},
  ID:{d:"M84,18L92,16L98,26L96,52L86,56L84,36Z",c:[-114.7,44.1]},
  MT:{d:"M92,16L130,12L132,34L96,38Z",c:[-109.6,46.9]},
  UT:{d:"M86,56L96,52L98,58L96,82L84,80L82,72Z",c:[-111.5,39.3]},
  AZ:{d:"M72,96L84,98L86,118L74,126L60,120Z",c:[-111.1,34.0]},
  CO:{d:"M98,58L126,56L128,78L100,80Z",c:[-105.5,39.0]},
  WY:{d:"M96,38L132,34L130,56L98,58Z",c:[-107.3,43.0]},
  NM:{d:"M86,100L100,98L102,128L84,130L76,126Z",c:[-106.2,34.5]},
  ND:{d:"M132,12L164,12L164,30L132,30Z",c:[-100.5,47.5]},
  SD:{d:"M132,30L164,30L164,48L132,48Z",c:[-100.0,43.9]},
  NE:{d:"M126,48L164,48L166,62L128,64Z",c:[-99.9,41.5]},
  KS:{d:"M128,64L166,62L168,80L130,82Z",c:[-98.5,38.5]},
  OK:{d:"M130,82L168,80L172,88L160,98L130,96Z",c:[-97.5,35.0]},
  TX:{d:"M120,98L160,98L172,100L168,140L142,152L112,142L108,118Z",c:[-99.9,31.9]},
  MN:{d:"M164,12L192,14L192,38L164,38Z",c:[-94.6,46.0]},
  IA:{d:"M166,38L192,38L194,56L168,56Z",c:[-93.0,42.0]},
  MO:{d:"M168,58L196,56L200,78L176,84L170,80Z",c:[-91.8,38.6]},
  AR:{d:"M176,84L200,80L202,100L178,102Z",c:[-92.2,34.7]},
  LA:{d:"M178,102L202,100L208,118L192,126L180,120Z",c:[-91.9,31.2]},
  WI:{d:"M192,14L214,16L216,38L194,38Z",c:[-89.6,43.8]},
  IL:{d:"M196,40L216,38L218,66L200,70L198,56Z",c:[-89.4,40.6]},
  MS:{d:"M202,100L214,98L218,126L208,128L204,118Z",c:[-89.7,32.3]},
  MI:{d:"M216,12L234,14L232,36L216,34Z",c:[-84.5,44.3]},
  IN:{d:"M218,40L232,38L234,62L220,64Z",c:[-86.1,40.3]},
  OH:{d:"M234,36L252,34L254,56L236,58Z",c:[-82.8,40.4]},
  KY:{d:"M220,66L254,58L258,72L228,76L222,74Z",c:[-84.3,37.8]},
  TN:{d:"M218,78L260,72L262,84L222,86Z",c:[-86.6,35.5]},
  AL:{d:"M218,88L236,86L240,114L222,116Z",c:[-86.9,32.3]},
  GA:{d:"M238,86L258,84L262,112L244,116Z",c:[-83.5,32.2]},
  FL:{d:"M240,116L268,112L278,130L266,152L250,140L242,126Z",c:[-81.5,27.7]},
  SC:{d:"M258,82L272,78L270,96L252,96Z",c:[-81.2,34.0]},
  NC:{d:"M252,72L280,68L282,78L256,82Z",c:[-79.0,35.8]},
  VA:{d:"M256,60L282,56L284,68L262,72Z",c:[-78.7,37.4]},
  WV:{d:"M254,52L264,50L266,62L256,66Z",c:[-80.5,38.6]},
  PA:{d:"M252,34L282,30L284,44L256,46Z",c:[-77.2,41.2]},
  NY:{d:"M264,16L290,12L288,32L262,34Z",c:[-75.5,43.0]},
  VT:{d:"M284,10L290,8L292,20L286,22Z",c:[-72.6,44.6]},
  NH:{d:"M290,8L296,8L294,22L290,20Z",c:[-71.6,43.2]},
  ME:{d:"M296,4L306,2L304,20L294,18Z",c:[-69.4,45.3]},
  MA:{d:"M288,26L302,24L302,30L290,30Z",c:[-71.5,42.4]},
  CT:{d:"M288,32L298,30L298,36L290,36Z",c:[-72.8,41.6]},
  NJ:{d:"M282,34L290,32L290,46L284,44Z",c:[-74.4,40.1]},
  DE:{d:"M282,44L288,44L288,50L284,50Z",c:[-75.5,39.2]},
  MD:{d:"M272,48L286,46L288,54L274,56Z",c:[-76.6,39.0]},
};

function USMap({ selectedMetric, incomeRange }) {
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const getStateColor = (abbr) => {
    const s = STATES.find(st => st.abbr === abbr);
    if (!s) return "#f1f5f9";
    if (s.income < incomeRange[0] * 1000 || s.income > incomeRange[1] * 1000) return "#e2e8f0";
    
    let val;
    if (selectedMetric === "ratio") val = s.ratio;
    else if (selectedMetric === "value") val = s.value / 100000;
    else if (selectedMetric === "income") val = s.income / 10000;
    else val = s.ratio;

    if (selectedMetric === "ratio") {
      if (val < 3) return "#059669";
      if (val < 4) return "#10b981";
      if (val < 5) return "#fbbf24";
      if (val < 6) return "#f97316";
      if (val < 7) return "#ef4444";
      return "#dc2626";
    }
    if (selectedMetric === "value") {
      if (val < 2) return "#059669";
      if (val < 3) return "#10b981";
      if (val < 4) return "#fbbf24";
      if (val < 5) return "#f97316";
      return "#ef4444";
    }
    return "#3b82f6";
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg viewBox="0 0 320 165" style={{ width: "100%", height: "100%" }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
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
              opacity: (() => {
                const s = STATES.find(st => st.abbr === abbr);
                if (!s) return 0.3;
                if (s.income < incomeRange[0] * 1000 || s.income > incomeRange[1] * 1000) return 0.15;
                return 1;
              })(),
            }}
            onMouseEnter={(e) => {
              setHoveredState(abbr);
              const s = STATES.find(st => st.abbr === abbr);
              if (s) {
                const rect = e.target.getBoundingClientRect();
                setTooltip({ ...s, x: rect.left + rect.width / 2, y: rect.top - 10 });
              }
            }}
            onMouseLeave={() => { setHoveredState(null); setTooltip(null); }}
          />
        ))}
        {/* Alaska inset */}
        <g transform="translate(30,120) scale(0.35)">
          <rect x="-2" y="-2" width="60" height="40" rx="3" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
          <path d="M5,25L15,10L30,8L45,15L50,30L35,32L15,30Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
          <text x="25" y="38" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">AK</text>
        </g>
        {/* Hawaii inset */}
        <g transform="translate(85,130) scale(0.35)">
          <rect x="-2" y="-2" width="50" height="30" rx="3" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
          <circle cx="12" cy="14" r="4" fill={getStateColor("HI")} stroke="#cbd5e1" strokeWidth="0.5" />
          <circle cx="22" cy="12" r="5" fill={getStateColor("HI")} stroke="#cbd5e1" strokeWidth="0.5" />
          <circle cx="32" cy="10" r="3" fill={getStateColor("HI")} stroke="#cbd5e1" strokeWidth="0.5" />
          <text x="22" y="26" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">HI</text>
        </g>
      </svg>
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x,
          top: tooltip.y,
          transform: "translate(-50%, -100%)",
          background: "#ffffff", boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "14px 18px",
          pointerEvents: "none",
          zIndex: 1000,
          minWidth: 220,
          boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
        }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{tooltip.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontFamily: "'DM Mono',monospace", fontSize: 12 }}>
            <span style={{ color: "#94a3b8" }}>Income</span><span style={{ color: "#0f172a", textAlign: "right" }}>{fmt(tooltip.income)}</span>
            <span style={{ color: "#94a3b8" }}>Home Value</span><span style={{ color: "#0f172a", textAlign: "right" }}>{fmt(tooltip.value)}</span>
            <span style={{ color: "#94a3b8" }}>Ratio</span>
            <span style={{ textAlign: "right", fontWeight: 700, color: ratioColor(tooltip.ratio) }}>
              {tooltip.ratio.toFixed(1)}x
            </span>
          </div>
          <div style={{
            marginTop: 8,
            padding: "4px 8px",
            borderRadius: 6,
            background: ratioColor(tooltip.ratio) + "20",
            color: ratioColor(tooltip.ratio),
            fontSize: 11,
            fontWeight: 600,
            textAlign: "center",
            fontFamily: "'DM Mono',monospace",
          }}>
            {ratioLabel(tooltip.ratio)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [mapMetric, setMapMetric] = useState("ratio");
  const [incomeRange, setIncomeRange] = useState([20, 160]);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => { 
    setTimeout(() => setAnimIn(true), 100);
    // Load fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const switchPage = (p) => {
    setAnimIn(false);
    setTimeout(() => { setPage(p); setAnimIn(true); }, 300);
  };

  const currentValue = NATIONAL_TREND[NATIONAL_TREND.length - 1].value;
  const yoyValue = NATIONAL_TREND[NATIONAL_TREND.length - 13]?.value || currentValue;
  const yoyPct = (((currentValue - yoyValue) / yoyValue) * 100).toFixed(1);

  const currentIncome = INCOME_TREND[INCOME_TREND.length - 1].income;
  const yoyIncome = INCOME_TREND[INCOME_TREND.length - 13]?.income || currentIncome;
  const yoyIncomePct = (((currentIncome - yoyIncome) / yoyIncome) * 100).toFixed(1);

  const currentRatio = AFFORDABILITY_TREND[AFFORDABILITY_TREND.length - 1].ratio;

  // Styles
  const S = {
    app: {
      background: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
      color: "#0f172a",
      overflow: "hidden",
    },
    nav: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 32px",
      borderBottom: "1px solid #e2e8f0",
      background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    logo: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: "#0f172a",
      
      
    },
    navBtn: (active) => ({
      padding: "8px 20px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: "0.02em",
      transition: "all 0.3s",
      background: active ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "transparent",
      color: active ? "#ffffff" : "#475569",
    }),
    content: {
      maxWidth: 1360,
      margin: "0 auto",
      padding: "28px 32px",
      opacity: animIn ? 1 : 0,
      transform: animIn ? "translateY(0)" : "translateY(20px)",
      transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    card: {
      background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: 24,
      position: "relative",
      overflow: "hidden",
    },
    cardSheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      background: "linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%)",
    },
    kpi: {
      fontFamily: "'DM Mono', monospace",
      fontSize: 34,
      fontWeight: 500,
      letterSpacing: "-0.02em",
      lineHeight: 1.1,
    },
    label: {
      fontSize: 12,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#94a3b8",
      marginBottom: 8,
    },
    sectionTitle: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 20,
      fontWeight: 700,
      marginBottom: 4,
      color: "#0f172a",
    },
  };

  const CustomTooltip = ({ active, payload, label, prefix = "$" }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "#ffffff", boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: "10px 14px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        }}>
          <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4, fontFamily: "'DM Mono',monospace" }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color || "#e2e8f0", fontSize: 14, fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>
              {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={S.app}>
      {/* Background grain */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.4, pointerEvents: "none", zIndex: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, #e2e8f0 0.5px, transparent 0)", backgroundSize: "24px 24px",
      }} />

      {/* Navigation */}
      <nav style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff",
          }}>H</div>
          <span style={S.logo}>HousingPulse</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
            background: "#dbeafe", color: "#2563eb", letterSpacing: "0.06em",
            fontFamily: "'DM Mono',monospace",
          }}>BETA</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={S.navBtn(page === "dashboard")} onClick={() => switchPage("dashboard")}>Dashboard</button>
          <button style={S.navBtn(page === "map")} onClick={() => switchPage("map")}>GIS Map</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Mono',monospace" }}>ACS 2020–2024</span>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
            border: "1px solid #e2e8f0",
          }} />
        </div>
      </nav>

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div style={S.content}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 6,
              color: "#0f172a",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              US Housing Affordability
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 15, fontWeight: 400 }}>
              National overview · Census ACS 5-Year + Zillow ZHVI · Updated Feb 2026
            </p>
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Median Home Value", value: fmt(currentValue), change: `▲ ${yoyPct}%`, changeColor: "#ef4444", sub: "National" },
              { label: "Median Household Income", value: fmt(currentIncome), change: `▲ ${yoyIncomePct}%`, changeColor: "#10b981", sub: "National" },
              { label: "Affordability Ratio", value: `${currentRatio}x`, change: ratioLabel(currentRatio), changeColor: ratioColor(currentRatio), sub: "Value ÷ Income" },
              { label: "Cost-Burdened Households", value: "31.0%", change: "▲ 1.2pp YoY", changeColor: "#f59e0b", sub: "Paying >30% on Housing" },
            ].map((kpi, i) => (
              <div key={i} style={{ ...S.card, animationDelay: `${i * 0.1}s` }}>
                <div style={S.cardSheen} />
                <div style={S.label}>{kpi.label}</div>
                <div style={S.kpi}>{kpi.value}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: kpi.changeColor, fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{kpi.change}</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{kpi.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trend Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={S.card}>
              <div style={S.cardSheen} />
              <div style={S.sectionTitle}>Home Values</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>National median · 2016–2026 · Zillow ZHVI</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={NATIONAL_TREND.filter((_, i) => i % 3 === 0)}>
                  <defs>
                    <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} interval={9} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + fmtK(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill="url(#homeGrad)" dot={false} />
                  <ReferenceLine x={NATIONAL_TREND[48]?.month} stroke="#475569" strokeDasharray="3 3" label={{ value: "COVID", fill: "#94a3b8", fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={S.card}>
              <div style={S.cardSheen} />
              <div style={S.sectionTitle}>Affordability Ratio</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>Home Value ÷ Income · Lower is better</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={AFFORDABILITY_TREND.filter((_, i) => i % 3 === 0)}>
                  <defs>
                    <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} interval={9} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} domain={[3, 6]} />
                  <Tooltip content={<CustomTooltip prefix="" />} />
                  <Area type="monotone" dataKey="ratio" stroke="#d97706" strokeWidth={2.5} fill="url(#ratioGrad)" dot={false} />
                  <ReferenceLine y={3} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Affordable", fill: "#10b981", fontSize: 10, position: "right" }} />
                  <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Stretched", fill: "#ef4444", fontSize: 10, position: "right" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* State Bar Chart */}
          <div style={{ ...S.card, marginBottom: 28 }}>
            <div style={S.cardSheen} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={S.sectionTitle}>State Affordability Rankings</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Affordability ratio by state · Sorted most → least expensive</div>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#10b981", marginRight: 4 }} />Affordable (&lt;3x)</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#f59e0b", marginRight: 4 }} />Moderate (3-5x)</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#ef4444", marginRight: 4 }} />Unaffordable (5x+)</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={STATES} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#e2e8f0" }} domain={[0, 10]} />
                <YAxis dataKey="abbr" type="category" width={30} tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
                        <div style={{ fontWeight: 700, marginBottom: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{d.name}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>
                          <div>Ratio: <span style={{ color: ratioColor(d.ratio), fontWeight: 700 }}>{d.ratio}x</span></div>
                          <div>Income: {fmt(d.income)}</div>
                          <div>Home: {fmt(d.value)}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="ratio" radius={[0, 4, 4, 0]} barSize={8}>
                  {STATES.map((s, i) => (
                    <Cell key={i} fill={ratioColor(s.ratio)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter + Cost Burden */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={S.card}>
              <div style={S.cardSheen} />
              <div style={S.sectionTitle}>Income vs. Home Value</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>Each dot = state · Color = region</div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11 }}>
                {Object.entries(REGION_COLORS).map(([r, c]) => (
                  <span key={r} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{r}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="income" name="Income" tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => "$" + fmtK(v)} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis dataKey="value" name="Home Value" tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => "$" + fmtK(v)} axisLine={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{d.name}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, marginTop: 4 }}>
                            Income: {fmt(d.income)} · Home: {fmt(d.value)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Scatter data={SCATTER_DATA}>
                    {SCATTER_DATA.map((d, i) => (
                      <Cell key={i} fill={REGION_COLORS[d.region]} fillOpacity={0.8} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div style={S.card}>
              <div style={S.cardSheen} />
              <div style={S.sectionTitle}>Cost Burden</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>US renter households · % of income on housing</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={COST_BURDEN}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {COST_BURDEN.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      return (
                        <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13 }}>
                            <span style={{ color: payload[0].payload.color, fontWeight: 700 }}>{payload[0].value}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {COST_BURDEN.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                      <span style={{ color: "#94a3b8" }}>{d.name.replace("\n", " ")}</span>
                    </div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, color: d.color }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            {[
              { title: "Most Affordable Counties", data: TOP_AFFORDABLE, accent: "#10b981" },
              { title: "Least Affordable Counties", data: LEAST_AFFORDABLE, accent: "#ef4444" },
            ].map(({ title, data, accent }, ti) => (
              <div key={ti} style={S.card}>
                <div style={S.cardSheen} />
                <div style={{ ...S.sectionTitle, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: accent }} />
                  {title}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>Min population 10,000</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      {["#", "County", "St", "Income", "Value", "Ratio"].map((h) => (
                        <th key={h} style={{ textAlign: h === "County" ? "left" : "right", padding: "8px 6px", color: "#64748b", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr key={row.rank} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                          onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"}
                          onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ textAlign: "right", padding: "10px 6px", color: "#64748b" }}>{row.rank}</td>
                        <td style={{ textAlign: "left", padding: "10px 6px", color: "#0f172a", fontWeight: 500 }}>{row.county}</td>
                        <td style={{ textAlign: "right", padding: "10px 6px", color: "#94a3b8" }}>{row.state}</td>
                        <td style={{ textAlign: "right", padding: "10px 6px", color: "#94a3b8" }}>{fmt(row.income)}</td>
                        <td style={{ textAlign: "right", padding: "10px 6px", color: "#94a3b8" }}>{fmt(row.value)}</td>
                        <td style={{ textAlign: "right", padding: "10px 6px", fontWeight: 700, color: accent }}>{row.ratio}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "20px 0 40px", color: "#94a3b8", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>
            Data: US Census Bureau ACS 2020–2024 · Zillow Research ZHVI · Census TIGER/Line Boundaries
          </div>
        </div>
      )}

      {/* MAP PAGE */}
      {page === "map" && (
        <div style={S.content}>
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, minHeight: "calc(100vh - 140px)" }}>
            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={S.card}>
                <div style={S.cardSheen} />
                <div style={S.sectionTitle}>Metric</div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>Select what the map displays</div>
                {[
                  { key: "ratio", label: "Affordability Ratio", desc: "Home Value ÷ Income" },
                  { key: "value", label: "Median Home Value", desc: "Dollar amount" },
                  { key: "income", label: "Median Income", desc: "Household annual" },
                ].map((m) => (
                  <button key={m.key} onClick={() => setMapMetric(m.key)} style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: mapMetric === m.key ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                    background: mapMetric === m.key ? "#3b82f620" : "transparent",
                    color: mapMetric === m.key ? "#e2e8f0" : "#94a3b8",
                    cursor: "pointer",
                    marginBottom: 6,
                    transition: "all 0.2s",
                    fontFamily: "'DM Sans',sans-serif",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              <div style={S.card}>
                <div style={S.cardSheen} />
                <div style={S.sectionTitle}>Income Filter</div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>Filter by median household income range</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 20, fontWeight: 500, color: "#0f172a", marginBottom: 12 }}>
                  ${incomeRange[0]}K – ${incomeRange[1]}K
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Minimum</label>
                  <input type="range" min={10} max={150} value={incomeRange[0]}
                    onChange={(e) => setIncomeRange([+e.target.value, Math.max(+e.target.value + 10, incomeRange[1])])}
                    style={{ width: "100%", accentColor: "#3b82f6" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Maximum</label>
                  <input type="range" min={20} max={200} value={incomeRange[1]}
                    onChange={(e) => setIncomeRange([Math.min(incomeRange[0], +e.target.value - 10), +e.target.value])}
                    style={{ width: "100%", accentColor: "#3b82f6" }} />
                </div>
              </div>

              {/* Legend */}
              <div style={S.card}>
                <div style={S.cardSheen} />
                <div style={S.sectionTitle}>Legend</div>
                <div style={{ marginTop: 12 }}>
                  <div style={{
                    height: 12,
                    borderRadius: 6,
                    background: mapMetric === "ratio"
                      ? "linear-gradient(90deg, #059669 0%, #10b981 25%, #fbbf24 50%, #f97316 75%, #ef4444 100%)"
                      : mapMetric === "value"
                        ? "linear-gradient(90deg, #059669 0%, #10b981 25%, #fbbf24 50%, #f97316 75%, #ef4444 100%)"
                        : "linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #93c5fd 100%)",
                    marginBottom: 6,
                  }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", fontFamily: "'DM Mono',monospace" }}>
                    {mapMetric === "ratio"
                      ? <><span>Affordable (2x)</span><span>Moderate</span><span>Severe (8x+)</span></>
                      : mapMetric === "value"
                        ? <><span>$100K</span><span>$300K</span><span>$500K+</span></>
                        : <><span>$30K</span><span>$65K</span><span>$100K+</span></>
                    }
                  </div>
                </div>
              </div>

              <div style={{ ...S.card, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, marginBottom: 6 }}>💡 Pro Tip</div>
                <div style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.6 }}>
                  Drag the income sliders to reveal which areas are affordable for a specific income bracket. States outside the range will dim.
                </div>
              </div>
            </div>

            {/* Map Area */}
            <div style={{
              ...S.card,
              padding: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={S.sectionTitle}>
                    {mapMetric === "ratio" ? "Affordability Ratio" : mapMetric === "value" ? "Median Home Value" : "Median Household Income"}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Hover over states for details · Production version uses county-level polygons
                  </div>
                </div>
                <div style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "#f1f5f9",
                  fontSize: 11,
                  color: "#94a3b8",
                  fontFamily: "'DM Mono',monospace",
                  border: "1px solid #e2e8f0",
                }}>
                  {STATES.filter(s => s.income >= incomeRange[0] * 1000 && s.income <= incomeRange[1] * 1000).length} / {STATES.length} states visible
                </div>
              </div>
              <div style={{ flex: 1, padding: 20, minHeight: 500, position: "relative" }}>
                <USMap selectedMetric={mapMetric} incomeRange={incomeRange} />
                {/* Demo overlay */}
                <div style={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#ffffff", boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 12,
                  color: "#94a3b8",
                  fontFamily: "'DM Mono',monospace",
                  textAlign: "center",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                }}>
                  <span style={{ color: "#2563eb" }}>Demo:</span> State-level preview · Full app uses <span style={{ color: "#0f172a" }}>3,100+ county polygons</span> via Mapbox GL JS
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
