"use client";

// Persistencia local de la dirección de entrega. La fuente de verdad es el par
// lat/lng del pin, no la cadena de texto (ver docs/especificacion-onboarding.md).
import { useSyncExternalStore } from "react";

export type Direccion = {
  texto: string;
  barrio: string;
  ciudad?: string; // Girardot, Ricaurte o Flandes
  lat: number;
  lng: number;
  detalle?: string;
  indicaciones?: string;
  etiqueta?: "Casa" | "Trabajo" | "Otra";
};

const CLAVE = "pidelo-direccion";
const EVENTO = "pidelo-direccion-cambio";

// Coordenadas plausibles para Colombia; descarta direcciones guardadas por la
// versión vieja del mapa simulado (que almacenaba píxeles, no grados).
function esValida(d: Direccion): boolean {
  return (
    typeof d.lat === "number" &&
    typeof d.lng === "number" &&
    d.lat > -5 &&
    d.lat < 15 &&
    d.lng > -85 &&
    d.lng < -65
  );
}

let cacheCrudo: string | null = null;
let cacheParseado: Direccion | null = null;

function getSnapshot(): Direccion | null {
  const crudo =
    typeof window === "undefined" ? null : window.localStorage.getItem(CLAVE);
  if (crudo !== cacheCrudo) {
    cacheCrudo = crudo;
    try {
      const d = crudo ? (JSON.parse(crudo) as Direccion) : null;
      cacheParseado = d && esValida(d) ? d : null;
    } catch {
      cacheParseado = null;
    }
  }
  return cacheParseado;
}

function getServerSnapshot(): Direccion | null {
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

export function useDireccion(): Direccion | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function leerDireccion(): Direccion | null {
  return getSnapshot();
}

export function guardarDireccion(direccion: Direccion): void {
  window.localStorage.setItem(CLAVE, JSON.stringify(direccion));
  window.dispatchEvent(new Event(EVENTO));
}
