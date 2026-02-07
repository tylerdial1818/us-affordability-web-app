"""
fetch_tract_data.py — Pull ACS 5-year tract-level data for all 51 states (50 + DC)

Output: public/data/tracts/state_{FIPS}.json (one file per state)

Usage:
    pip install requests
    export CENSUS_API_KEY=your_key_here
    python scripts/fetch_tract_data.py

Get a free API key at: https://api.census.gov/data/key_signup.html

This fetches tract-level Census data state-by-state (the Census API requires
querying tracts within a single state) and computes derived affordability and
demographic metrics for each tract.
"""

import json
import os
import sys
import time

import requests

# ─── CONFIG ───────────────────────────────────────────────────────
API_KEY = os.environ.get("CENSUS_API_KEY", "")
BASE_URL = "https://api.census.gov/data/2023/acs/acs5"

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPTS_DIR, "..", "public", "data", "tracts")

RATE_LIMIT_SLEEP = 0.5  # seconds between state requests

# All 51 state FIPS codes (50 states + DC)
STATE_FIPS_LIST = [
    "01", "02", "04", "05", "06", "08", "09", "10", "11", "12",
    "13", "15", "16", "17", "18", "19", "20", "21", "22", "23",
    "24", "25", "26", "27", "28", "29", "30", "31", "32", "33",
    "34", "35", "36", "37", "38", "39", "40", "41", "42", "44",
    "45", "46", "47", "48", "49", "50", "51", "53", "54", "55",
    "56",
]

# ACS variables to fetch (Census variable code -> friendly field name)
VARIABLES = {
    "NAME":         "name",
    "B19013_001E":  "median_household_income",
    "B25077_001E":  "median_home_value",
    "B25064_001E":  "median_gross_rent",
    "B01003_001E":  "population",
    "B01002_001E":  "median_age",
    "B25001_001E":  "total_housing_units",
    "B25003_002E":  "owner_occupied",
    "B25003_003E":  "renter_occupied",
    "B25002_003E":  "vacant_units",
    "B17001_001E":  "poverty_universe",
    "B17001_002E":  "poverty_count",
    "B23025_002E":  "labor_force",
    "B23025_005E":  "unemployed",
    "B25070_007E":  "rent_30_34pct",
    "B25070_008E":  "rent_35_39pct",
    "B25070_009E":  "rent_40_49pct",
    "B25070_010E":  "rent_50plus_pct",
    "B25070_001E":  "rent_total",
}

# Fields that should be stored as integers
INT_FIELDS = {
    "population", "total_housing_units", "owner_occupied", "renter_occupied",
    "vacant_units", "poverty_count", "poverty_universe", "unemployed",
    "labor_force", "rent_30_34pct", "rent_35_39pct", "rent_40_49pct",
    "rent_50plus_pct", "rent_total",
}


# ─── HELPERS ──────────────────────────────────────────────────────

def safe_float(val):
    """Convert Census API value to float, handling nulls and sentinel values."""
    if val is None or val == "" or val == "null":
        return None
    try:
        n = float(val)
        # Census uses -666666666 as a sentinel for missing/suppressed data
        if n < -600000000:
            return None
        return n
    except (ValueError, TypeError):
        return None


def safe_int(val):
    """Convert Census API value to int, handling nulls and sentinel values."""
    f = safe_float(val)
    if f is None:
        return None
    return int(f)


def compute_derived(row):
    """Compute all derived affordability and demographic metrics for a tract."""
    income = row.get("median_household_income")
    home_val = row.get("median_home_value")
    owner = row.get("owner_occupied")
    renter = row.get("renter_occupied")
    vacant = row.get("vacant_units")
    total_units = row.get("total_housing_units")
    poverty_ct = row.get("poverty_count")
    poverty_univ = row.get("poverty_universe")
    unemployed = row.get("unemployed")
    labor = row.get("labor_force")

    # Affordability ratio (home value / income)
    if income and income > 0 and home_val and home_val > 0:
        row["affordability_ratio"] = round(home_val / income, 2)
    else:
        row["affordability_ratio"] = None

    # Affordable home price (3x annual income rule of thumb)
    if income and income > 0:
        row["affordable_home_price"] = round(income * 3)
    else:
        row["affordable_home_price"] = None

    # Affordability gap (actual price minus what locals can afford)
    if home_val and row.get("affordable_home_price"):
        row["affordability_gap"] = round(home_val - row["affordable_home_price"])
    else:
        row["affordability_gap"] = None

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

    # Percentage of cost-burdened renters (paying 30%+ of income on rent)
    rent_burdened_fields = ["rent_30_34pct", "rent_35_39pct", "rent_40_49pct", "rent_50plus_pct"]
    rent_burdened = sum(row.get(f) or 0 for f in rent_burdened_fields)
    rent_total = row.get("rent_total")
    if rent_total and rent_total > 0:
        row["pct_cost_burdened_renters"] = round((rent_burdened / rent_total) * 100, 1)
    else:
        row["pct_cost_burdened_renters"] = None

    # Clean up intermediate fields that were only needed for derived calculations
    for f in rent_burdened_fields + [
        "rent_total", "poverty_count", "poverty_universe",
        "unemployed", "labor_force",
    ]:
        row.pop(f, None)

    return row


# ─── MAIN FETCH LOGIC ────────────────────────────────────────────

def fetch_state_tracts(state_fips):
    """
    Fetch all tract-level data for a single state from the Census ACS API.

    Returns a list of tract dictionaries with raw + derived fields.
    """
    var_codes = ",".join(VARIABLES.keys())
    url = (
        f"{BASE_URL}?get={var_codes}"
        f"&for=tract:*"
        f"&in=state:{state_fips}"
        f"&key={API_KEY}"
    )

    response = requests.get(url, timeout=120)
    response.raise_for_status()
    data = response.json()

    # First row is column headers
    headers = data[0]
    rows = data[1:]

    # Build index mapping: column position -> our field name
    header_map = {}
    for i, h in enumerate(headers):
        if h in VARIABLES:
            header_map[i] = VARIABLES[h]
        elif h == "state":
            header_map[i] = "_state_fips"
        elif h == "county":
            header_map[i] = "_county_fips"
        elif h == "tract":
            header_map[i] = "_tract_code"

    # Parse each row into a tract record
    tracts = []
    for row in rows:
        record = {}
        state_code = ""
        county_code = ""
        tract_code = ""

        for i, val in enumerate(row):
            if i not in header_map:
                continue
            field = header_map[i]

            if field == "_state_fips":
                state_code = val.zfill(2)
            elif field == "_county_fips":
                county_code = val.zfill(3)
            elif field == "_tract_code":
                tract_code = val.zfill(6)
            elif field == "name":
                record["name"] = val
            elif field in INT_FIELDS:
                record[field] = safe_int(val)
            else:
                record[field] = safe_float(val)

        # Build the 11-digit GEOID: state(2) + county(3) + tract(6)
        geoid = state_code + county_code + tract_code
        record["geoid"] = geoid
        record["state_fips"] = state_code
        record["county_fips"] = state_code + county_code

        # Filter out tracts with zero or null population
        pop = record.get("population")
        if pop is None or pop <= 0:
            continue

        # Compute derived affordability and demographic metrics
        record = compute_derived(record)

        tracts.append(record)

    return tracts


def main():
    if not API_KEY:
        print("ERROR: Set CENSUS_API_KEY environment variable.")
        print("Get a free key at: https://api.census.gov/data/key_signup.html")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    total_tracts = 0
    failed_states = []

    print(f"Fetching tract-level ACS data for {len(STATE_FIPS_LIST)} states...")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    for idx, fips in enumerate(STATE_FIPS_LIST, start=1):
        output_path = os.path.join(OUTPUT_DIR, f"state_{fips}.json")

        try:
            print(f"[{idx}/{len(STATE_FIPS_LIST)}] State FIPS {fips}...", end=" ", flush=True)
            tracts = fetch_state_tracts(fips)

            # Write one JSON file per state
            with open(output_path, "w") as f:
                json.dump(tracts, f, indent=None, separators=(",", ":"))

            file_size_kb = os.path.getsize(output_path) / 1024
            total_tracts += len(tracts)
            print(f"{len(tracts)} tracts ({file_size_kb:.0f} KB)")

        except requests.exceptions.HTTPError as e:
            print(f"HTTP ERROR: {e}")
            failed_states.append(fips)
        except requests.exceptions.RequestException as e:
            print(f"REQUEST ERROR: {e}")
            failed_states.append(fips)
        except Exception as e:
            print(f"ERROR: {e}")
            failed_states.append(fips)

        # Rate-limit: sleep between requests to be a good API citizen
        if idx < len(STATE_FIPS_LIST):
            time.sleep(RATE_LIMIT_SLEEP)

    # ─── Summary ──────────────────────────────────────────────────
    print()
    print("=" * 60)
    print(f"Total tracts fetched: {total_tracts:,}")
    print(f"States processed:     {len(STATE_FIPS_LIST) - len(failed_states)}/{len(STATE_FIPS_LIST)}")

    if failed_states:
        print(f"Failed states:        {', '.join(failed_states)}")
    else:
        print("All states succeeded.")

    # Spot-check a few well-known states
    spot_checks = {
        "06": "California",
        "36": "New York",
        "48": "Texas",
        "17": "Illinois",
        "11": "District of Columbia",
    }
    print("\nSpot checks:")
    for fips, state_name in spot_checks.items():
        state_file = os.path.join(OUTPUT_DIR, f"state_{fips}.json")
        if os.path.exists(state_file):
            with open(state_file) as f:
                tracts = json.load(f)
            if tracts:
                # Show a sample tract
                sample = tracts[0]
                print(f"  {state_name} (FIPS {fips}): {len(tracts)} tracts")
                print(f"    Sample: {sample.get('name', 'N/A')}")
                print(f"    Income: ${sample.get('median_household_income') or 0:,.0f}, "
                      f"Home Value: ${sample.get('median_home_value') or 0:,.0f}, "
                      f"Ratio: {sample.get('affordability_ratio', 'N/A')}")
        else:
            print(f"  {state_name} (FIPS {fips}): FILE NOT FOUND")

    print(f"\nOutput directory: {OUTPUT_DIR}")
    print("Done.")


if __name__ == "__main__":
    main()
