import Link from "next/link";
import { House } from "lucide-react";
import { Rayo } from "@/components/ui/rayo";

export const metadata = { title: "Página no encontrada — Pídelo" };

export default function NoEncontrada() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <Rayo className="size-14 opacity-30" />
      <h1 className="font-display text-h1 font-bold text-ink">
        Esta página no existe
      </h1>
      <p className="text-body font-body text-muted">
        Puede que el enlace esté vencido o mal escrito.
      </p>
      <Link
        href="/home"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-body font-semibold font-body text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
      >
        <House className="size-4" />
        Ir al inicio
      </Link>
    </div>
  );
}
