# Tasks — Checklist Kerja per Fase

Update file ini setiap menyelesaikan item (centang `[x]`). Ini pengganti "ingatan" lintas sesi coding agent — jangan asumsikan progres dari percakapan sebelumnya, selalu cek file ini dulu. Kalau mulai sesi baru untuk fase baru, baca **Prasyarat** fase itu dulu sebelum mulai kerja.

## Setup Awal

*Prasyarat: tidak ada — titik mulai project.*

- [x] Init Next.js (App Router, TS) + Tailwind + `next-intl`
- [x] Setup Vitest + Playwright, verifikasi command `npm run test` & `npm run test:e2e` di `AGENTS.md` cocok dengan `package.json`
- [x] Setup project Supabase, hubungkan env vars (`.env.local`, jangan commit)
- [x] Generate CSS design tokens dari `design/tokens.json` (via Tailwind v4 `@theme`)
- [ ] Jalankan semua `CREATE TABLE` + RLS policy dari `docs/DATABASE_SCHEMA.md` *(file SQL tersedia di `supabase/migrations/001_initial_schema.sql` — jalankan manual di Supabase SQL Editor)*
- [ ] Seed 1 akun `super_account` pertama (email dari klien — lihat PRD §9)
- [ ] Setup Vercel project + deploy preview pertama

*Kriteria selesai: `npm run dev` jalan tanpa error, bisa login sebagai super_account, deploy preview Vercel sukses.*

## Fase 1 — MVP

*Prasyarat: Setup Awal selesai (auth & DB harus jalan dulu — jangan mulai bikin halaman admin sebelum login berfungsi).*

- [ ] Layout dasar: navbar 5 item + dropdown (PRD §4), footer
- [ ] Komponen `/components/ui`: Button, Card, Badge, PapanInformasiPanel, SectionDivider, CategoryLabel
- [ ] Halaman Beranda (Papan Informasi status kantor + jam layanan)
- [ ] Halaman Profil (sejarah, visi-misi, struktur organisasi, jumlah ASN)
- [ ] Halaman PPID minimal (statis)
- [ ] Halaman Standar Pelayanan + Maklumat Pelayanan (accordion, alur bernomor)
- [ ] Halaman Kontak
- [ ] Auth: login admin, middleware proteksi `/admin/*`
- [ ] Alur invite user (generate link + salin tautan) — hanya `super_account`
- [ ] Alur reset password (generate link) — hanya `super_account`
- [ ] Alur cabut akses (`ban_duration` + status nonaktif)
- [ ] Admin: Kelola Informasi Publik (form + list, auto-translate saat simpan)
- [ ] Admin: Kelola Standar Pelayanan
- [ ] Uji semua halaman di viewport 360px
- [ ] Placeholder state untuk semua section yang datanya belum terisi

*Kriteria selesai (wajib semua terpenuhi sebelum mulai Fase 2): staf bisa login mandiri lewat link invite tanpa bantuan developer; staf bisa terbitkan/edit Informasi Publik & Standar Pelayanan sendiri; tidak ada halaman publik yang render kosong/error; checklist `docs/DESIGN.md` lolos di semua halaman yang dibangun.*

## Fase 2

*Prasyarat: Fase 1 kriteria selesai terpenuhi — terutama auth & pola auto-translate sudah terbukti jalan di modul Informasi Publik, karena modul-modul Fase 2 mengikuti pola yang sama.*

- [ ] Halaman Data Statistik
- [ ] Halaman & admin Potensi Daerah (tab filter kategori)
- [ ] Halaman & admin Galeri (link opsional ke Informasi Publik kategori kegiatan)
- [ ] Halaman & admin Edaran Dokumen (deskripsi wajib sebelum unduh)
- [ ] Form Pengaduan (honeypot + rate limit + checkbox persetujuan data pribadi)
- [ ] Halaman Cek Status Pengaduan (via RPC function, bukan direct select — lihat `.claude/skills/rls-review/SKILL.md`)
- [ ] Dashboard admin Pengaduan (ubah status, catatan tindak lanjut)
- [ ] Banner SP4N-LAPOR! di halaman Pengaduan & Kontak
- [ ] Job terjadwal arsip otomatis data pengaduan (2 tahun setelah selesai)
- [ ] Aktifkan penuh auto-translate (`/api/translate` + badge "perlu ditinjau" di Standar Pelayanan)
- [ ] SEO: sitemap, robots.txt, hreflang, metadata per halaman

*Kriteria selesai: warga bisa submit pengaduan & cek status mandiri; RLS pengaduan lolos uji akses `anon` (tidak bisa listing data orang lain); semua modul Fase 1+2 punya versi `/en/` yang render (auto-translate atau fallback).*

## Sebelum Go-Live

*Prasyarat: Fase 1 & Fase 2 kriteria selesai terpenuhi.*

- [ ] Konfirmasi kebijakan hosting Diskominfo (Vercel vs PDN) — DECISIONS #2
- [ ] Aset logo resmi terpasang (ganti placeholder)
- [ ] Semua konten Fase 1 & 2 terisi data asli (bukan placeholder)
- [ ] Domain go.id ter-pointing & SSL aktif
- [ ] Training staf (target < 1 jam, PRD §10)
- [ ] Review checklist `docs/DESIGN.md` §"Checklist Sebelum Merge UI Baru" di seluruh halaman

*Kriteria selesai: ini fase terakhir — "selesai" berarti live di domain resmi dan staf sudah pegang kendali penuh tanpa developer.*
