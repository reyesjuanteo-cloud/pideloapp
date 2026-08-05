"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leerDireccion, type Direccion } from "@/features/onboarding/direccion";
import { crearPedido } from "./almacen";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// ⚠️ TEMPORAL: cotización determinista simulada. En el flujo real la propone
// el mensajero y el cliente la aprueba.
function cotizar(descripcion: string): number {
  const base = 6000;
  const porComplejidad = Math.min(9000, descripcion.trim().length * 120);
  return Math.round((base + porComplejidad) / 100) * 100;
}

export function PedidoLibre() {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState("");
  const [cotizacion, setCotizacion] = useState<number | null>(null);
  const [direccion, setDireccion] = useState<Direccion | null>(null);
  const [pidiendo, setPidiendo] = useState(false);

  useEffect(() => {
    setDireccion(leerDireccion());
  }, []);

  function pedir() {
    if (!direccion) {
      router.push("/mapa");
      return;
    }
    if (cotizacion === null) return;
    setPidiendo(true);
    const pedido = crearPedido({
      tipo: "libre",
      comercio: "Pedido libre",
      items: [],
      descripcionLibre: descripcion.trim(),
      subtotal: 0,
      envio: cotizacion,
      total: cotizacion,
      direccion: `${direccion.texto}${direccion.detalle ? `, ${direccion.detalle}` : ""}`,
      barrio: direccion.barrio,
    });
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
        <h1 className="font-display text-h2 font-semibold text-ink">Pide lo que sea</h1>
      </div>

      <p className="text-body font-body text-muted">
        Escribe qué necesitas y dónde conseguirlo si lo sabes. Un mensajero lo compra y te
        lo lleva. El valor de lo que compre se paga aparte, contra entrega.
      </p>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="descripcion"
          className="text-label font-semibold uppercase tracking-wide text-muted font-body"
        >
          ¿Qué necesitas?
        </label>
        <textarea
          id="descripcion"
          autoFocus
          placeholder="Un cargador tipo C. Puede ser de la tienda de tecnología de la Cra 15 con 85."
          value={descripcion}
          onChange={(e) => {
            setDescripcion(e.target.value);
            setCotizacion(null);
          }}
          className="h-28 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-body font-body text-ink placeholder:text-muted transition-colors duration-300 ease-in-out focus:outline-none focus:border-primary"
        />
      </div>

      {cotizacion !== null && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bike className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-body font-semibold font-body text-ink">
              Servicio de mensajero: {currency.format(cotizacion)}
            </p>
            <p className="text-caption font-body text-muted">
              Incluye la vuelta completa. Lo que compre se paga aparte.
            </p>
          </div>
        </div>
      )}

      <div className="mt-auto">
        {cotizacion === null ? (
          <Button
            fullWidth
            disabled={descripcion.trim().length < 10}
            onClick={() => setCotizacion(cotizar(descripcion))}
          >
            <Sparkles className="size-4" />
            Cotizar
          </Button>
        ) : (
          <Button fullWidth pending={pidiendo} onClick={pedir}>
            Pedir por {currency.format(cotizacion)}
          </Button>
        )}
      </div>
    </div>
  );
}
