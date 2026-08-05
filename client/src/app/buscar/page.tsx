import { Buscar } from "@/features/home/buscar";

export const metadata = { title: "Buscar — Pídelo" };

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  return <Buscar categoriaInicial={categoria} />;
}
