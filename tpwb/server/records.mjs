const STATUS_TO_UI = {
  ESTIMATED_HIGH: ['online', 'Estimasi tinggi'],
  ESTIMATED_MEDIUM: ['gangguan', 'Estimasi menengah'],
  REVIEW: ['offline', 'Perlu review']
};

export function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ruas-tol';
}

function first(input, keys, fallback = '') {
  for (const key of keys) {
    const value = input[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
}

function numberOrNull(value) {
  if (value === '' || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeRecord(input) {
  const id = String(first(input, ['id', 'id_cctv', 'ID Kamera', 'Kode ID'])).trim();
  const nama = String(first(input, ['nama', 'nama_cctv', 'Nama Titik', 'Nama Titik Pantauan'])).trim();
  const ruasNama = String(first(input, ['ruasNama', 'ruas_tol', 'Ruas Tol'])).trim();
  const ruasId = String(first(input, ['ruasId', 'ruas_id'], slugify(ruasNama))).trim();
  const lat = numberOrNull(first(input, ['lat', 'latitude', 'Latitude']));
  const lng = numberOrNull(first(input, ['lng', 'longitude', 'Longitude']));
  let statusKoordinat = String(first(input, ['statusKoordinat', 'coordinate_status', 'Status Koordinat'], 'REVIEW')).trim().toUpperCase();
  if (statusKoordinat === 'ONLINE') statusKoordinat = 'ESTIMATED_HIGH';
  if (statusKoordinat === 'GANGGUAN') statusKoordinat = 'ESTIMATED_MEDIUM';
  if (statusKoordinat === 'OFFLINE') statusKoordinat = 'REVIEW';
  if (!STATUS_TO_UI[statusKoordinat]) statusKoordinat = 'REVIEW';
  const [status, statusKoordinatLabel] = STATUS_TO_UI[statusKoordinat];
  const km = String(first(input, ['km', 'km_label', 'KM'], 'Tanpa data KM')).trim();
  const kmNum = numberOrNull(first(input, ['kmNum', 'chainage_km']));

  if (!id || !nama || !ruasNama) throw new Error('ID, nama titik, dan ruas tol wajib diisi.');
  if (lat === null || lat < -90 || lat > 90 || lng === null || lng < -180 || lng > 180) {
    throw new Error(`Koordinat tidak valid untuk ${id || 'baris impor'}.`);
  }

  return {
    id,
    nama,
    ruasId,
    ruasNama,
    km,
    kmNum: kmNum ?? 9999,
    arah: String(first(input, ['arah'], 'Tidak dicantumkan pada sumber')).trim(),
    posisi: String(first(input, ['posisi'], 'Titik pantau ruas tol')).trim(),
    lat,
    lng,
    status,
    statusKoordinat,
    statusKoordinatLabel,
    metodeKoordinat: String(first(input, ['metodeKoordinat', 'coordinate_method', 'Metode Koordinat'], 'MANUAL_ADMIN_ENTRY')).trim(),
    metodeKoordinatLabel: String(first(input, ['metodeKoordinatLabel'], first(input, ['metodeKoordinat', 'coordinate_method', 'Metode Koordinat'], 'Entri manual administrator'))).trim(),
    sumber: String(first(input, ['sumber', 'source', 'Sumber'], 'Entri admin')).trim(),
    statusVerifikasi: String(first(input, ['statusVerifikasi', 'verification_status', 'Status Verifikasi'], 'MANUAL_ENTRY')).trim(),
    skorVerifikasi: numberOrNull(first(input, ['skorVerifikasi', 'verification_score', 'Skor Verifikasi'])),
    terverifikasiPada: String(first(input, ['terverifikasiPada', 'verified_at'], '')).trim(),
    kondisiLaluLintas: String(first(input, ['kondisiLaluLintas'], 'Data operasional tidak tersedia')).trim(),
    kecepatanRataRata: '-',
    resolusi: 'Metadata stream tidak tersedia',
    terakhirUpdate: 'Data API terbaru',
    keterangan: String(first(input, ['keterangan', 'coordinate_note'], 'Koordinat estimasi geospasial; bukan koordinat resmi BPJT.')).trim(),
    videoType: 'toll_main',
    snapshotImg: 'assets/cctv_highway.jpg'
  };
}

export function filterRecords(records, filters = {}) {
  const query = String(filters.q || '').trim().toLowerCase();
  const ruas = String(filters.ruas || 'all');
  const status = String(filters.status || 'all').toUpperCase();
  return records.filter((row) => {
    const matchesQuery = !query || [row.id, row.nama, row.ruasNama, row.km, row.posisi]
      .some((value) => String(value || '').toLowerCase().includes(query));
    const matchesRuas = ruas === 'all' || row.ruasId === ruas;
    const matchesStatus = status === 'ALL' || row.statusKoordinat === status || row.status.toUpperCase() === status;
    return matchesQuery && matchesRuas && matchesStatus;
  });
}

export function summarize(records) {
  const byStatus = { ESTIMATED_HIGH: 0, ESTIMATED_MEDIUM: 0, REVIEW: 0 };
  const byRuas = {};
  for (const row of records) {
    byStatus[row.statusKoordinat] = (byStatus[row.statusKoordinat] || 0) + 1;
    byRuas[row.ruasNama] = (byRuas[row.ruasNama] || 0) + 1;
  }
  return { total: records.length, byStatus, byRuas, ruasCount: Object.keys(byRuas).length };
}
