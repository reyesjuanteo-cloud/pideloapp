import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { PedidoLibre } from "@/features/pedidos/pedido-libre";

export const metadata = { title: "Pide lo que sea — Pídelo" };

export default function PedidoLibrePage() {
  return (
    <ExigirCliente>
      <PedidoLibre />
    </ExigirCliente>
  );
}
