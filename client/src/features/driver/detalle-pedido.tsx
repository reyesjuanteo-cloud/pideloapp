import { Package, ShoppingBag } from "lucide-react";
import type { PedidoDisponible } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Qué tiene que llevar el mensajero, en claro: sin esto no sabe si carga una
// caja de mercado o un sobre.
export function DetallePedido({ pedido }: { pedido: PedidoDisponible }) {
  if (pedido.tipo === "libre") {
    return (
      <div className="flex flex-col gap-1 rounded-md border border-border bg-bg p-3">
        <p className="flex items-center gap-1.5 text-label font-semibold uppercase tracking-wide text-muted font-body">
          <Package className="size-3.5" />
          Encargo del cliente
        </p>
        <p className="text-body font-body text-ink">«{pedido.descripcionLibre}»</p>
        <p className="text-caption font-body text-muted">
          Lo que compres lo paga el cliente al recibir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-bg p-3">
      <p className="flex items-center gap-1.5 text-label font-semibold uppercase tracking-wide text-muted font-body">
        <ShoppingBag className="size-3.5" />
        Qué vas a recoger
      </p>
      {pedido.items.length === 0 ? (
        <p className="text-body font-body text-muted">Sin detalle de productos.</p>
      ) : (
        pedido.items.map((item, i) => (
          <p key={`${item.nombre}-${i}`} className="text-body font-body text-ink">
            {item.cantidad} × {item.nombre}
          </p>
        ))
      )}
      <p className="mt-1 text-caption font-body text-muted">
        El cliente paga {currency.format(pedido.totalPedido)} en efectivo al recibir.
      </p>
    </div>
  );
}
