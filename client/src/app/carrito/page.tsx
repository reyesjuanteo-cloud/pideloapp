import { ExigirCliente } from "@/features/onboarding/exigir-cliente";
import { PantallaCarrito } from "@/features/catalogo/pantalla-carrito";

export const metadata = { title: "Tu carrito — Pídelo" };

export default function CarritoPage() {
  return (
    <ExigirCliente>
      <PantallaCarrito />
    </ExigirCliente>
  );
}
