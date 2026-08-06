-- Actualización 12: conciliación de pagos (2026-08-06)
-- El webhook puede no llegar (no registrado, red, formato distinto). La app
-- ahora le pregunta a la pasarela por las recargas pendientes, así el saldo
-- se acredita igual. Los avisos que sí lleguen quedan registrados para poder
-- diagnosticar.
create table if not exists public.eventos_pago (
  id uuid primary key default gen_random_uuid(),
  origen text not null default 'bold',
  firma_valida boolean not null default false,
  cuerpo jsonb,
  creado_en timestamptz not null default now()
);
alter table public.eventos_pago enable row level security;
-- Solo el equipo (llave secreta) lo consulta; sin políticas, nadie más entra.

-- La recarga LNK_K9IJSEZZZJ ya fue acreditada a mano desde el panel: se marca
-- como pagada para que la conciliación no la sume otra vez.
update public.recargas
   set estado = 'pagada', pagado_en = now()
 where referencia = 'LNK_K9IJSEZZZJ' and estado = 'pendiente';
