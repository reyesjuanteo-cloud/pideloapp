import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { HomeCliente } from "@/features/home/home";

export const metadata = { title: "Inicio — Pídelo" };

export default function HomePage() {
  return (
    <ExigirCliente>
      <HomeCliente />
    </ExigirCliente>
  );
}
