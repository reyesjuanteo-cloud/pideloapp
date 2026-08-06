"use client";

// ⚠️ TEMPORAL: almacén de comercios en localStorage, administrado desde
// /admin/comercios. Se siembra con los datos de ejemplo la primera vez.
// Con Supabase será la tabla `comercios`.
import { useSyncExternalStore } from "react";
import type { Comercio } from "@/features/customer/types";
import { mockComercios } from "@/features/customer/mock-comercios";

export type ComercioApp = Comercio & { abierto: boolean };

const CLAVE = "pidelo-comercios";
const CLAVE_CONTADOR = "pidelo-contador-comercios";
const EVENTO = "pidelo-comercios-cambio";

const SEMILLA: ComercioApp[] = mockComercios.map((c) => ({ ...c, abierto: true }));

let cacheCrudo: string | null = null;
let cacheParseado: ComercioApp[] = SEMILLA;

function getSnapshot(): ComercioApp[] {
  const crudo =
    typeof window === "undefined" ? null : window.localStorage.getItem(CLAVE);
  if (crudo !== cacheCrudo) {
    cacheCrudo = crudo;
    try {
      cacheParseado = crudo ? (JSON.parse(crudo) as ComercioApp[]) : SEMILLA;
    } catch {
      cacheParseado = SEMILLA;
    }
  }
  return cacheParseado;
}

function getServerSnapshot(): ComercioApp[] {
  return SEMILLA;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO, callback);
  };
}

function escribir(comercios: ComercioApp[]): void {
  window.localStorage.setItem(CLAVE, JSON.stringify(comercios));
  window.dispatchEvent(new Event(EVENTO));
}

export function useComercios(): ComercioApp[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function leerComercios(): ComercioApp[] {
  return getSnapshot();
}

export function crearComercio(
  datos: Omit<ComercioApp, "id" | "abierto">
): ComercioApp {
  const contador =
    Number(window.localStorage.getItem(CLAVE_CONTADOR) ?? "100") + 1;
  window.localStorage.setItem(CLAVE_CONTADOR, String(contador));
  const comercio: ComercioApp = { ...datos, id: `c${contador}`, abierto: true };
  escribir([...leerComercios(), comercio]);
  return comercio;
}

export function alternarAbierto(id: string): void {
  escribir(
    leerComercios().map((c) => (c.id === id ? { ...c, abierto: !c.abierto } : c))
  );
}

export function eliminarComercio(id: string): void {
  escribir(leerComercios().filter((c) => c.id !== id));
}
