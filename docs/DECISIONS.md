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
Keputusan: hapus semua blok `if (GOOGLE_TRANSLATE_API_KEY)` dari tiga modul (Informasi Publik, Standar Pelayanan, Profil Kecamatan). Ganti dengan **dual-field opsional**: form admin menyediakan field `_en` yang opsional — staf mengisi jika diperlukan, kosongkan untuk fallback otomatis. Di halaman publik `/en/`, pola `data.judul_en || data.judul` tidak berubah. Kolom `_en` di database tetap ada dan backward-compatible. Tambah migrasi `007b_bilingual_hybrid_note.sql` yang mendokumentasikan perubahan ini dan menghapus kolom `alur_perlu_ditinjau` yang tidak relevan lagi. Route `/api/translate` tetap dipertahankan untuk kemungkinan keperluan masa depan tetapi tidak lagi dipanggil oleh modul-modul di atas.
Alasan: pendekatan baru 100% bebas biaya, tidak ada dependency API pihak ketiga, tidak ada risiko gagal saat billing terlambat, dan staf dapat melihat & mengedit konten EN secara langsung. Data EN yang tersimpan di DB lebih SEO-friendly daripada terjemahan mesin yang tidak terlihat.


**#27 — Ganti modul Galeri dengan modul Berita**
Konteks: modul Galeri (tabel `galeri_album` & `galeri_foto`) direncanakan di Fase 2 tapi konsepnya tidak pernah matang. Tabel sudah dibuat di migrasi awal tapi tidak pernah ada data produksi.
Keputusan: hapus tabel `galeri_album` dan `galeri_foto`, ganti dengan modul **Berita** — tabel tunggal `berita` untuk artikel editorial dan liputan kegiatan kecamatan. Kategori `berita` bersifat bebas (teks, bukan enum) karena topik berita lebih beragam daripada `informasi_publik`. Gambar cover wajib diisi. Modul Informasi Publik tetap ada dan tidak diubah.
Alasan: Galeri foto-only dinilai kurang memberikan nilai dibanding artikel berita yang bisa menampung konten lebih kaya. Migrasi `008_replace_galeri_with_berita.sql` menangani drop tabel lama dan buat tabel baru.

**#28 — Self-hosted VPS; repo infra terpisah dari repo web**
Konteks: rencana hosting berubah dari Vercel ke VPS lokal dengan web dan Supabase di mesin yang sama. Reverse proxy melayani **dua** domain (web dan API Supabase), dan menyentuh secret Supabase.
Keputusan: repo ini hanya berisi `Dockerfile` + `docker-compose.yml` untuk container web. Nginx, override stack Supabase, backup, dan firewall di repo `duampanua-infra`. Satu edge saja yang memegang port 80/443 (overlay nginx bawaan Supabase tidak dipakai bersamaan). Server Next.js memakai `SUPABASE_INTERNAL_URL` (jaringan Docker), browser memakai URL publik; cookie sesi diberi nama tetap agar keduanya saling baca.
Alasan: siklus perubahan berbeda, akses ke infra harus lebih sempit dari akses ke kode, dan satu pintu masuk memudahkan hardening. **Status: rencana — belum final sampai hosting Diskominfo dikonfirmasi (#2).**

**#29 — Cek status pengaduan lewat Server Action + RPC, bukan query dari browser (menggantikan sebagian #13 dan #14)**
Konteks: halaman publik sebelumnya melakukan `.from("pengaduan").select()` langsung dari browser. RLS memang memblokir SELECT untuk `anon`, jadi fitur selalu menjawab "tidak ditemukan" — bug diam-diam sekaligus melanggar Aturan Wajib #10. Pengecekan keunikan nomor di `submitPengaduanAction` (SELECT sebagai anon) punya masalah yang sama: tidak pernah menemukan apa pun. Catatan: format nomor yang berlaku adalah **`PND-XXXXXXXX`** (8 hex), bukan `PGD-` seperti tertulis di #13; rate limit memakai RPC `check_rate_limit`, bukan Vercel Edge Middleware seperti di #14.
Keputusan: (a) cek status = Server Action `cekStatusPengaduanAction` → RPC `get_pengaduan_by_tracking` (exact match), dengan validasi format dan rate limit 20/10 menit per IP (key `cek:<ip>`, terpisah dari submit 3/10 menit); (b) keunikan nomor dijamin constraint UNIQUE, insert diulang bila error `23505` (maks 5x); (c) komponen client TIDAK boleh membaca tabel `pengaduan` atau memanggil RPC apa pun.
Alasan: browser memegang anon key, jadi apa pun yang bisa dilakukan kode client bisa dilakukan siapa saja; sisi server memberi tempat untuk rate limit dan validasi. Ditutup bersama pemblokiran `/rest/v1/rpc/` di edge (#30). Lihat `__tests__/pengaduan-actions.test.ts`. **Diperbarui oleh #34:** RPC dipanggil dengan service role (bukan anon), insert juga lewat service role, nomor baru 12 hex.

**#30 — Dua URL Supabase, cookie sesi bernama tetap, RPC diblok di edge**
Konteks: web dan Supabase satu VPS. Browser harus lewat domain publik; server Next.js bisa lewat jaringan Docker.
Keputusan: browser memakai `NEXT_PUBLIC_SUPABASE_URL` (HTTPS publik); server (SSR, middleware, server action, admin client) memakai `SUPABASE_INTERNAL_URL` (mis. `http://kong:8000`) bila diisi, via `lib/supabase/config.ts`. Cookie sesi diberi nama tetap `sb-duampanua-auth` di ketiga client. Edge hanya meneruskan `/auth/v1/`, `/rest/v1/`, `/storage/v1/`; `/rest/v1/rpc/` dan `/auth/v1/admin/` diblok.
Alasan: tanpa nama cookie tetap, `@supabase/ssr` menurunkan nama dari hostname URL, sehingga browser (`api.domain`) dan server (`kong`) memakai nama berbeda dan sesi tidak pernah terbaca (terbukti di uji: hanya cookie bernama tetap yang dibaca middleware). Mengubah nama ini memaksa semua admin login ulang.
Konsekuensi: **`SUPABASE_INTERNAL_URL` wajib terisi di produksi** selama RPC diblok di edge; kalau kosong, cek status pengaduan dan rate limit rusak (server memanggil RPC lewat edge yang memblokirnya). Karena itu tidak boleh dikosongkan tanpa membuka blokir.

**#31 — Container web: build arg, bukan runtime env, untuk `NEXT_PUBLIC_*`; filesystem tidak read-only**
Keputusan: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` diberikan sebagai `build.args` (di-inline Next.js saat `npm run build`); mengubahnya = build ulang image. Secret (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_TRANSLATE_API_KEY`, `REVALIDATE_SECRET`) hanya runtime. `.env` dikeluarkan dari build context (`.dockerignore`). Image Node 22 (Node 20 sudah deprecated untuk `supabase-js`), `HOSTNAME=0.0.0.0`, healthcheck `/api/health` (sengaja tidak menyentuh Supabase). Hardening: user non-root, `cap_drop: ALL`, `no-new-privileges`, batas memori 1 GB / 1,5 CPU, rotasi log.
Alasan `read_only` TIDAK dipakai: Next.js menulis hasil ISR (`revalidatePath`) ke `.next/server` saat runtime; root FS terkunci berisiko menghilangkan halaman yang baru dipublikasikan staf setelah restart. Pernah dicoba, lalu dicabut.
`/api/revalidate` memakai `REVALIDATE_SECRET` (bukan service role key, yang bypass RLS dan tidak boleh dikirim lewat jaringan). `NEXT_PUBLIC_SITE_URL` dipakai pengecekan Origin logout (CSRF) dan URL redirect logout; salah isi = logout 403.

**#32 — Migrasi 013 `production_hardening`: isi, hasil uji, status**
Isi: `check_rate_limit` hanya untuk `service_role`; `search_path` dikunci pada 4 function `SECURITY DEFINER`; grant eksplisit `get_pengaduan_by_tracking`; bucket `uploads` dibatasi 20 MB dan whitelist tipe (tanpa SVG); policy tulis Storage pindah dari `auth.role()='authenticated'` ke `is_staf_aktif()`.
Hasil uji di Postgres Supabase sungguhan (`supabase/postgres:17.6.1.136`, 001–013, role `anon`/`authenticated`/`service_role`): sebelum 013 `anon` memanggil `check_rate_limit('1.2.3.4')` tiga kali dan IP itu terkunci; sesudahnya `permission denied`. Storage: staf aktif boleh upload, staf nonaktif dan akun tanpa profil ditolak (policy lama mengizinkan semua yang login).
**Status: ditulis dan diuji, BELUM diterapkan ke database mana pun.** Jalankan sebagai pemilik function dalam transaksi (`begin; … commit;`), lalu verifikasi dengan `has_function_privilege`. Revisi yang dibutuhkan ada di #33.

**#33 — Temuan audit RLS (Oktober 2026). Status: DITUTUP di kode oleh #34, tapi migrasi belum diterapkan di database mana pun**
Sumber: review `rls-reviewer` + uji langsung di Postgres, Oktober 2026. Urut tingkat keparahan:
1. **KRITIS — eskalasi hak lewat `profiles`.** Policy `004` mengizinkan user mengubah barisnya sendiri tanpa batasan kolom. Terbukti: staf aktif mengubah `role` menjadi `super_account`; staf nonaktif mengubah `status` menjadi `aktif`. Pengetatan `is_staf_aktif()` bisa dilewati. Rencana: batasi kolom yang boleh diubah user (mis. hanya `password_set`), dan ban user di GoTrue saat dinonaktifkan.
2. **TINGGI — INSERT `anon` ke `pengaduan` tanpa batasan kolom.** Terbukti: anon menyimpan baris dengan `status='selesai'`, `catatan_tindak_lanjut` buatan sendiri, dan `diarsipkan_pada` terisi; juga bisa mengecek keberadaan nomor lewat error `23505`. Melewati rate limit/honeypot/zod. Rencana: cabut INSERT anon, insert dari server (service role) setelah validasi.
3. **SEDANG-TINGGI — rate limit cek status bisa dilewati** karena `anon` punya EXECUTE pada `get_pengaduan_by_tracking` (013 memberinya eksplisit) dan ruang nomor hanya 32 bit. Rencana: cabut dari anon, panggil dari server dengan service role; pertimbangkan nomor lebih panjang (perlu keputusan format; `TRACKING_FORMAT` harus menerima nomor lama).
4. **SEDANG — rate limit fail-open** bila RPC gagal / service key kosong / IP `unknown`; fallback `x-forwarded-for` dikendalikan klien bila `x-real-ip` hilang; IPv6 per alamat penuh. Rencana: cek status fail-closed, normalisasi IPv6 ke /64, bedakan galat RPC dari "tidak ditemukan".
5. **SEDANG — whitelist MIME 013 menolak upload sah** bila `file.type` kosong (`.docx` tertentu) atau `.mov`; pesan galat Storage tampil mentah dalam bahasa Inggris. Rencana: bungkus ulang file dengan MIME dari ekstensi; petakan galat ke bahasa Indonesia.
6. **RENDAH — SELECT bucket `uploads` terbuka untuk anon** (bisa list isi bucket). Rencana: batasi ke staf aktif; URL publik tidak butuh policy ini. Set juga `DISABLE_SIGNUP=true` di GoTrue.
Penutupannya dicatat di #34. Catatan: entri ini dipertahankan apa adanya sebagai riwayat — kondisi skema yang sebenarnya ada di `DATABASE_SCHEMA.md` §15.

**#34 — Penutupan temuan #33: migrasi 014 + revisi 013 + perubahan server**
Disetujui user ("langsung edit"). Diuji pada Postgres Supabase sungguhan (`supabase/postgres:17.6.1.136`, 001–014 dari awal; probe sebagai `anon`, staf aktif, staf nonaktif, `super_account`, `service_role`) dan 64 unit test.
- **#33.1 eskalasi hak:** trigger `protect_profile_privileged_columns` (014) menolak perubahan `role`/`status`/`id` kecuali oleh `postgres`/`supabase_admin`/`service_role` atau Pengelola aktif. Dipilih trigger, bukan `revoke update (kolom)`, supaya policy 004 dan semua alur yang ada tetap jalan (user ubah `nama_lengkap`/`password_set` sendiri; semua action admin memakai service role). Terbukti: staf aktif → `super_account` ditolak (42501), staf nonaktif → `aktif` ditolak, ubah nama sendiri boleh, Pengelola boleh ubah status orang lain. Penonaktifan pengguna kini juga mengunci login di GoTrue (`ban_duration`); pengaktifan mencabut ban lebih dulu. Policy `user_invitations` memakai `is_super_account()` (wajib aktif).
- **#33.2 INSERT anon:** policy `"Publik bisa insert"` dicabut dan `INSERT` dicabut dari `anon` (014). `submitPengaduanAction` menyisipkan lewat service role, hanya kolom yang divalidasi zod (dengan batas panjang: nama/kontak 100, deskripsi 5000).
- **#33.3 RPC:** `get_pengaduan_by_tracking` hanya `service_role` (013); dipanggil dari server. Nomor tracking baru `PND-` + 12 hex (48 bit); nomor lama 8 hex tetap valid. Terbukti: `anon`/`authenticated` mendapat `permission denied`.
- **#33.4 rate limit:** cek status fail-closed (galat → pesan "layanan tidak tersedia", bukan "tidak ditemukan"); `x-forwarded-for` tidak lagi dipercaya; tanpa `x-real-ip` di produksi semua berbagi key `unknown`; IPv6 diringkas ke /64 (`lib/client-ip.ts`). Submit tetap fail-open dan dicatat di log.
- **#33.5 upload:** `withMime` mengisi MIME dari ekstensi (pdf/doc/docx/mp4/webm), `ImageUpload`/`VideoUpload` menolak format di luar whitelist dengan pesan Indonesia, galat Storage dipetakan ke Bahasa Indonesia (`lib/upload-helpers.ts`).
- **#33.6 Storage SELECT:** policy `"Publik bisa lihat file"` diganti SELECT untuk staf aktif saja (013). Bucket tetap publik: URL `/object/public/...` tidak butuh policy. Terbukti: anon melihat 0 objek, staf aktif upload dengan `RETURNING` berhasil.
Belum dikerjakan: `DISABLE_SIGNUP=true` di GoTrue (konfigurasi infra), audit objek lama di bucket terhadap whitelist (`select name, metadata->>'mimetype' from storage.objects ...`), review ulang `rls-reviewer` atas 014 (WAJIB sebelum commit/terapkan).

**#35 — Token warna untuk galat, teks status, dan kertas (Fase 4)**
Konteks: ~290 kelas Tailwind bawaan (`text-red-500`, `bg-white`, `text-green-700`, dll.) tersebar di app dan components, melanggar aturan #6 (tidak ada warna di luar token). Tidak ada token untuk galat.
Keputusan: tambah `danger` (#B3261E, 5.7:1 di background), `paper` (#FFFFFF), dan varian gelap untuk teks status (`status-*-ink`, semuanya ≥5.4:1, lolos AA sebagai teks). Warna status dasar tetap untuk latar dan garis. Pemetaan dilakukan massal; tint 50/100 dipetakan ke token dengan opasitas.
Alasan teks status: `status-warning` (#BE7B3D) hanya 3.0:1 di atas background, tidak lolos AA untuk teks. Token dasar tetap dipakai untuk non-teks.

**#36 — HeroSlider: tetap auto-play, dengan jeda dan reduced-motion (Fase 4)**
Konteks: `design/tokens.json` melarang "auto-playing carousel", tetapi user memilih mempertahankan auto-play dan menjaga tampilan tetap bersih.
Keputusan: auto-play 6 detik dipertahankan. Tombol jeda kecil di pojok kanan bawah (`aria-pressed`), terpisah dari jeda saat kursor/fokus. Tidak berjalan sama sekali bila `prefers-reduced-motion`. Catatan: `animate-pulse` di PotensiCard sudah dibatasi oleh aturan global reduced-motion di `globals.css`.
Perlu dicatat: aturan "auto-playing carousel" di tokens.json sekarang dilanggar secara sadar; jika ingin dipatuhi penuh, hapus auto-play dan biarkan hanya navigasi manual.

**#37 — Pengaduan: honeypot lebih awal, batas kiriman global (Fase 2–3)**
Keputusan: honeypot dicek di awal action (sebelum batas per IP), tanpa `max(0)` di zod, dan balasan palsu memakai nomor acak. Ditambah batas global `submit:global` 50 per jam di `rate_limits` (tanpa skema baru). Tanpa CAPTCHA atau layanan pihak ketiga (UU PDP, koneksi lambat). Angka 50 adalah default teknis dan bisa disesuaikan user.
Konsekuensi: bot yang mengisi honeypot tidak lagi menghabiskan kuota per IP.

**#38 — Statistik kosong = NULL; form admin menyimpan kosong sebagai NULL (migrasi 015)**
Konteks: migrasi 010 memberi `DEFAULT 0` pada kolom angka, dan form admin mengubah kosong menjadi 0, sehingga data belum diisi tampil sebagai "0" atau "-" di halaman publik.
Keputusan: default NULL (migrasi 015, hanya baris baru), skema admin `angkaOpsional` (kosong → null), dan tampilan "Belum diisi". Baris lama yang sudah berisi 0 tidak diubah otomatis, karena 0 bisa berarti nol sungguhan; staf perlu memeriksanya.

**#39 — Hardening lanjutan: proxy, site URL, dan fonts (Fase 2–3)**
- `middleware.ts` → `proxy.ts` (konvensi Next 16; perilaku sama, dicek: `/admin` redirect tanpa sesi).
- `getSiteUrl()` menggantikan fallback ke domain produksi. Di produksi, `NEXT_PUBLIC_SITE_URL` kosong membuat error jelas, karena `robots.ts` dievaluasi saat build.
- Fraunces di-host lewat `next/font`, bukan Google Fonts: pengunjung tidak lagi mengirim IP ke Google (UU PDP) dan halaman admin ikut mendapat font H1/H2.
- `export const revalidate = false` dihapus dari halaman publik: halaman membaca cookie, jadi ekspor itu tidak berpengaruh dan menyesatkan.
- `/api/translate` dihapus (lihat #26). Tidak ada pemanggil dan hanya memeriksa login.

