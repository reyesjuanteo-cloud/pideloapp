"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  SelectorUbicacion,
  type UbicacionElegida,
} from "@/components/ui/selector-ubicacion";
import {
  publicarSolicitud,
  refrescarSolicitudes,
  useCategoriasServicio,
  useSolicitudes,
  iniciarRealtimeServicios,
} from "./datos";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const etiquetaEstado: Record<string, string> = {
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

export function PedirServicio() {
  const router = useRouter();
  const categorias = useCategoriasServicio();
  const solicitudes = useSolicitudes();
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [oferta, setOferta] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [ubicacion, setUbicacion] = useState<UbicacionElegida | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void iniciarRealtimeServicios();
    void refrescarSolicitudes();
  }, []);

  const mias = solicitudes.filter(
    (s) => s.esMia && !["completada", "cancelada"].includes(s.estado)
  );

  async function publicar() {
    if (!categoriaId) {
      setError("Elige qué tipo de servicio necesitas.");
      return;
    }
    if (descripcion.trim().length < 10) {
      setError("Describe lo que necesitas (mínimo 10 letras).");
      return;
    }
    if (!ubicacion) {
      setError("Ubica dónde necesitas el servicio.");
      return;
    }
    setPublicando(true);
    setError(null);
    const r = await publicarSolicitud({
      categoriaId,
      descripcion: descripcion.trim(),
      ofertaCliente: Number(oferta) >= 1000 ? Number(oferta) : null,
      direccion: ubicacion.direccion,
      indicaciones: indicaciones.trim() || undefined,
      barrio: ubicacion.barrio,
      ciudad: ubicacion.ciudad,
      lat: ubicacion.lat,
      lng: ubicacion.lng,
    });
    setPublicando(false);
    if (r.error || !r.id) {
      setError(r.error ?? "No se pudo publicar.");
      return;
    }
    router.push(`/servicios/${r.id}`);
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
        <h1 className="font-display text-h2 font-semibold text-ink">Pide un servicio</h1>
      </div>

      {/* Servicios activos del cliente */}
      {mias.length > 0 && (
        <div className="flex flex-col gap-2">
          {mias.map((s) => (
            <Link
              key={s.id}
              href={`/servicios/${s.id}`}
              className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-3"
            >
              <span className="min-w-0">
                <span className="block text-body font-semibold font-body text-ink">
                  {s.categoria}
                </span>
                <span className="block truncate text-caption font-body text-muted">
                  {s.descripcion}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-caption font-semibold font-body text-white">
                {etiquetaEstado[s.estado]}
              </span>
            </Link>
          ))}
        </div>
      )}

      <p className="text-body font-body text-muted">
        Cuéntanos qué necesitas — plomería, belleza, un acarreo, un mandado — y
        los proveedores cercanos te ofertan su precio. Tú comparas y eliges.
        Funciona a cualquier hora.
      </p>

      <div className="flex flex-col gap-1.5">
        <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
          ¿Qué necesitas?
        </p>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <Chip
              key={c.id}
              active={categoriaId === c.id}
              onClick={() => setCategoriaId(c.id)}
            >
              {c.nombre}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="descripcion-servicio"
          className="text-label font-semibold uppercase tracking-wide text-muted font-body"
        >
          Descríbelo
        </label>
        <textarea
          id="descripcion-servicio"
          placeholder="Necesito revisar el aire acondicionado de la sala: enfría poco y gotea."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value.slice(0, 1200))}
          className="h-24 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-body font-body text-ink placeholder:text-muted transition-colors duration-300 ease-in-out focus:outline-none focus:border-primary"
        />
        <p className="text-caption font-body text-muted">
          Sin teléfonos ni redes: el proveedor te escribe por el chat de Pídelo.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="oferta-cliente"
          className="text-label font-semibold uppercase tracking-wide text-muted font-body"
        >
          <HandCoins className="mr-1 inline size-3.5" />
          ¿Cuánto ofreces? (opcional)
        </label>
        <input
          id="oferta-cliente"
          inputMode="numeric"
          placeholder="40000"
          value={oferta}
          onChange={(e) => setOferta(e.target.value.replace(/\D/g, "").slice(0, 7))}
          className="min-h-12 w-full rounded-md border border-border bg-surface px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <p className="text-caption font-body text-muted">
          Es tu propuesta de partida: los proveedores pueden aceptarla o
          contraofertar, y tú decides.
        </p>
      </div>

      <SelectorUbicacion
        etiqueta="¿Dónde?"
        ayuda="Los proveedores ven solo la zona. Tu dirección exacta se comparte únicamente con quien contrates."
        onElegir={setUbicacion}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="indicaciones-servicio"
          className="text-label font-semibold uppercase tracking-wide text-muted font-body"
        >
          Indicaciones para llegar (opcional)
        </label>
        <input
          id="indicaciones-servicio"
          placeholder="Portería del conjunto, torre 2, timbre 201"
          value={indicaciones}
          onChange={(e) => setIndicaciones(e.target.value.slice(0, 200))}
          className="min-h-12 w-full rounded-md border border-border bg-surface px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        {error && <p className="text-caption text-error font-body">{error}</p>}
        <Button fullWidth pending={publicando} onClick={publicar}>
          Publicar y recibir ofertas
        </Button>
      </div>
    </div>
  );
}
