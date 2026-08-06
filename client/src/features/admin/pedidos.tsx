"use client";

import { Bike, ClipboardList } from "lucide-react";
import { usePedidos } from "@/features/pedidos/almacen";
import { COMISION_PEDIDO } from "@/features/pedidos/tarifas";
import type { EstadoPedido } from "@/features/pedidos/tipos";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const etiquetaEstado: Record<EstadoPedido, { texto: string; clase: string }> = {
  buscando: { texto: "Buscando mensajero", clase: "bg-accent/10 text-accent-deep" },
  preparando: { texto: "Preparando", clase: "bg-primary/10 text-primary" },
  en_camino: { texto: "En camino", clase: "bg-accent/10 text-accent-deep" },
  llegue: { texto: "En destino", clase: "bg-primary/10 text-primary" },
  entregado: { texto: "Entregado", clase: "bg-success/10 text-success" },
};

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3">
      <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
        {label}
      </p>
      <p className="font-display text-h2 font-bold text-ink">{value}</p>
    </div>
  );
}

export function AdminPedidos() {
  const pedidos = usePedidos();
  const activos = pedidos.filter((p) => p.estado !== "entregado");
  const entregados = pedidos.filter((p) => p.estado === "entregado");
  // El ingreso de Pídelo es la comisión de cada pedido tomado por un mensajero.
  const tomados = pedidos.filter((p) => p.estado !== "buscando").length;
  const ingresos = tomados * COMISION_PEDIDO;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-5 text-primary" />
        <h1 className="font-display text-h2 font-semibold text-ink">Pedidos</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="Activos" value={String(activos.length)} />
        <Tile label="Entregados" value={String(entregados.length)} />
        <Tile label="Comisiones" value={currency.format(ingresos)} />
      </div>

      {pedidos.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          Aún no hay pedidos.
        </p>
      ) : (
        <div className="flex flex-col rounded-lg border border-border bg-surface">
          {[...pedidos].reverse().map((pedido, i) => (
            <div
              key={pedido.id}
              className={`flex items-center gap-3 p-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Bike className="size-4.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold font-body text-ink">
                  {pedido.comercio}
                </p>
                <p className="text-caption font-body text-muted">
                  {pedido.horaCreacion} ·{" "}
                  <span className="font-mono text-mono">{pedido.codigo}</span> ·{" "}
                  {pedido.barrio} · {currency.format(pedido.total)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-caption font-semibold font-body ${etiquetaEstado[pedido.estado].clase}`}
              >
                {etiquetaEstado[pedido.estado].texto}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
