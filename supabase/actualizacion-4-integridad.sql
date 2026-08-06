-- ============================================================
-- PideloApp — Actualización 4: integridad y detalles (2026-08-06)
-- Aplicada directamente por la API de gestión.
-- ============================================================

-- 1. Borrar un comercio con historial ya no falla: los pedidos conservan su
--    nombre y quedan sin referencia (el historial del cliente no se pierde).
alter table public.pedidos
  drop constraint if exists pedidos_comercio_id_fkey;
alter table public.pedidos
  add constraint pedidos_comercio_id_fkey
  foreign key (comercio_id) references public.comercios(id) on delete set null;

alter table public.pedidos
  add column if not exists comercio_nombre text;

-- Guardar el nombre del comercio en el pedido al crearlo
create or replace function public.guardar_nombre_comercio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.comercio_id is not null and new.comercio_nombre is null then
    select nombre into new.comercio_nombre from public.comercios where id = new.comercio_id;
  end if;
  return new;
end $$;

drop trigger if exists guardar_nombre_comercio on public.pedidos;
create trigger guardar_nombre_comercio before insert on public.pedidos
  for each row execute function public.guardar_nombre_comercio();

update public.pedidos p
   set comercio_nombre = c.nombre
  from public.comercios c
 where p.comercio_id = c.id and p.comercio_nombre is null;

-- 2. Un producto borrado no rompe pedidos históricos (los items son jsonb,
--    ya guardan nombre y precio) — nada que hacer, se documenta aquí.

-- 3. El mensajero no puede tener dos entregas activas a la vez
create unique index if not exists una_entrega_activa_por_mensajero
  on public.pedidos (mensajero_id)
  where estado in ('preparando', 'en_camino', 'llegue');

-- 4. Nadie puede quedar con saldo negativo
alter table public.mensajeros
  drop constraint if exists saldo_no_negativo;
alter table public.mensajeros
  add constraint saldo_no_negativo check (saldo >= 0);

-- 5. Búsquedas frecuentes: pedidos disponibles y por cliente
create index if not exists pedidos_estado_idx on public.pedidos (estado);
create index if not exists pedidos_cliente_idx on public.pedidos (cliente_id);
create index if not exists pedidos_mensajero_idx on public.pedidos (mensajero_id);
create index if not exists productos_comercio_idx on public.productos (comercio_id);
