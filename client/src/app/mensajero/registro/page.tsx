import { redirect } from "next/navigation";

// El registro de mensajeros se unificó: una sola puerta para trabajar con
// Pídelo (domicilios, mandados y servicios), con verificación de identidad.
export default function RegistroMensajeroPage() {
  redirect("/proveedor/registro");
}
