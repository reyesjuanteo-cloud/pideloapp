import { COMISION_PEDIDO } from "@/features/pedidos/tarifas";
import type { EntregaCompletada } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function Tile({ label, value, nota }: { label: string; value: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3">
      <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
        {label}
      </p>
      <p className="font-display text-h2 font-bold text-ink">{value}</p>
      {nota && <p className="text-caption font-body text-muted">{nota}</p>}
    </div>
  );
}

export function GananciasResumen({
  historial,
  saldo,
}: {
  historial: EntregaCompletada[];
  saldo: number;
}) {
  const total = historial.reduce((sum, e) => sum + e.pago, 0);
  const pedidosRestantes = Math.floor(saldo / COMISION_PEDIDO);

  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile label="Ganancias hoy" value={currency.format(total)} />
      <Tile label="Entregas" value={String(historial.length)} />
      <Tile
        label="Saldo"
        value={currency.format(saldo)}
        nota={`${pedidosRestantes} ${pedidosRestantes === 1 ? "pedido" : "pedidos"}`}
      />
    </div>
  );
}
