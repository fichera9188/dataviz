"""Build small, attributed map data for Vega-Lite.

Requires Shapely (pip install shapely). The data, not custom chart rendering,
are prepared here. Run from any directory; all output paths are repo-relative.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
from pathlib import Path
import sys
import urllib.request

# The one-off build may use the bundled runtime's task-local installation.
temporary_dependencies = Path(os.environ.get("TEMP", "/tmp")) / "codex-alcohol-geography-deps"
if temporary_dependencies.exists():
    sys.path.insert(0, str(temporary_dependencies))
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "site" / "data"
BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
WORLD_URL = BASE + "ne_50m_admin_0_countries.geojson"
AUSTRALIA_URL = BASE + "ne_10m_admin_1_states_provinces.geojson"
NAMES_URL = "https://ghoapi.azureedge.net/api/DIMENSION/COUNTRY/DimensionValues"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "FIT3179-alcohol-geography/1.0"})
    with urllib.request.urlopen(req, timeout=180) as response:
        body = response.read()
    return json.loads(body), hashlib.sha256(body).hexdigest()


def rounding(value):
    if isinstance(value, (tuple, list)):
        return [rounding(item) for item in value]
    return round(value, 3) if isinstance(value, (float, int)) else value


def compact_geometry(geo, tolerance, island_threshold):
    original = shape(geo)
    if not original.is_valid:
        original = original.buffer(0)
    reduced = original.simplify(tolerance, preserve_topology=True)
    polygons = [reduced] if isinstance(reduced, Polygon) else list(reduced.geoms)
    largest = max(polygons, key=lambda p: p.area)
    retained = [p for p in polygons if p.area >= island_threshold or p is largest]
    # D3/Vega uses clockwise exterior rings for polygons below a hemisphere.
    oriented = [orient(p, sign=-1.0) for p in retained]
    result = mapping(oriented[0] if len(oriented) == 1 else MultiPolygon(oriented))
    result["coordinates"] = rounding(result["coordinates"])
    if not shape(result).is_valid:
        # Quantization can collapse very small islands. Keep original precision
        # for this feature rather than emitting invalid geographic data.
        result = mapping(oriented[0] if len(oriented) == 1 else MultiPolygon(oriented))
    assert not shape(result).is_empty and shape(result).is_valid
    return result


def write(name, data):
    path = OUTPUT / name
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return path.stat().st_size


def consolidate_world(features):
    """Provide exactly one lookup geometry per ISO3, retaining all its islands."""
    grouped = {}
    for feature in features:
        grouped.setdefault(feature["properties"]["iso3"], []).append(feature)
    consolidated, merges = [], []
    for code, parts in grouped.items():
        if len(parts) == 1:
            consolidated.append(parts[0])
            continue
        geometries = [shape(f["geometry"]) for f in parts]
        polygons = [p for g in geometries for p in ([g] if isinstance(g, Polygon) else g.geoms)]
        combined = MultiPolygon(polygons)
        # Only geometries sharing this ISO3 may be merged. Normally these are
        # disjoint islands, so preserve components directly without dissolving.
        if not combined.is_valid:
            combined = unary_union(geometries)
            polygons = [combined] if isinstance(combined, Polygon) else list(combined.geoms)
        combined = MultiPolygon([orient(p, sign=-1.0) for p in polygons])
        assert combined.is_valid and not combined.is_empty
        consolidated.append({"type": "Feature", "properties": parts[0]["properties"], "geometry": mapping(combined)})
        merges.append({"iso3": code, "source_feature_count": len(parts), "retained_polygon_count": len(combined.geoms)})
    assert len(consolidated) == len({f["properties"]["iso3"] for f in consolidated})
    return consolidated, merges


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    world, world_hash = fetch(WORLD_URL)
    australia, australia_hash = fetch(AUSTRALIA_URL)
    country_dimension, names_hash = fetch(NAMES_URL)
    names = {item["Code"]: item["Title"] for item in country_dimension["value"]}
    world_features, fallback_keys = [], []
    for feature in world["features"]:
        p = feature["properties"]
        if p.get("ADM0_A3") == "ATA":
            continue
        code = p.get("ISO_A3")
        if code in (None, "-99"):
            code = p.get("ISO_A3_EH")
            if code in (None, "-99"):
                code = p["ADM0_A3"]
            fallback_keys.append({"name": p["ADMIN"], "iso3": code, "original_ISO_A3": p.get("ISO_A3")})
        name = names.get(code, p.get("NAME_EN") or p["ADMIN"])
        names.setdefault(code, name)
        world_features.append({"type": "Feature", "properties": {"iso3": code, "name": name},
                               "geometry": compact_geometry(feature["geometry"], .12, .025)})
    world_features, iso_merges = consolidate_world(world_features)
    state_names = {"WA": "Western Australia", "NT": "Northern Territory", "SA": "South Australia",
                   "QLD": "Queensland", "NSW": "New South Wales", "VIC": "Victoria", "TAS": "Tasmania",
                   "ACT": "Australian Capital Territory"}
    state_features = []
    excluded_territories = []
    for feature in australia["features"]:
        p = feature["properties"]
        if p.get("adm0_a3") != "AUS":
            continue
        state = p.get("iso_3166_2", "").removeprefix("AU-")
        if state not in state_names:
            excluded_territories.append(p["name"])
            continue
        state_features.append({"type": "Feature", "properties": {"state": state, "name": state_names[state]},
                               "geometry": compact_geometry(feature["geometry"], .045, .012)})
    codes = {row["iso3"] for filename in ("D01_WHO_total_consumption_countries.csv", "D02_WHO_heavy_episodic_drinking_countries.csv")
             for row in csv.DictReader((ROOT / "research" / "alcohol" / "source-data" / filename).open(encoding="utf-8-sig"))}
    geometry_codes = {f["properties"]["iso3"] for f in world_features}
    missing = sorted(codes - geometry_codes)
    sizes = {"world.geo.json": write("world.geo.json", {"type": "FeatureCollection", "features": world_features}),
             "australia.geo.json": write("australia.geo.json", {"type": "FeatureCollection", "features": state_features}),
             "country-names.json": write("country-names.json", names)}
    metadata = {
        "generated": "2026-10-14", "license": "Natural Earth geometry is public domain",
        "license_url": "https://www.naturalearthdata.com/about/terms-of-use/",
        "attribution": "Made with Natural Earth. Country names from WHO Global Health Observatory.",
        "sources": [{"asset": "world.geo.json", "url": WORLD_URL, "sha256": world_hash, "source_scale": "1:50m"},
                    {"asset": "australia.geo.json", "url": AUSTRALIA_URL, "sha256": australia_hash, "source_scale": "1:10m"},
                    {"asset": "country-names.json", "url": NAMES_URL, "sha256": names_hash}],
        "preparation": {"algorithm": "Shapely Douglas-Peucker simplify with preserve_topology=True",
                        "world_tolerance_degrees": .12, "australia_tolerance_degrees": .045,
                        "world_island_filter_square_degrees": .025, "australia_island_filter_square_degrees": .012,
                        "island_filter": "Always preserve the largest polygon of each feature; omit smaller components below threshold",
                        "precision": "3 decimal places, except full precision retained if rounding would produce invalid geometry",
                        "winding": "Clockwise exterior rings for D3/Vega spherical rendering",
                        "properties": "Only iso3/name for world and state/name for Australia",
                        "duplicate_iso3_merges": iso_merges,
                        "join_keys": "Exactly one world feature per ISO3; same-code source features merged into one MultiPolygon, retaining their islands",
                        "excluded_world": ["Antarctica"], "excluded_australian_territories": excluded_territories},
        "join_coverage": {"who_distinct_country_codes": len(codes), "matched_codes": len(codes & geometry_codes),
                          "missing_codes": [{"iso3": code, "name": names.get(code, code)} for code in missing],
                          "missing_reason": "French overseas territories have no separately keyed polygons in this Natural Earth countries file. Retain these observations in non-map charts; do not invent polygons.",
                          "iso_fallbacks": fallback_keys},
        "feature_counts": {"world": len(world_features), "australia": len(state_features)},
        "sizes_bytes": sizes,
        "notes": ["Natural Earth uses de facto boundaries; geometry is a generalised illustration, not authoritative boundary advice.",
                  "Guadeloupe, French Guiana, Martinique and Reunion lack separate ISO keys in this countries file; some overseas geometry is grouped with France. WHO observations for those territories remain available outside the choropleth.",
                  "Australian states are keyed using ISO 3166-2 suffixes, rather than Natural Earth's abbreviated postal fields.",
                  "Lord Howe Island is a separate NSW feature; Jervis Bay and Macquarie Island are omitted from this state-level map.",
                  "WHO country names include small countries without polygons and should also support non-map displays."]}
    write("geography-sources.json", metadata)
    print(json.dumps({"sizes": sizes, "coverage": metadata["join_coverage"], "features": metadata["feature_counts"]}, indent=2))


if __name__ == "__main__":
    main()
