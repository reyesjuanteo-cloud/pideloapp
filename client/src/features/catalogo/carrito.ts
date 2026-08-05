"use client";

// Carrito local: un comercio a la vez (agregar de otro comercio lo reemplaza).
import { useSyncExternalStore } from "react";

export type Carrito = {
  comercioId: string;
  cantidades: Record<string, number>; // productoId → cantidad
};

const CLAVE = "pidelo-carrito";
const EVENTO = "pidelo-carrito-cambio";

let cacheCrudo: string | null = null;
let cacheParseado: Carrito | null = null;

function getSnapshot(): Carrito | null {
  const crudo =
    typeof window === "undefined" ? null : window.localStorage.getItem(CLAVE);
  if (crudo !== cacheCrudo) {
    cacheCrudo = crudo;
    try {
      cacheParseado = crudo ? (JSON.parse(crudo) as Carrito) : null;
    } catch {
      cacheParseado = null;
    }
  }
  return cacheParseado;
}

function getServerSnapshot(): Carrito | null {
  return null;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO, callback);
  };
}

function escribir(carrito: Carrito | null): void {
  if (carrito === null || Object.keys(carrito.cantidades).length === 0) {
    window.localStorage.removeItem(CLAVE);
  } else {
    window.localStorage.setItem(CLAVE, JSON.stringify(carrito));
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function useCarrito(): Carrito | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function leerCarrito(): Carrito | null {
  return getSnapshot();
}

export function cambiarCantidad(
  comercioId: string,
  productoId: string,
  delta: number
): void {
  const actual = leerCarrito();
  // Cambiar de comercio reinicia el carrito.
  const base: Carrito =
    actual && actual.comercioId === comercioId
      ? { ...actual, cantidades: { ...actual.cantidades } }
      : { comercioId, cantidades: {} };

  const nueva = Math.max(0, (base.cantidades[productoId] ?? 0) + delta);
  if (nueva === 0) {
    delete base.cantidades[productoId];
  } else {
    base.cantidades[productoId] = nueva;
  }
  escribir(base);
}

export function vaciarCarrito(): void {
  escribir(null);
}
