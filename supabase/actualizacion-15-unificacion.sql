-- ============================================================
-- Actualización 15: un solo sistema de subasta (2026-08-07)
--   · El filtro anti-contacto ya no bloquea precios: solo corta
--     números de 9+ dígitos (celulares/fijos CO), correos, redes
--     y números escritos en palabras.
--   · Cancelar un servicio lleva motivo, y el proveedor lo ve.
--   · El interruptor "Disponible" ahora es real: apagado, la base
--     no le muestra solicitudes.
--   · "Mandados" pasa a ser "Mandados y domicilios": los
--     domiciliarios se postulan por subasta como cualquier proveedor.
-- ============================================================

-- 1. Filtro de contacto sin falsos positivos con precios
create or replace function public.detecta_contacto(p_texto text)
returns boolean language plpgsql immutable as $$
declare solo_digitos text;
begin
  if p_texto is null then return false; end if;
  solo_digitos := regexp_replace(p_texto, '[\s\.\-\(\)]', '', 'g');
  -- 9+ dígitos seguidos: celulares (3xx...) y fijos (60x...) colombianos.
  -- Un precio realista ($50.000, $1.200.000) tiene 8 dígitos o menos.
  if solo_digitos ~ '\d{9,}' then return true; end if;
  if p_texto ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then return true; end if;
  if p_texto ~* '(whatsapp|wasap|whats app|telegram|instagram|insta |facebook|tiktok|snapchat|t\.me/|wa\.me/|https?://|www\.|@[a-z0-9._]{3,})' then
    return true;
  end if;
  if p_texto ~* '((cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)[\s,]+){4,}' then
    return true;
  end if;
  return false;
end $$;

-- El chat de pedidos usa la misma vara
create or replace function public.bloquear_datos_personales()
returns trigger language plpgsql as $$
begin
  if public.detecta_contacto(new.texto) then
    raise exception 'contacto_personal';
  end if;
  return new;
end $$;

-- 2. Motivo de cancelación
alter table public.solicitudes_servicio add column if not exists motivo_cancelacion text;

-- 3. Interruptor real: apagado no ve solicitudes
create or replace function public.soy_proveedor_de(p_categoria uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.proveedores p
    join public.proveedor_categorias pc on pc.proveedor_id = p.id
    where p.id = auth.uid() and p.estado = 'aprobado' and p.disponible
      and pc.categoria_id = p_categoria
  )
$$;

-- 4. Los domicilios viven en la subasta
update public.categorias_servicio
  set nombre = 'Mandados y domicilios' where nombre = 'Mandados';

-- 5. La máquina de estados aprende el motivo de cancelación
create or replace function public.validar_solicitud_servicio()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_oferta public.ofertas_servicio%rowtype;
  v_pct numeric;
  v_motivo text;
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
    new.motivo_cancelacion := null;
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

  v_motivo := left(new.motivo_cancelacion, 200);
  new.cliente_id := old.cliente_id;
  new.precio_final := old.precio_final;
  new.comision_pct := old.comision_pct;
  new.comision_valor := old.comision_valor;
  new.contratada_en := old.contratada_en;
  new.terminada_en := old.terminada_en;
  new.codigo := old.codigo;
  new.motivo_cancelacion := old.motivo_cancelacion;

  if auth.uid() = old.cliente_id then
    if old.estado = 'publicada' and new.estado = 'cancelada' then
      new.motivo_cancelacion := v_motivo;
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
      new.motivo_cancelacion := v_motivo;
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

-- Vehículo del trabajador que hace domicilios o acarreos
alter table public.proveedores add column if not exists vehiculo text;
alter table public.proveedores add column if not exists placa text;
