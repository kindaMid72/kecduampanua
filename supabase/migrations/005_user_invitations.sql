-- =============================================
-- Migrasi 005: Tabel user_invitations
-- Alur one-time token untuk tambah user & reset kata sandi
-- =============================================

create table if not exists user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nama_lengkap text not null,
  role text not null check (role in ('super_account', 'staf')),
  token_hash text not null unique,
  type text not null default 'invite' check (type in ('invite', 'reset_password')),
  user_id uuid references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Indeks untuk pencarian cepat berdasarkan hash token dan email
create index if not exists idx_user_invitations_token_hash on user_invitations(token_hash);
create index if not exists idx_user_invitations_email on user_invitations(email);

-- Row Level Security
alter table user_invitations enable row level security;

-- Policy: Hanya Super Account yang dapat melihat dan mengelola undangan via client SDK
create policy "Super account bisa kelola user invitations"
  on user_invitations for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_account'));
