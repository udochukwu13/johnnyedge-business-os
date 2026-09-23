-- JohnnyEdge AI Business OS — Stage 1
-- Run this whole script in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  industry text,
  country text default 'Nigeria',
  currency text default 'NGN',
  phone text,
  email text,
  address text,
  website text,
  logo_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (
    role in ('owner','admin','manager','accountant','sales','staff','viewer')
  ),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_members_business_id_idx on public.business_members(business_id);
create index if not exists business_members_user_id_idx on public.business_members(user_id);
create index if not exists businesses_created_by_idx on public.businesses(created_by);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists businesses_updated_at on public.businesses;
create trigger businesses_updated_at
before update on public.businesses
for each row execute procedure public.set_updated_at();

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_business_admin(target_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id
      and user_id = auth.uid()
      and role in ('owner','admin')
  );
$$;

create or replace function public.create_business(
  business_name text,
  business_industry text default null,
  business_country text default 'Nigeria',
  business_currency text default 'NGN',
  business_phone text default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business public.businesses;
  generated_slug text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if trim(business_name) = '' then
    raise exception 'Business name is required';
  end if;

  generated_slug :=
    lower(regexp_replace(trim(business_name), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' ||
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.businesses (
    name, slug, industry, country, currency, phone, created_by
  )
  values (
    trim(business_name),
    generated_slug,
    nullif(trim(business_industry), ''),
    coalesce(nullif(trim(business_country), ''), 'Nigeria'),
    coalesce(nullif(trim(business_currency), ''), 'NGN'),
    nullif(trim(business_phone), ''),
    auth.uid()
  )
  returning * into new_business;

  insert into public.business_members (business_id, user_id, role)
  values (new_business.id, auth.uid(), 'owner');

  return new_business;
end;
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Members can view their businesses" on public.businesses;
create policy "Members can view their businesses" on public.businesses
for select to authenticated using (public.is_business_member(id));

drop policy if exists "Admins can update businesses" on public.businesses;
create policy "Admins can update businesses" on public.businesses
for update to authenticated
using (public.is_business_admin(id))
with check (public.is_business_admin(id));

drop policy if exists "Owners can delete businesses" on public.businesses;
create policy "Owners can delete businesses" on public.businesses
for delete to authenticated
using (
  exists (
    select 1 from public.business_members bm
    where bm.business_id = businesses.id
      and bm.user_id = auth.uid()
      and bm.role = 'owner'
  )
);

drop policy if exists "Members can view business members" on public.business_members;
create policy "Members can view business members" on public.business_members
for select to authenticated using (public.is_business_member(business_id));

drop policy if exists "Admins can add members" on public.business_members;
create policy "Admins can add members" on public.business_members
for insert to authenticated with check (public.is_business_admin(business_id));

drop policy if exists "Admins can update members" on public.business_members;
create policy "Admins can update members" on public.business_members
for update to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

drop policy if exists "Admins can remove members" on public.business_members;
create policy "Admins can remove members" on public.business_members
for delete to authenticated using (public.is_business_admin(business_id));

grant execute on function public.create_business(text,text,text,text,text) to authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.is_business_admin(uuid) to authenticated;

revoke all on public.profiles from anon;
revoke all on public.businesses from anon;
revoke all on public.business_members from anon;

grant select, update on public.profiles to authenticated;
grant select, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;