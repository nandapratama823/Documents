from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
    Flowable,
)
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "Panduan_Presentasi_Web_CCTV_Trans_Jawa.pdf"

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#0B2447")
BLUE = colors.HexColor("#2563EB")
SKY = colors.HexColor("#0EA5E9")
GREEN = colors.HexColor("#16A34A")
ORANGE = colors.HexColor("#D97706")
RED = colors.HexColor("#DC2626")
SLATE = colors.HexColor("#334155")
MUTED = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#F1F5F9")
BORDER = colors.HexColor("#DCE5F0")


def register_fonts():
    candidates = [
        ("C:/Windows/Fonts/arial.ttf", "Arial"),
        ("C:/Windows/Fonts/arialbd.ttf", "Arial-Bold"),
        ("C:/Windows/Fonts/consola.ttf", "Consolas"),
    ]
    for path, name in candidates:
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))


register_fonts()
BODY_FONT = "Arial" if "Arial" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
BOLD_FONT = "Arial-Bold" if "Arial-Bold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"
MONO_FONT = "Consolas" if "Consolas" in pdfmetrics.getRegisteredFontNames() else "Courier"


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="DocTitle", fontName=BOLD_FONT, fontSize=26, leading=32,
    textColor=colors.white, alignment=TA_LEFT, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="DocSubtitle", fontName=BODY_FONT, fontSize=12, leading=18,
    textColor=colors.HexColor("#D6E8FF"), alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="Section", fontName=BOLD_FONT, fontSize=17, leading=22,
    textColor=NAVY, spaceBefore=10, spaceAfter=9, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="Subsection", fontName=BOLD_FONT, fontSize=12.5, leading=17,
    textColor=BLUE, spaceBefore=8, spaceAfter=5, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="BodyID", fontName=BODY_FONT, fontSize=9.4, leading=14,
    textColor=SLATE, alignment=TA_LEFT, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="Small", fontName=BODY_FONT, fontSize=8, leading=11.5,
    textColor=MUTED, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="BulletID", fontName=BODY_FONT, fontSize=9.2, leading=13.5,
    textColor=SLATE, leftIndent=12, firstLineIndent=-8, spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="Callout", fontName=BODY_FONT, fontSize=9.2, leading=14,
    textColor=NAVY, leftIndent=9, rightIndent=9, spaceBefore=4, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="CodeBlock", fontName=MONO_FONT, fontSize=7.8, leading=11,
    textColor=colors.HexColor("#DCEBFF"), leftIndent=8, rightIndent=8,
))
styles.add(ParagraphStyle(
    name="Question", fontName=BOLD_FONT, fontSize=9.4, leading=13,
    textColor=NAVY, spaceAfter=3, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="Answer", fontName=BODY_FONT, fontSize=8.8, leading=13,
    textColor=SLATE, leftIndent=10, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="TableHead", fontName=BOLD_FONT, fontSize=7.8, leading=10,
    textColor=colors.white,
))
styles.add(ParagraphStyle(
    name="TableCell", fontName=BODY_FONT, fontSize=7.5, leading=10,
    textColor=SLATE,
))


def P(text, style="BodyID"):
    return Paragraph(text, styles[style])


def bullets(items):
    return [P(f"- {item}", "BulletID") for item in items]


def callout(text, color=BLUE, bg=colors.HexColor("#EFF6FF")):
    table = Table([[P(text, "Callout")]], colWidths=[16.3 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.7, color),
        ("LINEBEFORE", (0, 0), (0, -1), 4, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def data_table(headers, rows, widths, font_size=7.5):
    data = [[P(str(h), "TableHead") for h in headers]]
    for row in rows:
        data.append([P(str(v), "TableCell") for v in row])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.45, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    return table


class ArchitectureDiagram(Flowable):
    def __init__(self, width=16.3 * cm, height=6.0 * cm):
        super().__init__()
        self.width = width
        self.height = height

    def draw_box(self, c, x, y, w, h, title, lines, color):
        c.setFillColor(colors.white)
        c.setStrokeColor(color)
        c.setLineWidth(1.2)
        c.roundRect(x, y, w, h, 7, fill=1, stroke=1)
        c.setFillColor(color)
        c.roundRect(x, y + h - 20, w, 20, 7, fill=1, stroke=0)
        c.rect(x, y + h - 20, w, 7, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(BOLD_FONT, 8.5)
        c.drawCentredString(x + w / 2, y + h - 14, title)
        c.setFillColor(SLATE)
        c.setFont(BODY_FONT, 7.3)
        yy = y + h - 34
        for line in lines:
            c.drawCentredString(x + w / 2, yy, line)
            yy -= 11

    def draw_arrow(self, c, x1, y1, x2, y2):
        c.setStrokeColor(colors.HexColor("#94A3B8"))
        c.setFillColor(colors.HexColor("#94A3B8"))
        c.setLineWidth(1.2)
        c.line(x1, y1, x2, y2)
        c.line(x2, y2, x2 - 5, y2 + 3)
        c.line(x2, y2, x2 - 5, y2 - 3)

    def draw(self):
        c = self.canv
        w = 4.6 * cm
        h = 3.4 * cm
        gap = 1.25 * cm
        y = 1.3 * cm
        x1 = 0
        x2 = x1 + w + gap
        x3 = x2 + w + gap
        self.draw_box(c, x1, y, w, h, "FRONTEND", ["HTML + CSS + JavaScript", "Leaflet + Chart.js", "Fetch REST API"], BLUE)
        self.draw_box(c, x2, y, w, h, "BACKEND", ["Node.js + Express", "Auth + CRUD + Import", "Validation layer"], SKY)
        self.draw_box(c, x3, y, w, h, "STORAGE", ["JSON file (local)", "PostgreSQL/PostGIS", "CSV + GeoJSON source"], GREEN)
        self.draw_arrow(c, x1 + w + 5, y + h / 2, x2 - 5, y + h / 2)
        self.draw_arrow(c, x2 + w + 5, y + h / 2, x3 - 5, y + h / 2)
        c.setFillColor(MUTED)
        c.setFont(BODY_FONT, 7)
        c.drawCentredString(self.width / 2, 0.55 * cm, "Pengguna -> antarmuka -> REST API -> repository -> penyimpanan")


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#123B73"))
    canvas.circle(PAGE_W - 25 * mm, PAGE_H - 25 * mm, 48 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#0D5C91"))
    canvas.circle(PAGE_W - 7 * mm, 15 * mm, 62 * mm, fill=1, stroke=0)
    canvas.setFillColor(SKY)
    canvas.rect(18 * mm, PAGE_H - 24 * mm, 16 * mm, 3 * mm, fill=1, stroke=0)
    canvas.restoreState()


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.6)
    canvas.line(22 * mm, PAGE_H - 16 * mm, PAGE_W - 22 * mm, PAGE_H - 16 * mm)
    canvas.setFont(BOLD_FONT, 7.5)
    canvas.setFillColor(NAVY)
    canvas.drawString(22 * mm, PAGE_H - 12 * mm, "PANDUAN PRESENTASI - WEB GIS CCTV TRANS JAWA")
    canvas.setFont(BODY_FONT, 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_W - 22 * mm, 12 * mm, f"Halaman {doc.page}")
    canvas.line(22 * mm, 17 * mm, PAGE_W - 22 * mm, 17 * mm)
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT), pagesize=A4,
    leftMargin=22 * mm, rightMargin=22 * mm,
    topMargin=22 * mm, bottomMargin=22 * mm,
    title="Panduan Presentasi Web GIS CCTV Trans Jawa",
    author="Proyek CCTV Trans Jawa",
    subject="Arsitektur, API, database, dan persiapan tanya jawab dosen",
)

cover_frame = Frame(18 * mm, 20 * mm, PAGE_W - 36 * mm, PAGE_H - 40 * mm, id="cover")
body_frame = Frame(22 * mm, 21 * mm, PAGE_W - 44 * mm, PAGE_H - 40 * mm, id="body")
doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[cover_frame], onPage=draw_cover),
    PageTemplate(id="Body", frames=[body_frame], onPage=draw_page),
])

story = []

# Cover
story += [
    Spacer(1, 38 * mm),
    P("PANDUAN PENJELASAN<br/>WEB GIS CCTV TRANS JAWA", "DocTitle"),
    Spacer(1, 4 * mm),
    P("Arsitektur sistem, REST API, database PostGIS, alur data, keamanan, keterbatasan, dan persiapan pertanyaan dosen", "DocSubtitle"),
    Spacer(1, 18 * mm),
]

cover_stats = Table([
    [P("307", "DocTitle"), P("17", "DocTitle"), P("3 LAPIS", "DocTitle")],
    [P("Titik CCTV", "DocSubtitle"), P("Ruas tol", "DocSubtitle"), P("Frontend - API - Storage", "DocSubtitle")],
], colWidths=[4.6 * cm, 4.6 * cm, 6.0 * cm])
cover_stats.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.Color(1, 1, 1, alpha=0.08)),
    ("BOX", (0, 0), (-1, -1), 0.7, colors.Color(1, 1, 1, alpha=0.24)),
    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.Color(1, 1, 1, alpha=0.16)),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("TOPPADDING", (0, 0), (-1, 0), 12),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
    ("TOPPADDING", (0, 1), (-1, 1), 3),
    ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
]))
story.append(cover_stats)
story += [
    Spacer(1, 34 * mm),
    P("Dokumen belajar untuk presentasi dan sidang proyek", "DocSubtitle"),
    Spacer(1, 4 * mm),
    P("Versi 1.0 | Disusun dari implementasi aktual proyek", "DocSubtitle"),
    PageBreak(),
]

# Overview
story += [
    P("1. Gambaran Umum Proyek", "Section"),
    P("Web ini adalah dashboard Web GIS untuk memetakan dan mengelola 307 titik CCTV pada 17 ruas Tol Trans Jawa. Sistem menggabungkan visualisasi lokasi, pencarian, filter, statistik, tabel data, autentikasi admin, operasi CRUD, impor CSV, serta penyimpanan geospasial."),
    callout("Kalimat presentasi: Sistem yang saya buat adalah dashboard Web GIS CCTV Trans Jawa yang mengintegrasikan data koordinat, visualisasi Leaflet, REST API Express, serta PostgreSQL/PostGIS untuk membantu pemetaan, pencarian, analisis, dan pengelolaan titik CCTV."),
    P("Tujuan utama", "Subsection"),
    *bullets([
        "Mengubah data CCTV berbentuk tabel menjadi informasi lokasi yang mudah dipahami.",
        "Mempermudah pencarian titik berdasarkan nama, kode, KM, ruas, dan status akurasi.",
        "Memberikan ringkasan statistik persebaran CCTV.",
        "Menyediakan panel admin untuk pengelolaan data tanpa mengedit source code.",
    ]),
    P("Fitur utama", "Subsection"),
]

feature_rows = [
    ["Peta interaktif", "307 marker, popup, sorot titik, zoom, GPS, dan beberapa basemap."],
    ["Filter", "Nama, kode ID, KM, ruas tol, arah, dan tingkat akurasi lokasi."],
    ["Statistik", "Kartu KPI, grafik jumlah CCTV per ruas, dan grafik status akurasi."],
    ["Tabel", "Sorting, pagination, ekspor CSV/JSON, dan tombol menuju peta."],
    ["Admin", "Login, tambah, ubah, hapus, impor CSV, reset dataset, dan ubah password."],
    ["Fallback", "Tetap dapat menampilkan cache localStorage saat REST API tidak tersedia."],
]
story.append(data_table(["Modul", "Kemampuan"], feature_rows, [4.0 * cm, 12.3 * cm]))
story.append(PageBreak())

# Architecture
story += [
    P("2. Arsitektur Sistem", "Section"),
    P("Sistem memakai arsitektur tiga lapis. Frontend menangani antarmuka, backend menangani aturan bisnis dan API, sedangkan repository menangani penyimpanan."),
    Spacer(1, 4 * mm),
    ArchitectureDiagram(),
    Spacer(1, 4 * mm),
    P("Alur ketika halaman dibuka", "Subsection"),
    *bullets([
        "Browser menjalankan event DOMContentLoaded.",
        "Frontend memanggil GET /api/health untuk memastikan API tersedia.",
        "Frontend mengambil seluruh data melalui GET /api/cctv.",
        "Jika API gagal, frontend membaca dataset dari localStorage.",
        "Leaflet membuat marker, kemudian data yang sama dipakai oleh sidebar, grafik, dan tabel.",
        "Setiap perubahan filter memicu render ulang marker, daftar, statistik, dan tabel.",
    ]),
    P("Mengapa arsitektur ini baik?", "Subsection"),
    *bullets([
        "Frontend tidak mengakses database secara langsung.",
        "Backend menjadi satu pintu validasi dan autentikasi.",
        "Jenis penyimpanan dapat diganti tanpa mengubah endpoint API.",
        "Pengujian dapat memakai repository dalam memori tanpa PostgreSQL.",
    ]),
]

story.append(PageBreak())

# Technology + structure
story += [
    P("3. Teknologi dan Struktur Proyek", "Section"),
]
tech_rows = [
    ["Frontend", "HTML5, CSS3, Vanilla JavaScript", "Struktur, desain responsif, dan logika browser"],
    ["Peta", "Leaflet 1.9.4", "Marker, popup, layer, zoom, dan basemap"],
    ["Grafik", "Chart.js", "Grafik batang dan doughnut"],
    ["Backend", "Node.js + Express.js", "REST API dan static file server"],
    ["Database", "PostgreSQL + PostGIS", "Data relasional dan geospasial"],
    ["Import", "Multer + csv-parse", "Upload dan parsing CSV"],
    ["Security", "Helmet, CORS, token HMAC", "Header keamanan dan autentikasi"],
    ["Deployment", "Docker, Compose, Render", "Packaging aplikasi dan database"],
    ["Testing", "Node Test Runner", "Pengujian endpoint API"],
]
story.append(data_table(["Bagian", "Teknologi", "Fungsi"], tech_rows, [3.2 * cm, 5.2 * cm, 7.9 * cm]))
story += [
    Spacer(1, 6 * mm),
    P("Struktur folder penting", "Subsection"),
]

folder_text = """tpwb/<br/>
|-- index.html ............... Struktur halaman<br/>
|-- css/style.css ............ Desain dan responsive UI<br/>
|-- js/app.js ................ Peta, grafik, filter, tabel, CRUD<br/>
|-- js/data.js ............... API client, auth, localStorage<br/>
|-- server/app.mjs ........... REST API Express<br/>
|-- server/repository.mjs .... JSON dan PostgreSQL repository<br/>
|-- server/records.mjs ....... Normalisasi dan validasi<br/>
|-- database/schema.sql ...... Struktur PostGIS<br/>
|-- data/cctv.csv ............ 307 titik CCTV<br/>
|-- data/ruas_tol.geojson .... 17 geometri ruas<br/>
|-- tests/api.test.mjs ....... Pengujian API"""
code_box = Table([[P(folder_text, "CodeBlock")]], colWidths=[16.3 * cm])
code_box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
    ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#1E3A5F")),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story.append(code_box)
story.append(PageBreak())

# Frontend
story += [
    P("4. Cara Kerja Frontend", "Section"),
    P("Frontend dibuat tanpa framework. State utama disimpan dalam objek AppState yang mencatat daftar CCTV, hasil filter, item terpilih, halaman tabel, instance peta, layer marker, basemap, dan status modal detail."),
    P("Komponen utama", "Subsection"),
    *bullets([
        "initMap() membuat Leaflet map dan mendaftarkan basemap.",
        "renderMapMarkers() menggambar marker berdasarkan latitude dan longitude.",
        "applyFilters() menyaring data dan menyegarkan seluruh tampilan.",
        "renderStatsAndCharts() menghitung KPI dan membuat grafik Chart.js.",
        "renderDataTable() melakukan sorting, pagination 10 item, dan membentuk tabel.",
        "CCTVApi menangani komunikasi fetch ke backend.",
        "CCTVStore menyimpan cache dan fallback di localStorage.",
    ]),
    P("Peta dan basemap", "Subsection"),
    P("Leaflet menyediakan basemap Google Road, Google Hybrid, OpenStreetMap, ESRI Satellite, dan ESRI Dark Canvas. Setiap CCTV ditampilkan sebagai marker khusus yang warnanya menunjukkan akurasi lokasi, bukan kondisi kamera."),
    callout("Hal penting: marker hijau tidak berarti CCTV online. Hijau berarti koordinat memiliki tingkat kepercayaan atau akurasi lokasi yang lebih tinggi.", GREEN, colors.HexColor("#F0FDF4")),
    P("Mode fallback", "Subsection"),
    P("Jika REST API tidak dapat dihubungi, data cache dari localStorage tetap ditampilkan. Perubahan dalam mode lokal hanya berada di browser dan tidak otomatis disinkronkan kembali ke server."),
    P("Detail CCTV", "Subsection"),
    P("Modal detail menggunakan Canvas untuk membuat simulasi tampilan kamera. Ini berguna untuk demonstrasi UI, tetapi bukan stream CCTV resmi dan tidak boleh disebut sebagai video real-time."),
]

story.append(PageBreak())

# Data quality
story += [
    P("5. Dataset dan Akurasi Koordinat", "Section"),
    P("Dataset berasal dari workbook Excel pada sheet Audit_Detail. Script Python berbasis Pandas memeriksa kolom wajib, ID duplikat, dan koordinat kosong, kemudian menghasilkan JavaScript, CSV, dan GeoJSON."),
]

status_rows = [
    ["Akurasi tinggi", "224", "Referensi posisi relatif kuat"],
    ["Akurasi sedang", "31", "Memerlukan validasi tambahan"],
    ["Perlu verifikasi", "52", "Potensi anomali atau referensi terbatas"],
]
story.append(data_table(["Status", "Jumlah", "Makna"], status_rows, [5.0 * cm, 2.2 * cm, 9.1 * cm]))
story += [Spacer(1, 6 * mm)]
method_rows = [
    ["KM_AXIS_INTERPOLATION", "250", "Posisi dihitung di antara referensi KM pada sumbu jalan"],
    ["OSM_LANDMARK_NAME_MATCH", "30", "Pencocokan nama lokasi dengan landmark OpenStreetMap"],
    ["KM_AXIS_EXACT", "16", "Referensi KM dapat diposisikan secara langsung"],
    ["KM_AXIS_EXTRAPOLATION", "10", "Posisi diperkirakan di luar rentang referensi KM"],
    ["NAME_OVERRIDE_KM_ANOMALY", "1", "Nama lokasi digunakan untuk memperbaiki anomali KM"],
]
story.append(data_table(["Metode", "Jumlah", "Penjelasan"], method_rows, [5.1 * cm, 2.0 * cm, 9.2 * cm]))
story += [
    Spacer(1, 6 * mm),
    callout("Batasan data: koordinat merupakan estimasi geospasial berdasarkan metadata sumber, posisi KM, dan referensi OpenStreetMap. Data bukan hasil survei GPS resmi BPJT.", ORANGE, colors.HexColor("#FFFBEB")),
    P("GeoJSON ruas", "Subsection"),
    P("Garis ruas dibentuk dengan mengurutkan titik CCTV berdasarkan nilai KM. Karena itu, geometri tersebut adalah representasi analitis dari urutan titik dan bukan geometri resmi badan jalan."),
]

story.append(PageBreak())

# API
story += [
    P("6. REST API", "Section"),
    P("REST API menjadi penghubung antara browser dan repository. Endpoint baca bersifat publik, sedangkan endpoint yang mengubah data memerlukan Bearer token admin."),
]

api_rows = [
    ["GET", "/api/health", "Status API, jenis storage, jumlah record", "Publik"],
    ["GET", "/api/cctv", "Daftar CCTV dan filter q, ruas, status", "Publik"],
    ["GET", "/api/cctv/:id", "Detail satu titik CCTV", "Publik"],
    ["GET", "/api/ruas", "Daftar ruas dan jumlah CCTV", "Publik"],
    ["GET", "/api/stats", "Total, status, dan jumlah ruas", "Publik"],
    ["POST", "/api/auth/login", "Login dan membuat token", "Publik"],
    ["POST", "/api/auth/change-password", "Mengubah password sesi server", "Admin"],
    ["POST", "/api/cctv", "Menambah CCTV", "Admin"],
    ["PUT", "/api/cctv/:id", "Memperbarui CCTV", "Admin"],
    ["DELETE", "/api/cctv/:id", "Menghapus CCTV", "Admin"],
    ["POST", "/api/cctv/import", "Impor CSV dengan upsert", "Admin"],
    ["POST", "/api/cctv/reset", "Memulihkan dataset sumber", "Admin"],
]
story.append(data_table(["Method", "Endpoint", "Fungsi", "Akses"], api_rows, [1.8 * cm, 4.8 * cm, 7.6 * cm, 2.1 * cm]))
story += [
    Spacer(1, 5 * mm),
    P("Validasi backend", "Subsection"),
    *bullets([
        "ID, nama titik, dan ruas tol wajib diisi.",
        "Latitude harus berada pada rentang -90 sampai 90.",
        "Longitude harus berada pada rentang -180 sampai 180.",
        "ID duplikat menghasilkan HTTP 409 Conflict.",
        "Impor dibatasi 5 MB dan maksimum 5.000 baris.",
        "Endpoint yang dilindungi mengembalikan HTTP 401 tanpa token valid.",
    ]),
    P("Upsert", "Subsection"),
    P("Saat impor CSV, record dengan ID yang sudah ada akan diperbarui, sedangkan ID baru akan ditambahkan. Pendekatan ini disebut upsert."),
]

story.append(PageBreak())

# Repository and DB
story += [
    P("7. Repository dan Database PostGIS", "Section"),
    P("Backend menggunakan repository pattern agar logika API tidak terikat pada satu penyimpanan."),
]
repo_rows = [
    ["MemoryRepository", "Pengujian otomatis", "Data hanya hidup selama proses test"],
    ["FileRepository", "Pengembangan lokal", "Perubahan ditulis ke cctv.runtime.json"],
    ["PostgresRepository", "Database persisten", "PostgreSQL dan PostGIS"],
]
story.append(data_table(["Repository", "Penggunaan", "Karakteristik"], repo_rows, [4.2 * cm, 4.2 * cm, 7.9 * cm]))
story += [
    Spacer(1, 6 * mm),
    P("Pemilihan penyimpanan", "Subsection"),
    callout("Jika DATABASE_URL tersedia -> PostgreSQL/PostGIS. Jika tidak tersedia -> JSON file lokal."),
    P("Tabel ruas_tol", "Subsection"),
    P("Menyimpan ID, nama ruas, jumlah CCTV, geometri ruas, dan timestamp."),
    P("Tabel cctv", "Subsection"),
    P("Menyimpan identitas CCTV, ruas, KM, latitude, longitude, metode koordinat, status akurasi, sumber, skor verifikasi, geometri titik, dan timestamp."),
    P("Geometri dan SRID", "Subsection"),
    P("Kolom geom bertipe geometry(Point, 4326) dan dibuat otomatis dari longitude serta latitude. SRID 4326 adalah sistem koordinat WGS 84 yang umum digunakan GPS dan peta web."),
    P("Indeks", "Subsection"),
    *bullets([
        "GiST pada geometri CCTV dan geometri ruas.",
        "Indeks pada ruas_id, coordinate_status, dan km_num.",
        "Indeks mempercepat pencarian dan menjadi dasar query spasial di masa depan.",
    ]),
    callout("Catatan teknis: PostGIS sudah dipakai untuk penyimpanan geometri dan indeks, tetapi API saat ini belum menjalankan fungsi analisis spasial seperti ST_DWithin atau ST_Distance.", ORANGE, colors.HexColor("#FFFBEB")),
]

story.append(PageBreak())

# Auth security
story += [
    P("8. Autentikasi dan Keamanan", "Section"),
    P("Login memeriksa username dan password dari environment variable. Jika benar, server membuat token dengan tanda tangan HMAC SHA-256 dan masa berlaku delapan jam."),
    P("Alur autentikasi", "Subsection"),
    *bullets([
        "Admin mengirim username dan password ke /api/auth/login.",
        "Server membuat payload berisi username dan waktu kedaluwarsa.",
        "Payload ditandatangani menggunakan AUTH_SECRET.",
        "Browser menyimpan token di localStorage.",
        "Request CRUD mengirim Authorization: Bearer token.",
        "Middleware requireAdmin memverifikasi tanda tangan dan masa berlaku token.",
    ]),
    P("Keamanan yang sudah ada", "Subsection"),
    *bullets([
        "Helmet untuk beberapa header keamanan.",
        "Express JSON body dibatasi 1 MB.",
        "Upload CSV dibatasi ukuran dan jumlah baris.",
        "Perbandingan signature memakai timingSafeEqual.",
        "Parameter database memakai placeholder sehingga mengurangi SQL injection.",
    ]),
    P("Hal yang perlu diperkuat untuk produksi", "Subsection"),
    *bullets([
        "Hash password dengan bcrypt atau Argon2, bukan perbandingan plaintext.",
        "Gunakan cookie HttpOnly atau strategi token yang lebih aman daripada localStorage.",
        "Batasi CORS hanya ke domain frontend.",
        "Aktifkan Content Security Policy yang sesuai.",
        "Gunakan HTTPS, rate limiting, audit log, dan rotasi secret.",
        "Password yang diubah sekarang hanya bertahan selama sesi server.",
    ]),
]

story.append(PageBreak())

# Testing and limitations
story += [
    P("9. Pengujian, Deployment, dan Skalabilitas", "Section"),
    P("Test suite memakai MemoryRepository sehingga endpoint dapat diuji tanpa database eksternal."),
]
test_rows = [
    ["Health dan read API", "Health check, pencarian, filter, statistik, dan jumlah ruas"],
    ["Auth dan CRUD", "Menolak request tanpa token, kemudian menguji create, update, delete"],
    ["Impor CSV", "Mengonfirmasi satu data diperbarui dan satu data baru dibuat"],
]
story.append(data_table(["Skenario", "Yang diperiksa"], test_rows, [4.8 * cm, 11.5 * cm]))
story += [
    Spacer(1, 6 * mm),
    P("Yang belum tercakup", "Subsection"),
    *bullets([
        "Pengujian UI end-to-end secara otomatis.",
        "Integrasi langsung dengan PostgreSQL/PostGIS dalam test suite.",
        "Pengujian query spasial dan beban besar.",
        "Pengujian keamanan mendalam dan rate limiting.",
    ]),
    P("Deployment", "Subsection"),
    P("Proyek menyediakan Dockerfile, Docker Compose, dan konfigurasi Render. Docker Compose menyiapkan container web dan database PostGIS 16."),
    callout("Catatan sebelum deployment: server saat ini bind ke 127.0.0.1. Agar dapat diakses dari luar container, bind sebaiknya diubah menjadi 0.0.0.0.", RED, colors.HexColor("#FEF2F2")),
    P("Skalabilitas", "Subsection"),
    P("Untuk 307 record, mengambil seluruh data lalu melakukan filter dan pagination di browser masih ringan. Untuk data besar, filter, sorting, dan pagination sebaiknya dijalankan di database menggunakan parameter page dan limit."),
]

story.append(PageBreak())

# Honest limitations
story += [
    P("10. Kelebihan, Keterbatasan, dan Pengembangan", "Section"),
    P("Kelebihan", "Subsection"),
    *bullets([
        "Antarmuka peta, statistik, dan tabel berada dalam satu dashboard.",
        "Arsitektur frontend, API, dan repository cukup terpisah.",
        "Aplikasi tetap bisa didemonstrasikan tanpa PostgreSQL.",
        "Database sudah siap untuk data geospasial dan indeks GiST.",
        "Terdapat validasi input, autentikasi, impor CSV, Docker, dan test API.",
    ]),
    P("Keterbatasan yang harus dijelaskan secara jujur", "Subsection"),
    *bullets([
        "Koordinat merupakan estimasi dan bukan survei resmi BPJT.",
        "Detail video merupakan simulasi Canvas, bukan stream CCTV asli.",
        "Data kondisi lalu lintas real-time belum tersedia.",
        "Filter PostgreSQL masih dilakukan setelah SELECT seluruh data.",
        "Endpoint belum menyediakan server-side pagination.",
        "Query spasial PostGIS belum diimplementasikan.",
        "Autentikasi masih cocok untuk demonstrasi, belum untuk produksi penuh.",
    ]),
    P("Pengembangan berikutnya", "Subsection"),
    *bullets([
        "Integrasi stream CCTV resmi menggunakan HLS atau WebRTC.",
        "Server-side pagination, filtering, dan full-text search.",
        "Query radius CCTV terdekat menggunakan ST_DWithin.",
        "Role-based access control dan audit log.",
        "Password hashing, cookie HttpOnly, HTTPS, dan rate limiting.",
        "Validasi lapangan dan pembaruan koordinat resmi.",
        "Monitoring kesehatan kamera dan notifikasi gangguan.",
    ]),
]

story.append(PageBreak())

# Q&A Part 1
story += [P("11. Pertanyaan Dosen dan Jawaban", "Section")]

qa = [
    ("1. Apa masalah yang ingin diselesaikan?", "Data CCTV sulit dipahami jika hanya berbentuk tabel. Sistem ini mengubahnya menjadi peta interaktif agar lokasi, ruas, KM, dan akurasi koordinat lebih mudah dianalisis."),
    ("2. Mengapa menggunakan Web GIS?", "Karena data memiliki komponen lokasi. Web GIS membantu pengguna melihat pola persebaran dan hubungan posisi antar-CCTV secara visual."),
    ("3. Mengapa menggunakan Leaflet?", "Leaflet ringan, open source, mudah dipakai dengan JavaScript, dan mendukung marker, popup, layer, serta berbagai penyedia basemap."),
    ("4. Mengapa tidak menggunakan React?", "Cakupan aplikasi masih dapat dikelola dengan Vanilla JavaScript. Pilihan ini mengurangi kompleksitas build dan membuat aplikasi lebih ringan. Jika skala komponen membesar, framework dapat dipertimbangkan."),
    ("5. Mengapa menggunakan REST API?", "REST API memisahkan frontend dari penyimpanan, menyediakan kontrak pertukaran JSON, serta menjadi satu titik untuk autentikasi dan validasi."),
    ("6. Mengapa menggunakan PostGIS?", "PostGIS menambahkan tipe dan fungsi geospasial pada PostgreSQL sehingga data titik, garis, jarak, radius, dan indeks spasial dapat dikelola dengan baik."),
    ("7. Apakah aplikasi sudah benar-benar menggunakan PostGIS?", "PostGIS sudah digunakan untuk kolom geometri dan indeks GiST. Namun, fungsi analisis spasial seperti ST_DWithin belum digunakan oleh endpoint saat ini."),
    ("8. Apa arti SRID 4326?", "SRID 4326 adalah sistem koordinat WGS 84 yang digunakan GPS dan banyak peta web. Pada PostGIS, titik dibuat dengan urutan longitude kemudian latitude."),
    ("9. Apakah marker hijau berarti CCTV online?", "Tidak. Warna menunjukkan akurasi lokasi. Hijau berarti koordinat lebih dipercaya, bukan kondisi operasional kamera."),
    ("10. Apakah data dan videonya real-time?", "Lokasi dan metadata bukan data real-time. Jam UI berjalan real-time, tetapi detail video adalah simulasi Canvas dan belum terhubung ke stream resmi."),
]
for q, a in qa:
    story.append(P(q, "Question"))
    story.append(P(a, "Answer"))

story.append(PageBreak())

qa2 = [
    ("11. Mengapa menggunakan repository pattern?", "Supaya API tidak bergantung pada satu penyimpanan. Repository memory, JSON, dan PostgreSQL menyediakan operasi yang serupa sehingga lebih mudah diuji dan dikembangkan."),
    ("12. Mengapa ada JSON dan localStorage fallback?", "Agar aplikasi mudah dijalankan dan tetap dapat didemonstrasikan ketika PostgreSQL atau API tidak tersedia. Namun, perubahan lokal tidak otomatis tersinkronisasi ke server."),
    ("13. Bagaimana keamanan endpoint CRUD?", "Endpoint dilindungi middleware yang memverifikasi Bearer token dengan tanda tangan HMAC dan waktu kedaluwarsa delapan jam."),
    ("14. Bagaimana mencegah data koordinat yang salah?", "Backend memvalidasi rentang latitude dan longitude. Generator juga menolak koordinat kosong dan ID duplikat. Ketepatan posisi tetap memerlukan sumber yang baik atau survei lapangan."),
    ("15. Bagaimana sistem menangani ID duplikat?", "Create biasa menolak ID yang sudah digunakan dengan HTTP 409. Pada impor CSV digunakan upsert agar record lama diperbarui dan record baru ditambahkan."),
    ("16. Mengapa pagination dilakukan di frontend?", "Jumlah data hanya 307 sehingga masih ringan. Jika jumlah data besar, pagination dan filtering harus dipindahkan ke API dan database."),
    ("17. Apa fungsi indeks GiST?", "GiST membantu PostgreSQL mencari objek geospasial dengan lebih efisien, misalnya pencarian titik dalam radius atau geometri yang beririsan."),
    ("18. Bagaimana jika API mati?", "Frontend mencoba membaca cache localStorage sehingga peta tetap dapat ditampilkan dalam mode lokal."),
    ("19. Bagaimana aplikasi diuji?", "Test suite menjalankan server pada port sementara dengan MemoryRepository, kemudian menguji health, list, filter, statistik, proteksi CRUD, login, dan impor CSV."),
    ("20. Apa pengembangan paling penting berikutnya?", "Integrasi stream resmi, query spasial PostGIS, server-side pagination, password hashing, audit log, dan validasi koordinat lapangan."),
]
for q, a in qa2:
    story.append(P(q, "Question"))
    story.append(P(a, "Answer"))

story.append(PageBreak())

# Presentation script
story += [
    P("12. Naskah Presentasi Singkat", "Section"),
    callout("Proyek ini adalah dashboard Web GIS yang menampilkan 307 titik CCTV pada 17 ruas Tol Trans Jawa. Frontend dibuat menggunakan HTML, CSS, JavaScript, Leaflet, dan Chart.js. Frontend mengambil data melalui REST API Express. Backend menggunakan repository pattern sehingga dapat berjalan dengan JSON file untuk pengembangan lokal atau PostgreSQL/PostGIS untuk penyimpanan persisten. Admin dapat melakukan CRUD dan impor CSV melalui endpoint yang dilindungi token. PostGIS menyimpan lokasi sebagai geometri Point dengan SRID 4326 dan indeks GiST. Perlu ditekankan bahwa koordinat pada sistem merupakan estimasi geospasial dan detail video masih berupa simulasi, bukan CCTV real-time."),
    P("Urutan demo yang disarankan", "Subsection"),
    *bullets([
        "Buka halaman peta dan jelaskan 307 marker serta arti warna akurasi.",
        "Gunakan pencarian dan filter ruas untuk menunjukkan interaktivitas.",
        "Buka satu marker dan tampilkan detail koordinat serta metode pemetaan.",
        "Masuk ke halaman statistik untuk menunjukkan distribusi data.",
        "Buka tabel dan jelaskan pagination serta ekspor.",
        "Login admin dan tunjukkan form tambah atau edit tanpa perlu menyimpan data demo.",
        "Tutup dengan menjelaskan arsitektur API, PostGIS, dan batasan sistem.",
    ]),
    P("Istilah yang perlu dikuasai", "Subsection"),
]

terms = [
    ["Web GIS", "Sistem informasi geografis yang digunakan melalui browser."],
    ["REST API", "Antarmuka HTTP untuk pertukaran dan pengelolaan data."],
    ["CRUD", "Create, Read, Update, Delete."],
    ["PostGIS", "Ekstensi PostgreSQL untuk data dan operasi spasial."],
    ["SRID 4326", "Referensi koordinat WGS 84."],
    ["GiST", "Jenis indeks yang umum dipakai untuk geometri."],
    ["Upsert", "Update jika data ada, insert jika belum ada."],
    ["HMAC", "Tanda tangan berbasis secret untuk menjamin integritas token."],
    ["Fallback", "Mekanisme cadangan saat layanan utama gagal."],
]
story.append(data_table(["Istilah", "Penjelasan"], terms, [4.2 * cm, 12.1 * cm]))
story += [
    Spacer(1, 7 * mm),
    callout("Tips menjawab: bedakan dengan jelas antara fitur yang sudah diimplementasikan, fitur simulasi, dan rencana pengembangan. Jawaban yang jujur dan teknis biasanya lebih kuat daripada mengklaim sistem sudah production-ready.", GREEN, colors.HexColor("#F0FDF4")),
    Spacer(1, 8 * mm),
    P("Checklist sebelum bertemu dosen", "Subsection"),
    *bullets([
        "Pastikan server dapat dibuka di http://127.0.0.1:8765.",
        "Siapkan kredensial demo admin jika memang diizinkan untuk presentasi.",
        "Hindari menyebut simulasi sebagai stream CCTV asli.",
        "Siapkan penjelasan mengenai sumber dan keterbatasan koordinat.",
        "Ingat angka utama: 307 CCTV, 17 ruas, 224 tinggi, 31 sedang, 52 perlu verifikasi.",
    ]),
]

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.build(story)
print(OUTPUT)
