"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEstadoComercios } from "@/features/comercios/store";
import { useProductos } from "@/features/comercios/productos-store";
import { Banner } from "@/components/ui/banner";
import { cambiarCantidad, useCarrito } from "./carrito";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function FichaComercio({ comercioId }: { comercioId: string }) {
  const router = useRouter();
  const carrito = useCarrito();
  const { datos: comercios, cargado } = useEstadoComercios();
  const comercio = comercios.find((c) => c.id === comercioId);
  const productos = useProductos().filter((p) => p.comercioId === comercioId);

  if (!comercio) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-body font-semibold font-body text-ink">
          {cargado ? "Este comercio ya no está disponible" : "Cargando el comercio…"}
        </p>
        <Link href="/home" className="text-body font-body text-primary hover:text-primary-dark">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const cantidades =
    carrito && carrito.comercioId === comercio.id ? carrito.cantidades : {};
  const totalItems = Object.values(cantidades).reduce((s, n) => s + n, 0);
  const subtotal = productos.reduce(
    (s, p) => s + p.precio * (cantidades[p.id] ?? 0),
    0
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-24 pt-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-h2 font-semibold text-ink">
            {comercio.nombre}
          </h1>
          <p className="flex items-center gap-2 text-caption font-body text-muted">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {comercio.tiempoMin}–{comercio.tiempoMax} min
            </span>
            <span>Envío {currency.format(comercio.costoDomicilio)}</span>
          </p>
        </div>
      </div>

      {!comercio.abierto && (
        <Banner tone="advertencia">
          Este comercio está cerrado ahora. Puedes mirar el menú, pero no pedir.
        </Banner>
      )}

      <div className="flex flex-col gap-2">
        {productos.length === 0 && (
          <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
            Este comercio aún no tiene productos cargados.
          </p>
        )}
        {productos.map((producto) => {
          const cantidad = cantidades[producto.id] ?? 0;
          return (
            <div
              key={producto.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold font-body text-ink">
                  {producto.nombre}
                </p>
                <p className="text-caption font-body text-muted">{producto.descripcion}</p>
                <p className="mt-0.5 text-body font-semibold font-body text-ink">
                  {currency.format(producto.precio)}
                </p>
              </div>

              {cantidad === 0 ? (
                <button
                  onClick={() => cambiarCantidad(comercio.id, producto.id, 1)}
                  disabled={!comercio.abierto}
                  aria-label={`Agregar ${producto.nombre}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-accent text-ink transition-colors duration-300 ease-in-out hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Plus className="size-4" />
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-bg px-1.5 py-1">
                  <button
                    onClick={() => cambiarCantidad(comercio.id, producto.id, -1)}
                    aria-label={`Quitar ${producto.nombre}`}
                    className="flex size-7 items-center justify-center rounded-full bg-surface text-ink"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-5 text-center text-body font-semibold font-body text-ink">
                    {cantidad}
                  </span>
                  <button
                    onClick={() => cambiarCantidad(comercio.id, producto.id, 1)}
                    aria-label={`Agregar ${producto.nombre}`}
                    className="flex size-7 items-center justify-center rounded-full bg-primary text-white"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <Link
          href="/carrito"
          className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-sm items-center justify-between rounded-md bg-primary px-4 py-3.5 text-body font-semibold font-body text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="size-4" />
            Ver carrito · {totalItems} {totalItems === 1 ? "producto" : "productos"}
          </span>
          {currency.format(subtotal)}
        </Link>
      )}
    </div>
  );
}
