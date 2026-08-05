import { CheckCircle2 } from "lucide-react";
import type { EntregaCompletada } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function HistorialEntregas({ historial }: { historial: EntregaCompletada[] }) {
  if (historial.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
        Aún no has completado entregas hoy.
      </p>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface">
      {historial.map((entrega, i) => (
        <div
          key={entrega.id}
          className={`flex items-center gap-3 p-3 ${
            i > 0 ? "border-t border-border" : ""
          }`}
        >
          <CheckCircle2 className="size-4 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold font-body text-ink">
              {entrega.comercio}
            </p>
            <p className="text-caption text-muted font-body">
              {entrega.zona} · {entrega.hora} ·{" "}
              <span className="font-mono text-mono">{entrega.codigo}</span>
            </p>
          </div>
          <span className="text-body font-semibold font-body text-ink">
            {currency.format(entrega.pago)}
          </span>
        </div>
      ))}
    </div>
  );
}
