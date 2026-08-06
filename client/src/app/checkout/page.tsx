import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { Checkout } from "@/features/catalogo/checkout";

export const metadata = { title: "Confirma tu pedido — Pídelo" };

export default function CheckoutPage() {
  return (
    <ExigirCliente>
      <Checkout />
    </ExigirCliente>
  );
}
