"use client";

interface AffordabilityBadgeProps {
  ratio: number | null;
  size?: "sm" | "md" | "lg";
}

function getStatus(ratio: number | null) {
  if (ratio === null)
    return { label: "No Data", icon: "\u2014", color: "#94a3b8", bg: "#f1f5f9" };
  if (ratio <= 3)
    return { label: "Within reach", icon: "\u2713", color: "#059669", bg: "#ecfdf5" };
  if (ratio <= 5)
    return { label: "A stretch", icon: "\u26a0", color: "#d97706", bg: "#fffbeb" };
  return { label: "Likely out of reach", icon: "\u2717", color: "#dc2626", bg: "#fef2f2" };
}

export default function AffordabilityBadge({
  ratio,
  size = "md",
}: AffordabilityBadgeProps) {
  const { label, icon, color, bg } = getStatus(ratio);
  const fontSize = size === "sm" ? 11 : size === "lg" ? 14 : 12;
  const padding = size === "sm" ? "3px 8px" : size === "lg" ? "6px 14px" : "4px 10px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding,
        borderRadius: 6,
        background: bg,
        color,
        fontSize,
        fontWeight: 600,
        fontFamily: "'DM Mono', monospace",
        whiteSpace: "nowrap",
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

export function BudgetBadge({
  homeValue,
  affordablePrice,
  size = "md",
}: {
  homeValue: number;
  affordablePrice: number;
  size?: "sm" | "md" | "lg";
}) {
  const ratio = homeValue / affordablePrice;
  let label: string, icon: string, color: string, bg: string;

  if (ratio <= 1.0) {
    label = "Within your budget";
    icon = "\u2713";
    color = "#059669";
    bg = "#ecfdf5";
  } else if (ratio <= 1.3) {
    label = "Slight stretch";
    icon = "\u2713";
    color = "#059669";
    bg = "#ecfdf5";
  } else if (ratio <= 1.7) {
    label = "A stretch";
    icon = "\u26a0";
    color = "#d97706";
    bg = "#fffbeb";
  } else if (ratio <= 2.0) {
    label = "Significant stretch";
    icon = "\u26a0";
    color = "#d97706";
    bg = "#fffbeb";
  } else {
    label = "Likely out of reach";
    icon = "\u2717";
    color = "#dc2626";
    bg = "#fef2f2";
  }

  const fontSize = size === "sm" ? 11 : size === "lg" ? 14 : 12;
  const padding =
    size === "sm" ? "3px 8px" : size === "lg" ? "6px 14px" : "4px 10px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding,
        borderRadius: 6,
        background: bg,
        color,
        fontSize,
        fontWeight: 600,
        fontFamily: "'DM Mono', monospace",
        whiteSpace: "nowrap",
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}
