#!/usr/bin/env python3
"""
Analyze FMR data to find the most compelling insights for home/research pages.
Focus on: What stories does the data tell? What will help users make decisions?
"""

import json
import statistics
from collections import defaultdict

def load_data():
    with open("../public/data/counties_acs.json") as f:
        return json.load(f)

def analyze_rent_insights(counties):
    """Find the most interesting/useful rent insights."""
    
    # Collect data for analysis
    rent_2br = []
    price_to_rent = []
    states_data = defaultdict(list)
    bedroom_premiums = []
    
    for fips, county in counties.items():
        if county.get("fmr_2br") and county.get("median_home_value"):
            rent_2br.append(county["fmr_2br"])
            
            # Price-to-rent ratio
            ptr = county.get("price_to_rent_ratio")
            if ptr:
                price_to_rent.append(ptr)
            
            # State-level aggregation
            state = county.get("state")
            if state:
                states_data[state].append({
                    "rent": county["fmr_2br"],
                    "income": county.get("median_household_income", 0),
                    "price": county.get("median_home_value", 0)
                })
            
            # Bedroom premium (3BR vs 2BR)
            if county.get("fmr_3br"):
                premium = (county["fmr_3br"] - county["fmr_2br"]) / county["fmr_2br"]
                bedroom_premiums.append(premium * 100)
    
    print("=" * 60)
    print("RENT INSIGHTS ANALYSIS")
    print("=" * 60)
    
    # 1. National rent statistics
    print("\n📊 NATIONAL RENT OVERVIEW")
    print(f"  Median 2BR rent: ${statistics.median(rent_2br):,.0f}/mo")
    print(f"  Average 2BR rent: ${statistics.mean(rent_2br):,.0f}/mo")
    print(f"  Range: ${min(rent_2br):,.0f} - ${max(rent_2br):,.0f}")
    
    # 2. Rent affordability (30% rule)
    print("\n💰 RENT AFFORDABILITY (30% income rule)")
    affordable_count = 0
    total_with_data = 0
    
    for fips, county in counties.items():
        rent = county.get("fmr_2br")
        income = county.get("median_household_income")
        if rent and income:
            total_with_data += 1
            monthly_income = income / 12
            if rent <= monthly_income * 0.30:
                affordable_count += 1
    
    pct_affordable = (affordable_count / total_with_data) * 100
    print(f"  {affordable_count:,} / {total_with_data:,} counties ({pct_affordable:.1f}%)")
    print(f"  where 2BR rent ≤ 30% of median income")
    
    # 3. Bedroom premium analysis
    print("\n🏠 BEDROOM SIZE PREMIUM")
    print(f"  Avg premium for 3BR vs 2BR: +{statistics.mean(bedroom_premiums):.0f}%")
    print(f"  Median premium: +{statistics.median(bedroom_premiums):.0f}%")
    
    # 4. Rent vs Buy comparison
    print("\n🏡 RENT VS BUY")
    print(f"  Median price-to-rent ratio: {statistics.median(price_to_rent):.1f}x")
    print(f"  (Below 15x = better to buy, Above 20x = better to rent)")
    
    buy_better = sum(1 for p in price_to_rent if p < 15)
    rent_better = sum(1 for p in price_to_rent if p > 20)
    mixed = len(price_to_rent) - buy_better - rent_better
    
    print(f"  Counties where buying is better (<15x): {buy_better}")
    print(f"  Counties where renting is better (>20x): {rent_better}")
    print(f"  Mixed markets (15-20x): {mixed}")
    
    # 5. Top/bottom states by rent
    print("\n🗺️  STATE RENT RANKINGS (by median 2BR)")
    state_medians = {}
    for state, data in states_data.items():
        rents = [d["rent"] for d in data if d["rent"]]
        if rents:
            state_medians[state] = statistics.median(rents)
    
    sorted_states = sorted(state_medians.items(), key=lambda x: x[1], reverse=True)
    
    print("\n  Most Expensive:")
    for state, rent in sorted_states[:5]:
        print(f"    {state}: ${rent:,.0f}/mo")
    
    print("\n  Most Affordable:")
    for state, rent in sorted_states[-5:]:
        print(f"    {state}: ${rent:,.0f}/mo")
    
    # 6. Insight recommendations
    print("\n" + "=" * 60)
    print("RECOMMENDED INSIGHTS FOR HOME PAGE")
    print("=" * 60)
    print("\n1. National Rent Snapshot")
    print("   → Median rent, % of counties affordable")
    print("\n2. Rent vs Buy Quick Stat")
    print("   → Show how many markets favor renting vs buying")
    print("\n3. State Comparison Widget")
    print("   → Interactive dropdown to compare state rent averages")
    
    print("\n" + "=" * 60)
    print("RECOMMENDED INSIGHTS FOR RESEARCH PAGE")
    print("=" * 60)
    print("\n1. Bedroom Size Calculator")
    print("   → Let users see rent difference by bedroom count")
    print("\n2. Rent Affordability Explorer")
    print("   → Input income, see where you can afford to rent")
    print("\n3. Rent vs Buy Decision Tool")
    print("   → Price-to-rent ratio analysis with recommendation")
    
    return {
        "national_median_rent": statistics.median(rent_2br),
        "pct_counties_affordable": pct_affordable,
        "median_ptr": statistics.median(price_to_rent),
        "buy_better_count": buy_better,
        "rent_better_count": rent_better,
        "state_rankings": sorted_states
    }

if __name__ == "__main__":
    counties = load_data()
    insights = analyze_rent_insights(counties)
    
    # Save insights for use in components
    with open("../public/data/rent_insights.json", "w") as f:
        json.dump(insights, f, indent=2)
    
    print("\n✓ Insights saved to public/data/rent_insights.json")
