import type { EntregaCompletada } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

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

export function GananciasResumen({ historial }: { historial: EntregaCompletada[] }) {
  const total = historial.reduce((sum, e) => sum + e.pago, 0);
  const promedio = historial.length > 0 ? Math.round(total / historial.length) : 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile label="Ganancias hoy" value={currency.format(total)} />
      <Tile label="Entregas" value={String(historial.length)} />
      <Tile label="Promedio" value={currency.format(promedio)} />
    </div>
  );
}
