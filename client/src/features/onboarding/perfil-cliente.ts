"use client";

// Datos personales del cliente (nombre y sexo), guardados en `perfiles`.
import {
  asegurarSesion,
  esSesionHuerfana,
  reiniciarSesion,
  supabase,
} from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";

export type Sexo = "masculino" | "femenino" | "otro";

export type PerfilCliente = {
  nombre: string | null;
  sexo: Sexo | null;
  celular: string | null;
};

async function cargarPerfil(): Promise<PerfilCliente | null> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return null;
  const { data } = await sb
    .from("perfiles")
    .select("nombre, sexo, celular")
    .eq("id", session.user.id)
    .maybeSingle();
  return (data as PerfilCliente | null) ?? null;
}

const recurso = crearRecursoRemoto<PerfilCliente | null>(null, cargarPerfil);

export function usePerfilCliente(): PerfilCliente | null {
  return recurso.useRecurso();
}

export const refrescarPerfilCliente = recurso.refrescar;

export async function guardarPerfilCliente(datos: {
  nombre: string;
  sexo: Sexo;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    let usuario = await asegurarSesion();
    let { error } = await supabase()
      .from("perfiles")
      .upsert({ id: usuario.id, nombre: datos.nombre, sexo: datos.sexo });
    if (esSesionHuerfana(error)) {
      // La sesión guardada apuntaba a un usuario borrado: se crea otra.
      usuario = await reiniciarSesion();
      ({ error } = await supabase()
        .from("perfiles")
        .upsert({ id: usuario.id, nombre: datos.nombre, sexo: datos.sexo }));
    }
    if (error) return { ok: false, error: error.message };
    void recurso.refrescar();
    return { ok: true };
  } catch {
    return { ok: false, error: "Sin conexión. Inténtalo de nuevo." };
  }
}

// "Juan Camilo Reyes" → "Juan"
export function primerNombre(nombre: string | null | undefined): string | null {
  const limpio = nombre?.trim();
  if (!limpio) return null;
  return limpio.split(/\s+/)[0];
}
