create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.lil_robb_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.lil_robb_products (
  id text primary key,
  title text not null,
  species text not null default '',
  description text not null default '',
  price numeric(10,2) not null default 0 check (price >= 0),
  inventory integer not null default 0 check (inventory >= 0),
  light text not null default '',
  watering text not null default '',
  soil text not null default '',
  growing_conditions text not null default '',
  difficulty text not null default '',
  humidity text not null default '',
  mature_size text not null default '',
  pet_safety text not null default '',
  care_notes text not null default '',
  image_url text,
  art_variant integer not null default 0 check (art_variant between 0 and 4),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lil_robb_store_settings (
  id boolean primary key default true check (id = true),
  coming_soon boolean not null default true,
  announcement text not null default 'Online ordering is coming soon. Browse the launch collection and build a cart now.',
  standard_shipping numeric(10,2) not null default 10 check (standard_shipping >= 0),
  free_shipping_threshold numeric(10,2) not null default 75 check (free_shipping_threshold >= 0),
  local_pickup_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists private.lil_robb_bootstrap_secret (
  id boolean primary key default true check (id = true),
  secret_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.lil_robb_admin_users enable row level security;
alter table public.lil_robb_products enable row level security;
alter table public.lil_robb_store_settings enable row level security;

revoke all on public.lil_robb_admin_users from anon, authenticated;
revoke all on public.lil_robb_products from anon, authenticated;
revoke all on public.lil_robb_store_settings from anon, authenticated;

grant select on public.lil_robb_products to anon, authenticated;
grant insert, update, delete on public.lil_robb_products to authenticated;
grant select on public.lil_robb_store_settings to anon, authenticated;
grant update on public.lil_robb_store_settings to authenticated;
grant select on public.lil_robb_admin_users to authenticated;

drop policy if exists "lil robb public published products" on public.lil_robb_products;
create policy "lil robb public published products"
on public.lil_robb_products for select
to anon
using (is_published = true);

drop policy if exists "lil robb authenticated published products" on public.lil_robb_products;
create policy "lil robb authenticated published products"
on public.lil_robb_products for select
to authenticated
using (
  is_published = true
  or exists (
    select 1 from public.lil_robb_admin_users a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  )
);

drop policy if exists "lil robb owner insert products" on public.lil_robb_products;
create policy "lil robb owner insert products"
on public.lil_robb_products for insert
to authenticated
with check (
  exists (
    select 1 from public.lil_robb_admin_users a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  )
);

drop policy if exists "lil robb owner update products" on public.lil_robb_products;
create policy "lil robb owner update products"
on public.lil_robb_products for update
to authenticated
using (
  exists (
    select 1 from public.lil_robb_admin_users a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.lil_robb_admin_users a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  )
);

drop policy if exists "lil robb owner delete products" on public.lil_robb_products;
create policy "lil robb owner delete products"
on public.lil_robb_products for delete
to authenticated
using (
  exists (
    select 1 from public.lil_robb_admin_users a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  )
);

drop policy if exists "lil robb public settings" on public.lil_robb_store_settings;
create policy "lil robb public settings"
on public.lil_robb_store_settings for select
to anon
using (true);

drop policy if exists "lil robb authenticated settings" on public.lil_robb_store_settings;
create policy "lil robb authenticated settings"
on public.lil_robb_store_settings for select
to authenticated
using (true);

drop policy if exists "lil robb owner update settings" on public.lil_robb_store_settings;
create policy "lil robb owner update settings"
on public.lil_robb_store_settings for update
to authenticated
using (
  exists (
    select 1 from public.lil_robb_admin_users a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.lil_robb_admin_users a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  )
);

drop policy if exists "lil robb admin self read" on public.lil_robb_admin_users;
create policy "lil robb admin self read"
on public.lil_robb_admin_users for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.claim_lil_robb_owner(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_secret_hash text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (select 1 from public.lil_robb_admin_users) then
    return false;
  end if;

  select secret_hash
    into v_secret_hash
    from private.lil_robb_bootstrap_secret
    where id = true
    for update;

  if v_secret_hash is null then
    return false;
  end if;

  if encode(extensions.digest(p_code, 'sha256'), 'hex') <> v_secret_hash then
    return false;
  end if;

  insert into public.lil_robb_admin_users(user_id, role)
  values (v_user_id, 'owner');

  delete from private.lil_robb_bootstrap_secret where id = true;
  return true;
end;
$$;

revoke execute on function public.claim_lil_robb_owner(text) from public, anon;
grant execute on function public.claim_lil_robb_owner(text) to authenticated;

insert into public.lil_robb_store_settings(id)
values (true)
on conflict (id) do nothing;
