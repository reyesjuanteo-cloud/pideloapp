"use client";

// Saldo prepagado del mensajero: cada pedido aceptado descuenta la comisión.
// ⚠️ TEMPORAL: vive en localStorage y la recarga es simulada. Con Supabase el
// saldo será una tabla y la recarga pasará por una pasarela de pagos real.
import { useSyncExternalStore } from "react";
import { COMISION_PEDIDO, RECARGA_VALOR } from "@/features/pedidos/tarifas";

const CLAVE = "pidelo-saldo-mensajero";
const EVENTO = "pidelo-saldo-cambio";

// Primera recarga de cortesía para poder probar la app de una vez.
const SALDO_INICIAL = RECARGA_VALOR;

function getSnapshot(): number {
  if (typeof window === "undefined") return 0;
  const crudo = window.localStorage.getItem(CLAVE);
  return crudo === null ? SALDO_INICIAL : Number(crudo);
}

function getServerSnapshot(): number {
  return 0;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO, callback);
  };
}

function escribir(valor: number): void {
  window.localStorage.setItem(CLAVE, String(Math.max(0, valor)));
  window.dispatchEvent(new Event(EVENTO));
}

export function useSaldo(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function descontarComision(): boolean {
  const saldo = getSnapshot();
  if (saldo < COMISION_PEDIDO) return false;
  escribir(saldo - COMISION_PEDIDO);
  return true;
}

export function recargar(): void {
  escribir(getSnapshot() + RECARGA_VALOR);
}
