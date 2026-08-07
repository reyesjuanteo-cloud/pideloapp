import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { PedirServicio } from "@/features/servicios/pedir-servicio";

export const metadata = { title: "Pide lo que sea — Pídelo" };

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  return (
    <ExigirCliente>
      <PedirServicio categoriaInicial={categoria} />
    </ExigirCliente>
  );
}
