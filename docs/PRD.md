# PRD — Website Resmi Kecamatan

Status: Living document — selalu representasikan kondisi terkini, bukan snapshot. Riwayat perubahan besar ada di docs/DECISIONS.md.
Owner: King (Developer)
Stakeholder: Pihak Kecamatan (klien)
Rujukan pendamping: `docs/DECISIONS.md` (alasan tiap keputusan), `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/DESIGN.md`

## 1. Ringkasan

Website resmi kecamatan (wilayah pesisir) untuk profil, layanan administratif, informasi publik, potensi daerah, dan pengaduan warga. Dikelola sehari-hari oleh staf **awam teknis** — kemudahan admin panel sama prioritasnya dengan tampilan publik. Bilingual (Indonesia utama, Inggris auto-translate).

## 2. Target Pengguna

| Peran | Kebutuhan Utama |
|---|---|
| Warga (Publik) | Info cepat ditemukan, form ringan, akses mobile koneksi lambat |
| Staf | Kelola semua konten sehari-hari, tanpa akses kelola user |
| Super Account | Semua hak Staf + satu-satunya yang bisa undang/cabut akses user |

## 3. Ruang Lingkup

### Fase 1 — MVP
- Beranda, Profil (+ struktur organisasi, jumlah ASN, PPID minimal), Standar Pelayanan (+ Maklumat Pelayanan), Kontak
- Auth: login Staf/Super Account, alur invite & reset via single-use link manual (tanpa konfirmasi email)
- Admin: Kelola Informasi Publik, Kelola Standar Pelayanan
- Deploy ke domain go.id (tunduk konfirmasi hosting — lihat §8)

### Fase 2
- Informasi Publik penuh (kategori, pencarian), Data Statistik, Potensi Daerah, Berita
- Edaran Dokumen
- Pengaduan Masyarakat (form + cek status + banner SP4N-LAPOR!)
- Bilingual auto-translate aktif penuh

### Di Luar Lingkup
- Layanan transaksional/tanda tangan elektronik resmi
- Integrasi langsung ke sistem Dukcapil pusat
- Form permohonan informasi PPID digital (versi minimal dulu — lihat DECISIONS #15)
- Integrasi API SP4N-LAPOR! (cukup link keluar — DECISIONS #16)

## 4. Modul & Navigasi

Navbar 5 item top-level (DECISIONS #18):

```
Beranda | Profil ▾ | Informasi ▾ | Layanan Publik ▾ | Kontak
```

| Menu | Isi |
|---|---|
| Beranda | Papan Informasi (status kantor, jam layanan), info terbaru, akses cepat |
| Profil ▾ | Sejarah, Visi-Misi, Struktur Organisasi, Jumlah ASN, PPID (minimal), Data Statistik, Potensi Daerah |
| Informasi ▾ | Informasi Publik (pengumuman/kegiatan/jadwal rapat), Berita |
| Layanan Publik ▾ | Standar Pelayanan (+ Maklumat Pelayanan), Pengaduan (+ cek status, + banner SP4N-LAPOR!), Edaran Dokumen |
| Kontak | Alamat, kontak resmi, peta |

## 5. Detail Fitur per Modul

**Profil** — sejarah, visi-misi, struktur organisasi (foto+nama+jabatan), jumlah ASN, PPID (dasar hukum UU KIP 14/2008, kontak & jam layanan petugas — statis, tanpa form permohonan).

**Standar Pelayanan** (dulu "Layanan") — Maklumat Pelayanan (pernyataan komitmen singkat) di atas, lalu accordion per layanan: syarat dokumen (checklist), alur/prosedur (bernomor — satu-satunya tempat yang cocok pakai angka sequence), estimasi waktu, jam layanan, tombol unduh formulir & dokumen Standar Pelayanan resmi (PDF, opsional).

**Informasi Publik** (dulu "Berita") — kategori: Pengumuman, Kegiatan, Jadwal Rapat. Field tanggal acara & lokasi untuk kegiatan/rapat. List + filter kategori + detail.

**Data Statistik** — data agregat per desa/kelurahan, update manual berkala, selalu tampilkan "Data per [tahun], diperbarui [tanggal]".

**Potensi Daerah** — gabungan Potensi Ekonomi, Pariwisata, Potensi Pengolahan (DECISIONS #9). Satu menu admin, tab filter di publik.

**Berita** — artikel editorial dan liputan kegiatan kecamatan. Kategori bebas diisi staf (tidak enum). Field: judul, konten panjang, gambar cover (wajib), kategori, tanggal terbit. List + detail per artikel. Bilingual (kolom `_en` opsional — fallback ke Indonesia). Berbeda dari Informasi Publik yang fokus ke pengumuman/kegiatan/jadwal dengan kategori enum ketat.

**Edaran Dokumen** — daftar dokumen resmi (kategori bebas), langsung tayang saat diunggah, deskripsi wajib diisi & ditampilkan sebelum tombol unduh (DECISIONS #8).

**Pengaduan Masyarakat** — form (nama, kontak, kategori, deskripsi, lampiran opsional) → nomor tracking → halaman cek status terpisah. Anti-spam: honeypot + rate limit. Banner link ke SP4N-LAPOR! (lapor.go.id). Checkbox persetujuan data pribadi, retensi 2 tahun (DECISIONS #12).

**Kontak** — alamat, kontak resmi, jam operasional, peta.

## 6. Peran & Hak Akses

| Aksi | Publik | Staf | Super Account |
|---|---|---|---|
| Lihat konten publik | ✅ | ✅ | ✅ |
| Kirim pengaduan / cek status | ✅ | - | - |
| Kelola semua modul konten, publish langsung | - | ✅ | ✅ |
| Undang user baru | - | ❌ | ✅ |
| Kirim link reset password | - | ❌ | ✅ |
| Cabut akses user | - | ❌ | ✅ |

Tidak ada approval layer — Staf & Super Account sama-sama publish langsung (DECISIONS #5).

## 7. Bilingual (EN/ID)

Auto-translate server-side (Google Cloud Translation API) saat konten disimpan, hasil tersimpan sebagai teks asli di kolom `_en`, fallback ke Indonesia kalau kosong/gagal. Field prosedural di Standar Pelayanan diberi badge "perlu ditinjau" (non-blocking). Admin panel tetap Indonesia-only. Edaran Dokumen tidak diterjemahkan. Detail teknis: DECISIONS #10, ARCHITECTURE §10.

## 8. Kebutuhan Non-Fungsional

- Bahasa admin panel: Indonesia penuh, istilah non-teknis ("Terbitkan" bukan "Publish")
- Mobile-first, dioptimalkan koneksi lambat (kompresi gambar, lazy load)
- Aksesibilitas: kontras WCAG AA, tap target min 44px, uji viewport 360px
- Tidak ada halaman kosong/error saat data belum ada — selalu placeholder sopan
- RLS aktif di semua tabel sejak dibuat, tanpa kecuali

## 9. Risiko & Hal yang Perlu Dikonfirmasi

- ⚠️ **Kebijakan hosting Diskominfo** (Vercel vs PDN) — blocking untuk deployment produksi, lihat DECISIONS #2
- Aset logo resmi kecamatan/kabupaten belum ada
- Siapa Super Account pertama (untuk seed akun)
- Daftar resmi desa/kelurahan, data ASN, teks profil, statistik — proses pengumpulan berjalan paralel
- Ketentuan retensi data pengaduan spesifik dari kecamatan (kalau ada, override default 2 tahun)

## 10. Metrik Keberhasilan

- Website live di domain go.id resmi
- Staf mandiri menerbitkan konten tanpa bantuan developer, training < 1 jam
- Semua modul Fase 1 berfungsi baik di perangkat mobile
