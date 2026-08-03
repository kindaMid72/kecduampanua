-- =============================================
-- Migrasi 007: Peralihan ke Arsitektur Bilingual Hibrida
-- Konteks: DECISIONS #10 direvisi — auto-translate via Google Cloud API diganti
-- dengan pendekatan dual-field opsional (staf mengisi EN manual, fallback ke ID).
-- =============================================
-- Catatan: Kolom _en di semua tabel sudah ada sejak migrasi 001_initial_schema.sql:
--   informasi_publik : judul_en, konten_en
--   layanan          : nama_layanan_en, deskripsi_en, syarat_dokumen_en, alur_proses_en, alur_perlu_ditinjau
--   profil_kecamatan : sejarah_en, visi_en, misi_en, maklumat_pelayanan_en
-- Tidak ada perubahan struktur tabel — semua kolom nullable, backward-compatible.
-- Perubahan ini murni di application layer (actions.ts dan form pages).

-- Hapus kolom alur_perlu_ditinjau karena tidak relevan lagi:
-- di pendekatan lama, kolom ini menandai "terjemahan mesin perlu ditinjau staf".
-- Di pendekatan baru, staf langsung mengisi EN manual — tidak perlu flag review.
alter table layanan drop column if exists alur_perlu_ditinjau;

-- Catatan untuk operator:
-- Tidak perlu backfill data — kolom _en yang sudah berisi nilai (dari auto-translate
-- sebelumnya) tetap valid dan akan ditampilkan di halaman publik /en/ seperti biasa.
-- Kolom _en yang masih null akan fallback ke versi Indonesia (perilaku tidak berubah).
-- =============================================
