---
name: rls-review
description: Gunakan skill ini SEBELUM membuat tabel Supabase baru, atau mengubah RLS policy tabel yang sudah ada. Wajib dibaca sebelum menulis SQL migration apa pun di proyek ini.
---

# RLS Review Checklist

Setiap tabel baru wajib melewati checklist ini sebelum di-merge. Rujukan pola yang sudah ada: `docs/DATABASE_SCHEMA.md`.

1. **RLS aktif sejak `CREATE TABLE`?** Tidak ada tabel yang boleh hidup tanpa `alter table ... enable row level security` di migration yang sama.
2. **Siapa yang boleh SELECT?** Publik biasanya cuma boleh baca baris `status = 'published'` (atau `true` kalau tabel tidak punya konsep draft, seperti `dokumen_edaran`). Jangan pernah `using (true)` untuk tabel yang mengandung data pribadi (lihat poin 4).
3. **Siapa yang boleh INSERT/UPDATE/DELETE?** Pakai helper `is_staf_aktif()` (sudah didefinisikan di `docs/DATABASE_SCHEMA.md` §1) untuk tabel konten. Untuk aksi khusus `super_account` (kelola user), cek role eksplisit, jangan cuma `auth.uid() is not null`.
4. **Ada data pribadi (nama, kontak, alamat)?** Kalau ya (contoh: `pengaduan`), publik TIDAK BOLEH bisa listing semua baris. Kalau butuh akses publik terbatas (misal cek status via nomor tracking), pakai **RPC function** dengan parameter eksplisit, bukan direct table SELECT dengan policy `using (true)` — RLS Postgres tidak bisa membatasi "hanya boleh WHERE tertentu" di level SQL biasa.
5. **Sudah dites dengan role yang salah?** Coba akses tabel sebagai `anon` (belum login) dan pastikan tidak bisa lakukan aksi yang seharusnya cuma boleh staf.
6. **Update `docs/DATABASE_SCHEMA.md`** di commit yang sama — dokumen itu harus selalu mencerminkan skema aktual, bukan cuma niat awal.

## Anti-pattern yang sering kejadian

- Lupa `enable row level security` sama sekali (tabel jadi terbuka total secara default kalau RLS belum diaktifkan tapi ada policy — Postgres tetap deny-by-default begitu RLS on, tapi kalau lupa `enable`, semua bisa diakses).
- Policy SELECT publik pakai `using (true)` untuk tabel yang punya kolom kontak/nama pribadi.
- Cek role di level komponen React doang tanpa RLS yang sepadan di database.
