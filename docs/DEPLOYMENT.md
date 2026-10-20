# DEPLOYMENT — Web + Supabase di satu VPS

Dokumen ini adalah **kontrak sisi aplikasi** untuk deployment self-hosted. Reverse proxy (nginx/TLS), stack Supabase, backup, dan firewall dikelola di repo infra terpisah (`duampanua-infra`) — alasannya di `DECISIONS.md` #28. Repo ini hanya berisi `Dockerfile` dan `docker-compose.yml` untuk **container web saja**.

> Status: deployment ke domain produksi **belum boleh** dilakukan sebelum keputusan hosting Diskominfo final (`DECISIONS.md` #2).

## 1. Arsitektur

```
Internet ─► :80/:443  edge (nginx, TLS)                 ← satu-satunya yang publish port
              ├─ domain.id        ─► web-duampanua:3000   (jaringan edge-net)
              └─ api.domain.id    ─► kong:8000            (hanya path allowlist)
                                       │
            web-duampanua ──(SUPABASE_INTERNAL_URL)──► kong ─► auth / rest / storage ─► Postgres
                  (jaringan supabase-net, internal)
```

- **Browser** bicara ke `https://api.domain.id` (auth, upload Storage, baca data admin).
- **Server Next.js** (SSR, middleware, server action) bicara ke Supabase lewat jaringan Docker internal (`SUPABASE_INTERNAL_URL=http://kong:8000`).
- Postgres, pooler, Studio **tidak** di-route ke internet.

## 2. Hal yang wajib dipenuhi reverse proxy (edge)

| Syarat | Alasan |
|---|---|
| `proxy_set_header X-Real-IP $remote_addr;` (menimpa, bukan meneruskan) | Rate limiter pengaduan memakai `x-real-ip`. Kalau header dari klien diteruskan, limit bisa dilewati dengan memalsukan IP. |
| `proxy_set_header Host $host;` dan `X-Forwarded-Proto $scheme;` | Redirect/URL absolut dan cookie `Secure` bergantung padanya. |
| Port 3000 container web **tidak** di-publish ke host | Kalau terbuka, `x-real-ip` bisa dipalsukan langsung ke aplikasi. |
| Hanya path ini yang diteruskan ke Kong di `api.domain.id`: `/auth/v1/`, `/rest/v1/`, `/storage/v1/` (+ `/realtime/v1/` bila Realtime dipakai) | Studio, pg-meta (`/pg/`), dan endpoint lain tidak boleh publik. |
| `/rest/v1/rpc/` **diblok** di edge publik | Browser tidak memanggil RPC mana pun; semua RPC (cek status pengaduan, rate limit) dipanggil server lewat jaringan internal. **Hanya aman jika `SUPABASE_INTERNAL_URL` terisi.** |
| Rate limit: `/auth/v1/` ketat, halaman/POST umum longgar | Brute force login, spam. |
| HSTS, TLS 1.2+, `server_tokens off` | Dasar hardening. |
| Port 80/443 bebas | Overlay `docker-compose.nginx.yml` bawaan Supabase juga mengambil 80/443 — **jangan dipakai bersamaan** dengan edge ini. Pilih satu edge. |

Config referensi: `duampanua-infra/edge/nginx.conf`.

## 3. Variabel environment

Lihat `.env.example`. Dua golongan yang sering salah dipahami:

- **Build-time** (`NEXT_PUBLIC_*`): di-inline Next.js ke bundle saat `npm run build`. Diberikan sebagai `build.args` di compose. **Mengubahnya berarti build ulang image** (`docker compose build`), mengubah `.env` lalu `up -d` saja tidak cukup.
- **Runtime** (secret): `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`, `SUPABASE_INTERNAL_URL`. Hanya ada di environment container, tidak masuk image.

`NEXT_PUBLIC_SITE_URL` dipakai untuk: pengecekan Origin logout (CSRF), URL redirect logout, link undangan/reset password, sitemap, robots. Salah isi = logout 403 atau link undangan salah domain.

Cookie sesi bernama tetap `sb-duampanua-auth` (`lib/supabase/config.ts`) supaya sesi terbaca oleh browser **dan** server walau mereka memakai URL Supabase yang berbeda. Mengubah nama ini memaksa semua admin login ulang.

## 4. Urutan deployment pertama

1. Hardening VPS + firewall (hanya 22/80/443) — lihat README repo infra.
2. Jalankan stack Supabase dengan override port (§5). Ganti **semua** secret default.
3. `docker network create edge-net`; catat nama jaringan Supabase (`docker network ls`) → `SUPABASE_NETWORK` di `.env`.
4. Terapkan migrasi `supabase/migrations/001`–`014` ke database (urut, sebagai `supabase_admin`). Tinjau §7 sebelum 013/014.
5. Salin `.env.example` → `.env` (`chmod 600`), isi nilainya.
6. `docker compose build && docker compose up -d`; tunggu status `healthy`.
7. Nyalakan edge (nginx), terbitkan sertifikat.
8. Uji dari luar VPS: `nmap` hanya 22/80/443; `https://domain.id` jalan; login admin; kirim & cek status pengaduan; upload gambar.

## 5. Stack Supabase: yang harus diubah dari bawaan

Compose bawaan Supabase (`self-hosted/v0.7.2`) mem-publish port ke **semua interface** host:

- Kong: `${KONG_HTTP_PORT}:8000`, `${KONG_HTTPS_PORT}:8443`
- Postgres/pooler: `${POSTGRES_PORT}:5432`, `${POOLER_PROXY_PORT_TRANSACTION}:6543`

Docker melewati aturan UFW, jadi port ini **terbuka ke internet** walau UFW menutupnya. Pakai file override (jangan edit compose upstream; `duampanua-infra/supabase/docker-compose.override.yml`) yang mengosongkan `ports` Kong dan mengikat pooler ke `127.0.0.1`. Studio diakses lewat SSH tunnel/VPN, bukan domain publik.

Secret yang wajib diganti dari nilai contoh: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY` (harus ditandatangani dengan `JWT_SECRET` baru), `SECRET_KEY_BASE`, `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY`, `DASHBOARD_PASSWORD`. Set juga `SITE_URL` / `API_EXTERNAL_URL` ke domain publik, dan konfigurasi SMTP (tanpa SMTP, undangan dan reset password tidak terkirim).

## 6. Query yang berjalan di browser — hasil audit

| Lokasi | Apa yang dilakukan | Penilaian |
|---|---|---|
| `kontak/pengaduan/page.tsx` (publik) | **Sebelumnya** `.from("pengaduan").select()` langsung dari browser | **Diperbaiki.** RLS memblokir SELECT anon, jadi fitur selalu menjawab "tidak ditemukan"; selain itu melanggar aturan #10. Sekarang lewat Server Action `cekStatusPengaduanAction` → RPC `get_pengaduan_by_tracking` (service role), dengan validasi format `PND-…` dan rate limit 20/10 menit per IP, fail-closed. |
| `submitPengaduanAction` | Cek keunikan nomor via SELECT, lalu INSERT sebagai anon | **Diperbaiki.** SELECT tidak pernah menemukan apa pun (RLS), dan INSERT anon langsung ke REST bisa mengisi kolom staf. Sekarang INSERT lewat service role (014 mencabut INSERT anon), keunikan lewat UNIQUE + retry `23505`. |
| `FileUpload` / `ImageUpload` / `VideoUpload` | Upload ke Storage dari browser (sesi staf) | Tetap di browser (file besar tidak lewat server). Pengamannya policy Storage — diperketat di migrasi 013 (staf **aktif**, batas ukuran, whitelist tipe, tanpa SVG). |
| Halaman admin `[id]/ubah`, `profil`, `PejabatSection` | `.from(tabel).select("*")` dari browser | Aman **selama RLS benar** (`is_staf_aktif()`), karena anon key memang publik. Bisa dipindah ke Server Component sebagai perbaikan lanjutan (bukan blocker). |
| `pengguna/page.tsx` | `auth.getUser()` | Normal. |

Prinsipnya: anon key ada di bundle browser, jadi **PostgREST harus dianggap terbuka untuk siapa pun**. Keamanan datang dari RLS dan hak EXECUTE function, bukan dari "tidak ada query di client".

## 7. Dampak migrasi 013 dan 014 (baca sebelum menerapkan)

Jalankan **sebagai pemilik function/tabel** (`supabase_admin`), tiap file dalam satu transaksi (sudah `begin; … commit;`). Dijalankan role lain, `ALTER FUNCTION` gagal dan `REVOKE` hanya memberi WARNING tanpa efek. Verifikasi setelahnya:

```sql
select r, has_function_privilege(r,'public.check_rate_limit(text,int,int)','execute') as rl,
          has_function_privilege(r,'public.get_pengaduan_by_tracking(text)','execute') as cek
from unnest(array['anon','authenticated','service_role']) r;   -- hanya service_role = true
select p.oid::regprocedure, pg_get_userbyid(p.proowner), p.proconfig
from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef;
```

**013 — hardening** (tidak mengubah policy tabel data):
1. `check_rate_limit` dan `get_pengaduan_by_tracking` hanya untuk `service_role`; `search_path` dikunci pada 4 function `SECURITY DEFINER`.
2. Bucket `uploads`: 20 MB dan whitelist tipe; tulis/ubah/hapus hanya `is_staf_aktif()`; SELECT hanya staf aktif (anon tidak bisa lagi me-list isi bucket).

**014 — tutup eskalasi hak** (menyentuh `profiles`, `user_invitations`, `pengaduan`):
1. Trigger menolak perubahan `role`/`status` pada `profiles` oleh user biasa (staf tidak bisa jadi Pengelola atau mengaktifkan dirinya sendiri).
2. Policy `user_invitations` mensyaratkan Pengelola **aktif**.
3. `anon` tidak lagi boleh INSERT langsung ke `pengaduan`.

Risiko dan yang perlu dicek setelah menerapkan:
- Format gambar lain (HEIC, SVG) dan `.mov` ditolak server; UI sudah menolaknya dengan pesan Indonesia.
- Staf `nonaktif` tidak bisa unggah, dan login-nya dikunci di GoTrue (ban). Pengguna yang dinonaktifkan **sebelum** perbaikan ini belum ter-ban: nonaktifkan-lalu-aktifkan ulang sekali, atau ban manual.
- Pengaduan kini butuh `SUPABASE_SERVICE_ROLE_KEY` di server untuk menyimpan (insert) dan memeriksa status. Tanpa itu: submit gagal dengan pesan umum, cek status menjawab "layanan tidak tersedia".
- Wajib dites sebagai `anon` (`.claude/skills/rls-review/SKILL.md`) dan direview `rls-reviewer` sebelum commit/terapkan. Uji Playwright: `e2e/rls.spec.ts`.

## 8. Backup & pemeliharaan (ringkas)

- Self-hosted tidak punya backup otomatis: `pg_dump` terjadwal **dan** folder Storage, salinan terenkripsi ke luar VPS, uji restore berkala. Skrip contoh di repo infra.
- Pin versi image; update terencana (uji di staging dulu).
- Hapus baris lama `rate_limits` berkala (`delete ... where window_start < now() - interval '1 day'`).
- Monitoring eksternal (uptime) pada `https://domain.id/api/health`.

## 9. Status audit keamanan (Oktober 2026)

Temuan `rls-reviewer` (DECISIONS #33) sudah ditutup **di kode** oleh migrasi 013/014 dan perubahan server (DECISIONS #34), terbukti pada Postgres Supabase uji. **Belum diterapkan ke database mana pun — jangan deploy ke produksi sebelum 013 dan 014 diterapkan dan diverifikasi**, dan `rls-reviewer` meninjau ulang 014.

Yang masih harus dikerjakan di infra: `DISABLE_SIGNUP=true` di GoTrue; uji dari luar VPS varian path (`/rest/v1//rpc/...`, `/graphql/v1`) setelah edge menyala; audit objek lama di bucket terhadap whitelist (`select name, metadata->>'mimetype' from storage.objects where bucket_id='uploads'`). Blokir `/rest/v1/rpc/` di edge kini lapisan tambahan (RPC sudah tertutup di DB), tetapi **`SUPABASE_INTERNAL_URL` tetap wajib terisi**: server memanggil RPC (`check_rate_limit`, `get_pengaduan_by_tracking`) dan melakukan INSERT lewat jalur internal; lewat edge, RPC itu diblok.

## 10. Catatan yang belum bisa diverifikasi

- Build memakai `next build --webpack`; pastikan tidak ada halaman yang memanggil Supabase saat build (build image tadi lolos dengan URL dummy, jadi saat ini tidak).
- Mekanisme revalidasi: `/api/revalidate` kini butuh `REVALIDATE_SECRET`. Belum ada pemanggilnya di repo; saat dipasang (mis. DB webhook), pakai secret itu, bukan service role key.
- Yang SUDAH dites: build image + run (health, CSRF logout, revalidate, redirect admin), middleware membaca `SUPABASE_INTERNAL_URL` dan cookie bernama tetap, migrasi 001–014 di Postgres Supabase dengan role `anon`/`authenticated`/`service_role` dan staf aktif/nonaktif/Pengelola, `nginx -t`, merge override Supabase, 64 unit test. Yang BELUM: alur login/upload/pengaduan end-to-end dengan Supabase hidup di VPS, routing nginx dengan trafik nyata, `backup.sh` dan restore, uji Playwright RLS terhadap instance nyata.
