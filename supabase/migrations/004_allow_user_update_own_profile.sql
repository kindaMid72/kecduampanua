-- =============================================
-- MIGRASI 004: Izinkan User Memperbarui Profil Sendiri
-- 
-- TUJUAN:
-- Memungkinkan staf yang terautentikasi untuk memperbarui data profil
-- miliknya sendiri (misalnya menandai password_set = true saat aktivasi akun).
-- =============================================

drop policy if exists "User bisa perbarui profil sendiri" on profiles;

create policy "User bisa perbarui profil sendiri"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
