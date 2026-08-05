"use client";

// ⚠️ TEMPORAL: almacén de pedidos en localStorage que simula el backend.
// Sincroniza entre pestañas del mismo navegador (evento `storage`), lo que
// permite probar el ciclo cliente ↔ domiciliario completo en local. Al
// conectar Supabase, este módulo se reemplaza por consultas + realtime.

import { useSyncExternalStore } from "react";
import type { EstadoPedido, Pedido } from "./tipos";

const CLAVE = "pidelo-pedidos";
const CLAVE_CONTADOR = "pidelo-contador-pedidos";
const EVENTO = "pidelo-pedidos-cambio";

function leerCrudo(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(CLAVE) ?? "[]";
}

// getSnapshot debe devolver referencias estables entre llamadas.
let cacheCrudo: string | null = null;
let cacheParseado: Pedido[] = [];

function getSnapshot(): Pedido[] {
  const crudo = leerCrudo();
  if (crudo !== cacheCrudo) {
    cacheCrudo = crudo;
    try {
      cacheParseado = JSON.parse(crudo) as Pedido[];
    } catch {
      cacheParseado = [];
    }
  }
  return cacheParseado;
}

const VACIO: Pedido[] = [];

function getServerSnapshot(): Pedido[] {
  return VACIO;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO, callback);
  };
}

function escribir(pedidos: Pedido[]): void {
  window.localStorage.setItem(CLAVE, JSON.stringify(pedidos));
  window.dispatchEvent(new Event(EVENTO));
}

export function usePedidos(): Pedido[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function leerPedidos(): Pedido[] {
  return getSnapshot();
}

function horaActual(): string {
  return new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function crearPedido(
  datos: Omit<Pedido, "id" | "codigo" | "estado" | "horaCreacion">
): Pedido {
  const contador =
    Number(window.localStorage.getItem(CLAVE_CONTADOR) ?? "5000") + 1;
  window.localStorage.setItem(CLAVE_CONTADOR, String(contador));

  const pedido: Pedido = {
    ...datos,
    id: String(contador),
    codigo: `PD-${contador}`,
    estado: "buscando",
    horaCreacion: horaActual(),
  };
  escribir([...leerPedidos(), pedido]);
  return pedido;
}

export function actualizarEstado(id: string, estado: EstadoPedido): void {
  escribir(
    leerPedidos().map((p) =>
      p.id === id
        ? {
            ...p,
            estado,
            ...(estado === "entregado" ? { horaEntrega: horaActual() } : {}),
          }
        : p
    )
  );
}
