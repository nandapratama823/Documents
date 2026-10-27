TRUNCATE TABLE cctv, ruas_tol CASCADE;

CREATE TEMP TABLE cctv_import (
    id_cctv TEXT,
    nama_cctv TEXT,
    ruas_id TEXT,
    ruas_tol TEXT,
    km TEXT,
    chainage_km NUMERIC,
    arah TEXT,
    posisi TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    coordinate_status TEXT,
    coordinate_method TEXT,
    source TEXT,
    verification_status TEXT,
    verification_score SMALLINT,
    verified_at DATE,
    coordinate_note TEXT
);

\copy cctv_import FROM '/data/cctv.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

INSERT INTO ruas_tol (id, nama, jumlah_cctv)
SELECT ruas_id, MAX(ruas_tol), COUNT(*)
FROM cctv_import
GROUP BY ruas_id;

INSERT INTO cctv (
    id, nama, ruas_id, ruas_nama, km_label, km_num, arah, posisi,
    latitude, longitude, coordinate_status, coordinate_method, source,
    verification_status, verification_score, verified_at, keterangan
)
SELECT
    id_cctv, nama_cctv, ruas_id, ruas_tol, km, chainage_km, arah, posisi,
    latitude, longitude, coordinate_status, coordinate_method, source,
    verification_status, verification_score, verified_at, coordinate_note
FROM cctv_import;
