import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { Pedidos } from "@/features/home/pedidos";

export const metadata = { title: "Tus pedidos — Pídelo" };

export default function PedidosPage() {
  return (
    <ExigirCliente>
      <Pedidos />
    </ExigirCliente>
  );
}
