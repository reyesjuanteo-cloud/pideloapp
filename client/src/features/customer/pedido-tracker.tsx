import type { EstadoPedido, PedidoActivo } from "./types";

const pasos: { estado: EstadoPedido; label: string }[] = [
  { estado: "preparando", label: "Preparando" },
  { estado: "en_camino", label: "En camino" },
  { estado: "entregado", label: "Entregado" },
];

export function PedidoTracker({ pedido }: { pedido: PedidoActivo }) {
  const pasoActual = pasos.findIndex((p) => p.estado === pedido.estado);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-h3 font-semibold text-ink">
          Tu pedido en {pedido.empresa}
        </p>
        <span className="font-mono text-mono text-muted">{pedido.codigo}</span>
      </div>

      <div className="flex items-center">
        {pasos.map((paso, i) => {
          const entregado = pedido.estado === "entregado";
          const completado = i < pasoActual || entregado;
          const activo = i === pasoActual && pedido.estado === "en_camino";
          return (
            <div key={paso.estado} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`size-3 rounded-full transition-colors duration-300 ease-in-out ${
                    activo
                      ? "bg-accent animate-[ida-vuelta_1.2s_ease-in-out_infinite]"
                      : entregado
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
                    entregado ? "bg-success" : i < pasoActual ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
