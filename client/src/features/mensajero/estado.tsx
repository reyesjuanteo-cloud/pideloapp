"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refrescarPerfilMensajero, usePerfilMensajero } from "./perfil";

export function EstadoMensajero() {
  const router = useRouter();
  const perfil = usePerfilMensajero();

  // La aprobación llega del panel del equipo: consultar cada pocos segundos.
  useEffect(() => {
    const intervalo = setInterval(() => void refrescarPerfilMensajero(), 8000);
    return () => clearInterval(intervalo);
  }, []);

  if (!perfil) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-body font-semibold font-body text-ink">
          Aún no te has registrado como mensajero
        </p>
        <Link
          href="/mensajero/registro"
          className="text-body font-body text-primary hover:text-primary-dark"
        >
          Ir al registro
        </Link>
      </div>
    );
  }

  const contenido = {
    en_revision: {
      icono: <Clock className="size-8 text-accent-deep" />,
      fondo: "bg-accent/10",
      titulo: "Estamos revisando tus datos",
      texto:
        "Te avisaremos cuando tu registro quede aprobado. Suele tomar menos de un día.",
    },
    aprobado: {
      icono: <CheckCircle2 className="size-8 text-success" />,
      fondo: "bg-success/10",
      titulo: "Aprobado. Ya puedes trabajar",
      texto: "Activa tu disponibilidad en el panel y empieza a recibir pedidos.",
    },
    rechazado: {
      icono: <XCircle className="size-8 text-error" />,
      fondo: "bg-error/10",
      titulo: "Tu registro no fue aprobado",
      texto:
        "Revisa que tus datos y documentos sean correctos y vuelve a intentarlo, o escríbenos.",
    },
  }[perfil.estado];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 py-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className={`flex size-19 items-center justify-center rounded-full ${contenido.fondo}`}>
          {contenido.icono}
        </div>
        <h1 className="font-display text-h2 font-semibold text-ink">{contenido.titulo}</h1>
        <p className="max-w-[32ch] text-body font-body text-muted">{contenido.texto}</p>

        <div className="mt-2 w-full rounded-lg border border-border bg-surface p-3 text-left">
          <p className="text-body font-semibold font-body text-ink">{perfil.nombre}</p>
          <p className="text-caption font-body text-muted">
            CC {perfil.documento} · {perfil.municipio} ·{" "}
            {perfil.vehiculo === "moto" ? `Moto ${perfil.placa}` : "Bicicleta"}
          </p>
          <p className="text-caption font-body text-muted">
            Registrado el {perfil.fechaRegistro}
          </p>
        </div>
      </div>

      <div className="pb-4">
        {perfil.estado === "aprobado" ? (
          <Button fullWidth onClick={() => router.push("/driver/dashboard")}>
            Ir a mi panel
          </Button>
        ) : perfil.estado === "rechazado" ? (
          <Button fullWidth onClick={() => router.push("/mensajero/registro")}>
            Corregir mis datos y volver a enviar
          </Button>
        ) : (
          <Link
            href="/home"
            className="block text-center text-body font-body text-primary hover:text-primary-dark"
          >
            Volver al inicio
          </Link>
        )}
      </div>
    </div>
  );
}
