import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { readCsvRecords, PostgresRepository } from '../server/repository.mjs';

const { Pool } = pg;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL wajib diisi untuk menjalankan seed.');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false });
const schema = await fs.readFile(path.join(projectRoot, 'database', 'schema.sql'), 'utf8');
await pool.query(schema);
const records = await readCsvRecords(path.join(projectRoot, 'data', 'cctv.csv'));
const repository = new PostgresRepository(pool, records);
await repository.reset();

const geojson = JSON.parse(await fs.readFile(path.join(projectRoot, 'data', 'ruas_tol.geojson'), 'utf8'));
for (const feature of geojson.features) {
  await pool.query('UPDATE ruas_tol SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) WHERE id = $2', [JSON.stringify(feature.geometry), feature.properties.id]);
}

console.log(`Seed selesai: ${records.length} CCTV dan ${geojson.features.length} ruas.`);
await repository.close();
