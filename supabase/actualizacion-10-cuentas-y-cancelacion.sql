-- ============================================================
-- Actualización 10 (2026-08-06)
-- · Los pedidos se pueden cancelar
-- · El mensajero estrena con su primer domicilio gratis
-- · Recargas manuales acreditadas por el equipo
-- ============================================================

-- 1. Nuevo estado: cancelado
alter table public.pedidos drop constraint if exists pedidos_estado_check;
alter table public.pedidos add constraint pedidos_estado_check
  check (estado in ('buscando','preparando','en_camino','llegue','entregado','cancelado'));

alter table public.pedidos add column if not exists cancelado_en timestamptz;
alter table public.pedidos add column if not exists motivo_cancelacion text;

-- 2. Máquina de estados con cancelación y devolución de comisión
create or replace function public.validar_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tarifa_envio constant int := 5000;
  comision constant int := 1000;
  suma int;
begin
  if auth.role() = 'service_role' then return new; end if;

  if tg_op = 'INSERT' then
    if new.tipo = 'catalogo' then
      select coalesce(sum(p.precio * greatest((i->>'cantidad')::int, 0)), 0)
        into suma
        from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) i
        join public.productos p on p.id::text = i->>'productoId';
    else
      suma := 0;
    end if;
    new.subtotal := suma;
    new.envio := tarifa_envio;
    new.total := suma + tarifa_envio;
    new.estado := 'buscando';
    new.mensajero_id := null;
    new.entregado_en := null;
    return new;
  end if;

  new.subtotal := old.subtotal;
  new.envio := old.envio;
  new.total := old.total;
  new.items := old.items;
  new.cliente_id := old.cliente_id;

  if new.estado is distinct from old.estado then
    if old.estado in ('entregado','cancelado') then
      raise exception 'el pedido ya está cerrado';
    end if;

    if new.estado = 'cancelado' then
      -- Cancela el cliente (antes de que llegue) o el mensajero asignado
      if auth.uid() = old.cliente_id then
        if old.estado not in ('buscando','preparando') then
          raise exception 'ya no se puede cancelar: el mensajero va en camino';
        end if;
      elsif auth.uid() = old.mensajero_id then
        null; -- el mensajero puede liberar el pedido
      else
        raise exception 'no puedes cancelar este pedido';
      end if;
      new.cancelado_en := now();
      -- Si un mensajero ya había pagado la comisión, se le devuelve
      if old.mensajero_id is not null then
        update public.mensajeros set saldo = saldo + comision where id = old.mensajero_id;
        insert into public.movimientos_saldo (mensajero_id, tipo, valor, pedido_id)
        values (old.mensajero_id, 'recarga', comision, old.id);
      end if;
      return new;
    end if;

    if auth.uid() = old.cliente_id then
      if not (old.estado = 'llegue' and new.estado = 'entregado') then
        raise exception 'transición no permitida para el cliente';
      end if;
      new.entregado_en := now();
    elsif auth.uid() = old.mensajero_id then
      if not ((old.estado = 'preparando' and new.estado = 'en_camino')
           or (old.estado = 'en_camino' and new.estado = 'llegue')) then
        raise exception 'transición no permitida para el mensajero';
      end if;
    else
      raise exception 'no puedes cambiar el estado de este pedido';
    end if;
  end if;
  return new;
end $$;

-- 3. Un mensajero que libera un pedido deja de estar asignado
--    (el índice de "una entrega activa" ya no cuenta los cancelados)
drop index if exists una_entrega_activa_por_mensajero;
create unique index una_entrega_activa_por_mensajero
  on public.pedidos (mensajero_id)
  where estado in ('preparando', 'en_camino', 'llegue');

-- 4. Movimientos de saldo: nuevo tipo "cortesía" (primer domicilio gratis)
alter table public.movimientos_saldo drop constraint if exists movimientos_saldo_tipo_check;
alter table public.movimientos_saldo add constraint movimientos_saldo_tipo_check
  check (tipo in ('recarga','comision','cortesia'));
-- Corrección: la devolución de comisión al cancelar la hace el sistema
-- (trigger), no el usuario. proteger_mensajero congelaba el saldo también
-- para esas escrituras internas; ahora reconoce la marca del sistema.
create or replace function public.proteger_mensajero()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role'
     or coalesce(current_setting('pidelo.sistema', true), '') = '1' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.estado := 'en_revision';
    new.saldo := 0;
  else
    new.estado := old.estado;
    new.saldo := old.saldo;
    new.id := old.id;
  end if;
  return new;
end $$;

create or replace function public.validar_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tarifa_envio constant int := 5000;
  comision constant int := 1000;
  suma int;
begin
  if auth.role() = 'service_role' then return new; end if;

  if tg_op = 'INSERT' then
    if new.tipo = 'catalogo' then
      select coalesce(sum(p.precio * greatest((i->>'cantidad')::int, 0)), 0)
        into suma
        from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) i
        join public.productos p on p.id::text = i->>'productoId';
    else
      suma := 0;
    end if;
    new.subtotal := suma;
    new.envio := tarifa_envio;
    new.total := suma + tarifa_envio;
    new.estado := 'buscando';
    new.mensajero_id := null;
    new.entregado_en := null;
    return new;
  end if;

  new.subtotal := old.subtotal;
  new.envio := old.envio;
  new.total := old.total;
  new.items := old.items;
  new.cliente_id := old.cliente_id;

  if new.estado is distinct from old.estado then
    if old.estado in ('entregado','cancelado') then
      raise exception 'el pedido ya está cerrado';
    end if;

    if new.estado = 'cancelado' then
      if auth.uid() = old.cliente_id then
        if old.estado not in ('buscando','preparando') then
          raise exception 'ya no se puede cancelar: el mensajero va en camino';
        end if;
      elsif auth.uid() = old.mensajero_id then
        null;
      else
        raise exception 'no puedes cancelar este pedido';
      end if;
      new.cancelado_en := now();
      if old.mensajero_id is not null then
        -- Devolución de la comisión: escritura del sistema
        perform set_config('pidelo.sistema', '1', true);
        update public.mensajeros set saldo = saldo + comision where id = old.mensajero_id;
        insert into public.movimientos_saldo (mensajero_id, tipo, valor, pedido_id)
        values (old.mensajero_id, 'recarga', comision, old.id);
        perform set_config('pidelo.sistema', '0', true);
      end if;
      return new;
    end if;

    if auth.uid() = old.cliente_id then
      if not (old.estado = 'llegue' and new.estado = 'entregado') then
        raise exception 'transición no permitida para el cliente';
      end if;
      new.entregado_en := now();
    elsif auth.uid() = old.mensajero_id then
      if not ((old.estado = 'preparando' and new.estado = 'en_camino')
           or (old.estado = 'en_camino' and new.estado = 'llegue')) then
        raise exception 'transición no permitida para el mensajero';
      end if;
    else
      raise exception 'no puedes cambiar el estado de este pedido';
    end if;
  end if;
  return new;
end $$;
