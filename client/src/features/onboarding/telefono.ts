"use client";

// Teléfono de la sesión de onboarding, reactivo y seguro para SSR.
import { useSyncExternalStore } from "react";

const CLAVE = "pidelo-telefono";
const EVENTO = "pidelo-telefono-cambio";

function getSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(CLAVE) ?? "";
}

function getServerSnapshot(): string {
  return "";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENTO, callback);
  return () => window.removeEventListener(EVENTO, callback);
}

export function useTelefono(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function guardarTelefono(digitos: string): void {
  window.sessionStorage.setItem(CLAVE, digitos);
  window.dispatchEvent(new Event(EVENTO));
}
