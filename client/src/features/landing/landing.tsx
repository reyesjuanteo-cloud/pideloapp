import Link from "next/link";
import { Bike, MapPin, ShoppingBag, Truck } from "lucide-react";

const features = [
  {
    icon: ShoppingBag,
    title: "Pide en tus negocios favoritos",
    description: "Explora empresas cerca de ti y arma tu pedido en minutos.",
  },
  {
    icon: Truck,
    title: "Sigue tu domicilio en vivo",
    description: "Mira en tiempo real cuándo tu pedido va en camino.",
  },
  {
    icon: MapPin,
    title: "Todo cerca de tu zona",
    description: "Empresas y domiciliarios de tu barrio, sin vueltas.",
  },
];

export function Landing() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
      <span className="inline-flex items-center gap-2 font-display text-display font-bold text-primary">
        <Bike className="size-7" strokeWidth={2.2} />
        Pídelo
      </span>
      <p className="mt-3 text-body font-body text-muted">
        Pide, sigue tu domicilio y repite tus favoritos, todo desde una sola app.
      </p>

      <ul className="mt-6 flex flex-col gap-4">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
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
          className="rounded-md bg-primary py-3 text-center text-body font-body font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="text-center text-body font-body text-primary hover:text-primary-dark"
        >
          Ya tengo cuenta · Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
