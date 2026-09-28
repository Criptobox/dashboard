-- ==========================================================
-- Gelato Nube · Base de datos en Supabase
-- Pega este archivo completo en Supabase → SQL Editor → Run.
-- Se puede ejecutar varias veces sin romper nada.
-- ==========================================================

-- 1) Categorías (se crean y borran desde el panel admin)
create table if not exists public.categorias (
  slug     text primary key check (slug ~ '^[a-z0-9-]{1,40}$'),
  name     text not null check (char_length(name) between 1 and 30),
  emoji    text,
  position integer not null default 0
);

insert into public.categorias (slug, name, emoji, position) values
  ('clasicos',   'Clásicos',   '🍦', 0),
  ('frutales',   'Frutales',   '🍓', 1),
  ('especiales', 'Especiales', '✨', 2),
  ('copas',      'Copas',      '🍨', 3),
  ('batidos',    'Batidos',    '🥤', 4),
  ('dulces',     'Dulces',     '🍩', 5),
  ('bebidas',    'Bebidas',    '☕', 6)
on conflict (slug) do nothing;

-- 2) Productos (helados, copas, batidos, dulces, bebidas…)
create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  category    text not null,
  type        text not null default 'cone',
  description text not null default '',
  price       numeric(6, 2) not null check (price >= 0),
  color1      text not null default '#ffd1e3',
  color2      text not null default '#ff6fa8',
  sprinkle    text,
  tags        text[] not null default '{}',
  badge       text,
  fixed       boolean not null default false,   -- true = sin selector de bolas
  ingredients text[] not null default '{}',
  allergens   text not null default '',
  kcal        integer,
  sugar       text,
  image_url   text,
  available   boolean not null default true,     -- false = oculto en la carta
  position    integer not null default 0,        -- orden en la carta
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Si ya tenías la versión anterior: quita la lista fija de categorías y tipos
alter table public.productos drop constraint if exists productos_category_check;
alter table public.productos drop constraint if exists productos_type_check;
alter table public.productos add constraint productos_type_check
  check (type in ('cone', 'cup', 'shake', 'donut', 'cupcake', 'drink', 'coffee'));

-- Cada producto pertenece a una categoría existente.
-- No se puede borrar una categoría que todavía tenga productos.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'productos_category_fkey') then
    alter table public.productos
      add constraint productos_category_fkey foreign key (category)
      references public.categorias (slug) on update cascade on delete restrict;
  end if;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists productos_updated_at on public.productos;
create trigger productos_updated_at
  before update on public.productos
  for each row execute function public.touch_updated_at();

-- 3) Lista de administradores (por correo)
--    Sin políticas: nadie puede leerla desde la web, solo la función is_admin().
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 4) Seguridad: todos ven la carta, solo los admins editan
alter table public.productos enable row level security;

drop policy if exists "productos: leer"      on public.productos;
drop policy if exists "productos: crear"     on public.productos;
drop policy if exists "productos: modificar" on public.productos;
drop policy if exists "productos: borrar"    on public.productos;

create policy "productos: leer" on public.productos
  for select using (available or public.is_admin());
create policy "productos: crear" on public.productos
  for insert to authenticated with check (public.is_admin());
create policy "productos: modificar" on public.productos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "productos: borrar" on public.productos
  for delete to authenticated using (public.is_admin());

alter table public.categorias enable row level security;

drop policy if exists "categorias: leer"      on public.categorias;
drop policy if exists "categorias: crear"     on public.categorias;
drop policy if exists "categorias: modificar" on public.categorias;
drop policy if exists "categorias: borrar"    on public.categorias;

create policy "categorias: leer" on public.categorias
  for select using (true);
create policy "categorias: crear" on public.categorias
  for insert to authenticated with check (public.is_admin());
create policy "categorias: modificar" on public.categorias
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categorias: borrar" on public.categorias
  for delete to authenticated using (public.is_admin());

-- 5) Almacenamiento de fotos (bucket público "productos")
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "fotos: leer"      on storage.objects;
drop policy if exists "fotos: subir"     on storage.objects;
drop policy if exists "fotos: modificar" on storage.objects;
drop policy if exists "fotos: borrar"    on storage.objects;

create policy "fotos: leer" on storage.objects
  for select using (bucket_id = 'productos');
create policy "fotos: subir" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos' and public.is_admin());
create policy "fotos: modificar" on storage.objects
  for update to authenticated using (bucket_id = 'productos' and public.is_admin());
create policy "fotos: borrar" on storage.objects
  for delete to authenticated using (bucket_id = 'productos' and public.is_admin());

-- 6) Da permisos de admin a tu correo (cámbialo por el tuyo).
--    Debe ser el mismo correo del usuario creado en Authentication → Users.
insert into public.admins (email) values ('tu-correo@ejemplo.com')
on conflict (email) do nothing;
