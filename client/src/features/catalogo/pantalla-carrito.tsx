"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComercios } from "@/features/comercios/store";
import { useProductos } from "@/features/comercios/productos-store";
import { cambiarCantidad, useCarrito } from "./carrito";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function PantallaCarrito() {
  const router = useRouter();
  const carrito = useCarrito();

  const comercios = useComercios();
  const todosProductos = useProductos();
  const comercio = carrito
    ? comercios.find((c) => c.id === carrito.comercioId)
    : undefined;
  const productos = comercio
    ? todosProductos.filter((p) => p.comercioId === comercio.id)
    : [];
  const lineas = productos
    .map((p) => ({ producto: p, cantidad: carrito?.cantidades[p.id] ?? 0 }))
    .filter((l) => l.cantidad > 0);

  const subtotal = lineas.reduce((s, l) => s + l.producto.precio * l.cantidad, 0);
  const envio = comercio?.costoDomicilio ?? 0;

  if (!comercio || lineas.length === 0) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-4 pt-4">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-11 items-center justify-center self-start text-ink"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBag className="size-7 text-primary" />
          </div>
          <p className="text-body font-semibold font-body text-ink">Tu carrito está vacío</p>
          <p className="max-w-[30ch] text-caption font-body text-muted">
            Agrega productos desde cualquier comercio y aparecerán aquí.
          </p>
          <Link
            href="/home"
            className="mt-2 rounded-md bg-primary px-5 py-3 text-body font-semibold font-body text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
          >
            Explorar comercios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-6 pt-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="font-display text-h2 font-semibold text-ink">Tu carrito</h1>
          <p className="text-caption font-body text-muted">{comercio.nombre}</p>
        </div>
      </div>

      <div className="flex flex-col rounded-lg border border-border bg-surface">
        {lineas.map(({ producto, cantidad }, i) => (
          <div
            key={producto.id}
            className={`flex items-center gap-3 p-3 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold font-body text-ink">{producto.nombre}</p>
              <p className="text-caption font-body text-muted">
                {currency.format(producto.precio)} c/u
              </p>
            </div>
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
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-body font-body">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{currency.format(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Envío</span>
          <span>{currency.format(envio)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold text-ink">
          <span>Total</span>
          <span>{currency.format(subtotal + envio)}</span>
        </div>
      </div>

      <div className="mt-auto">
        <Button fullWidth onClick={() => router.push("/checkout")}>
          Ir a pagar · {currency.format(subtotal + envio)}
        </Button>
      </div>
    </div>
  );
}
