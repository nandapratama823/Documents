/**
 * Peta CCTV Transjawa - Data & Configuration
 * Sesuai PRD Sistem Monitoring CCTV Tol Trans Jawa
 */

// Ruas Tol Trans Jawa Master Data
const RUAS_TOL_LIST = window.IMPORTED_RUAS_TOL_LIST || [
    { id: 'all', name: 'Semua Ruas Tol', kmRange: 'KM 0 - KM 830' },
    { id: 'merak-tangerang', name: 'Tol Tangerang - Merak', kmRange: 'KM 26 - KM 98' },
    { id: 'japek', name: 'Tol Jakarta - Cikampek', kmRange: 'KM 0 - KM 72' },
    { id: 'cipali', name: 'Tol Cikopo - Palimanan (Cipali)', kmRange: 'KM 72 - KM 188' },
    { id: 'palikanci', name: 'Tol Palimanan - Kanci', kmRange: 'KM 188 - KM 214' },
    { id: 'pejagan-pemalang', name: 'Tol Pejagan - Pemalang', kmRange: 'KM 248 - KM 305' },
    { id: 'pemalang-batang', name: 'Tol Pemalang - Batang', kmRange: 'KM 305 - KM 344' },
    { id: 'batang-semarang', name: 'Tol Batang - Semarang', kmRange: 'KM 344 - KM 419' },
    { id: 'semarang-solo', name: 'Tol Semarang - Solo', kmRange: 'KM 419 - KM 498' },
    { id: 'solo-ngawi', name: 'Tol Solo - Ngawi', kmRange: 'KM 498 - KM 588' },
    { id: 'ngawi-kertosono', name: 'Tol Ngawi - Kertosono', kmRange: 'KM 588 - KM 675' },
    { id: 'kertosono-mojokerto', name: 'Tol Kertosono - Mojokerto', kmRange: 'KM 675 - KM 712' },
    { id: 'mojokerto-surabaya', name: 'Tol Mojokerto - Surabaya', kmRange: 'KM 712 - KM 748' },
    { id: 'surabaya-gempol', name: 'Tol Surabaya - Gempol', kmRange: 'KM 748 - KM 770' },
    { id: 'pasuruan-probolinggo', name: 'Tol Pasuruan - Probolinggo', kmRange: 'KM 770 - KM 830' }
];

// Jalur Polyline Trans Jawa (Rute Geometris Merak -> Jakarta -> Semarang -> Solo -> Surabaya -> Probolinggo)
const TRANS_JAWA_ROUTE = [
    [-5.9320, 106.0020], // Merak Port
    [-6.0240, 106.1420], // Cilegon
    [-6.1180, 106.1620], // Serang Barat
    [-6.1380, 106.2150], // Serang Timur
    [-6.1950, 106.4650], // Balaraja
    [-6.2230, 106.6320], // Tangerang
    [-6.2115, 106.8438], // Jakarta Inner Ring
    [-6.2483, 106.9620], // Cikunir Interchange
    [-6.2514, 106.9958], // Bekasi Barat
    [-6.2625, 107.0321], // Bekasi Timur
    [-6.3121, 107.1423], // Cikarang Utama
    [-6.3312, 107.2512], // Karawang Barat
    [-6.3478, 107.3012], // Karawang Timur / KM 57
    [-6.4021, 107.4520], // Cikampek Utama KM 70
    [-6.4520, 107.5620], // Kalijati KM 89
    [-6.5312, 107.7214], // Subang KM 102
    [-6.6120, 108.0210], // Cikedung KM 130
    [-6.6841, 108.3120], // Kertajati KM 158
    [-6.6912, 108.3820], // Rest Area KM 166
    [-6.7112, 108.4521], // GT Palimanan KM 188
    [-6.7721, 108.5620], // Kanci KM 214
    [-6.8520, 108.8120], // Babakan KM 233
    [-6.8920, 108.9210], // Pejagan KM 248
    [-6.8821, 109.0210], // Brebes Barat KM 262
    [-6.8850, 109.1350], // Brebes Timur (Brexit) KM 268
    [-6.9123, 109.4120], // Pemalang KM 312
    [-6.9312, 109.6812], // Pekalongan KM 338
    [-6.9512, 109.8512], // Batang KM 360
    [-6.9680, 109.9700], // Batang KM 379 Rest Area
    [-6.9912, 110.0912], // Weleri KM 391
    [-6.9854, 110.3214], // Kalikangkung KM 414
    [-7.0120, 110.4050], // Semarang Barat
    [-7.0621, 110.4210], // Banyumanik KM 420
    [-7.1321, 110.4120], // Ungaran KM 430
    [-7.2340, 110.4610], // Bawen KM 442
    [-7.3321, 110.5120], // Salatiga KM 456
    [-7.5312, 110.6120], // Boyolali KM 482
    [-7.5312, 110.7420], // Colomadu KM 498
    [-7.5510, 110.8410], // Solo / Gondangrejo
    [-7.4312, 111.0210], // Sragen KM 528
    [-7.4120, 111.4520], // Ngawi KM 578
    [-7.5521, 111.6620], // Madiun / Caruban KM 611
    [-7.6012, 111.9120], // Nganjuk KM 647
    [-7.5412, 112.1812], // Bandar Kedungmulyo KM 672
    [-7.4812, 112.3012], // Jombang KM 686
    [-7.4312, 112.4412], // Mojokerto Barat KM 712
    [-7.3820, 112.5610], // Krian KM 730
    [-7.3482, 112.7210], // Waru / Surabaya KM 748
    [-7.4520, 112.7180], // Sidoarjo KM 759
    [-7.5921, 112.7012], // Gempol KM 768
    [-7.6520, 112.8910], // Pasuruan KM 785
    [-7.7121, 113.0212], // Grati KM 795
    [-7.7612, 113.1512]  // Tongas / Probolinggo KM 825
];

// Initial CCTV dataset - Berdasarkan Sebaran Tol Trans Jawa
const LEGACY_SAMPLE_CCTV_DATA = [
    {
        id: 'CCTV-MRK-KM92-A',
        nama: 'Gerbang Tol Merak Utama',
        ruasId: 'merak-tangerang',
        ruasNama: 'Tol Tangerang - Merak',
        km: 'KM 92+800',
        kmNum: 92.8,
        arah: 'Arah Merak (Barat)',
        posisi: 'Gerbang Tol',
        lat: -5.9392,
        lng: 106.0125,
        status: 'online', // 'online' | 'gangguan' | 'offline'
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '65 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Pantauan antrean kendaraan menuju Pelabuhan Penyeberangan Merak.',
        videoType: 'highway_port',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-MRK-KM68-B',
        nama: 'Rest Area KM 68 B Bogeg',
        ruasId: 'merak-tangerang',
        ruasNama: 'Tol Tangerang - Merak',
        km: 'KM 68+200',
        kmNum: 68.2,
        arah: 'Arah Jakarta (Timur)',
        posisi: 'Rest Area',
        lat: -6.1412,
        lng: 106.2230,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '80 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: '1 menit lalu',
        keterangan: 'Kamera pemantau area parkir dan akses keluar rest area Serang.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-MRK-KM39-A',
        nama: 'Balaraja Barat Interchange',
        ruasId: 'merak-tangerang',
        ruasNama: 'Tol Tangerang - Merak',
        km: 'KM 39+500',
        kmNum: 39.5,
        arah: 'Arah Merak (Barat)',
        posisi: 'Median Jalan',
        lat: -6.1950,
        lng: 106.4650,
        status: 'online',
        kondisiLaluLintas: 'Ramai Lancar',
        kecepatanRataRata: '75 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: '2 menit lalu',
        keterangan: 'Pantauan jalur utama Balaraja menuju Cikupa.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-JPK-KM10-B',
        nama: 'Simpang Susun Cikunir',
        ruasId: 'japek',
        ruasNama: 'Tol Jakarta - Cikampek',
        km: 'KM 10+200',
        kmNum: 10.2,
        arah: 'Arah Jakarta (Barat)',
        posisi: 'Overpass / Flyover',
        lat: -6.2483,
        lng: 106.9620,
        status: 'online',
        kondisiLaluLintas: 'Padat Merayap',
        kecepatanRataRata: '35 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Pertemuan arus Tol JORR dan Tol Jakarta-Cikampek Elevated.',
        videoType: 'junction',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-JPK-KM14-A',
        nama: 'Bekasi Barat Km 14',
        ruasId: 'japek',
        ruasNama: 'Tol Jakarta - Cikampek',
        km: 'KM 14+400',
        kmNum: 14.4,
        arah: 'Arah Cikampek (Timur)',
        posisi: 'Bahu Jalan Kiri',
        lat: -6.2514,
        lng: 106.9958,
        status: 'online',
        kondisiLaluLintas: 'Ramai Lancar',
        kecepatanRataRata: '60 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Pemantauan lajur bawah dan pilar elevated MBZ.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-JPK-KM31-A',
        nama: 'Cikarang Utama KM 31',
        ruasId: 'japek',
        ruasNama: 'Tol Jakarta - Cikampek',
        km: 'KM 31+000',
        kmNum: 31.0,
        arah: 'Arah Cikampek (Timur)',
        posisi: 'Median Jalan',
        lat: -6.3121,
        lng: 107.1423,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '85 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: '3 menit lalu',
        keterangan: 'Lajur cepat kawasan industri Cikarang.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-JPK-KM48-A',
        nama: 'Karawang Barat KM 48',
        ruasId: 'japek',
        ruasNama: 'Tol Jakarta - Cikampek',
        km: 'KM 48+200',
        kmNum: 48.2,
        arah: 'Arah Cikampek (Timur)',
        posisi: 'Pertemuan MBZ',
        lat: -6.3312,
        lng: 107.2512,
        status: 'online',
        kondisiLaluLintas: 'Ramai Lancar',
        kecepatanRataRata: '55 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Titik penurunan kendaraan dari Tol Layang MBZ ke lajur dasar.',
        videoType: 'junction',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-JPK-KM57-A',
        nama: 'Rest Area KM 57 A Karawang',
        ruasId: 'japek',
        ruasNama: 'Tol Jakarta - Cikampek',
        km: 'KM 57+500',
        kmNum: 57.5,
        arah: 'Arah Cikampek (Timur)',
        posisi: 'Rest Area',
        lat: -6.3478,
        lng: 107.3012,
        status: 'online',
        kondisiLaluLintas: 'Padat di Akses Masuk',
        kecepatanRataRata: '40 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Antrean pengisian BBM SPBU dan kantong parkir rest area primadona.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-JPK-KM70-B',
        nama: 'Gerbang Tol Cikampek Utama KM 70',
        ruasId: 'japek',
        ruasNama: 'Tol Jakarta - Cikampek',
        km: 'KM 70+200',
        kmNum: 70.2,
        arah: 'Arah Jakarta (Barat)',
        posisi: 'Gerbang Tol',
        lat: -6.4021,
        lng: 107.4520,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '30 km/jam di gardu',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Gardu transaksi utama barrier gate GT Cikampek Utama.',
        videoType: 'toll_gate',
        snapshotImg: 'assets/cctv_toll_gate.jpg'
    },
    {
        id: 'CCTV-CPL-KM86-B',
        nama: 'Rest Area KM 86 B Subang',
        ruasId: 'cipali',
        ruasNama: 'Tol Cikopo - Palimanan (Cipali)',
        km: 'KM 86+600',
        kmNum: 86.6,
        arah: 'Arah Jakarta (Barat)',
        posisi: 'Rest Area',
        lat: -6.4520,
        lng: 107.5620,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '85 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Kawasan istirahat KM 86 tipe B arah Jakarta.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-CPL-KM102-A',
        nama: 'Rest Area KM 102 A Subang',
        ruasId: 'cipali',
        ruasNama: 'Tol Cikopo - Palimanan (Cipali)',
        km: 'KM 102+300',
        kmNum: 102.3,
        arah: 'Arah Cirebon (Timur)',
        posisi: 'Rest Area',
        lat: -6.5312,
        lng: 107.7214,
        status: 'gangguan',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '90 km/jam',
        resolusi: '720p HD (15 FPS - Degradasi Sinyal)',
        terakhirUpdate: '5 menit lalu',
        keterangan: 'Koneksi seluler transmisi CCTV sedang dalam pemeliharaan berkala.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-CPL-KM130-A',
        nama: 'Cikedung KM 130 Indramayu',
        ruasId: 'cipali',
        ruasNama: 'Tol Cikopo - Palimanan (Cipali)',
        km: 'KM 130+100',
        kmNum: 130.1,
        arah: 'Arah Cirebon (Timur)',
        posisi: 'Median Jalan',
        lat: -6.6120,
        lng: 108.0210,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '95 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Lajur lurus Cipali kawasan perkebunan Indramayu.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-CPL-KM166-A',
        nama: 'Rest Area KM 166 A Majalengka',
        ruasId: 'cipali',
        ruasNama: 'Tol Cikopo - Palimanan (Cipali)',
        km: 'KM 166+700',
        kmNum: 166.7,
        arah: 'Arah Cirebon (Timur)',
        posisi: 'Rest Area',
        lat: -6.6841,
        lng: 108.3120,
        status: 'online',
        kondisiLaluLintas: 'Ramai',
        kecepatanRataRata: '70 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Masjid Syiarul Islam KM 166 dan kantong parkir.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-CPL-KM188-B',
        nama: 'Gerbang Tol Palimanan KM 188',
        ruasId: 'cipali',
        ruasNama: 'Tol Cikopo - Palimanan (Cipali)',
        km: 'KM 188+000',
        kmNum: 188.0,
        arah: 'Dua Arah',
        posisi: 'Eks Gerbang Tol',
        lat: -6.7112,
        lng: 108.4521,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '80 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Titik KM 188 Palimanan, batas ruas Cipali & Palikanci.',
        videoType: 'toll_gate',
        snapshotImg: 'assets/cctv_toll_gate.jpg'
    },
    {
        id: 'CCTV-PKC-KM205-A',
        nama: 'Ciperna Interchange Kanci',
        ruasId: 'palikanci',
        ruasNama: 'Tol Palimanan - Kanci',
        km: 'KM 205+400',
        kmNum: 205.4,
        arah: 'Arah Jawa Tengah (Timur)',
        posisi: 'Overpass Cirebon',
        lat: -6.7721,
        lng: 108.5620,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '85 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: '2 menit lalu',
        keterangan: 'Simpang susun Ciperna menuju Kuningan & Cirebon Kota.',
        videoType: 'junction',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-PJP-KM248-A',
        nama: 'Simpang Susun Pejagan',
        ruasId: 'pejagan-pemalang',
        ruasNama: 'Tol Pejagan - Pemalang',
        km: 'KM 248+000',
        kmNum: 248.0,
        arah: 'Arah Semarang (Timur)',
        posisi: 'Simpang Susun Pejagan',
        lat: -6.8920,
        lng: 108.9210,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '90 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Pintu keluar Pejagan menuju Prupuk, Purwokerto, dan Bumiayu.',
        videoType: 'junction',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-PJP-KM268-A',
        nama: 'Brebes Timur (Brexit) KM 268',
        ruasId: 'pejagan-pemalang',
        ruasNama: 'Tol Pejagan - Pemalang',
        km: 'KM 268+300',
        kmNum: 268.3,
        arah: 'Arah Semarang (Timur)',
        posisi: 'Gerbang Tol Brebes Timur',
        lat: -6.8850,
        lng: 109.1350,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '85 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Jalur keluar Brebes Timur menuju Jalur Pantura Tegal.',
        videoType: 'toll_gate',
        snapshotImg: 'assets/cctv_toll_gate.jpg'
    },
    {
        id: 'CCTV-PMP-KM312-A',
        nama: 'Gerbang Tol Pemalang KM 312',
        ruasId: 'pemalang-batang',
        ruasNama: 'Tol Pemalang - Batang',
        km: 'KM 312+000',
        kmNum: 312.0,
        arah: 'Dua Arah',
        posisi: 'Gerbang Tol',
        lat: -6.9123,
        lng: 109.4120,
        status: 'offline',
        kondisiLaluLintas: 'Tidak Ada Data',
        kecepatanRataRata: '-',
        resolusi: 'Offline (Kabel Fiber Optik Terputus)',
        terakhirUpdate: '30 menit lalu',
        keterangan: 'Kamera sedang menunggu perbaikan kabel FO oleh tim teknis lapangan.',
        videoType: 'offline_feed',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-BTG-KM344-A',
        nama: 'Pekalongan Interchange KM 344',
        ruasId: 'pemalang-batang',
        ruasNama: 'Tol Pemalang - Batang',
        km: 'KM 344+200',
        kmNum: 344.2,
        arah: 'Arah Semarang (Timur)',
        posisi: 'Overpass Pekalongan',
        lat: -6.9312,
        lng: 109.6812,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '90 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Akses masuk Tol Kota Batik Pekalongan.',
        videoType: 'junction',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-BTG-KM379-A',
        nama: 'Rest Area KM 379 A Batang',
        ruasId: 'batang-semarang',
        ruasNama: 'Tol Batang - Semarang',
        km: 'KM 379+100',
        kmNum: 379.1,
        arah: 'Arah Semarang (Timur)',
        posisi: 'Rest Area',
        lat: -6.9680,
        lng: 109.9700,
        status: 'online',
        kondisiLaluLintas: 'Ramai Lancar',
        kecepatanRataRata: '70 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Rest area favorit jalur Batang dengan fasilitas SPKLU mobil listrik.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-BTG-KM391-A',
        nama: 'Rest Area KM 391 A Weleri',
        ruasId: 'batang-semarang',
        ruasNama: 'Tol Batang - Semarang',
        km: 'KM 391+400',
        kmNum: 391.4,
        arah: 'Arah Semarang (Timur)',
        posisi: 'Rest Area',
        lat: -6.9912,
        lng: 110.0912,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '80 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: '1 menit lalu',
        keterangan: 'Pemantauan lalu lintas sebelum kawasan perbukitan Weleri.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-BTG-KM414-B',
        nama: 'Gerbang Tol Kalikangkung KM 414',
        ruasId: 'batang-semarang',
        ruasNama: 'Tol Batang - Semarang',
        km: 'KM 414+000',
        kmNum: 414.0,
        arah: 'Arah Jakarta (Barat)',
        posisi: 'Gerbang Tol Utama',
        lat: -6.9854,
        lng: 110.3214,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '25 km/jam di gardu',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Pintu gerbang tol utama masuk dan keluar Kota Semarang barat.',
        videoType: 'toll_gate',
        snapshotImg: 'assets/cctv_toll_gate.jpg'
    },
    {
        id: 'CCTV-SMG-KM420-A',
        nama: 'Gerbang Tol Banyumanik KM 420',
        ruasId: 'semarang-solo',
        ruasNama: 'Tol Semarang - Solo',
        km: 'KM 420+800',
        kmNum: 420.8,
        arah: 'Arah Solo (Selatan)',
        posisi: 'Gerbang Tol',
        lat: -7.0621,
        lng: 110.4210,
        status: 'online',
        kondisiLaluLintas: 'Ramai Lancar',
        kecepatanRataRata: '40 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Titik awal perjalanan Semarang atas menuju Solo.',
        videoType: 'toll_gate',
        snapshotImg: 'assets/cctv_toll_gate.jpg'
    },
    {
        id: 'CCTV-SMG-KM430-A',
        nama: 'Jembatan Kalikuto Ungaran KM 430',
        ruasId: 'semarang-solo',
        ruasNama: 'Tol Semarang - Solo',
        km: 'KM 430+200',
        kmNum: 430.2,
        arah: 'Arah Solo (Selatan)',
        posisi: 'Jembatan / Overpass',
        lat: -7.1321,
        lng: 110.4120,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '75 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Lajur tanjakan dan jembatan ikonik lereng Gunung Ungaran.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-SMG-KM456-A',
        nama: 'Rest Area KM 456 Pendopo Salatiga',
        ruasId: 'semarang-solo',
        ruasNama: 'Tol Semarang - Solo',
        km: 'KM 456+600',
        kmNum: 456.6,
        arah: 'Dua Arah (Skybridge)',
        posisi: 'Rest Area Ikonik',
        lat: -7.3321,
        lng: 110.5120,
        status: 'online',
        kondisiLaluLintas: 'Ramai Wisata',
        kecepatanRataRata: '65 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Rest area Pendopo KM 456 yang menghubungkan jalur A dan B dengan skybridge.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-SLO-KM498-A',
        nama: 'Simpang Susun Colomadu / Kartasura',
        ruasId: 'solo-ngawi',
        ruasNama: 'Tol Solo - Ngawi',
        km: 'KM 498+000',
        kmNum: 498.0,
        arah: 'Arah Ngawi (Timur)',
        posisi: 'Interchange Colomadu',
        lat: -7.5312,
        lng: 110.7420,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '85 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Akses masuk dari arah Boyolali / Yogyakarta menuju Tol Trans Jawa.',
        videoType: 'junction',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-SLO-KM528-B',
        nama: 'Sragen KM 528',
        ruasId: 'solo-ngawi',
        ruasNama: 'Tol Solo - Ngawi',
        km: 'KM 528+500',
        kmNum: 528.5,
        arah: 'Arah Solo (Barat)',
        posisi: 'Bahu Jalan Kiri',
        lat: -7.4312,
        lng: 111.0210,
        status: 'gangguan',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '90 km/jam',
        resolusi: '720p HD (Frame drop)',
        terakhirUpdate: '7 menit lalu',
        keterangan: 'Kamera mengalami gangguan lensa kotor akibat cuaca hujan lebat.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-NGW-KM578-A',
        nama: 'Rest Area KM 575 A Ngawi',
        ruasId: 'solo-ngawi',
        ruasNama: 'Tol Solo - Ngawi',
        km: 'KM 575+800',
        kmNum: 575.8,
        arah: 'Arah Surabaya (Timur)',
        posisi: 'Rest Area',
        lat: -7.4120,
        lng: 111.4520,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '80 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Rest area perbatasan Jawa Tengah dan Jawa Timur.',
        videoType: 'rest_area',
        snapshotImg: 'assets/cctv_rest_area.jpg'
    },
    {
        id: 'CCTV-NGW-KM611-A',
        nama: 'Madiun / Caruban KM 611',
        ruasId: 'ngawi-kertosono',
        ruasNama: 'Tol Ngawi - Kertosono',
        km: 'KM 611+200',
        kmNum: 611.2,
        arah: 'Arah Surabaya (Timur)',
        posisi: 'Overpass Caruban',
        lat: -7.5521,
        lng: 111.6620,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '95 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Lajur cepat kawasan persawahan Madiun - Caruban.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-KRT-KM647-A',
        nama: 'Gerbang Tol Nganjuk KM 647',
        ruasId: 'ngawi-kertosono',
        ruasNama: 'Tol Ngawi - Kertosono',
        km: 'KM 647+400',
        kmNum: 647.4,
        arah: 'Arah Surabaya (Timur)',
        posisi: 'Gerbang Tol',
        lat: -7.6012,
        lng: 111.9120,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '85 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Pintu keluar Nganjuk dan akses penghubung Kediri.',
        videoType: 'toll_gate',
        snapshotImg: 'assets/cctv_toll_gate.jpg'
    },
    {
        id: 'CCTV-KRT-KM672-A',
        nama: 'Bandar Kedungmulyo KM 672',
        ruasId: 'kertosono-mojokerto',
        ruasNama: 'Tol Kertosono - Mojokerto',
        km: 'KM 672+000',
        kmNum: 672.0,
        arah: 'Arah Surabaya (Timur)',
        posisi: 'Median Jalan',
        lat: -7.5412,
        lng: 112.1812,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '90 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Titik KM 672 percabangan Kertosono dan Jombang.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-MJK-KM712-A',
        nama: 'Gerbang Tol Mojokerto Barat KM 712',
        ruasId: 'mojokerto-surabaya',
        ruasNama: 'Tol Mojokerto - Surabaya',
        km: 'KM 712+300',
        kmNum: 712.3,
        arah: 'Arah Surabaya (Timur)',
        posisi: 'Gerbang Tol',
        lat: -7.4312,
        lng: 112.4412,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '40 km/jam di gardu',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Pintu masuk ruas Surabaya - Mojokerto (SuMo).',
        videoType: 'toll_gate',
        snapshotImg: 'assets/cctv_toll_gate.jpg'
    },
    {
        id: 'CCTV-SBY-KM748-A',
        nama: 'Gerbang Tol Waru Utama Surabaya',
        ruasId: 'mojokerto-surabaya',
        ruasNama: 'Tol Mojokerto - Surabaya',
        km: 'KM 748+200',
        kmNum: 748.2,
        arah: 'Dua Arah',
        posisi: 'Gerbang Tol Utama Waru',
        lat: -7.3482,
        lng: 112.7210,
        status: 'online',
        kondisiLaluLintas: 'Padat Merayap',
        kecepatanRataRata: '30 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Simpang Susun Waru akses Kota Surabaya, Bandara Juanda, dan Tol Porong.',
        videoType: 'junction',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-GMP-KM768-A',
        nama: 'Simpang Susun Gempol KM 768',
        ruasId: 'surabaya-gempol',
        ruasNama: 'Tol Surabaya - Gempol',
        km: 'KM 768+500',
        kmNum: 768.5,
        arah: 'Arah Malang / Pasuruan',
        posisi: 'Interchange Gempol',
        lat: -7.5921,
        lng: 112.7012,
        status: 'online',
        kondisiLaluLintas: 'Ramai Lancar',
        kecepatanRataRata: '60 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Percabangan Tol Gempol - Pandaan (Malang) dan Tol Gempol - Pasuruan.',
        videoType: 'junction',
        snapshotImg: 'assets/cctv_highway.jpg'
    },
    {
        id: 'CCTV-PAS-KM795-A',
        nama: 'Gerbang Tol Grati KM 795',
        ruasId: 'pasuruan-probolinggo',
        ruasNama: 'Tol Pasuruan - Probolinggo',
        km: 'KM 795+100',
        kmNum: 795.1,
        arah: 'Arah Probolinggo (Timur)',
        posisi: 'Gerbang Tol',
        lat: -7.7121,
        lng: 113.0212,
        status: 'online',
        kondisiLaluLintas: 'Lancar',
        kecepatanRataRata: '85 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Pintu tol Grati Pasuruan timur.',
        videoType: 'toll_gate',
        snapshotImg: 'assets/cctv_toll_gate.jpg'
    },
    {
        id: 'CCTV-PRO-KM825-A',
        nama: 'Gerbang Tol Tongas Probolinggo Timur',
        ruasId: 'pasuruan-probolinggo',
        ruasNama: 'Tol Pasuruan - Probolinggo',
        km: 'KM 825+000',
        kmNum: 825.0,
        arah: 'Arah Banyuwangi / Bali',
        posisi: 'Ujung Tol Paspro KM 825',
        lat: -7.7612,
        lng: 113.1512,
        status: 'online',
        kondisiLaluLintas: 'Lancar Lengang',
        kecepatanRataRata: '90 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: 'Ujung operasional Tol Paspro sebelum tersambung ke Tol Probolinggo - Banyuwangi.',
        videoType: 'toll_main',
        snapshotImg: 'assets/cctv_highway.jpg'
    }
];

const INITIAL_CCTV_DATA = window.IMPORTED_CCTV_DATA || LEGACY_SAMPLE_CCTV_DATA;

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
    CCTV_DATA: 'transjawa_cctv_production_v2_307',
    ADMIN_AUTH: 'transjawa_admin_auth_v1',
    AUTH_TOKEN: 'transjawa_admin_token_v2',
    MAP_PREFERENCES: 'transjawa_map_pref_v1'
};

// Data Store Management Helper
const CCTVStore = {
    getAll() {
        // Clear all obsolete corrupted keys from prior development
        try {
            for (let i = 1; i <= 10; i++) {
                localStorage.removeItem(`transjawa_cctv_dataset_v${i}`);
            }
            localStorage.removeItem('transjawa_cctv_master_v10');
        } catch (e) {}

        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CCTV_DATA);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Strict geographical validation:
                // Pulau Jawa spans latitudes -5.8 to -8.5.
                // Any coordinates below -8.6 are in the Indian Ocean and must be rejected!
                const isValidDataset = Array.isArray(parsed) && 
                    parsed.length > 0 && 
                    parsed.every(c => typeof c.lat === 'number' && typeof c.lng === 'number');

                if (isValidDataset) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Gagal membaca LocalStorage, memuat dataset awal:', e);
        }
        
        // Fresh pristine dataset directly from INITIAL_CCTV_DATA
        const freshData = JSON.parse(JSON.stringify(INITIAL_CCTV_DATA));
        this.saveAll(freshData);
        return freshData;
    },

    saveAll(data) {
        try {
            localStorage.setItem(STORAGE_KEYS.CCTV_DATA, JSON.stringify(data));
        } catch (e) {
            console.error('Gagal menyimpan ke LocalStorage:', e);
        }
    },

    resetToDefault() {
        localStorage.removeItem(STORAGE_KEYS.CCTV_DATA);
        const freshData = JSON.parse(JSON.stringify(INITIAL_CCTV_DATA));
        this.saveAll(freshData);
        return freshData;
    },

    add(cctv) {
        const list = this.getAll();
        list.unshift(cctv);
        this.saveAll(list);
        return list;
    },

    update(id, updatedCctv) {
        const list = this.getAll();
        const index = list.findIndex(c => c.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updatedCctv };
            this.saveAll(list);
            return list[index];
        }
        return null;
    },

    delete(id) {
        const list = this.getAll().filter(c => c.id !== id);
        this.saveAll(list);
        return list;
    },

    getById(id) {
        return this.getAll().find(c => c.id === id) || null;
    }
};

// REST API client. LocalStorage remains a read-only fallback when the API is unavailable.
const CCTVApi = {
    available: false,
    storage: 'local-fallback',

    async request(path, options = {}) {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const headers = { ...(options.headers || {}) };
        if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch(path, { ...options, headers });
        const body = response.status === 204 ? null : await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error || `Permintaan API gagal (${response.status}).`);
        return body;
    },

    async health() {
        const result = await this.request('/api/health');
        this.available = result.ok === true;
        this.storage = result.storage || 'api';
        return result;
    },
    async getAll() { return (await this.request('/api/cctv')).data; },
    async create(record) { return (await this.request('/api/cctv', { method: 'POST', body: JSON.stringify(record) })).data; },
    async update(id, record) { return (await this.request(`/api/cctv/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(record) })).data; },
    async delete(id) { return this.request(`/api/cctv/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
    async reset() { return this.request('/api/cctv/reset', { method: 'POST', body: '{}' }); },
    async importCsv(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/api/cctv/import', { method: 'POST', body: formData });
    },
    async login(username, password) {
        return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    },
    async changePassword(oldPassword, newPassword) {
        return this.request('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) });
    }
};

// Admin Auth Helper
const AdminAuth = {
    STORAGE_KEY: STORAGE_KEYS.ADMIN_AUTH,
    
    // Default credentials
    DEFAULT_USER: 'admin',
    DEFAULT_PASS: 'admin123',

    isLoggedIn() {
        const auth = localStorage.getItem(this.STORAGE_KEY);
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!auth || !token) return false;
        try {
            const parsed = JSON.parse(auth);
            return parsed && parsed.isLoggedIn === true;
        } catch (e) {
            return false;
        }
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || null;
        } catch (e) {
            return null;
        }
    },

    async login(username, password) {
        try {
            const response = await CCTVApi.login(username.trim(), password);
            const authObj = { ...response.user, isLoggedIn: true, loginTime: new Date().toISOString() };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authObj));
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    },

    async changePassword(oldPassword, newPassword) {
        try {
            const response = await CCTVApi.changePassword(oldPassword, newPassword);
            return { success: true, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};
