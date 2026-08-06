import { COMISION_PEDIDO } from "@/features/pedidos/tarifas";
import type { EntregaCompletada } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function Tile({
  label,
  value,
  nota,
  tinte,
}: {
  label: string;
  value: string;
  nota?: string;
  tinte: string;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-lg p-3 ${tinte}`}>
      <p className="text-label font-semibold uppercase tracking-wide opacity-70 font-body">
        {label}
      </p>
      <p className="font-display text-h2 font-bold">{value}</p>
      {nota && <p className="text-caption font-body opacity-70">{nota}</p>}
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
      <Tile
        label="Ganancias hoy"
        value={currency.format(total)}
        tinte="bg-success/10 text-success"
      />
      <Tile
        label="Entregas"
        value={String(historial.length)}
        tinte="bg-primary/10 text-primary"
      />
      <Tile
        label="Saldo"
        value={currency.format(saldo)}
        nota={`${pedidosRestantes} ${pedidosRestantes === 1 ? "pedido" : "pedidos"}`}
        tinte={
          pedidosRestantes <= 1 ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary-dark"
        }
      />
    </div>
  );
}
