# Website Resmi Kecamatan Duampanua

Platform portal resmi untuk pemerintah Kecamatan Duampanua. Dibangun dengan fokus pada kemudahan pengelolaan oleh staf kecamatan (awam teknis), performa tinggi di jaringan lambat, dan dukungan bahasa hibrida (Indonesia & Inggris).

## ✨ Fitur Utama

### 👥 Publik (Warga)
- **Informasi & Layanan**: Akses profil wilayah, informasi publik, standar pelayanan, edaran dokumen, dan data statistik.
- **Pengaduan Masyarakat**: Sistem lapor terintegrasi dengan nomor tracking unik, fitur cek status mandiri, dan perlindungan privasi (anti-spam, rate limit, honeypot).
- **Dukungan Bilingual (Hibrida)**: URL `/en/` tersedia dengan fallback otomatis ke bahasa Indonesia untuk menjaga konsistensi SEO tanpa mengandalkan API berbayar.
- **Responsif & Ringan**: Akses lancar melalui perangkat seluler sekalipun dengan koneksi lambat.

### 🔒 Admin Panel (Staf & Super Account)
- **Dashboard Sederhana**: UX yang khusus didesain agar mudah digunakan oleh staf awam teknis.
- **Manajemen Konten Fleksibel**: Kemudahan dalam menerbitkan Berita, Informasi Publik, Standar Pelayanan, Potensi Daerah, dan Edaran.
- **Manajemen Pengguna (Super Account)**: Keamanan akses ketat di mana hanya `super_account` yang dapat mengundang via One-Time Setup Token dan mencabut akses staf.
- **Arsip Pengaduan**: Manajemen status laporan masyarakat dengan retensi keamanan data (kepatuhan UU PDP).

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons
- **BaaS & Database**: Supabase (PostgreSQL, Auth, Storage) dengan Row Level Security (RLS) pada semua tabel
- **Form & Validasi**: React Hook Form, Zod
- **Lokalisasi (i18n)**: next-intl
- **Testing**: Vitest (Unit/Komponen), Playwright (E2E)
- **Deployment**: Local VPS (Ubuntu Server)

## 🚀 Setup & Instalasi Lokal

**1. Prasyarat**
- Node.js versi 20+
- Akun [Supabase](https://supabase.com) (atau setup instance Supabase lokal)

**2. Instalasi Dependensi**
```bash
npm install
```

**3. Konfigurasi Environment Variables**
Buat duplikat dari file `.env.example` menjadi `.env.local` dan isi nilainya.
```bash
cp .env.example .env.local
```
*(Jangan pernah men-commit `.env.local` atau kunci `service_role` ke repositori).*

**4. Setup Database Supabase**
- Buka dashboard proyek Supabase Anda.
- Jalankan skrip SQL di `supabase/migrations/001_initial_schema.sql` (atau ikuti referensi di `docs/DATABASE_SCHEMA.md`).
- Pastikan semua tabel memiliki status RLS (Row Level Security) yang aktif.
- **Seeding Akun**: Daftarkan akun pertama (`super_account`) melalui dashboard Supabase Auth, kemudian tambahkan data profil manual ke tabel `profiles` sesuai instruksi di dokumentasi.

**5. Jalankan Development Server**
```bash
npm run dev
```
Aplikasi dapat diakses di `http://localhost:3000`.

## 🧪 Testing

Proyek ini mewajibkan loop verifikasi. Terdapat uji unit (komponen) dan E2E (UI/UX dan alur autentikasi/pengaduan).

```bash
# Menjalankan unit dan component test (Vitest)
npm run test

# Menjalankan pengujian E2E (Playwright)
npm run test:e2e
```

## 📁 Struktur Proyek (Garis Besar)

- `/app`: Root aplikasi Next.js (App Router). Terbagi atas `/[locale]/(public)` untuk akses publik dan `/admin` untuk staf.
- `/components`: Komponen React reusable (dipisah antara `public`, `admin`, dan `ui`).
- `/lib`: Helper fungsi dan client Supabase (termasuk `server.ts` dan `admin.ts` ber-privilege tinggi).
- `/design`: Konfigurasi token desain dan tema warna untuk Tailwind CSS.
- `/docs`: Penyimpanan pusat kebenaran proyek.

## 📖 Referensi Dokumentasi

Sebelum mengubah arsitektur, mengubah database, atau menambahkan fitur baru, **wajib membaca referensi yang tepat** di bawah folder `docs/`:

| Dokumen | Deskripsi |
|---|---|
| [`PRD.md`](docs/PRD.md) | Cakupan fungsional, fitur lengkap per fase, target pengguna, dan metrik. |
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Panduan alur data utama, pola arsitektur, autentikasi, dan direktori. |
| [`DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Referensi absolut skema tabel PostgreSQL dan relasinya. |
| [`DECISIONS.md`](docs/DECISIONS.md) | *Log ADR (Architecture Decision Record)*: Berisi **alasan di balik seluruh keputusan penting**. Wajib dibaca sebelum merevisi fitur yang sudah ada. |
| [`DESIGN.md`](docs/DESIGN.md) | Sistem desain, prinsip UX (terutama untuk admin panel), dan konvensi UI. |
| [`TASKS.md`](docs/TASKS.md) | Checklist riwayat progres *development* (berguna sebagai referensi status). |
| [`AGENTS.md`](AGENTS.md) | Aturan sistem mutlak dan rutinitas wajib saat proyek diurus oleh AI Agentic Coding (seperti Claude Code, Cursor, dst). |

## 🌐 Deployment

Proyek ini dioptimalkan untuk di-deploy di **Vercel** melalui integrasi GitHub (*auto-deploy* dari branch `main`). 

**Perhatian Khusus Deployment Resmi**: 
Pendelegasian domain pemerintah (`.go.id`) dan kebijakan infrastruktur wajib disesuaikan dengan instruksi *Diskominfo* daerah setempat (harap referensikan `DECISIONS.md #2` untuk detail mengenai opsi *Vercel vs PDN*).
