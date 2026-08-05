import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EntregaActiva as EntregaActivaType, EstadoEntrega } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const pasos: { estado: EstadoEntrega; label: string }[] = [
  { estado: "recogiendo", label: "Recogiendo" },
  { estado: "en_ruta", label: "En ruta" },
  { estado: "entregado", label: "Entregado" },
];

const accionPorEstado: Record<EstadoEntrega, string | null> = {
  recogiendo: "Ya recogí el pedido",
  en_ruta: "Marcar como entregado",
  entregado: null,
};

export function EntregaActiva({
  entrega,
  onAvanzar,
}: {
  entrega: EntregaActivaType;
  onAvanzar: () => void;
}) {
  const { pedido, estado } = entrega;
  const pasoActual = pasos.findIndex((p) => p.estado === estado);
  const accion = accionPorEstado[estado];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-h3 font-semibold text-ink">
            Entrega en curso · {pedido.empresa}
          </p>
          <p className="flex items-center gap-1 text-caption text-muted font-body">
            <MapPin className="size-3.5" />
            {pedido.zona} · {pedido.direccion}
          </p>
        </div>
        <span className="font-mono text-mono text-muted">{pedido.codigo}</span>
      </div>

      <div className="flex items-center">
        {pasos.map((paso, i) => {
          const completado = i < pasoActual || estado === "entregado";
          const activo = i === pasoActual && estado === "en_ruta";
          return (
            <div key={paso.estado} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`size-3 rounded-full transition-colors duration-300 ease-in-out ${
                    activo
                      ? "bg-accent animate-[ida-vuelta_1.2s_ease-in-out_infinite]"
                      : estado === "entregado"
                        ? "bg-success"
                        : completado || i === pasoActual
                          ? "bg-primary"
                          : "bg-border"
                  }`}
                />
                <span
                  className={`text-caption font-body ${
                    i <= pasoActual ? "font-semibold text-ink" : "text-muted"
                  }`}
                >
                  {paso.label}
                </span>
              </div>
              {i < pasos.length - 1 && (
                <span
                  className={`mx-2 mb-4 h-0.5 flex-1 ${
                    estado === "entregado"
                      ? "bg-success"
                      : i < pasoActual
                        ? "bg-primary"
                        : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-caption font-body text-muted">
          Pago: <span className="font-semibold text-ink">{currency.format(pedido.pago)}</span>
        </span>
        {accion && (
          <Button variant="accent" onClick={onAvanzar}>
            {accion}
          </Button>
        )}
      </div>
    </div>
  );
}
