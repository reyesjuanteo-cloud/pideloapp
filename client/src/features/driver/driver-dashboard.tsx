"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/features/auth/actions";
import { mockPedidosDisponibles } from "./mock-pedidos";
import { mockHistorialHoy } from "./mock-historial";
import { PedidoCard } from "./pedido-card";
import { AvailabilityToggle } from "./availability-toggle";
import { EntregaActiva } from "./entrega-activa";
import { GananciasResumen } from "./ganancias-resumen";
import { HistorialEntregas } from "./historial-entregas";
import type { EntregaActiva as EntregaActivaType, EntregaCompletada, PedidoDisponible } from "./types";

export function DriverDashboard() {
  const [available, setAvailable] = useState(true);
  const [disponibles, setDisponibles] = useState<PedidoDisponible[]>(mockPedidosDisponibles);
  const [entrega, setEntrega] = useState<EntregaActivaType | null>(null);
  const [historial, setHistorial] = useState<EntregaCompletada[]>(mockHistorialHoy);

  function aceptarPedido(pedido: PedidoDisponible) {
    setEntrega({ pedido, estado: "recogiendo" });
    setDisponibles((prev) => prev.filter((p) => p.id !== pedido.id));
  }

  function avanzarEntrega() {
    setEntrega((actual) => {
      if (!actual) return null;
      if (actual.estado === "recogiendo") {
        return { ...actual, estado: "en_ruta" };
      }
      // en_ruta → entregado: pasa al historial del día.
      const { pedido } = actual;
      const hora = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setHistorial((prev) => [
        ...prev,
        {
          id: pedido.id,
          codigo: pedido.codigo,
          empresa: pedido.empresa,
          zona: pedido.zona,
          pago: pedido.pago,
          hora,
        },
      ]);
      return null;
    });
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

      {entrega && <EntregaActiva entrega={entrega} onAvanzar={avanzarEntrega} />}

      <h2 className="font-display text-h3 font-semibold text-ink">Pedidos en tu zona</h2>

      {!available ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          Actívate como disponible para ver pedidos por aceptar.
        </p>
      ) : disponibles.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          No hay pedidos disponibles en tu zona por ahora.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {disponibles.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              deshabilitado={entrega !== null}
              onAceptar={() => aceptarPedido(pedido)}
            />
          ))}
        </div>
      )}

      <h2 className="font-display text-h3 font-semibold text-ink">Entregas de hoy</h2>
      <HistorialEntregas historial={historial} />
    </div>
  );
}
