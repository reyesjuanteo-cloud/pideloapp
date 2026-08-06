"use client";

// Comercios desde Supabase (lectura pública). Las escrituras del admin van
// por server actions con la llave secreta (features/admin/acciones.ts).
import { supabase } from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";
import type { Comercio } from "@/features/customer/types";

export type ComercioApp = Comercio & { abierto: boolean };

type FilaComercio = {
  id: string;
  nombre: string;
  categoria: string;
  zona: string;
  tiempo_min: number;
  tiempo_max: number;
  costo_domicilio: number;
  abierto: boolean;
};

async function cargarComercios(): Promise<ComercioApp[]> {
  const { data, error } = await supabase()
    .from("comercios")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return (data as FilaComercio[]).map((f) => ({
    id: f.id,
    nombre: f.nombre,
    categoria: f.categoria,
    zona: f.zona,
    tiempoMin: f.tiempo_min,
    tiempoMax: f.tiempo_max,
    costoDomicilio: f.costo_domicilio,
    abierto: f.abierto,
  }));
}

const recurso = crearRecursoRemoto<ComercioApp[]>([], cargarComercios);

export function useComercios(): ComercioApp[] {
  return recurso.useRecurso();
}

export const refrescarComercios = recurso.refrescar;
