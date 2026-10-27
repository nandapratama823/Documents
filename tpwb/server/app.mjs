import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { normalizeRecord, slugify } from './records.mjs';

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createToken(username, secret) {
  const payload = encode({ sub: username, exp: Date.now() + 8 * 60 * 60 * 1000 });
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  const expected = sign(payload, secret);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.exp > Date.now();
  } catch { return false; }
}

function importRow(row) {
  return normalizeRecord(row);
}

export function createApp({ repository, projectRoot, auth = {} }) {
  const app = express();
  const adminUsername = auth.username || process.env.ADMIN_USERNAME || 'admin';
  let adminPassword = auth.password || process.env.ADMIN_PASSWORD || 'admin123';
  const authSecret = auth.secret || process.env.AUTH_SECRET || 'development-only-change-me';
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const requireAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!verifyToken(token, authSecret)) return res.status(401).json({ error: 'Autentikasi admin diperlukan.' });
    next();
  };

  app.get('/api/health', async (_req, res, next) => {
    try {
      const stats = await repository.stats();
      res.json({ ok: true, service: 'cctv-transjawa-api', storage: repository.kind, records: stats.total });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/login', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ error: 'Username atau kata sandi salah.' });
    }
    res.json({ token: createToken(username, authSecret), user: { username, name: 'Administrator Command Center', role: 'Super Admin Tol Trans Jawa' } });
  });

  app.post('/api/auth/change-password', requireAdmin, (req, res) => {
    const oldPassword = String(req.body?.oldPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (oldPassword !== adminPassword) return res.status(400).json({ error: 'Kata sandi saat ini tidak cocok.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Kata sandi baru minimal 8 karakter.' });
    adminPassword = newPassword;
    res.json({ message: 'Kata sandi sesi server berhasil diperbarui.' });
  });

  app.get('/api/cctv', async (req, res, next) => {
    try {
      const data = await repository.list({ q: req.query.q, ruas: req.query.ruas, status: req.query.status });
      res.json({ data, total: data.length });
    } catch (error) { next(error); }
  });

  app.get('/api/cctv/:id', async (req, res, next) => {
    try {
      const record = await repository.find(req.params.id);
      if (!record) return res.status(404).json({ error: 'Titik CCTV tidak ditemukan.' });
      res.json({ data: record });
    } catch (error) { next(error); }
  });

  app.get('/api/stats', async (_req, res, next) => {
    try { res.json(await repository.stats()); } catch (error) { next(error); }
  });

  app.get('/api/ruas', async (_req, res, next) => {
    try {
      const records = await repository.list();
      const grouped = new Map();
      for (const row of records) {
        const item = grouped.get(row.ruasId) || { id: row.ruasId || slugify(row.ruasNama), name: row.ruasNama, cctvCount: 0 };
        item.cctvCount += 1;
        grouped.set(item.id, item);
      }
      res.json({ data: [...grouped.values()] });
    } catch (error) { next(error); }
  });

  app.post('/api/cctv', requireAdmin, async (req, res, next) => {
    try { res.status(201).json({ data: await repository.create(req.body) }); } catch (error) { next(error); }
  });

  app.put('/api/cctv/:id', requireAdmin, async (req, res, next) => {
    try {
      const record = await repository.update(req.params.id, req.body);
      if (!record) return res.status(404).json({ error: 'Titik CCTV tidak ditemukan.' });
      res.json({ data: record });
    } catch (error) { next(error); }
  });

  app.delete('/api/cctv/:id', requireAdmin, async (req, res, next) => {
    try {
      if (!(await repository.delete(req.params.id))) return res.status(404).json({ error: 'Titik CCTV tidak ditemukan.' });
      res.status(204).end();
    } catch (error) { next(error); }
  });

  app.post('/api/cctv/import', requireAdmin, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Pilih file CSV untuk diimpor.' });
      const rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, bom: true, trim: true });
      if (!rows.length) return res.status(400).json({ error: 'File CSV tidak berisi data.' });
      if (rows.length > 5000) return res.status(400).json({ error: 'Maksimum 5.000 baris per impor.' });
      const result = await repository.upsertMany(rows.map(importRow));
      res.json({ ...result, message: `${result.total} baris berhasil diproses.` });
    } catch (error) { next(error); }
  });

  app.post('/api/cctv/reset', requireAdmin, async (_req, res, next) => {
    try {
      const data = await repository.reset();
      res.json({ total: data.length, message: 'Dataset dikembalikan ke data sumber.' });
    } catch (error) { next(error); }
  });

  app.use('/js', express.static(path.join(projectRoot, 'js')));
  app.use('/css', express.static(path.join(projectRoot, 'css')));
  app.use('/assets', express.static(path.join(projectRoot, 'assets')));
  app.get('/data/cctv.csv', (_req, res) => res.sendFile(path.join(projectRoot, 'data', 'cctv.csv')));
  app.get('/data/ruas_tol.geojson', (_req, res) => res.sendFile(path.join(projectRoot, 'data', 'ruas_tol.geojson')));
  app.get('/', (_req, res) => res.sendFile(path.join(projectRoot, 'index.html')));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint API tidak ditemukan.' }));
  app.use((error, _req, res, _next) => {
    const status = error.status || (error.name === 'MulterError' ? 400 : 500);
    if (status >= 500) console.error(error);
    res.status(status).json({ error: error.message || 'Terjadi kesalahan pada server.' });
  });

  return app;
}
