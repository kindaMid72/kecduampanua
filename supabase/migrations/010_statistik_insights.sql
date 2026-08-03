-- Add insight columns to data_statistik table

ALTER TABLE data_statistik
  -- Demografi
  ADD COLUMN penduduk_usia_0_14 int DEFAULT 0,
  ADD COLUMN penduduk_usia_15_64 int DEFAULT 0,
  ADD COLUMN penduduk_usia_65_ke_atas int DEFAULT 0,
  ADD COLUMN penduduk_laki_laki int DEFAULT 0,
  ADD COLUMN penduduk_perempuan int DEFAULT 0,

  -- Pendidikan
  ADD COLUMN jumlah_murid_sd_smp int DEFAULT 0,
  ADD COLUMN jumlah_guru_sd_smp int DEFAULT 0,
  ADD COLUMN penduduk_usia_sekolah int DEFAULT 0,
  ADD COLUMN jumlah_sekolah int DEFAULT 0,

  -- Kesehatan (BPS standard)
  ADD COLUMN jumlah_rumah_sakit int DEFAULT 0,
  ADD COLUMN jumlah_puskesmas int DEFAULT 0,
  ADD COLUMN jumlah_posyandu int DEFAULT 0,
  ADD COLUMN jumlah_klinik_apotek int DEFAULT 0,

  -- Geografi & Aksesibilitas
  ADD COLUMN luas_wilayah_km2 numeric DEFAULT 0,
  ADD COLUMN jarak_ke_ibukota_km numeric DEFAULT 0,

  -- Ekonomi & Agraria/Kelautan
  ADD COLUMN produksi_panen_ton numeric DEFAULT 0,
  ADD COLUMN luas_panen_ha numeric DEFAULT 0,
  ADD COLUMN jumlah_toko_minimarket int DEFAULT 0,
  ADD COLUMN tangkapan_ikan_ton numeric DEFAULT 0,
  ADD COLUMN jumlah_nelayan int DEFAULT 0;
