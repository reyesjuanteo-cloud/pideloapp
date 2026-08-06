import Image from "next/image";
import Link from "next/link";

// Pantalla de bienvenida: una sola pantalla móvil, sin información de relleno.
// Solo la marca, la promesa y las dos acciones.
export function Landing() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-linear-to-br from-primary to-primary-dark">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-accent/30 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 size-48 rounded-full bg-white/10 blur-2xl"
      />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
        <Image src="/marca-p.png" alt="PideloApp" width={150} height={150} priority />
        <p className="mt-3 font-display text-display font-bold tracking-tight text-white">
          PideloApp
        </p>
        <h1 className="mt-6 max-w-[16ch] font-display text-[32px] font-bold leading-tight text-white">
          Pide ahora, recíbelo en minutos
        </h1>
        <p className="mt-3 text-body font-body text-white/70">
          Comida, mercado, farmacia o lo que sea — en Girardot, Ricaurte y Flandes.
        </p>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-col gap-3 px-6 pb-10">
        <Link
          href="/ubicacion"
          className="rounded-sm bg-accent py-3.5 text-center text-body font-body font-semibold text-ink shadow-[0_10px_25px_rgba(255,152,0,0.35)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5"
        >
          Crear cuenta
        </Link>
        <Link
          href="/ingreso"
          className="rounded-md bg-white/10 py-3.5 text-center text-body font-body font-semibold text-white ring-1 ring-white/30 transition-colors duration-300 ease-in-out hover:bg-white/20"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
