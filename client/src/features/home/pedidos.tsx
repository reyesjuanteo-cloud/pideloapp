"use client";

// Historial único: servicios de la subasta y pedidos de tiendas, juntos.
// Un solo lugar donde el cliente ve todo lo que ha pedido.
import { useEffect } from "react";
import Link from "next/link";
import { Bike, CheckCircle2, ChevronRight, Receipt, Wrench, XCircle } from "lucide-react";
import { usePedidos } from "@/features/pedidos/almacen";
import {
  iniciarRealtimeServicios,
  refrescarSolicitudes,
  useSolicitudes,
} from "@/features/servicios/datos";
import { BottomNav } from "./bottom-nav";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const etiquetaServicio: Record<string, string> = {
  publicada: "Recibiendo ofertas",
  contratada: "Contratado",
  en_camino: "En camino",
  llegue: "Llegó",
  en_progreso: "Trabajando",
  terminada_proveedor: "Por confirmar",
  completada: "Completado",
  disputada: "En revisión",
  cancelada: "Cancelado",
};

export function Pedidos() {
  const pedidos = usePedidos();
  const solicitudes = useSolicitudes();

  useEffect(() => {
    void iniciarRealtimeServicios();
    void refrescarSolicitudes();
  }, []);

  const mias = solicitudes.filter((s) => s.esMia);
  const cerradosPedido = ["entregado", "cancelado"];
  const cerradosServicio = ["completada", "cancelada"];

  const enCurso = [
    ...mias
      .filter((s) => !cerradosServicio.includes(s.estado))
      .map((s) => ({ tipo: "servicio" as const, s, fecha: s.creadoEn })),
    ...pedidos
      .filter((p) => !cerradosPedido.includes(p.estado))
      .map((p) => ({ tipo: "pedido" as const, p, fecha: p.creadoEn ?? "" })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const anteriores = [
    ...mias
      .filter((s) => cerradosServicio.includes(s.estado))
      .map((s) => ({ tipo: "servicio" as const, s, fecha: s.creadoEn })),
    ...pedidos
      .filter((p) => cerradosPedido.includes(p.estado))
      .map((p) => ({ tipo: "pedido" as const, p, fecha: p.creadoEn ?? "" })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const vacio = enCurso.length === 0 && anteriores.length === 0;

  const tarjeta = (item: (typeof enCurso)[number]) =>
    item.tipo === "servicio" ? (
      <Link
        key={`s-${item.s.id}`}
        href={`/servicios/${item.s.id}`}
        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors duration-300 ease-in-out hover:bg-bg"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Wrench className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold font-body text-ink">
            {item.s.categoria}
          </p>
          <p className="truncate text-caption font-body text-muted">
            {item.s.descripcion}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.s.estado === "completada" && (
            <CheckCircle2 className="size-4 text-success" />
          )}
          {item.s.estado === "cancelada" && <XCircle className="size-4 text-muted" />}
          <span className="text-caption font-semibold font-body text-primary">
            {etiquetaServicio[item.s.estado]}
          </span>
          <ChevronRight className="size-4 text-muted" />
        </div>
      </Link>
    ) : (
      <Link
        key={`p-${item.p.id}`}
        href={`/pedido/${item.p.id}`}
        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors duration-300 ease-in-out hover:bg-bg"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/10">
          <Bike className="size-5 text-accent-deep" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold font-body text-ink">
            {item.p.comercio}
          </p>
          <p className="text-caption font-body text-muted">
            {item.p.codigo} · {currency.format(item.p.total)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.p.estado === "entregado" && (
            <CheckCircle2 className="size-4 text-success" />
          )}
          <ChevronRight className="size-4 text-muted" />
        </div>
      </Link>
    );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-20 pt-4">
      <h1 className="font-display text-h2 font-semibold text-ink">Tus pedidos</h1>

      {vacio ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Receipt className="size-7 text-primary" />
          </div>
          <p className="text-body font-semibold font-body text-ink">
            Aún no has pedido nada
          </p>
          <p className="max-w-[30ch] text-caption font-body text-muted">
            Cuando pidas un servicio, un mandado o algo de una tienda, aquí verás
            su estado y tu historial.
          </p>
          <Link
            href="/servicios"
            className="mt-2 rounded-md bg-primary px-5 py-3 text-body font-semibold font-body text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
          >
            Pedir lo primero
          </Link>
        </div>
      ) : (
        <>
          {enCurso.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-h3 font-semibold text-ink">En curso</h2>
              {enCurso.map(tarjeta)}
            </div>
          )}
          {anteriores.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-h3 font-semibold text-ink">Anteriores</h2>
              {anteriores.map(tarjeta)}
            </div>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}
