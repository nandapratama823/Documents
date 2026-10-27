# Peta CCTV Trans Jawa

Dashboard Web GIS untuk 307 titik CCTV pada 17 ruas Tol Trans Jawa. Frontend menggunakan HTML, CSS, JavaScript, dan Leaflet. Backend menyediakan REST API Express dengan penyimpanan PostgreSQL/PostGIS atau fallback JSON untuk pengembangan lokal.

## Menjalankan aplikasi

Prasyarat: Node.js 20+, pnpm atau npm, Git, serta Docker Desktop jika ingin memakai PostgreSQL/PostGIS.

```powershell
pnpm install
pnpm start
```

Buka `http://127.0.0.1:8765`. Tanpa `DATABASE_URL`, API memakai `data/cctv.runtime.json`. Login demo: `admin` / `admin123`.

## PostgreSQL dan PostGIS

```powershell
docker compose up --build
```

Container database menjalankan `database/schema.sql` dan `database/seed.sql`. Tabel `cctv` memiliki kolom `geom geometry(Point, 4326)` beserta indeks spasial GiST. Tabel `ruas_tol` menyimpan geometri jalur GeoJSON.

Untuk database eksternal:

```powershell
$env:DATABASE_URL='postgresql://user:password@host:5432/cctv_transjawa'
pnpm seed
pnpm start
```

## REST API

- `GET /api/health`
- `GET /api/cctv?q=&ruas=&status=`
- `GET /api/cctv/:id`
- `GET /api/ruas`
- `GET /api/stats`
- `POST /api/auth/login`
- `POST /api/auth/change-password`
- `POST /api/cctv`
- `PUT /api/cctv/:id`
- `DELETE /api/cctv/:id`
- `POST /api/cctv/import` dengan form-data `file`
- `POST /api/cctv/reset`

Endpoint mutasi memerlukan token Bearer dari login admin.

## Data

- `data/cctv.csv`: 307 titik CCTV.
- `data/ruas_tol.geojson`: 17 jalur hasil pengurutan titik CCTV.
- `tools/generate_cctv_dataset.py`: menghasilkan ulang JavaScript, CSV, dan GeoJSON dari workbook sumber.

Koordinat merupakan estimasi geospasial berdasarkan metadata sumber dan referensi OpenStreetMap. Data bukan koordinat survei resmi BPJT.

## Pengujian dan deployment

```powershell
pnpm test
```

`Dockerfile`, `docker-compose.yml`, dan `render.yaml` disediakan untuk deployment. Sebelum produksi, ubah `ADMIN_PASSWORD` dan `AUTH_SECRET`, aktifkan HTTPS, serta gunakan database PostGIS persisten.
