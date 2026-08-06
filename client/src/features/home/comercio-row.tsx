import Link from "next/link";
import { ChevronRight, Clock, Package } from "lucide-react";
import type { ComercioApp } from "@/features/comercios/store";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Tinte del avatar según la categoría, para que la lista no sea monocroma.
const tintes: Record<string, string> = {
  Comida: "bg-accent/10 text-accent-deep",
  Panadería: "bg-accent/10 text-accent-deep",
  Mercado: "bg-primary/10 text-primary",
  Farmacia: "bg-success/10 text-success",
};

export function ComercioRow({ comercio }: { comercio: ComercioApp }) {
  return (
    <Link
      href={`/comercio/${comercio.id}`}
      className={`flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors duration-300 ease-in-out hover:bg-bg ${
        comercio.abierto ? "" : "opacity-50"
      }`}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-lg font-display text-h2 font-bold ${
          tintes[comercio.categoria] ?? "bg-primary/10 text-primary"
        }`}
      >
        {comercio.nombre[0]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold font-body text-ink">
          {comercio.nombre}
          {!comercio.abierto && (
            <span className="ml-2 rounded-full bg-bg px-2 py-0.5 text-caption font-semibold text-muted">
              Cerrado
            </span>
          )}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-caption font-body text-muted">
          <span className="flex items-center gap-1 rounded-full bg-bg px-2 py-0.5">
            <Clock className="size-3" />
            {comercio.tiempoMin}–{comercio.tiempoMax} min
          </span>
          <span className="flex items-center gap-1 rounded-full bg-bg px-2 py-0.5">
            <Package className="size-3" />
            {currency.format(comercio.costoDomicilio)}
          </span>
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted" />
    </Link>
  );
}
