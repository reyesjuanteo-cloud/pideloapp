import Link from "next/link";
import { Bike, MapPin, ShoppingBag, Truck } from "lucide-react";

const features = [
  {
    icon: ShoppingBag,
    title: "Pide en tus negocios favoritos",
    description: "Explora empresas cerca de ti y arma tu pedido en minutos.",
    tone: "primary",
  },
  {
    icon: Truck,
    title: "Sigue tu domicilio en vivo",
    description: "Mira en tiempo real cuándo tu pedido va en camino.",
    tone: "accent",
  },
  {
    icon: MapPin,
    title: "Todo cerca de tu zona",
    description: "Empresas y domiciliarios de tu barrio, sin vueltas.",
    tone: "primary",
  },
] as const;

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
};

export function Landing() {
  return (
    <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-linear-to-br from-primary to-primary-dark px-8 py-10 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent/30 blur-2xl"
        />

        <div className="relative flex flex-col items-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25">
            <Bike className="size-7" strokeWidth={2.2} />
          </div>
          <p className="mt-4 font-display text-display font-bold text-white">Pídelo</p>
          <p className="mt-2 max-w-[26ch] text-body font-body text-white/80">
            Pide, sigue tu domicilio y repite tus favoritos, todo desde una sola app.
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        <ul className="flex flex-col divide-y divide-border">
          {features.map(({ icon: Icon, title, description, tone }) => (
            <li key={title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-md ${toneClasses[tone]}`}
              >
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-body font-body font-semibold text-ink">{title}</p>
                <p className="text-caption font-body text-muted">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/register"
            className="rounded-sm bg-accent py-3 text-center text-body font-body font-semibold text-white shadow-[0_10px_25px_rgba(255,106,57,0.35)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5 hover:brightness-95"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="text-center text-body font-body text-primary transition-colors duration-300 ease-in-out hover:text-primary-dark"
          >
            Ya tengo cuenta · Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
