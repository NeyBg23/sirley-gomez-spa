-- Draft migration for the independent Vercel + Supabase version.
-- Not applied to any hosted project. Existing Sites data is not changed.
begin;

create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

create table public.site_content (
  key text primary key check (key = 'main'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer text not null check (char_length(customer) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 30),
  email text not null default '',
  service_id text not null,
  service_name jsonb not null,
  price numeric(10,2) not null check (price between 0 and 10000),
  date date not null,
  "start" integer not null check ("start" >= 0),
  "end" integer not null check ("end" <= 1440 and "end" > "start"),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  locale text not null check (locale in ('es', 'en')),
  created_at timestamptz not null default now(),
  requester_hash text not null,
  -- The database itself rejects overlapping concurrent inserts and updates.
  constraint appointment_no_overlap exclude using gist (
    date with =,
    int4range("start", "end", '[)') with &&
  ) where (status <> 'cancelled')
);
create index appointment_schedule on public.appointments(date, status);
create index appointment_rate on public.appointments(requester_hash, created_at);

create table public.gift_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  package_id text not null,
  package_name jsonb not null,
  price numeric(10,2) not null check (price between 1 and 10000),
  recipient text not null check (char_length(recipient) between 2 and 100),
  giver text not null check (char_length(giver) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 30),
  message text not null default '' check (char_length(message) <= 400),
  occasion text not null check (occasion in ('birthday', 'christmas')),
  locale text not null check (locale in ('es', 'en')),
  status text not null default 'requested'
    check (status in ('requested', 'issued', 'redeemed', 'cancelled')),
  code text unique,
  token text unique check (token is null or token ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  issued_at timestamptz,
  redeemed_at timestamptz,
  requester_hash text not null,
  constraint issued_gift_has_code check (
    status not in ('issued', 'redeemed') or
    (code is not null and token is not null and issued_at is not null)
  )
);
create index gift_rate on public.gift_orders(requester_hash, created_at);

-- Data access goes through the app server. Authentication alone grants no
-- access to customer details or administrative operations.
alter table public.site_content enable row level security;
alter table public.admins enable row level security;
alter table public.appointments enable row level security;
alter table public.gift_orders enable row level security;
revoke all on public.site_content, public.admins, public.appointments,
  public.gift_orders from anon, authenticated;
grant select, insert, update, delete on public.site_content, public.admins,
  public.appointments, public.gift_orders to service_role;

-- Preserve optimistic editing across devices without a read/update race.
create function public.sg_save_content(new_payload jsonb, expected_revision integer)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare saved_revision integer;
begin
  if expected_revision < 0 or new_payload is null or
    jsonb_typeof(new_payload) <> 'object' then
    raise exception 'INVALID_CONTENT' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.site_content(key, payload, revision, updated_at)
      values ('main', new_payload, 1, now())
      on conflict (key) do nothing
      returning revision into saved_revision;
  else
    update public.site_content set payload = new_payload,
      revision = revision + 1, updated_at = now()
      where key = 'main' and revision = expected_revision
      returning revision into saved_revision;
  end if;
  if saved_revision is null then
    raise exception 'EDIT_CONFLICT' using errcode = '40001';
  end if;
  return saved_revision;
end;
$$;
revoke all on function public.sg_save_content(jsonb, integer) from public, anon, authenticated;
grant execute on function public.sg_save_content(jsonb, integer) to service_role;

commit;
