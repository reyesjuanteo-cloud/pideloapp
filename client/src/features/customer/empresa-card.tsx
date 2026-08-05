import { Clock, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Empresa } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function EmpresaCard({
  empresa,
  deshabilitado,
  onPedir,
}: {
  empresa: Empresa;
  deshabilitado: boolean;
  onPedir: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-h3 font-semibold text-ink">{empresa.nombre}</p>
          <p className="flex items-center gap-1 text-caption text-muted font-body">
            <MapPin className="size-3.5" />
            {empresa.zona} · {empresa.categoria}
          </p>
        </div>
        <Button variant="accent" onClick={onPedir} disabled={deshabilitado}>
          Pedir
        </Button>
      </div>

      <div className="flex items-center gap-3 text-caption font-body text-muted">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" />
          {empresa.tiempoMin}–{empresa.tiempoMax} min
        </span>
        <span className="flex items-center gap-1">
          <Package className="size-3.5" />
          Domicilio {currency.format(empresa.costoDomicilio)}
        </span>
      </div>
    </div>
  );
}
