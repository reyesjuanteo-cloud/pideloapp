"use client";

// El negocio del dueño que tiene la sesión abierta.
import { supabase } from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";

export type EstadoNegocio = "en_revision" | "aprobado" | "rechazado";

export type MiNegocio = {
  id: string;
  nombre: string;
  categoria: string;
  zona: string;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  abierto: boolean;
  estado: EstadoNegocio;
  celular: string | null;
  correo: string | null;
  tiempoMin: number;
  tiempoMax: number;
};

async function cargar(): Promise<MiNegocio | null> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return null;
  const { data } = await sb
    .from("comercios")
    .select(
      "id, nombre, categoria, zona, direccion, lat, lng, abierto, estado, celular, correo, tiempo_min, tiempo_max"
    )
    .eq("dueno_id", session.user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    nombre: data.nombre as string,
    categoria: data.categoria as string,
    zona: data.zona as string,
    direccion: data.direccion as string | null,
    lat: data.lat as number | null,
    lng: data.lng as number | null,
    abierto: data.abierto as boolean,
    estado: data.estado as EstadoNegocio,
    celular: data.celular as string | null,
    correo: data.correo as string | null,
    tiempoMin: data.tiempo_min as number,
    tiempoMax: data.tiempo_max as number,
  };
}

const recurso = crearRecursoRemoto<MiNegocio | null>(null, cargar);

export function useMiNegocio(): MiNegocio | null {
  return recurso.useRecurso();
}

export function useEstadoMiNegocio() {
  return recurso.useEstado();
}

export const refrescarMiNegocio = recurso.refrescar;

export async function registrarNegocio(datos: {
  nombre: string;
  categoria: string;
  zona: string;
  direccion: string;
  lat: number | null;
  lng: number | null;
  documento: string;
  celular: string;
  correo: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = supabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) return { ok: false, error: "Inicia sesión para registrar tu negocio." };

    const { error: ePerfil } = await sb.from("perfiles").upsert({
      id: session.user.id,
      nombre: datos.nombre,
      celular: datos.celular,
      correo: datos.correo,
      rol: "comercio",
    });
    if (ePerfil) return { ok: false, error: ePerfil.message };

    const { error } = await sb.from("comercios").insert({
      dueno_id: session.user.id,
      nombre: datos.nombre,
      categoria: datos.categoria,
      zona: datos.zona,
      direccion: datos.direccion,
      lat: datos.lat,
      lng: datos.lng,
      documento: datos.documento,
      celular: datos.celular,
      correo: datos.correo,
    });
    if (error) return { ok: false, error: error.message };

    void recurso.refrescar();
    return { ok: true };
  } catch {
    return { ok: false, error: "Sin conexión. Inténtalo de nuevo." };
  }
}

export async function alternarAbierto(id: string, abierto: boolean): Promise<void> {
  await supabase().from("comercios").update({ abierto }).eq("id", id);
  void recurso.refrescar();
}
