import { Seguimiento } from "@/features/pedidos/seguimiento";

export const metadata = { title: "Tu pedido — Pídelo" };

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Seguimiento pedidoId={id} />;
}
