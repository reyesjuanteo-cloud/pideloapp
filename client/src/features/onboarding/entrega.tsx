"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Home, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { useDireccion, guardarDireccion, type Direccion } from "./direccion";

const etiquetas = [
  { valor: "Casa", icono: Home },
  { valor: "Trabajo", icono: Briefcase },
  { valor: "Otra", icono: Plus },
] as const;

export function Entrega() {
  const router = useRouter();
  const direccion = useDireccion();

  useEffect(() => {
    if (direccion === null) router.replace("/mapa");
  }, [direccion, router]);

  if (!direccion) return null;

  return <FormularioEntrega direccion={direccion} />;
}

// Hijo separado: monta cuando la dirección ya existe, así los useState
// pueden inicializarse directamente desde ella (sin setState en efectos).
function FormularioEntrega({ direccion }: { direccion: Direccion }) {
  const router = useRouter();
  const [detalle, setDetalle] = useState(direccion.detalle ?? "");
  const [indicaciones, setIndicaciones] = useState(direccion.indicaciones ?? "");
  const [etiqueta, setEtiqueta] = useState<Direccion["etiqueta"]>(
    direccion.etiqueta ?? "Casa"
  );

  function guardar() {
    guardarDireccion({ ...direccion, detalle, indicaciones, etiqueta });
    router.push("/home");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 py-6">
      <button
        onClick={() => router.back()}
        aria-label="Volver"
        className="flex size-11 items-center justify-center self-start text-ink"
      >
        <ArrowLeft className="size-5" />
      </button>

      <h1 className="mt-2 font-display text-h2 font-semibold text-ink">
        Detalles de la entrega
      </h1>

      <div className="mt-5 flex items-center gap-2.5 rounded-md border border-border bg-bg p-3">
        <MapPin className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold font-body text-ink">
            {direccion.texto}
          </p>
          <p className="text-caption font-body text-muted">{direccion.barrio} · Bogotá</p>
        </div>
        <button
          onClick={() => router.push("/mapa")}
          className="text-caption font-body text-primary hover:text-primary-dark"
        >
          Editar
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Input
          label="Torre, apartamento u oficina"
          name="detalle"
          placeholder="Torre 2 — Apto 704"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="indicaciones"
            className="text-label font-semibold uppercase tracking-wide text-muted font-body"
          >
            Indicaciones para el mensajero
          </label>
          <textarea
            id="indicaciones"
            name="indicaciones"
            placeholder="Portería al lado del café, timbre 704"
            value={indicaciones}
            onChange={(e) => setIndicaciones(e.target.value)}
            className="h-16 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-body font-body text-ink placeholder:text-muted transition-colors duration-300 ease-in-out focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Guardar como
          </p>
          <div className="flex gap-2">
            {etiquetas.map(({ valor, icono: Icono }) => (
              <Chip
                key={valor}
                active={etiqueta === valor}
                icon={<Icono className="size-3.5" />}
                onClick={() => setEtiqueta(valor)}
              >
                {valor}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pb-4 pt-8">
        <Button fullWidth onClick={guardar}>
          Guardar y continuar
        </Button>
      </div>
    </div>
  );
}
