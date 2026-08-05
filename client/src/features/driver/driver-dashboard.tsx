"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/features/auth/actions";
import { actualizarEstado, usePedidos } from "@/features/pedidos/almacen";
import type { Pedido } from "@/features/pedidos/tipos";
import { PedidoCard } from "./pedido-card";
import { AvailabilityToggle } from "./availability-toggle";
import { EntregaActiva } from "./entrega-activa";
import { GananciasResumen } from "./ganancias-resumen";
import { HistorialEntregas } from "./historial-entregas";
import type {
  EntregaCompletada,
  EstadoEntrega,
  PedidoDisponible,
} from "./types";

// Adaptadores entre el modelo compartido de pedidos y las vistas del domiciliario.
function comoDisponible(pedido: Pedido): PedidoDisponible {
  return {
    id: pedido.id,
    codigo: pedido.codigo,
    comercio: pedido.comercio,
    zona: pedido.barrio,
    direccion: pedido.direccion,
    // Distancia simulada determinista hasta tener geolocalización real.
    distanciaKm: ((Number(pedido.id) % 30) + 5) / 10,
    pago: pedido.envio,
  };
}

const estadoEntregaPorPedido: Partial<Record<Pedido["estado"], EstadoEntrega>> = {
  preparando: "recogiendo",
  en_camino: "en_ruta",
  llegue: "llegue",
};

const siguienteEstado: Partial<Record<Pedido["estado"], Pedido["estado"]>> = {
  preparando: "en_camino",
  en_camino: "llegue",
};

export function DriverDashboard() {
  const [available, setAvailable] = useState(true);
  const pedidos = usePedidos();

  const disponibles = pedidos.filter((p) => p.estado === "buscando");
  const activo = pedidos.find((p) =>
    ["preparando", "en_camino", "llegue"].includes(p.estado)
  );
  const historial: EntregaCompletada[] = pedidos
    .filter((p) => p.estado === "entregado")
    .map((p) => ({
      id: p.id,
      codigo: p.codigo,
      comercio: p.comercio,
      zona: p.barrio,
      pago: p.envio,
      hora: p.horaEntrega ?? p.horaCreacion,
    }));

  function avanzarEntrega() {
    if (!activo) return;
    const siguiente = siguienteEstado[activo.estado];
    // "llegue" → "entregado" no está aquí a propósito: esa transición
    // la dispara el cliente al confirmar que recibió el pedido.
    if (siguiente) actualizarEstado(activo.id, siguiente);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h2 font-semibold text-ink">Domiciliario</h1>
        <div className="flex items-center gap-3">
          <AvailabilityToggle available={available} onToggle={() => setAvailable((v) => !v)} />
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex items-center gap-1 text-caption font-body text-muted transition-colors duration-300 ease-in-out hover:text-ink"
            >
              <LogOut className="size-4" />
              Salir
            </button>
          </form>
        </div>
      </div>

      <GananciasResumen historial={historial} />

      {activo && (
        <EntregaActiva
          entrega={{
            pedido: comoDisponible(activo),
            estado: estadoEntregaPorPedido[activo.estado] ?? "recogiendo",
          }}
          onAvanzar={avanzarEntrega}
        />
      )}

      <h2 className="font-display text-h3 font-semibold text-ink">Pedidos en tu zona</h2>

      {!available ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          Actívate como disponible para ver pedidos por aceptar.
        </p>
      ) : disponibles.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          Aún no hay pedidos. Cuando los clientes hagan pedidos, aparecerán aquí al
          instante.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {disponibles.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={comoDisponible(pedido)}
              deshabilitado={activo !== undefined}
              onAceptar={() => actualizarEstado(pedido.id, "preparando")}
            />
          ))}
        </div>
      )}

      <h2 className="font-display text-h3 font-semibold text-ink">Entregas de hoy</h2>
      <HistorialEntregas historial={historial} />
    </div>
  );
}
