import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PedidoDisponible } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function PedidoCard({
  pedido,
  deshabilitado,
  onAceptar,
}: {
  pedido: PedidoDisponible;
  deshabilitado: boolean;
  onAceptar: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-h3 font-semibold text-ink">{pedido.empresa}</p>
          <p className="flex items-center gap-1 text-caption text-muted font-body">
            <MapPin className="size-3.5" />
            {pedido.zona} · {pedido.direccion}
          </p>
        </div>
        <span className="font-mono text-mono text-muted">{pedido.codigo}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-caption font-body text-muted">
          <span className="flex items-center gap-1">
            <Navigation className="size-3.5" />
            {pedido.distanciaKm} km
          </span>
          <span className="font-semibold text-ink">{currency.format(pedido.pago)}</span>
        </div>

        <Button variant="accent" onClick={onAceptar} disabled={deshabilitado}>
          Aceptar
        </Button>
      </div>
    </div>
  );
}
