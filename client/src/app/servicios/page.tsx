import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { PedirServicio } from "@/features/servicios/pedir-servicio";

export const metadata = { title: "Pide un servicio — Pídelo" };

export default function ServiciosPage() {
  return (
    <ExigirCliente>
      <PedirServicio />
    </ExigirCliente>
  );
}
