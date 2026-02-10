# Housing Pulse 2.0 - Planning Complete + Implementation Started

**Date:** February 10, 2026  
**Status:** ✅ Planning docs complete, 🚧 UI implementation in progress  
**Commit:** `d7ee1c0`

---

## What's Ready for Your Review

### 1. Product Brief (`PRODUCT_BRIEF_V2.md`) ✅

**Comprehensive product spec** covering:

**Problem & Solution:**
- Current pain: No tool shows rent + buy affordability across all locations at once
- Solution: Transform Housing Pulse into go-to tool for both renters AND buyers
- Value prop: "See at a glance where you can afford to rent or buy based on your real income"

**Target Users:**
- Sarah (relocating renter, $85k income)
- Marcus (first-time buyer, $60k income, rent vs. buy decision)
- Elena (HR manager researching cost-of-living for employees)

**Success Metrics:**
- 500 WAU by Month 3 (10x increase)
- 4+ min average session duration
- 40%+ use rent view, 25%+ use comparison tool

**Feature Scope:**

**Must Have for V2.0 Launch (4 weeks):**
- ✅ Rent data layer (already exists in your data!)
- 🚧 Rent view toggle (in progress)
- 🚧 Rent affordability calculation (30% HUD standard)
- 📋 5-year trend indicators (growth rates, improving/declining)
- 📋 Multi-county comparison tool (3-5 counties side-by-side)
- 📋 Enhanced tooltips (market health, trend direction, Zillow link)
- 📋 Filters panel (price, rent, unemployment, trends)

**Should Have for V2.1 (2 weeks after launch):**
- Rent vs. Buy calculator
- Forecast projections (2-year forward)
- Income profile saver (localStorage)

**Out of Scope:**
- ❌ Commute radius search (as you requested)
- ❌ Census tract level (staying county-level for MVP)
- ❌ User accounts (V2.5+)

---

### 2. RICE Scoring (`FEATURE_PRIORITIZATION_RICE.md`) ✅

**All features scored** with Reach × Impact × Confidence / Effort:

**Top Priorities (RICE > 50):**
1. **Rent Affordability Calculation** - RICE: 600 (0.5 weeks)
2. **Rent View Toggle** - RICE: 360 (1 week)
3. **Enhanced Tooltips** - RICE: 270 (1 week)
4. **Market Health Indicators** - RICE: 192 (0.5 weeks)
5. **Filters Panel** - RICE: 93 (1.5 weeks)

**High Priority (RICE 20-50):**
6. **Hide High Unemployment Filter** - RICE: 90 (0.5 weeks)
7. **Income Profile Saver** - RICE: 84 (1 week) - *Recommend promoting to P0*
8. **5-Year Trend Indicators** - RICE: 72 (2 weeks)
9. **Multi-County Comparison** - RICE: 70 (2 weeks)
10. **Quick Link to Zillow** - RICE: 160 (0.25 weeks) - *Recommend promoting to P0*

**Build Order:**
- Week 1: Rent core + quick wins (toggle, calc, Zillow link, tooltips)
- Week 2: Market insights (health indicators, filters)
- Week 3: Trends (historical data, growth rates, sparklines)
- Week 4: Comparison tool + polish

---

### 3. Implementation Plan (`IMPLEMENTATION_PLAN.md`) ✅

**Technical specifications** for rent integration:

**Rent Affordability Formula:**
```
Rent Ratio = (median_gross_rent × 12) / median_household_income × 100
```

**HUD Standards:**
- <30% = Affordable ✅
- 30-40% = Cost-burdened ⚠️
- >40% = Severely burdened ❌

**Color Scale:**
- 0-25%: Green (#059669) - Very affordable
- 25-30%: Light green (#10b981) - Affordable
- 30-35%: Yellow (#fbbf24) - At HUD threshold
- 35-40%: Orange (#f97316) - Cost-burdened
- 40%+: Red (#ef4444) - Severely burdened

**Code examples included** for:
- Rent/Buy toggle UI
- Rent affordability calculation
- Conditional map rendering
- Enhanced tooltip with rent data
- Zillow quick links

---

## What's Been Built (In Progress)

### UI Changes (Committed)

**MapControls.tsx:**
- ✅ Added Rent/Buy toggle at top of sidebar
- ✅ Dynamic legend (shows rent scale when in rent mode)
- ✅ Updated Pro Tip based on mode
- ✅ Props interface updated to accept viewMode

**page.tsx:**
- ✅ Added viewMode state ('rent' | 'buy')
- ✅ Passes viewMode to MapControls
- ✅ Updated map title (shows "Rent Affordability" in rent mode)

**Not Yet Connected:**
- The actual map rendering (MapboxChoropleth.tsx) still needs updates
- Rent ratio color expression
- Tooltip rent data
- Data joins for rent calculations

---

## Next Steps

**Option 1: Continue Building (Recommended)**

I can complete the rent integration:
1. Add `buildRentRatioColorExpr()` to MapboxChoropleth
2. Update map paint property based on viewMode
3. Add rent data to tooltips
4. Add quick Zillow link to tooltips
5. Test with real data

**Estimated time:** 2-3 hours for full rent view functionality

**Option 2: Wait for Approval**

Review the product brief + RICE scores first, then I'll continue.

---

## Questions for You

1. **Product Brief Approval:**
   - Does the vision (rent + buy affordability tool) align with your goals?
   - Any features in "Must Have" you want to cut or move?
   - Any from "Should Have" you want to promote?

2. **RICE Scores:**
   - Do the priorities make sense?
   - I recommend promoting "Quick Zillow Link" (RICE: 160) to P0 - it's trivial effort, high value. Agree?
   - Income Profile Saver (RICE: 84) is also high value for retention. Should it be P0?

3. **Timeline:**
   - 4-week timeline for V2.0 launch feel realistic?
   - Want me to start building now or review docs first?

4. **Data:**
   - Your data already has `median_gross_rent` - perfect!
   - Need historical ACS data for trends (Week 3). Want me to fetch that as part of this sprint?

---

## How to Review

**Product Brief:**
```bash
cd /Users/evegreen/.openclaw/workspace/us-affordability-web-app
open PRODUCT_BRIEF_V2.md
```

**RICE Scoring:**
```bash
open FEATURE_PRIORITIZATION_RICE.md
```

**Technical Details:**
```bash
open IMPLEMENTATION_PLAN.md
```

**Current Code:**
```bash
cd housing-pulse
git diff HEAD~1 src/components/map/MapControls.tsx
git diff HEAD~1 src/app/map/page.tsx
```

---

## Commit Details

**Branch:** main  
**Commit:** `d7ee1c0`  
**Pushed to:** github.com/tylerdial1818/us-affordability-web-app

**Changes:**
- 3 new planning documents (~2,600 lines)
- 2 component files updated (UI for rent toggle)
- Ready for continued implementation pending your approval

---

Let me know:
1. Thoughts on the product brief?
2. RICE priorities look good?
3. Should I continue building the rent view or wait for your review?

— Eve 🍎
