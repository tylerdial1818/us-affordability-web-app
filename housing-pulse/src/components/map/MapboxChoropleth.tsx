"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

// ─── CONSTANTS ──────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const COUNTIES_TOPO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATES_TOPO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// ─── TYPES ──────────────────────────────────────────────────────

export interface CountyTooltipData {
  fips: string;
  name: string;
  state: string;
  income: number;
  value: number;
  ratio: number;
  rent: number | null;
  rentRatio: number | null;
  population: number;
  unemployment: number | null;
  costBurden: number | null;
  trend: {
    homeValue: number | null;
    rent: number | null;
    income: number | null;
    affordability: number | null;  // Positive = improving, Negative = declining
  } | null;
  x: number;
  y: number;
}

interface Props {
  hasIncome: boolean;
  income: number | null;
  affordablePrice: number | null;
  mapMetric: string;
  incomeRange: [number, number];
  viewMode: "rent" | "buy";
  onCountyHover: (data: CountyTooltipData | null) => void;
  onCountyClick: (fips: string) => void;
}

// ─── COLOR HELPERS ──────────────────────────────────────────────

function buildRatioColorExpr(): mapboxgl.Expression {
  return [
    "case",
    ["==", ["get", "affordability_ratio"], null],
    "#e2e8f0",
    [
      "interpolate",
      ["linear"],
      ["get", "affordability_ratio"],
      0,
      "#059669",
      2,
      "#059669",
      3,
      "#10b981",
      4,
      "#fbbf24",
      5,
      "#f97316",
      7,
      "#ef4444",
      10,
      "#dc2626",
    ],
  ];
}

function buildValueColorExpr(): mapboxgl.Expression {
  return [
    "case",
    ["==", ["get", "median_home_value"], null],
    "#e2e8f0",
    [
      "interpolate",
      ["linear"],
      ["get", "median_home_value"],
      50000,
      "#059669",
      150000,
      "#10b981",
      250000,
      "#fbbf24",
      400000,
      "#f97316",
      600000,
      "#ef4444",
    ],
  ];
}

function buildIncomeColorExpr(): mapboxgl.Expression {
  return [
    "case",
    ["==", ["get", "median_household_income"], null],
    "#e2e8f0",
    [
      "interpolate",
      ["linear"],
      ["get", "median_household_income"],
      30000,
      "#1e40af",
      50000,
      "#3b82f6",
      70000,
      "#60a5fa",
      90000,
      "#93c5fd",
      120000,
      "#dbeafe",
    ],
  ];
}

function buildBudgetColorExpr(affordablePrice: number): mapboxgl.Expression {
  const stretch = Math.round(affordablePrice * 1.3);
  return [
    "case",
    ["==", ["get", "median_home_value"], null],
    "#e2e8f0",
    ["<=", ["get", "median_home_value"], affordablePrice],
    "#059669",
    ["<=", ["get", "median_home_value"], stretch],
    "#fbbf24",
    "#dc2626",
  ];
}

function buildRentRatioColorExpr(): mapboxgl.Expression {
  return [
    "case",
    ["==", ["get", "rent_ratio"], null],
    "#e2e8f0",
    [
      "interpolate",
      ["linear"],
      ["get", "rent_ratio"],
      0,
      "#059669",      // 0-15%: Very affordable
      15,
      "#059669",
      25,
      "#10b981",     // 15-25%: Affordable
      30,
      "#fbbf24",     // 25-30%: Moderate (at HUD threshold)
      35,
      "#f97316",     // 30-35%: Cost-burdened
      40,
      "#ef4444",     // 35-40%: Severely burdened
      50,
      "#dc2626",     // 40%+: Extremely burdened
    ],
  ];
}

// ─── COMPONENT ──────────────────────────────────────────────────

export default function MapboxChoropleth({
  hasIncome,
  income,
  affordablePrice,
  mapMetric,
  incomeRange,
  viewMode,
  onCountyHover,
  onCountyClick,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const hoveredFips = useRef<string | null>(null);

  // ─── INITIALIZE MAP ─────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    // Dynamic import to avoid SSR issues
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (cancelled || !mapContainer.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Restore saved map position or use defaults
      const savedPosition = typeof window !== 'undefined' 
        ? localStorage.getItem('housing-pulse-map-position')
        : null;
      
      let initialCenter: [number, number] = [-97, 39];
      let initialZoom = 3.8;

      if (savedPosition) {
        try {
          const { center, zoom } = JSON.parse(savedPosition);
          initialCenter = center;
          initialZoom = zoom;
        } catch (e) {
          console.warn('Could not restore map position:', e);
        }
      }

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 2.5,
        maxZoom: 12,
        maxBounds: [
          [-180, 10],  // Expanded bounds for smoother panning
          [-40, 75],
        ],
        projection: "mercator",
        attributionControl: false,
        dragRotate: false,  // Disable rotation for cleaner UX
        touchZoomRotate: false,
      });

      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "top-right"
      );
      map.addControl(
        new mapboxgl.AttributionControl({ compact: true }),
        "bottom-right"
      );

      mapRef.current = map;

      // Save map position on move/zoom
      const savePosition = () => {
        if (typeof window !== 'undefined' && map) {
          const center = map.getCenter();
          const zoom = map.getZoom();
          localStorage.setItem(
            'housing-pulse-map-position',
            JSON.stringify({
              center: [center.lng, center.lat],
              zoom
            })
          );
        }
      };

      map.on('moveend', savePosition);
      map.on('zoomend', savePosition);

      map.on("load", async () => {
        if (cancelled) return;

        try {
          // Fetch county boundaries + our data + trends in parallel
          const [topoRes, stateTopoRes, dataRes, trendsRes] = await Promise.all([
            fetch(COUNTIES_TOPO_URL),
            fetch(STATES_TOPO_URL),
            fetch("/data/counties_acs.json"),
            fetch("/data/counties_acs_trends_sample.json").catch(() => null), // Optional
          ]);

          const [topo, stateTopo, countyData, trendData] = await Promise.all([
            topoRes.json() as Promise<Topology>,
            stateTopoRes.json() as Promise<Topology>,
            dataRes.json(),
            trendsRes ? trendsRes.json() : Promise.resolve({}),
          ]);

          if (cancelled) return;

          // Convert county TopoJSON → GeoJSON
          const countiesGeo = feature(
            topo,
            topo.objects.counties as any
          ) as any;

          // Merge affordability data into GeoJSON properties
          for (const feat of countiesGeo.features) {
            const fips = String(feat.id).padStart(5, "0");
            const data = countyData[fips];
            if (data) {
              // Calculate rent-to-income ratio (as percentage)
              const rentRatio = data.median_gross_rent && data.median_household_income
                ? ((data.median_gross_rent * 12) / data.median_household_income) * 100
                : null;
              
              // Get trend data if available
              const trend = trendData[fips]?.growth || null;
              
              feat.properties = {
                fips,
                name: data.county_name || data.name || "",
                state: data.state || "",
                affordability_ratio: data.affordability_ratio,
                median_home_value: data.median_home_value,
                median_household_income: data.median_household_income,
                median_gross_rent: data.median_gross_rent,
                rent_ratio: rentRatio,
                population: data.population,
                unemployment_rate: data.unemployment_rate,
                pct_cost_burdened_renters: data.pct_cost_burdened_renters,
                vacancy_rate: data.vacancy_rate,
                homeownership_rate: data.homeownership_rate,
                // Trend data
                trend_home_value: trend?.home_value || null,
                trend_rent: trend?.rent || null,
                trend_income: trend?.income || null,
                trend_affordability: trend?.affordability_trend || null,
              };
            } else {
              feat.properties = { fips, name: "", state: "" };
            }
          }

          // Convert state TopoJSON → GeoJSON for borders
          const statesGeo = feature(
            stateTopo,
            stateTopo.objects.states as any
          ) as any;

          // Add county source + layers
          map.addSource("counties", {
            type: "geojson",
            data: countiesGeo,
          });

          map.addLayer({
            id: "county-fills",
            type: "fill",
            source: "counties",
            paint: {
              "fill-color": buildRatioColorExpr() as any,
              "fill-opacity": [
                "case",
                ["has", "affordability_ratio"],
                0.75,
                0.15,
              ],
            },
          });

          map.addLayer({
            id: "county-borders",
            type: "line",
            source: "counties",
            paint: {
              "line-color": "#ffffff",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3,
                0.1,
                6,
                0.3,
                10,
                0.8,
              ],
              "line-opacity": 0.6,
            },
          });

          // Hover highlight layer
          map.addLayer({
            id: "county-hover",
            type: "line",
            source: "counties",
            paint: {
              "line-color": "#0f172a",
              "line-width": 2,
              "line-opacity": [
                "case",
                [
                  "boolean",
                  ["feature-state", "hover"],
                  false,
                ],
                1,
                0,
              ],
            },
          });

          // Add state borders on top
          map.addSource("states", {
            type: "geojson",
            data: statesGeo,
          });

          map.addLayer({
            id: "state-borders",
            type: "line",
            source: "states",
            paint: {
              "line-color": "#94a3b8",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3,
                0.8,
                6,
                1.5,
                10,
                2,
              ],
              "line-opacity": 0.7,
            },
          });

          setDataLoaded(true);
        } catch (err) {
          console.error("Failed to load map data:", err);
        }

        setMapLoaded(true);
      });

      // ─── HOVER INTERACTIONS ───────────────────────────────────────

      map.on("mousemove", "county-fills", (e) => {
        if (!e.features || e.features.length === 0) return;

        const feat = e.features[0];
        const props = feat.properties || {};

        // Update hover state
        if (hoveredFips.current && hoveredFips.current !== props.fips) {
          map.setFeatureState(
            { source: "counties", id: undefined as any },
            { hover: false }
          );
        }
        hoveredFips.current = props.fips;

        map.getCanvas().style.cursor = "pointer";

        onCountyHover({
          fips: props.fips,
          name: props.name,
          state: props.state,
          income: props.median_household_income,
          value: props.median_home_value,
          ratio: props.affordability_ratio,
          rent: props.median_gross_rent,
          rentRatio: props.rent_ratio,
          population: props.population,
          unemployment: props.unemployment_rate,
          costBurden: props.pct_cost_burdened_renters,
          trend: props.trend_affordability !== undefined && props.trend_affordability !== null ? {
            homeValue: props.trend_home_value,
            rent: props.trend_rent,
            income: props.trend_income,
            affordability: props.trend_affordability,
          } : null,
          x: e.point.x,
          y: e.point.y,
        });
      });

      map.on("mouseleave", "county-fills", () => {
        hoveredFips.current = null;
        map.getCanvas().style.cursor = "";
        onCountyHover(null);
      });

      map.on("click", "county-fills", (e) => {
        if (!e.features || e.features.length === 0) return;
        const fips = e.features[0].properties?.fips;
        if (fips) onCountyClick(fips);
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── UPDATE COLORS ON PROP CHANGES ──────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataLoaded) return;

    let colorExpr: any;

    // Rent view overrides all other metrics
    if (viewMode === "rent") {
      colorExpr = buildRentRatioColorExpr();
    } else if (hasIncome && affordablePrice) {
      colorExpr = buildBudgetColorExpr(affordablePrice);
    } else {
      switch (mapMetric) {
        case "value":
          colorExpr = buildValueColorExpr();
          break;
        case "income":
          colorExpr = buildIncomeColorExpr();
          break;
        default:
          colorExpr = buildRatioColorExpr();
      }
    }

    map.setPaintProperty("county-fills", "fill-color", colorExpr);

    // Update opacity based on income range filter (no-income mode only)
    if (!hasIncome) {
      const minIncome = incomeRange[0] * 1000;
      const maxIncome = incomeRange[1] * 1000;
      map.setPaintProperty("county-fills", "fill-opacity", [
        "case",
        ["!", ["has", "affordability_ratio"]],
        0.15,
        [
          "all",
          [">=", ["get", "median_household_income"], minIncome],
          ["<=", ["get", "median_household_income"], maxIncome],
        ],
        0.75,
        0.12,
      ] as any);
    } else {
      map.setPaintProperty("county-fills", "fill-opacity", [
        "case",
        ["has", "affordability_ratio"],
        0.75,
        0.15,
      ] as any);
    }
  }, [hasIncome, affordablePrice, mapMetric, incomeRange, viewMode, dataLoaded]);

  // ─── RESET VIEW HANDLER ─────────────────────────────────────────

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    
    map.flyTo({
      center: [-97, 39],
      zoom: 3.8,
      duration: 1200,
    });
    
    // Clear saved position
    if (typeof window !== 'undefined') {
      localStorage.removeItem('housing-pulse-map-position');
    }
  }, []);

  // ─── RENDER ─────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "100%", borderRadius: 0 }}
      />

      {/* Reset View Button */}
      {dataLoaded && (
        <button
          onClick={resetView}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 600,
            color: "#3b82f6",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#3b82f6";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.color = "#3b82f6";
          }}
          title="Reset map to full US view"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Reset View
        </button>
      )}

      {/* Loading state */}
      {!dataLoaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(248, 250, 252, 0.9)",
            zIndex: 5,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid #e2e8f0",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#64748b",
              }}
            >
              Loading 3,100+ counties...
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* County count badge */}
      {dataLoaded && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 11,
            color: "#64748b",
            fontFamily: "'DM Mono', monospace",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 2,
          }}
        >
          3,222 counties &middot; Real Census ACS data
        </div>
      )}
    </div>
  );
}
