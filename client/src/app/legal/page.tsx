import Link from "next/link";
import { ArrowLeft, ChevronRight, ScrollText } from "lucide-react";
import { DOCUMENTOS } from "@/features/legal/documentos";

export const metadata = {
  title: "Legal — Pídelo",
  description: "Políticas y términos de PideloApp.",
};

export default function LegalPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <Link
        href="/"
        aria-label="Volver"
        className="flex size-11 items-center justify-center self-start rounded-full border border-border bg-surface text-ink"
      >
        <ArrowLeft className="size-4" />
      </Link>

      <div className="flex items-center gap-2">
        <ScrollText className="size-5 text-primary" />
        <h1 className="font-display text-h2 font-semibold text-ink">Legal</h1>
      </div>
      <p className="text-body font-body text-muted">
        Cómo funciona Pídelo y qué hacemos con tus datos, en documentos que
        puedes leer completos.
      </p>

      <div className="flex flex-col rounded-lg border border-border bg-surface">
        {DOCUMENTOS.map((doc, i) => (
          <Link
            key={doc.ruta}
            href={`/legal/${doc.ruta}`}
            className={`flex items-center gap-3 p-3 transition-colors duration-300 ease-in-out hover:bg-bg ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold font-body text-ink">{doc.titulo}</p>
              <p className="text-caption font-body text-muted">{doc.resumen}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
