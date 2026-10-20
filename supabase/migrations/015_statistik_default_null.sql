-- =============================================
-- Migrasi 015: kolom angka data_statistik tidak lagi berdefault 0
-- =============================================
-- Latar belakang: migrasi 010 memberi DEFAULT 0 pada kolom angka. Baris baru
-- otomatis berisi 0, sehingga data yang belum diisi tampil sebagai "0" di
-- halaman publik. Dengan default NULL, data yang belum diisi tampil
-- "Belum diisi". Form admin juga sekarang menyimpan kolom kosong sebagai NULL.
--
-- Catatan untuk operator:
-- - Migrasi ini hanya mengubah default untuk baris BARU. Baris yang sudah
--   telanjur berisi 0 tidak berubah otomatis, karena 0 bisa berarti "belum
--   diisi" atau nol sungguhan. Staf perlu memeriksa dan mengosongkan yang
--   belum benar-benar diisi.
-- - Tidak menyentuh RLS.

ALTER TABLE data_statistik
  ALTER COLUMN penduduk_usia_0_14 DROP DEFAULT,
  ALTER COLUMN penduduk_usia_15_64 DROP DEFAULT,
  ALTER COLUMN penduduk_usia_65_ke_atas DROP DEFAULT,
  ALTER COLUMN penduduk_laki_laki DROP DEFAULT,
  ALTER COLUMN penduduk_perempuan DROP DEFAULT,
  ALTER COLUMN jumlah_murid_sd_smp DROP DEFAULT,
  ALTER COLUMN jumlah_guru_sd_smp DROP DEFAULT,
  ALTER COLUMN penduduk_usia_sekolah DROP DEFAULT,
  ALTER COLUMN jumlah_sekolah DROP DEFAULT,
  ALTER COLUMN jumlah_rumah_sakit DROP DEFAULT,
  ALTER COLUMN jumlah_puskesmas DROP DEFAULT,
  ALTER COLUMN jumlah_posyandu DROP DEFAULT,
  ALTER COLUMN jumlah_klinik_apotek DROP DEFAULT,
  ALTER COLUMN luas_wilayah_km2 DROP DEFAULT,
  ALTER COLUMN jarak_ke_ibukota_km DROP DEFAULT,
  ALTER COLUMN produksi_panen_ton DROP DEFAULT,
  ALTER COLUMN luas_panen_ha DROP DEFAULT,
  ALTER COLUMN jumlah_toko_minimarket DROP DEFAULT,
  ALTER COLUMN tangkapan_ikan_ton DROP DEFAULT,
  ALTER COLUMN jumlah_nelayan DROP DEFAULT;
