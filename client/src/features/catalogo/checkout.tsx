"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CreditCard, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leerDireccion, type Direccion } from "@/features/onboarding/direccion";
import { mockComercios } from "@/features/customer/mock-comercios";
import { crearPedido } from "@/features/pedidos/almacen";
import { productosDeComercio } from "./mock-productos";
import { leerCarrito, vaciarCarrito } from "./carrito";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function Checkout() {
  const router = useRouter();
  const [direccion, setDireccion] = useState<Direccion | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setDireccion(leerDireccion());
    setListo(true);
  }, []);

  const carrito = typeof window !== "undefined" ? leerCarrito() : null;
  const comercio = carrito
    ? mockComercios.find((c) => c.id === carrito.comercioId)
    : undefined;

  useEffect(() => {
    if (listo && (!carrito || !comercio)) router.replace("/home");
  }, [listo, carrito, comercio, router]);

  if (!listo || !carrito || !comercio) return null;

  const lineas = productosDeComercio(comercio.id)
    .map((p) => ({ producto: p, cantidad: carrito.cantidades[p.id] ?? 0 }))
    .filter((l) => l.cantidad > 0);
  const subtotal = lineas.reduce((s, l) => s + l.producto.precio * l.cantidad, 0);
  const envio = comercio.costoDomicilio;

  function hacerPedido() {
    if (!direccion) {
      router.push("/mapa");
      return;
    }
    setConfirmando(true);
    const pedido = crearPedido({
      tipo: "catalogo",
      comercio: comercio!.nombre,
      items: lineas.map(({ producto, cantidad }) => ({
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
      })),
      subtotal,
      envio,
      total: subtotal + envio,
      direccion: `${direccion.texto}${direccion.detalle ? `, ${direccion.detalle}` : ""}`,
      barrio: direccion.barrio,
      lat: direccion.lat,
      lng: direccion.lng,
    });
    vaciarCarrito();
    router.replace(`/pedido/${pedido.id}`);
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
        <h1 className="font-display text-h2 font-semibold text-ink">Confirma tu pedido</h1>
      </div>

      {/* Dirección */}
      <div className="flex items-center gap-2.5 rounded-md border border-border bg-bg p-3">
        <MapPin className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          {direccion ? (
            <>
              <p className="truncate text-body font-semibold font-body text-ink">
                {direccion.texto}
                {direccion.detalle ? `, ${direccion.detalle}` : ""}
              </p>
              <p className="text-caption font-body text-muted">{direccion.barrio} · Bogotá</p>
            </>
          ) : (
            <p className="text-body font-body text-muted">Agrega tu dirección de entrega</p>
          )}
        </div>
        <button
          onClick={() => router.push("/mapa")}
          className="text-caption font-body text-primary hover:text-primary-dark"
        >
          {direccion ? "Editar" : "Agregar"}
        </button>
      </div>

      {/* Resumen */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-body font-body">
        <p className="font-display text-h3 font-semibold text-ink">{comercio.nombre}</p>
        {lineas.map(({ producto, cantidad }) => (
          <div key={producto.id} className="flex justify-between text-muted">
            <span>
              {cantidad} × {producto.nombre}
            </span>
            <span>{currency.format(producto.precio * cantidad)}</span>
          </div>
        ))}
        <div className="flex justify-between text-muted">
          <span>Envío</span>
          <span>{currency.format(envio)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold text-ink">
          <span>Total</span>
          <span>{currency.format(subtotal + envio)}</span>
        </div>
      </div>

      {/* Método de pago */}
      <div className="flex flex-col gap-1.5">
        <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
          Método de pago
        </p>
        <div className="flex items-center gap-2.5 rounded-md border border-primary bg-primary/10 p-3">
          <Banknote className="size-4 text-primary" />
          <span className="flex-1 text-body font-semibold font-body text-ink">
            Efectivo al recibir
          </span>
          <span className="size-2.5 rounded-full bg-primary" />
        </div>
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface p-3 opacity-50">
          <CreditCard className="size-4 text-muted" />
          <span className="flex-1 text-body font-body text-muted">
            Tarjeta — disponible pronto
          </span>
        </div>
      </div>

      <div className="mt-auto">
        <Button fullWidth pending={confirmando} onClick={hacerPedido}>
          Hacer pedido · {currency.format(subtotal + envio)}
        </Button>
      </div>
    </div>
  );
}
