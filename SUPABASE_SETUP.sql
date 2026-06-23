-- Supabase da SQL Editor ga joylashtiring va Run qiling

-- Leads jadvali
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null default '',
  phone text not null default '',
  stage text not null default 'Yangi lid',
  assigned_to text default null,  -- manager id
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notes jadvali
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete cascade,
  text text not null,
  author text not null,
  created_at timestamptz default now()
);

-- Real-time uchun yoqish
alter table leads replica identity full;
alter table notes replica identity full;

-- Public read/write (RLS o'chirish — oddiy parol bilan login uchun)
alter table leads disable row level security;
alter table notes disable row level security;

-- Updated_at avtomatik yangilansin
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();
