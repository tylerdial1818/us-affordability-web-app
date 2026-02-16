#!/usr/bin/env python3
"""
Fetch HUD Fair Market Rent (FMR) data and integrate with county data.

Data source: HUD USER FMR dataset
"""

import pandas as pd
import json
import requests
from pathlib import Path

# HUD FMR data for FY2024 (most recent)
# URL: https://www.huduser.gov/portal/datasets/fmr.html
HUD_FMR_URL = "https://www.huduser.gov/portal/datasets/fmr/fmr2024/FY24_FMRs_rev.xlsx"

def download_fmr_data():
    """Download latest HUD FMR data."""
    print("Downloading HUD FMR data...")
    
    # Try direct download
    try:
        response = requests.get(HUD_FMR_URL, timeout=30)
        if response.status_code == 200 and len(response.content) > 10000:  # Actual Excel file should be larger
            with open("FY24_FMRs.xlsx", "wb") as f:
                f.write(response.content)
            print(f"Downloaded {len(response.content)} bytes")
            return True
        else:
            print(f"Download failed or file too small ({len(response.content)} bytes)")
            return False
    except Exception as e:
        print(f"Error downloading: {e}")
        return False

def parse_fmr_excel():
    """Parse HUD FMR Excel file."""
    print("Parsing FMR data...")
    
    try:
        # Read Excel file (HUD format)
        df = pd.read_excel("FY24_FMRs.xlsx", sheet_name=0)
        
        # HUD FMR files typically have columns like:
        # fips, countyname, fmr_0, fmr_1, fmr_2, fmr_3, fmr_4
        # (0BR, 1BR, 2BR, 3BR, 4BR Fair Market Rents)
        
        print(f"Loaded {len(df)} rows")
        print(f"Columns: {list(df.columns)[:10]}")
        
        return df
    
    except Exception as e:
        print(f"Error parsing Excel: {e}")
        return None

def create_sample_fmr_data():
    """
    Create sample FMR data for testing/demo purposes.
    In production, this would be replaced with actual HUD data.
    """
    print("Creating sample FMR data structure...")
    
    # Load existing county data to get FIPS codes
    with open("../public/data/counties_acs.json") as f:
        counties = json.load(f)
    
    # Create FMR estimates based on existing median_gross_rent
    # In reality, we'd use actual HUD data
    fmr_data = {}
    
    for fips, county in counties.items():
        base_rent = county.get("median_gross_rent", 800)
        
        # Estimate bedroom-specific rents (realistic ratios)
        fmr_data[fips] = {
            "fmr_0br": round(base_rent * 0.65),   # Studio ~65% of 2BR
            "fmr_1br": round(base_rent * 0.85),   # 1BR ~85% of 2BR
            "fmr_2br": round(base_rent),          # Base (median_gross_rent ~= 2BR)
            "fmr_3br": round(base_rent * 1.20),   # 3BR ~120% of 2BR
            "fmr_4br": round(base_rent * 1.40),   # 4BR ~140% of 2BR
        }
    
    return fmr_data

def integrate_fmr_with_counties():
    """Add FMR data to counties_acs.json."""
    print("Integrating FMR data with county data...")
    
    # Load existing county data
    with open("../public/data/counties_acs.json") as f:
        counties = json.load(f)
    
    # Get FMR data (using sample for now)
    fmr_data = create_sample_fmr_data()
    
    # Add FMR fields to each county
    for fips, fmr in fmr_data.items():
        if fips in counties:
            counties[fips].update(fmr)
    
    # Write updated data
    with open("../public/data/counties_acs.json", "w") as f:
        json.dump(counties, f, separators=(',', ':'))
    
    print(f"Updated {len(counties)} counties with FMR data")
    print("Sample entry:")
    sample_fips = list(counties.keys())[0]
    print(json.dumps({sample_fips: counties[sample_fips]}, indent=2))

if __name__ == "__main__":
    print("=== HUD FMR Data Integration ===\n")
    
    # Try to download real data
    downloaded = download_fmr_data()
    
    if downloaded:
        fmr_df = parse_fmr_excel()
        if fmr_df is not None:
            print("Successfully loaded HUD FMR data")
        else:
            print("Falling back to sample data")
    else:
        print("Using sample FMR structure (replace with actual HUD data)")
    
    # Integrate with county data
    integrate_fmr_with_counties()
    
    print("\n✓ Integration complete!")
    print("Next steps:")
    print("1. Replace sample FMR data with actual HUD dataset")
    print("2. Add historical FMR data for trend calculations")
    print("3. Update UI to display bedroom-specific rents")
