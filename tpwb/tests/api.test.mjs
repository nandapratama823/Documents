import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../server/app.mjs';
import { MemoryRepository } from '../server/repository.mjs';

const baseRecord = {
  id: 'CCTV-TEST-001',
  nama: 'Titik Uji KM 1',
  ruasId: 'ruas-uji',
  ruasNama: 'Ruas Uji',
  km: 'KM 1+000',
  kmNum: 1,
  lat: -6.2,
  lng: 106.8,
  statusKoordinat: 'ESTIMATED_HIGH',
  metodeKoordinat: 'KM_AXIS_EXACT',
  sumber: 'TEST'
};

async function withServer(run) {
  const repository = new MemoryRepository([baseRecord]);
  const app = createApp({ repository, projectRoot: process.cwd(), auth: { username: 'admin', password: 'admin123', secret: 'test-secret' } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try { await run({ baseUrl, repository }); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

async function login(baseUrl) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  assert.equal(response.status, 200);
  return (await response.json()).token;
}

test('health, list, filter, and stats endpoints return expected data', async () => {
  await withServer(async ({ baseUrl }) => {
    const health = await (await fetch(`${baseUrl}/api/health`)).json();
    assert.deepEqual({ ok: health.ok, records: health.records }, { ok: true, records: 1 });
    const list = await (await fetch(`${baseUrl}/api/cctv?q=KM%201`)).json();
    assert.equal(list.total, 1);
    const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
    assert.equal(stats.byStatus.ESTIMATED_HIGH, 1);
    assert.equal(stats.ruasCount, 1);
  });
});

test('protected CRUD endpoints require login and persist changes', async () => {
  await withServer(async ({ baseUrl }) => {
    const unauthorized = await fetch(`${baseUrl}/api/cctv`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(baseRecord) });
    assert.equal(unauthorized.status, 401);

    const token = await login(baseUrl);
    const created = { ...baseRecord, id: 'CCTV-TEST-002', nama: 'Titik Uji KM 2', km: 'KM 2+000', kmNum: 2 };
    const createResponse = await fetch(`${baseUrl}/api/cctv`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(created)
    });
    assert.equal(createResponse.status, 201);

    const updateResponse = await fetch(`${baseUrl}/api/cctv/CCTV-TEST-002`, {
      method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ nama: 'Titik Uji Diperbarui' })
    });
    assert.equal((await updateResponse.json()).data.nama, 'Titik Uji Diperbarui');

    const deleteResponse = await fetch(`${baseUrl}/api/cctv/CCTV-TEST-002`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    assert.equal(deleteResponse.status, 204);
  });
});

test('CSV import upserts records by CCTV ID', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await login(baseUrl);
    const csv = [
      'id_cctv,nama_cctv,ruas_id,ruas_tol,km,chainage_km,latitude,longitude,coordinate_status,coordinate_method,source',
      'CCTV-TEST-001,Titik Lama Diperbarui,ruas-uji,Ruas Uji,KM 1+000,1,-6.2,106.8,ESTIMATED_HIGH,KM_AXIS_EXACT,TEST',
      'CCTV-TEST-003,Titik Impor Baru,ruas-uji,Ruas Uji,KM 3+000,3,-6.3,106.9,REVIEW,OSM_LANDMARK_NAME_MATCH,TEST'
    ].join('\n');
    const form = new FormData();
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'cctv.csv');
    const response = await fetch(`${baseUrl}/api/cctv/import`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { created: 1, updated: 1, total: 2, message: '2 baris berhasil diproses.' });
  });
});
