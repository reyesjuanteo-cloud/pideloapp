-- ============================================================
-- PideloApp — Actualización 2: BLINDAJE DE SEGURIDAD (2026-08-06)
-- Reemplaza y AMPLÍA a actualizacion-1.sql (es idempotente: se puede
-- correr aunque ya hayas corrido la anterior).
--
-- Corrige, verificado con ataques reales contra la base:
--   1. Cualquiera podía ponerse rol='admin' y quedar con acceso total.
--   2. Un mensajero podía auto-aprobarse y ponerse el saldo que quisiera.
--   3. El cliente fijaba sus propios precios (envío $0).
--   4. El mensajero podía marcar "entregado" sin el cliente.
--   5. Cualquiera podía crear/editar comercios y productos.
-- Pegar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1. El ROL nunca lo decide el usuario (raíz de todo lo demás)
-- ------------------------------------------------------------
create or replace function public.proteger_rol()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then
    return new;  -- el equipo, vía server actions con la llave secreta
  end if;
  if tg_op = 'UPDATE' and old.rol = 'admin' then
    new.rol := 'admin';                       -- no se auto-degrada
  elsif new.rol is null or new.rol not in ('cliente', 'mensajero') then
    new.rol := coalesce(
      case when tg_op = 'UPDATE' then old.rol else null end, 'cliente');
  end if;
  return new;
end $$;

drop trigger if exists proteger_rol on public.perfiles;
create trigger proteger_rol before insert or update on public.perfiles
  for each row execute function public.proteger_rol();

-- ------------------------------------------------------------
-- 2. Estado y saldo del mensajero: los decide el sistema
-- ------------------------------------------------------------
create or replace function public.proteger_mensajero()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then
    return new;  -- aprobación del equipo y movimientos de saldo
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

drop trigger if exists proteger_mensajero on public.mensajeros;
create trigger proteger_mensajero before insert or update on public.mensajeros
  for each row execute function public.proteger_mensajero();

-- ------------------------------------------------------------
-- 3. Pedidos: precios calculados en el servidor y máquina de estados
-- ------------------------------------------------------------
create or replace function public.validar_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tarifa_envio constant int := 5000;  -- ver features/pedidos/tarifas.ts
  suma int;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- El precio NO viene del navegador: se recalcula aquí.
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
    new.estado := 'buscando';      -- todo pedido nace disponible
    new.mensajero_id := null;
    new.entregado_en := null;
    return new;
  end if;

  -- UPDATE: precios inmutables
  new.subtotal := old.subtotal;
  new.envio := old.envio;
  new.total := old.total;
  new.items := old.items;
  new.cliente_id := old.cliente_id;

  if new.estado is distinct from old.estado then
    if auth.uid() = old.cliente_id then
      -- El cliente SOLO confirma la entrega
      if not (old.estado = 'llegue' and new.estado = 'entregado') then
        raise exception 'transición no permitida para el cliente';
      end if;
      new.entregado_en := now();
    elsif auth.uid() = old.mensajero_id then
      -- El mensajero avanza hasta "llegué"; nunca marca entregado
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

drop trigger if exists validar_pedido on public.pedidos;
create trigger validar_pedido before insert or update on public.pedidos
  for each row execute function public.validar_pedido();

-- Tomar un pedido pasa siempre por la server action (descuenta comisión):
-- ningún cliente anónimo puede asignarse pedidos directamente.
drop policy if exists "actualizar pedido" on public.pedidos;
create policy "actualizar pedido" on public.pedidos
  for update using (cliente_id = auth.uid() or mensajero_id = auth.uid());

-- ------------------------------------------------------------
-- 4. Comercios y productos: escritura solo del equipo (llave secreta)
-- ------------------------------------------------------------
drop policy if exists "comercios admin" on public.comercios;
drop policy if exists "productos admin" on public.productos;
-- (las políticas de lectura pública se mantienen)

-- ------------------------------------------------------------
-- 5. El cliente ve quién es SU mensajero (de actualizacion-1)
-- ------------------------------------------------------------
drop policy if exists "cliente ve a su mensajero" on public.mensajeros;
create policy "cliente ve a su mensajero" on public.mensajeros
  for select using (
    exists (select 1 from public.pedidos p
            where p.mensajero_id = mensajeros.id and p.cliente_id = auth.uid())
  );

drop policy if exists "cliente ve perfil de su mensajero" on public.perfiles;
create policy "cliente ve perfil de su mensajero" on public.perfiles
  for select using (
    exists (select 1 from public.pedidos p
            where p.mensajero_id = perfiles.id and p.cliente_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 6. Documentos: bucket privado, carpeta por usuario (de actualizacion-1)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

drop policy if exists "subir mis documentos" on storage.objects;
create policy "subir mis documentos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "actualizar mis documentos" on storage.objects;
create policy "actualizar mis documentos" on storage.objects
  for update to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "ver mis documentos" on storage.objects;
create policy "ver mis documentos" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- 7. Limpiar cualquier admin que se haya colado durante las pruebas
-- ------------------------------------------------------------
update public.perfiles set rol = 'cliente'
 where rol = 'admin' and id not in (select id from public.perfiles limit 0);
