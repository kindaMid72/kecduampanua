---
name: design-system
description: Gunakan skill ini setiap kali membangun atau mengubah UI/komponen visual apa pun di proyek ini (halaman publik maupun admin). Baca sebelum menulis className Tailwind atau CSS baru.
---

# Design System — Cara Pakai

Sumber nilai: `design/tokens.json` (jangan hardcode hex/font di komponen manapun). Rationale & aturan lengkap: `docs/DESIGN.md`. Baca DESIGN.md secara penuh kalau ini pertama kali menyentuh UI di sesi ini — skill ini cuma ringkasan cepat.

## Urutan kerja saat bikin UI baru

1. Cek `/components/ui` dulu — apakah komponen yang dibutuhkan sudah ada (Button, Card, Badge, PapanInformasiPanel, SectionDivider, CategoryLabel)? Pakai ulang, jangan tulis styling dari nol.
2. Kalau butuh varian baru dari komponen yang sudah ada, tambah prop — jangan duplikat komponen.
3. Kalau benar-benar komponen baru: ambil warna/font/spacing dari `design/tokens.json` lewat Tailwind theme (`tailwind.config.ts`), bukan nilai literal.
4. Cek elemen signature (`design/tokens.json` → `signature_elements`) — Papan Informasi HANYA di Beranda, jangan diulang di halaman lain.
5. Cek `motion.allowed` di tokens.json sebelum menambah animasi apa pun. Kalau tidak ada di daftar itu, jangan tambahkan — lihat `docs/DESIGN.md` bagian Motion untuk alasannya (audiens lansia/awam teknis + koneksi lambat).
6. Sebelum selesai: jalankan checklist di `docs/DESIGN.md` §"Checklist Sebelum Merge UI Baru" (kontras, viewport 360px, tidak ada data fiktif, dst).

## Pengingat penting

Jangan pakai skill `taste-design` (Google Stitch) untuk proyek ini — itu dikalibrasi untuk estetika SaaS premium yang bertentangan langsung dengan kebutuhan situs pemerintah formal ini (lihat `docs/DECISIONS.md` #20 untuk detail konfliknya).
