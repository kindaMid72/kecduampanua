-- =============================================
-- Migrasi 014: Tutup eskalasi hak & INSERT anon bebas (DECISIONS #33)
-- =============================================
-- Jalankan sebagai pemilik tabel/function (mis. supabase_admin), dalam satu
-- transaksi. Sebaiknya diterapkan bersama 013.

begin;

-- === 1. profiles: user tidak boleh mengubah role/status dirinya sendiri ===
-- Policy 004 ("User bisa perbarui profil sendiri") mengizinkan UPDATE seluruh
-- kolom pada baris sendiri. Akibatnya:
--   - staf biasa bisa PATCH /rest/v1/profiles {role:'super_account'}
--   - staf nonaktif bisa PATCH {status:'aktif'} dan mendapatkan akses lagi
-- Policy 004 tetap dibutuhkan (nama_lengkap, password_set diubah user sendiri),
-- jadi kolom istimewa dijaga trigger. Perubahan role/status hanya boleh oleh:
--   - role database postgres / supabase_admin / service_role (alur server yang sah:
--     semua action admin memakai createAdminClient()), atau
--   - Pengelola (super_account) AKTIF lewat sesi sendiri.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.status is distinct from old.status then
    if not public.is_super_account() then
      raise exception 'Perubahan peran atau status pengguna hanya boleh dilakukan Pengelola.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- Function trigger tidak perlu bisa dipanggil lewat REST.
revoke execute on function public.protect_profile_privileged_columns() from public, anon, authenticated;

-- === 2. user_invitations: wajib super_account AKTIF ===
-- Policy 005 hanya mengecek role, bukan status 'aktif'.
drop policy if exists "Super account bisa kelola user invitations" on public.user_invitations;

create policy "Super account bisa kelola user invitations"
  on public.user_invitations for all
  using (public.is_super_account())
  with check (public.is_super_account());

-- === 3. pengaduan: anon tidak boleh INSERT langsung ===
-- Policy 001 ("Publik bisa insert") hanya mengecek setuju_data_pribadi = true,
-- sehingga lewat REST langsung anon bisa mengisi kolom staf (status,
-- catatan_tindak_lanjut, diarsipkan_pada, ditangani_oleh, created_at), memilih
-- nomor_tracking sendiri, mengecek keberadaan nomor lewat error 23505, dan
-- melewati rate limit/honeypot/validasi server.
-- Publik tetap bisa mengirim pengaduan: submitPengaduanAction menyisipkan dari
-- server (service role) setelah validasi dan rate limit. Staf tetap diatur oleh
-- policy "Staf lihat & kelola semua".
drop policy if exists "Publik bisa insert" on public.pengaduan;
revoke insert on public.pengaduan from anon;

commit;
