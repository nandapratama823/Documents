/**
 * Peta CCTV Transjawa - Main Application Engine
 * High-Tech ITS Command Center & Monitoring System
 */

// Application State
const AppState = {
    cctvList: [],
    filteredList: [],
    selectedCctv: null,
    activeTab: 'map-view',
    
    // Filters
    searchQuery: '',
    selectedRuas: 'all',
    selectedStatus: 'all',
    selectedArah: 'all',

    // Table Pagination & Sorting
    tablePage: 1,
    tablePageSize: 10,
    tableSortField: 'kmNum',
    tableSortOrder: 'asc',

    // Map & Layers
    map: null,
    markersLayer: null,
    currentBasemap: 'osm',
    tileLayers: {},
    markerMap: new Map(), // cctvId -> marker
    locationAssistLayer: null,
    realtimeLocationLayer: null,
    nearestRouteLayer: null,
    locationWatchId: null,
    userLocation: null,
    pendingNearestFocus: false,
    lastLocationFocusAt: 0,
    activeMission: {
        title: 'Mulai dari aksi cepat',
        text: 'Cari titik terdekat, prioritaskan validasi, atau analisis cakupan ruas.'
    },

    // Coordinate Picking Mode (Admin Add Form)
    isPickingCoordinates: false,

    // Detail point currently displayed
    activeDetailCctv: null
};

// ==========================================================================
// 1. INITIALIZATION & LIFECYCLE
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    initClock();
    await loadCctvData();
    initMap();
    initEventListeners();
    initializeRealtimeLocation();
    initAuthUI();
    renderSidebarList();
    renderStatsAndCharts();
    renderDataTable();
});

// Realtime Command Center Digital Clock (WIB)
function initClock() {
    const timeEl = document.getElementById('clockTime');
    const dateEl = document.getElementById('clockDate');

    function update() {
        const now = new Date();
        const optionsDate = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' };
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
        const dateStr = now.toLocaleDateString('id-ID', optionsDate);

        if (timeEl) timeEl.textContent = timeStr;
        if (dateEl) dateEl.textContent = dateStr;
    }
    update();
    setInterval(update, 1000);
}

// Load data from persistent storage (CCTVStore)
async function loadCctvData() {
    const apiBadge = document.getElementById('apiStorageBadge');
    try {
        const health = await CCTVApi.health();
        AppState.cctvList = await CCTVApi.getAll();
        CCTVStore.saveAll(AppState.cctvList);
        if (apiBadge) {
            apiBadge.classList.remove('offline');
            apiBadge.innerHTML = `<i class="fa-solid fa-server"></i> API: ${health.storage}`;
        }
    } catch (error) {
        CCTVApi.available = false;
        AppState.cctvList = CCTVStore.getAll();
        if (apiBadge) {
            apiBadge.classList.add('offline');
            apiBadge.innerHTML = '<i class="fa-solid fa-hard-drive"></i> Mode lokal';
        }
        console.warn('REST API tidak tersedia, menggunakan cache lokal:', error.message);
    }
    applyFilters();
}

function getCoordinateStatusLabel(cctv) {
    return cctv.status === 'online' ? 'Akurasi tinggi' :
        cctv.status === 'gangguan' ? 'Akurasi sedang' : 'Perlu verifikasi';
}

function getCoordinateMethodLabel(cctv) {
    return cctv.metodeKoordinatLabel || cctv.metodeKoordinat || 'Metode tidak tersedia';
}

// ==========================================================================
// 2. LEAFLET MAP & GEO-VISUALIZATION (FASE 1)
// ==========================================================================
// ==========================================================================
// 2. LEAFLET MAP & GEO-VISUALIZATION (FASE 1)
// ==========================================================================

function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Center on Pulau Jawa to frame the entire Trans-Java corridor
    AppState.map = L.map('map', {
        center: [-7.2, 110.0],
        zoom: 7,
        minZoom: 6,
        maxZoom: 20,
        zoomControl: false // Custom controls used
    });

    // Reliable basemaps: OpenStreetMap is the default, with ESRI alternatives.
    AppState.tileLayers = {
        osm: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> kontributor, Tiles style by HOT | Peta Trans Jawa',
            maxZoom: 20,
            subdomains: 'abc'
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri World Imagery | Citra Satelit HD Pulau Jawa',
            maxZoom: 18
        }),
        dark: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri Canvas Dark | Peta Malam Trans Jawa',
            maxZoom: 16
        })
    };

    // OpenStreetMap is always shown first.
    AppState.currentBasemap = 'osm';
    AppState.tileLayers.osm.addTo(AppState.map);

    // Layer Group for CCTV Markers
    AppState.markersLayer = L.layerGroup().addTo(AppState.map);

    // Render Markers
    renderMapMarkers();

    // Automatically fit the entire island of Java on initial load
    setTimeout(() => {
        AppState.map.fitBounds([
            [-8.4, 105.5], // Southwest Java (Merak / Banten)
            [-5.8, 114.5]  // Northeast Java (Surabaya / Probolinggo)
        ], { padding: [30, 30] });
    }, 250);

    // Handle Map Clicks (for Admin Coordinate Picker)
    AppState.map.on('click', (e) => {
        if (AppState.isPickingCoordinates) {
            document.getElementById('formLat').value = e.latlng.lat.toFixed(6);
            document.getElementById('formLng').value = e.latlng.lng.toFixed(6);
            AppState.isPickingCoordinates = false;
            showToast('Koordinat titik berhasil diambil dari peta!', 'success');
            document.getElementById('cctvFormModal').classList.add('show');
            document.getElementById('map').style.cursor = '';
        }
    });
}

// Render Leaflet markers as clean traffic camera pins
function renderMapMarkers() {
    AppState.markersLayer.clearLayers();
    AppState.markerMap.clear();

    AppState.filteredList.forEach(cctv => {
        const markerIcon = L.divIcon({
            className: `custom-cctv-marker status-${cctv.status}`,
            html: `
                <div class="marker-pin-outer" title="${escapeHtml(cctv.nama)} - ${cctv.km}">
                    <i class="fa-solid fa-video"></i>
                    <span class="marker-status-dot"></span>
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -16]
        });

        const marker = L.marker([cctv.lat, cctv.lng], { icon: markerIcon });
        
        // Custom Popup Content with realistic real-time radar card (no static AI images)
        const popupContent = createPopupContent(cctv);
        marker.bindPopup(popupContent, { maxWidth: 340, className: 'cctv-leaflet-popup' });

        marker.on('click', () => {
            selectCctvCard(cctv.id, false);
        });

        marker.addTo(AppState.markersLayer);
        AppState.markerMap.set(cctv.id, marker);
    });
}

function createPopupContent(cctv) {
    const statusText = getCoordinateStatusLabel(cctv);
    const verificationScore = Number.isFinite(cctv.skorVerifikasi) ? cctv.skorVerifikasi : '-';

    return `
        <div class="popup-cctv-container">
            <div class="popup-header">
                <div>
                    <div class="popup-title">${escapeHtml(cctv.nama)}</div>
                    <div style="font-size: 11px; color: #94a3b8;">${escapeHtml(cctv.ruasNama)}</div>
                </div>
                <span class="popup-km">${cctv.km}</span>
            </div>

            <!-- Metadata coordinate summary -->
            <div class="popup-radar-badge">
                <div class="popup-radar-left">
                    <div class="radar-ping-ring">
                        <span class="radar-ping-dot"></span>
                    </div>
                    <div>
                        <div class="radar-title">DATA KOORDINAT CCTV</div>
                        <div class="radar-coords"><i class="fa-solid fa-location-dot"></i> ${cctv.lat.toFixed(4)}, ${cctv.lng.toFixed(4)}</div>
                    </div>
                </div>
                <div class="radar-speed-box">
                    <span class="radar-speed-val">${verificationScore}</span>
                    <span class="radar-speed-unit">skor</span>
                </div>
            </div>
            
            <div class="popup-details">
                <div class="popup-detail-row">
                    <span class="popup-label">Metode:</span>
                    <span class="popup-val">${escapeHtml(getCoordinateMethodLabel(cctv))}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-label">Posisi:</span>
                    <span class="popup-val">${escapeHtml(cctv.posisi)}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-label">Kualitas:</span>
                    <span class="status-badge ${cctv.status}">
                        <span class="status-bullet"></span> ${statusText}
                    </span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-label">Sumber:</span>
                    <span class="popup-val" style="color: #38bdf8; font-weight: 600;">${escapeHtml(cctv.sumber || 'BPJT')}</span>
                </div>
            </div>

            <div style="display: flex; gap: 6px; margin-top: 10px;">
                <button class="popup-btn-stream" style="flex: 1;" onclick="openDetailModal('${cctv.id}')">
                    <i class="fa-solid fa-circle-info"></i> Detail Titik
                </button>
                <button class="popup-btn-stream" style="background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); padding: 8px 12px;" onclick="AppState.map.setView([${cctv.lat}, ${cctv.lng}], 16);" title="Perbesar Titik di Peta">
                    <i class="fa-solid fa-magnifying-glass-plus"></i> Zoom
                </button>
            </div>
        </div>
    `;
}

// Focus on a CCTV marker on map
function focusCctvOnMap(cctvId) {
    const cctv = AppState.cctvList.find(c => c.id === cctvId);
    if (!cctv) return;

    // Switch to Map View if on another tab
    switchTab('map-view');

    // Pan & Zoom
    AppState.map.flyTo([cctv.lat, cctv.lng], 14, {
        duration: 1.2,
        easeLinearity: 0.25
    });

    const marker = AppState.markerMap.get(cctvId);
    if (marker) {
        setTimeout(() => {
            marker.openPopup();
        }, 800);
    }
}

// Reset Map View to encompass all Trans-Java points
function resetTransJawaView() {
    if (!AppState.map) return;

    switchTab('map-view');
    AppState.map.fitBounds([
        [-8.4, 105.5],
        [-5.8, 114.5]
    ], { padding: [30, 30] });
    showToast('Menampilkan seluruh Peta Pulau Jawa (Merak s/d Banyuwangi)', 'info');
}

// Switch basemap between OpenStreetMap and ESRI alternatives.
function switchBasemap(type) {
    Object.values(AppState.tileLayers).forEach(layer => {
        if (AppState.map.hasLayer(layer)) {
            AppState.map.removeLayer(layer);
        }
    });

    if (AppState.tileLayers[type]) {
        AppState.tileLayers[type].addTo(AppState.map);
        AppState.currentBasemap = type;
        
        // Update active button state
        document.querySelectorAll('.map-control-btn[data-basemap]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.basemap === type);
        });

        const names = {
            osm: 'OpenStreetMap Standard Pulau Jawa',
            satellite: 'Citra Satelit ESRI World Imagery',
            dark: 'Peta Mode Malam Trans Jawa'
        };
        showToast(`Peta diubah: ${names[type] || type}`, 'info');
    }
}

// ==========================================================================
// 3. PENCARIAN & FILTER (FASE 2)
// ==========================================================================
function applyFilters() {
    const query = AppState.searchQuery.toLowerCase().trim();

    AppState.filteredList = AppState.cctvList.filter(cctv => {
        // Keyword Search
        const matchQuery = !query || 
            cctv.nama.toLowerCase().includes(query) ||
            cctv.id.toLowerCase().includes(query) ||
            cctv.km.toLowerCase().includes(query) ||
            cctv.ruasNama.toLowerCase().includes(query) ||
            cctv.posisi.toLowerCase().includes(query);

        // Ruas Filter
        const matchRuas = AppState.selectedRuas === 'all' || cctv.ruasId === AppState.selectedRuas;

        // Status Filter
        const matchStatus = AppState.selectedStatus === 'all' || cctv.status === AppState.selectedStatus;

        // Arah Filter
        const matchArah = AppState.selectedArah === 'all' || 
            (AppState.selectedArah === 'timur' && cctv.arah.toLowerCase().includes('timur')) ||
            (AppState.selectedArah === 'barat' && cctv.arah.toLowerCase().includes('barat')) ||
            (AppState.selectedArah === 'dua-arah' && cctv.arah.toLowerCase().includes('dua'));

        return matchQuery && matchRuas && matchStatus && matchArah;
    });

    // Update UI elements
    updateFilterCounters();
    if (AppState.map) {
        renderMapMarkers();
    }
    renderSidebarList();
    renderStatsAndCharts();
    renderOperationalOverview();
    AppState.tablePage = 1;
    renderDataTable();
}

function updateFilterCounters() {
    const countEl = document.getElementById('filterResultCount');
    if (countEl) {
        countEl.textContent = `${AppState.filteredList.length} dari ${AppState.cctvList.length} Kamera`;
    }

    const totalCctvBadge = document.getElementById('totalCctvBadge');
    if (totalCctvBadge) {
        totalCctvBadge.textContent = AppState.cctvList.length;
    }

    // Ribbon values on map
    const ribbonTotal = document.getElementById('ribbonTotal');
    const ribbonOnline = document.getElementById('ribbonOnline');
    const ribbonRuas = document.getElementById('ribbonRuas');
    if (ribbonTotal) ribbonTotal.textContent = AppState.cctvList.length;
    if (ribbonOnline) ribbonOnline.textContent = AppState.cctvList.filter(c => c.status === 'online').length;
    if (ribbonRuas) ribbonRuas.textContent = RUAS_TOL_LIST.length - 1;
}

function resetAllFilters() {
    AppState.searchQuery = '';
    AppState.selectedRuas = 'all';
    AppState.selectedStatus = 'all';
    AppState.selectedArah = 'all';
    AppState.activeMission = {
        title: 'Filter dikembalikan',
        text: 'Seluruh titik CCTV kembali ditampilkan dan siap dianalisis.'
    };

    if (AppState.map && AppState.locationAssistLayer) {
        AppState.map.removeLayer(AppState.locationAssistLayer);
        AppState.locationAssistLayer = null;
    }
    if (AppState.map && AppState.nearestRouteLayer) {
        AppState.map.removeLayer(AppState.nearestRouteLayer);
        AppState.nearestRouteLayer = null;
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const ruasSelect = document.getElementById('filterRuasSelect');
    if (ruasSelect) ruasSelect.value = 'all';

    // Reset pills
    document.querySelectorAll('.filter-pill[data-filter-type]').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.filterVal === 'all');
    });
    applyFilters();
    showToast('Semua filter berhasil direset.', 'info');
}

// ==========================================================================
// 3B. OPERATIONAL WORKFLOWS & DECISION SUPPORT
// ==========================================================================
function renderOperationalOverview() {
    const data = AppState.filteredList;
    const highCount = data.filter(cctv => cctv.status === 'online').length;
    const ruasCount = new Set(data.map(cctv => cctv.ruasId)).size;
    const highPct = data.length ? Math.round((highCount / data.length) * 100) : 0;

    const visibleEl = document.getElementById('mapVisibleCount');
    const ruasEl = document.getElementById('mapRuasCount');
    const qualityEl = document.getElementById('mapQualityPct');
    const missionTitleEl = document.getElementById('opsMissionTitle');
    const missionTextEl = document.getElementById('opsMissionText');
    const mapMissionEl = document.getElementById('mapContextMission');

    if (visibleEl) visibleEl.textContent = data.length;
    if (ruasEl) ruasEl.textContent = ruasCount;
    if (qualityEl) qualityEl.textContent = `${highPct}%`;
    if (missionTitleEl) missionTitleEl.textContent = AppState.activeMission.title;
    if (missionTextEl) missionTextEl.textContent = AppState.activeMission.text;
    if (mapMissionEl) mapMissionEl.textContent = AppState.activeMission.text;
}

function setOperationalMission(title, text) {
    AppState.activeMission = { title, text };
    renderOperationalOverview();
}

function syncFilterControls() {
    const searchInput = document.getElementById('searchInput');
    const ruasSelect = document.getElementById('filterRuasSelect');
    if (searchInput) searchInput.value = AppState.searchQuery;
    if (ruasSelect) ruasSelect.value = AppState.selectedRuas;

    document.querySelectorAll('.filter-pill[data-filter-type="status"]').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.filterVal === AppState.selectedStatus);
    });
}

function fitCctvListOnMap(list, maxZoom = 12) {
    if (!AppState.map || !list.length) return;
    const latLngs = list
        .filter(cctv => Number.isFinite(cctv.lat) && Number.isFinite(cctv.lng))
        .map(cctv => [cctv.lat, cctv.lng]);
    if (!latLngs.length) return;
    if (latLngs.length === 1) {
        AppState.map.setView(latLngs[0], Math.min(maxZoom, 15));
        return;
    }
    AppState.map.fitBounds(latLngs, { padding: [55, 55], maxZoom });
}

function showVerificationPriorities() {
    AppState.searchQuery = '';
    AppState.selectedRuas = 'all';
    AppState.selectedStatus = 'offline';
    AppState.selectedArah = 'all';
    syncFilterControls();
    applyFilters();
    switchTab('map-view');
    fitCctvListOnMap(AppState.filteredList, 11);

    const count = AppState.filteredList.length;
    setOperationalMission(
        'Prioritas validasi koordinat',
        `${count} titik berstatus perlu verifikasi sedang ditampilkan untuk pemeriksaan lanjutan.`
    );
    showToast(`${count} titik prioritas verifikasi ditampilkan.`, count ? 'info' : 'success');
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = value => value * Math.PI / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm) {
    return distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function getNearestCctvCandidates() {
    if (!AppState.userLocation) return [];
    const searchValue = (document.getElementById('nearestCctvSearch')?.value || '').trim().toLowerCase();
    const radiusValue = document.getElementById('nearestRadiusSelect')?.value || '25';
    const radiusKm = radiusValue === 'all' ? Infinity : Number(radiusValue);
    const { lat, lng } = AppState.userLocation;

    return AppState.cctvList
        .filter(cctv => Number.isFinite(cctv.lat) && Number.isFinite(cctv.lng))
        .map(cctv => ({
            cctv,
            distanceKm: haversineDistanceKm(lat, lng, cctv.lat, cctv.lng)
        }))
        .filter(item => item.distanceKm <= radiusKm)
        .filter(item => {
            if (!searchValue) return true;
            return [item.cctv.nama, item.cctv.id, item.cctv.km, item.cctv.ruasNama]
                .join(' ')
                .toLowerCase()
                .includes(searchValue);
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);
}

function renderNearestCctvResults() {
    const container = document.getElementById('nearestCctvResults');
    if (!container) return;

    if (!AppState.userLocation) {
        container.innerHTML = `
            <div class="nearest-empty-state">
                <i class="fa-solid fa-location-dot"></i>
                <span>Aktifkan lokasi untuk melihat CCTV terdekat secara langsung.</span>
            </div>
        `;
        return;
    }

    const candidates = getNearestCctvCandidates();
    if (!candidates.length) {
        container.innerHTML = `
            <div class="nearest-empty-state">
                <i class="fa-solid fa-magnifying-glass-location"></i>
                <span>Tidak ada CCTV yang cocok pada radius dan pencarian ini.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = candidates.slice(0, 4).map(({ cctv, distanceKm }, index) => `
        <div class="nearest-result-item">
            <button class="nearest-result-main" onclick="focusNearestCctv('${cctv.id}')">
                <span class="nearest-result-rank">${String(index + 1).padStart(2, '0')}</span>
                <span class="nearest-result-copy">
                    <strong>${escapeHtml(cctv.nama)}</strong>
                    <small>${escapeHtml(cctv.ruasNama)} · ${escapeHtml(cctv.km)}</small>
                </span>
                <span class="nearest-distance">${formatDistance(distanceKm)}</span>
            </button>
            <button class="nearest-detail-btn" onclick="openDetailModal('${cctv.id}')" title="Buka detail CCTV" aria-label="Buka detail ${escapeHtml(cctv.nama)}">
                <i class="fa-solid fa-circle-info"></i>
            </button>
        </div>
    `).join('');
}

function updateRealtimeLocationUI() {
    const badge = document.getElementById('locationLiveBadge');
    const coordsEl = document.getElementById('liveLocationCoords');
    const accuracyEl = document.getElementById('liveLocationAccuracy');
    const button = document.getElementById('btnLiveLocation');
    const isWatching = AppState.locationWatchId !== null;

    if (badge) {
        badge.classList.toggle('active', isWatching);
        badge.innerHTML = `<span></span> ${isWatching ? 'Live' : 'Belum aktif'}`;
    }
    if (button) {
        button.classList.toggle('active', isWatching);
        button.innerHTML = isWatching
            ? '<i class="fa-solid fa-stop"></i><span>Hentikan<br>Pelacakan</span>'
            : '<i class="fa-solid fa-satellite-dish"></i><span>Aktifkan<br>Real-time</span>';
    }
    if (coordsEl && AppState.userLocation) {
        coordsEl.textContent = `${AppState.userLocation.lat.toFixed(6)}, ${AppState.userLocation.lng.toFixed(6)}`;
    }
    if (accuracyEl && AppState.userLocation) {
        const updatedAt = new Date(AppState.userLocation.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        accuracyEl.textContent = `Akurasi ±${Math.round(AppState.userLocation.accuracy)} m · diperbarui ${updatedAt}`;
    }
}

function handleRealtimePosition(position, shouldFocus = false) {
    const firstFix = !AppState.userLocation;
    AppState.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp || Date.now()
    };

    if (!AppState.realtimeLocationLayer) {
        AppState.realtimeLocationLayer = L.layerGroup().addTo(AppState.map);
    }
    AppState.realtimeLocationLayer.clearLayers();

    const { lat, lng, accuracy } = AppState.userLocation;
    L.circle([lat, lng], {
        radius: accuracy,
        color: '#2563eb',
        weight: 1,
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        interactive: false
    }).addTo(AppState.realtimeLocationLayer);
    L.circleMarker([lat, lng], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1
    }).bindPopup(`<strong>Posisi real-time Anda</strong><br>Akurasi ±${Math.round(accuracy)} meter`).addTo(AppState.realtimeLocationLayer);

    updateRealtimeLocationUI();
    renderNearestCctvResults();

    if (shouldFocus || firstFix) {
        AppState.map.flyTo([lat, lng], 13, { duration: 0.8 });
        AppState.lastLocationFocusAt = Date.now();
    }
    if (AppState.pendingNearestFocus) {
        AppState.pendingNearestFocus = false;
        const nearest = getNearestCctvCandidates()[0];
        if (nearest) focusNearestCctv(nearest.cctv.id);
    }
}

function handleRealtimeLocationError(error) {
    const message = error.code === 1
        ? 'Izin lokasi ditolak. Aktifkan izin lokasi pada browser lalu coba lagi.'
        : error.code === 3
            ? 'Pencarian lokasi melewati batas waktu. Coba di area dengan sinyal GPS lebih baik.'
            : 'Posisi tidak dapat ditemukan. Pastikan layanan lokasi perangkat aktif.';
    stopRealtimeLocation(false);
    const accuracyEl = document.getElementById('liveLocationAccuracy');
    if (accuracyEl) accuracyEl.textContent = message;
    setOperationalMission('Lokasi belum tersedia', message);
    showToast(message, 'error');
}

function startRealtimeLocation(shouldFocus = true) {
    if (!navigator.geolocation) {
        showToast('Browser tidak mendukung pelacakan lokasi.', 'error');
        return;
    }
    if (AppState.locationWatchId !== null) {
        if (shouldFocus && AppState.userLocation) {
            AppState.map.flyTo([AppState.userLocation.lat, AppState.userLocation.lng], 13);
        }
        return;
    }

    setOperationalMission('Pelacakan lokasi real-time', 'Posisi perangkat sedang diperbarui dan CCTV terdekat dihitung otomatis.');
    AppState.locationWatchId = navigator.geolocation.watchPosition(
        position => handleRealtimePosition(position, shouldFocus),
        handleRealtimeLocationError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    updateRealtimeLocationUI();
}

function stopRealtimeLocation(showNotification = true) {
    if (AppState.locationWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(AppState.locationWatchId);
    }
    AppState.locationWatchId = null;
    updateRealtimeLocationUI();
    if (showNotification) showToast('Pelacakan lokasi real-time dihentikan.', 'info');
}

function toggleRealtimeLocation() {
    if (AppState.locationWatchId === null) startRealtimeLocation(true);
    else stopRealtimeLocation(true);
}

async function initializeRealtimeLocation() {
    const searchInput = document.getElementById('nearestCctvSearch');
    const radiusSelect = document.getElementById('nearestRadiusSelect');
    searchInput?.addEventListener('input', renderNearestCctvResults);
    radiusSelect?.addEventListener('change', renderNearestCctvResults);

    if (!navigator.permissions?.query || !navigator.geolocation) return;
    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') startRealtimeLocation(false);
        permission.addEventListener('change', () => {
            if (permission.state === 'granted' && AppState.locationWatchId === null) startRealtimeLocation(false);
            if (permission.state === 'denied') stopRealtimeLocation(false);
        });
    } catch (error) {
        console.info('Status izin geolokasi tidak tersedia:', error.message);
    }
}

function focusNearestCctv(cctvId) {
    if (!AppState.userLocation) {
        AppState.pendingNearestFocus = true;
        startRealtimeLocation(true);
        return;
    }
    const cctv = AppState.cctvList.find(item => item.id === cctvId);
    if (!cctv) return;

    if (AppState.nearestRouteLayer) AppState.map.removeLayer(AppState.nearestRouteLayer);
    AppState.nearestRouteLayer = L.polyline([
        [AppState.userLocation.lat, AppState.userLocation.lng],
        [cctv.lat, cctv.lng]
    ], {
        color: '#7c3aed',
        weight: 4,
        opacity: 0.88,
        dashArray: '9 9'
    }).addTo(AppState.map);

    switchTab('map-view');
    fitCctvListOnMap([
        { lat: AppState.userLocation.lat, lng: AppState.userLocation.lng },
        cctv
    ], 14);
    selectCctvCard(cctv.id, false);
    const marker = AppState.markerMap.get(cctv.id);
    if (marker) marker.openPopup();

    const distanceKm = haversineDistanceKm(AppState.userLocation.lat, AppState.userLocation.lng, cctv.lat, cctv.lng);
    setOperationalMission('CCTV terdekat dipilih', `${cctv.nama} berjarak sekitar ${formatDistance(distanceKm)} dari posisi Anda.`);
}

function findNearestCctv() {
    if (!AppState.userLocation) {
        AppState.pendingNearestFocus = true;
        setOperationalMission('Mencari posisi Anda', 'Izinkan lokasi agar sistem dapat menghitung CCTV terdekat.');
        startRealtimeLocation(true);
        return;
    }
    const nearest = getNearestCctvCandidates()[0];
    if (!nearest) {
        showToast('Tidak ada CCTV yang cocok pada radius pencarian saat ini.', 'error');
        return;
    }
    focusNearestCctv(nearest.cctv.id);
    showToast(`CCTV terdekat: ${nearest.cctv.nama} (${formatDistance(nearest.distanceKm)}).`, 'success');
}

function focusRuasFromAnalysis(ruasId) {
    AppState.searchQuery = '';
    AppState.selectedRuas = ruasId;
    AppState.selectedStatus = 'all';
    AppState.selectedArah = 'all';
    syncFilterControls();
    applyFilters();
    closeModal('opsAnalysisModal');
    switchTab('map-view');
    fitCctvListOnMap(AppState.filteredList, 12);

    const ruasName = AppState.filteredList[0]?.ruasNama || 'ruas terpilih';
    setOperationalMission(
        `Analisis ruas ${ruasName}`,
        `${AppState.filteredList.length} titik pada ruas ini sedang ditampilkan di peta.`
    );
}

function openOperationalAnalysis() {
    const data = AppState.filteredList;
    const total = data.length;
    const high = data.filter(cctv => cctv.status === 'online').length;
    const review = data.filter(cctv => cctv.status === 'offline').length;
    const highPct = total ? Math.round((high / total) * 100) : 0;

    const groups = new Map();
    data.forEach(cctv => {
        if (!groups.has(cctv.ruasId)) {
            groups.set(cctv.ruasId, {
                id: cctv.ruasId,
                name: cctv.ruasNama,
                items: [],
                high: 0,
                review: 0,
                kmValues: []
            });
        }
        const group = groups.get(cctv.ruasId);
        group.items.push(cctv);
        if (cctv.status === 'online') group.high += 1;
        if (cctv.status === 'offline') group.review += 1;
        if (Number.isFinite(cctv.kmNum) && cctv.kmNum < 9000) group.kmValues.push(cctv.kmNum);
    });

    const groupList = [...groups.values()].sort((a, b) => b.items.length - a.items.length);
    const totalEl = document.getElementById('opsKpiTotal');
    const highEl = document.getElementById('opsKpiHigh');
    const ruasEl = document.getElementById('opsKpiRuas');
    const reviewEl = document.getElementById('opsKpiReview');
    if (totalEl) totalEl.textContent = total;
    if (highEl) highEl.textContent = `${highPct}%`;
    if (ruasEl) ruasEl.textContent = groupList.length;
    if (reviewEl) reviewEl.textContent = review;

    const coverageRows = document.getElementById('opsCoverageRows');
    if (coverageRows) {
        coverageRows.innerHTML = groupList.length ? groupList.map(group => {
            const pct = group.items.length ? Math.round((group.high / group.items.length) * 100) : 0;
            return `
                <tr>
                    <td><strong>${escapeHtml(group.name)}</strong><small>${group.review} perlu verifikasi</small></td>
                    <td><span class="ops-count-pill">${group.items.length}</span></td>
                    <td>
                        <div class="ops-quality-meter"><span style="width:${pct}%"></span></div>
                        <small>${pct}%</small>
                    </td>
                    <td><button class="ops-table-action" onclick="focusRuasFromAnalysis('${group.id}')">Lihat peta</button></td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="4" class="ops-empty">Tidak ada data pada filter saat ini.</td></tr>';
    }

    const gaps = [];
    groupList.forEach(group => {
        const kmValues = [...new Set(group.kmValues)].sort((a, b) => a - b);
        for (let index = 1; index < kmValues.length; index += 1) {
            gaps.push({
                ruasId: group.id,
                ruasName: group.name,
                from: kmValues[index - 1],
                to: kmValues[index],
                gap: kmValues[index] - kmValues[index - 1]
            });
        }
    });
    gaps.sort((a, b) => b.gap - a.gap);

    const gapList = document.getElementById('opsGapList');
    if (gapList) {
        gapList.innerHTML = gaps.length ? gaps.slice(0, 6).map((gap, index) => `
            <button class="ops-gap-item" onclick="focusRuasFromAnalysis('${gap.ruasId}')">
                <span class="ops-gap-rank">${String(index + 1).padStart(2, '0')}</span>
                <span class="ops-gap-copy">
                    <strong>${escapeHtml(gap.ruasName)}</strong>
                    <small>KM ${gap.from.toFixed(1)} → KM ${gap.to.toFixed(1)}</small>
                </span>
                <span class="ops-gap-value">${gap.gap.toFixed(1)} km</span>
            </button>
        `).join('') : '<div class="ops-empty">Data KM belum cukup untuk menghitung celah.</div>';
    }

    const severity = { offline: 0, gangguan: 1, online: 2 };
    const priorities = [...data]
        .sort((a, b) => (severity[a.status] ?? 3) - (severity[b.status] ?? 3) || (a.skorVerifikasi ?? 999) - (b.skorVerifikasi ?? 999))
        .filter(cctv => cctv.status !== 'online')
        .slice(0, 6);
    const priorityList = document.getElementById('opsPriorityList');
    if (priorityList) {
        priorityList.innerHTML = priorities.length ? priorities.map(cctv => `
            <button class="ops-priority-item" onclick="closeModal('opsAnalysisModal'); focusCctvOnMap('${cctv.id}')">
                <span class="legend-dot ${cctv.status}"></span>
                <span>
                    <strong>${escapeHtml(cctv.nama)}</strong>
                    <small>${escapeHtml(cctv.ruasNama)} · ${escapeHtml(cctv.km)}</small>
                </span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `).join('') : '<div class="ops-empty">Tidak ada titik berprioritas pada filter saat ini.</div>';
    }

    setOperationalMission('Analisis cakupan dibuka', `${total} titik pada ${groupList.length} ruas sedang dianalisis.`);
    openModal('opsAnalysisModal');
}

// ==========================================================================
// 4. SIDEBAR CCTV CARDS
// ==========================================================================
function renderSidebarList() {
    const container = document.getElementById('sidebarCctvList');
    if (!container) return;

    if (AppState.filteredList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-dim);">
                <i class="fa-solid fa-video-slash" style="font-size: 36px; margin-bottom: 12px; opacity: 0.5;"></i>
                <p style="font-size: 14px; font-weight: 600; color: var(--text-muted);">Tidak ada CCTV yang cocok</p>
                <p style="font-size: 12px; margin-top: 4px;">Coba ubah kata kunci pencarian atau reset filter.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = AppState.filteredList.map(cctv => {
        const isSelected = AppState.selectedCctv && AppState.selectedCctv.id === cctv.id;
        const statusLabel = getCoordinateStatusLabel(cctv);
        
        return `
            <div class="cctv-card status-${cctv.status} ${isSelected ? 'selected' : ''}" 
                 id="card-${cctv.id}"
                 onclick="selectCctvCard('${cctv.id}', true)">
                <div class="cctv-card-top">
                    <div>
                        <div class="cctv-card-title">${escapeHtml(cctv.nama)}</div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${escapeHtml(cctv.ruasNama)}</div>
                    </div>
                    <span class="cctv-card-code">${cctv.id}</span>
                </div>

                <div class="cctv-card-meta">
                    <span class="meta-badge km-badge"><i class="fa-solid fa-location-dot"></i> ${cctv.km}</span>
                    <span class="meta-badge"><i class="fa-solid fa-route"></i> ${escapeHtml(cctv.metodeKoordinat || 'N/A')}</span>
                    <span class="meta-badge traffic-badge"><i class="fa-solid fa-database"></i> ${escapeHtml(cctv.sumber || 'BPJT')}</span>
                </div>

                <div class="cctv-card-actions">
                    <div class="status-badge ${cctv.status}">
                        <span class="status-bullet"></span> ${statusLabel}
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-card-action" title="Sorot Titik di Peta" onclick="event.stopPropagation(); focusCctvOnMap('${cctv.id}')">
                            <i class="fa-solid fa-crosshairs"></i> Sorot
                        </button>
                        <button class="btn-card-action btn-stream" title="Buka detail titik" onclick="event.stopPropagation(); openDetailModal('${cctv.id}')">
                            <i class="fa-solid fa-circle-info"></i> Detail
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function selectCctvCard(cctvId, triggerFocus = true) {
    const cctv = AppState.cctvList.find(c => c.id === cctvId);
    if (!cctv) return;

    AppState.selectedCctv = cctv;

    // Highlight card in sidebar
    document.querySelectorAll('.cctv-card').forEach(el => el.classList.remove('selected'));
    const cardEl = document.getElementById(`card-${cctvId}`);
    if (cardEl) {
        cardEl.classList.add('selected');
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (triggerFocus) {
        focusCctvOnMap(cctvId);
    }
}

// ==========================================================================
// 5. DETAIL TITIK DAN PETA KOORDINAT OPENSTREETMAP
// ==========================================================================
let miniMapInstance = null;

function openDetailModal(cctvId) {
    const cctv = AppState.cctvList.find(c => c.id === cctvId);
    if (!cctv) return;

    AppState.activeDetailCctv = cctv;

    // Fill modal with factual dataset information.
    document.getElementById('streamModalTitle').textContent = `${cctv.nama} (${cctv.km})`;
    document.getElementById('streamLocationLabel').textContent = `${cctv.ruasNama} - ${cctv.posisi}`;
    document.getElementById('telemetryKm').textContent = cctv.km;
    document.getElementById('telemetryArah').textContent = getCoordinateMethodLabel(cctv);
    document.getElementById('telemetrySpeed').textContent = getCoordinateStatusLabel(cctv);
    document.getElementById('telemetryTraffic').textContent = cctv.sumber || 'BPJT';
    document.getElementById('telemetryCoords').textContent = `${cctv.lat.toFixed(4)}, ${cctv.lng.toFixed(4)}`;
    document.getElementById('telemetryRes').textContent = cctv.statusVerifikasi || 'Tidak tersedia';

    // Link to the same coordinate on OpenStreetMap.
    const osmBtn = document.getElementById('btnExternalOpenStreetMap');
    if (osmBtn) {
        osmBtn.href = `https://www.openstreetmap.org/?mlat=${cctv.lat}&mlon=${cctv.lng}#map=17/${cctv.lat}/${cctv.lng}`;
    }

    const modal = document.getElementById('cctvDetailModal');
    modal.classList.add('show');
    initMiniMap(cctv);
}

function initMiniMap(cctv) {
    const miniMapEl = document.getElementById('cctvMiniMap');
    if (!miniMapEl) return;

    if (!miniMapInstance) {
        miniMapInstance = L.map('cctvMiniMap', {
            zoomControl: true,
            attributionControl: true
        });
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            maxZoom: 20,
            subdomains: 'abc',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> kontributor, Tiles style by HOT'
        }).addTo(miniMapInstance);
    }

    setTimeout(() => {
        miniMapInstance.invalidateSize();
        miniMapInstance.setView([cctv.lat, cctv.lng], 16);

        // Remove old marker
        if (miniMapInstance._customMarker) {
            miniMapInstance.removeLayer(miniMapInstance._customMarker);
        }

        const icon = L.divIcon({
            className: 'custom-cctv-marker status-online',
            html: `
                <div class="marker-pin-outer" style="width:36px; height:36px; background:#10b981; border:3px solid #ffffff; box-shadow:0 0 15px rgba(16,185,129,0.8);">
                    <i class="fa-solid fa-video" style="font-size:16px;"></i>
                    <span class="marker-status-dot" style="width:8px; height:8px;"></span>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        miniMapInstance._customMarker = L.marker([cctv.lat, cctv.lng], { icon: icon }).addTo(miniMapInstance)
            .bindPopup(`<b>${escapeHtml(cctv.nama)}</b><br>${cctv.ruasNama} (${cctv.km})<br>Lat: ${cctv.lat}, Lng: ${cctv.lng}`).openPopup();
    }, 150);
}

function closeDetailModal() {
    const modal = document.getElementById('cctvDetailModal');
    modal.classList.remove('show');
}

// Realistic Highway Perspective Video Simulator with AI vehicle detection bounding boxes
function initCanvasStream(cctv) {
    const canvas = document.getElementById('cctvStreamCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Set resolution
    canvas.width = 960;
    canvas.height = 540;

    // Initialize random vehicles on 4 highway lanes
    AppState.streamVehicles = [];
    const laneXPositions = [280, 400, 560, 680]; // lane vanishing perspectives
    const vehicleTypes = [
        { type: 'SEDAN', color: '#e2e8f0', speed: 2.8, w: 46, h: 28 },
        { type: 'SUV', color: '#38bdf8', speed: 2.5, w: 50, h: 32 },
        { type: 'TRUCK', color: '#f59e0b', speed: 1.8, w: 68, h: 36 },
        { type: 'BUS', color: '#10b981', speed: 2.1, w: 74, h: 36 },
        { type: 'CAR', color: '#f43f5e', speed: 3.1, w: 44, h: 26 }
    ];

    for (let i = 0; i < 7; i++) {
        const lane = Math.floor(Math.random() * 4);
        const template = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        AppState.streamVehicles.push({
            ...template,
            lane: lane,
            y: Math.random() * 400 + 100,
            confidence: (Math.random() * 10 + 89).toFixed(1)
        });
    }

    if (AppState.canvasAnimationId) {
        cancelAnimationFrame(AppState.canvasAnimationId);
    }

    function renderFrame() {
        if (!AppState.isStreamPlaying) {
            AppState.canvasAnimationId = requestAnimationFrame(renderFrame);
            return;
        }

        const width = canvas.width;
        const height = canvas.height;

        // Background / Highway Scenery
        if (AppState.isNightVision) {
            ctx.fillStyle = '#05110a'; // green tint for night vision
        } else {
            ctx.fillStyle = '#0f172a'; // dark dusk sky
        }
        ctx.fillRect(0, 0, width, height);

        // Distant horizon & landscape
        ctx.fillStyle = AppState.isNightVision ? '#092416' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(0, 160);
        ctx.lineTo(width, 160);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fill();

        // Highway Asphalt (Perspective Trapezoid)
        const vpX = width / 2;
        const vpY = 160; // Vanishing Point

        ctx.fillStyle = AppState.isNightVision ? '#0d2d1d' : '#262f40';
        ctx.beginPath();
        ctx.moveTo(vpX - 80, vpY);
        ctx.lineTo(vpX + 80, vpY);
        ctx.lineTo(width - 40, height);
        ctx.lineTo(40, height);
        ctx.closePath();
        ctx.fill();

        // Road Side Barriers (Median Concrete Barrier & Guardrail)
        ctx.strokeStyle = AppState.isNightVision ? '#22c55e' : '#f97316';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vpX - 80, vpY);
        ctx.lineTo(40, height);
        ctx.stroke();

        ctx.strokeStyle = AppState.isNightVision ? '#22c55e' : '#64748b';
        ctx.beginPath();
        ctx.moveTo(vpX + 80, vpY);
        ctx.lineTo(width - 40, height);
        ctx.stroke();

        // Lane Markings (3 divider lines)
        const laneDividers = [-0.25, 0, 0.25];
        const timeNow = Date.now() * 0.005;

        laneDividers.forEach(factor => {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 20]);
            ctx.lineDashOffset = -timeNow * 20;

            const startX = vpX + (factor * 160);
            const endX = (width / 2) + (factor * (width - 120));

            ctx.beginPath();
            ctx.moveTo(startX, vpY);
            ctx.lineTo(endX, height);
            ctx.stroke();
            ctx.setLineDash([]); // reset
        });

        // Render Dynamic Moving Vehicles with AI Detection Bounding Boxes
        AppState.streamVehicles.forEach(v => {
            v.y += v.speed;
            if (v.y > height + 50) {
                v.y = vpY + Math.random() * 20;
                v.lane = Math.floor(Math.random() * 4);
                v.speed = Math.random() * 1.5 + 2.0;
            }

            // Calculate perspective scale based on Y position
            const progress = (v.y - vpY) / (height - vpY);
            if (progress <= 0) return;

            const scale = Math.max(0.2, progress);
            const laneOffset = (v.lane - 1.5) * 180 * scale;
            const posX = vpX + laneOffset;
            const posY = v.y;

            const curW = v.w * scale * 1.5;
            const curH = v.h * scale * 1.5;

            // Vehicle Body
            ctx.fillStyle = v.color;
            ctx.beginPath();
            ctx.roundRect(posX - curW / 2, posY - curH / 2, curW, curH, 4 * scale);
            ctx.fill();

            // Headlights / Taillights
            ctx.fillStyle = '#ef4444'; // Red taillights
            ctx.fillRect(posX - curW / 2 + 2, posY - curH / 2 + 2, 4 * scale, 3 * scale);
            ctx.fillRect(posX + curW / 2 - (6 * scale), posY - curH / 2 + 2, 4 * scale, 3 * scale);

            // AI Object Detection Bounding Box (ITS Smart Highway)
            ctx.strokeStyle = AppState.isNightVision ? '#00ffcc' : '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(posX - curW / 2 - 4, posY - curH / 2 - 4, curW + 8, curH + 8);

            // AI Label Tag
            ctx.fillStyle = 'rgba(2, 132, 199, 0.85)';
            ctx.fillRect(posX - curW / 2 - 4, posY - curH / 2 - 18 * scale - 4, 75 * scale, 16 * scale);
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.max(8, 10 * scale)}px JetBrains Mono, monospace`;
            ctx.textAlign = 'left';
            ctx.fillText(`${v.type} ${(v.speed * 28).toFixed(0)}km/h`, posX - curW / 2 - 2, posY - curH / 2 - 6);
        });

        // Scanline & Vignette Effect
        if (AppState.isNightVision) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
            ctx.fillRect(0, 0, width, height);
        }

        // Live Overlays & Timestamp
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID');
        const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });

        document.getElementById('streamHudTime').textContent = `${dateStr} ${timeStr} WIB`;

        AppState.canvasAnimationId = requestAnimationFrame(renderFrame);
    }

    renderFrame();
}

// Stream Control: Toggle Pause / Play
function toggleStreamPlay() {
    AppState.isStreamPlaying = !AppState.isStreamPlaying;
    const btn = document.getElementById('btnToggleStream');
    if (btn) {
        btn.innerHTML = AppState.isStreamPlaying 
            ? '<i class="fa-solid fa-pause"></i> Jeda' 
            : '<i class="fa-solid fa-play"></i> Lanjutkan';
    }
}

// Stream Control: Toggle Night Vision Mode
function toggleNightVision() {
    AppState.isNightVision = !AppState.isNightVision;
    showToast(AppState.isNightVision ? 'Mode Night Vision aktif' : 'Mode Warna Normal aktif', 'info');
}

// Stream Control: Take Snapshot Photo of Live Highway
function captureStreamSnapshot() {
    const canvas = document.getElementById('cctvStreamCanvas');
    if (!canvas) return;

    try {
        const imageUri = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const cctvId = AppState.activeStreamCctv ? AppState.activeStreamCctv.id : 'cctv_transjawa';
        downloadLink.download = `snapshot_${cctvId}_${Date.now()}.png`;
        downloadLink.href = imageUri;
        downloadLink.click();
        showToast('Snapshot kamera berhasil diunduh!', 'success');
    } catch (e) {
        showToast('Gagal mengambil snapshot.', 'error');
    }
}

// ==========================================================================
// 6. STATISTIK & GRAFIK (FASE 2)
// ==========================================================================
let ruasChartInstance = null;
let statusChartInstance = null;

function renderStatsAndCharts() {
    const total = AppState.cctvList.length;
    const online = AppState.cctvList.filter(c => c.status === 'online').length;
    const gangguan = AppState.cctvList.filter(c => c.status === 'gangguan').length;
    const offline = AppState.cctvList.filter(c => c.status === 'offline').length;

    // Stat metric card values
    const statTotalEl = document.getElementById('statTotalCctv');
    const statOnlineEl = document.getElementById('statOnlineCctv');
    const statGangguanEl = document.getElementById('statGangguanCctv');
    const statOfflineEl = document.getElementById('statOfflineCctv');
    const statOnlinePctEl = document.getElementById('statOnlinePct');

    if (statTotalEl) statTotalEl.textContent = total;
    if (statOnlineEl) statOnlineEl.textContent = online;
    if (statGangguanEl) statGangguanEl.textContent = gangguan;
    if (statOfflineEl) statOfflineEl.textContent = offline;
    if (statOnlinePctEl) statOnlinePctEl.textContent = total > 0 ? `${((online / total) * 100).toFixed(1)}% dari seluruh titik` : '0%';

    // Build Chart 1: Bar Chart per Ruas Tol
    renderRuasChart();

    // Build Chart 2: Donut Chart per Status CCTV
    renderStatusChart(online, gangguan, offline);
}

function renderRuasChart() {
    const canvas = document.getElementById('chartRuasTol');
    if (!canvas) return;

    // Calculate count per Ruas
    const ruasCounts = {};
    RUAS_TOL_LIST.filter(r => r.id !== 'all').forEach(r => {
        ruasCounts[r.name] = 0;
    });

    AppState.cctvList.forEach(c => {
        if (ruasCounts[c.ruasNama] !== undefined) {
            ruasCounts[c.ruasNama]++;
        } else {
            ruasCounts[c.ruasNama] = 1;
        }
    });

    const labels = Object.keys(ruasCounts).map(l => l.replace('Tol ', ''));
    const dataValues = Object.values(ruasCounts);

    if (ruasChartInstance) {
        ruasChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    ruasChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Titik CCTV',
                data: dataValues,
                backgroundColor: 'rgba(29, 78, 216, 0.85)',
                borderColor: '#1d4ed8',
                borderWidth: 1.5,
                borderRadius: 6,
                hoverBackgroundColor: '#1e40af'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#93c5fd',
                    borderColor: 'rgba(29, 78, 216, 0.3)',
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { color: '#64748b', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { color: '#64748b', stepSize: 1, beginAtZero: true }
                }
            }
        }
    });
}

function renderStatusChart(online, gangguan, offline) {
    const canvas = document.getElementById('chartStatusCctv');
    if (!canvas) return;

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Akurasi tinggi', 'Akurasi sedang', 'Perlu verifikasi'],
            datasets: [{
                data: [online, gangguan, offline],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#334155', padding: 14, font: { size: 11, family: 'Plus Jakarta Sans' } }
                },
                tooltip: {
                    backgroundColor: 'rgba(14, 23, 38, 0.95)',
                    titleColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10
                }
            }
        }
    });
}

// ==========================================================================
// 7. DAFTAR DATA CCTV / DATA TABLE (FASE 3)
// ==========================================================================
function renderDataTable() {
    const tbody = document.getElementById('cctvTableBody');
    const adminTbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    // Sort dataset
    const sorted = [...AppState.filteredList].sort((a, b) => {
        let valA = a[AppState.tableSortField];
        let valB = b[AppState.tableSortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return AppState.tableSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return AppState.tableSortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination slice
    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / AppState.tablePageSize) || 1;
    AppState.tablePage = Math.min(AppState.tablePage, totalPages);

    const startIndex = (AppState.tablePage - 1) * AppState.tablePageSize;
    const paginatedItems = sorted.slice(startIndex, startIndex + AppState.tablePageSize);

    const isAdmin = AdminAuth.isLoggedIn();

    if (paginatedItems.length === 0) {
        const emptyRow = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-dim);">
                    <i class="fa-solid fa-table-list" style="font-size: 28px; opacity: 0.4; margin-bottom: 8px;"></i>
                    <p>Tidak ada data CCTV yang tersedia.</p>
                </td>
            </tr>
        `;
        tbody.innerHTML = emptyRow;
        if (adminTbody) adminTbody.innerHTML = emptyRow;
    } else {
        const rowsHtml = paginatedItems.map((cctv, idx) => {
            const rowNumber = startIndex + idx + 1;
            const statusLabel = getCoordinateStatusLabel(cctv);

            return `
                <tr>
                    <td style="color: var(--text-dim); font-family: var(--font-mono); font-size: 11px;">${rowNumber}</td>
                    <td class="table-code-cell">${cctv.id}</td>
                    <td>
                        <strong style="color: var(--text-heading);">${escapeHtml(cctv.nama)}</strong>
                        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(cctv.posisi)}</div>
                    </td>
                    <td>${escapeHtml(cctv.ruasNama)}</td>
                    <td class="table-km-cell">${cctv.km}</td>
                    <td style="font-size: 12px; color: var(--text-muted);">${escapeHtml(getCoordinateMethodLabel(cctv))}</td>
                    <td>
                        <span class="status-badge ${cctv.status}">
                            <span class="status-bullet"></span> ${statusLabel}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions-cell">
                            <button class="btn-table-icon highlight" title="Sorot di Peta" onclick="focusCctvOnMap('${cctv.id}')">
                                <i class="fa-solid fa-crosshairs"></i>
                            </button>
                            <button class="btn-table-icon stream" title="Buka detail titik" onclick="openDetailModal('${cctv.id}')">
                                <i class="fa-solid fa-circle-info"></i>
                            </button>
                            ${isAdmin ? `
                                <button class="btn-table-icon edit" title="Ubah Data Titik" onclick="openEditModal('${cctv.id}')">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button class="btn-table-icon delete" title="Hapus Titik" onclick="openDeleteConfirmModal('${cctv.id}')">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rowsHtml;

        if (adminTbody) {
            adminTbody.innerHTML = paginatedItems.map((cctv, idx) => {
                const rowNumber = startIndex + idx + 1;
                const statusLabel = getCoordinateStatusLabel(cctv);

                return `
                    <tr>
                        <td style="color: var(--text-dim); font-family: var(--font-mono); font-size: 11px;">${rowNumber}</td>
                        <td class="table-code-cell">${cctv.id}</td>
                        <td>
                            <strong style="color: var(--text-heading);">${escapeHtml(cctv.nama)}</strong>
                            <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(cctv.posisi)}</div>
                        </td>
                        <td>${escapeHtml(cctv.ruasNama)}</td>
                        <td class="table-km-cell">${cctv.km}</td>
                        <td style="font-size: 12px; color: var(--text-muted);">${escapeHtml(getCoordinateMethodLabel(cctv))}</td>
                        <td>
                            <span class="status-badge ${cctv.status}">
                                <span class="status-bullet"></span> ${statusLabel}
                            </span>
                        </td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="openEditModal('${cctv.id}')">
                                    <i class="fa-solid fa-pen-to-square"></i> Ubah
                                </button>
                                <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; border-color: rgba(239, 68, 68, 0.4); color: #f87171;" onclick="openDeleteConfirmModal('${cctv.id}')">
                                    <i class="fa-solid fa-trash-can"></i> Hapus
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Pagination numbers & info
    const infoEl = document.getElementById('tablePaginationInfo');
    if (infoEl) {
        const fromNum = totalItems === 0 ? 0 : startIndex + 1;
        const toNum = Math.min(startIndex + AppState.tablePageSize, totalItems);
        infoEl.textContent = `Menampilkan ${fromNum} - ${toNum} dari ${totalItems} Titik CCTV`;
    }

    renderPaginationButtons(totalPages);
}

function renderPaginationButtons(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;

    let html = `
        <button class="btn-page btn-page-nav" title="Halaman sebelumnya" aria-label="Halaman sebelumnya" onclick="changeTablePage(${AppState.tablePage - 1})" ${AppState.tablePage <= 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;

    // Keep pagination compact so both navigation arrows are always visible.
    const visiblePages = new Set([
        1,
        totalPages,
        AppState.tablePage - 1,
        AppState.tablePage,
        AppState.tablePage + 1
    ].filter(page => page >= 1 && page <= totalPages));

    const orderedPages = [...visiblePages].sort((a, b) => a - b);
    orderedPages.forEach((page, index) => {
        const previousPage = orderedPages[index - 1];
        if (index > 0 && page - previousPage > 1) {
            html += '<span class="pagination-ellipsis" aria-hidden="true">…</span>';
        }

        html += `
            <button class="btn-page ${page === AppState.tablePage ? 'active' : ''}"
                    aria-label="Halaman ${page}"
                    ${page === AppState.tablePage ? 'aria-current="page"' : ''}
                    onclick="changeTablePage(${page})">
                ${page}
            </button>
        `;
    });

    if (totalPages > 1) {
        html += `
            <span class="pagination-page-summary">${AppState.tablePage} / ${totalPages}</span>
        `;
    }

    html += `
        <button class="btn-page btn-page-nav" title="Halaman berikutnya" aria-label="Halaman berikutnya" onclick="changeTablePage(${AppState.tablePage + 1})" ${AppState.tablePage >= totalPages ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

function changeTablePage(newPage) {
    const totalPages = Math.ceil(AppState.filteredList.length / AppState.tablePageSize) || 1;
    AppState.tablePage = Math.max(1, Math.min(newPage, totalPages));
    renderDataTable();
}

function requireAdminExportAccess(actionLabel) {
    if (AdminAuth.isLoggedIn()) return true;
    showToast(`${actionLabel} hanya tersedia untuk administrator.`, 'error');
    openModal('loginModal');
    return false;
}

// Export CCTV Data to CSV file
function exportDataToCSV() {
    if (!requireAdminExportAccess('Unduh CSV')) return;
    const headers = ['ID Kamera', 'Nama Titik', 'Ruas Tol', 'KM', 'Posisi', 'Latitude', 'Longitude', 'Status Koordinat', 'Metode Koordinat', 'Sumber', 'Status Verifikasi', 'Skor Verifikasi'];
    const exportedData = AppState.filteredList;
    if (!exportedData.length) {
        showToast('Tidak ada data pada filter saat ini untuk diekspor.', 'error');
        return;
    }
    const rows = exportedData.map(c => [
        `"${c.id}"`,
        `"${c.nama.replace(/"/g, '""')}"`,
        `"${c.ruasNama}"`,
        `"${c.km}"`,
        `"${c.posisi}"`,
        c.lat,
        c.lng,
        `"${c.statusKoordinat || getCoordinateStatusLabel(c)}"`,
        `"${c.metodeKoordinat || ''}"`,
        `"${c.sumber || ''}"`,
        `"${c.statusVerifikasi || ''}"`,
        c.skorVerifikasi ?? ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hasil_filter_cctv_transjawa_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${exportedData.length} titik hasil filter berhasil diekspor ke CSV.`, 'success');
}

// Export CCTV Data to JSON file
function exportDataToJSON() {
    if (!requireAdminExportAccess('Unduh JSON')) return;
    const exportedData = AppState.filteredList;
    if (!exportedData.length) {
        showToast('Tidak ada data pada filter saat ini untuk diekspor.', 'error');
        return;
    }
    const dataStr = JSON.stringify(exportedData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hasil_filter_cctv_transjawa_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${exportedData.length} titik hasil filter berhasil diekspor ke JSON.`, 'success');
}

function printAdminReport() {
    if (!requireAdminExportAccess('Cetak laporan')) return;
    window.print();
}

// ==========================================================================
// 8. ADMIN LOGIN, LOGOUT & PASSWORD (FASE 4)
// ==========================================================================
function initAuthUI() {
    const isAdmin = AdminAuth.isLoggedIn();
    const guestBox = document.getElementById('adminLoginGuestBox');
    const authBox = document.getElementById('adminLoggedInBox');
    const adminTabBtn = document.getElementById('navTabAdmin');

    if (isAdmin) {
        const user = AdminAuth.getUser();
        if (guestBox) guestBox.style.display = 'none';
        if (authBox) authBox.style.display = 'flex';
        if (adminTabBtn) adminTabBtn.style.display = 'flex';
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    } else {
        if (guestBox) guestBox.style.display = 'flex';
        if (authBox) authBox.style.display = 'none';
        if (adminTabBtn) adminTabBtn.style.display = 'none';
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');

    const result = await AdminAuth.login(usernameInput.value, passwordInput.value);
    if (result.success) {
        closeModal('loginModal');
        initAuthUI();
        renderDataTable();
        showToast('Berhasil masuk sebagai Administrator!', 'success');
    } else {
        showToast(result.message, 'error');
    }
}

function handleLogout() {
    AdminAuth.logout();
    initAuthUI();
    renderDataTable();
    switchTab('map-view');
    showToast('Anda telah keluar dari sesi Admin.', 'info');
}

function fillDemoCredentials() {
    document.getElementById('loginUsername').value = 'admin';
    document.getElementById('loginPassword').value = 'admin123';
    showToast('Kredensial demo terisi (admin / admin123)', 'info');
}

async function handleChangePasswordSubmit(e) {
    e.preventDefault();
    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
        showToast('Konfirmasi kata sandi baru tidak cocok!', 'error');
        return;
    }

    const result = await AdminAuth.changePassword(oldPass, newPass);
    if (result.success) {
        closeModal('changePasswordModal');
        showToast(result.message, 'success');
    } else {
        showToast(result.message, 'error');
    }
}

// ==========================================================================
// 9. KELOLA DATA CCTV / CRUD (FASE 4)
// ==========================================================================
let editingCctvId = null;
let deletingCctvId = null;

function openAddModal() {
    editingCctvId = null;
    document.getElementById('cctvFormModalTitle').textContent = 'Tambah Titik CCTV Baru';
    document.getElementById('cctvForm').reset();
    
    // Auto-generate code
    const randNum = Math.floor(Math.random() * 800) + 100;
    document.getElementById('formCode').value = `CCTV-TOL-KM${randNum}`;
    document.getElementById('formLat').value = '-6.950000';
    document.getElementById('formLng').value = '109.850000';
    
    openModal('cctvFormModal');
}

function openEditModal(cctvId) {
    const cctv = AppState.cctvList.find(c => c.id === cctvId);
    if (!cctv) return;

    editingCctvId = cctvId;
    document.getElementById('cctvFormModalTitle').textContent = `Ubah Titik: ${cctv.id}`;
    
    document.getElementById('formCode').value = cctv.id;
    document.getElementById('formNama').value = cctv.nama;
    document.getElementById('formRuas').value = cctv.ruasId;
    document.getElementById('formKm').value = cctv.km;
    document.getElementById('formArah').value = cctv.arah;
    document.getElementById('formPosisi').value = cctv.posisi;
    document.getElementById('formLat').value = cctv.lat;
    document.getElementById('formLng').value = cctv.lng;
    document.getElementById('formStatus').value = cctv.status;
    document.getElementById('formKondisi').value = cctv.kondisiLaluLintas;
    document.getElementById('formKeterangan').value = cctv.keterangan || '';

    openModal('cctvFormModal');
}

async function handleCctvFormSubmit(e) {
    e.preventDefault();

    const formCode = document.getElementById('formCode').value.trim();
    const formNama = document.getElementById('formNama').value.trim();
    const formRuas = document.getElementById('formRuas').value;
    const formKm = document.getElementById('formKm').value.trim();
    const formArah = document.getElementById('formArah').value;
    const formPosisi = document.getElementById('formPosisi').value;
    const formLat = parseFloat(document.getElementById('formLat').value);
    const formLng = parseFloat(document.getElementById('formLng').value);
    const formStatus = document.getElementById('formStatus').value;
    const formKondisi = document.getElementById('formKondisi').value;
    const formKeterangan = document.getElementById('formKeterangan').value.trim();

    if (!formCode || !formNama || isNaN(formLat) || isNaN(formLng)) {
        showToast('Mohon lengkapi seluruh kolom formulir!', 'error');
        return;
    }

    const matchedRuas = RUAS_TOL_LIST.find(r => r.id === formRuas) || RUAS_TOL_LIST[1];
    const kmNumeric = parseFloat(formKm.replace(/[^0-9.]/g, '')) || 0;

    const cctvObject = {
        id: formCode,
        nama: formNama,
        ruasId: formRuas,
        ruasNama: matchedRuas.name,
        km: formKm,
        kmNum: kmNumeric,
        arah: formArah,
        posisi: formPosisi,
        lat: formLat,
        lng: formLng,
        status: formStatus,
        statusKoordinat: formStatus === 'online' ? 'ESTIMATED_HIGH' : formStatus === 'gangguan' ? 'ESTIMATED_MEDIUM' : 'REVIEW',
        statusKoordinatLabel: formStatus === 'online' ? 'Akurasi tinggi' : formStatus === 'gangguan' ? 'Akurasi sedang' : 'Perlu verifikasi',
        metodeKoordinat: 'MANUAL_ADMIN_ENTRY',
        metodeKoordinatLabel: 'Entri manual administrator',
        sumber: 'Entri admin',
        statusVerifikasi: 'MANUAL_ENTRY',
        skorVerifikasi: null,
        kondisiLaluLintas: formKondisi,
        kecepatanRataRata: '80 km/jam',
        resolusi: '1080p Full HD (30 FPS)',
        terakhirUpdate: 'Baru saja',
        keterangan: formKeterangan,
        videoType: 'toll_main'
    };

    try {
        if (editingCctvId) {
            if (CCTVApi.available) await CCTVApi.update(editingCctvId, cctvObject);
            else CCTVStore.update(editingCctvId, cctvObject);
            showToast(`Data CCTV [${formCode}] berhasil diperbarui!`, 'success');
        } else {
            if (AppState.cctvList.some(c => c.id === formCode)) {
                showToast('Kode ID Kamera sudah digunakan! Silakan gunakan kode unik.', 'error');
                return;
            }
            if (CCTVApi.available) await CCTVApi.create(cctvObject);
            else CCTVStore.add(cctvObject);
            showToast(`Titik CCTV [${formCode}] berhasil ditambahkan!`, 'success');
        }
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }

    closeModal('cctvFormModal');
    await loadCctvData();
}

function openDeleteConfirmModal(cctvId) {
    const cctv = AppState.cctvList.find(c => c.id === cctvId);
    if (!cctv) return;

    deletingCctvId = cctvId;
    document.getElementById('deleteTargetName').textContent = `${cctv.nama} (${cctv.id})`;
    openModal('deleteConfirmModal');
}

async function executeDeleteCctv() {
    if (!deletingCctvId) return;

    try {
        if (CCTVApi.available) await CCTVApi.delete(deletingCctvId);
        else CCTVStore.delete(deletingCctvId);
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }
    closeModal('deleteConfirmModal');
    showToast(`Titik CCTV [${deletingCctvId}] berhasil dihapus.`, 'info');
    deletingCctvId = null;
    await loadCctvData();
}

async function restoreDefaultDataset() {
    if (confirm('Apakah Anda yakin ingin mengembalikan dataset ke data awal default Trans Jawa?')) {
        if (CCTVApi.available) await CCTVApi.reset();
        else CCTVStore.resetToDefault();
        await loadCctvData();
        showToast('Dataset CCTV berhasil dikembalikan ke default!', 'success');
    }
}

async function handleCsvImport(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
        if (!CCTVApi.available) throw new Error('Import CSV memerlukan REST API aktif. Jalankan server Node.js.');
        const result = await CCTVApi.importCsv(file);
        await loadCctvData();
        showToast(`${result.total} baris diproses: ${result.created} baru, ${result.updated} diperbarui.`, 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        input.value = '';
    }
}

// Coordinate Picker on Map Trigger
function startCoordinatePicker() {
    closeModal('cctvFormModal');
    AppState.isPickingCoordinates = true;
    switchTab('map-view');
    document.getElementById('map').style.cursor = 'crosshair';
    showToast('Klik lokasi di peta untuk menentukan koordinat kamera!', 'info');
}

// ==========================================================================
// 10. TAB NAVIGATION & MODAL CONTROLS
// ==========================================================================
function switchTab(tabId) {
    AppState.activeTab = tabId;

    // Update Tab Buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update Tab Views
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.toggle('active', view.id === tabId);
    });

    // Resize Leaflet Map when switching back
    if (tabId === 'map-view' && AppState.map) {
        setTimeout(() => {
            AppState.map.invalidateSize();
        }, 150);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// ==========================================================================
// 11. EVENT LISTENERS
// ==========================================================================
function initEventListeners() {
    // Nav Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Search Input
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value;
            if (searchClearBtn) searchClearBtn.style.display = e.target.value ? 'block' : 'none';
            applyFilters();
        });
    }
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            AppState.searchQuery = '';
            searchClearBtn.style.display = 'none';
            applyFilters();
        });
    }

    // Ruas Tol Select Dropdown
    const filterRuasSelect = document.getElementById('filterRuasSelect');
    if (filterRuasSelect) {
        // Populate options from RUAS_TOL_LIST
        filterRuasSelect.innerHTML = RUAS_TOL_LIST.map(r => `
            <option value="${r.id}">${r.name} (${r.kmRange})</option>
        `).join('');

        filterRuasSelect.addEventListener('change', (e) => {
            AppState.selectedRuas = e.target.value;
            applyFilters();
        });
    }

    // Status Filter Pills
    document.querySelectorAll('.filter-pill[data-filter-type="status"]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-filter-type="status"]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            AppState.selectedStatus = pill.dataset.filterVal;
            applyFilters();
        });
    });

    // Arah Filter Pills
    document.querySelectorAll('.filter-pill[data-filter-type="arah"]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-filter-type="arah"]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            AppState.selectedArah = pill.dataset.filterVal;
            applyFilters();
        });
    });

    // Populate Ruas Tol inside Add/Edit Form
    const formRuas = document.getElementById('formRuas');
    if (formRuas) {
        formRuas.innerHTML = RUAS_TOL_LIST.filter(r => r.id !== 'all').map(r => `
            <option value="${r.id}">${r.name}</option>
        `).join('');
    }

    // Sidebar Collapse / Expand Toggle
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    const btnOpenSidebarFloat = document.getElementById('btnOpenSidebarFloat');
    const mapSidebar = document.getElementById('mapSidebar');

    if (btnToggleSidebar && mapSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            mapSidebar.classList.add('collapsed');
            mapSidebar.classList.remove('open');
            btnToggleSidebar.setAttribute('aria-expanded', 'false');
            if (btnOpenSidebarFloat) btnOpenSidebarFloat.style.display = 'flex';
            setTimeout(() => AppState.map?.invalidateSize(), 320);
        });
    }
    if (btnOpenSidebarFloat && mapSidebar) {
        btnOpenSidebarFloat.addEventListener('click', () => {
            mapSidebar.classList.remove('collapsed');
            mapSidebar.classList.add('open');
            btnToggleSidebar?.setAttribute('aria-expanded', 'true');
            btnOpenSidebarFloat.style.display = 'none';
            setTimeout(() => AppState.map?.invalidateSize(), 320);
        });
    }

    // Geolocation / GPS Locator (shared with the real-time location panel)
    const btnGps = document.getElementById('btnMapGps');
    if (btnGps) {
        btnGps.addEventListener('click', () => {
            if (AppState.userLocation) {
                AppState.map.flyTo([AppState.userLocation.lat, AppState.userLocation.lng], 14);
                showToast('Peta dipusatkan ke posisi real-time Anda.', 'success');
            } else {
                startRealtimeLocation(true);
            }
        });
    }

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btnMapFullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });
    }

    // Close Modals on clicking outside dialog
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                if (modal.id === 'cctvDetailModal') {
                    closeDetailModal();
                }
            }
        });
    });
}

// ==========================================================================
// 12. TOAST NOTIFICATION UTILITY
// ==========================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Escape HTML for XSS prevention
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
