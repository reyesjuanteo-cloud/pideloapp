"use client";

// Perfil del mensajero desde Supabase: el registro crea la fila real y el
// panel del equipo la aprueba. Este hook lee el registro del dispositivo
// (la sesión anónima actual).
import {
  asegurarSesion,
  esSesionHuerfana,
  reiniciarSesion,
  supabase,
} from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";
import type { PerfilMensajero } from "./tipos";

type FilaMensajero = {
  id: string;
  documento: string;
  municipio: PerfilMensajero["municipio"];
  vehiculo: PerfilMensajero["vehiculo"];
  placa: string | null;
  estado: PerfilMensajero["estado"];
  saldo: number;
  registrado_en: string;
  perfiles: { nombre: string | null; celular: string | null; correo: string | null } | null;
};

async function cargarPerfil(): Promise<PerfilMensajero | null> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return null;

  const { data, error } = await sb
    .from("mensajeros")
    .select("*, perfiles(nombre, celular, correo)")
    .eq("id", session.user.id)
    .maybeSingle();
  if (error || !data) return null;
  const f = data as FilaMensajero;
  return {
    nombre: f.perfiles?.nombre ?? "Sin nombre",
    celular: f.perfiles?.celular ?? "",
    correo: f.perfiles?.correo ?? "",
    documento: f.documento,
    municipio: f.municipio,
    vehiculo: f.vehiculo,
    placa: f.placa ?? undefined,
    estado: f.estado,
    fechaRegistro: new Date(f.registrado_en).toLocaleDateString("es-CO"),
  };
}

const recurso = crearRecursoRemoto<PerfilMensajero | null>(null, cargarPerfil);

export function usePerfilMensajero(): PerfilMensajero | null {
  return recurso.useRecurso();
}

export function useEstadoPerfilMensajero() {
  return recurso.useEstado();
}

export const refrescarPerfilMensajero = recurso.refrescar;

export async function registrarMensajero(
  datos: Omit<PerfilMensajero, "estado" | "fechaRegistro">
): Promise<{ ok: boolean; error?: string }> {
  try {
    let usuario = await asegurarSesion();
    const sb = supabase();

    let { error: errorPerfil } = await sb.from("perfiles").upsert({
      id: usuario.id,
      nombre: datos.nombre,
      celular: datos.celular,
      correo: datos.correo,
      rol: "mensajero",
    });
    if (esSesionHuerfana(errorPerfil)) {
      // Sesión huérfana (usuario borrado): se crea una nueva y se reintenta.
      usuario = await reiniciarSesion();
      ({ error: errorPerfil } = await sb.from("perfiles").upsert({
        id: usuario.id,
        nombre: datos.nombre,
        celular: datos.celular,
        correo: datos.correo,
        rol: "mensajero",
      }));
    }
    if (errorPerfil) return { ok: false, error: errorPerfil.message };

    // upsert: quien fue rechazado corrige sus datos y vuelve a intentar
    // (el trigger de la base devuelve el estado a "en revisión").
    const { error } = await sb.from("mensajeros").upsert({
      id: usuario.id,
      documento: datos.documento,
      municipio: datos.municipio,
      vehiculo: datos.vehiculo,
      placa: datos.placa ?? null,
    });
    if (error) return { ok: false, error: error.message };

    void recurso.refrescar();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de conexión" };
  }
}
