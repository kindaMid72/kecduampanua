-- =============================================
-- MIGRASI DATABASE KECAMATAN DUAMPANUA
-- Jalankan di Supabase SQL Editor (dashboard.supabase.com)
-- Source of truth: docs/DATABASE_SCHEMA.md
-- =============================================

-- === 1. profiles ===
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null,
  role text not null check (role in ('super_account', 'staf')),
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  password_set boolean not null default false,
  created_at timestamptz default now()
);

-- === Helper function ===
create or replace function is_staf_aktif()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.status = 'aktif'
  );
$$;

alter table profiles enable row level security;

create policy "User bisa lihat profil sendiri" on profiles for select using (auth.uid() = id);

create policy "Super account bisa lihat & kelola semua profil"
  on profiles for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_account'));

-- === 2. informasi_publik ===
create table informasi_publik (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  judul_en text,
  slug text not null unique,
  kategori text not null check (kategori in ('pengumuman', 'kegiatan', 'jadwal_rapat')),
  konten text not null,
  konten_en text,
  gambar_cover_url text,
  tanggal_acara timestamptz,
  lokasi text,
  status text not null default 'published' check (status in ('published', 'diarsipkan')),
  dibuat_oleh uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table informasi_publik enable row level security;

create policy "Publik baca yang published" on informasi_publik for select using (status = 'published');
create policy "Staf baca semua" on informasi_publik for select using (is_staf_aktif());
create policy "Staf kelola penuh" on informasi_publik for all using (is_staf_aktif());

-- === 3. galeri_album & galeri_foto ===
create table galeri_album (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  informasi_publik_id uuid references informasi_publik(id),
  created_at timestamptz default now()
);

create table galeri_foto (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references galeri_album(id) on delete cascade,
  gambar_url text not null,
  keterangan text,
  urutan int default 0
);

alter table galeri_album enable row level security;
alter table galeri_foto enable row level security;

create policy "Publik lihat album" on galeri_album for select using (true);
create policy "Publik lihat foto" on galeri_foto for select using (true);
create policy "Staf kelola album" on galeri_album for all using (is_staf_aktif());
create policy "Staf kelola foto" on galeri_foto for all using (is_staf_aktif());

-- === 4. layanan (Standar Pelayanan) ===
create table layanan (
  id uuid primary key default gen_random_uuid(),
  nama_layanan text not null,
  nama_layanan_en text,
  deskripsi text,
  deskripsi_en text,
  syarat_dokumen text[],
  syarat_dokumen_en text[],
  alur_proses text,
  alur_proses_en text,
  alur_perlu_ditinjau boolean default true,
  estimasi_waktu text,
  link_formulir_url text,
  dokumen_standar_pelayanan_url text,
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  urutan int default 0
);

alter table layanan enable row level security;
create policy "Publik lihat aktif" on layanan for select using (status = 'aktif');
create policy "Staf kelola" on layanan for all using (is_staf_aktif());

-- === 5. potensi_daerah ===
create table potensi_daerah (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  judul_en text,
  kategori text not null check (kategori in ('ekonomi', 'wisata', 'pengolahan')),
  deskripsi text not null,
  deskripsi_en text,
  lokasi text,
  gambar_url text,
  status text not null default 'published' check (status in ('published', 'diarsipkan')),
  urutan int default 0,
  dibuat_oleh uuid references profiles(id),
  created_at timestamptz default now()
);

alter table potensi_daerah enable row level security;
create policy "Publik lihat published" on potensi_daerah for select using (status = 'published');
create policy "Staf kelola" on potensi_daerah for all using (is_staf_aktif());

-- === 6. dokumen_edaran ===
create table dokumen_edaran (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  nomor_surat text,
  kategori text,
  deskripsi text not null,
  file_url text not null,
  tanggal_terbit date not null,
  diunggah_oleh uuid references profiles(id),
  created_at timestamptz default now()
);

alter table dokumen_edaran enable row level security;
create policy "Publik lihat semua" on dokumen_edaran for select using (true);
create policy "Staf kelola" on dokumen_edaran for all using (is_staf_aktif());

-- === 7. pengaduan ===
create table pengaduan (
  id uuid primary key default gen_random_uuid(),
  nomor_tracking text not null unique,
  nama_pelapor text not null,
  kontak_pelapor text not null,
  kategori text,
  deskripsi text not null,
  lampiran_url text,
  status text not null default 'baru' check (status in ('baru', 'diproses', 'selesai')),
  catatan_tindak_lanjut text,
  setuju_data_pribadi boolean not null default false,
  ditangani_oleh uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  diarsipkan_pada timestamptz
);

alter table pengaduan enable row level security;

create policy "Publik bisa insert" on pengaduan for insert with check (setuju_data_pribadi = true);

-- RPC function untuk cek status — BUKAN direct table select
-- Ini satu-satunya jalan publik untuk membaca data pengaduan
create or replace function get_pengaduan_by_tracking(nomor text)
returns table (
  nomor_tracking text,
  status text,
  kategori text,
  created_at timestamptz,
  catatan_tindak_lanjut text
) language sql security definer as $$
  select
    p.nomor_tracking,
    p.status,
    p.kategori,
    p.created_at,
    p.catatan_tindak_lanjut
  from pengaduan p
  where p.nomor_tracking = nomor
  and p.diarsipkan_pada is null;
$$;

create policy "Staf lihat & kelola semua" on pengaduan for all using (is_staf_aktif());

-- === 8. profil_kecamatan & struktur_organisasi ===
create table profil_kecamatan (
  id uuid primary key default gen_random_uuid(),
  sejarah text, sejarah_en text,
  visi text, visi_en text,
  misi text, misi_en text,
  jumlah_asn int,
  maklumat_pelayanan text, maklumat_pelayanan_en text,
  ppid_dasar_hukum text,
  ppid_nama_petugas text,
  ppid_kontak text,
  ppid_jam_layanan text,
  updated_at timestamptz default now()
);

create table struktur_organisasi (
  id uuid primary key default gen_random_uuid(),
  nama_pejabat text not null,
  jabatan text not null,
  foto_url text,
  urutan int default 0
);

alter table profil_kecamatan enable row level security;
alter table struktur_organisasi enable row level security;

create policy "Publik lihat profil" on profil_kecamatan for select using (true);
create policy "Publik lihat struktur" on struktur_organisasi for select using (true);
create policy "Staf kelola profil" on profil_kecamatan for all using (is_staf_aktif());
create policy "Staf kelola struktur" on struktur_organisasi for all using (is_staf_aktif());

-- === 9. data_statistik ===
create table data_statistik (
  id uuid primary key default gen_random_uuid(),
  nama_desa_kelurahan text not null,
  jumlah_penduduk int,
  tahun_data int not null,
  updated_at timestamptz default now()
);

alter table data_statistik enable row level security;
create policy "Publik lihat" on data_statistik for select using (true);
create policy "Staf kelola" on data_statistik for all using (is_staf_aktif());

-- === 10. Trigger updated_at otomatis ===
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on informasi_publik
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on pengaduan
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on profil_kecamatan
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on data_statistik
  for each row execute procedure moddatetime(updated_at);

-- === 11. Seed profil_kecamatan (1 row, diupdate nanti) ===
insert into profil_kecamatan (id) values (gen_random_uuid());
