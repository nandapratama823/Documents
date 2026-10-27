CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS ruas_tol (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL UNIQUE,
    jumlah_cctv INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_cctv >= 0),
    geom geometry(Geometry, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cctv (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    ruas_id TEXT NOT NULL REFERENCES ruas_tol(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    ruas_nama TEXT NOT NULL,
    km_label TEXT,
    km_num NUMERIC(9,3),
    arah TEXT,
    posisi TEXT,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    geom geometry(Point, 4326) GENERATED ALWAYS AS
        (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    coordinate_status TEXT NOT NULL CHECK (coordinate_status IN ('ESTIMATED_HIGH', 'ESTIMATED_MEDIUM', 'REVIEW')),
    coordinate_method TEXT,
    source TEXT,
    verification_status TEXT,
    verification_score SMALLINT CHECK (verification_score BETWEEN 0 AND 100),
    verified_at DATE,
    keterangan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cctv_geom ON cctv USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_ruas_tol_geom ON ruas_tol USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_cctv_ruas ON cctv (ruas_id);
CREATE INDEX IF NOT EXISTS idx_cctv_status ON cctv (coordinate_status);
CREATE INDEX IF NOT EXISTS idx_cctv_km ON cctv (km_num);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cctv_updated_at ON cctv;
CREATE TRIGGER trg_cctv_updated_at
BEFORE UPDATE ON cctv
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ruas_updated_at ON ruas_tol;
CREATE TRIGGER trg_ruas_updated_at
BEFORE UPDATE ON ruas_tol
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
