import { redirect } from "next/navigation";

// El mandado de precio fijo se unificó con la subasta: ahora el cliente
// propone y los domiciliarios se postulan con su precio.
export default function MandadoPage() {
  redirect("/servicios?categoria=Mandados y domicilios");
}
