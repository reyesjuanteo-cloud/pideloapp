"use client";

import Link from "next/link";
import { Bike, ChevronRight } from "lucide-react";
import { usePedidos } from "@/features/pedidos/almacen";
import type { EstadoPedido } from "@/features/pedidos/tipos";

const textoPorEstado: Record<Exclude<EstadoPedido, "entregado">, string> = {
  buscando: "Buscando mensajero",
  preparando: "Preparando tu pedido",
  en_camino: "Tu pedido va en camino",
  llegue: "El mensajero llegó, confírmalo",
};

// Banner sticky sobre el nav inferior cuando hay un pedido activo.
export function PedidoEnCurso() {
  const pedidos = usePedidos();
  const activos = pedidos.filter((p) => p.estado !== "entregado");
  const activo = activos[activos.length - 1];

  if (!activo) return null;

  return (
    <Link
      href={`/pedido/${activo.id}`}
      className="fixed inset-x-4 bottom-16 z-20 mx-auto flex max-w-sm items-center gap-3 rounded-lg border border-success/40 bg-surface p-3 transition-colors duration-300 ease-in-out hover:bg-success/10"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/15">
        <Bike className="size-4.5 text-success" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold font-body text-success">
          {textoPorEstado[activo.estado as Exclude<EstadoPedido, "entregado">]}
        </p>
        <p className="text-caption font-body text-success/80">
          {activo.comercio} · <span className="font-mono">{activo.codigo}</span>
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-success" />
    </Link>
  );
}
