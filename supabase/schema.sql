-- ============================================================
-- PideloApp — Esquema de base de datos para Supabase
-- Derivado de los tipos TypeScript de la app (infraestructura primero).
-- Pegar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ---------- Perfiles (extiende auth.users) ----------
create table public.perfiles (
  id uuid primary key references auth.users on delete cascade,
  celular text unique,
  nombre text,
  rol text not null default 'cliente' check (rol in ('cliente', 'mensajero', 'admin')),
  creado_en timestamptz not null default now()
);

-- ---------- Direcciones del cliente ----------
-- La fuente de verdad es lat/lng del pin; el texto es informativo.
create table public.direcciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles on delete cascade,
  texto text not null,
  barrio text,
  ciudad text default 'Girardot',
  lat double precision not null,
  lng double precision not null,
  detalle text,
  indicaciones text,
  etiqueta text check (etiqueta in ('Casa', 'Trabajo', 'Otra')),
  creado_en timestamptz not null default now()
);

-- ---------- Comercios (administrados desde /admin/comercios) ----------
create table public.comercios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,
  zona text not null,
  tiempo_min int not null default 20,
  tiempo_max int not null default 40,
  costo_domicilio int not null default 5000, -- tarifa plana, ver tarifas.ts
  abierto boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  comercio_id uuid not null references public.comercios on delete cascade,
  nombre text not null,
  descripcion text not null default '',
  precio int not null check (precio >= 100),
  activo boolean not null default true
);

-- ---------- Mensajeros (registro + aprobación manual) ----------
create table public.mensajeros (
  id uuid primary key references public.perfiles on delete cascade,
  documento text not null,
  municipio text not null check (municipio in ('Girardot', 'Ricaurte', 'Flandes')),
  vehiculo text not null check (vehiculo in ('moto', 'bicicleta')),
  placa text,      -- solo moto (formato ABC12D)
  licencia text,   -- solo moto
  soat_vigente boolean,
  estado text not null default 'en_revision'
    check (estado in ('en_revision', 'aprobado', 'rechazado')),
  saldo int not null default 0, -- en pesos; comisión $1.000/pedido, recarga $5.000
  registrado_en timestamptz not null default now()
);

-- ---------- Pedidos (el corazón de la app) ----------
-- Estados: buscando → preparando → en_camino → llegue → entregado
-- La transición a 'entregado' SOLO la dispara el cliente.
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null, -- PD-XXXX
  tipo text not null check (tipo in ('catalogo', 'libre')),
  cliente_id uuid not null references public.perfiles,
  mensajero_id uuid references public.mensajeros,
  comercio_id uuid references public.comercios,
  descripcion_libre text, -- solo pedidos tipo 'libre'
  items jsonb not null default '[]', -- [{productoId, nombre, precio, cantidad}]
  subtotal int not null default 0,
  envio int not null default 5000,
  total int not null,
  direccion text not null,
  barrio text,
  lat double precision,
  lng double precision,
  estado text not null default 'buscando'
    check (estado in ('buscando', 'preparando', 'en_camino', 'llegue', 'entregado')),
  creado_en timestamptz not null default now(),
  entregado_en timestamptz
);

-- ---------- Movimientos de saldo del mensajero (libro contable) ----------
create table public.movimientos_saldo (
  id uuid primary key default gen_random_uuid(),
  mensajero_id uuid not null references public.mensajeros,
  tipo text not null check (tipo in ('recarga', 'comision')),
  valor int not null, -- positivo = recarga, negativo = comisión
  pedido_id uuid references public.pedidos,
  creado_en timestamptz not null default now()
);

-- ---------- Posición en vivo del mensajero ----------
-- El celular del mensajero la actualiza cada pocos segundos durante una entrega.
create table public.posiciones_mensajero (
  mensajero_id uuid primary key references public.mensajeros on delete cascade,
  lat double precision not null,
  lng double precision not null,
  actualizado_en timestamptz not null default now()
);

-- ============================================================
-- Seguridad (RLS): cada quien ve lo suyo; admin ve todo.
-- ============================================================
alter table public.perfiles enable row level security;
alter table public.direcciones enable row level security;
alter table public.comercios enable row level security;
alter table public.productos enable row level security;
alter table public.mensajeros enable row level security;
alter table public.pedidos enable row level security;
alter table public.movimientos_saldo enable row level security;
alter table public.posiciones_mensajero enable row level security;

create or replace function public.es_admin() returns boolean
language sql stable security definer as
$$ select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin') $$;

-- Perfiles: cada quien el suyo; admin todo
create policy "perfil propio" on public.perfiles
  for all using (id = auth.uid() or public.es_admin());
create policy "crear mi perfil" on public.perfiles
  for insert with check (id = auth.uid());

-- Direcciones: del dueño
create policy "mis direcciones" on public.direcciones
  for all using (usuario_id = auth.uid() or public.es_admin());

-- Comercios y productos: lectura pública, escritura solo admin
create policy "comercios visibles" on public.comercios for select using (true);
create policy "comercios admin" on public.comercios
  for all using (public.es_admin());
create policy "productos visibles" on public.productos for select using (true);
create policy "productos admin" on public.productos
  for all using (public.es_admin());

-- Mensajeros: el propio registro; admin aprueba
create policy "mi registro mensajero" on public.mensajeros
  for select using (id = auth.uid() or public.es_admin());
create policy "crear mi registro" on public.mensajeros
  for insert with check (id = auth.uid());
create policy "admin gestiona mensajeros" on public.mensajeros
  for update using (public.es_admin());

-- Pedidos: cliente los suyos; mensajero aprobado ve 'buscando' y los que tomó
create policy "cliente ve sus pedidos" on public.pedidos
  for select using (
    cliente_id = auth.uid()
    or mensajero_id = auth.uid()
    or public.es_admin()
    or (estado = 'buscando' and exists (
      select 1 from public.mensajeros m where m.id = auth.uid() and m.estado = 'aprobado'
    ))
  );
create policy "cliente crea pedido" on public.pedidos
  for insert with check (cliente_id = auth.uid());
create policy "actualizar pedido" on public.pedidos
  for update using (
    cliente_id = auth.uid() or mensajero_id = auth.uid() or public.es_admin()
    or (estado = 'buscando' and exists (
      select 1 from public.mensajeros m where m.id = auth.uid() and m.estado = 'aprobado'
    ))
  );

-- Saldo: el mensajero ve su libro; escribe el sistema/admin
create policy "mi saldo" on public.movimientos_saldo
  for select using (mensajero_id = auth.uid() or public.es_admin());

-- Posiciones: el mensajero escribe la suya; la ve el cliente de su pedido activo
create policy "escribir mi posicion" on public.posiciones_mensajero
  for all using (mensajero_id = auth.uid());
create policy "ver posicion de mi pedido" on public.posiciones_mensajero
  for select using (
    public.es_admin() or exists (
      select 1 from public.pedidos p
      where p.mensajero_id = posiciones_mensajero.mensajero_id
        and p.cliente_id = auth.uid()
        and p.estado in ('preparando', 'en_camino', 'llegue')
    )
  );

-- ============================================================
-- Realtime: los cambios de pedidos y posiciones llegan en vivo
-- ============================================================
alter publication supabase_realtime add table public.pedidos;
alter publication supabase_realtime add table public.posiciones_mensajero;

-- ============================================================
-- Datos semilla: los comercios del piloto
-- ============================================================
insert into public.comercios (nombre, categoria, zona, tiempo_min, tiempo_max) values
  ('Arepería La 14', 'Comida', 'Centro, Girardot', 20, 35),
  ('Sushi Ocho', 'Comida', 'Ricaurte', 30, 45),
  ('Panadería San Roque', 'Panadería', 'Flandes', 15, 25),
  ('Droguería Vital', 'Farmacia', 'Centro, Girardot', 15, 30),
  ('Mercado La Cosecha', 'Mercado', 'Ricaurte', 40, 60);
