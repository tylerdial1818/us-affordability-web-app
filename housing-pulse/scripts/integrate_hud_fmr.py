#!/usr/bin/env python3
"""
Integrate HUD FMR data into counties_acs.json
Uses only standard library - no external dependencies.
"""

import json
from pathlib import Path

def create_fmr_data():
    """
    Create FMR data structure with bedroom-specific rents.
    
    For MVP: Uses realistic estimates based on median_gross_rent.
    TODO: Replace with actual HUD FMR historical data.
    """
    print("Loading existing county data...")
    
    # Load current county data
    data_path = Path(__file__).parent.parent / "public" / "data" / "counties_acs.json"
    with open(data_path) as f:
        counties = json.load(f)
    
    print(f"Loaded {len(counties)} counties")
    
    # Add FMR fields to each county
    updated_count = 0
    skipped_count = 0
    
    for fips, county in counties.items():
        base_rent = county.get("median_gross_rent")
        
        # Skip counties without rent data
        if base_rent is None or base_rent == 0:
            skipped_count += 1
            continue
        
        # Add bedroom-specific Fair Market Rents
        # Using industry-standard ratios relative to 2BR baseline
        county["fmr_0br"] = round(base_rent * 0.65)  # Studio
        county["fmr_1br"] = round(base_rent * 0.85)  # 1 Bedroom
        county["fmr_2br"] = round(base_rent * 1.00)  # 2 Bedroom (baseline)
        county["fmr_3br"] = round(base_rent * 1.20)  # 3 Bedroom
        county["fmr_4br"] = round(base_rent * 1.40)  # 4 Bedroom
        
        # Calculate 5-year rent growth estimate
        # For MVP: Use placeholder value
        # TODO: Calculate from actual historical FMR data (2019-2024)
        county["rent_trend_5yr"] = 0.25  # 25% growth estimate
        
        updated_count += 1
    
    # Write updated data (compact JSON)
    print(f"Writing updated data to {data_path}...")
    with open(data_path, "w") as f:
        json.dump(counties, f, separators=(',', ':'))
    
    print(f"✓ Updated {updated_count} counties with FMR data")
    if skipped_count > 0:
        print(f"  (Skipped {skipped_count} counties without rent data)")
    
    # Show sample
    sample_fips = "49035"  # Salt Lake County
    if sample_fips in counties:
        sample = counties[sample_fips]
        print(f"\nSample: {sample['name']}")
        print(f"  Studio (0BR): ${sample['fmr_0br']}")
        print(f"  1 Bedroom:    ${sample['fmr_1br']}")
        print(f"  2 Bedroom:    ${sample['fmr_2br']}")
        print(f"  3 Bedroom:    ${sample['fmr_3br']}")
        print(f"  4 Bedroom:    ${sample['fmr_4br']}")
        print(f"  5yr growth:   {sample['rent_trend_5yr']*100:.0f}%")

if __name__ == "__main__":
    print("=== HUD FMR Integration (MVP) ===\n")
    create_fmr_data()
    print("\n✓ Done!")
    print("\nNext steps:")
    print("1. Update UI to display bedroom-specific rents")
    print("2. Add rent vs buy comparison widget")
    print("3. Replace estimates with actual HUD historical data")
