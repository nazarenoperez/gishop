-- GiShop · esquema de base de datos (Supabase)
-- Ejecutalo completo en: Supabase > SQL Editor > New query > Run
--
-- Usa tablas nuevas (catalog_*) para no pisar las anteriores
-- (product_models / product_variants). Cuando migres, podés borrar las viejas.

-- ============ Tablas ============

-- Un modelo (ej: "Classic Pro" de VOUK)
create table if not exists catalog_models (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  marca text not null,
  tipo text not null check (tipo in ('gi', 'no-gi', 'otros')),
  subtipo text not null,
  descripcion text not null default '',
  precio numeric not null default 0 check (precio >= 0),
  created_at timestamptz not null default now(),
  -- todo producto tiene subtipo, y tiene que corresponder a su tipo
  constraint subtipo_segun_tipo check (
    (tipo = 'gi' and subtipo in ('kimonos', 'faixas')) or
    (tipo = 'no-gi' and subtipo in ('rushguard', 'shorts')) or
    (tipo = 'otros' and subtipo in ('mochilas', 'remeras', 'buzos', 'gorras'))
  )
);

-- Cada modelo tiene varios colores
create table if not exists catalog_colors (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references catalog_models(id) on delete cascade,
  color text not null,
  orden integer not null default 0
);
create unique index if not exists catalog_colors_unico
  on catalog_colors (model_id, lower(color));

-- Cada color tiene varias fotos
create table if not exists catalog_images (
  id uuid primary key default gen_random_uuid(),
  color_id uuid not null references catalog_colors(id) on delete cascade,
  url text not null,
  path text not null,
  orden integer not null default 0
);

-- Cada color tiene varios talles, con su stock
create table if not exists catalog_variants (
  id uuid primary key default gen_random_uuid(),
  color_id uuid not null references catalog_colors(id) on delete cascade,
  talle text not null,
  stock integer not null default 0 check (stock >= 0),
  unique (color_id, talle)
);

create index if not exists catalog_colors_model_idx on catalog_colors (model_id);
create index if not exists catalog_images_color_idx on catalog_images (color_id);
create index if not exists catalog_variants_color_idx on catalog_variants (color_id);

-- ============ Seguridad (RLS) ============
-- Cualquiera puede LEER el catálogo; solo el admin puede modificarlo.
-- Si cambiás de mail de admin, cambialo acá (y en NEXT_PUBLIC_ADMIN_EMAIL).

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'nazarenojulianperez@gmail.com'
$$;

alter table catalog_models enable row level security;
alter table catalog_colors enable row level security;
alter table catalog_images enable row level security;
alter table catalog_variants enable row level security;

drop policy if exists "leer modelos" on catalog_models;
drop policy if exists "admin modelos" on catalog_models;
create policy "leer modelos" on catalog_models for select using (true);
create policy "admin modelos" on catalog_models for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leer colores" on catalog_colors;
drop policy if exists "admin colores" on catalog_colors;
create policy "leer colores" on catalog_colors for select using (true);
create policy "admin colores" on catalog_colors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leer fotos" on catalog_images;
drop policy if exists "admin fotos" on catalog_images;
create policy "leer fotos" on catalog_images for select using (true);
create policy "admin fotos" on catalog_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leer variantes" on catalog_variants;
drop policy if exists "admin variantes" on catalog_variants;
create policy "leer variantes" on catalog_variants for select using (true);
create policy "admin variantes" on catalog_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ Storage (fotos) ============

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "fotos publicas" on storage.objects;
drop policy if exists "admin sube fotos" on storage.objects;
drop policy if exists "admin edita fotos" on storage.objects;
drop policy if exists "admin borra fotos" on storage.objects;

create policy "fotos publicas" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "admin sube fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin edita fotos" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "admin borra fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
