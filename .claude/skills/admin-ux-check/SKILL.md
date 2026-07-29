---
name: admin-ux-check
description: Gunakan skill ini SEBELUM membangun atau mengubah layar admin panel apa pun (form, tabel, menu, dialog). Wajib dicek sebelum menambah field/opsi baru ke UI admin.
---

# Admin UX Check — Perspektif Staf Awam Teknis

Target pengguna admin panel ini adalah staf kecamatan yang **tidak** punya latar belakang teknis. Ini bukan dashboard developer.

## Sebelum menambah field/tombol/menu baru, tanyakan:

1. **Apakah staf benar-benar butuh kontrol ini?** Kalau nilainya bisa di-hardcode atau di-generate otomatis (slug, timestamp, ID), jangan expose ke form. Default: sembunyikan, bukan tampilkan "kalau-kalau butuh".
2. **Apakah labelnya pakai istilah teknis?** "Slug", "metadata", "publish", "deploy" — TIDAK BOLEH nongol di UI. Ganti ke Bahasa Indonesia non-teknis: "Terbitkan" bukan "Publish", "Tautan halaman" bukan "Slug" (dan idealnya slug di-generate otomatis dari judul, staf tidak perlu mikirinnya sama sekali).
3. **Apakah alurnya linear?** Staf harus bisa selesai satu tugas (misal: terbitkan pengumuman) dengan urutan langkah yang jelas dari atas ke bawah, tanpa perlu lompat-lompat tab atau memahami konsep abstrak (draft vs published vs archived — kalau memang perlu status, jelaskan dengan bahasa manusia, bukan enum mentah).
4. **Apa yang terjadi kalau staf salah klik?** Ada konfirmasi untuk aksi destruktif (hapus)? Ada cara mudah membatalkan?
5. **Apakah pesan error dalam Bahasa Indonesia yang jelas?** Bukan pesan error teknis mentah dari Supabase/Postgres.
6. **Kalau ada field opsional (misal terjemahan Inggris auto-generate) — apakah staf paham itu opsional dan tidak wajib disentuh?** Field itu harus terlihat sudah terisi otomatis, bukan kotak kosong yang bikin bingung "ini harus diisi gak".

## Referensi keputusan terkait

`docs/DECISIONS.md` #4, #5, #6 — kenapa admin panel dirancang sesederhana ini (role sederhana, tanpa approval layer, alur invite via link manual bukan email otomatis).

## Kalau ragu

Bayangkan staf yang baru pertama kali login, belum pernah dapat training. Kalau langkah berikutnya tidak jelas dari tampilan itu sendiri, sederhanakan lagi sebelum lanjut.
