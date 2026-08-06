"use client";

// Saldo del mensajero, leído de la tabla `mensajeros`. Los movimientos
// (comisión al aceptar, recarga) los escribe el servidor — ver
// features/pedidos/acciones.ts.
import { supabase } from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";

async function cargarSaldo(): Promise<number> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return 0;

  const { data } = await sb
    .from("mensajeros")
    .select("saldo")
    .eq("id", session.user.id)
    .maybeSingle();
  return data?.saldo ?? 0;
}

const recurso = crearRecursoRemoto<number>(0, cargarSaldo);

export function useSaldo(): number {
  return recurso.useRecurso();
}

// `cargado` evita mostrar "te quedaste sin saldo" mientras aún se consulta.
export function useEstadoSaldo() {
  return recurso.useEstado();
}

export const refrescarSaldo = recurso.refrescar;
