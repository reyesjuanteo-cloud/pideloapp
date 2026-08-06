-- ============================================================
-- PideloApp — Actualización 3: CORRIGE la recursión de políticas (2026-08-06)
--
-- La actualización 2 dejó políticas que se llamaban en círculo:
--   perfiles → pedidos → mensajeros → pedidos …
-- Postgres responde 42P17 "infinite recursion detected in policy" y la app
-- no puede leer pedidos ni perfiles.
--
-- La solución: las comprobaciones cruzadas pasan por funciones SECURITY
-- DEFINER, que consultan sin volver a evaluar RLS y cortan el círculo.
-- Correr DESPUÉS de actualizacion-2-seguridad.sql. Es idempotente.
-- ============================================================

create or replace function public.soy_mensajero_aprobado()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.mensajeros m
    where m.id = auth.uid() and m.estado = 'aprobado'
  )
$$;

create or replace function public.es_mensajero_de_mi_pedido(mensajero uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pedidos p
    where p.mensajero_id = mensajero and p.cliente_id = auth.uid()
  )
$$;

create or replace function public.es_mi_mensajero_activo(mensajero uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pedidos p
    where p.mensajero_id = mensajero
      and p.cliente_id = auth.uid()
      and p.estado in ('preparando', 'en_camino', 'llegue')
  )
$$;

-- Pedidos: el cliente ve los suyos; el mensajero los suyos y los disponibles
drop policy if exists "cliente ve sus pedidos" on public.pedidos;
create policy "cliente ve sus pedidos" on public.pedidos
  for select using (
    cliente_id = auth.uid()
    or mensajero_id = auth.uid()
    or public.es_admin()
    or (estado = 'buscando' and public.soy_mensajero_aprobado())
  );

-- El cliente ve quién es el mensajero de SU pedido (sin recursión)
drop policy if exists "cliente ve a su mensajero" on public.mensajeros;
create policy "cliente ve a su mensajero" on public.mensajeros
  for select using (public.es_mensajero_de_mi_pedido(mensajeros.id));

drop policy if exists "cliente ve perfil de su mensajero" on public.perfiles;
create policy "cliente ve perfil de su mensajero" on public.perfiles
  for select using (public.es_mensajero_de_mi_pedido(perfiles.id));

-- Posición en vivo del mensajero durante una entrega
drop policy if exists "ver posicion de mi pedido" on public.posiciones_mensajero;
create policy "ver posicion de mi pedido" on public.posiciones_mensajero
  for select using (
    public.es_admin()
    or public.es_mi_mensajero_activo(posiciones_mensajero.mensajero_id)
  );
