"""
fetch_census_data.py — Pull ACS 5-year data for all ~3,100 US counties

Output: public/data/counties_acs.json

Usage:
    pip install requests
    export CENSUS_API_KEY=your_key_here
    python scripts/fetch_census_data.py

Get a free API key at: https://api.census.gov/data/key_signup.html
"""

import json
import os
import sys
import requests

# ─── CONFIG ───────────────────────────────────────────────────────
API_KEY = os.environ.get("CENSUS_API_KEY", "")
BASE_URL = "https://api.census.gov/data/2023/acs/acs5"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "data", "counties_acs.json")

# ACS variables to fetch
VARIABLES = {
    "NAME": "name",
    "B01003_001E": "population",
    "B01002_001E": "median_age",
    "B19013_001E": "median_household_income",
    "B25077_001E": "median_home_value",
    "B25064_001E": "median_gross_rent",
    "B25001_001E": "total_housing_units",
    "B25003_002E": "owner_occupied",
    "B25003_003E": "renter_occupied",
    "B25002_003E": "vacant_units",
    "B25035_001E": "median_year_built",
    "B17001_001E": "poverty_universe",
    "B17001_002E": "poverty_count",
    "B23025_002E": "labor_force",
    "B23025_005E": "unemployed",
    # Cost burden: renters paying 30%+ of income
    "B25070_007E": "rent_30_34pct",
    "B25070_008E": "rent_35_39pct",
    "B25070_009E": "rent_40_49pct",
    "B25070_010E": "rent_50plus_pct",
    "B25070_001E": "rent_total",
    # Cost burden: owners paying 30%+ of income
    "B25091_008E": "own_30_34pct",
    "B25091_009E": "own_35_39pct",
    "B25091_010E": "own_40_49pct",
    "B25091_011E": "own_50plus_pct",
    "B25091_001E": "own_total",
}


def safe_float(val):
    """Convert Census API value to float, handling nulls and sentinel values."""
    if val is None or val == "" or val == "null":
        return None
    try:
        n = float(val)
        # Census uses -666666666 as a sentinel for missing data
        if n < -600000000:
            return None
        return n
    except (ValueError, TypeError):
        return None


def safe_int(val):
    """Convert Census API value to int."""
    f = safe_float(val)
    if f is None:
        return None
    return int(f)


def compute_derived(row):
    """Compute all derived metrics for a county."""
    income = row.get("median_household_income")
    home_val = row.get("median_home_value")
    rent = row.get("median_gross_rent")
    owner = row.get("owner_occupied")
    renter = row.get("renter_occupied")
    vacant = row.get("vacant_units")
    total_units = row.get("total_housing_units")
    poverty_ct = row.get("poverty_count")
    poverty_univ = row.get("poverty_universe")
    unemployed = row.get("unemployed")
    labor = row.get("labor_force")

    # Affordability ratio
    if income and income > 0 and home_val and home_val > 0:
        row["affordability_ratio"] = round(home_val / income, 2)
    else:
        row["affordability_ratio"] = None

    # Affordable home price (3x rule)
    if income and income > 0:
        row["affordable_home_price"] = round(income * 3)
        row["monthly_income"] = round(income / 12)
    else:
        row["affordable_home_price"] = None
        row["monthly_income"] = None

    # Affordability gap
    if home_val and row.get("affordable_home_price"):
        row["affordability_gap"] = round(home_val - row["affordable_home_price"])
    else:
        row["affordability_gap"] = None

    # Price to rent ratio
    if home_val and rent and rent > 0:
        row["price_to_rent_ratio"] = round(home_val / (rent * 12), 1)
    else:
        row["price_to_rent_ratio"] = None

    # Vacancy rate
    if vacant is not None and total_units and total_units > 0:
        row["vacancy_rate"] = round((vacant / total_units) * 100, 1)
    else:
        row["vacancy_rate"] = None

    # Homeownership rate
    if owner is not None and renter is not None:
        total_occ = owner + renter
        if total_occ > 0:
            row["homeownership_rate"] = round((owner / total_occ) * 100, 1)
        else:
            row["homeownership_rate"] = None
    else:
        row["homeownership_rate"] = None

    # Poverty rate
    if poverty_ct is not None and poverty_univ and poverty_univ > 0:
        row["poverty_rate"] = round((poverty_ct / poverty_univ) * 100, 1)
    else:
        row["poverty_rate"] = None

    # Unemployment rate
    if unemployed is not None and labor and labor > 0:
        row["unemployment_rate"] = round((unemployed / labor) * 100, 1)
    else:
        row["unemployment_rate"] = None

    # Cost-burdened renters (paying 30%+ of income on housing)
    rent_burdened_fields = ["rent_30_34pct", "rent_35_39pct", "rent_40_49pct", "rent_50plus_pct"]
    rent_burdened = sum(row.get(f) or 0 for f in rent_burdened_fields)
    rent_total = row.get("rent_total")
    if rent_total and rent_total > 0:
        row["pct_cost_burdened_renters"] = round((rent_burdened / rent_total) * 100, 1)
    else:
        row["pct_cost_burdened_renters"] = None

    # Cost-burdened owners
    own_burdened_fields = ["own_30_34pct", "own_35_39pct", "own_40_49pct", "own_50plus_pct"]
    own_burdened = sum(row.get(f) or 0 for f in own_burdened_fields)
    own_total = row.get("own_total")
    if own_total and own_total > 0:
        row["pct_cost_burdened_owners"] = round((own_burdened / own_total) * 100, 1)
    else:
        row["pct_cost_burdened_owners"] = None

    # Clean up intermediate fields
    for f in rent_burdened_fields + own_burdened_fields + [
        "rent_total", "own_total", "poverty_count", "poverty_universe",
        "unemployed", "labor_force",
    ]:
        row.pop(f, None)

    return row


def fetch_county_data():
    """Fetch all county data from Census ACS API."""
    if not API_KEY:
        print("ERROR: Set CENSUS_API_KEY environment variable.")
        print("Get a free key at: https://api.census.gov/data/key_signup.html")
        sys.exit(1)

    var_codes = ",".join(VARIABLES.keys())
    url = f"{BASE_URL}?get={var_codes}&for=county:*&key={API_KEY}"

    print(f"Fetching data from Census ACS API...")
    print(f"URL: {url[:100]}...")

    response = requests.get(url, timeout=60)
    response.raise_for_status()
    data = response.json()

    # First row is headers
    headers = data[0]
    rows = data[1:]

    print(f"Received {len(rows)} counties")

    # Build lookup from Census variable codes to our field names
    header_map = {}
    for i, h in enumerate(headers):
        if h in VARIABLES:
            header_map[i] = VARIABLES[h]
        elif h == "state":
            header_map[i] = "_state_fips"
        elif h == "county":
            header_map[i] = "_county_fips"

    # Parse rows
    counties = {}
    for row in rows:
        record = {}
        state_fips = ""
        county_fips = ""

        for i, val in enumerate(row):
            if i in header_map:
                field = header_map[i]
                if field == "_state_fips":
                    state_fips = val.zfill(2)
                elif field == "_county_fips":
                    county_fips = val.zfill(3)
                elif field == "name":
                    record["name"] = val
                else:
                    # Numeric fields
                    if field in ("population", "total_housing_units", "owner_occupied",
                                 "renter_occupied", "vacant_units", "poverty_count",
                                 "poverty_universe", "unemployed", "labor_force",
                                 "rent_30_34pct", "rent_35_39pct", "rent_40_49pct",
                                 "rent_50plus_pct", "rent_total",
                                 "own_30_34pct", "own_35_39pct", "own_40_49pct",
                                 "own_50plus_pct", "own_total"):
                        record[field] = safe_int(val)
                    else:
                        record[field] = safe_float(val)

        fips = state_fips + county_fips
        record["fips"] = fips

        # Extract state abbreviation from name (e.g., "Los Angeles County, California")
        name_parts = record.get("name", "").split(", ")
        if len(name_parts) >= 2:
            record["state"] = name_parts[-1]
            record["county_name"] = name_parts[0]
        else:
            record["state"] = ""
            record["county_name"] = record.get("name", "")

        # Compute derived metrics
        record = compute_derived(record)

        counties[fips] = record

    return counties


def main():
    counties = fetch_county_data()

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(counties, f, indent=None, separators=(",", ":"))

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"Wrote {len(counties)} counties to {OUTPUT_PATH}")
    print(f"File size: {file_size / 1024 / 1024:.1f} MB")

    # Spot-check a few known counties
    spot_checks = {
        "06037": "Los Angeles County",
        "36061": "New York County",
        "17031": "Cook County",
        "48201": "Harris County",
        "06081": "San Mateo County",
    }
    print("\nSpot checks:")
    for fips, expected_name in spot_checks.items():
        if fips in counties:
            c = counties[fips]
            print(f"  {fips}: {c.get('county_name', 'N/A')} — "
                  f"Income: ${c.get('median_household_income', 'N/A'):,.0f}, "
                  f"Home Value: ${c.get('median_home_value', 'N/A'):,.0f}, "
                  f"Ratio: {c.get('affordability_ratio', 'N/A')}")
        else:
            print(f"  {fips}: NOT FOUND (expected {expected_name})")


if __name__ == "__main__":
    main()
