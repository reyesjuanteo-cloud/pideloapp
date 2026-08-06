"use client";

// Perfil del mensajero desde Supabase: el registro crea la fila real y el
// panel del equipo la aprueba. Este hook lee el registro del dispositivo
// (la sesión anónima actual).
import { asegurarSesion, supabase } from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";
import type { PerfilMensajero } from "./tipos";

type FilaMensajero = {
  id: string;
  documento: string;
  municipio: PerfilMensajero["municipio"];
  vehiculo: PerfilMensajero["vehiculo"];
  placa: string | null;
  licencia: string | null;
  soat_vigente: boolean | null;
  estado: PerfilMensajero["estado"];
  saldo: number;
  registrado_en: string;
  perfiles: { nombre: string | null; celular: string | null } | null;
};

async function cargarPerfil(): Promise<PerfilMensajero | null> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return null;

  const { data, error } = await sb
    .from("mensajeros")
    .select("*, perfiles(nombre, celular)")
    .eq("id", session.user.id)
    .maybeSingle();
  if (error || !data) return null;
  const f = data as FilaMensajero;
  return {
    nombre: f.perfiles?.nombre ?? "Sin nombre",
    celular: f.perfiles?.celular ?? "",
    documento: f.documento,
    municipio: f.municipio,
    vehiculo: f.vehiculo,
    placa: f.placa ?? undefined,
    licencia: f.licencia ?? undefined,
    soatVigente: f.soat_vigente ?? undefined,
    estado: f.estado,
    fechaRegistro: new Date(f.registrado_en).toLocaleDateString("es-CO"),
  };
}

const recurso = crearRecursoRemoto<PerfilMensajero | null>(null, cargarPerfil);

export function usePerfilMensajero(): PerfilMensajero | null {
  return recurso.useRecurso();
}

export const refrescarPerfilMensajero = recurso.refrescar;

export async function registrarMensajero(
  datos: Omit<PerfilMensajero, "estado" | "fechaRegistro">
): Promise<{ ok: boolean; error?: string }> {
  try {
    const usuario = await asegurarSesion();
    const sb = supabase();

    const { error: errorPerfil } = await sb.from("perfiles").upsert({
      id: usuario.id,
      nombre: datos.nombre,
      celular: datos.celular,
      rol: "mensajero",
    });
    if (errorPerfil) return { ok: false, error: errorPerfil.message };

    const { error } = await sb.from("mensajeros").insert({
      id: usuario.id,
      documento: datos.documento,
      municipio: datos.municipio,
      vehiculo: datos.vehiculo,
      placa: datos.placa ?? null,
      licencia: datos.licencia ?? null,
      soat_vigente: datos.soatVigente ?? null,
    });
    if (error) return { ok: false, error: error.message };

    void recurso.refrescar();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de conexión" };
  }
}
