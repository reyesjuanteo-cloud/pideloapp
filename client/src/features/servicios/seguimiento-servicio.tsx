"use client";

// Seguimiento de una solicitud del cliente: las ofertas llegan en vivo, se
// comparan en tarjetas y al contratar se abren la dirección y el chat.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { supabase } from "@/lib/supabase/cliente";
import {
  cambiarEstadoServicio,
  contratar,
  iniciarRealtimeServicios,
  refrescarSolicitudes,
  useSolicitudes,
  type Oferta,
} from "./datos";
import { ChatServicio } from "./chat-servicio";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const pasos: { estado: string; texto: string }[] = [
  { estado: "contratada", texto: "Contratado" },
  { estado: "en_camino", texto: "En camino" },
  { estado: "llegue", texto: "Llegó" },
  { estado: "en_progreso", texto: "Trabajando" },
  { estado: "terminada_proveedor", texto: "Terminó" },
];

function useOfertas(solicitudId: string): Oferta[] {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);

  useEffect(() => {
    let vigente = true;
    const sb = supabase();

    const cargar = async () => {
      // Función segura: entrega nombre y trayectoria del proveedor sin abrir
      // la tabla (que guarda su cédula), y solo al dueño de la solicitud.
      const { data } = await sb.rpc("ofertas_de_solicitud", {
        p_solicitud: solicitudId,
      });
      if (!vigente || !data) return;
      setOfertas(
        (data as {
          id: string;
          proveedor_id: string;
          nombre: string;
          servicios_completados: number;
          precio: number;
          llegada_min: number | null;
          mensaje: string | null;
          estado: Oferta["estado"];
        }[]).map((f) => ({
          id: f.id,
          solicitudId,
          proveedorId: f.proveedor_id,
          proveedorNombre: f.nombre,
          serviciosCompletados: f.servicios_completados,
          precio: f.precio,
          llegadaMin: f.llegada_min,
          mensaje: f.mensaje,
          estado: f.estado,
        }))
      );
    };
    void cargar();

    const canal = sb
      .channel(`ofertas-${solicitudId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ofertas_servicio",
          filter: `solicitud_id=eq.${solicitudId}`,
        },
        () => void cargar()
      )
      .subscribe();

    return () => {
      vigente = false;
      void sb.removeChannel(canal);
    };
  }, [solicitudId]);

  return ofertas;
}

const MOTIVOS_CANCELACION = [
  "Ya no lo necesito",
  "Me demoré mucho en recibir ofertas",
  "Los precios están muy altos",
  "Lo resolví de otra forma",
  "Me equivoqué al pedirlo",
];

function CancelarConMotivo({
  onCancelar,
  ocupado,
}: {
  onCancelar: (motivo: string) => Promise<void>;
  ocupado: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [otro, setOtro] = useState("");

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="text-body font-body text-muted underline hover:text-ink"
      >
        Cancelar
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <p className="text-body font-semibold font-body text-ink">
        ¿Por qué cancelas? Le avisamos a quien se postuló.
      </p>
      {MOTIVOS_CANCELACION.map((motivo) => (
        <button
          key={motivo}
          disabled={ocupado}
          onClick={() => void onCancelar(motivo)}
          className="rounded-md border border-border bg-bg px-3 py-2.5 text-left text-body font-body text-ink hover:border-primary"
        >
          {motivo}
        </button>
      ))}
      <div className="flex gap-2">
        <input
          placeholder="Otro motivo…"
          value={otro}
          onChange={(e) => setOtro(e.target.value.slice(0, 200))}
          className="min-h-11 flex-1 rounded-md border border-border bg-bg px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <Button
          disabled={otro.trim().length < 3}
          pending={ocupado}
          onClick={() => void onCancelar(otro.trim())}
        >
          Cancelar
        </Button>
      </div>
      <button
        onClick={() => setAbierto(false)}
        className="text-caption font-body text-muted underline"
      >
        Mejor no, seguir con mi solicitud
      </button>
    </div>
  );
}

export function SeguimientoServicio({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const solicitudes = useSolicitudes();
  const ofertas = useOfertas(solicitudId);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    void iniciarRealtimeServicios();
    void refrescarSolicitudes();
  }, []);

  const solicitud = solicitudes.find((s) => s.id === solicitudId);
  if (!solicitud) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-body font-body text-muted">Cargando tu solicitud…</p>
      </div>
    );
  }

  const activas = ofertas.filter((o) => o.estado === "activa");
  const aceptada = ofertas.find((o) => o.estado === "aceptada");
  const indicePaso = pasos.findIndex((p) => p.estado === solicitud.estado);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-6 pt-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/servicios")}
          aria-label="Volver"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-h2 font-semibold text-ink">
            {solicitud.categoria}
          </h1>
          <p className="font-mono text-mono text-muted">{solicitud.codigo}</p>
        </div>
      </div>

      <p className="rounded-lg border border-border bg-surface p-3 text-body font-body text-muted">
        {solicitud.descripcion}
      </p>

      {/* Recibiendo ofertas */}
      {solicitud.estado === "publicada" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-h3 font-semibold text-ink">
              Ofertas {activas.length > 0 && `· ${activas.length}`}
            </h2>
            {solicitud.ofertaCliente && (
              <span className="text-caption font-body text-muted">
                Tu propuesta: {currency.format(solicitud.ofertaCliente)}
              </span>
            )}
          </div>

          {activas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-6 text-center">
              <span className="relative flex size-12 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <Clock3 className="size-6 text-primary" />
              </span>
              <p className="text-body font-body text-muted">
                Avisamos a los proveedores de tu zona. Las ofertas aparecerán aquí
                al instante.
              </p>
            </div>
          ) : (
            activas.map((oferta) => (
              <div
                key={oferta.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-body font-semibold font-body text-ink">
                    {oferta.proveedorNombre}
                  </p>
                  <p className="shrink-0 font-display text-h3 font-bold text-primary">
                    {currency.format(oferta.precio)}
                  </p>
                </div>
                <p className="flex items-center gap-2 text-caption font-body text-muted">
                  <Star className="size-3.5 text-accent-deep" />
                  {oferta.serviciosCompletados} servicios en Pídelo
                  {oferta.llegadaMin && (
                    <>
                      <Clock3 className="ml-1 size-3.5" />
                      llega en {oferta.llegadaMin} min
                    </>
                  )}
                </p>
                {oferta.mensaje && (
                  <p className="text-body font-body text-muted">“{oferta.mensaje}”</p>
                )}
                <Button
                  fullWidth
                  pending={ocupado}
                  onClick={async () => {
                    setOcupado(true);
                    await contratar(solicitud.id, oferta.proveedorId);
                    setOcupado(false);
                  }}
                >
                  Contratar por {currency.format(oferta.precio)}
                </Button>
              </div>
            ))
          )}

          <CancelarConMotivo
            ocupado={ocupado}
            onCancelar={async (motivo) => {
              setOcupado(true);
              await cambiarEstadoServicio(solicitud.id, "cancelada", motivo);
              setOcupado(false);
              router.push("/servicios");
            }}
          />
        </>
      )}

      {/* Contratado y en curso */}
      {indicePaso >= 0 && (
        <>
          <div className="flex flex-col gap-2 rounded-lg border border-primary bg-primary/5 p-3">
            <p className="text-body font-semibold font-body text-ink">
              {aceptada?.proveedorNombre ?? "Tu proveedor"} ·{" "}
              {currency.format(solicitud.precioFinal ?? 0)}
            </p>
            <div className="flex items-center gap-1">
              {pasos.map((paso, i) => (
                <div key={paso.estado} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={`h-1.5 w-full rounded-full ${
                      i <= indicePaso ? "bg-primary" : "bg-border"
                    }`}
                  />
                  <span
                    className={`text-center text-[10px] font-body ${
                      i <= indicePaso ? "font-semibold text-ink" : "text-muted"
                    }`}
                  >
                    {paso.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {solicitud.estado === "terminada_proveedor" && (
            <div className="flex flex-col gap-2">
              <Banner tone="info">
                El proveedor marcó el trabajo como terminado. ¿Todo quedó bien?
              </Banner>
              <Button
                fullWidth
                pending={ocupado}
                onClick={async () => {
                  setOcupado(true);
                  await cambiarEstadoServicio(solicitud.id, "completada");
                  setOcupado(false);
                }}
              >
                <ShieldCheck className="mr-1.5 size-4" />
                Sí, confirmo el trabajo
              </Button>
              <Button
                fullWidth
                variant="secondary"
                className="text-error"
                pending={ocupado}
                onClick={async () => {
                  setOcupado(true);
                  await cambiarEstadoServicio(solicitud.id, "disputada");
                  setOcupado(false);
                }}
              >
                Tuve un problema
              </Button>
            </div>
          )}

          {solicitud.estado === "contratada" && (
            <CancelarConMotivo
              ocupado={ocupado}
              onCancelar={async (motivo) => {
                setOcupado(true);
                await cambiarEstadoServicio(solicitud.id, "cancelada", motivo);
                setOcupado(false);
                router.push("/servicios");
              }}
            />
          )}

          <ChatServicio solicitudId={solicitud.id} />
        </>
      )}

      {solicitud.estado === "completada" && (
        <Banner tone="exito">
          Servicio completado. Gracias por contratar dentro de Pídelo: tu pago,
          historial y soporte quedan protegidos.
        </Banner>
      )}
      {solicitud.estado === "disputada" && (
        <Banner tone="advertencia">
          Recibimos tu reporte. El equipo de Pídelo revisará el caso y te
          contactará. El chat sigue disponible abajo.
        </Banner>
      )}
      {solicitud.estado === "disputada" && <ChatServicio solicitudId={solicitud.id} />}
    </div>
  );
}
