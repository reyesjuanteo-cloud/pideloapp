-- ============================================================
-- Actualización 14: marketplace de servicios (2026-08-07)
--
-- Cuarto rol: proveedores de servicios (plomería, belleza, acarreos,
-- mecánica, mandados…). Contratación cerrada dentro de la app:
--   · el cliente publica qué necesita y cuánto ofrece (subasta)
--   · los proveedores de esa categoría contraofertan
--   · el proveedor solo ve la ZONA aproximada; la dirección exacta se
--     revela únicamente al ser contratado
--   · el chat se abre tras contratar; los intentos de compartir contacto
--     se censuran Y quedan auditados en eventos_riesgo
--   · comisión porcentual configurable desde administración
-- Todo lo delicado vive en triggers SECURITY DEFINER: el navegador no
-- puede fijar precios, comisiones, estados ni saltarse la revisión.
-- ============================================================

-- ---------- 0. Arreglo previo: eliminar cuenta con historial ----------
-- Sin acción de borrado, suprimir el perfil de alguien con pedidos
-- reventaba con violación de llave foránea. El historial queda (ya
-- anonimizado); la referencia personal se suelta.
alter table public.pedidos alter column cliente_id drop not null;
alter table public.pedidos drop constraint if exists pedidos_cliente_id_fkey;
alter table public.pedidos add constraint pedidos_cliente_id_fkey
  foreign key (cliente_id) references public.perfiles(id) on delete set null;
alter table public.pedidos drop constraint if exists pedidos_mensajero_id_fkey;
alter table public.pedidos add constraint pedidos_mensajero_id_fkey
  foreign key (mensajero_id) references public.mensajeros(id) on delete set null;

-- ---------- 1. Configuración editable desde administración ----------
create table if not exists public.config (
  llave text primary key,
  valor text not null,
  descripcion text
);
alter table public.config enable row level security;
drop policy if exists "config visible" on public.config;
create policy "config visible" on public.config for select using (true);

insert into public.config (llave, valor, descripcion) values
  ('comision_servicios_pct', '12', 'Porcentaje que cobra Pídelo por servicio contratado'),
  ('radio_solicitudes_km', '5', 'Radio en km para mostrar solicitudes a proveedores'),
  ('niveles_proveedor',
   '[{"nombre":"INICIAL","minimo":0,"comision":15},{"nombre":"PRO","minimo":100,"comision":12},{"nombre":"ELITE","minimo":500,"comision":10}]',
   'Niveles por servicios completados (preparado para fases siguientes)')
on conflict (llave) do nothing;

create or replace function public.config_num(p_llave text, p_defecto numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select valor::numeric from public.config where llave = p_llave), p_defecto)
$$;

-- ---------- 2. Categorías ----------
create table if not exists public.categorias_servicio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activa boolean not null default true,
  orden int not null default 100
);
alter table public.categorias_servicio enable row level security;
drop policy if exists "categorias visibles" on public.categorias_servicio;
create policy "categorias visibles" on public.categorias_servicio
  for select using (true);

insert into public.categorias_servicio (nombre, orden) values
  ('Mandados', 1), ('Acarreos y trasteos', 2), ('Plomería', 3),
  ('Electricidad', 4), ('Aire acondicionado', 5), ('Limpieza', 6),
  ('Belleza y peluquería', 7), ('Mecánica', 8), ('Tecnología', 9), ('Otro', 99)
on conflict (nombre) do nothing;

-- ---------- 3. Proveedores ----------
create table if not exists public.proveedores (
  id uuid primary key references public.perfiles(id) on delete cascade,
  documento text not null,
  descripcion text,
  municipio text not null,
  lat double precision,
  lng double precision,
  radio_km int not null default 5 check (radio_km between 1 and 30),
  disponible boolean not null default true,
  estado text not null default 'en_revision'
    check (estado in ('en_revision','aprobado','rechazado','suspendido')),
  servicios_completados int not null default 0,
  creado_en timestamptz not null default now()
);
create table if not exists public.proveedor_categorias (
  proveedor_id uuid not null references public.proveedores(id) on delete cascade,
  categoria_id uuid not null references public.categorias_servicio(id) on delete cascade,
  primary key (proveedor_id, categoria_id)
);
alter table public.proveedores enable row level security;
alter table public.proveedor_categorias enable row level security;

drop policy if exists "mi registro de proveedor" on public.proveedores;
create policy "mi registro de proveedor" on public.proveedores
  for select using (id = auth.uid() or public.es_admin());
drop policy if exists "registrarme como proveedor" on public.proveedores;
create policy "registrarme como proveedor" on public.proveedores
  for insert with check (id = auth.uid());
drop policy if exists "editar mi registro" on public.proveedores;
create policy "editar mi registro" on public.proveedores
  for update using (id = auth.uid());
drop policy if exists "mis categorias" on public.proveedor_categorias;
create policy "mis categorias" on public.proveedor_categorias
  for all using (proveedor_id = auth.uid()) with check (proveedor_id = auth.uid());

-- Estado y contadores: solo el sistema. Nadie se autoaprueba.
create or replace function public.proteger_proveedor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role'
     or coalesce(current_setting('pidelo.sistema', true), '') = '1' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.estado := 'en_revision';
    new.servicios_completados := 0;
  else
    new.estado := old.estado;
    new.servicios_completados := old.servicios_completados;
    new.documento := old.documento;
  end if;
  return new;
end $$;
drop trigger if exists proteger_proveedor on public.proveedores;
create trigger proteger_proveedor before insert or update on public.proveedores
  for each row execute function public.proteger_proveedor();

-- ---------- 4. Detección de datos de contacto (compartida) ----------
create or replace function public.detecta_contacto(p_texto text)
returns boolean language plpgsql immutable as $$
declare solo_digitos text;
begin
  if p_texto is null then return false; end if;
  solo_digitos := regexp_replace(p_texto, '[\s\.\-\(\)]', '', 'g');
  if solo_digitos ~ '\d{7,}' then return true; end if;
  if p_texto ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then return true; end if;
  if p_texto ~* '(whatsapp|wasap|whats app|telegram|instagram|insta |facebook|tiktok|snapchat|t\.me/|wa\.me/|https?://|www\.|@[a-z0-9._]{3,})' then
    return true;
  end if;
  -- Números escritos en palabras ("tres cero cero…"): 4+ dígitos en palabras seguidos
  if p_texto ~* '((cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)[\s,]+){4,}' then
    return true;
  end if;
  return false;
end $$;

-- ---------- 5. Auditoría de riesgo ----------
create table if not exists public.eventos_riesgo (
  id bigint generated always as identity primary key,
  usuario_id uuid,
  tipo text not null,
  origen text,
  detalle text,
  creado_en timestamptz not null default now()
);
create index if not exists eventos_riesgo_usuario_idx on public.eventos_riesgo (usuario_id, creado_en desc);
alter table public.eventos_riesgo enable row level security;
drop policy if exists "riesgo solo equipo" on public.eventos_riesgo;
create policy "riesgo solo equipo" on public.eventos_riesgo
  for select using (public.es_admin());

-- ---------- 6. Solicitudes (lo público lleva solo la zona aproximada) ----------
create table if not exists public.solicitudes_servicio (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  cliente_id uuid references public.perfiles(id) on delete set null,
  categoria_id uuid not null references public.categorias_servicio(id),
  descripcion text not null check (length(descripcion) between 10 and 1200),
  oferta_cliente int check (oferta_cliente between 1000 and 10000000),
  barrio text,
  ciudad text not null default 'Girardot',
  lat_aprox double precision,
  lng_aprox double precision,
  estado text not null default 'publicada' check (estado in
    ('publicada','contratada','en_camino','llegue','en_progreso',
     'terminada_proveedor','completada','disputada','cancelada')),
  proveedor_id uuid references public.proveedores(id) on delete set null,
  precio_final int,
  comision_pct numeric,
  comision_valor int,
  creado_en timestamptz not null default now(),
  contratada_en timestamptz,
  terminada_en timestamptz
);
create index if not exists solicitudes_estado_idx on public.solicitudes_servicio (estado, categoria_id, creado_en desc);
create index if not exists solicitudes_cliente_idx on public.solicitudes_servicio (cliente_id, creado_en desc);
create index if not exists solicitudes_proveedor_idx on public.solicitudes_servicio (proveedor_id, creado_en desc);

-- La dirección exacta vive aparte: así la ve solo quien debe verla.
create table if not exists public.direcciones_solicitud (
  solicitud_id uuid primary key references public.solicitudes_servicio(id) on delete cascade,
  direccion text not null,
  indicaciones text,
  lat double precision not null,
  lng double precision not null
);

create table if not exists public.ofertas_servicio (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes_servicio(id) on delete cascade,
  proveedor_id uuid not null references public.proveedores(id) on delete cascade,
  precio int not null check (precio between 1000 and 10000000),
  llegada_min int check (llegada_min between 1 and 1440),
  mensaje text check (mensaje is null or length(mensaje) <= 300),
  estado text not null default 'activa'
    check (estado in ('activa','aceptada','descartada','retirada')),
  creado_en timestamptz not null default now(),
  unique (solicitud_id, proveedor_id)
);
create index if not exists ofertas_solicitud_idx on public.ofertas_servicio (solicitud_id, creado_en);

create table if not exists public.historial_solicitud (
  id bigint generated always as identity primary key,
  solicitud_id uuid not null references public.solicitudes_servicio(id) on delete cascade,
  de_estado text,
  a_estado text not null,
  actor uuid,
  creado_en timestamptz not null default now()
);
alter table public.historial_solicitud enable row level security;

create table if not exists public.mensajes_servicio (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes_servicio(id) on delete cascade,
  autor_id uuid references public.perfiles(id) on delete cascade,
  texto text not null check (length(texto) between 1 and 1000),
  bloqueado boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists mensajes_servicio_idx on public.mensajes_servicio (solicitud_id, creado_en);

alter table public.solicitudes_servicio enable row level security;
alter table public.direcciones_solicitud enable row level security;
alter table public.ofertas_servicio enable row level security;
alter table public.mensajes_servicio enable row level security;

-- ---------- 7. Ayudantes sin recursión ----------
create or replace function public.soy_proveedor_de(p_categoria uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.proveedores p
    join public.proveedor_categorias pc on pc.proveedor_id = p.id
    where p.id = auth.uid() and p.estado = 'aprobado' and pc.categoria_id = p_categoria
  )
$$;

create or replace function public.participo_en_solicitud(p_solicitud uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.solicitudes_servicio s
    where s.id = p_solicitud
      and (s.cliente_id = auth.uid() or s.proveedor_id = auth.uid())
  )
$$;

-- La dirección exacta: el cliente siempre; el proveedor SOLO contratado y en curso
create or replace function public.puedo_ver_direccion(p_solicitud uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.solicitudes_servicio s
    where s.id = p_solicitud
      and (s.cliente_id = auth.uid()
        or (s.proveedor_id = auth.uid()
            and s.estado in ('contratada','en_camino','llegue','en_progreso','terminada_proveedor')))
  )
$$;

create or replace function public.chat_abierto(p_solicitud uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.solicitudes_servicio s
    where s.id = p_solicitud
      and (s.cliente_id = auth.uid() or s.proveedor_id = auth.uid())
      and s.estado in ('contratada','en_camino','llegue','en_progreso','terminada_proveedor','disputada')
  )
$$;

-- ---------- 8. Políticas ----------
drop policy if exists "ver solicitudes" on public.solicitudes_servicio;
create policy "ver solicitudes" on public.solicitudes_servicio
  for select using (
    cliente_id = auth.uid()
    or proveedor_id = auth.uid()
    or public.es_admin()
    or (estado = 'publicada' and public.soy_proveedor_de(categoria_id))
  );
drop policy if exists "publicar solicitud" on public.solicitudes_servicio;
create policy "publicar solicitud" on public.solicitudes_servicio
  for insert with check (cliente_id = auth.uid());
drop policy if exists "avanzar solicitud" on public.solicitudes_servicio;
create policy "avanzar solicitud" on public.solicitudes_servicio
  for update using (
    cliente_id = auth.uid() or proveedor_id = auth.uid() or public.es_admin()
  );

drop policy if exists "ver direccion" on public.direcciones_solicitud;
create policy "ver direccion" on public.direcciones_solicitud
  for select using (public.puedo_ver_direccion(solicitud_id) or public.es_admin());
drop policy if exists "guardar direccion" on public.direcciones_solicitud;
create policy "guardar direccion" on public.direcciones_solicitud
  for insert with check (
    exists (select 1 from public.solicitudes_servicio s
            where s.id = solicitud_id and s.cliente_id = auth.uid())
  );

drop policy if exists "ver ofertas" on public.ofertas_servicio;
create policy "ver ofertas" on public.ofertas_servicio
  for select using (
    proveedor_id = auth.uid()
    or public.participo_en_solicitud(solicitud_id)
    or public.es_admin()
  );
drop policy if exists "ofertar" on public.ofertas_servicio;
create policy "ofertar" on public.ofertas_servicio
  for insert with check (proveedor_id = auth.uid());
drop policy if exists "retirar mi oferta" on public.ofertas_servicio;
create policy "retirar mi oferta" on public.ofertas_servicio
  for update using (proveedor_id = auth.uid() or public.es_admin());

drop policy if exists "ver historial" on public.historial_solicitud;
create policy "ver historial" on public.historial_solicitud
  for select using (public.participo_en_solicitud(solicitud_id) or public.es_admin());

drop policy if exists "ver chat servicio" on public.mensajes_servicio;
create policy "ver chat servicio" on public.mensajes_servicio
  for select using (
    (public.participo_en_solicitud(solicitud_id) and (not bloqueado or autor_id = auth.uid()))
    or public.es_admin()
  );
drop policy if exists "escribir chat servicio" on public.mensajes_servicio;
create policy "escribir chat servicio" on public.mensajes_servicio
  for insert with check (autor_id = auth.uid() and public.chat_abierto(solicitud_id));

-- ---------- 9. La máquina de estados (el navegador no manda aquí) ----------
create or replace function public.validar_solicitud_servicio()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_oferta public.ofertas_servicio%rowtype;
  v_pct numeric;
begin
  if auth.role() = 'service_role'
     or coalesce(current_setting('pidelo.sistema', true), '') = '1' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.cliente_id := auth.uid();
    new.estado := 'publicada';
    new.proveedor_id := null;
    new.precio_final := null;
    new.comision_pct := null;
    new.comision_valor := null;
    new.codigo := 'SV-' || upper(substring(md5(gen_random_uuid()::text) from 1 for 5));
    -- La zona pública se redondea (~110 m): el proveedor ve la zona, no la casa
    new.lat_aprox := round(new.lat_aprox::numeric, 3);
    new.lng_aprox := round(new.lng_aprox::numeric, 3);
    if public.detecta_contacto(new.descripcion) then
      insert into public.eventos_riesgo (usuario_id, tipo, origen, detalle)
      values (auth.uid(), 'CONTACT_INFO_ATTEMPT', 'descripcion_solicitud', left(new.descripcion, 300));
      raise exception 'contacto_personal';
    end if;
    return new;
  end if;

  -- UPDATE: nadie toca el dinero directamente
  new.cliente_id := old.cliente_id;
  new.precio_final := old.precio_final;
  new.comision_pct := old.comision_pct;
  new.comision_valor := old.comision_valor;
  new.contratada_en := old.contratada_en;
  new.terminada_en := old.terminada_en;
  new.codigo := old.codigo;

  if auth.uid() = old.cliente_id then
    if old.estado = 'publicada' and new.estado = 'cancelada' then
      null; -- cancelar antes de contratar, sin costo
    elsif old.estado = 'publicada' and new.estado = 'contratada' then
      -- CONTRATAR: el precio sale de la oferta elegida, jamás del navegador
      select * into v_oferta from public.ofertas_servicio
        where solicitud_id = old.id and proveedor_id = new.proveedor_id and estado = 'activa';
      if v_oferta.id is null then
        raise exception 'oferta_invalida';
      end if;
      v_pct := public.config_num('comision_servicios_pct', 12);
      new.precio_final := v_oferta.precio;
      new.comision_pct := v_pct;
      new.comision_valor := round(v_oferta.precio * v_pct / 100.0);
      new.contratada_en := now();
      update public.ofertas_servicio set estado = 'aceptada' where id = v_oferta.id;
      update public.ofertas_servicio set estado = 'descartada'
        where solicitud_id = old.id and id <> v_oferta.id and estado = 'activa';
    elsif old.estado = 'contratada' and new.estado = 'cancelada' then
      new.proveedor_id := old.proveedor_id; -- queda en el registro
    elsif old.estado = 'terminada_proveedor' and new.estado in ('completada','disputada') then
      new.proveedor_id := old.proveedor_id;
      new.terminada_en := now();
      if new.estado = 'completada' then
        perform set_config('pidelo.sistema', '1', true);
        update public.proveedores
          set servicios_completados = servicios_completados + 1
          where id = old.proveedor_id;
        perform set_config('pidelo.sistema', '', true);
      end if;
    elsif old.estado = new.estado then
      null; -- editar descripción mientras está publicada
    else
      raise exception 'transicion_invalida';
    end if;
    if new.estado = old.estado and old.estado = 'publicada'
       and public.detecta_contacto(new.descripcion) then
      insert into public.eventos_riesgo (usuario_id, tipo, origen, detalle)
      values (auth.uid(), 'CONTACT_INFO_ATTEMPT', 'descripcion_solicitud', left(new.descripcion, 300));
      raise exception 'contacto_personal';
    end if;
    if old.estado <> 'publicada' then
      new.descripcion := old.descripcion;
      new.oferta_cliente := old.oferta_cliente;
    end if;
    if not (old.estado = 'publicada' and new.estado = 'contratada') then
      new.proveedor_id := old.proveedor_id;
    end if;
    return new;
  end if;

  if auth.uid() = old.proveedor_id then
    new.descripcion := old.descripcion;
    new.oferta_cliente := old.oferta_cliente;
    if (old.estado = 'contratada' and new.estado = 'en_camino')
       or (old.estado = 'en_camino' and new.estado = 'llegue')
       or (old.estado = 'llegue' and new.estado = 'en_progreso')
       or (old.estado = 'en_progreso' and new.estado = 'terminada_proveedor') then
      new.proveedor_id := old.proveedor_id;
    elsif old.estado = 'contratada' and new.estado = 'publicada' then
      -- Soltar el trabajo: vuelve a la subasta y su oferta se descarta
      new.proveedor_id := null;
      new.precio_final := null;
      new.comision_pct := null;
      new.comision_valor := null;
      new.contratada_en := null;
      update public.ofertas_servicio set estado = 'descartada'
        where solicitud_id = old.id and proveedor_id = old.proveedor_id;
      insert into public.eventos_riesgo (usuario_id, tipo, origen, detalle)
      values (auth.uid(), 'ORDER_RELEASED_AFTER_HIRE', 'solicitud', old.codigo);
    else
      raise exception 'transicion_invalida';
    end if;
    return new;
  end if;

  raise exception 'sin_permiso';
end $$;
drop trigger if exists validar_solicitud_servicio on public.solicitudes_servicio;
create trigger validar_solicitud_servicio
  before insert or update on public.solicitudes_servicio
  for each row execute function public.validar_solicitud_servicio();

-- Historial de cada cambio de estado
create or replace function public.registrar_historial_solicitud()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.historial_solicitud (solicitud_id, de_estado, a_estado, actor)
    values (new.id, null, new.estado, auth.uid());
  elsif old.estado is distinct from new.estado then
    insert into public.historial_solicitud (solicitud_id, de_estado, a_estado, actor)
    values (new.id, old.estado, new.estado, auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists registrar_historial_solicitud on public.solicitudes_servicio;
create trigger registrar_historial_solicitud
  after insert or update on public.solicitudes_servicio
  for each row execute function public.registrar_historial_solicitud();

-- ---------- 10. Ofertas: solo proveedores aprobados de la categoría ----------
create or replace function public.validar_oferta_servicio()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_solicitud public.solicitudes_servicio%rowtype;
begin
  if auth.role() = 'service_role'
     or coalesce(current_setting('pidelo.sistema', true), '') = '1' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.proveedor_id := auth.uid();
    new.estado := 'activa';
    select * into v_solicitud from public.solicitudes_servicio where id = new.solicitud_id;
    if v_solicitud.estado <> 'publicada' then
      raise exception 'solicitud_cerrada';
    end if;
    if not public.soy_proveedor_de(v_solicitud.categoria_id) then
      raise exception 'sin_permiso';
    end if;
    if v_solicitud.cliente_id = auth.uid() then
      raise exception 'sin_permiso'; -- nadie se contrata a sí mismo
    end if;
    -- El mensaje pasa el mismo filtro del chat; el intento queda auditado
    if public.detecta_contacto(new.mensaje) then
      insert into public.eventos_riesgo (usuario_id, tipo, origen, detalle)
      values (auth.uid(), 'CONTACT_INFO_ATTEMPT', 'mensaje_oferta', left(new.mensaje, 300));
      new.mensaje := null;
    end if;
    return new;
  end if;

  -- UPDATE del proveedor: solo retirar su oferta activa
  if auth.uid() = old.proveedor_id
     and old.estado = 'activa' and new.estado = 'retirada' then
    new.precio := old.precio;
    new.llegada_min := old.llegada_min;
    new.mensaje := old.mensaje;
    new.solicitud_id := old.solicitud_id;
    new.proveedor_id := old.proveedor_id;
    return new;
  end if;
  raise exception 'sin_permiso';
end $$;
drop trigger if exists validar_oferta_servicio on public.ofertas_servicio;
create trigger validar_oferta_servicio
  before insert or update on public.ofertas_servicio
  for each row execute function public.validar_oferta_servicio();

-- ---------- 11. Chat: censura con auditoría (no rollback) ----------
-- Se marca bloqueado en vez de rechazar: así el intento y su texto quedan
-- en la auditoría, el destinatario nunca lo ve, y el autor recibe el aviso.
create or replace function public.moderar_mensaje_servicio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.detecta_contacto(new.texto) then
    new.bloqueado := true;
    insert into public.eventos_riesgo (usuario_id, tipo, origen, detalle)
    values (new.autor_id, 'CONTACT_INFO_ATTEMPT', 'chat_servicio', left(new.texto, 300));
  end if;
  return new;
end $$;
drop trigger if exists moderar_mensaje_servicio on public.mensajes_servicio;
create trigger moderar_mensaje_servicio
  before insert on public.mensajes_servicio
  for each row execute function public.moderar_mensaje_servicio();

-- ---------- 12. Tiempo real ----------
do $$ begin
  alter publication supabase_realtime add table public.solicitudes_servicio;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.ofertas_servicio;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.mensajes_servicio;
exception when duplicate_object then null; end $$;

-- ---------- Corrección: las escrituras internas del sistema ----------
-- Al contratar, el trigger de solicitudes actualiza las ofertas; el trigger
-- de ofertas rechazaba ese cambio porque corre como el cliente. Las
-- escrituras internas se marcan con pidelo.sistema, igual que en las
-- devoluciones de comisión.
create or replace function public.validar_solicitud_servicio()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_oferta public.ofertas_servicio%rowtype;
  v_pct numeric;
begin
  if auth.role() = 'service_role'
     or coalesce(current_setting('pidelo.sistema', true), '') = '1' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.cliente_id := auth.uid();
    new.estado := 'publicada';
    new.proveedor_id := null;
    new.precio_final := null;
    new.comision_pct := null;
    new.comision_valor := null;
    new.codigo := 'SV-' || upper(substring(md5(gen_random_uuid()::text) from 1 for 5));
    new.lat_aprox := round(new.lat_aprox::numeric, 3);
    new.lng_aprox := round(new.lng_aprox::numeric, 3);
    if public.detecta_contacto(new.descripcion) then
      insert into public.eventos_riesgo (usuario_id, tipo, origen, detalle)
      values (auth.uid(), 'CONTACT_INFO_ATTEMPT', 'descripcion_solicitud', left(new.descripcion, 300));
      raise exception 'contacto_personal';
    end if;
    return new;
  end if;

  new.cliente_id := old.cliente_id;
  new.precio_final := old.precio_final;
  new.comision_pct := old.comision_pct;
  new.comision_valor := old.comision_valor;
  new.contratada_en := old.contratada_en;
  new.terminada_en := old.terminada_en;
  new.codigo := old.codigo;

  if auth.uid() = old.cliente_id then
    if old.estado = 'publicada' and new.estado = 'cancelada' then
      null;
    elsif old.estado = 'publicada' and new.estado = 'contratada' then
      select * into v_oferta from public.ofertas_servicio
        where solicitud_id = old.id and proveedor_id = new.proveedor_id and estado = 'activa';
      if v_oferta.id is null then
        raise exception 'oferta_invalida';
      end if;
      v_pct := public.config_num('comision_servicios_pct', 12);
      new.precio_final := v_oferta.precio;
      new.comision_pct := v_pct;
      new.comision_valor := round(v_oferta.precio * v_pct / 100.0);
      new.contratada_en := now();
      perform set_config('pidelo.sistema', '1', true);
      update public.ofertas_servicio set estado = 'aceptada' where id = v_oferta.id;
      update public.ofertas_servicio set estado = 'descartada'
        where solicitud_id = old.id and id <> v_oferta.id and estado = 'activa';
      perform set_config('pidelo.sistema', '', true);
    elsif old.estado = 'contratada' and new.estado = 'cancelada' then
      new.proveedor_id := old.proveedor_id;
    elsif old.estado = 'terminada_proveedor' and new.estado in ('completada','disputada') then
      new.proveedor_id := old.proveedor_id;
      new.terminada_en := now();
      if new.estado = 'completada' then
        perform set_config('pidelo.sistema', '1', true);
        update public.proveedores
          set servicios_completados = servicios_completados + 1
          where id = old.proveedor_id;
        perform set_config('pidelo.sistema', '', true);
      end if;
    elsif old.estado = new.estado then
      null;
    else
      raise exception 'transicion_invalida';
    end if;
    if new.estado = old.estado and old.estado = 'publicada'
       and public.detecta_contacto(new.descripcion) then
      insert into public.eventos_riesgo (usuario_id, tipo, origen, detalle)
      values (auth.uid(), 'CONTACT_INFO_ATTEMPT', 'descripcion_solicitud', left(new.descripcion, 300));
      raise exception 'contacto_personal';
    end if;
    if old.estado <> 'publicada' then
      new.descripcion := old.descripcion;
      new.oferta_cliente := old.oferta_cliente;
    end if;
    if not (old.estado = 'publicada' and new.estado = 'contratada') then
      new.proveedor_id := old.proveedor_id;
    end if;
    return new;
  end if;

  if auth.uid() = old.proveedor_id then
    new.descripcion := old.descripcion;
    new.oferta_cliente := old.oferta_cliente;
    if (old.estado = 'contratada' and new.estado = 'en_camino')
       or (old.estado = 'en_camino' and new.estado = 'llegue')
       or (old.estado = 'llegue' and new.estado = 'en_progreso')
       or (old.estado = 'en_progreso' and new.estado = 'terminada_proveedor') then
      new.proveedor_id := old.proveedor_id;
    elsif old.estado = 'contratada' and new.estado = 'publicada' then
      new.proveedor_id := null;
      new.precio_final := null;
      new.comision_pct := null;
      new.comision_valor := null;
      new.contratada_en := null;
      perform set_config('pidelo.sistema', '1', true);
      update public.ofertas_servicio set estado = 'descartada'
        where solicitud_id = old.id and proveedor_id = old.proveedor_id;
      perform set_config('pidelo.sistema', '', true);
      insert into public.eventos_riesgo (usuario_id, tipo, origen, detalle)
      values (auth.uid(), 'ORDER_RELEASED_AFTER_HIRE', 'solicitud', old.codigo);
    else
      raise exception 'transicion_invalida';
    end if;
    return new;
  end if;

  raise exception 'sin_permiso';
end $$;

-- ---------- Ofertas enriquecidas para el cliente ----------
-- El cliente necesita nombre y trayectoria de quien le oferta, pero la tabla
-- proveedores guarda la cédula: en vez de abrirla, esta función entrega solo
-- lo público y verifica que quien pregunta sea el dueño de la solicitud.
create or replace function public.ofertas_de_solicitud(p_solicitud uuid)
returns table (
  id uuid,
  proveedor_id uuid,
  nombre text,
  servicios_completados int,
  precio int,
  llegada_min int,
  mensaje text,
  estado text
) language sql stable security definer set search_path = public as $$
  select o.id, o.proveedor_id,
         coalesce(pf.nombre, 'Proveedor'),
         pv.servicios_completados,
         o.precio, o.llegada_min, o.mensaje, o.estado
  from public.ofertas_servicio o
  join public.proveedores pv on pv.id = o.proveedor_id
  left join public.perfiles pf on pf.id = o.proveedor_id
  where o.solicitud_id = p_solicitud
    and exists (
      select 1 from public.solicitudes_servicio s
      where s.id = p_solicitud
        and (s.cliente_id = auth.uid() or public.es_admin())
    )
  order by o.precio
$$;
