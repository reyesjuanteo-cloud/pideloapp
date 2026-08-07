import { Hourglass, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetallePedido } from "./detalle-pedido";
import { RutasPedido } from "./rutas";
import type { EntregaActiva as EntregaActivaType, EstadoEntrega } from "./types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const pasos: { estado: EstadoEntrega; label: string }[] = [
  { estado: "recogiendo", label: "Recogiendo" },
  { estado: "en_ruta", label: "En ruta" },
  { estado: "llegue", label: "En destino" },
  { estado: "entregado", label: "Entregado" },
];

// El domiciliario solo puede avanzar hasta "Ya llegué". El paso a "entregado"
// lo confirma el cliente desde su panel — nunca el domiciliario.
const accionPorEstado: Record<EstadoEntrega, string | null> = {
  recogiendo: "Ya recogí el pedido",
  en_ruta: "Ya llegué",
  llegue: null,
  entregado: null,
};

export function EntregaActiva({
  entrega,
  onAvanzar,
  onAbrirChat,
  nombreCliente,
}: {
  entrega: EntregaActivaType;
  onAvanzar: () => void;
  onAbrirChat?: () => void;
  nombreCliente?: string;
}) {
  const { pedido, estado } = entrega;
  const pasoActual = pasos.findIndex((p) => p.estado === estado);
  const accion = accionPorEstado[estado];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-h3 font-semibold text-ink">
            Entrega en curso · {pedido.comercio}
          </p>
          <p className="flex items-center gap-1 text-caption text-muted font-body">
            <MapPin className="size-3.5" />
            {pedido.zona} · {pedido.direccion}
          </p>
        </div>
        <span className="font-mono text-mono text-muted">{pedido.codigo}</span>
      </div>

      <RutasPedido pedido={pedido} />

      <DetallePedido pedido={pedido} />

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

      {estado === "llegue" && (
        <p className="flex items-center gap-2 rounded-md border border-border bg-bg p-3 text-caption font-body text-muted">
          <Hourglass className="size-4 shrink-0" />
          Esperando que el cliente confirme que recibió el pedido…
        </p>
      )}

      {/* Contacto con el cliente */}
      {onAbrirChat && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-bg p-2.5">
          <span className="min-w-0 flex-1 truncate text-caption font-body text-muted">
            {nombreCliente ? `Cliente: ${nombreCliente}` : "Contacta al cliente"}
          </span>
          <button
            onClick={onAbrirChat}
            aria-label="Escribirle al cliente"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <MessageCircle className="size-4.5" />
          </button>
        </div>
      )}

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
