import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { Buscar } from "@/features/home/buscar";

export const metadata = { title: "Buscar — Pídelo" };

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  return (
    <ExigirCliente>
      <Buscar categoriaInicial={categoria} />
    </ExigirCliente>
  );
}
