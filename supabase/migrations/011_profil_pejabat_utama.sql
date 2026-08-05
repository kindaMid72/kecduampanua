-- =============================================
-- MIGRASI 011 — Tambah kolom pejabat utama ke profil_kecamatan
-- Dipakai untuk slide 2 Hero Section di halaman Beranda
-- Referensi: docs/DATABASE_SCHEMA.md §8
-- =============================================

-- Semua kolom nullable — staf mengisi via admin panel /admin/profil
-- Slide 2 hero hanya muncul jika minimal satu kolom terisi
alter table profil_kecamatan
  add column if not exists nama_pejabat_utama       text,  -- Nama lengkap pejabat, e.g. "H. Ahmad Rifai, S.Sos"
  add column if not exists jabatan_pejabat_utama    text,  -- e.g. "Camat Duampanua"
  add column if not exists foto_pejabat_utama_url   text,  -- URL foto dari Supabase Storage bucket "uploads"
  add column if not exists sambutan_pejabat_utama   text;  -- Teks sambutan/kata pengantar, plaintext, max ~500 karakter

-- RLS tidak perlu diubah:
-- "Publik lihat profil" (select using true) sudah mencakup kolom baru ini
-- "Staf kelola profil" (all using is_staf_aktif()) sudah mencakup insert/update
