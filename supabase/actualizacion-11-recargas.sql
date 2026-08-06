-- Actualización 11: recargas con pasarela de pagos (2026-08-06)
-- Cada intento de recarga queda registrado para poder confirmarlo cuando
-- Bold avisa que el pago entró.
create table if not exists public.recargas (
  id uuid primary key default gen_random_uuid(),
  mensajero_id uuid not null references public.mensajeros on delete cascade,
  monto int not null check (monto >= 5000),
  medio text not null default 'bold' check (medio in ('bold','nequi')),
  estado text not null default 'pendiente' check (estado in ('pendiente','pagada','fallida')),
  referencia text,           -- enlace o identificador de la pasarela
  creado_en timestamptz not null default now(),
  pagado_en timestamptz
);

create index if not exists recargas_mensajero_idx on public.recargas (mensajero_id, creado_en desc);

alter table public.recargas enable row level security;

drop policy if exists "mis recargas" on public.recargas;
create policy "mis recargas" on public.recargas
  for select using (mensajero_id = auth.uid() or public.es_admin());
