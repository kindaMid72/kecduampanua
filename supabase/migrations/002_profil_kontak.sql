-- =============================================
-- MIGRASI 002 — Tambah kolom kontak kantor ke profil_kecamatan
-- Jalankan di Supabase SQL Editor jika sudah menjalankan 001_initial_schema.sql
-- Referensi: docs/DATABASE_SCHEMA.md §8
-- =============================================

-- Kolom kontak & operasional kantor
-- Semua nullable — staf mengisi bertahap via admin panel /admin/profil
alter table profil_kecamatan
  add column if not exists nama_kecamatan  text,         -- dipakai di footer & metadata SEO
  add column if not exists alamat          text,         -- alamat lengkap kantor
  add column if not exists telepon         text,         -- nomor telepon resmi
  add column if not exists email           text,         -- email resmi
  add column if not exists jam_operasional text,         -- e.g. "Senin–Jumat, 08.00–16.00 WIB"
  add column if not exists koordinat_lat   float8,       -- untuk embed peta OpenStreetMap
  add column if not exists koordinat_lng   float8;

-- RLS tidak perlu diubah:
-- "Publik lihat profil" (select using true) sudah mencakup kolom baru ini
-- "Staf kelola profil" (all using is_staf_aktif()) sudah mencakup insert/update
