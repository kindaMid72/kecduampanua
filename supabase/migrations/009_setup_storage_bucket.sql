-- 009_setup_storage_bucket.sql

-- Buat bucket 'uploads' jika belum ada
insert into storage.buckets (id, name, public) 
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Hapus policy yang mungkin sudah ada (untuk idempotent)
drop policy if exists "Publik bisa lihat file" on storage.objects;
drop policy if exists "Staf bisa upload" on storage.objects;
drop policy if exists "Staf bisa ubah" on storage.objects;
drop policy if exists "Staf bisa hapus" on storage.objects;

-- Policy untuk bucket 'uploads'
create policy "Publik bisa lihat file"
  on storage.objects for select
  using (bucket_id = 'uploads');

create policy "Staf bisa upload"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads' and 
    auth.role() = 'authenticated'
  );

create policy "Staf bisa ubah"
  on storage.objects for update
  using (
    bucket_id = 'uploads' and 
    auth.role() = 'authenticated'
  );

create policy "Staf bisa hapus"
  on storage.objects for delete
  using (
    bucket_id = 'uploads' and 
    auth.role() = 'authenticated'
  );
