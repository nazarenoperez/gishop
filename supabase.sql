-- supabase-v2.sql
create table if not exists product_models (
  id uuid primary key default gen_random_uuid(),
  marca text not null,
  producto text not null,
  nombre text not null default '',
  precio numeric not null default 0,
  imagen_url text,
  imagen_path text,
  created_at timestamptz default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references product_models(id) on delete cascade,
  talle text not null,
  color text not null default '',
  stock integer not null default 0 check (stock >= 0),
  unique (model_id, talle, color)
);

alter table product_models enable row level security;
alter table product_variants enable row level security;

create policy "modelos publicos" on product_models
  for select using (true);
create policy "admin gestiona modelos" on product_models
  for all to authenticated
  using (auth.jwt() ->> 'email' = 'TU_GMAIL@gmail.com')
  with check (auth.jwt() ->> 'email' = 'TU_GMAIL@gmail.com');

create policy "variantes publicas" on product_variants
  for select using (true);
create policy "admin gestiona variantes" on product_variants
  for all to authenticated
  using (auth.jwt() ->> 'email' = 'TU_GMAIL@gmail.com')
  with check (auth.jwt() ->> 'email' = 'TU_GMAIL@gmail.com');
