# Product Brief: Housing Pulse 2.0

**Last Updated:** February 10, 2026  
**Owner:** Tyler Dial  
**Status:** Planning / Pending Approval

---

## Problem

**Who has this problem?**
- Income-constrained renters and buyers considering relocation
- First-time home buyers unsure where they can afford
- Current renters exploring rent-vs-buy decisions
- People comparing affordability across multiple locations

**What are they doing today?**
- Searching Zillow/Redfin listing-by-listing (time-consuming, no big picture)
- Using rent calculators that don't show geographic comparison
- Spreadsheet calculations with manual data collection
- Guessing based on anecdotal knowledge ("I heard Austin is expensive")

**Why is that painful?**
- No tool shows affordability across ALL locations at once
- Can't quickly answer "Where can I afford to live given my income?"
- Rent vs. buy decisions require separate tools and manual comparison
- No way to see market trends or forecast future affordability
- Existing tools focus on listings, not location-level affordability

---

## Proposed Solution

Transform **Housing Pulse** from a home buyer affordability map into a comprehensive affordability intelligence platform for both renters and buyers.

**Core value proposition:**
"See at a glance where you can afford to rent or buy across the entire United States, based on your real income. Compare locations, understand trends, and make informed relocation decisions."

**Key differentiators:**
1. **Unified rent + buy view** - Toggle between rent and home value affordability on the same map
2. **Income-driven** - Personalized to user's actual income, not generic "median household"
3. **Geographic overview** - County-level view shows big picture instead of individual listings
4. **Trend analysis** - See if affordability is improving or declining over time
5. **Multi-location comparison** - Side-by-side comparison of up to 5 counties

---

## Target Users

### Primary User Personas

**Persona 1: Sarah - The Relocating Renter**
- Age 28, software engineer, $85k income
- Considering remote work relocation from SF to lower-cost area
- Needs: See where her rent budget ($1,800/mo) goes furthest
- Pain: Zillow shows individual apartments, not whether entire regions are affordable

**Persona 2: Marcus - The First-Time Buyer**
- Age 32, teacher, $60k income
- Wants to buy first home but unsure where he can afford
- Needs: Understand home affordability AND whether renting is smarter financially
- Pain: Can't visualize affordability across multiple metros at once

**Persona 3: Elena - The Market Researcher**
- Age 45, HR manager for distributed company
- Researching salary adjustments based on employee locations
- Needs: Fast comparison of cost-of-living across 10+ markets
- Pain: Manually compiling data from multiple sources

---

## Success Metrics

### Primary Metrics
- **Weekly Active Users (WAU)**: Target 500 WAU by Month 3 (10x current)
- **Session Duration**: Average 4+ minutes (indicates deep exploration)
- **County Interactions**: Average 8+ counties viewed per session

### Secondary Metrics
- **Rent View Adoption**: 40%+ of sessions toggle to rent view
- **Comparison Tool Usage**: 25%+ of users compare 2+ counties
- **Return Rate**: 30%+ of users return within 7 days
- **Income Entry Rate**: 60%+ of users enter their income (indicates engagement)

### Success Indicators (Qualitative)
- Users share the tool on social media / Reddit
- Inbound requests for city-specific features
- Users save income profile and return multiple times

---

## Scope

### ✅ Must Have for V2.0 Launch (Housing Pulse 2.0)

**Rent Affordability Layer**
- [x] Data already exists (`median_gross_rent` in counties_acs.json)
- [ ] Rent View toggle (parallel to Buy View)
- [ ] Rent affordability calculation (30% income rule from HUD)
- [ ] Rent affordability ratio visualization (color scale for rent-to-income)
- [ ] Tooltip shows rent data alongside home value data

**Trend Indicators**
- [ ] Fetch 5-year historical ACS data for key metrics
- [ ] Calculate growth rates: home value appreciation, rent growth, income growth
- [ ] Display trend direction in tooltip (↑ Improving / ↓ Declining / → Stable)
- [ ] Small sparkline chart showing 5-year trajectory

**Multi-County Comparison Tool**
- [ ] Click counties to add to comparison (up to 5)
- [ ] Side-by-side comparison cards showing:
  - Median home value / rent (1BR equivalent)
  - Affordability ratio (buy & rent)
  - Trend direction (5-year)
  - Unemployment rate
  - Cost burden rate
- [ ] Clear comparison / Remove individual counties
- [ ] Export comparison as image (screenshot or download)

**Market Health Indicators**
- [ ] Unemployment rate (already in data: `unemployment_rate`)
- [ ] Cost burden rate (already in data: `pct_cost_burdened_renters`, `pct_cost_burdened_owners`)
- [ ] Display in enhanced tooltip
- [ ] Color-code warning indicators (unemployment >6%, cost burden >40%)

**Enhanced Tooltips**
- [ ] Expand tooltip with:
  - Trend sparkline (5-year)
  - Market health indicators
  - "Affordable for you" badge (if income entered)
  - Quick link to Zillow search for that county

**Filters Panel**
- [ ] Max home price slider
- [ ] Max rent slider (monthly)
- [ ] "Only show improving markets" checkbox
- [ ] "Hide high unemployment areas" checkbox (>6%)
- [ ] Filters update map in real-time

---

### 🔄 Should Have (V2.1 - Next Sprint)

**Rent vs. Buy Calculator**
- [ ] Given income + selected county, show:
  - Can you afford to rent here? (at 30% income)
  - Can you afford to buy here? (at 28% DTI)
  - Monthly cost comparison (rent vs. mortgage+taxes+insurance)
  - Break-even point (years until buying is cheaper)
  - Total 5-year cost comparison
- [ ] Use NYT rent vs. buy calculator methodology
- [ ] Modal/panel interface on county click

**Forecast Projections**
- [ ] Simple linear regression on 5-year trends
- [ ] Project 2-year forward estimate for:
  - Median home value
  - Median rent
  - Affordability ratio
- [ ] Display as "In 2028, median home value projected to be $X"
- [ ] Confidence bands (±10% based on historical volatility)

**Income Profile Saver**
- [ ] "Save my profile" feature (localStorage or optional Google Sign-In)
- [ ] Saved fields:
  - Household income
  - Household size
  - Preferred bedroom count
  - Rent vs. buy preference
- [ ] Auto-load on return visits
- [ ] Personalized affordability calculations across all counties

---

### 💡 Could Have (V2.5+ / Future)

**Enhanced Data Granularity**
- [ ] Census tract level data (neighborhood-level, not just county)
- [ ] ZIP code level option
- [ ] Metro area aggregation (multi-county metros)

**Additional Metrics**
- [ ] School quality scores (GreatSchools API)
- [ ] Crime rate index
- [ ] Walkability score (Walk Score API)
- [ ] Climate data (average temp, days of sun)

**User Accounts & Saved Searches**
- [ ] User authentication (Google/email)
- [ ] Save favorite counties
- [ ] Email alerts for market changes ("Austin affordability improved 5%")
- [ ] Saved searches ("Show me all improving markets under $300k")

**Sharing & Export**
- [ ] Share specific map view (URL with parameters)
- [ ] Export full county data as CSV
- [ ] PDF report generation for comparison
- [ ] Social media share cards (OpenGraph images)

---

### 🚫 Out of Scope (Not Building)

- **Commute radius search** (Feature Set C, #2) - Requires Google Maps API, complex calculation, not MVP
- **Individual property listings** - That's Zillow's job. We focus on location-level intelligence.
- **Mortgage calculator** - Many exist. We'll link to Bankrate or similar.
- **Historical property value tracking** - Requires per-property data, scope creep.

---

## Assumptions to Validate

1. **Renters care about county-level data**: Assumption: Renters will find county-level rent data useful for relocation decisions. Validation: Track rent view toggle usage.

2. **Trend data influences decisions**: Assumption: Users want to see if affordability is improving/declining. Validation: Track tooltip interaction with trend indicators.

3. **Users will enter their income**: Assumption: Users trust us enough to enter real income data. Validation: Track income entry rate (target 60%).

4. **Comparison tool adds value**: Assumption: Side-by-side comparison helps decision-making. Validation: Track comparison tool usage (target 25% of sessions).

5. **Current data granularity (county) is sufficient**: Assumption: County-level is enough for MVP; users don't need neighborhood-level yet. Validation: Monitor user feedback requests for more granular data.

---

## Open Questions

1. **Should we support multi-bedroom rent options?** (1BR vs. 2BR vs. 3BR)
   - Current data: `median_gross_rent` (all bedroom types combined)
   - Option: Fetch detailed HUD FMR data by bedroom count
   - Decision: Start with overall median, add bedroom filters in V2.1 if requested

2. **How far back should trend data go?** 
   - Options: 3 years (minimum for trend), 5 years (better signal), 10 years (includes 2008 crisis context)
   - Recommendation: 5 years (ACS 5-year estimates available back to ~2010)

3. **Should we support Puerto Rico / territories?**
   - Current: US states + DC
   - Census data available for PR, Guam, etc.
   - Decision: Add if ACS data quality is good, low effort

4. **What income level should default affordability use?**
   - Current: User must enter income
   - Option: Default to national median ($75k) if no income entered
   - Recommendation: Start with no default (forces intentional entry), add median fallback if too many users skip

5. **Should filters be persistent across sessions?**
   - Option A: Save in localStorage (like map position)
   - Option B: Reset on each session
   - Recommendation: Save in localStorage for returning users

---

## Technical Architecture Notes

### Data Sources

**Current:**
- Census ACS 5-Year Estimates (via `/public/data/counties_acs.json`)
- Fields: `median_gross_rent`, `median_home_value`, `median_household_income`, unemployment, cost burden, etc.

**New Data Needed:**
- **Historical ACS data** (5 years back):
  - Fetch ACS 2018, 2019, 2020, 2021, 2022, 2023 for trend analysis
  - Store as `/public/data/counties_acs_trends.json`
  - Format: `{ fips: { year: { median_home_value, median_gross_rent, ... } } }`

**Optional (V2.1+):**
- HUD Fair Market Rents by bedroom count (if adding bedroom filters)
- Zillow Rent Index (ZORI) for more frequent updates

### Component Updates

**MapboxChoropleth.tsx:**
- Add `mapMetric` option: `"rent_ratio"` (parallel to existing `"affordability_ratio"`)
- Add rent affordability calculation: `(median_gross_rent * 12) / median_household_income`
- Add color scale for rent ratio (0-30% green, 30-40% yellow, 40%+ red)
- Update tooltip to show rent data

**New Components:**
- `ComparisonPanel.tsx` - Side-by-side county comparison
- `FiltersPanel.tsx` - Price, rent, trend filters
- `TrendSparkline.tsx` - 5-year mini chart component
- `RentVsBuyCalculator.tsx` (V2.1)

### Performance Considerations
- Trend data adds ~2-3x to JSON file size (5 years × current data)
- Lazy load trend data only when tooltip opened or comparison initiated
- Consider moving to API endpoint if file size >10MB

---

## Timeline Estimate

**V2.0 Launch (Must Have Features):**
- Week 1: Rent view toggle + rent affordability calculation + enhanced tooltips
- Week 2: Fetch 5-year historical data + trend indicators + sparklines
- Week 3: Comparison tool + filters panel
- Week 4: Polish, testing, bug fixes, documentation

**Target Launch:** 4 weeks from approval

**V2.1 (Should Have Features):**
- 2 weeks after V2.0 launch (rent vs. buy calculator, forecast, profile saver)

---

## Design Principles

1. **Show, don't tell**: Visualize data on the map. Minimize text explanations.
2. **Income-first**: Everything is personalized to user income. No generic "median household" perspective.
3. **Progressive disclosure**: Start simple (map + toggle), reveal complexity on interaction (comparison, filters).
4. **Fast comparison**: Users should be able to compare 5 locations in under 60 seconds.
5. **Trust through transparency**: Show data sources, methodology, update dates. No black-box scoring.

---

## Success Criteria

Housing Pulse 2.0 is successful if:

1. ✅ **Adoption**: 500 WAU within 3 months (10x increase)
2. ✅ **Engagement**: Average session >4 minutes (deep exploration)
3. ✅ **Feature Usage**: 40% of users toggle to rent view, 25% use comparison tool
4. ✅ **Retention**: 30% of users return within 7 days
5. ✅ **Feedback**: Positive social media mentions, feature requests, low bounce rate

**Launch Readiness Checklist:**
- [ ] All "Must Have" features built and tested
- [ ] Mobile responsive (map + comparison tool work on phone)
- [ ] Performance: Page load <3s, map interaction <100ms
- [ ] Accessibility: Keyboard navigation, screen reader labels, WCAG AA color contrast
- [ ] Documentation: README updated, data methodology explained on site
- [ ] Analytics: GA4 events tracking all key interactions

---

**Approved by:** [Pending]  
**Launch Date:** [TBD - Target: 4 weeks from approval]
