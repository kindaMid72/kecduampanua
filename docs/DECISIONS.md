# Log Keputusan Proyek (ADR Ringkas)

Dokumen ini adalah sumber kebenaran untuk **kenapa** sebuah keputusan diambil. Kalau ada yang tampak "aneh" atau "kurang optimal" di kode/skema, cek di sini dulu sebelum mengubahnya — kemungkinan besar itu keputusan sadar, bukan kelalaian. Tambahkan entri baru (jangan edit/hapus entri lama) kalau ada keputusan besar berubah, dengan mereferensikan nomor entri yang digantikan.

---

**#1 — Stack teknis**
Konteks: butuh stack yang bisa dikelola developer solo, konsisten dengan proyek lain.
Keputusan: Next.js (App Router, TS) + Supabase (DB/Auth/Storage) + Tailwind, deploy Vercel.
Alasan: familiar bagi developer, ekosistem matang, biaya rendah untuk skala kecamatan.

**#2 — Hosting vs domain go.id**
Konteks: domain resmi go.id sudah pasti via Diskominfo.
Keputusan: rencanakan Vercel + DNS pointing, **TAPI ini belum final**.
Alasan: beberapa Diskominfo mewajibkan hosting di PDN (Pusat Data Nasional). **Wajib dikonfirmasi sebelum deployment produksi** — lihat ARCHITECTURE.md §7.

**#3 — Strategi konten belum lengkap**
Konteks: sebagian data (statistik, foto, teks profil) belum tersedia saat development dimulai.
Keputusan: rilis bertahap — Fase 1 tampilkan yang sudah pasti + placeholder sopan untuk yang belum; Fase 2 diisi progresif oleh staf lewat admin panel.
Alasan: menghindari nunggu 100% data lengkap sebelum bisa live.

**#4 — Role: Super Account vs Staf (bukan Admin/Editor generik)**
Konteks: yang mengelola konten adalah staf awam teknis; perlu kontrol ketat siapa yang bisa mengelola akses user.
Keputusan: 2 role — `super_account` (satu-satunya yang bisa undang/cabut akses user) dan `staf` (kelola semua konten, **tanpa** akses menu kelola pengguna).
Alasan: permintaan eksplisit klien — pemisahan tanggung jawab akses vs tanggung jawab konten.

**#5 — Tidak ada approval layer untuk publish konten**
Konteks: awalnya diasumsikan ada alur draft → review Admin → publish.
Keputusan **(mengoreksi asumsi awal)**: Staf dan Super Account sama-sama bisa langsung menerbitkan konten sendiri, tanpa approval berjenjang.
Alasan: dikonfirmasi eksplisit oleh klien — menyederhanakan alur kerja harian.

**#6 — Alur invite & reset password: link manual, bukan auto-email**
Konteks: staf kantor kecamatan lebih reliable dihubungi via WA daripada email.
Keputusan: Super Account men-generate link lewat UI admin yang memanggil API `supabaseAdmin.auth.admin.generateLink` (type `invite` atau `recovery`). Link tersebut langsung ditampilkan di layar (di-return via `action_link`) untuk disalin oleh admin dan dikirim manual ke staf. Sama sekali tidak ada email otomatis dari Supabase (bahkan proses email dilewati).
Alasan: permintaan eksplisit klien; juga menghindari risiko email transaksional masuk spam/tidak terpantau. Pengguna juga tidak perlu mengkonfirmasi email.

**#7 — Konten "Berita" diganti "Informasi Publik"**
Konteks: klien tidak butuh berita jurnalistik, cukup info kegiatan/jadwal/pengumuman.
Keputusan: satu modul `informasi_publik` dengan kategori tetap: `pengumuman`, `kegiatan`, `jadwal_rapat`. Field `tanggal_acara` & `lokasi` ditambahkan (khusus kegiatan/rapat).
Alasan: field kategori dibuat enum (bukan bebas) karena dipakai sebagai filter publik yang butuh label konsisten.

**#8 — Modul baru: Edaran Dokumen, tanpa alur draft/publish**
Konteks: kebutuhan repositori dokumen resmi (SK, surat edaran) yang bisa diunduh publik.
Keputusan: begitu diunggah langsung tayang (tidak ada status draft). Field `deskripsi` **wajib diisi** — halaman detail menampilkan deskripsi dulu sebelum tombol unduh. Kategori dokumen **bebas diisi staf** (bukan enum).
Alasan: dokumen resmi dianggap final saat diunggah oleh staf yang berwenang; kategori bebas karena variasi jenis dokumen terlalu beragam untuk di-enum-kan di awal.

**#9 — Potensi Wilayah + Pariwisata + Potensi Pengolahan digabung**
Konteks: 3 kebutuhan konten mirip secara struktur (tempat/entitas + deskripsi + foto).
Keputusan: satu tabel `potensi_daerah` dengan kolom `kategori` (`ekonomi`/`wisata`/`pengolahan`), satu menu admin "Kelola Potensi Daerah", halaman publik pakai tab filter.
Alasan: mengurangi jumlah menu admin yang harus dipelajari staf awam teknis.

**#10 — Bilingual EN/ID: auto-translate server-side, bukan input manual, bukan widget client-side**
Konteks: klien ingin versi Inggris tanpa staf perlu menerjemahkan manual; sempat dipertimbangkan Google Translate Website Widget.
Keputusan: pakai Google Cloud Translation API di server, hasil disimpan sebagai teks asli di kolom `_en` (bukan overlay client-side), fallback ke Indonesia kalau `_en` kosong/API gagal. Field syarat/alur di modul Layanan diberi badge "perlu ditinjau" (tidak blocking). Admin panel tetap Indonesia-only. Dokumen Edaran **tidak** diterjemahkan (dokumen legal).
Alasan: widget client-side gratis untuk situs pemerintah, TAPI tidak menghasilkan URL/halaman yang ter-index terpisah oleh Google (buruk untuk SEO `/en/...` yang sudah direncanakan) dan kualitas tidak terkontrol. Cloud Translation API menghasilkan teks asli yang SEO-friendly, dan gratis untuk volume konten sebesar ini (500rb karakter/bulan gratis).

**#11 — Jumlah ASN di halaman Profil, bukan Data Statistik**
Alasan: ini fakta organisasi kantor, bukan data populasi wilayah — dikelompokkan sesuai konteksnya.

**#12 — Retensi data Pengaduan mengikuti UU PDP**
Konteks: form Pengaduan menyimpan data pribadi (nama, kontak).
Keputusan (default, bisa disesuaikan): checkbox persetujuan di form + retensi 2 tahun sejak status "Selesai" sebelum diarsipkan.
Alasan: kepatuhan dasar UU PDP No. 27/2022; belum ada arahan spesifik dari kecamatan/Diskominfo, jadi ini asumsi default yang wajib dikonfirmasi kalau ada ketentuan lain.

**#13 — Fitur Cek Status Pengaduan (nomor tracking)**
Keputusan: warga dapat nomor tracking (`PGD-XXXXXXXX`) setelah submit, bisa cek status di halaman terpisah. RLS: publik hanya boleh SELECT dengan `nomor_tracking` exact match, tidak bisa listing semua data.

**#14 — Anti-spam Pengaduan: honeypot + rate limit**
Keputusan: bukan Cloudflare Turnstile — pakai honeypot field + rate limit per IP via Vercel Edge Middleware.
Alasan: dipilih klien untuk menghindari dependency eksternal, cukup untuk skala trafik kecamatan.

**#15 — PPID: implementasi minimal**
Keputusan: halaman statis `/ppid` (dasar hukum UU KIP 14/2008, kontak & jam layanan petugas PPID), **tanpa** form permohonan informasi digital.
Alasan: dipilih klien sebagai versi minimal yang tetap memenuhi kewajiban dasar UU KIP; bisa ditingkatkan di fase mendatang kalau dibutuhkan.

**#16 — SP4N-LAPOR!: banner/link saja, tanpa integrasi API**
Keputusan: komponen statis di halaman Pengaduan & Kontak, link keluar ke lapor.go.id.
Alasan: memenuhi visibilitas kanal pengaduan nasional tanpa kompleksitas integrasi backend.

**#17 — Standar Pelayanan & Maklumat Pelayanan masuk modul Layanan**
Keputusan: label "Layanan" dibingkai ulang jadi "Standar Pelayanan" (istilah resmi), Maklumat Pelayanan tampil sebagai pengantar di atas daftar layanan. Field `dokumen_standar_pelayanan_url` (opsional) ditambahkan ke tabel `layanan`.

**#18 — Navbar dikelompokkan jadi 5 item top-level**
Keputusan: `Beranda | Profil ▾ | Informasi ▾ | Layanan Publik ▾ | Kontak` — 10 modul tetap terjangkau maksimal 2 klik.
Alasan: 10 modul flat di navbar terlalu penuh, terutama di mobile; divalidasi lewat riset benchmark situs kecamatan lain yang navbar-nya berantakan tanpa pengelompokan.

**#19 — Struktur dokumentasi untuk agentic coding**
Keputusan: `AGENTS.md` root dijaga pendek (~100-150 baris, hanya hal non-obvious & wajib), detail arsitektur/produk/keputusan dipisah ke `docs/` dan dimuat on-demand, bukan diinlinekan ke AGENTS.md.
Alasan: riset menunjukkan file konteks yang terlalu panjang/detail justru menurunkan performa agent dan menaikkan biaya — agent mengikuti instruksi berlebihan secara harfiah tanpa memperbaiki hasil.

**#20 — Design system: tokens.json sebagai source of truth, DESIGN.md sebagai rationale**
Keputusan: nilai desain (warna, tipografi, spacing) hidup di `design/tokens.json` (machine-readable, di-generate ke Tailwind config), rationale & aturan pakai di `docs/DESIGN.md` (prosa), enforcement lewat komponen di `/components/ui`. Skill `taste-design` yang sudah ada **tidak dipakai langsung** untuk proyek ini karena dikalibrasi untuk estetika SaaS premium (banned Inter, wajib micro-interaction perpetual) yang bertentangan dengan kebutuhan kredibilitas formal & performa low-bandwidth situs ini.

**#21 — Koreksi: CLAUDE.md pakai `@AGENTS.md` (import), bukan prosa "baca dulu"**
Konteks: audit ulang terhadap dokumentasi resmi Anthropic menemukan Claude Code tidak membaca AGENTS.md secara native — hanya CLAUDE.md yang otomatis dimuat tiap sesi.
Keputusan: baris pertama `CLAUDE.md` adalah `@AGENTS.md` (sintaks import resmi), menggantikan instruksi prosa "baca AGENTS.md dulu" yang tidak menjamin file itu benar-benar termuat.
Alasan: import dijamin otomatis ke-load; instruksi prosa cuma anjuran yang mungkin diikuti, mungkin tidak.

**#22 — Tambahan: subagent `rls-reviewer` + section Verifikasi**
Konteks: dokumentasi resmi Anthropic menekankan "beri Claude cara memverifikasi hasil kerjanya sendiri" sebagai praktik nomor satu, dan membedakan hooks (deterministic) dari instruksi CLAUDE.md (advisory) — dua hal yang belum ada di setup awal kita.
Keputusan: tambah subagent `.claude/agents/rls-reviewer.md` untuk review keamanan RLS/auth dengan context terpisah, dan section "Verifikasi" eksplisit di AGENTS.md/CLAUDE.md.
Alasan: skill (`rls-review`) sifatnya pengetahuan pasif yang Claude ikuti sendiri; subagent memberi "opini kedua" dari context bersih — pola yang direkomendasikan resmi untuk area berisiko tinggi seperti keamanan data warga.

**#23 — Testing strategy: Vitest + Playwright (keputusan baru, sebelumnya belum pernah dibahas)**
Konteks: audit mendalam nemuin project ini gak pernah punya keputusan testing sama sekali di seluruh diskusi sebelumnya — gap nyata mengingat "loop verifikasi" adalah praktik yang paling ditekankan untuk kerja agentic coding.
Keputusan: Vitest untuk unit/component test, Playwright untuk E2E — termasuk pengujian wajib untuk viewport 360px, alur RLS (panggil sebagai user belum login), dan validasi form Pengaduan.
Alasan: Vitest terintegrasi baik dengan Next.js/TypeScript, cepat untuk unit test komponen `/components/ui`. Playwright dipilih atas Cypress karena mendukung emulasi viewport mobile dan pengujian multi-browser yang relevan untuk audiens warga dengan berbagai perangkat.

**#24 — Koreksi struktur: AGENTS.md vs CLAUDE.md pembagian ulang**
Konteks: audit ulang terhadap tabel Include/Exclude resmi Anthropic menemukan AGENTS.md versi sebelumnya kehilangan beberapa kategori wajib (testing instructions, code style, repository etiquette) yang sempat ada di draft awal tapi terpotong saat proses "trim". Env vars juga salah taruh di CLAUDE.md padahal dibutuhkan tool apa pun, bukan cuma Claude Code.
Keputusan: AGENTS.md dikembalikan mencakup command, testing, konvensi kode, git etiquette, dan env vars — karena file ini diniatkan portable lintas-tool (DECISIONS #19). CLAUDE.md dipangkas jadi cuma `@AGENTS.md` import + hal yang benar-benar spesifik fitur Claude Code (subagent invocation).
Alasan: standar resmi Anthropic memberi tes fungsional ("would removing this cause mistakes?") bukan target jumlah baris — trim sebelumnya salah menerapkan target angka dari sumber sekunder, bukan tes fungsional dari sumber primer.

**#25 — Perombakan alur invite & reset password: One-Time Setup Token independen**
Konteks: implementasi awal yang menggunakan OTP `supabase.auth.verifyOtp` di `useEffect` client memiliki kelemahan kritis: token langsung hangus saat link dibuka pertama kali (akibat crawler preview WA/Telegram atau React StrictMode double render), dan pengguna disuntik sesi login sebelum kata sandi dibuat.
Keputusan (memperbaiki #6): alur undangan dan reset kata sandi menggunakan tabel token khusus `user_invitations`. Tautan berisi token 256-bit acak. Saat halaman `/admin/atur-kata-sandi` dibuka, sistem hanya memverifikasi token secara *read-only* tanpa menghanguskannya dan tanpa membuat sesi login. Token hanya hangus dan akun/password hanya dibuat/diperbarui di Supabase Auth saat pengguna selesai men-submit kata sandi barunya, kemudian dialihkan ke `/admin/login`.
Alasan: menjamin keandalan tautan saat dibagikan via aplikasi chat, mencegah crawler membakar token, dan menjaga konsistensi autentikasi yang bersih.

**#26 — Perombakan strategi bilingual: dari auto-translate ke dual-field hibrida**
Konteks: implementasi awal memakai Google Cloud Translate API (`GOOGLE_TRANSLATE_API_KEY`) yang dipanggil di background saat staf menyimpan konten. Ini memunculkan tiga masalah nyata: (a) API berbayar — proyek kecamatan dengan anggaran terbatas berisiko terkena tagihan tak terduga, (b) endpoint `http://localhost:3000/api/translate` dipanggil dari server action, tidak andal di environment produksi/serverless, (c) staf tidak tahu apakah terjemahan berhasil atau tidak karena prosesnya tersembunyi.
Keputusan: hapus semua blok `if (GOOGLE_TRANSLATE_API_KEY)` dari tiga modul (Informasi Publik, Standar Pelayanan, Profil Kecamatan). Ganti dengan **dual-field opsional**: form admin menyediakan field `_en` yang opsional — staf mengisi jika diperlukan, kosongkan untuk fallback otomatis. Di halaman publik `/en/`, pola `data.judul_en || data.judul` tidak berubah. Kolom `_en` di database tetap ada dan backward-compatible. Tambah migrasi `007_bilingual_hybrid_note.sql` yang mendokumentasikan perubahan ini dan menghapus kolom `alur_perlu_ditinjau` yang tidak relevan lagi. Route `/api/translate` tetap dipertahankan untuk kemungkinan keperluan masa depan tetapi tidak lagi dipanggil oleh modul-modul di atas.
Alasan: pendekatan baru 100% bebas biaya, tidak ada dependency API pihak ketiga, tidak ada risiko gagal saat billing terlambat, dan staf dapat melihat & mengedit konten EN secara langsung. Data EN yang tersimpan di DB lebih SEO-friendly daripada terjemahan mesin yang tidak terlihat.


**#27 — Ganti modul Galeri dengan modul Berita**
Konteks: modul Galeri (tabel `galeri_album` & `galeri_foto`) direncanakan di Fase 2 tapi konsepnya tidak pernah matang. Tabel sudah dibuat di migrasi awal tapi tidak pernah ada data produksi.
Keputusan: hapus tabel `galeri_album` dan `galeri_foto`, ganti dengan modul **Berita** — tabel tunggal `berita` untuk artikel editorial dan liputan kegiatan kecamatan. Kategori `berita` bersifat bebas (teks, bukan enum) karena topik berita lebih beragam daripada `informasi_publik`. Gambar cover wajib diisi. Modul Informasi Publik tetap ada dan tidak diubah.
Alasan: Galeri foto-only dinilai kurang memberikan nilai dibanding artikel berita yang bisa menampung konten lebih kaya. Migrasi `008_replace_galeri_with_berita.sql` menangani drop tabel lama dan buat tabel baru.
