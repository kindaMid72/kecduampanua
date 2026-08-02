-- =============================================
-- Migrasi 006: Fix Foreign Keys referencing profiles(id) ON DELETE SET NULL
-- 
-- TUJUAN:
-- Memastikan bahwa ketika akun pengguna (profiles/auth.users) dihapus,
-- data publik seperti informasi publik, potensi daerah, dokumen edaran,
-- dan pengaduan tidak ikut terhapus dan tidak gagal akibat foreign key constraint.
-- =============================================

-- 1. informasi_publik.dibuat_oleh
alter table if exists informasi_publik
  drop constraint if exists informasi_publik_dibuat_oleh_fkey;

alter table if exists informasi_publik
  add constraint informasi_publik_dibuat_oleh_fkey
  foreign key (dibuat_oleh) references profiles(id)
  on delete set null;

-- 2. potensi_daerah.dibuat_oleh
alter table if exists potensi_daerah
  drop constraint if exists potensi_daerah_dibuat_oleh_fkey;

alter table if exists potensi_daerah
  add constraint potensi_daerah_dibuat_oleh_fkey
  foreign key (dibuat_oleh) references profiles(id)
  on delete set null;

-- 3. dokumen_edaran.diunggah_oleh
alter table if exists dokumen_edaran
  drop constraint if exists dokumen_edaran_diunggah_oleh_fkey;

alter table if exists dokumen_edaran
  add constraint dokumen_edaran_diunggah_oleh_fkey
  foreign key (diunggah_oleh) references profiles(id)
  on delete set null;

-- 4. pengaduan.ditangani_oleh
alter table if exists pengaduan
  drop constraint if exists pengaduan_ditangani_oleh_fkey;

alter table if exists pengaduan
  add constraint pengaduan_ditangani_oleh_fkey
  foreign key (ditangani_oleh) references profiles(id)
  on delete set null;
