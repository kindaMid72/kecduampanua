-- Migration 012: Rate Limits Table (Optimized Single-Row UPSERT)
-- Tujuan: Menggantikan in-memory rate limiter (tidak berfungsi di serverless)
--         dengan implementasi persisten berbasis Supabase.
-- Desain: Hanya menyimpan MENGGUNAKAN 1 BARIS PER IP untuk mencegah table bloat jangka panjang.
-- Diakses HANYA oleh service_role dari server via RPC check_rate_limit.

create table if not exists public.rate_limits (
  ip           text        primary key,
  hits         int         not null default 1,
  window_start timestamptz not null default now()
);

-- RLS aktif — WAJIB sesuai konvensi proyek
alter table public.rate_limits enable row level security;

-- Tidak ada policy untuk anon atau authenticated:
-- tabel ini hanya boleh diakses oleh service_role yang bypass RLS secara by design.

-- RPC function untuk atomicity dan efisiensi
create or replace function check_rate_limit(client_ip text, max_hits int, window_minutes int)
returns boolean
language plpgsql
security definer
as $$
declare
  current_hits int;
begin
  insert into public.rate_limits (ip, hits, window_start)
  values (client_ip, 1, now())
  on conflict (ip) do update
  set
    -- Reset hits jika sudah lewat window, jika belum tambah 1
    hits = case
      when now() - rate_limits.window_start >= make_interval(mins => window_minutes)
      then 1
      else rate_limits.hits + 1
    end,
    -- Reset window_start jika sudah lewat window, jika belum biarkan seperti semula (fixed window)
    window_start = case
      when now() - rate_limits.window_start >= make_interval(mins => window_minutes)
      then now()
      else rate_limits.window_start
    end
  returning hits into current_hits;

  return current_hits <= max_hits;
end;
$$;
