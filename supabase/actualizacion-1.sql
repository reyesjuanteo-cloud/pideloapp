-- ============================================================
-- PideloApp — Actualización 1 (2026-08-06)
-- 1) El cliente puede ver quién es el mensajero de SU pedido
-- 2) Bucket de documentos del mensajero (cédula, selfie, licencia, SOAT)
-- Pegar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- El cliente de un pedido puede ver los datos básicos de su mensajero
create policy "cliente ve a su mensajero" on public.mensajeros
  for select using (
    exists (
      select 1 from public.pedidos p
      where p.mensajero_id = mensajeros.id and p.cliente_id = auth.uid()
    )
  );

create policy "cliente ve perfil de su mensajero" on public.perfiles
  for select using (
    exists (
      select 1 from public.pedidos p
      where p.mensajero_id = perfiles.id and p.cliente_id = auth.uid()
    )
  );

-- Bucket privado para documentos del mensajero
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Cada quien sube y ve SOLO su carpeta ({uid}/...). El equipo revisa con la
-- llave secreta desde el panel (URLs firmadas temporales).
create policy "subir mis documentos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "actualizar mis documentos" on storage.objects
  for update to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "ver mis documentos" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);
