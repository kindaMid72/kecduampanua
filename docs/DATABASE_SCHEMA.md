# Skema Database — Supabase (Postgres)

Rujukan alasan: `docs/DECISIONS.md`. Semua tabel WAJIB RLS aktif sejak dibuat — jangan pernah ada tabel tanpa RLS di production.

## 1. `profiles`

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null,
  role text not null check (role in ('super_account', 'staf')),
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  password_set boolean not null default false, -- lihat catatan keamanan di bawah
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "User bisa lihat profil sendiri" on profiles for select using (auth.uid() = id);

create policy "User bisa perbarui profil sendiri"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Super account bisa lihat & kelola semua profil"
  on profiles for all
  using (is_super_account());
```

Helper function dipakai berulang di policy lain:

```sql
create or replace function is_staf_aktif()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.status = 'aktif'
  );
$$;
```

## 2. `informasi_publik` (dulu "berita")

```sql
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
```

Catatan: tidak ada status `draft` — sesuai DECISIONS #5 (tidak ada approval layer, langsung terbit saat disimpan).

## 3. `galeri_album` & `galeri_foto`

```sql
create table galeri_album (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  informasi_publik_id uuid references informasi_publik(id), -- opsional, link ke post kegiatan terkait
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
```

## 4. `layanan` (tampil publik sebagai "Standar Pelayanan")

```sql
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
  alur_perlu_ditinjau boolean default true, -- badge "terjemahan otomatis, perlu ditinjau"
  estimasi_waktu text,
  link_formulir_url text,
  dokumen_standar_pelayanan_url text, -- PDF resmi, opsional
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  urutan int default 0
);

alter table layanan enable row level security;
create policy "Publik lihat aktif" on layanan for select using (status = 'aktif');
create policy "Staf kelola" on layanan for all using (is_staf_aktif());
```

## 5. `potensi_daerah` (gabungan ekonomi/wisata/pengolahan — DECISIONS #9)

```sql
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
```

## 6. `dokumen_edaran` (langsung tayang, tanpa status — DECISIONS #8)

```sql
create table dokumen_edaran (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  nomor_surat text,
  kategori text,  -- bebas, tanpa constraint enum
  deskripsi text not null,
  file_url text not null,
  tanggal_terbit date not null,
  diunggah_oleh uuid references profiles(id),
  created_at timestamptz default now()
);

alter table dokumen_edaran enable row level security;
create policy "Publik lihat semua" on dokumen_edaran for select using (true);
create policy "Staf kelola" on dokumen_edaran for all using (is_staf_aktif());
```

## 7. `pengaduan`

```sql
create table pengaduan (
  id uuid primary key default gen_random_uuid(),
  nomor_tracking text not null unique, -- format PGD-XXXXXXXX
  nama_pelapor text not null,
  kontak_pelapor text not null,
  kategori text,
  deskripsi text not null,
  lampiran_url text,
  status text not null default 'baru' check (status in ('baru', 'diproses', 'selesai')),
  catatan_tindak_lanjut text,
  setuju_data_pribadi boolean not null default false, -- checkbox persetujuan UU PDP
  ditangani_oleh uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  diarsipkan_pada timestamptz -- diisi otomatis 2 tahun setelah status 'selesai', DECISIONS #12
);

alter table pengaduan enable row level security;

create policy "Publik bisa insert" on pengaduan for insert with check (setuju_data_pribadi = true);

create policy "Publik bisa cek status via nomor tracking exact match"
  on pengaduan for select
  using (true); -- filter nomor_tracking dilakukan di query aplikasi (.eq('nomor_tracking', input)),
                 -- BUKAN listing — pastikan API route TIDAK PERNAH expose endpoint list tanpa filter ini

create policy "Staf lihat & kelola semua" on pengaduan for all using (is_staf_aktif());
```

**PENTING soal policy SELECT pengaduan:** karena Postgres RLS tidak bisa membatasi "hanya boleh query dengan WHERE tertentu", pembatasan sebenarnya ada di **application layer** — endpoint publik `/api/pengaduan/cek-status` WAJIB mewajibkan parameter `nomor_tracking` dan tidak pernah meng-expose route yang mengembalikan list. Alternatif lebih aman: buat RPC function khusus (`get_pengaduan_by_tracking(nomor text)`) yang jadi satu-satunya jalan publik mengakses tabel ini, dan revoke direct select publik. **Rekomendasi: pakai pendekatan RPC function ini saat implementasi, bukan direct table select**, supaya tidak ada risiko lupa filter di suatu tempat.

## 8. `profil_kecamatan` (+ PPID, ASN, Maklumat Pelayanan, Kontak Kantor)

```sql
create table profil_kecamatan (
  id uuid primary key default gen_random_uuid(),

  -- Profil kecamatan
  nama_kecamatan text,                              -- dipakai di footer & metadata SEO
  sejarah text, sejarah_en text,
  visi text, visi_en text,
  misi text, misi_en text,
  jumlah_asn int,
  maklumat_pelayanan text, maklumat_pelayanan_en text,

  -- Kontak & operasional kantor (dikelola via admin panel, bukan hardcode)
  alamat text,                                      -- alamat lengkap kantor
  telepon text,                                     -- nomor telepon resmi
  email text,                                       -- email resmi
  jam_operasional text,                             -- e.g. "Senin–Jumat, 08.00–16.00 WIB"
  koordinat_lat float8,                             -- untuk embed peta OpenStreetMap
  koordinat_lng float8,

  -- PPID (statis — tanpa form permohonan, DECISIONS #15)
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
```

PPID sengaja tidak diberi kolom `_en` — versi minimal, dan kontennya bersifat prosedural-legal lokal (DECISIONS #15).

## 9. `data_statistik`

```sql
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
```

## 10. `user_invitations` (Alur Undangan & Setup Password One-Time Token)

```sql
create table user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nama_lengkap text not null,
  role text not null check (role in ('super_account', 'staf')),
  token_hash text not null unique,
  type text not null default 'invite' check (type in ('invite', 'reset_password')),
  user_id uuid references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_user_invitations_token_hash on user_invitations(token_hash);
create index idx_user_invitations_email on user_invitations(email);

alter table user_invitations enable row level security;

create policy "Super account bisa kelola user invitations"
  on user_invitations for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_account'));
```

## 11. Catatan Implementasi

- Trigger `updated_at` otomatis via extension `moddatetime` di semua tabel yang punya kolom itu.
- Generate `nomor_tracking`: alfanumerik 8 karakter, exclude karakter ambigu (`0/O`, `1/I`), cek `unique`, retry kalau collision.
- Job terjadwal (Supabase Edge Function + `pg_cron`) untuk set `diarsipkan_pada` otomatis 2 tahun setelah `status = 'selesai'` (DECISIONS #12) — bukan hapus permanen, cukup flag arsip.
- Storage bucket policy diatur terpisah dari RLS tabel: bucket gambar publik boleh dibaca umum, upload hanya via signed request dari staf yang login.
- **`profil_kecamatan` adalah single-row** — upsert, bukan insert biasa. Seed 1 baris kosong via `001_initial_schema.sql`, lalu staf mengisi via admin panel `/admin/profil`.
- **Kolom kontak kantor** (`alamat`, `telepon`, `email`, `jam_operasional`, `koordinat_lat/lng`, `nama_kecamatan`) di `profil_kecamatan` dikelola via admin panel — **tidak pernah hardcode di kode**. Jika sudah menjalankan `001`, jalankan juga `002_profil_kontak.sql` untuk menambah kolom ini ke environment yang sudah ada.

