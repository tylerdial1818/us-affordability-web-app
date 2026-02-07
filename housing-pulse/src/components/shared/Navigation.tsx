"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/map", label: "GIS Map" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        borderBottom: "1px solid #e2e8f0",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          H
        </div>
        <Link
          href="/"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#0f172a",
            textDecoration: "none",
          }}
        >
          HousingPulse
        </Link>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            background: "#dbeafe",
            color: "#2563eb",
            letterSpacing: "0.06em",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          BETA
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: "flex", gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.02em",
                transition: "all 0.3s",
                background: isActive
                  ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                  : "transparent",
                color: isActive ? "#ffffff" : "#475569",
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 11,
            color: "#64748b",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ACS 2020-2024
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
            border: "1px solid #e2e8f0",
          }}
        />
      </div>
    </nav>
  );
}
