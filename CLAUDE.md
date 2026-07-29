@AGENTS.md

Import di atas otomatis memuat AGENTS.md setiap sesi (Claude Code tidak membaca AGENTS.md secara native — wajib pakai `@import`, bukan cuma disebut di prosa). Environment variables, command, testing, dan aturan wajib semua ada di sana (file itu diniatkan portable lintas-tool, bukan Claude-only). Bagian di bawah ini murni tambahan spesifik fitur Claude Code.

## Kebiasaan Kerja di Proyek Ini

- Sebelum menambah dependency baru: perlu banget? Situs ini harus tetap ringan (target pengguna sering koneksi lambat).
- Konten faktual kecamatan (nama layanan, struktur organisasi, dst) — jangan pernah dikarang. Tandai TODO dan tanya user.
- Kerja berisiko tinggi (auth, RLS, tabel `pengaduan`): jalankan `Use a subagent to review this against .claude/agents/rls-reviewer.md criteria` sebelum commit.

## Batasan

- Jangan ubah kebijakan RLS tanpa menjelaskan dampaknya ke user dulu — menyangkut keamanan data pengaduan warga (data pribadi, UU PDP).
- Jangan deploy ke domain production tanpa konfirmasi eksplisit user, terutama soal status keputusan hosting Diskominfo (`docs/DECISIONS.md` #2).
