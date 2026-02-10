# Housing Pulse 2.0 - Implementation Plan

## Build Order (Week 1: Rent Core + Quick Wins)

### Task 1: Add Rent/Buy View Toggle ✅
**File:** `src/components/map/MapControls.tsx`
**Changes:**
- Add state for view mode ("rent" | "buy")
- Add toggle UI at top of controls
- Pass view mode to parent component
- Update metric options based on view mode

### Task 2: Add Rent Affordability Calculation ✅
**File:** `src/components/map/MapboxChoropleth.tsx`  
**Changes:**
- Add `buildRentRatioColorExpr()` function
- Calculate rent affordability: `(median_gross_rent * 12) / median_household_income * 100`
- HUD standard: 30% = cost-burdened, >40% = severely cost-burdened
- Color scale:
  - 0-25%: Green (#059669)
  - 25-30%: Light green (#10b981)
  - 30-35%: Yellow (#fbbf24)
  - 35-40%: Orange (#f97316)
  - 40%+: Red (#ef4444)

### Task 3: Update Map to Support Rent View ✅
**File:** `src/components/map/MapboxChoropleth.tsx`
**Changes:**
- Add `viewMode` prop ("rent" | "buy")
- Conditionally set map metric based on view mode
- Update color expressions for rent vs. buy
- Update legend to reflect current view

### Task 4: Enhanced Tooltips with Rent Data ✅
**File:** `src/components/map/MapboxChoropleth.tsx`
**Changes:**
- Add rent data to tooltip:
  - Median rent (monthly)
  - Rent-to-income ratio
  - Rent affordability status (Affordable / Moderate / Burdened)
- Show buy OR rent data based on view mode
- Add quick Zillow link

### Task 5: Update Legend for Rent View ✅
**File:** `src/components/map/MapControls.tsx`
**Changes:**
- Dynamic legend based on view mode
- Rent view: 0-25%, 25-30%, 30-40%, 40%+
- Buy view: existing scale

---

## Implementation Details

### 1. Rent/Buy Toggle Component

```tsx
// In MapControls.tsx, add at top:

<div style={cardStyle}>
  <div style={sheenStyle} />
  <div style={sectionTitleStyle}>View Mode</div>
  <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
    Switch between rent and home value
  </div>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      background: "#f1f5f9",
      padding: 4,
      borderRadius: 10,
    }}
  >
    <button
      onClick={() => onViewModeChange("buy")}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        border: "none",
        background: viewMode === "buy" ? "#ffffff" : "transparent",
        color: viewMode === "buy" ? "#0f172a" : "#64748b",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: viewMode === "buy" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
      }}
    >
      🏠 Buy
    </button>
    <button
      onClick={() => onViewModeChange("rent")}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        border: "none",
        background: viewMode === "rent" ? "#ffffff" : "transparent",
        color: viewMode === "rent" ? "#0f172a" : "#64748b",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: viewMode === "rent" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
      }}
    >
      🔑 Rent
    </button>
  </div>
</div>
```

### 2. Rent Affordability Calculation

```typescript
// In MapboxChoropleth.tsx

function buildRentRatioColorExpr(): mapboxgl.Expression {
  // Rent-to-income ratio as percentage
  // Threshold: 30% (HUD standard for cost burden)
  return [
    "case",
    ["==", ["get", "median_gross_rent"], null],
    "#e2e8f0", // No data
    ["==", ["get", "median_household_income"], null],
    "#e2e8f0", // No income data
    [
      "interpolate",
      ["linear"],
      // Calculate: (monthly_rent * 12) / annual_income * 100
      [
        "*",
        ["/", ["*", ["get", "median_gross_rent"], 12], ["get", "median_household_income"]],
        100
      ],
      0, "#059669",      // 0-15%: Very affordable
      15, "#059669",
      25, "#10b981",     // 15-25%: Affordable
      30, "#fbbf24",     // 25-30%: Moderate (at HUD threshold)
      35, "#f97316",     // 30-35%: Cost-burdened
      40, "#ef4444",     // 35-40%: Severely burdened
      50, "#dc2626",     // 40%+: Extremely burdened
    ],
  ];
}

// Add to data join:
map.setFeatureState(
  { source: "counties", id: fipsNum },
  {
    // ... existing fields
    rent_ratio: countyData.median_gross_rent && countyData.median_household_income
      ? ((countyData.median_gross_rent * 12) / countyData.median_household_income * 100)
      : null,
  }
);
```

### 3. Conditional Metric Display

```typescript
// In MapboxChoropleth.tsx, update paint property:

useEffect(() => {
  if (!mapLoaded || !dataLoaded || !mapRef.current) return;
  
  const map = mapRef.current;
  
  // Determine which color expression to use
  let fillColorExpr: mapboxgl.Expression;
  
  if (viewMode === "rent") {
    fillColorExpr = buildRentRatioColorExpr();
  } else {
    // Buy mode
    if (mapMetric === "ratio") {
      fillColorExpr = buildRatioColorExpr();
    } else if (mapMetric === "value") {
      fillColorExpr = buildValueColorExpr();
    } else if (mapMetric === "income") {
      fillColorExpr = buildIncomeColorExpr();
    } else if (mapMetric === "budget" && affordablePrice) {
      fillColorExpr = buildBudgetColorExpr(affordablePrice);
    }
  }
  
  map.setPaintProperty("counties-fill", "fill-color", fillColorExpr);
}, [viewMode, mapMetric, affordablePrice, mapLoaded, dataLoaded]);
```

### 4. Enhanced Tooltip

```tsx
// Update tooltip content to show rent OR buy data:

<div style={{ padding: 14, maxWidth: 280 }}>
  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
    {tooltipData.name}, {tooltipData.state}
  </div>
  
  {viewMode === "rent" ? (
    <>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
        Median Rent (monthly)
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        ${tooltipData.median_rent?.toLocaleString() || "N/A"}
      </div>
      
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
        Rent-to-Income Ratio
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        {tooltipData.rent_ratio ? `${tooltipData.rent_ratio.toFixed(1)}%` : "N/A"}
        {tooltipData.rent_ratio && (
          <span style={{ 
            fontSize: 11, 
            marginLeft: 6,
            color: tooltipData.rent_ratio < 30 ? "#059669" : tooltipData.rent_ratio < 40 ? "#f97316" : "#ef4444"
          }}>
            {tooltipData.rent_ratio < 30 ? "Affordable" : tooltipData.rent_ratio < 40 ? "Moderate" : "Burdened"}
          </span>
        )}
      </div>
    </>
  ) : (
    // Existing buy data
    <>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
        Median Home Value
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        ${tooltipData.value?.toLocaleString() || "N/A"}
      </div>
      {/* ... existing buy data */}
    </>
  )}
  
  {/* Market health indicators (shown in both modes) */}
  <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 12, paddingTop: 12 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
      <div>
        <div style={{ color: "#64748b" }}>Unemployment</div>
        <div style={{ fontWeight: 600 }}>
          {tooltipData.unemployment ? `${tooltipData.unemployment.toFixed(1)}%` : "N/A"}
        </div>
      </div>
      <div>
        <div style={{ color: "#64748b" }}>Cost Burden</div>
        <div style={{ fontWeight: 600 }}>
          {tooltipData.costBurden ? `${tooltipData.costBurden.toFixed(1)}%` : "N/A"}
        </div>
      </div>
    </div>
  </div>
  
  {/* Quick link to Zillow */}
  <a
    href={`https://www.zillow.com/homes/${encodeURIComponent(tooltipData.name + ", " + tooltipData.state)}_rb/`}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "block",
      marginTop: 12,
      padding: "8px 12px",
      background: "#3b82f6",
      color: "#ffffff",
      textAlign: "center",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      textDecoration: "none",
    }}
  >
    View on Zillow →
  </div>
</div>
```

---

## Testing Checklist

- [ ] Toggle switches between Rent and Buy views
- [ ] Rent view shows green (affordable) to red (burdened) scale
- [ ] Tooltip displays rent data correctly
- [ ] Rent ratio calculation matches HUD standard (30% threshold)
- [ ] Legend updates based on view mode
- [ ] Zillow link works and pre-fills county name
- [ ] Map position persists (existing feature still works)
- [ ] Mobile responsive (toggle works on small screens)
- [ ] No data counties show gray
- [ ] Performance: Map renders smoothly with new calculations

---

## Data Validation

Verify calculations with sample counties:

**Test Case 1: Affordable Rent**
- County: Example County, State
- Median Rent: $1,000/month
- Median Income: $60,000/year
- Expected Ratio: (1,000 * 12) / 60,000 = 20% ✅ Green (Affordable)

**Test Case 2: Moderate Burden**
- Median Rent: $1,800/month
- Median Income: $65,000/year
- Expected Ratio: (1,800 * 12) / 65,000 = 33.2% ⚠️ Orange (Cost-burdened)

**Test Case 3: Severe Burden**
- Median Rent: $2,500/month
- Median Income: $55,000/year
- Expected Ratio: (2,500 * 12) / 55,000 = 54.5% ❌ Red (Severely burdened)

---

## Next Steps After Week 1

Week 2: Historical data + trends
Week 3: Comparison tool
Week 4: Filters + polish

See FEATURE_PRIORITIZATION_RICE.md for full roadmap.
