"use client";

import { useSyncExternalStore } from "react";

export type EstadoRecurso<T> = {
  datos: T;
  cargado: boolean; // ya terminó al menos una carga (evita falsos "vacío")
  error: boolean; // la última carga falló (sin conexión, base caída)
};

// Patrón compartido: un recurso remoto con caché en memoria, suscriptores de
// React (useSyncExternalStore) y refresco manual o por realtime.
export function crearRecursoRemoto<T>(inicial: T, cargar: () => Promise<T>) {
  let estado: EstadoRecurso<T> = { datos: inicial, cargado: false, error: false };
  const inicialEstado = estado;
  let cargando = false;
  let pendiente = false;
  const suscriptores = new Set<() => void>();

  function emitir() {
    suscriptores.forEach((f) => f());
  }

  async function refrescar(): Promise<void> {
    // Si ya hay una carga en curso, encolar una más: los avisos de realtime
    // que llegan durante un refresco no se pueden perder.
    if (cargando) {
      pendiente = true;
      return;
    }
    cargando = true;
    try {
      estado = { datos: await cargar(), cargado: true, error: false };
    } catch {
      // Se conserva el último dato conocido, pero se marca el fallo para que
      // la pantalla pueda decir "sin conexión" en vez de "no hay nada".
      estado = { ...estado, cargado: true, error: true };
    } finally {
      cargando = false;
      emitir();
      if (pendiente) {
        pendiente = false;
        void refrescar();
      }
    }
  }

  function subscribe(callback: () => void): () => void {
    suscriptores.add(callback);
    if (suscriptores.size === 1) void refrescar();
    return () => suscriptores.delete(callback);
  }

  function getSnapshot(): EstadoRecurso<T> {
    return estado;
  }

  function getServerSnapshot(): EstadoRecurso<T> {
    return inicialEstado;
  }

  function useEstado(): EstadoRecurso<T> {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  function useRecurso(): T {
    return useEstado().datos;
  }

  return { useRecurso, useEstado, refrescar };
}
