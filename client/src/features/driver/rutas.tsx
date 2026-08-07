import { MapPin, Navigation, StickyNote, Store } from "lucide-react";
import type { PedidoDisponible } from "./types";

// Abre la app de mapas del celular (Google Maps, Waze o la que tenga) con la
// ruta hacia el punto. Es lo que el mensajero necesita en la calle.
function enlaceMapa(lat?: number, lng?: number, texto?: string): string | null {
  if (lat !== undefined && lng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  }
  if (texto) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${texto}, Girardot, Colombia`
    )}`;
  }
  return null;
}

function BotonRuta({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-caption font-semibold font-body text-white"
    >
      <Navigation className="size-3.5" />
      Cómo llegar
    </a>
  );
}

// Dónde recoger y dónde entregar, con navegación en un toque.
export function RutasPedido({ pedido }: { pedido: PedidoDisponible }) {
  const rutaRecoger = enlaceMapa(pedido.recogerLat, pedido.recogerLng, pedido.recogerEn);
  const rutaEntrega = enlaceMapa(pedido.lat, pedido.lng, pedido.direccion);

  return (
    <div className="flex flex-col gap-2">
      {pedido.tipo === "catalogo" && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-bg p-3">
          <Store className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
              Recoger en
            </p>
            <p className="truncate text-body font-body text-ink">
              {pedido.comercio}
              {pedido.recogerEn ? ` · ${pedido.recogerEn}` : ""}
            </p>
            {!pedido.recogerEn && (
              <p className="text-caption font-body text-muted">
                Este comercio aún no registró su dirección.
              </p>
            )}
          </div>
          {rutaRecoger && <BotonRuta href={rutaRecoger} />}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-md border border-border bg-bg p-3">
        <MapPin className="size-4 shrink-0 text-accent-deep" />
        <div className="min-w-0 flex-1">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Entregar en
          </p>
          <p className="truncate text-body font-body text-ink">{pedido.direccion}</p>
          <p className="text-caption font-body text-muted">{pedido.zona}</p>
        </div>
        {rutaEntrega && <BotonRuta href={rutaEntrega} />}
      </div>

      {/* Lo que escribió el cliente para que lo encuentren */}
      {pedido.indicaciones && (
        <div className="flex items-start gap-2 rounded-md bg-accent/10 p-3">
          <StickyNote className="mt-0.5 size-4 shrink-0 text-accent-deep" />
          <div>
            <p className="text-label font-semibold uppercase tracking-wide text-accent-deep font-body">
              Indicaciones del cliente
            </p>
            <p className="text-body font-body text-ink">{pedido.indicaciones}</p>
          </div>
        </div>
      )}
    </div>
  );
}
