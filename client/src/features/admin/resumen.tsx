"use client";

import Link from "next/link";
import {
  Bike,
  ChevronRight,
  ClipboardList,
  Store,
  UserCheck,
} from "lucide-react";
import { usePedidos } from "@/features/pedidos/almacen";
import { COMISION_PEDIDO } from "@/features/pedidos/tarifas";
import { useComercios } from "@/features/comercios/store";
import { usePerfilMensajero } from "@/features/mensajero/perfil";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function AdminResumen() {
  const pedidos = usePedidos();
  const comercios = useComercios();
  const mensajero = usePerfilMensajero();

  const activos = pedidos.filter((p) => p.estado !== "entregado").length;
  const ingresos =
    pedidos.filter((p) => p.estado !== "buscando").length * COMISION_PEDIDO;
  const pendientes = mensajero?.estado === "en_revision" ? 1 : 0;

  const secciones = [
    {
      href: "/admin/comercios",
      icono: Store,
      titulo: "Comercios",
      detalle: `${comercios.filter((c) => c.abierto).length} abiertos de ${comercios.length}`,
    },
    {
      href: "/admin/mensajeros",
      icono: UserCheck,
      titulo: "Mensajeros",
      detalle: pendientes
        ? `${pendientes} registro por revisar`
        : "Sin registros pendientes",
      alerta: pendientes > 0,
    },
    {
      href: "/admin/pedidos",
      icono: ClipboardList,
      titulo: "Pedidos",
      detalle: `${activos} activos · ${currency.format(ingresos)} en comisiones`,
    },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Bike className="size-5 text-primary" />
        <h1 className="font-display text-h2 font-semibold text-ink">Pídelo — Equipo</h1>
      </div>

      <div className="flex flex-col gap-3">
        {secciones.map(({ href, icono: Icono, titulo, detalle, alerta }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors duration-300 ease-in-out hover:bg-bg"
          >
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-md ${
                alerta ? "bg-accent/10 text-accent-deep" : "bg-primary/10 text-primary"
              }`}
            >
              <Icono className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold font-body text-ink">{titulo}</p>
              <p className={`text-caption font-body ${alerta ? "text-accent-deep" : "text-muted"}`}>
                {detalle}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted" />
          </Link>
        ))}
      </div>

      <p className="text-caption font-body text-muted">
        ⚠️ Temporal: este panel ve los datos de este navegador. Con la base de datos verá
        toda la operación real.
      </p>
    </div>
  );
}
