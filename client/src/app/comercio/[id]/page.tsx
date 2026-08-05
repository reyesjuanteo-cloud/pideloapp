import { notFound } from "next/navigation";
import { mockComercios } from "@/features/customer/mock-comercios";
import { FichaComercio } from "@/features/catalogo/comercio";

export default async function ComercioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comercio = mockComercios.find((c) => c.id === id);
  if (!comercio) notFound();
  return <FichaComercio comercio={comercio} />;
}
