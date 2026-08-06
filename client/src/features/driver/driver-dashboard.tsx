"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { cerrarSesion } from "@/features/onboarding/actions";
import { actualizarEstado, refrescarPedidos, usePedidos } from "@/features/pedidos/almacen";
import { aceptarPedido as aceptarPedidoAccion, recargarSaldo } from "@/features/pedidos/acciones";
import { COMISION_PEDIDO, RECARGA_PEDIDOS, RECARGA_VALOR } from "@/features/pedidos/tarifas";
import type { Pedido } from "@/features/pedidos/tipos";
import { refrescarSaldo, useEstadoSaldo } from "./saldo";
import { usePerfilMensajero } from "@/features/mensajero/perfil";
import Link from "next/link";
import { ChatPedido } from "@/features/chat/chat-pedido";
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
    distanciaKm: (((parseInt(pedido.codigo.replace(/\D/g, ""), 10) || 7) % 30) + 5) / 10,
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

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function DriverDashboard() {
  const [available, setAvailable] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const pedidos = usePedidos();
  const { datos: saldo, cargado: saldoCargado } = useEstadoSaldo();
  const perfil = usePerfilMensajero();
  const sinSaldo = saldoCargado && saldo < COMISION_PEDIDO;

  // Solo mensajeros aprobados pueden operar el panel.
  if (!perfil || perfil.estado !== "aprobado") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-body font-semibold font-body text-ink">
          {perfil
            ? "Tu registro aún no está aprobado"
            : "Para trabajar con Pídelo, regístrate como mensajero"}
        </p>
        <Link
          href={perfil ? "/mensajero/estado" : "/mensajero/registro"}
          className="rounded-md bg-primary px-5 py-3 text-body font-semibold font-body text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
        >
          {perfil ? "Ver estado de mi registro" : "Registrarme"}
        </Link>
      </div>
    );
  }

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

  async function aceptarPedido(id: string) {
    if (ocupado) return; // evita doble toque
    setOcupado(true);
    setAviso(null);
    try {
      // El servidor verifica saldo, asigna el pedido y descuenta la comisión.
      const resultado = await aceptarPedidoAccion(id);
      if (!resultado.ok) setAviso(resultado.error ?? "No se pudo aceptar.");
    } catch {
      setAviso("Sin conexión. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setOcupado(false);
      void refrescarSaldo();
      void refrescarPedidos();
    }
  }

  async function recargar() {
    if (ocupado) return;
    setOcupado(true);
    try {
      await recargarSaldo();
    } catch {
      setAviso("No se pudo recargar. Inténtalo de nuevo.");
    } finally {
      setOcupado(false);
      void refrescarSaldo();
    }
  }

  async function avanzar() {
    if (ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      await avanzarEntrega();
    } catch {
      setAviso("No se pudo actualizar el pedido. Revisa tu conexión.");
    } finally {
      setOcupado(false);
    }
  }

  async function avanzarEntrega() {
    if (!activo) return;
    const siguiente = siguienteEstado[activo.estado];
    // "llegue" → "entregado" no está aquí a propósito: esa transición
    // la dispara el cliente al confirmar que recibió el pedido.
    if (siguiente) await actualizarEstado(activo.id, siguiente);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h2 font-semibold text-ink">Domiciliario</h1>
        <div className="flex items-center gap-3">
          <AvailabilityToggle available={available} onToggle={() => setAvailable((v) => !v)} />
          <form action={cerrarSesion}>
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

      <GananciasResumen historial={historial} saldo={saldo} />

      {sinSaldo && (
        <div className="flex flex-col gap-2">
          <Banner tone="advertencia">
            Te quedaste sin saldo. Recarga para seguir recibiendo pedidos — cada pedido
            descuenta {currency.format(COMISION_PEDIDO)}.
          </Banner>
          {/* ⚠️ TEMPORAL: recarga simulada; irá a una pasarela de pagos real */}
          <Button fullWidth onClick={recargar}>
            Recargar {currency.format(RECARGA_VALOR)} · {RECARGA_PEDIDOS} pedidos
          </Button>
        </div>
      )}

      {aviso && <Banner tone="error">{aviso}</Banner>}

      {activo && (
        <EntregaActiva
          entrega={{
            pedido: comoDisponible(activo),
            estado: estadoEntregaPorPedido[activo.estado] ?? "recogiendo",
          }}
          onAvanzar={avanzar}
          onAbrirChat={() => setChatAbierto(true)}
          nombreCliente={activo.clienteNombre}
        />
      )}

      {chatAbierto && activo && (
        <ChatPedido
          pedidoId={activo.id}
          titulo={activo.clienteNombre ?? "Cliente"}
          onCerrar={() => setChatAbierto(false)}
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
              deshabilitado={activo !== undefined || sinSaldo}
              onAceptar={() => aceptarPedido(pedido.id)}
            />
          ))}
        </div>
      )}

      <h2 className="font-display text-h3 font-semibold text-ink">Entregas de hoy</h2>
      <HistorialEntregas historial={historial} />
    </div>
  );
}
