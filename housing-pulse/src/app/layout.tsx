import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HousingPulse — US Housing Affordability Dashboard",
  description:
    "Interactive US housing affordability dashboard with national statistics, GIS choropleth maps, and county-level data. Powered by Census ACS and Zillow ZHVI data.",
  keywords: [
    "housing affordability",
    "US housing",
    "real estate",
    "census data",
    "choropleth map",
    "median home value",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {/* Background dot pattern */}
        <div
          className="bg-dot-pattern fixed inset-0 pointer-events-none z-0"
          style={{ opacity: 0.4 }}
        />
        {children}
      </body>
    </html>
  );
}
