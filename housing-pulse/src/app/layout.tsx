import type { Metadata } from "next";
import { Suspense } from "react";
import { IncomeProvider } from "@/components/shared/IncomeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "HousingPulse — Find Where You Can Afford to Live",
  description:
    "Interactive US housing affordability tool. Enter your income to see personalized maps of where you can afford to buy a home. Powered by Census ACS and Zillow ZHVI data.",
  keywords: [
    "housing affordability",
    "US housing",
    "real estate",
    "census data",
    "choropleth map",
    "median home value",
    "affordable housing",
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
        <Suspense>
          <IncomeProvider>{children}</IncomeProvider>
        </Suspense>
      </body>
    </html>
  );
}
