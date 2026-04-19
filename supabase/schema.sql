-- Health Dashboard schema. Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dosage text,
  schedule text,
  benefits text,
  side_effects text,
  instructions text,
  started_on date,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists allergies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  allergen text not null,
  severity text check (severity in ('mild','moderate','severe')),
  reaction text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text,
  taken_on date,
  storage_path text not null,
  mime_type text,
  notes text,
  extracted_text text,
  created_at timestamptz not null default now()
);

create table if not exists vitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  value double precision not null,
  unit text,
  measured_at timestamptz not null,
  source text
);
create index if not exists vitals_user_type_time on vitals (user_id, type, measured_at desc);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_user_time on chat_messages (user_id, created_at);

-- RLS
alter table medications enable row level security;
alter table allergies enable row level security;
alter table records enable row level security;
alter table vitals enable row level security;
alter table chat_messages enable row level security;

do $$ begin
  create policy "own rows" on medications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own rows" on allergies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own rows" on records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own rows" on vitals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own rows" on chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Storage bucket for uploaded medical records (private).
insert into storage.buckets (id, name, public)
values ('records', 'records', false)
on conflict (id) do nothing;

do $$ begin
  create policy "records own" on storage.objects
    for all
    using (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
