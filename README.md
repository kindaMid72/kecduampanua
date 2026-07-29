# Website Resmi Kecamatan

Next.js + Supabase + Tailwind. Bilingual (Indonesia/Inggris, auto-translate). Dikelola staf kecamatan lewat admin panel yang sengaja dibikin sesederhana mungkin.

## Setup Lokal

```bash
npm install
cp .env.example .env.local   # isi kredensial Supabase & Google Translate API
npm run dev
npm run test        # Vitest
npm run test:e2e     # Playwright
```

## Dokumentasi

| File | Isi |
|---|---|
| `docs/PRD.md` | Fitur & scope lengkap |
| `docs/ARCHITECTURE.md` | Struktur teknis |
| `docs/DATABASE_SCHEMA.md` | Skema database Supabase |
| `docs/DECISIONS.md` | Kenapa tiap keputusan besar diambil |
| `docs/DESIGN.md` + `design/tokens.json` | Sistem desain |
| `docs/TASKS.md` | Checklist progres development, dengan prasyarat & kriteria selesai per fase |
| `AGENTS.md` | Panduan portable untuk AI coding agent apa pun (command, testing, konvensi kode, aturan wajib) |
| `CLAUDE.md` | Import `AGENTS.md` + tambahan spesifik Claude Code |
| `.claude/skills/*` | Pengetahuan yang dimuat on-demand: rls-review, admin-ux-check, i18n-content, design-system |
| `.claude/agents/rls-reviewer.md` | Subagent review keamanan RLS dengan context terpisah |

## Setup Database

Jalankan seluruh SQL di `docs/DATABASE_SCHEMA.md` lewat Supabase SQL Editor (urutan sesuai penomoran di dokumen, karena ada foreign key antar tabel). Seed 1 akun `super_account` pertama secara manual di Supabase Auth dashboard, lalu insert row terkait di tabel `profiles`.

## Deployment

Push ke `main` → auto-deploy Vercel. **Sebelum deploy production**, pastikan kebijakan hosting Diskominfo (Vercel vs PDN) sudah dikonfirmasi — lihat `docs/DECISIONS.md` #2.
# kecduampanua
