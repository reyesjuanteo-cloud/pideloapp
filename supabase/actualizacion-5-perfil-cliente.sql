alter table public.perfiles add column if not exists sexo text;
alter table public.perfiles drop constraint if exists perfiles_sexo_check;
alter table public.perfiles add constraint perfiles_sexo_check
  check (sexo is null or sexo in ('masculino', 'femenino', 'otro'));
