# AGENTS.md

Website resmi kecamatan (Next.js + Supabase + Tailwind, bilingual ID/EN). Admin panel dipakai staf **awam teknis** — ini prioritas desain #1, di atas segalanya.

Dokumen lengkap ada di `docs/` — baca on-demand sesuai task, jangan diasumsikan sudah termuat di sini:
- `docs/PRD.md` — scope & fitur per modul
- `docs/ARCHITECTURE.md` — struktur teknis & alur data
- `docs/DATABASE_SCHEMA.md` — skema tabel (source of truth query)
- `docs/DECISIONS.md` — **kenapa** tiap keputusan diambil; cek sebelum "memperbaiki" sesuatu yang tampak aneh
- `docs/DESIGN.md` + `design/tokens.json` — sistem desain
- `docs/TASKS.md` — checklist progres, update setiap selesai satu item

## Command

```bash
npm run dev
npm run build     # next build --webpack; jalankan sebelum PR besar
npm run lint      # ESLint, harus 0 error
npm run typecheck # tsc --noEmit
npm run test       # Vitest, unit/component
npm run test:e2e    # Playwright, termasuk cek viewport 360px & alur form
```
`test:e2e` butuh env Supabase (lihat di bawah) dan browser Playwright (`npx playwright install chromium`). Tanpa env, tes RLS ditandai skipped, bukan lolos.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, jangan pernah expose ke client
NEXT_PUBLIC_SITE_URL=           # URL publik situs; di-inline saat build (CSRF logout, link undangan, sitemap, robots). Wajib di produksi.
SUPABASE_INTERNAL_URL=          # server-only, mis. http://kong:8000 (akses Supabase lewat jaringan Docker)
REVALIDATE_SECRET=              # server-only, untuk POST /api/revalidate
```
Template lengkap: `.env.example`. Deployment VPS: `docs/DEPLOYMENT.md`.

## Testing

Vitest (unit/component) + Playwright (E2E) — lihat `docs/DECISIONS.md` #23 untuk alasan pemilihannya. Playwright WAJIB dipakai untuk: uji viewport 360px, uji RLS lewat pemanggilan API sebagai user belum login, uji validasi form Pengaduan (kosong/invalid). Jangan anggap task selesai kalau perubahan yang relevan belum ada test-nya atau belum dijalankan.

## Konvensi Kode

- Struktur folder ikuti `docs/ARCHITECTURE.md` §3 — jangan improvisasi struktur baru tanpa alasan kuat.
- Penamaan file: kebab-case. Komponen React: PascalCase.
- Validasi form: `zod` + `react-hook-form`, konsisten di semua form (publik maupun admin).
- Query Supabase lewat helper `/lib/supabase` — jangan instansiasi client baru di file lain.
- Next.js App Router: default Server Component, cuma pakai `"use client"` kalau benar-benar butuh interaktivitas browser (state, event handler, hooks).

## Repository Etiquette

Jangan push langsung ke `main`. Kerja di branch, buka PR, biarkan Vercel preview deployment jalan dulu sebelum merge. Commit message deskriptif, bukan generik ("fix bug").

## Aturan Wajib

1. Semua teks UI publik & admin: Bahasa Indonesia, non-teknis ("Terbitkan" bukan "Publish").
2. RLS aktif di SEMUA tabel Supabase sejak dibuat. Tidak ada pengecualian.
3. Sebelum menambah field/menu ke admin panel, tanya: staf awam teknis benar-benar butuh ini? Default ke tidak — baca `.claude/skills/admin-ux-check/SKILL.md` sebelum bikin layar admin baru.
4. Tabel baru / ubah RLS → baca `.claude/skills/rls-review/SKILL.md` dulu.
5. Tabel baru yang punya field bilingual → baca `.claude/skills/i18n-content/SKILL.md`.
6. UI baru → baca `.claude/skills/design-system/SKILL.md` + `docs/DESIGN.md`. Tidak ada hex/font hardcode di luar `design/tokens.json`.
7. Halaman publik tidak boleh render kosong/error saat data belum ada — selalu placeholder eksplisit.
8. Jangan pernah karang data faktual (statistik, nama pejabat, syarat layanan) — kalau belum ada datanya, tandai TODO dan tanya user.
9. Jangan commit env var/API key apa pun.
10. `pengaduan`: publik hanya boleh INSERT dan SELECT via RPC dengan `nomor_tracking` exact match — tidak pernah expose endpoint list tanpa filter itu.

## Verifikasi

Jangan lapor selesai kalau cuma "kelihatannya jadi". Tiap perubahan skema/RLS wajib dites dengan role `anon` sebelum commit (lihat `.claude/skills/rls-review/SKILL.md`). Untuk kerja berisiko tinggi (auth, RLS, tabel `pengaduan`), delegasikan review ke subagent Claude Code `.claude/agents/rls-reviewer.md` sebelum commit — jangan cuma mereview diri sendiri.

## Alur Kerja

Sebelum mulai task: cek `docs/TASKS.md` untuk status terkini, cek `docs/DECISIONS.md` kalau ada keputusan yang relevan sudah pernah diambil. Setelah selesai: jalankan test terkait, centang item di `docs/TASKS.md`, update `docs/DATABASE_SCHEMA.md` kalau ada perubahan skema.

Ambigu soal data faktual kecamatan atau kebijakan hosting/legal? Tanya user — jangan asumsikan.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
