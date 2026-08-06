import { FichaComercio } from "@/features/catalogo/comercio";

export default async function ComercioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FichaComercio comercioId={id} />;
}
