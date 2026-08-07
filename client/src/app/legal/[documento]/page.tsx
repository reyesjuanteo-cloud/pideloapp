import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DOCUMENTOS } from "@/features/legal/documentos";
import { Markdown } from "@/features/legal/markdown";

export function generateStaticParams() {
  return DOCUMENTOS.map((d) => ({ documento: d.ruta }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ documento: string }>;
}) {
  const { documento } = await params;
  const doc = DOCUMENTOS.find((d) => d.ruta === documento);
  return { title: doc ? `${doc.titulo} — Pídelo` : "Legal — Pídelo" };
}

export default async function DocumentoLegalPage({
  params,
}: {
  params: Promise<{ documento: string }>;
}) {
  const { documento } = await params;
  const doc = DOCUMENTOS.find((d) => d.ruta === documento);
  if (!doc) notFound();

  const texto = await readFile(
    path.join(process.cwd(), "src/contenido/legal", `${doc.archivo}.md`),
    "utf8"
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4 pb-12">
      <Link
        href="/legal"
        aria-label="Volver a Legal"
        className="flex size-11 items-center justify-center self-start rounded-full border border-border bg-surface text-ink"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <Markdown texto={texto} />
    </div>
  );
}
