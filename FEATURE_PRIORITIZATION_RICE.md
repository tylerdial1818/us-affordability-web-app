# Housing Pulse 2.0 - Feature Prioritization (RICE Framework)

**Date:** February 10, 2026  
**Method:** RICE Scoring (Reach × Impact × Confidence / Effort)

---

## RICE Scoring Framework

**Reach**: How many users will this feature affect per quarter? (Estimate based on 500 WAU target = ~2,000 MAU)

**Impact**: How much will this feature improve the experience for affected users?
- 3 = Massive impact
- 2 = High impact  
- 1 = Medium impact
- 0.5 = Low impact
- 0.25 = Minimal impact

**Confidence**: How confident are we in our Reach and Impact estimates?
- 100% = High confidence (data-driven)
- 80% = Medium confidence (some data)
- 50% = Low confidence (hypothesis)

**Effort**: Person-weeks to design, build, test, and ship

**RICE Score** = (Reach × Impact × Confidence) / Effort

**Priority Tiers:**
- **P0 (Critical)**: RICE > 50 - Must have for launch
- **P1 (High)**: RICE 20-50 - Strong candidates for V2.0
- **P2 (Medium)**: RICE 10-20 - Good for V2.1
- **P3 (Low)**: RICE < 10 - Nice to have, backlog

---

## Feature Scores

### 🟢 P0 - Must Have for V2.0 Launch

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| **Rent View Toggle** | 1500 | 3 | 80% | 1 week | **360** | P0 |
| **Rent Affordability Calculation** | 1500 | 2.5 | 80% | 0.5 weeks | **600** | P0 |
| **Enhanced Tooltips (basic)** | 2000 | 1.5 | 90% | 1 week | **270** | P0 |
| **Market Health Indicators in Tooltip** | 1200 | 1 | 80% | 0.5 weeks | **192** | P0 |
| **Filters Panel (price/rent sliders)** | 1000 | 2 | 70% | 1.5 weeks | **93** | P0 |

### 🟡 P1 - High Priority for V2.0

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| **5-Year Trend Indicators** | 1200 | 2 | 60% | 2 weeks | **72** | P1 |
| **Multi-County Comparison (3-5 counties)** | 800 | 2.5 | 70% | 2 weeks | **70** | P1 |
| **Trend Sparklines** | 1000 | 1.5 | 60% | 1.5 weeks | **60** | P1 |
| **Filters: Show Improving Markets** | 600 | 2 | 50% | 1 week | **60** | P1 |
| **Filters: Hide High Unemployment** | 500 | 1.5 | 60% | 0.5 weeks | **90** | P1 |
| **Export Comparison as Image** | 400 | 1 | 50% | 1 week | **20** | P1 |

### 🟠 P2 - Medium Priority (V2.1 Candidates)

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| **Rent vs. Buy Calculator** | 600 | 2.5 | 60% | 2 weeks | **45** | P2 |
| **Forecast Projections (2-year)** | 500 | 2 | 50% | 2 weeks | **25** | P2 |
| **Income Profile Saver (localStorage)** | 800 | 1.5 | 70% | 1 week | **84** | P2 |
| **Bedroom Count Filter (1BR/2BR/3BR)** | 400 | 1.5 | 50% | 2 weeks | **15** | P2 |
| **Quick Link to Zillow in Tooltip** | 1000 | 0.5 | 80% | 0.25 weeks | **160** | P2 |

### 🔵 P3 - Lower Priority (Backlog / V2.5+)

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| **Census Tract Level Data** | 300 | 2 | 30% | 3 weeks | **6** | P3 |
| **School Quality Scores** | 400 | 1.5 | 50% | 2 weeks | **15** | P3 |
| **Crime Rate Index** | 350 | 1.5 | 50% | 2 weeks | **13** | P3 |
| **Walkability Score** | 250 | 1 | 50% | 1.5 weeks | **8** | P3 |
| **User Accounts & Auth** | 300 | 2 | 50% | 3 weeks | **10** | P3 |
| **Email Alerts** | 200 | 2 | 40% | 2 weeks | **8** | P3 |
| **Share Map View (URL params)** | 400 | 0.5 | 80% | 0.5 weeks | **32** | P3 |
| **Export Data as CSV** | 150 | 1 | 60% | 1 week | **9** | P3 |
| **Social Share Cards (OpenGraph)** | 500 | 0.5 | 60% | 1 week | **15** | P3 |

---

## Detailed Scoring Rationale

### P0 Features (RICE > 50)

#### 1. Rent Affordability Calculation - RICE: 600
**Why P0:**
- **Reach (1500)**: 75% of users will interact with rent data (primary use case for renters)
- **Impact (2.5)**: Core value prop - enables renters to use the tool
- **Confidence (80%)**: Data already exists, proven demand for rent affordability tools
- **Effort (0.5 weeks)**: Simple calculation, similar to existing home affordability logic

**Dependencies:** None. Can ship independently.

#### 2. Rent View Toggle - RICE: 360
**Why P0:**
- **Reach (1500)**: Same as rent calc - anyone interested in renting needs this
- **Impact (3)**: Critical UX - allows users to switch between rent/buy modes
- **Confidence (80%)**: Standard toggle pattern, low risk
- **Effort (1 week)**: Add toggle UI, wire to map metric, update legend

**Dependencies:** Requires rent affordability calculation to be useful.

#### 3. Enhanced Tooltips (basic) - RICE: 270
**Why P0:**
- **Reach (2000)**: 100% of users hover over counties
- **Impact (1.5)**: Significantly improves information density without cluttering map
- **Confidence (90%)**: Tooltips are core interaction pattern, high certainty
- **Effort (1 week)**: Redesign tooltip component, add more data fields

**Dependencies:** None.

#### 4. Market Health Indicators in Tooltip - RICE: 192
**Why P0:**
- **Reach (1200)**: 60% of engaged users (those who hover multiple times)
- **Impact (1)**: Adds analytical depth, differentiates from Zillow
- **Confidence (80%)**: Data already in dataset (unemployment, cost burden)
- **Effort (0.5 weeks)**: Just display logic, no new data fetching

**Dependencies:** Enhanced tooltips.

#### 5. Filters Panel - RICE: 93
**Why P0:**
- **Reach (1000)**: 50% of users (those exploring multiple options)
- **Impact (2)**: Major UX improvement - lets users narrow down options quickly
- **Confidence (70%)**: Common pattern, but need to validate desired filter options
- **Effort (1.5 weeks)**: Build filter UI, wire to map data filtering logic

**Dependencies:** None.

---

### P1 Features (RICE 20-50)

#### 1. Filters: Hide High Unemployment - RICE: 90
**Why P1:**
- **Reach (500)**: 25% of users (risk-aware buyers)
- **Impact (1.5)**: Helps users avoid economically distressed areas
- **Confidence (60%)**: Unemployment is a known concern, but not for all users
- **Effort (0.5 weeks)**: Simple boolean filter, data already available

**Quick win**: High RICE for low effort. Should be bundled with filters panel.

#### 2. Income Profile Saver - RICE: 84 (classified as P2 but high score)
**Why P1 (should promote):**
- **Reach (800)**: 40% of users (returning visitors)
- **Impact (1.5)**: Removes friction on repeat visits
- **Confidence (70%)**: localStorage is reliable, proven pattern
- **Effort (1 week)**: Build profile form, save/load logic, "welcome back" UX

**Recommendation:** Move to P1. High RICE, improves retention.

#### 3. 5-Year Trend Indicators - RICE: 72
**Why P1:**
- **Reach (1200)**: 60% of users (those researching, not just browsing)
- **Impact (2)**: Shows whether affordability is improving/declining - key insight
- **Confidence (60%)**: Requires fetching historical ACS data, some uncertainty
- **Effort (2 weeks)**: Fetch 5 years of ACS data, calculate growth rates, display arrows

**Blocker:** Requires new data pipeline for historical ACS.

#### 4. Multi-County Comparison - RICE: 70
**Why P1:**
- **Reach (800)**: 40% of users (decision-makers comparing options)
- **Impact (2.5)**: Core feature for "comparison" use case
- **Confidence (70%)**: Comparison tools are proven valuable (Zillow, Redfin have them)
- **Effort (2 weeks)**: Build comparison panel, side-by-side cards, state management

**Note:** High impact but medium effort. Worth it for differentiation.

#### 5. Trend Sparklines - RICE: 60
**Why P1:**
- **Reach (1000)**: 50% of users (those who engage deeply)
- **Impact (1.5)**: Visual trend > numeric growth rate
- **Confidence (60%)**: Sparklines are effective but require Chart.js/similar
- **Effort (1.5 weeks)**: Add charting library, build sparkline component, integrate

**Dependencies:** 5-year trend indicators data.

#### 6. Filters: Show Improving Markets - RICE: 60
**Why P1:**
- **Reach (600)**: 30% of users (growth-focused buyers/investors)
- **Impact (2)**: Powerful filter for future-focused users
- **Confidence (50%)**: Unclear if "improving" matters to renters (mostly buyer-focused)
- **Effort (1 week)**: Calculate trend direction, add checkbox filter

**Dependencies:** 5-year trend indicators.

---

### P2 Features (RICE 10-20) - Good for V2.1

#### 1. Quick Link to Zillow - RICE: 160 (should be P1!)
**Why P2 → Promote to P1:**
- **Reach (1000)**: 50% of users (those ready to act on findings)
- **Impact (0.5)**: Low effort, high perceived value
- **Confidence (80%)**: Simple link, no risk
- **Effort (0.25 weeks)**: Add link in tooltip with pre-filled county search

**Recommendation:** Promote to P1. Extremely high RICE, trivial effort.

#### 2. Rent vs. Buy Calculator - RICE: 45
**Why P2:**
- **Reach (600)**: 30% of users (those on the fence between renting/buying)
- **Impact (2.5)**: Major decision support tool
- **Confidence (60%)**: Complex calculation, need to validate methodology
- **Effort (2 weeks)**: Build calculator modal, implement NYT methodology, testing

**Good V2.1 feature:** Adds depth but not critical for launch.

#### 3. Forecast Projections - RICE: 25
**Why P2:**
- **Reach (500)**: 25% of users (long-term planners)
- **Impact (2)**: Shows future trajectory
- **Confidence (50%)**: Linear regression on 5 years is shaky prediction
- **Effort (2 weeks)**: Build regression model, add confidence bands, UX for uncertainty

**Risky:** Low confidence in prediction quality. Consider user research first.

#### 4. Bedroom Count Filter - RICE: 15
**Why P2:**
- **Reach (400)**: 20% of users (families needing 2BR/3BR)
- **Impact (1.5)**: More accurate rent affordability for specific needs
- **Confidence (50%)**: Requires fetching HUD FMR bedroom-specific data
- **Effort (2 weeks)**: Fetch new data, update data pipeline, add filter UI

**Data dependency:** Need to fetch HUD FMR API data by bedroom count.

---

### P3 Features (RICE < 10) - Backlog

Most P3 features have low reach or high effort. Examples:

- **Census Tract Level Data (RICE: 6)**: High effort (3 weeks), low reach (300 users), uncertain value
- **User Accounts (RICE: 10)**: High effort (3 weeks), low reach initially, moderate impact
- **Email Alerts (RICE: 8)**: Requires backend infra, low initial reach, moderate impact

**Recommendation:** Keep in backlog. Revisit after V2.0 launch based on user feedback.

---

## Revised Priority Recommendation

Based on RICE scoring, here's the recommended build order:

### Phase 1: V2.0 Launch (Weeks 1-4)

**Week 1: Rent Core + Quick Wins**
1. Rent affordability calculation (RICE: 600) - 0.5 weeks
2. Rent view toggle (RICE: 360) - 1 week
3. Quick link to Zillow in tooltip (RICE: 160) - 0.25 weeks
4. Enhanced tooltips (RICE: 270) - 1 week

**Week 2: Market Insights**
5. Market health indicators in tooltip (RICE: 192) - 0.5 weeks
6. Filters panel foundation (RICE: 93) - 1.5 weeks
7. Hide high unemployment filter (RICE: 90) - 0.5 weeks

**Week 3: Trends & Comparison**
8. Fetch 5-year historical ACS data - 1 week
9. 5-year trend indicators (RICE: 72) - 1 week
10. Show improving markets filter (RICE: 60) - 1 week

**Week 4: Comparison + Polish**
11. Multi-county comparison tool (RICE: 70) - 2 weeks
12. Income profile saver (RICE: 84) - 1 week (parallel)
13. Bug fixes, polish, testing - ongoing

### Phase 2: V2.1 (Weeks 5-7)

14. Trend sparklines (RICE: 60) - 1.5 weeks
15. Export comparison as image (RICE: 20) - 1 week
16. Rent vs. buy calculator (RICE: 45) - 2 weeks

### Phase 3: V2.5+ (Backlog)

17. Forecast projections (RICE: 25)
18. Bedroom count filter (RICE: 15)
19. Social share cards (RICE: 15)
20. Everything else in P3

---

## Risk Assessment

**High Risk:**
- **Historical ACS data fetch**: May be time-consuming if Census API is slow or data is incomplete
- **Trend calculation accuracy**: 5-year trends on ACS 5-year estimates may have lag/overlap issues
- **Comparison tool complexity**: State management for multi-county selection could be tricky

**Medium Risk:**
- **Filters performance**: Filtering 3,000+ counties in real-time needs optimization
- **Tooltip density**: Too much info = cluttered, need good visual hierarchy
- **Mobile responsiveness**: Comparison tool + filters on small screens is challenging

**Low Risk:**
- **Rent view toggle**: Standard pattern, low complexity
- **Rent affordability calculation**: Similar to existing home affordability logic
- **Profile saver**: localStorage is well-supported

---

## Success Tracking Plan

**Metrics to Track (GA4 Events):**
- `rent_view_toggle` - Count of rent/buy view switches
- `county_hover` - Tooltip interactions per session
- `comparison_add_county` - Counties added to comparison
- `comparison_export` - Export button clicks
- `filter_applied` - Filter usage by type (price, rent, unemployment, trends)
- `income_entered` - Income profile completions
- `profile_saved` - Profile saver usage
- `zillow_link_click` - External link clicks

**Target Benchmarks (3 months post-launch):**
- 40% of sessions use rent view
- 25% of sessions use comparison tool
- 60% of users enter income
- 30% return within 7 days
- Average session duration >4 minutes

---

**Next Step:** Get approval on RICE scores + build order, then start development.
