# Design System — Rationale & Aturan Pakai

Nilai mentah (warna, tipografi, spacing) ada di `design/tokens.json` — **itu satu-satunya sumber kebenaran**, jangan pernah hardcode hex/font di komponen. Dokumen ini menjelaskan kapan & kenapa, bukan berapa.

## Atmosfer

Kantor pemerintahan pesisir: laut, kayu dermaga, tali jemur, papan pengumuman kantor. Modern-formal — kredibel tapi tidak kaku seperti web pemerintah template pada umumnya (lihat DECISIONS #6, #20). Bukan estetika SaaS/startup — jangan pernah tambahkan micro-interaction perpetual, parallax, atau hero asimetris paksa hanya karena itu tren desain umum; itu bertentangan dengan kebutuhan kredibilitas formal dan performa low-bandwidth di sini.

## Elemen Signature

**Papan Informasi** — pengganti hero generik "judul besar + gradient". Menampilkan info yang benar-benar berguna (status kantor, jam layanan, akses cepat), bukan copy marketing. Dipakai HANYA di Beranda — jangan diulang jadi elemen dekoratif di halaman lain, atau ia kehilangan makna sebagai signature.

**Section divider** (garis horizon) — dipakai secukupnya, di top bar dan pembatas antar section besar. Bukan hiasan berulang di setiap sub-bagian.

**Label kategori monospace** — ganti pola umum "01/02/03" untuk konten yang sifatnya kategorikal, bukan sequence (Informasi Publik, Potensi Daerah). Pengecualian: alur/prosedur Standar Pelayanan MEMANG sequence asli, jadi penomoran 1/2/3 di situ justified, bukan pelanggaran aturan ini.

## Anti-Pattern Khusus Proyek Ini

- **Jangan pernah karang angka.** Jumlah ASN, statistik penduduk, atau data apa pun yang belum tersedia — render placeholder eksplisit ("Data sedang diperbarui"), jangan generate angka contoh/dummy yang terlihat asli. Ini soal integritas data pemerintah, bukan gaya visual.
- Jangan pakai foto stok generik ("jabat tangan multi-ras", gradient tropis klise) untuk hero/banner.
- Jangan tambahkan motion di luar daftar `motion.allowed` di tokens.json — lihat bagian Motion di bawah.
- Jangan gunakan skill `taste-design` (Google Stitch) untuk project ini — dikalibrasi untuk SaaS premium (Inter dilarang, micro-interaction wajib), bertentangan langsung dengan kebutuhan proyek ini (DECISIONS #20).

## Motion

Restrained by design. Fade halus saat scroll-reveal dan hover elevation ringan itu batas atasnya. Selalu hormati `prefers-reduced-motion`. Alasan: audiens termasuk lansia/awam teknis dan pengguna koneksi lambat — motion berlebihan menambah beban render dan terasa tidak formal untuk situs .go.id.

## Tipografi — kenapa bukan pilihan "premium" biasa

Inter dipilih untuk body text justru karena ia dianggap "generic default" di lingkaran desain SaaS — di sini itu keunggulan, bukan kekurangan, karena prioritas #1 adalah keterbacaan info administratif oleh audiens seluas mungkin. Fraunces dipakai sangat terbatas (H1/H2 saja) supaya tetap terasa formal-organik tanpa mengorbankan keterbacaan. IBM Plex Mono dikhususkan untuk data yang punya rasa "resmi/tercatat" (nomor tracking, nomor surat, tanggal) — meniru kesan dokumen yang distempel.

## Komponen (enforcement layer)

Semua styling diwujudkan lewat komponen reusable di `/components/ui` (Button, Card, Badge, PapanInformasiPanel, SectionDivider, CategoryLabel) — agent membangun halaman baru dengan MEMAKAI ULANG komponen ini, bukan menulis ulang className Tailwind dari nol tiap kali. Kalau butuh varian baru, tambahkan prop ke komponen yang ada dulu sebelum bikin komponen baru dari nol.

## Checklist Sebelum Merge UI Baru

- [ ] Semua warna/font berasal dari `design/tokens.json` (tidak ada hex/font hardcode)
- [ ] Kontras teks minimal 4.5:1
- [ ] Diuji di viewport 360px (mobile) sebelum desktop
- [ ] Tidak ada data fiktif/dummy yang terlihat seperti data asli
- [ ] Motion sesuai daftar `allowed`, menghormati `prefers-reduced-motion`
- [ ] Elemen signature (papan informasi, divider) tidak diulang berlebihan di luar konteks yang dijelaskan di atas
