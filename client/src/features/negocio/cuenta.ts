"use server";

// Cuenta del negocio: entra con su NIT o cédula y una clave, igual que el
// mensajero. El documento se convierte en un correo interno para usar la
// autenticación de Supabase sin inventar un sistema de contraseñas propio.
import { clienteAdmin } from "@/lib/supabase/admin";

const DOMINIO_INTERNO = "comercios.pidelo.app";

export async function correoInternoNegocio(documento: string): Promise<string> {
  return `${documento.trim()}@${DOMINIO_INTERNO}`;
}

export async function crearCuentaNegocio(
  documento: string,
  clave: string
): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{6,15}$/.test(documento)) {
    return { ok: false, error: "Escribe tu NIT o cédula sin puntos ni guiones." };
  }
  if (clave.length < 6) {
    return { ok: false, error: "La clave debe tener al menos 6 caracteres." };
  }

  const { error } = await clienteAdmin().auth.admin.createUser({
    email: await correoInternoNegocio(documento),
    password: clave,
    email_confirm: true,
  });

  if (error) {
    const yaExiste = /already|registered/i.test(error.message);
    return {
      ok: false,
      error: yaExiste
        ? "Ya hay una cuenta con ese documento. Inicia sesión con tu clave."
        : "No pudimos crear tu cuenta. Inténtalo de nuevo.",
    };
  }
  return { ok: true };
}
