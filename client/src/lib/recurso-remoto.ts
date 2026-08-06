"use client";

import { useSyncExternalStore } from "react";

// Patrón compartido: un recurso remoto con caché en memoria, suscriptores de
// React (useSyncExternalStore) y refresco manual o por realtime.
export function crearRecursoRemoto<T>(inicial: T, cargar: () => Promise<T>) {
  let datos = inicial;
  let cargando = false;
  const suscriptores = new Set<() => void>();

  function emitir() {
    suscriptores.forEach((f) => f());
  }

  async function refrescar(): Promise<void> {
    if (cargando) return;
    cargando = true;
    try {
      datos = await cargar();
      emitir();
    } catch {
      // Sin conexión: se mantiene el último dato conocido.
    } finally {
      cargando = false;
    }
  }

  function subscribe(callback: () => void): () => void {
    suscriptores.add(callback);
    if (suscriptores.size === 1) void refrescar();
    return () => suscriptores.delete(callback);
  }

  function getSnapshot(): T {
    return datos;
  }

  function getServerSnapshot(): T {
    return inicial;
  }

  function useRecurso(): T {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  return { useRecurso, refrescar };
}
