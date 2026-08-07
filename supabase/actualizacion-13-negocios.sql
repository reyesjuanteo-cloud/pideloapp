-- ============================================================
-- Actualización 13 (2026-08-06)
-- A. El mensajero sabe dónde recoger y las indicaciones del cliente
-- B. Los negocios se registran solos y el equipo los aprueba
-- ============================================================

-- A. Indicaciones del cliente viajando con el pedido
alter table public.pedidos add column if not exists indicaciones text;

-- A. Dirección real de recogida del comercio
alter table public.comercios add column if not exists direccion text;
alter table public.comercios add column if not exists lat double precision;
alter table public.comercios add column if not exists lng double precision;

-- B. El comercio como cuenta propia, con revisión del equipo
alter table public.comercios add column if not exists dueno_id uuid references public.perfiles on delete set null;
alter table public.comercios add column if not exists documento text;
alter table public.comercios add column if not exists celular text;
alter table public.comercios add column if not exists correo text;
alter table public.comercios add column if not exists estado text not null default 'aprobado';
alter table public.comercios drop constraint if exists comercios_estado_check;
alter table public.comercios add constraint comercios_estado_check
  check (estado in ('en_revision','aprobado','rechazado'));
alter table public.comercios add column if not exists registrado_en timestamptz not null default now();

-- Los comercios que ya existían quedan aprobados
update public.comercios set estado = 'aprobado' where estado is null;

-- B. El rol "comercio"
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check
  check (rol in ('cliente','mensajero','comercio','admin'));

create or replace function public.proteger_rol()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if tg_op = 'UPDATE' and old.rol = 'admin' then
    new.rol := 'admin';
  elsif new.rol is null or new.rol not in ('cliente','mensajero','comercio') then
    new.rol := coalesce(case when tg_op = 'UPDATE' then old.rol else null end, 'cliente');
  end if;
  return new;
end $$;

-- B. Estado del comercio: lo decide el equipo, no el dueño
create or replace function public.proteger_comercio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role'
     or coalesce(current_setting('pidelo.sistema', true), '') = '1' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.estado := 'en_revision';
    new.abierto := false;
    new.costo_domicilio := 5000;
  else
    new.estado := old.estado;
    new.costo_domicilio := old.costo_domicilio;
    new.dueno_id := old.dueno_id;
  end if;
  return new;
end $$;

drop trigger if exists proteger_comercio on public.comercios;
create trigger proteger_comercio before insert or update on public.comercios
  for each row execute function public.proteger_comercio();

-- B. Quién ve y quién escribe
drop policy if exists "comercios visibles" on public.comercios;
create policy "comercios visibles" on public.comercios
  for select using (
    estado = 'aprobado' or dueno_id = auth.uid() or public.es_admin()
  );

drop policy if exists "registrar mi negocio" on public.comercios;
create policy "registrar mi negocio" on public.comercios
  for insert with check (dueno_id = auth.uid());

drop policy if exists "administrar mi negocio" on public.comercios;
create policy "administrar mi negocio" on public.comercios
  for update using (dueno_id = auth.uid());

-- B. El dueño administra sus productos
create or replace function public.es_mi_comercio(comercio uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.comercios c where c.id = comercio and c.dueno_id = auth.uid()
  )
$$;

drop policy if exists "productos de mi negocio" on public.productos;
create policy "productos de mi negocio" on public.productos
  for all using (public.es_mi_comercio(comercio_id))
  with check (public.es_mi_comercio(comercio_id));

-- B. El dueño ve los pedidos que le entran
create or replace function public.es_pedido_de_mi_comercio(comercio uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select comercio is not null and exists (
    select 1 from public.comercios c where c.id = comercio and c.dueno_id = auth.uid()
  )
$$;

drop policy if exists "cliente ve sus pedidos" on public.pedidos;
create policy "cliente ve sus pedidos" on public.pedidos
  for select using (
    cliente_id = auth.uid()
    or mensajero_id = auth.uid()
    or public.es_admin()
    or public.es_pedido_de_mi_comercio(comercio_id)
    or (estado = 'buscando' and public.soy_mensajero_aprobado())
  );
