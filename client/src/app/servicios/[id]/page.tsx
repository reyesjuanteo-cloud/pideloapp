import { SeguimientoServicio } from "@/features/servicios/seguimiento-servicio";

export const metadata = { title: "Tu servicio — Pídelo" };

export default async function ServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SeguimientoServicio solicitudId={id} />;
}
