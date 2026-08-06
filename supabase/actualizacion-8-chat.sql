-- ============================================================
-- Actualización 8: chat entre el cliente y su mensajero (2026-08-06)
-- Solo las dos personas del pedido pueden leer y escribir.
-- ============================================================
create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos on delete cascade,
  autor_id uuid not null references public.perfiles on delete cascade,
  texto text not null check (length(trim(texto)) between 1 and 500),
  creado_en timestamptz not null default now()
);

create index if not exists mensajes_pedido_idx on public.mensajes (pedido_id, creado_en);

alter table public.mensajes enable row level security;

-- ¿Soy el cliente o el mensajero de este pedido? (SECURITY DEFINER evita
-- la recursión de políticas entre pedidos y mensajes)
create or replace function public.participo_en_pedido(pedido uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pedidos p
    where p.id = pedido and (p.cliente_id = auth.uid() or p.mensajero_id = auth.uid())
  )
$$;

drop policy if exists "ver mensajes de mi pedido" on public.mensajes;
create policy "ver mensajes de mi pedido" on public.mensajes
  for select using (public.participo_en_pedido(pedido_id) or public.es_admin());

drop policy if exists "escribir en mi pedido" on public.mensajes;
create policy "escribir en mi pedido" on public.mensajes
  for insert with check (
    autor_id = auth.uid() and public.participo_en_pedido(pedido_id)
  );

-- El mensajero puede ver el perfil del cliente al que le entrega (para
-- llamarlo). El caso inverso ya existe desde la actualización 3.
create or replace function public.es_cliente_de_mi_entrega(cliente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pedidos p
    where p.cliente_id = cliente
      and p.mensajero_id = auth.uid()
      and p.estado in ('preparando', 'en_camino', 'llegue')
  )
$$;

drop policy if exists "mensajero ve a su cliente" on public.perfiles;
create policy "mensajero ve a su cliente" on public.perfiles
  for select using (public.es_cliente_de_mi_entrega(perfiles.id));
