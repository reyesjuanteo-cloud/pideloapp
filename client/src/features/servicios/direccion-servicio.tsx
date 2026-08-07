"use client";

// La dirección exacta del servicio. La base solo la entrega al cliente y al
// proveedor contratado con el trabajo en curso: si no llega, no se muestra.
import { useEffect, useState } from "react";
import { MapPin, Navigation, StickyNote } from "lucide-react";
import { supabase } from "@/lib/supabase/cliente";

type Direccion = {
  direccion: string;
  indicaciones: string | null;
  lat: number;
  lng: number;
};

export function DireccionServicio({ solicitudId }: { solicitudId: string }) {
  const [direccion, setDireccion] = useState<Direccion | null>(null);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const { data } = await supabase()
        .from("direcciones_solicitud")
        .select("direccion, indicaciones, lat, lng")
        .eq("solicitud_id", solicitudId)
        .maybeSingle();
      if (vigente && data) setDireccion(data as Direccion);
    })();
    return () => {
      vigente = false;
    };
  }, [solicitudId]);

  if (!direccion) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-md border border-border bg-bg p-3">
        <MapPin className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Dirección del servicio
          </p>
          <p className="text-body font-body text-ink">{direccion.direccion}</p>
        </div>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${direccion.lat},${direccion.lng}&travelmode=driving`}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-caption font-semibold font-body text-white"
        >
          <Navigation className="size-3.5" />
          Cómo llegar
        </a>
      </div>
      {direccion.indicaciones && (
        <p className="flex items-start gap-1.5 rounded-md bg-accent/10 p-2.5 text-caption font-body text-ink">
          <StickyNote className="mt-0.5 size-3.5 shrink-0 text-accent-deep" />
          {direccion.indicaciones}
        </p>
      )}
    </div>
  );
}
