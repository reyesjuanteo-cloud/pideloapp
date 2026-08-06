"use client";

// ⚠️ TEMPORAL: catálogo de productos por comercio en localStorage, administrado
// desde /admin/comercios. Con Supabase será la tabla `productos`.
import { useSyncExternalStore } from "react";
import { mockProductos, type Producto } from "@/features/catalogo/mock-productos";

const CLAVE = "pidelo-productos";
const CLAVE_CONTADOR = "pidelo-contador-productos";
const EVENTO = "pidelo-productos-cambio";

let cacheCrudo: string | null = null;
let cacheParseado: Producto[] = mockProductos;

function getSnapshot(): Producto[] {
  const crudo =
    typeof window === "undefined" ? null : window.localStorage.getItem(CLAVE);
  if (crudo !== cacheCrudo) {
    cacheCrudo = crudo;
    try {
      cacheParseado = crudo ? (JSON.parse(crudo) as Producto[]) : mockProductos;
    } catch {
      cacheParseado = mockProductos;
    }
  }
  return cacheParseado;
}

function getServerSnapshot(): Producto[] {
  return mockProductos;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO, callback);
  };
}

function escribir(productos: Producto[]): void {
  window.localStorage.setItem(CLAVE, JSON.stringify(productos));
  window.dispatchEvent(new Event(EVENTO));
}

export function useProductos(): Producto[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function leerProductos(): Producto[] {
  return getSnapshot();
}

export function crearProducto(datos: Omit<Producto, "id">): void {
  const contador =
    Number(window.localStorage.getItem(CLAVE_CONTADOR) ?? "1000") + 1;
  window.localStorage.setItem(CLAVE_CONTADOR, String(contador));
  escribir([...leerProductos(), { ...datos, id: `p${contador}` }]);
}

export function eliminarProducto(id: string): void {
  escribir(leerProductos().filter((p) => p.id !== id));
}
