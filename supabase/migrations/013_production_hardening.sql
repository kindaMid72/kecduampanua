-- =============================================
-- Migrasi 013: Hardening untuk produksi self-hosted
-- =============================================
-- Latar belakang: di Supabase, setiap function di schema public otomatis bisa
-- dipanggil lewat PostgREST (/rest/v1/rpc/<nama>) oleh siapa pun yang punya anon
-- key — dan anon key ada di bundle browser. Function SECURITY DEFINER berjalan
-- dengan hak pemilik (bypass RLS), jadi hak EXECUTE-nya harus dibatasi.
--
-- Jalankan sebagai PEMILIK function (mis. supabase_admin) dalam satu transaksi.
-- Kalau dijalankan role lain, ALTER FUNCTION gagal dan REVOKE hanya memberi
-- WARNING tanpa efek. Verifikasi sesudahnya (lihat docs/DEPLOYMENT.md §7).
-- Urutan dengan 014 tidak bergantung; keduanya harus diterapkan sebelum produksi.

begin;

-- === 1. check_rate_limit: hanya service_role ===
-- Sebelumnya dapat dipanggil anon: penyerang bisa (a) menghabiskan jatah rate
-- limit IP korban dengan mengirim client_ip korban, dan (b) membanjiri tabel
-- rate_limits dengan key palsu tanpa batas. Server memanggilnya dengan service
-- role, yang tidak terpengaruh REVOKE ini.
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant  execute on function public.check_rate_limit(text, int, int) to service_role;

-- === 2. Kunci search_path semua function SECURITY DEFINER ===
-- Mencegah pembajakan lewat objek bernama sama di schema lain.
alter function public.is_staf_aktif()                      set search_path = public, pg_temp;
alter function public.is_super_account()                   set search_path = public, pg_temp;
alter function public.get_pengaduan_by_tracking(text)      set search_path = public, pg_temp;
alter function public.check_rate_limit(text, int, int)     set search_path = public, pg_temp;

-- === 3. get_pengaduan_by_tracking: hanya service_role ===
-- Aturan #10: publik hanya membaca pengaduan lewat nomor_tracking exact match.
-- Dulu RPC ini terbuka untuk anon sehingga bisa ditembak langsung lewat REST
-- tanpa rate limit (nomor hanya 32 bit). Sekarang HANYA server (Server Action
-- cekStatusPengaduanAction, yang melakukan validasi format + rate limit) yang bisa
-- memanggilnya, memakai service role. Tidak bergantung pada konfigurasi edge.
revoke execute on function public.get_pengaduan_by_tracking(text) from public, anon, authenticated;
grant  execute on function public.get_pengaduan_by_tracking(text) to service_role;

-- === 4. Storage bucket 'uploads' ===
-- a) Batasi ukuran & tipe file di sisi server. Validasi di browser (ukuran,
--    accept=) hanya kenyamanan; siapa pun dengan sesi staf bisa melewatinya.
--    SVG sengaja TIDAK diizinkan (bisa memuat script, dan bucket ini publik).
--    Batas 20 MB mengikuti batas upload video di VideoUpload.tsx.
update storage.buckets
set
  file_size_limit = 20971520,
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
where id = 'uploads';

-- b) Tulis/ubah/hapus hanya untuk staf AKTIF, bukan sekadar "login".
--    (Policy lama memakai auth.role() = 'authenticated'.)
drop policy if exists "Staf bisa upload" on storage.objects;
drop policy if exists "Staf bisa ubah"   on storage.objects;
drop policy if exists "Staf bisa hapus"  on storage.objects;

create policy "Staf bisa upload"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and public.is_staf_aktif());

create policy "Staf bisa ubah"
  on storage.objects for update
  using (bucket_id = 'uploads' and public.is_staf_aktif());

create policy "Staf bisa hapus"
  on storage.objects for delete
  using (bucket_id = 'uploads' and public.is_staf_aktif());

-- c) SELECT hanya untuk staf aktif. Bucket ini publik (public = true): URL
--    /storage/v1/object/public/uploads/... tetap bisa dibuka siapa saja tanpa
--    policy ini. Policy lama (using bucket_id = 'uploads', semua role) hanya
--    membuat anon bisa MELIST isi bucket lewat /storage/v1/object/list/uploads.
--    Staf tetap butuh SELECT karena upload memakai INSERT ... RETURNING.
drop policy if exists "Publik bisa lihat file" on storage.objects;

create policy "Staf aktif bisa lihat file"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'uploads' and public.is_staf_aktif());

-- === 5. Pembersihan rate_limits ===
-- Satu baris per key; tanpa pembersihan, tabel tumbuh selamanya. Jadwalkan di
-- server (backup.sh sudah melakukannya, atau pg_cron):
--   delete from public.rate_limits where window_start < now() - interval '1 day';

commit;
