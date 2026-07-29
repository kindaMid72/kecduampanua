---
name: i18n-content
description: Gunakan skill ini saat menambah tabel/field baru yang butuh versi Bahasa Inggris, atau saat mengimplementasikan alur auto-translate. Rujukan lengkap ada di docs/ARCHITECTURE.md §5 dan docs/DECISIONS.md #10.
---

# i18n Content — Auto-Translate Server-Side

Prinsip: staf TIDAK pernah diminta menerjemahkan manual. Semua versi Inggris dihasilkan otomatis lewat Google Cloud Translation API saat konten disimpan, dan disimpan sebagai teks asli (bukan overlay client-side) supaya tetap SEO-friendly di route `/en/...`.

## Langkah wiring untuk tabel/field baru

1. Tambah kolom `<field>_en` (nullable) untuk setiap field yang perlu diterjemahkan. Lihat pola di `docs/DATABASE_SCHEMA.md` (`informasi_publik`, `layanan`, `potensi_daerah`, `profil_kecamatan`).
2. Di server action penyimpanan konten: setelah insert/update versi Indonesia berhasil, panggil helper `lib/translate.ts` untuk mengisi kolom `_en` secara async. Jangan blocking response ke staf menunggu hasil terjemahan — simpan versi ID dulu, translate di background/setelahnya.
3. Kalau API translate gagal/timeout: biarkan kolom `_en` tetap `null`. JANGAN lempar error ke staf — kegagalan translate tidak boleh menghalangi staf menyimpan konten.
4. Di halaman publik: pakai helper fallback — `locale === 'en' ? (record.field_en || record.field) : record.field`. Selalu ada fallback ke Indonesia, tidak pernah tampil kosong di versi Inggris.
5. Field yang prosedural/legal (contoh: `alur_proses` di tabel `layanan`) — set `alur_perlu_ditinjau = true` secara default, tampilkan badge di admin panel: "Terjemahan otomatis — perlu ditinjau" (non-blocking, cuma pengingat).
6. Field di form admin tetap ditampilkan (BUKAN disembunyikan di balik toggle), tapi PRE-FILLED dari hasil auto-translate. Staf boleh edit manual kalau mau perbaiki, tapi tidak wajib.

## Yang TIDAK diterjemahkan (per DECISIONS #10)

- `dokumen_edaran` — dokumen legal resmi, tidak ada kolom `_en` sama sekali.
- Admin panel UI — tetap Bahasa Indonesia penuh, cuma konten publik yang bilingual.

## UI statis (nav, tombol, label)

Ini BUKAN tanggung jawab auto-translate — pakai dictionary `next-intl` di `/messages/id.json` dan `/messages/en.json`, diterjemahkan manual sekali oleh developer, bukan per-konten dinamis.
