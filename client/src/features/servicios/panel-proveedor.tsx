"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, LogOut, MapPin, Send, Star, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { supabase } from "@/lib/supabase/cliente";
import {
  cambiarEstadoServicio,
  distanciaASolicitud,
  iniciarRealtimeServicios,
  ofertar,
  refrescarMiProveedor,
  refrescarSolicitudes,
  useEstadoMiProveedor,
  useSolicitudes,
  type Solicitud,
} from "./datos";
import { ChatServicio } from "./chat-servicio";
import { DireccionServicio } from "./direccion-servicio";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const pasoSiguiente: Partial<
  Record<Solicitud["estado"], { a: Solicitud["estado"]; boton: string }>
> = {
  contratada: { a: "en_camino", boton: "Voy en camino" },
  en_camino: { a: "llegue", boton: "Ya llegué" },
  llegue: { a: "en_progreso", boton: "Empecé el trabajo" },
  en_progreso: { a: "terminada_proveedor", boton: "Terminé el trabajo" },
};

function FormularioOferta({ solicitud }: { solicitud: Solicitud }) {
  const [abierto, setAbierto] = useState(false);
  const [precio, setPrecio] = useState(
    solicitud.ofertaCliente ? String(solicitud.ofertaCliente) : ""
  );
  const [llegada, setLlegada] = useState("30");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);

  if (enviada) {
    return (
      <p className="rounded-md bg-success/10 p-2.5 text-caption font-body text-success">
        Oferta enviada. Si el cliente te elige, aquí verás la dirección y el chat.
      </p>
    );
  }
  if (!abierto) {
    return (
      <Button fullWidth variant="secondary" onClick={() => setAbierto(true)}>
        Ofertar
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-caption font-body text-muted">
          Tu precio
          <input
            inputMode="numeric"
            placeholder="50000"
            value={precio}
            onChange={(e) => setPrecio(e.target.value.replace(/\D/g, "").slice(0, 7))}
            className="min-h-10 rounded-md border border-border bg-bg px-3 text-body font-body text-ink focus:outline-none focus:border-primary"
          />
        </label>
        <label className="flex w-28 flex-col gap-1 text-caption font-body text-muted">
          Llegas en (min)
          <input
            inputMode="numeric"
            value={llegada}
            onChange={(e) => setLlegada(e.target.value.replace(/\D/g, "").slice(0, 3))}
            className="min-h-10 rounded-md border border-border bg-bg px-3 text-body font-body text-ink focus:outline-none focus:border-primary"
          />
        </label>
      </div>
      <input
        placeholder="Mensaje corto (sin teléfonos): qué incluye tu precio"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value.slice(0, 300))}
        className="min-h-10 rounded-md border border-border bg-bg px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
      />
      {aviso && <p className="text-caption text-error font-body">{aviso}</p>}
      <Button
        fullWidth
        pending={enviando}
        onClick={async () => {
          const valor = Number(precio);
          const min = Number(llegada);
          if (!valor || valor < 1000) {
            setAviso("Escribe tu precio (mínimo $1.000).");
            return;
          }
          if (!min || min < 1) {
            setAviso("¿En cuántos minutos llegas?");
            return;
          }
          setEnviando(true);
          setAviso(null);
          const r = await ofertar({
            solicitudId: solicitud.id,
            precio: valor,
            llegadaMin: min,
            mensaje,
          });
          setEnviando(false);
          if (!r.ok) {
            setAviso(r.error ?? "No se pudo ofertar.");
            return;
          }
          setEnviada(true);
        }}
      >
        <Send className="mr-1.5 size-4" />
        Enviar oferta
      </Button>
    </div>
  );
}

export function PanelProveedor() {
  const { datos: proveedor, cargado } = useEstadoMiProveedor();
  const solicitudes = useSolicitudes();
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    void iniciarRealtimeServicios();
    void refrescarSolicitudes();
  }, []);

  if (!cargado) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-body font-body text-muted">Cargando…</p>
      </div>
    );
  }
  if (!proveedor) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-body font-semibold font-body text-ink">
          No encontramos tu registro de proveedor
        </p>
        <Link
          href="/proveedor/registro"
          className="rounded-md bg-primary px-5 py-3 text-body font-semibold font-body text-white"
        >
          Registrarme como proveedor
        </Link>
      </div>
    );
  }

  const misTrabajos = solicitudes.filter(
    (s) =>
      s.proveedorId === proveedor.id &&
      !["completada", "cancelada", "publicada"].includes(s.estado)
  );
  // Dentro del radio elegido; sin zona propia registrada se muestran todas
  const disponibles = solicitudes
    .filter((s) => s.estado === "publicada" && !s.esMia)
    .map((s) => ({
      solicitud: s,
      distancia: distanciaASolicitud(s, proveedor.lat, proveedor.lng),
    }))
    .filter(({ distancia }) => distancia === null || distancia <= proveedor.radioKm)
    .sort((a, b) => (a.distancia ?? 99) - (b.distancia ?? 99));

  // Trabajos que el cliente canceló después de contratarlo: avisarle el porqué
  const cancelados = solicitudes
    .filter((s) => s.proveedorId === proveedor.id && s.estado === "cancelada")
    .slice(0, 3);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold text-ink">Tus servicios</h1>
          <p className="flex items-center gap-1 text-caption font-body text-muted">
            <Star className="size-3.5 text-accent-deep" />
            {proveedor.serviciosCompletados} completados · {proveedor.municipio}
          </p>
        </div>
        <button
          onClick={async () => {
            await supabase().auth.signOut();
            window.location.href = "/ingreso";
          }}
          className="flex items-center gap-1 text-caption font-body text-muted hover:text-ink"
        >
          <LogOut className="size-4" />
          Salir
        </button>
      </div>

      {proveedor.estado === "en_revision" && (
        <Banner tone="advertencia">
          Tu registro está en revisión. Cuando el equipo te apruebe empezarás a
          ver las solicitudes de tus categorías.
        </Banner>
      )}
      {proveedor.estado === "rechazado" && (
        <Banner tone="error">Tu registro no fue aprobado. Escríbenos para revisarlo.</Banner>
      )}
      {proveedor.estado === "suspendido" && (
        <Banner tone="error">Tu cuenta está suspendida. Escríbenos.</Banner>
      )}

      {proveedor.estado === "aprobado" && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
          <div>
            <p className="text-body font-semibold font-body text-ink">
              {proveedor.disponible ? "Disponible para trabajar" : "No disponible"}
            </p>
            <p className="text-caption font-body text-muted">
              La app funciona a toda hora: tú decides cuándo.
            </p>
          </div>
          <button
            disabled={cambiando}
            onClick={async () => {
              setCambiando(true);
              await supabase()
                .from("proveedores")
                .update({ disponible: !proveedor.disponible })
                .eq("id", proveedor.id);
              await refrescarMiProveedor();
              await refrescarSolicitudes();
              setCambiando(false);
            }}
            className={`shrink-0 rounded-full border px-3 py-2 text-caption font-semibold font-body ${
              proveedor.disponible
                ? "border-success bg-success/10 text-success"
                : "border-border bg-surface text-muted"
            }`}
          >
            {proveedor.disponible ? "Disponible" : "Apagado"}
          </button>
        </div>
      )}

      {/* El cliente canceló: decirle el porqué, no desaparecerle el trabajo */}
      {cancelados.map((c) => (
        <Banner key={c.id} tone="advertencia">
          El cliente canceló «{c.categoria} · {c.codigo}»
          {c.motivoCancelacion ? `: “${c.motivoCancelacion}”` : "."} No te
          preocupes: no afecta tu reputación.
        </Banner>
      ))}

      {/* Trabajos contratados en curso */}
      {misTrabajos.map((trabajo) => (
        <div
          key={trabajo.id}
          className="flex flex-col gap-3 rounded-lg border-2 border-primary bg-surface p-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-body font-semibold font-body text-ink">
              {trabajo.categoria} · {currency.format(trabajo.precioFinal ?? 0)}
            </p>
            <span className="font-mono text-mono text-muted">{trabajo.codigo}</span>
          </div>
          <p className="text-body font-body text-muted">{trabajo.descripcion}</p>

          {/* La dirección exacta: la base solo la entrega al contratado */}
          <DireccionServicio solicitudId={trabajo.id} />

          {trabajo.estado === "terminada_proveedor" ? (
            <Banner tone="info">
              Le avisamos al cliente que terminaste. Cuando confirme, el servicio
              queda completado y suma a tu reputación.
            </Banner>
          ) : trabajo.estado === "disputada" ? (
            <Banner tone="error">
              El cliente reportó un problema. El equipo de Pídelo revisará el caso.
            </Banner>
          ) : (
            pasoSiguiente[trabajo.estado] && (
              <Button
                fullWidth
                onClick={() =>
                  void cambiarEstadoServicio(trabajo.id, pasoSiguiente[trabajo.estado]!.a)
                }
              >
                {pasoSiguiente[trabajo.estado]!.boton}
              </Button>
            )
          )}

          <ChatServicio solicitudId={trabajo.id} />
        </div>
      ))}

      {/* Solicitudes abiertas de sus categorías */}
      <h2 className="font-display text-h3 font-semibold text-ink">
        Solicitudes cerca de ti {disponibles.length > 0 && `· ${disponibles.length}`}
      </h2>
      {proveedor.estado === "aprobado" && !proveedor.disponible && (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          Estás apagado: mientras tanto no recibes solicitudes. Enciende
          «Disponible» arriba cuando quieras trabajar.
        </p>
      )}
      {proveedor.estado === "aprobado" && proveedor.disponible && disponibles.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          No hay solicitudes abiertas en tus categorías (o quedan fuera de tu
          radio de {proveedor.radioKm} km). Te aparecerán aquí al instante.
        </p>
      )}
      {disponibles.map(({ solicitud, distancia }) => (
        <div
          key={solicitud.id}
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-body font-semibold font-body text-ink">
              <Wrench className="mr-1 inline size-4 text-primary" />
              {solicitud.categoria}
            </p>
            {solicitud.ofertaCliente && (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-caption font-semibold font-body text-accent-deep">
                Cliente ofrece {currency.format(solicitud.ofertaCliente)}
              </span>
            )}
          </div>
          <p className="text-body font-body text-muted">{solicitud.descripcion}</p>
          <p className="flex items-center gap-1 text-caption font-body text-muted">
            <MapPin className="size-3.5" />
            {solicitud.barrio ? `${solicitud.barrio} · ` : ""}
            {solicitud.ciudad}
            {distancia !== null && ` · a ${distancia.toFixed(1)} km`}
            <Clock3 className="ml-2 size-3.5" />
            {new Date(solicitud.creadoEn).toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-caption font-body text-muted">
            La dirección exacta se muestra solo si el cliente te contrata.
          </p>
          <FormularioOferta solicitud={solicitud} />
        </div>
      ))}
    </div>
  );
}
