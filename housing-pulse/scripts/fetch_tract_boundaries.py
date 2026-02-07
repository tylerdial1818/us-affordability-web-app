"""
fetch_tract_boundaries.py — Download Census cartographic boundary shapefiles
and convert to TopoJSON for lightweight map rendering.

Output: public/data/geo/tracts_{FIPS}.topojson (one file per state)

Usage:
    python scripts/fetch_tract_boundaries.py

Dependencies (must be installed separately):
    - GDAL (provides ogr2ogr): brew install gdal  /  apt install gdal-bin
    - topojson-server (provides geo2topo): npm install -g topojson-server
    - mapshaper (optional, for simplification): npm install -g mapshaper

The script will check for these dependencies at startup and warn if any are
missing. It can still run partially without mapshaper (simplification is
optional), but ogr2ogr and geo2topo are required.

Data Source:
    https://www2.census.gov/geo/tiger/GENZ2023/shp/
    Cartographic boundary files, 1:500,000 scale (cb_2023_{FIPS}_tract_500k.zip)
"""

import os
import shutil
import subprocess
import sys
import tempfile
import zipfile

import requests

# ─── CONFIG ───────────────────────────────────────────────────────
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPTS_DIR, "..", "public", "data", "geo")

CENSUS_BOUNDARY_BASE_URL = (
    "https://www2.census.gov/geo/tiger/GENZ2023/shp"
)

# Quantization level for TopoJSON (higher = more precision but larger files)
QUANTIZATION = 1e5

# All 51 state FIPS codes (50 states + DC)
STATE_FIPS_LIST = [
    "01", "02", "04", "05", "06", "08", "09", "10", "11", "12",
    "13", "15", "16", "17", "18", "19", "20", "21", "22", "23",
    "24", "25", "26", "27", "28", "29", "30", "31", "32", "33",
    "34", "35", "36", "37", "38", "39", "40", "41", "42", "44",
    "45", "46", "47", "48", "49", "50", "51", "53", "54", "55",
    "56",
]


# ─── DEPENDENCY CHECKS ───────────────────────────────────────────

def check_command(cmd):
    """Check if a command-line tool is available on PATH."""
    return shutil.which(cmd) is not None


def check_dependencies():
    """
    Verify that required external tools are installed.
    Returns a dict of tool_name -> is_available.
    """
    deps = {
        "ogr2ogr": check_command("ogr2ogr"),
        "geo2topo": check_command("geo2topo"),
        "mapshaper": check_command("mapshaper"),
    }

    print("Dependency check:")
    for tool, available in deps.items():
        status = "OK" if available else "NOT FOUND"
        print(f"  {tool}: {status}")

    if not deps["ogr2ogr"]:
        print()
        print("ERROR: ogr2ogr (GDAL) is required but not found.")
        print("Install it with:")
        print("  macOS:   brew install gdal")
        print("  Ubuntu:  sudo apt install gdal-bin")
        print("  Windows: OSGeo4W installer or conda install gdal")
        sys.exit(1)

    if not deps["geo2topo"]:
        print()
        print("ERROR: geo2topo (topojson-server) is required but not found.")
        print("Install it with:")
        print("  npm install -g topojson-server")
        sys.exit(1)

    if not deps["mapshaper"]:
        print()
        print("WARNING: mapshaper not found. Simplification will be skipped.")
        print("Install for smaller output files:")
        print("  npm install -g mapshaper")
        print()

    return deps


# ─── DOWNLOAD & CONVERSION ───────────────────────────────────────

def download_shapefile(state_fips, dest_dir):
    """
    Download the Census cartographic boundary shapefile ZIP for one state.

    The files are named: cb_2023_{FIPS}_tract_500k.zip
    Returns the path to the downloaded ZIP file.
    """
    filename = f"cb_2023_{state_fips}_tract_500k.zip"
    url = f"{CENSUS_BOUNDARY_BASE_URL}/{filename}"
    dest_path = os.path.join(dest_dir, filename)

    response = requests.get(url, timeout=120, stream=True)
    response.raise_for_status()

    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    return dest_path


def unzip_shapefile(zip_path, dest_dir):
    """
    Extract the shapefile ZIP into dest_dir.
    Returns the path to the .shp file inside.
    """
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(dest_dir)

    # Find the .shp file in the extracted contents
    for fname in os.listdir(dest_dir):
        if fname.endswith(".shp"):
            return os.path.join(dest_dir, fname)

    raise FileNotFoundError(f"No .shp file found in {zip_path}")


def shapefile_to_geojson(shp_path, geojson_path):
    """
    Convert a shapefile to GeoJSON using ogr2ogr (GDAL).
    Projects to WGS84 (EPSG:4326) for web compatibility.
    """
    cmd = [
        "ogr2ogr",
        "-f", "GeoJSON",
        "-t_srs", "EPSG:4326",
        geojson_path,
        shp_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"ogr2ogr failed (exit {result.returncode}):\n"
            f"  stdout: {result.stdout}\n"
            f"  stderr: {result.stderr}"
        )
    return geojson_path


def geojson_to_topojson(geojson_path, topojson_path, quantization=QUANTIZATION):
    """
    Convert GeoJSON to TopoJSON using geo2topo with quantization.
    Quantization reduces coordinate precision, producing smaller files.
    """
    cmd = [
        "geo2topo",
        f"tracts={geojson_path}",
        "-q", str(int(quantization)),
        "-o", topojson_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"geo2topo failed (exit {result.returncode}):\n"
            f"  stdout: {result.stdout}\n"
            f"  stderr: {result.stderr}"
        )
    return topojson_path


def simplify_topojson(topojson_path, output_path, keep_proportion=0.3):
    """
    Optionally simplify TopoJSON geometry using mapshaper to reduce file size.
    keep_proportion=0.3 keeps 30% of vertices (good balance of size vs. detail).
    """
    cmd = [
        "mapshaper",
        topojson_path,
        "-simplify", f"{keep_proportion * 100:.0f}%",
        "keep-shapes",
        "-o", output_path,
        "format=topojson",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"mapshaper failed (exit {result.returncode}):\n"
            f"  stdout: {result.stdout}\n"
            f"  stderr: {result.stderr}"
        )
    return output_path


def process_state(state_fips, deps):
    """
    Full pipeline for one state: download -> unzip -> GeoJSON -> TopoJSON.

    Uses a temporary directory for intermediate files, cleaning up afterward.
    """
    output_path = os.path.join(OUTPUT_DIR, f"tracts_{state_fips}.topojson")

    with tempfile.TemporaryDirectory(prefix=f"tracts_{state_fips}_") as tmp_dir:
        # Step 1: Download the shapefile ZIP
        zip_path = download_shapefile(state_fips, tmp_dir)

        # Step 2: Unzip
        shp_dir = os.path.join(tmp_dir, "shp")
        os.makedirs(shp_dir, exist_ok=True)
        shp_path = unzip_shapefile(zip_path, shp_dir)

        # Step 3: Convert shapefile to GeoJSON
        geojson_path = os.path.join(tmp_dir, "tracts.geojson")
        shapefile_to_geojson(shp_path, geojson_path)

        # Step 4: Convert GeoJSON to TopoJSON with quantization
        raw_topojson_path = os.path.join(tmp_dir, "tracts_raw.topojson")
        geojson_to_topojson(geojson_path, raw_topojson_path)

        # Step 5: Optionally simplify with mapshaper
        if deps.get("mapshaper"):
            simplified_path = os.path.join(tmp_dir, "tracts_simplified.topojson")
            try:
                simplify_topojson(raw_topojson_path, simplified_path)
                # Use the simplified version as the final output
                shutil.copy2(simplified_path, output_path)
            except RuntimeError as e:
                # If simplification fails, fall back to unsimplified
                print(f"    WARNING: Simplification failed, using unsimplified: {e}")
                shutil.copy2(raw_topojson_path, output_path)
        else:
            # No mapshaper available; use the quantized-only version
            shutil.copy2(raw_topojson_path, output_path)

    # tmp_dir is automatically cleaned up by tempfile.TemporaryDirectory
    return output_path


# ─── MAIN ─────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Census Tract Boundary Downloader & TopoJSON Converter")
    print("=" * 60)
    print()

    # Check that required CLI tools are installed
    deps = check_dependencies()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    total_processed = 0
    total_size_kb = 0
    failed_states = []

    print(f"\nProcessing {len(STATE_FIPS_LIST)} states...")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    for idx, fips in enumerate(STATE_FIPS_LIST, start=1):
        try:
            print(f"[{idx}/{len(STATE_FIPS_LIST)}] State FIPS {fips}...", end=" ", flush=True)
            output_path = process_state(fips, deps)

            file_size_kb = os.path.getsize(output_path) / 1024
            total_size_kb += file_size_kb
            total_processed += 1
            print(f"OK ({file_size_kb:.0f} KB)")

        except requests.exceptions.HTTPError as e:
            print(f"DOWNLOAD ERROR: {e}")
            failed_states.append(fips)
        except FileNotFoundError as e:
            print(f"FILE ERROR: {e}")
            failed_states.append(fips)
        except RuntimeError as e:
            print(f"CONVERSION ERROR: {e}")
            failed_states.append(fips)
        except Exception as e:
            print(f"ERROR: {e}")
            failed_states.append(fips)

    # ─── Summary ──────────────────────────────────────────────────
    print()
    print("=" * 60)
    print(f"States processed:  {total_processed}/{len(STATE_FIPS_LIST)}")
    print(f"Total output size: {total_size_kb / 1024:.1f} MB")

    if failed_states:
        print(f"Failed states:     {', '.join(failed_states)}")
    else:
        print("All states succeeded.")

    print(f"\nOutput directory: {OUTPUT_DIR}")
    print("Done.")


if __name__ == "__main__":
    main()
