-- Actualización 6: ajustes al registro del mensajero (2026-08-06)
-- · Puede trabajar en los tres municipios ("Todos")
-- · Correo electrónico para enviarle la confirmación
-- · SOAT deja de ser obligatorio (solo se pide la placa)
alter table public.mensajeros drop constraint if exists mensajeros_municipio_check;
alter table public.mensajeros add constraint mensajeros_municipio_check
  check (municipio in ('Girardot', 'Ricaurte', 'Flandes', 'Todos'));

alter table public.perfiles add column if not exists correo text;
