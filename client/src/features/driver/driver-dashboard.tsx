"use client";

import { useState } from "react";
import { mockPedidosDisponibles } from "./mock-pedidos";
import { PedidoCard } from "./pedido-card";
import { AvailabilityToggle } from "./availability-toggle";

export function DriverDashboard() {
  const [available, setAvailable] = useState(true);
  const [aceptados, setAceptados] = useState<Set<string>>(new Set());

  function aceptarPedido(id: string) {
    setAceptados((prev) => new Set(prev).add(id));
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h2 font-semibold text-ink">Domiciliario</h1>
        <AvailabilityToggle available={available} onToggle={() => setAvailable((v) => !v)} />
      </div>

      <h2 className="font-display text-h3 font-semibold text-ink">Pedidos en tu zona</h2>

      {!available ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          Actívate como disponible para ver pedidos por aceptar.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {mockPedidosDisponibles.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              aceptado={aceptados.has(pedido.id)}
              onAceptar={() => aceptarPedido(pedido.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
