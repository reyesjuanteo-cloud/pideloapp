import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { Perfil } from "@/features/home/perfil";

export const metadata = { title: "Tu perfil — Pídelo" };

export default function PerfilPage() {
  return (
    <ExigirCliente>
      <Perfil />
    </ExigirCliente>
  );
}
