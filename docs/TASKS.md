# Tasks — Checklist Kerja per Fase

Update file ini setiap menyelesaikan item (centang `[x]`). Ini pengganti "ingatan" lintas sesi coding agent — jangan asumsikan progres dari percakapan sebelumnya, selalu cek file ini dulu. Kalau mulai sesi baru untuk fase baru, baca **Prasyarat** fase itu dulu sebelum mulai kerja.

## Setup Awal

*Prasyarat: tidak ada — titik mulai project.*

- [x] Init Next.js (App Router, TS) + Tailwind + `next-intl`
- [x] Setup Vitest + Playwright, verifikasi command `npm run test` & `npm run test:e2e` di `AGENTS.md` cocok dengan `package.json`
- [x] Setup project Supabase, hubungkan env vars (`.env.local`, jangan commit)
- [x] Generate CSS design tokens dari `design/tokens.json` (via Tailwind v4 `@theme`)
- [x] Jalankan semua `CREATE TABLE` + RLS policy dari `docs/DATABASE_SCHEMA.md` *(file SQL tersedia di `supabase/migrations/001_initial_schema.sql` — jalankan manual di Supabase SQL Editor)*
- [x] Seed 1 akun `super_account` pertama (email dari klien — lihat PRD §9)
- [x] Setup Vercel project + deploy preview pertama

*Kriteria selesai: `npm run dev` jalan tanpa error, bisa login sebagai super_account, deploy preview Vercel sukses.*

## Fase 1 — MVP

*Prasyarat: Setup Awal selesai (auth & DB harus jalan dulu — jangan mulai bikin halaman admin sebelum login berfungsi).*

- [x] Layout dasar: navbar 5 item + dropdown (PRD §4), footer
- [x] Komponen `/components/ui`: Button, Card, Badge, PapanInformasiPanel, SectionDivider, CategoryLabel
- [x] Halaman Beranda (Papan Informasi status kantor + jam layanan)
- [x] Halaman Profil (sejarah, visi-misi, struktur organisasi, jumlah ASN)
- [x] Halaman PPID minimal (statis)
- [x] Halaman Standar Pelayanan + Maklumat Pelayanan (accordion, alur bernomor)
- [x] Halaman Kontak
- [x] Auth: login admin, middleware proteksi `/admin/*`
- [x] Alur invite user (One-Time Setup Token `user_invitations` + salin tautan tanpa verifikasi email) — hanya `super_account` (DECISIONS #25)
- [x] Alur reset password (One-Time Setup Token `user_invitations` + salin tautan tanpa verifikasi email) — hanya `super_account` (DECISIONS #25)
- [x] Admin: Edit data pengguna (nama lengkap, role, email read-only, guardrail orphan & konfirmasi ubah peran sendiri)
- [x] Admin: Hapus pengguna (dengan proteksi self-delete & FK ON DELETE SET NULL)
- [x] Admin: Pengaturan Akun Mandiri (`/admin/pengaturan-akun`) — ubah nama lengkap & ganti password mandiri untuk semua staf
- [x] Alur cabut akses (`ban_duration` + status nonaktif)
- [x] Admin: Kelola Informasi Publik (form + list, auto-translate saat simpan)
- [x] Admin: Kelola Standar Pelayanan
- [x] Uji semua halaman di viewport 360px
- [x] Placeholder state untuk semua section yang datanya belum terisi

*Kriteria selesai (wajib semua terpenuhi sebelum mulai Fase 2): staf bisa login mandiri lewat link invite tanpa bantuan developer; staf bisa terbitkan/edit Informasi Publik & Standar Pelayanan sendiri; tidak ada halaman publik yang render kosong/error; checklist `docs/DESIGN.md` lolos di semua halaman yang dibangun.*

## Fase 2

*Prasyarat: Fase 1 kriteria selesai terpenuhi — terutama auth & pola auto-translate sudah terbukti jalan di modul Informasi Publik, karena modul-modul Fase 2 mengikuti pola yang sama.*

- [ ] Halaman Data Statistik
- [ ] Halaman & admin Potensi Daerah (tab filter kategori)
- [x] Halaman & admin Berita (artikel editorial & liputan kegiatan kecamatan)
- [ ] Halaman & admin Edaran Dokumen (deskripsi wajib sebelum unduh)
- [ ] Form Pengaduan (honeypot + rate limit + checkbox persetujuan data pribadi)
- [ ] Halaman Cek Status Pengaduan (via RPC function, bukan direct select — lihat `.claude/skills/rls-review/SKILL.md`)
- [ ] Dashboard admin Pengaduan (ubah status, catatan tindak lanjut)
- [ ] Banner SP4N-LAPOR! di halaman Pengaduan & Kontak
- [ ] Job terjadwal arsip otomatis data pengaduan (2 tahun setelah selesai)
- [x] **Bilingual hibrida** — field `_en` opsional di form admin (Informasi Publik, Standar Pelayanan, Profil); tidak ada dependency API berbayar; halaman `/en/` fallback ke teks Indonesia otomatis (DECISIONS #10)
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
