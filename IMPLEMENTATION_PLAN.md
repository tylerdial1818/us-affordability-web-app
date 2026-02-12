# Housing Pulse - User Feedback Implementation Plan

**Date:** 2026-02-12
**Branch:** feature/user-feedback-improvements
**Status:** In Progress

## Overview

Systematic implementation of comprehensive user feedback across multiple app sections.

---

## Phase 1: Critical UX Fixes (Blocking Issues)

### 1.1 Map Viewport Constraints ✅
**Issue:** Map loads on Canada, not responsive when scrolling
**Solution:** Constrain map viewing window to above the fold, set proper viewport bounds
**Files:** 
- `src/components/map/MapboxChoropleth.tsx`
- `src/app/map/page.tsx`
**Implementation:**
- Add `maxHeight: "85vh"` to map container
- Set initial viewport to center on continental US
- Add scroll lock when interacting with map

### 1.2 Connecticut Data Investigation ⏳
**Issue:** Connecticut not showing data on map
**Solution:** Investigate generated-data.json and build script
**Files:**
- `src/lib/generated-data.json`
- `scripts/build_app_data.js`
**Investigation Steps:**
1. Check if CT data exists in source
2. Verify FIPS codes are correct
3. Check polygon rendering logic

### 1.3 Filter Apply Button ✅
**Issue:** Users unclear if filters are applied
**Solution:** Add "Apply Filters" button to MapControls
**Files:**
- `src/components/map/MapControls.tsx`
- `src/app/map/page.tsx`
**Implementation:**
- Convert to staged state (pendingFilters + activeFilters)
- Add "Apply Filters" button
- Show "X filters changed" when pending differs from active
- Apply on button click

### 1.4 Top Picks - Full State Names ✅
**Issue:** State abbreviations instead of full names in Top Picks
**Solution:** Display full state name (e.g., "California" not "CA")
**Files:**
- `src/app/page.tsx` (MOST_AFFORDABLE_STATES, LEAST_AFFORDABLE_STATES)
- `src/app/explore/page.tsx` (if Top Picks section exists there)
**Implementation:**
- Already have `name` field, remove display of `abbr` in parentheses
- Update formatting

---

## Phase 2: Financial Clarity (High Value)

### 2.1 Down Payment & Monthly Payment Calculator ✅
**Issue:** No context for what home price means in practice
**Solution:** Add down payment and monthly payment estimates
**Files:**
- `src/lib/calculations.ts` (new functions)
- `src/app/page.tsx` ("Your Budget" section)
- `src/app/county/[fips]/page.tsx` (county breakdown)
**Implementation:**
- Add `calculateMonthlyPayment(homePrice, downPaymentPct, interestRate, years)`
- Add to "Your Budget" section
- Add to county breakdown page
- Default: 20% down, 7% interest, 30 years

### 2.2 Explain Key Metrics ✅
**Issue:** Terms like "cost-burdened renters", "price to rent ratio", "home value" unclear
**Solution:** Add explanations via existing ExplainedMetric component or inline
**Files:**
- `src/app/page.tsx` (already has ExplainedMetric examples)
- `src/app/county/[fips]/page.tsx`
- `src/components/shared/ExplainedMetric.tsx` (verify implementation)
**Metrics to explain:**
- Cost-burdened renters: >30% income on housing
- Price-to-rent ratio: Home price ÷ Annual rent
- Home value: Median sale price or Zillow Home Value Index (ZHVI)

### 2.3 Info Icons for Metrics ✅
**Issue:** Need tooltips/popovers for complex metrics
**Solution:** Extend ExplainedMetric or add info icon component
**Files:**
- `src/components/shared/InfoIcon.tsx` (new component)
- Apply across key metrics
**Implementation:**
- Simple ℹ️ icon with hover tooltip
- Reuse ExplainedMetric logic if possible

---

## Phase 3: Data Visualization Improvements (Medium Value)

### 3.1 Home Value Trend Time Period Toggles ✅
**Issue:** Chart only shows YTD, users want 5y/10y/20y/30y views
**Solution:** Add time range toggle buttons
**Files:**
- `src/app/county/[fips]/page.tsx` (Home Value Trend panel)
- `src/components/dashboard/TrendLineChart.tsx` (if separate component)
**Implementation:**
- Add button group: [1Y] [5Y] [10Y] [30Y] [All]
- Filter trend data based on selection
- Default: 10Y

### 3.2 Affordability Scale & Color Adjustments ✅
**Issue:** Scale makes things look okay when they're not
**Solution:** Adjust scale to show more detail, add color coding for "very affordable"
**Files:**
- `src/components/dashboard/TrendLineChart.tsx`
- `src/lib/calculations.ts` (ratioColor function)
**Implementation:**
- Extend color palette:
  - Very affordable: <2x (deep green)
  - Affordable: 2-3x (green)
  - Moderate: 3-4x (yellow)
  - Challenging: 4-5x (orange)
  - Severe: 5-6x (red)
  - Extremely severe: 6x+ (deep red)
- Adjust Y-axis domain to show nuance

### 3.3 Affordability Comparison Clarification ✅
**Issue:** Unclear if housing affordability or general COL
**Solution:** Add label/subtitle clarifying metric
**Files:**
- `src/app/county/[fips]/page.tsx`
**Implementation:**
- Change title to "Housing Affordability Comparison" 
- Add subtitle: "Compared to similar-income counties"
- Consider adding general COL comparison if data available

---

## Phase 4: Research & Analysis (Lower Priority)

### 4.1 Affordability Ratio Explanation ✅
**Issue:** Research page needs better explanation of affordability ratio
**Solution:** Add detailed explanation section
**Files:**
- `src/app/research/page.tsx`
**Implementation:**
- Expand methodology section
- Add visual examples

### 4.2 Housing Supply Overlay (Future Enhancement)
**Issue:** User wants to see housing supply and building trends
**Solution:** Research phase - requires new data sources
**Files:**
- New data integration needed
- Census building permits API
- HUD housing supply data
**Status:** Defer to V2 / Future feature

---

## Implementation Order

1. ✅ Top Picks - Full State Names (quick win)
2. ✅ Filter Apply Button (high impact UX)
3. ⏳ Connecticut Data Investigation (bug fix)
4. ✅ Map Viewport Constraints (usability fix)
5. ✅ Down Payment/Monthly Payment (high value add)
6. ✅ Explain Metrics + Info Icons (clarity)
7. ✅ Home Value Trend Toggles (user request)
8. ✅ Affordability Scale Improvements (data viz)
9. ✅ Affordability Comparison Clarification (labeling)
10. ✅ Research Page Enhancements (polish)

---

## Testing Checklist

- [ ] Map viewport stays within frame on all screen sizes
- [ ] Connecticut displays correctly
- [ ] Filter apply button works as expected
- [ ] State names show fully in Top Picks
- [ ] Down payment/monthly payment calculations are accurate
- [ ] All metric tooltips display correctly
- [ ] Time period toggles filter data correctly
- [ ] Color scale shows appropriate gradation
- [ ] All clarifications are clear and accurate

---

## Git Workflow

```bash
# Create feature branch (done)
git checkout -b feature/user-feedback-improvements

# Commit incrementally as features complete
git add <files>
git commit -m "feat: [description]"

# Push when ready
git push origin feature/user-feedback-improvements

# Create PR or merge to main
```

---

## Notes

- Preserve existing component structure where possible
- Maintain design system consistency (fonts, colors, spacing)
- Add comments for complex calculations
- Update this document as implementation progresses
