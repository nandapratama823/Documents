"""Generate the browser-ready CCTV dataset from the verified Excel workbook."""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

import pandas as pd


STATUS_MAP = {
    "ESTIMATED_HIGH": ("online", "Estimasi tinggi"),
    "ESTIMATED_MEDIUM": ("gangguan", "Estimasi menengah"),
    "REVIEW": ("offline", "Perlu review"),
}

METHOD_LABELS = {
    "KM_AXIS_EXACT": "Referensi KM tepat pada sumbu jalan",
    "KM_AXIS_INTERPOLATION": "Interpolasi KM pada sumbu jalan",
    "KM_AXIS_EXTRAPOLATION": "Ekstrapolasi KM pada sumbu jalan",
    "OSM_LANDMARK_NAME_MATCH": "Pencocokan nama landmark OSM",
    "NAME_OVERRIDE_KM_ANOMALY": "Koreksi nama karena anomali KM",
}


def clean(value: object) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "ruas-tol"


def km_label(raw: str) -> str:
    if not raw:
        return "Tanpa data KM"
    return raw if raw.upper().startswith("KM") else f"KM {raw}"


def build_dataset(source: Path) -> tuple[list[dict], list[dict]]:
    frame = pd.read_excel(source, sheet_name="Audit_Detail")
    required = {
        "id_cctv", "nama_cctv", "ruas_tol", "km_raw", "chainage_km",
        "lokasi", "latitude", "longitude", "source", "verification_status",
        "verification_score", "verified_at", "coordinate_method",
        "coordinate_status", "coordinate_note", "catatan",
    }
    missing = sorted(required.difference(frame.columns))
    if missing:
        raise ValueError(f"Kolom wajib tidak ditemukan: {', '.join(missing)}")

    if frame["id_cctv"].duplicated().any():
        raise ValueError("ID CCTV duplikat ditemukan pada Audit_Detail")
    if frame[["latitude", "longitude"]].isna().any().any():
        raise ValueError("Latitude/longitude kosong ditemukan pada Audit_Detail")

    route_names = list(dict.fromkeys(clean(value) for value in frame["ruas_tol"]))
    routes = [
        {"id": "all", "name": "Semua Ruas Tol", "kmRange": "307 titik CCTV"},
        *[
            {
                "id": slugify(name),
                "name": name,
                "kmRange": f"{int((frame['ruas_tol'] == name).sum())} titik",
            }
            for name in route_names
        ],
    ]

    rows: list[dict] = []
    for record in frame.to_dict(orient="records"):
        coordinate_status = clean(record["coordinate_status"])
        ui_status, status_label = STATUS_MAP.get(
            coordinate_status, ("offline", coordinate_status or "Perlu review")
        )
        route_name = clean(record["ruas_tol"])
        method = clean(record["coordinate_method"])
        location = clean(record["lokasi"])
        note = clean(record["coordinate_note"]) or clean(record["catatan"])
        verification_score = int(record["verification_score"]) if not pd.isna(record["verification_score"]) else None
        chainage = None if pd.isna(record["chainage_km"]) else float(record["chainage_km"])

        rows.append({
            "id": clean(record["id_cctv"]),
            "nama": clean(record["nama_cctv"]),
            "ruasId": slugify(route_name),
            "ruasNama": route_name,
            "km": km_label(clean(record["km_raw"])),
            "kmNum": chainage if chainage is not None else 9999,
            "arah": "Tidak dicantumkan pada sumber",
            "posisi": location or "Titik pantau ruas tol",
            "lat": round(float(record["latitude"]), 7),
            "lng": round(float(record["longitude"]), 7),
            "status": ui_status,
            "statusKoordinat": coordinate_status,
            "statusKoordinatLabel": status_label,
            "metodeKoordinat": method,
            "metodeKoordinatLabel": METHOD_LABELS.get(method, method),
            "sumber": clean(record["source"]),
            "statusVerifikasi": clean(record["verification_status"]),
            "skorVerifikasi": verification_score,
            "terverifikasiPada": clean(record["verified_at"]),
            "kondisiLaluLintas": "Data operasional tidak tersedia",
            "kecepatanRataRata": "-",
            "resolusi": "Metadata stream tidak tersedia",
            "terakhirUpdate": "Verifikasi metadata 15 Okt 2026",
            "keterangan": note or "Koordinat estimasi geospasial; bukan koordinat resmi BPJT.",
            "videoType": "toll_main",
            "snapshotImg": "assets/cctv_highway.jpg",
        })

    return routes, rows


def write_csv(rows: list[dict], output: Path) -> None:
    fields = [
        "id_cctv", "nama_cctv", "ruas_id", "ruas_tol", "km", "chainage_km",
        "arah", "posisi", "latitude", "longitude", "coordinate_status",
        "coordinate_method", "source", "verification_status",
        "verification_score", "verified_at", "coordinate_note",
    ]
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "id_cctv": row["id"],
                "nama_cctv": row["nama"],
                "ruas_id": row["ruasId"],
                "ruas_tol": row["ruasNama"],
                "km": row["km"],
                "chainage_km": "" if row["kmNum"] == 9999 else row["kmNum"],
                "arah": row["arah"],
                "posisi": row["posisi"],
                "latitude": row["lat"],
                "longitude": row["lng"],
                "coordinate_status": row["statusKoordinat"],
                "coordinate_method": row["metodeKoordinat"],
                "source": row["sumber"],
                "verification_status": row["statusVerifikasi"],
                "verification_score": "" if row["skorVerifikasi"] is None else row["skorVerifikasi"],
                "verified_at": row["terverifikasiPada"],
                "coordinate_note": row["keterangan"],
            })


def write_geojson(rows: list[dict], output: Path) -> None:
    grouped: dict[str, list[dict]] = {}
    for row in rows:
        grouped.setdefault(row["ruasId"], []).append(row)

    features = []
    for route_id, points in grouped.items():
        ordered = sorted(points, key=lambda item: (item["kmNum"] == 9999, item["kmNum"], item["id"]))
        coordinates = [[item["lng"], item["lat"]] for item in ordered]
        features.append({
            "type": "Feature",
            "properties": {
                "id": route_id,
                "name": ordered[0]["ruasNama"],
                "cctv_count": len(ordered),
                "geometry_source": "Urutan titik CCTV hasil estimasi; bukan geometri resmi badan jalan",
            },
            "geometry": {
                "type": "LineString" if len(coordinates) > 1 else "Point",
                "coordinates": coordinates if len(coordinates) > 1 else coordinates[0],
            },
        })

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--csv", dest="csv_output", type=Path)
    parser.add_argument("--geojson", dest="geojson_output", type=Path)
    args = parser.parse_args()

    routes, rows = build_dataset(args.source)
    payload = (
        "/** Generated from CCTV_TransJawa_307_Latitude_Longitude_FINAL_V2.xlsx. */\n"
        "window.IMPORTED_RUAS_TOL_LIST = "
        + json.dumps(routes, ensure_ascii=False, separators=(",", ":"))
        + ";\nwindow.IMPORTED_CCTV_DATA = "
        + json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(payload, encoding="utf-8")
    if args.csv_output:
        write_csv(rows, args.csv_output)
    if args.geojson_output:
        write_geojson(rows, args.geojson_output)
    print(f"Generated {len(rows)} CCTV rows across {len(routes) - 1} toll-road sections")


if __name__ == "__main__":
    main()
