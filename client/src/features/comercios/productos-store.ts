"use client";

// Productos desde Supabase (lectura pública). Escrituras del admin por
// server actions.
import { supabase } from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";
import type { Producto } from "@/features/catalogo/mock-productos";

type FilaProducto = {
  id: string;
  comercio_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
};

async function cargarProductos(): Promise<Producto[]> {
  const { data, error } = await supabase()
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return (data as FilaProducto[]).map((f) => ({
    id: f.id,
    comercioId: f.comercio_id,
    nombre: f.nombre,
    descripcion: f.descripcion,
    precio: f.precio,
  }));
}

const recurso = crearRecursoRemoto<Producto[]>([], cargarProductos);

export function useProductos(): Producto[] {
  return recurso.useRecurso();
}

export const refrescarProductos = recurso.refrescar;
