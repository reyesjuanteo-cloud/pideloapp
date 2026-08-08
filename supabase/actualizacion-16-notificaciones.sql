-- ============================================================
-- Actualización 16: notificaciones push (2026-08-07)
-- La base avisa a la app (pg_net → /api/push) cuando pasa algo que
-- alguien debe saber aunque tenga la app cerrada:
--   · nueva solicitud → a los trabajadores de esa categoría
--   · nueva oferta    → al cliente de la solicitud
-- El navegador guarda su suscripción y el servidor la usa para enviar.
-- ============================================================

create extension if not exists pg_net;

create table if not exists public.suscripciones_push (
  endpoint text primary key,
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);
create index if not exists suscripciones_usuario_idx on public.suscripciones_push (usuario_id);
alter table public.suscripciones_push enable row level security;

drop policy if exists "mis suscripciones" on public.suscripciones_push;
create policy "mis suscripciones" on public.suscripciones_push
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Aviso de nueva solicitud publicada
create or replace function public.avisar_nueva_solicitud()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform net.http_post(
      url := 'https://pideloapp.vercel.app/api/push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-pidelo-firma', '8037b721a0d469955ca26e33aefd4a697285ad335a286e9a'
      ),
      body := jsonb_build_object(
        'tipo', 'solicitud',
        'solicitud_id', new.id,
        'categoria_id', new.categoria_id
      )
    );
  exception when others then
    null; -- el aviso jamás puede tumbar la publicación
  end;
  return new;
end $$;
drop trigger if exists avisar_nueva_solicitud on public.solicitudes_servicio;
create trigger avisar_nueva_solicitud
  after insert on public.solicitudes_servicio
  for each row execute function public.avisar_nueva_solicitud();

-- Aviso de nueva oferta al cliente
create or replace function public.avisar_nueva_oferta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform net.http_post(
      url := 'https://pideloapp.vercel.app/api/push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-pidelo-firma', '8037b721a0d469955ca26e33aefd4a697285ad335a286e9a'
      ),
      body := jsonb_build_object(
        'tipo', 'oferta',
        'solicitud_id', new.solicitud_id,
        'oferta_id', new.id
      )
    );
  exception when others then
    null;
  end;
  return new;
end $$;
drop trigger if exists avisar_nueva_oferta on public.ofertas_servicio;
create trigger avisar_nueva_oferta
  after insert on public.ofertas_servicio
  for each row execute function public.avisar_nueva_oferta();
