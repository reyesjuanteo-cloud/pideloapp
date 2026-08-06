"use client";

// ⚠️ TEMPORAL: el perfil del mensajero vive en localStorage hasta tener la
// tabla `mensajeros` en Supabase. Sincroniza entre pestañas, así el panel de
// aprobación (/admin/mensajeros) y el dashboard del mensajero se ven en vivo.
import { useSyncExternalStore } from "react";
import type { EstadoMensajero, PerfilMensajero } from "./tipos";

const CLAVE = "pidelo-mensajero";
const EVENTO = "pidelo-mensajero-cambio";

let cacheCrudo: string | null = null;
let cacheParseado: PerfilMensajero | null = null;

function getSnapshot(): PerfilMensajero | null {
  const crudo =
    typeof window === "undefined" ? null : window.localStorage.getItem(CLAVE);
  if (crudo !== cacheCrudo) {
    cacheCrudo = crudo;
    try {
      cacheParseado = crudo ? (JSON.parse(crudo) as PerfilMensajero) : null;
    } catch {
      cacheParseado = null;
    }
  }
  return cacheParseado;
}

function getServerSnapshot(): PerfilMensajero | null {
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

export function usePerfilMensajero(): PerfilMensajero | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function guardarPerfilMensajero(perfil: PerfilMensajero): void {
  window.localStorage.setItem(CLAVE, JSON.stringify(perfil));
  window.dispatchEvent(new Event(EVENTO));
}

export function cambiarEstadoMensajero(estado: EstadoMensajero): void {
  const actual = getSnapshot();
  if (actual) guardarPerfilMensajero({ ...actual, estado });
}
