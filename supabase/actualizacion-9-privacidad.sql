-- ============================================================
-- Actualización 9: privacidad en el chat (2026-08-06)
-- Nadie comparte teléfonos por el chat: se bloquea en la base, así no
-- basta con modificar la app para saltarse la regla.
-- ============================================================
create or replace function public.bloquear_datos_personales()
returns trigger language plpgsql as $$
declare
  solo_digitos text;
begin
  -- Dígitos del mensaje ignorando espacios, guiones y puntos: 7 o más
  -- seguidos es un teléfono (los precios de la app son de 4-6 dígitos).
  solo_digitos := regexp_replace(new.texto, '[\s\.\-\(\)]', '', 'g');
  if solo_digitos ~ '\d{7,}' then
    raise exception 'contacto_personal';
  end if;
  -- Correos y redes sociales
  if new.texto ~* '[a-z0-9._%%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then
    raise exception 'contacto_personal';
  end if;
  if new.texto ~* '(whatsapp|wasap|whats app|telegram|instagram|facebook|t\.me/|wa\.me/)' then
    raise exception 'contacto_personal';
  end if;
  return new;
end $$;

drop trigger if exists bloquear_datos_personales on public.mensajes;
create trigger bloquear_datos_personales before insert on public.mensajes
  for each row execute function public.bloquear_datos_personales();

-- Ampliación: redes sociales y usuarios @alguien

create or replace function public.bloquear_datos_personales()
returns trigger language plpgsql as $$
declare solo_digitos text;
begin
  solo_digitos := regexp_replace(new.texto, '[\s\.\-\(\)]', '', 'g');
  if solo_digitos ~ '\d{7,}' then raise exception 'contacto_personal'; end if;
  if new.texto ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then raise exception 'contacto_personal'; end if;
  -- Redes y apodos de usuario (@alguien) también quedan fuera
  if new.texto ~* '(whatsapp|wasap|whats app|telegram|instagram|insta |facebook|tiktok|snapchat|t\.me/|wa\.me/|@[a-z0-9._]{3,})' then
    raise exception 'contacto_personal';
  end if;
  return new;
end $$;
