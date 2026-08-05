"use client";

import Link from "next/link";
import { Bike, CheckCircle2, ChevronRight, Receipt } from "lucide-react";
import { usePedidos } from "@/features/pedidos/almacen";
import { BottomNav } from "./bottom-nav";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function Pedidos() {
  const pedidos = usePedidos();
  const enCurso = pedidos.filter((p) => p.estado !== "entregado");
  const anteriores = pedidos.filter((p) => p.estado === "entregado");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-20 pt-4">
      <h1 className="font-display text-h2 font-semibold text-ink">Tus pedidos</h1>

      {pedidos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Receipt className="size-7 text-primary" />
          </div>
          <p className="text-body font-semibold font-body text-ink">
            Aún no has hecho pedidos
          </p>
          <p className="max-w-[30ch] text-caption font-body text-muted">
            Cuando hagas tu primer pedido, aquí verás su estado y tu historial.
          </p>
          <Link
            href="/home"
            className="mt-2 rounded-md bg-primary px-5 py-3 text-body font-semibold font-body text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
          >
            Hacer mi primer pedido
          </Link>
        </div>
      ) : (
        <>
          {enCurso.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-h3 font-semibold text-ink">En curso</h2>
              {enCurso.map((pedido) => (
                <Link
                  key={pedido.id}
                  href={`/pedido/${pedido.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors duration-300 ease-in-out hover:bg-bg"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/10">
                    <Bike className="size-5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold font-body text-ink">
                      {pedido.comercio}
                    </p>
                    <p className="text-caption font-body text-muted">
                      {pedido.horaCreacion} ·{" "}
                      <span className="font-mono text-mono">{pedido.codigo}</span> ·{" "}
                      {currency.format(pedido.total)}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </Link>
              ))}
            </div>
          )}

          {anteriores.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-h3 font-semibold text-ink">Anteriores</h2>
              <div className="flex flex-col rounded-lg border border-border bg-surface">
                {anteriores.map((pedido, i) => (
                  <Link
                    key={pedido.id}
                    href={`/pedido/${pedido.id}`}
                    className={`flex items-center gap-3 p-3 transition-colors duration-300 ease-in-out hover:bg-bg ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold font-body text-ink">
                        {pedido.comercio}
                      </p>
                      <p className="text-caption font-body text-muted">
                        Entregado {pedido.horaEntrega} ·{" "}
                        <span className="font-mono text-mono">{pedido.codigo}</span>
                      </p>
                    </div>
                    <span className="text-body font-semibold font-body text-ink">
                      {currency.format(pedido.total)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}
