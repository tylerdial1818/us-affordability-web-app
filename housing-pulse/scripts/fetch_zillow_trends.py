"""
fetch_zillow_trends.py — Download and reshape Zillow ZHVI/ZORI CSVs

Output:
    public/data/zhvi_trends.json   — County-level time series
    public/data/national_trends.json — National aggregated trend line

Usage:
    pip install pandas requests
    python scripts/fetch_zillow_trends.py

Data Source: https://www.zillow.com/research/data/
    → Select "ZHVI All Homes (SFR, Condo/Co-op)" → Geography: "County" → Download CSV
    → Place the downloaded CSV in scripts/ as "County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"

Alternatively, this script will attempt to download it automatically.
"""

import json
import os
import sys

import pandas as pd
import requests

# ─── CONFIG ───────────────────────────────────────────────────────
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPTS_DIR, "..", "public", "data")

# Zillow ZHVI download URL (county level, all homes)
ZHVI_URL = "https://files.zillowstatic.com/research/public_csvs/zhvi/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
ZHVI_CSV = os.path.join(SCRIPTS_DIR, "County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv")

ZHVI_TRENDS_OUTPUT = os.path.join(DATA_DIR, "zhvi_trends.json")
NATIONAL_TRENDS_OUTPUT = os.path.join(DATA_DIR, "national_trends.json")


def download_zhvi():
    """Download ZHVI CSV if not already present."""
    if os.path.exists(ZHVI_CSV):
        print(f"Using existing CSV: {ZHVI_CSV}")
        return

    print(f"Downloading ZHVI county data from Zillow...")
    print(f"URL: {ZHVI_URL}")

    try:
        response = requests.get(ZHVI_URL, timeout=120, stream=True)
        response.raise_for_status()

        with open(ZHVI_CSV, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = os.path.getsize(ZHVI_CSV) / (1024 * 1024)
        print(f"Downloaded {file_size:.1f} MB")
    except Exception as e:
        print(f"ERROR downloading ZHVI: {e}")
        print("Please download manually from https://www.zillow.com/research/data/")
        print(f"Place the CSV in: {ZHVI_CSV}")
        sys.exit(1)


def process_zhvi():
    """Process ZHVI CSV into time-series JSON."""
    print("Processing ZHVI data...")
    df = pd.read_csv(ZHVI_CSV)

    # Identify date columns (format: YYYY-MM-DD)
    meta_cols = ["RegionID", "SizeRank", "RegionName", "RegionType", "StateName", "State", "Metro", "StateCodeFIPS", "MunicipalCodeFIPS"]
    date_cols = [c for c in df.columns if c not in meta_cols and "-" in c]
    date_cols.sort()

    print(f"Found {len(date_cols)} monthly data points ({date_cols[0]} to {date_cols[-1]})")
    print(f"Found {len(df)} counties")

    # Build FIPS code (5-digit, zero-padded)
    df["fips"] = (
        df["StateCodeFIPS"].astype(str).str.zfill(2) +
        df["MunicipalCodeFIPS"].astype(str).str.zfill(3)
    )

    # ─── County-level trends ─────────────────────────────────────
    # Only keep last 10 years of monthly data to control file size
    recent_dates = date_cols[-120:]  # 10 years of monthly data

    county_trends = {}
    for _, row in df.iterrows():
        fips = row["fips"]
        series = []
        for date_str in recent_dates:
            val = row.get(date_str)
            if pd.notna(val):
                series.append({
                    "date": date_str,
                    "value": round(float(val)),
                })

        if not series:
            continue

        # Compute YoY appreciation
        current = series[-1]["value"] if series else None
        year_ago = None
        if len(series) > 12:
            year_ago = series[-13]["value"]

        five_year_ago = None
        if len(series) > 60:
            five_year_ago = series[-61]["value"]

        yoy = None
        if current and year_ago and year_ago > 0:
            yoy = round(((current - year_ago) / year_ago) * 100, 1)

        cagr = None
        if current and five_year_ago and five_year_ago > 0:
            cagr = round(((current / five_year_ago) ** (1 / 5) - 1) * 100, 1)

        county_trends[fips] = {
            "name": row.get("RegionName", ""),
            "state": row.get("StateName", ""),
            "current_zhvi": current,
            "yoy_appreciation": yoy,
            "five_year_cagr": cagr,
            "series": series,
        }

    # ─── National trend line ─────────────────────────────────────
    print("Computing national trend...")
    national_series = []
    for date_str in recent_dates:
        values = df[date_str].dropna()
        if len(values) > 0:
            national_series.append({
                "date": date_str,
                "median": round(float(values.median())),
                "mean": round(float(values.mean())),
                "p25": round(float(values.quantile(0.25))),
                "p75": round(float(values.quantile(0.75))),
                "count": int(len(values)),
            })

    # State-level aggregates
    print("Computing state-level aggregates...")
    state_trends = {}
    for state in df["StateName"].dropna().unique():
        state_df = df[df["StateName"] == state]
        state_series = []
        for date_str in recent_dates[-24:]:  # Last 2 years for states
            values = state_df[date_str].dropna()
            if len(values) > 0:
                state_series.append({
                    "date": date_str,
                    "median": round(float(values.median())),
                })
        if state_series:
            state_trends[state] = {
                "series": state_series,
                "current": state_series[-1]["median"] if state_series else None,
            }

    national_data = {
        "series": national_series,
        "state_trends": state_trends,
        "last_updated": recent_dates[-1] if recent_dates else None,
        "total_counties": len(county_trends),
    }

    return county_trends, national_data


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    download_zhvi()
    county_trends, national_data = process_zhvi()

    # Write county trends
    with open(ZHVI_TRENDS_OUTPUT, "w") as f:
        json.dump(county_trends, f, indent=None, separators=(",", ":"))
    size1 = os.path.getsize(ZHVI_TRENDS_OUTPUT) / (1024 * 1024)
    print(f"Wrote {len(county_trends)} county trends to {ZHVI_TRENDS_OUTPUT} ({size1:.1f} MB)")

    # Write national trends
    with open(NATIONAL_TRENDS_OUTPUT, "w") as f:
        json.dump(national_data, f, indent=None, separators=(",", ":"))
    size2 = os.path.getsize(NATIONAL_TRENDS_OUTPUT) / (1024 * 1024)
    print(f"Wrote national trends to {NATIONAL_TRENDS_OUTPUT} ({size2:.1f} MB)")

    # Spot checks
    print("\nSpot checks (county trends):")
    for fips in ["06037", "36061", "06081"]:
        if fips in county_trends:
            ct = county_trends[fips]
            print(f"  {fips} ({ct['name']}, {ct['state']}): "
                  f"Current ZHVI: ${ct['current_zhvi']:,.0f}, "
                  f"YoY: {ct['yoy_appreciation']}%, "
                  f"5yr CAGR: {ct['five_year_cagr']}%")


if __name__ == "__main__":
    main()
