"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actualizarEstado, usePedidos } from "./almacen";
import { MapaSeguimiento } from "./mapa-seguimiento";
import type { EstadoPedido } from "./tipos";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Vista del cliente sobre el ciclo del pedido.
const pasos: { estados: EstadoPedido[]; label: string }[] = [
  { estados: ["buscando", "preparando"], label: "Preparando" },
  { estados: ["en_camino"], label: "En camino" },
  { estados: ["llegue"], label: "En destino" },
  { estados: ["entregado"], label: "Entregado" },
];

const mensajePorEstado: Record<EstadoPedido, string> = {
  buscando: "Buscando un mensajero cerca del comercio…",
  preparando: "Un mensajero aceptó tu pedido y lo está recogiendo.",
  en_camino: "Tu pedido va en camino.",
  llegue: "El mensajero llegó. Confirma cuando lo tengas en tus manos.",
  entregado: "Pedido entregado. ¡Buen provecho!",
};

export function Seguimiento({ pedidoId }: { pedidoId: string }) {
  const router = useRouter();
  const pedidos = usePedidos();
  const pedido = pedidos.find((p) => p.id === pedidoId);

  if (!pedido) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <PackageSearch className="size-7 text-primary" />
        </div>
        <p className="text-body font-semibold font-body text-ink">
          No encontramos ese pedido
        </p>
        <Link
          href="/pedidos"
          className="text-body font-body text-primary hover:text-primary-dark"
        >
          Ver tus pedidos
        </Link>
      </div>
    );
  }

  const pasoActual = pasos.findIndex((p) => p.estados.includes(pedido.estado));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-6 pt-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/pedidos")}
          aria-label="Volver a tus pedidos"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-h2 font-semibold text-ink">
            {pedido.comercio}
          </h1>
          <p className="text-caption font-body text-muted">
            Pedido de las {pedido.horaCreacion}
          </p>
        </div>
        <span className="font-mono text-mono text-muted">{pedido.codigo}</span>
      </div>

      {/* Mapa en vivo del mensajero (simulado hasta conectar Supabase) */}
      <MapaSeguimiento pedido={pedido} />

      {/* Tracker */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex items-center">
          {pasos.map((paso, i) => {
            const entregado = pedido.estado === "entregado";
            const completado = i < pasoActual || entregado;
            const activo = i === pasoActual && pedido.estado === "en_camino";
            return (
              <div key={paso.label} className="flex flex-1 items-center last:flex-none">
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
                      pedido.estado === "entregado"
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
        <p className="text-caption font-body text-muted">{mensajePorEstado[pedido.estado]}</p>
      </div>

      {/* Confirmación del cliente: el único que puede marcar "entregado" */}
      {pedido.estado === "llegue" && (
        <Button fullWidth onClick={() => actualizarEstado(pedido.id, "entregado")}>
          <CheckCircle2 className="size-4" />
          Recibí mi pedido
        </Button>
      )}

      {pedido.estado === "entregado" && (
        <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-caption font-body text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          Entregado a las {pedido.horaEntrega}. Gracias por pedir con Pídelo.
        </div>
      )}

      {/* Detalle */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-body font-body">
        {pedido.tipo === "libre" ? (
          <p className="text-muted">«{pedido.descripcionLibre}»</p>
        ) : (
          pedido.items.map((item) => (
            <div key={item.productoId} className="flex justify-between text-muted">
              <span>
                {item.cantidad} × {item.nombre}
              </span>
              <span>{currency.format(item.precio * item.cantidad)}</span>
            </div>
          ))
        )}
        <div className="flex justify-between text-muted">
          <span>{pedido.tipo === "libre" ? "Servicio de mensajero" : "Envío"}</span>
          <span>{currency.format(pedido.envio)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold text-ink">
          <span>Total</span>
          <span>{currency.format(pedido.total)}</span>
        </div>
        <p className="text-caption text-muted">Entregar en: {pedido.direccion}</p>
      </div>
    </div>
  );
}
