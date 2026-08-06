-- Actualización 7: registro de correos enviados al mensajero (2026-08-06)
-- Permite ver en el panel si al aspirante ya se le notificó la decisión.
alter table public.mensajeros
  add column if not exists correo_enviado_en timestamptz;
