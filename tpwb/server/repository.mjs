import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import pg from 'pg';
import { filterRecords, normalizeRecord, summarize } from './records.mjs';

const { Pool } = pg;

export async function readCsvRecords(csvPath) {
  const text = await fs.readFile(csvPath, 'utf8');
  return parse(text, { columns: true, skip_empty_lines: true, bom: true, trim: true }).map(normalizeRecord);
}

export class MemoryRepository {
  constructor(records = [], kind = 'memory') {
    this.baseRecords = records.map(normalizeRecord);
    this.records = structuredClone(this.baseRecords);
    this.kind = kind;
  }

  async list(filters = {}) { return filterRecords(this.records, filters); }
  async find(id) { return this.records.find((row) => row.id === id) || null; }
  async stats() { return summarize(this.records); }

  async create(input) {
    const record = normalizeRecord(input);
    if (await this.find(record.id)) throw Object.assign(new Error('ID CCTV sudah digunakan.'), { status: 409 });
    this.records.unshift(record);
    await this.afterMutation();
    return record;
  }

  async update(id, input) {
    const index = this.records.findIndex((row) => row.id === id);
    if (index < 0) return null;
    const record = normalizeRecord({ ...this.records[index], ...input, id });
    this.records[index] = record;
    await this.afterMutation();
    return record;
  }

  async delete(id) {
    const before = this.records.length;
    this.records = this.records.filter((row) => row.id !== id);
    if (this.records.length !== before) await this.afterMutation();
    return this.records.length !== before;
  }

  async upsertMany(inputs) {
    let created = 0;
    let updated = 0;
    for (const input of inputs) {
      const record = normalizeRecord(input);
      const index = this.records.findIndex((row) => row.id === record.id);
      if (index >= 0) {
        this.records[index] = record;
        updated += 1;
      } else {
        this.records.push(record);
        created += 1;
      }
    }
    await this.afterMutation();
    return { created, updated, total: inputs.length };
  }

  async reset() {
    this.records = structuredClone(this.baseRecords);
    await this.afterMutation();
    return this.records;
  }

  async afterMutation() {}
  async close() {}
}

export class FileRepository extends MemoryRepository {
  constructor(records, runtimePath) {
    super(records, 'json-file');
    this.runtimePath = runtimePath;
  }

  static async create(baseRecords, runtimePath) {
    const repository = new FileRepository(baseRecords, runtimePath);
    try {
      const saved = JSON.parse(await fs.readFile(runtimePath, 'utf8'));
      if (Array.isArray(saved) && saved.length) repository.records = saved.map(normalizeRecord);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return repository;
  }

  async afterMutation() {
    await fs.mkdir(path.dirname(this.runtimePath), { recursive: true });
    await fs.writeFile(this.runtimePath, JSON.stringify(this.records, null, 2), 'utf8');
  }
}

function mapDbRow(row) {
  return normalizeRecord({
    id: row.id,
    nama: row.nama,
    ruasId: row.ruas_id,
    ruasNama: row.ruas_nama,
    km: row.km_label,
    kmNum: row.km_num === null ? null : Number(row.km_num),
    arah: row.arah,
    posisi: row.posisi,
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    statusKoordinat: row.coordinate_status,
    metodeKoordinat: row.coordinate_method,
    sumber: row.source,
    statusVerifikasi: row.verification_status,
    skorVerifikasi: row.verification_score,
    terverifikasiPada: row.verified_at ? String(row.verified_at).slice(0, 10) : '',
    keterangan: row.keterangan
  });
}

export class PostgresRepository {
  constructor(pool, baseRecords) {
    this.pool = pool;
    this.baseRecords = baseRecords;
    this.kind = 'postgres-postgis';
  }

  async list(filters = {}) {
    const result = await this.pool.query('SELECT * FROM cctv ORDER BY km_num NULLS LAST, id');
    return filterRecords(result.rows.map(mapDbRow), filters);
  }
  async find(id) {
    const result = await this.pool.query('SELECT * FROM cctv WHERE id = $1', [id]);
    return result.rows[0] ? mapDbRow(result.rows[0]) : null;
  }
  async stats() { return summarize(await this.list()); }

  async ensureRoute(client, record) {
    await client.query(
      `INSERT INTO ruas_tol (id, nama, jumlah_cctv) VALUES ($1, $2, 0)
       ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama`,
      [record.ruasId, record.ruasNama]
    );
  }

  async save(record, allowUpdate = true) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await this.ensureRoute(client, record);
      const sql = `INSERT INTO cctv (
        id, nama, ruas_id, ruas_nama, km_label, km_num, arah, posisi, latitude, longitude,
        coordinate_status, coordinate_method, source, verification_status,
        verification_score, verified_at, keterangan
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ${allowUpdate ? `ON CONFLICT (id) DO UPDATE SET
        nama=EXCLUDED.nama, ruas_id=EXCLUDED.ruas_id, ruas_nama=EXCLUDED.ruas_nama,
        km_label=EXCLUDED.km_label, km_num=EXCLUDED.km_num, arah=EXCLUDED.arah,
        posisi=EXCLUDED.posisi, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
        coordinate_status=EXCLUDED.coordinate_status, coordinate_method=EXCLUDED.coordinate_method,
        source=EXCLUDED.source, verification_status=EXCLUDED.verification_status,
        verification_score=EXCLUDED.verification_score, verified_at=EXCLUDED.verified_at,
        keterangan=EXCLUDED.keterangan` : ''} RETURNING *`;
      const values = [record.id, record.nama, record.ruasId, record.ruasNama, record.km,
        record.kmNum === 9999 ? null : record.kmNum, record.arah, record.posisi, record.lat,
        record.lng, record.statusKoordinat, record.metodeKoordinat, record.sumber,
        record.statusVerifikasi, record.skorVerifikasi, record.terverifikasiPada || null,
        record.keterangan];
      const result = await client.query(sql, values);
      await client.query('COMMIT');
      return mapDbRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') error.status = 409;
      throw error;
    } finally { client.release(); }
  }

  async create(input) { return this.save(normalizeRecord(input), false); }
  async update(id, input) {
    const current = await this.find(id);
    if (!current) return null;
    return this.save(normalizeRecord({ ...current, ...input, id }), true);
  }
  async delete(id) {
    const result = await this.pool.query('DELETE FROM cctv WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
  async upsertMany(inputs) {
    let created = 0;
    let updated = 0;
    for (const input of inputs) {
      const record = normalizeRecord(input);
      if (await this.find(record.id)) updated += 1; else created += 1;
      await this.save(record, true);
    }
    return { created, updated, total: inputs.length };
  }
  async reset() {
    await this.pool.query('TRUNCATE TABLE cctv, ruas_tol CASCADE');
    await this.upsertMany(this.baseRecords);
    return this.list();
  }
  async close() { await this.pool.end(); }
}

export async function createRepository(projectRoot) {
  const csvPath = path.join(projectRoot, 'data', 'cctv.csv');
  const baseRecords = await readCsvRecords(csvPath);
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    await pool.query('SELECT 1');
    const repository = new PostgresRepository(pool, baseRecords);
    if ((await repository.stats()).total === 0) await repository.upsertMany(baseRecords);
    return repository;
  }
  return FileRepository.create(baseRecords, path.join(projectRoot, 'data', 'cctv.runtime.json'));
}
