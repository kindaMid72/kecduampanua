-- Migration 008: Ganti modul Galeri dengan Berita
-- Keputusan: DECISIONS #27
-- Galeri tables belum pernah punya data produksi — aman di-drop

-- === 1. Drop tabel galeri (tidak ada data produksi) ===
drop table if exists galeri_foto;
drop table if exists galeri_album;

-- === 2. Buat tabel berita ===
create table berita (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  judul_en text,
  slug text not null unique,
  konten text not null,
  konten_en text,
  gambar_cover_url text,      -- wajib diisi (validasi di form admin, bukan constraint DB)
  kategori text,              -- bebas diisi staf, tidak enum
  status text not null default 'published' check (status in ('published', 'diarsipkan')),
  dibuat_oleh uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === 3. RLS (wajib aktif sejak dibuat) ===
alter table berita enable row level security;

-- Publik hanya lihat yang sudah published
create policy "Publik baca yang published" on berita
  for select using (status = 'published');

-- Staf bisa lihat semua (termasuk yang diarsipkan)
create policy "Staf baca semua" on berita
  for select using (is_staf_aktif());

-- Staf bisa insert, update, delete
create policy "Staf kelola penuh" on berita
  for all using (is_staf_aktif());

-- === 4. Trigger updated_at ===
-- Pastikan extension moddatetime sudah aktif (sudah dari 001)
create trigger handle_updated_at before update on berita
  for each row execute procedure moddatetime(updated_at);
