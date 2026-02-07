"""
build_geo_data.py — Merge census data into GeoJSON for map rendering

Output: public/data/counties_geo.json

Usage:
    pip install requests topojson
    python scripts/build_geo_data.py

This script:
1. Downloads TopoJSON county boundaries from us-atlas
2. Converts to GeoJSON
3. Joins ACS metrics by FIPS code into each Feature's properties
4. Outputs optimized GeoJSON ready for map rendering
"""

import json
import os
import sys

import requests

# ─── CONFIG ───────────────────────────────────────────────────────
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPTS_DIR, "..", "public", "data")

TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"
STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

ACS_DATA_PATH = os.path.join(DATA_DIR, "counties_acs.json")
GEO_OUTPUT_PATH = os.path.join(DATA_DIR, "counties_geo.json")


def download_topojson():
    """Download county TopoJSON from us-atlas CDN."""
    print("Downloading county TopoJSON...")
    response = requests.get(TOPOJSON_URL, timeout=30)
    response.raise_for_status()
    topo = response.json()
    file_size = len(response.content) / 1024
    print(f"Downloaded {file_size:.0f} KB TopoJSON ({len(topo.get('objects', {}).get('counties', {}).get('geometries', []))} geometries)")
    return topo


def topojson_to_geojson(topo, object_name="counties"):
    """
    Convert TopoJSON to GeoJSON.
    This is a simplified converter — for production, use the topojson Python package.
    """
    try:
        import topojson as tp
        # Use the topojson library if available
        tj = tp.Topology(topo)
        geojson = tj.to_geojson()
        return json.loads(geojson)
    except ImportError:
        pass

    # Fallback: manual conversion for simple cases
    # Note: This is a basic implementation. For complex topologies,
    # install the topojson package: pip install topojson
    print("WARNING: topojson package not installed. Using simplified conversion.")
    print("For best results: pip install topojson")

    obj = topo["objects"][object_name]
    arcs = topo["arcs"]
    transform = topo.get("transform")

    def decode_arc(arc_index):
        """Decode a single arc from the TopoJSON arc array."""
        if arc_index < 0:
            # Reverse arc
            arc = arcs[~arc_index]
            coords = decode_positions(arc)
            coords.reverse()
            return coords
        else:
            return decode_positions(arcs[arc_index])

    def decode_positions(arc):
        """Decode quantized positions."""
        coords = []
        x, y = 0, 0
        for point in arc:
            x += point[0]
            y += point[1]
            if transform:
                sx = transform["scale"][0]
                sy = transform["scale"][1]
                tx = transform["translate"][0]
                ty = transform["translate"][1]
                coords.append([x * sx + tx, y * sy + ty])
            else:
                coords.append([x, y])
        return coords

    def decode_geometry(geom):
        """Decode a TopoJSON geometry to GeoJSON coordinates."""
        geom_type = geom["type"]

        if geom_type == "Polygon":
            rings = []
            for ring in geom["arcs"]:
                coords = []
                for arc_idx in ring:
                    decoded = decode_arc(arc_idx)
                    coords.extend(decoded[:-1] if coords else decoded)
                if coords and coords[0] != coords[-1]:
                    coords.append(coords[0])
                rings.append(coords)
            return {"type": "Polygon", "coordinates": rings}

        elif geom_type == "MultiPolygon":
            polygons = []
            for polygon in geom["arcs"]:
                rings = []
                for ring in polygon:
                    coords = []
                    for arc_idx in ring:
                        decoded = decode_arc(arc_idx)
                        coords.extend(decoded[:-1] if coords else decoded)
                    if coords and coords[0] != coords[-1]:
                        coords.append(coords[0])
                    rings.append(coords)
                polygons.append(rings)
            return {"type": "MultiPolygon", "coordinates": polygons}

        return None

    # Convert geometries
    features = []
    for geom in obj["geometries"]:
        geometry = decode_geometry(geom)
        if geometry:
            feature = {
                "type": "Feature",
                "id": geom.get("id", ""),
                "properties": geom.get("properties", {}),
                "geometry": geometry,
            }
            features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def merge_acs_data(geojson, acs_data):
    """Merge ACS county data into GeoJSON feature properties."""
    matched = 0
    unmatched = 0

    for feature in geojson["features"]:
        fips = str(feature.get("id", "")).zfill(5)
        feature["properties"]["fips"] = fips

        if fips in acs_data:
            county = acs_data[fips]
            # Add key metrics to properties
            for key in [
                "county_name", "state", "population", "median_household_income",
                "median_home_value", "median_gross_rent", "affordability_ratio",
                "affordable_home_price", "affordability_gap", "homeownership_rate",
                "vacancy_rate", "pct_cost_burdened_renters", "pct_cost_burdened_owners",
                "poverty_rate", "unemployment_rate",
            ]:
                feature["properties"][key] = county.get(key)
            matched += 1
        else:
            unmatched += 1

    print(f"Matched: {matched}, Unmatched: {unmatched}")
    return geojson


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # Download TopoJSON
    topo = download_topojson()

    # Convert to GeoJSON
    print("Converting TopoJSON to GeoJSON...")
    geojson = topojson_to_geojson(topo)
    print(f"Generated {len(geojson['features'])} GeoJSON features")

    # Load and merge ACS data if available
    if os.path.exists(ACS_DATA_PATH):
        print(f"Loading ACS data from {ACS_DATA_PATH}...")
        with open(ACS_DATA_PATH) as f:
            acs_data = json.load(f)
        geojson = merge_acs_data(geojson, acs_data)
    else:
        print(f"ACS data not found at {ACS_DATA_PATH}")
        print("Run fetch_census_data.py first to generate ACS data.")
        print("Proceeding with geometry only...")

    # Write output
    with open(GEO_OUTPUT_PATH, "w") as f:
        json.dump(geojson, f, indent=None, separators=(",", ":"))

    file_size = os.path.getsize(GEO_OUTPUT_PATH) / (1024 * 1024)
    print(f"\nWrote {len(geojson['features'])} features to {GEO_OUTPUT_PATH}")
    print(f"File size: {file_size:.1f} MB")

    if file_size > 5:
        print("WARNING: File exceeds 5MB. Consider simplifying geometries:")
        print("  pip install topojson")
        print("  Use topojson.Topology with quantization to reduce file size.")


if __name__ == "__main__":
    main()
