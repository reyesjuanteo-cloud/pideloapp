"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";

type EstadoPermiso = "inicial" | "buscando" | "denegado";

export function Ubicacion() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoPermiso>("inicial");

  function usarUbicacion() {
    if (!navigator.geolocation) {
      router.push("/ingreso");
      return;
    }
    setEstado("buscando");
    navigator.geolocation.getCurrentPosition(
      () => router.push("/ingreso"),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setEstado("denegado");
        } else {
          // Sin señal o timeout: caer a ingreso manual, sin bloquear.
          router.push("/ingreso");
        }
      },
      { timeout: 8000 }
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 py-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-19 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="size-8 text-primary" />
        </div>
        <h1 className="font-display text-h2 font-semibold text-ink">¿Dónde entregamos?</h1>
        <p className="max-w-[32ch] text-body font-body text-muted">
          Necesitamos tu ubicación para mostrarte solo lo que llega rápido a tu zona.
        </p>
        {estado === "denegado" && (
          <Banner tone="advertencia">
            El permiso está bloqueado. Actívalo en los ajustes del navegador o escribe tu
            dirección.
          </Banner>
        )}
      </div>

      <div className="flex flex-col gap-2.5 pb-4">
        <Button fullWidth pending={estado === "buscando"} onClick={usarUbicacion}>
          {estado !== "buscando" && <LocateFixed className="size-4" />}
          Usar mi ubicación actual
        </Button>
        <Button fullWidth variant="secondary" onClick={() => router.push("/ingreso")}>
          Escribir la dirección
        </Button>
        <p className="text-center text-caption font-body text-muted">
          Solo la usamos mientras haces un pedido
        </p>
      </div>
    </div>
  );
}
