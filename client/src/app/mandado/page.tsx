import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { Mandado } from "@/features/pedidos/mandado";

export const metadata = { title: "Haz un mandado — Pídelo" };

export default function MandadoPage() {
  return (
    <ExigirCliente>
      <Mandado />
    </ExigirCliente>
  );
}
