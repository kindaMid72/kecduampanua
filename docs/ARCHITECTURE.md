# Arsitektur Teknis

Rujukan alasan keputusan: `docs/DECISIONS.md`. Skema tabel lengkap: `docs/DATABASE_SCHEMA.md`.

## 1. Stack

Next.js (App Router, TS) + Tailwind + Supabase (Postgres, Auth, Storage) + Vercel + `next-intl` (routing `/id`, `/en`) + Google Cloud Translation API.

## 2. Prinsip Desain Arsitektur

1. Admin panel sesederhana mungkin — setiap field/menu diuji dari sudut pandang staf awam teknis (lihat skill `admin-ux-check`).
2. RLS di level database untuk semua tabel, bukan cuma kontrol di UI.
3. Halaman publik render placeholder yang jelas untuk data kosong, tidak pernah crash/kosong tanpa keterangan.
4. Public-facing pages SSG/ISR, di-revalidate on-demand saat staf publish (bukan time-based).

## 3. Struktur Proyek

```
/app
  /[locale]/(public)
    /page.tsx                      Beranda
    /profil/page.tsx               Sejarah, visi-misi, struktur, ASN, PPID
    /profil/ppid/page.tsx
    /standar-pelayanan/page.tsx    (dulu "layanan")
    /informasi/page.tsx
    /informasi/[slug]/page.tsx
    /data-statistik/page.tsx
    /potensi-daerah/page.tsx
    /galeri/page.tsx
    /edaran-dokumen/page.tsx
    /edaran-dokumen/[id]/page.tsx
    /pengaduan/page.tsx
    /pengaduan/cek-status/page.tsx
    /kontak/page.tsx
  /admin
    /login/page.tsx
    /atur-kata-sandi/page.tsx      set/reset password dari link invite/recovery
    /dashboard/page.tsx
    /informasi-publik/...
    /standar-pelayanan/...
    /potensi-daerah/...
    /galeri/...
    /edaran-dokumen/...
    /pengaduan/...                 dashboard status
    /pengguna/page.tsx             khusus super_account
  /api
    /pengaduan/route.ts            submit publik (rate limit + honeypot)
    /revalidate/route.ts           dipanggil admin setelah publish/edit/hapus
    /translate/route.ts            wrapper Cloud Translation API

/components
  /public   /admin   /ui           (lihat docs/DESIGN.md untuk konvensi styling)

/lib
  /supabase/{client,server,admin}.ts   admin.ts pakai service role, server-only
  /translate.ts                        helper panggil Cloud Translation API
  /validations                         skema zod per form

/design/tokens.json                     source of truth desain (lihat DESIGN.md)
/messages/{id,en}.json                  dictionary next-intl (UI statis)
```

## 4. Autentikasi & Otorisasi

- Login: Supabase Auth email+password. Tidak ada self-registration.
- Role di tabel `profiles`: `super_account` | `staf`, plus `status`: `aktif`/`nonaktif`.
- Middleware (`middleware.ts`) proteksi semua route `/admin/*`, redirect ke login jika belum sesi.
- Menu "Kelola Pengguna" hanya render untuk role `super_account` — tapi proteksi **juga** di RLS, bukan cuma disembunyikan di UI.

**Alur invite** (hanya oleh `super_account`):
```
Form: email + role
→ server action → supabaseAdmin.auth.admin.generateLink({ type: 'invite', email,
    options: { redirectTo: '<domain>/admin/atur-kata-sandi' } })
→ insert profiles (role, status: 'aktif')
→ UI tampilkan action_link + tombol "Salin Tautan"
→ super_account kirim manual (WA/email)
→ staf buka link → set password sendiri di /admin/atur-kata-sandi
```

**Alur reset password**: sama, `generateLink({ type: 'recovery', ... })`.

**Cabut akses**: `supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '87600h' })` + `profiles.status = 'nonaktif'`.

## 5. Bilingual (EN/ID)

**Lapis 1 — UI statis** (nav, tombol, label): `next-intl`, dictionary `/messages/id.json` & `/messages/en.json`, diterjemahkan sekali oleh developer. Routing `/id/...` `/en/...` dengan `hreflang` untuk SEO.

**Lapis 2 — konten dinamis**: kolom `_en` nullable di tiap tabel yang butuh (lihat DATABASE_SCHEMA.md). Alur:
```
Staf simpan konten (ID) → server action panggil Cloud Translation API
→ hasil simpan ke kolom _en (otomatis)
→ /en/... render dari kolom _en (teks asli, bukan overlay — SEO tetap jalan)
→ kalau API gagal/timeout: _en tetap null → fallback render versi Indonesia
→ staf BISA edit manual field _en kalau perlu koreksi (bukan read-only)
```
Field syarat/alur di Standar Pelayanan: tampilkan badge "Terjemahan otomatis — perlu ditinjau" di admin (non-blocking). Edaran Dokumen: tidak ada kolom `_en` sama sekali.

## 6. Alur Data Utama

**Publish konten**: `Staf/Super Account isi form → submit → insert/update status published langsung (tidak ada approval layer) → auto-translate → revalidatePath dipanggil → halaman publik ter-update`.

**Pengaduan**: `Warga isi form (lolos honeypot + rate limit) → insert (status: baru, nomor_tracking di-generate unik) → tampil nomor tracking ke warga → staf lihat/ubah status di dashboard admin → warga cek status lewat /pengaduan/cek-status`. Cek status **wajib** lewat RPC function `get_pengaduan_by_tracking(nomor text)` (bukan direct table SELECT) — lihat `docs/DATABASE_SCHEMA.md` §7 dan `.claude/skills/rls-review/SKILL.md` poin 4 untuk alasannya (RLS Postgres biasa tidak bisa membatasi "hanya boleh WHERE tertentu").

## 7. Deployment & Domain

1. GitHub → Vercel auto-deploy (preview per branch, production di `main`).
2. Domain go.id → DNS pointing ke Vercel — **tunduk konfirmasi Diskominfo** (DECISIONS #2). Kalau wajib PDN, bagian ini perlu direvisi total (kemungkinan container/VM manual, bukan PaaS).
3. Env vars di Vercel Project Settings, tidak pernah commit ke repo.

## 8. Storage & Performa Gambar

Client-side compress (`browser-image-compression`, target ~400KB, max 1600px) sebelum upload ke bucket Supabase Storage (`informasi-images`, `galeri-images`, `struktur-organisasi`, `potensi-daerah-images`). `next/image` untuk semua render.

## 9. Anti-Spam Pengaduan

Honeypot field tersembunyi (bot mengisi, manusia tidak) + rate limit per IP (maks 3 submit/jam) via Vercel Edge Middleware. Tidak pakai Cloudflare Turnstile (DECISIONS #14).

## 10. SEO Dasar

Metadata per halaman via Next.js Metadata API, `sitemap.xml` auto dari data informasi+layanan (kedua locale), `robots.txt` standar, `hreflang` untuk `/id` `/en`.

## 11. Testing

Vitest untuk unit/component test (`/components/ui`, helper `/lib`), Playwright untuk E2E (DECISIONS #23). Playwright wajib mencakup: emulasi viewport 360px di setiap halaman publik baru, pemanggilan RPC `get_pengaduan_by_tracking` sebagai user anonim untuk memverifikasi tidak bisa listing data, dan uji validasi form Pengaduan (kosong/invalid). Command ada di `AGENTS.md`.

## 12. Hal yang Sengaja Tidak Dibangun di Fase 1

Notifikasi email/WA otomatis pengaduan, form permohonan informasi PPID digital, integrasi API SP4N-LAPOR!, search full-text kompleks (cukup filter kategori + `ilike` judul).
