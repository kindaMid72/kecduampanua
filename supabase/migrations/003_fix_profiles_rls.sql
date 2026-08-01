-- =============================================
-- MIGRASI 003: Fix Infinite Recursion pada RLS profiles
-- 
-- MASALAH:
-- Policy "Super account bisa lihat & kelola semua profil" menyebabkan
-- infinite recursion karena ia melakukan subquery ke tabel `profiles`
-- di dalam policy yang berjalan pada tabel `profiles` itu sendiri.
--
-- SOLUSI:
-- Gunakan SECURITY DEFINER function `is_super_account()` yang membaca
-- data dengan hak service role, memotong loop rekursi RLS.
-- =============================================

-- 1. Buat helper function is_super_account() dengan SECURITY DEFINER
--    sehingga ia bisa membaca profiles tanpa terkena RLS (breakout dari loop)
create or replace function is_super_account()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role = 'super_account'
      and p.status = 'aktif'
  );
$$;

-- 2. Drop policy lama yang menyebabkan infinite recursion
drop policy if exists "Super account bisa lihat & kelola semua profil" on profiles;

-- 3. Buat policy baru yang menggunakan function SECURITY DEFINER
--    (tidak ada subquery langsung ke profiles di dalam policy)
create policy "Super account bisa lihat & kelola semua profil"
  on profiles for all
  using (is_super_account());
