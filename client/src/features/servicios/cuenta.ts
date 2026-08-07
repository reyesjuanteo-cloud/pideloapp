"use server";

// Cuenta del proveedor de servicios: cédula + clave, igual que mensajeros y
// negocios, sobre la autenticación de Supabase con un correo interno.
import { clienteAdmin } from "@/lib/supabase/admin";

const DOMINIO_INTERNO = "proveedores.pidelo.app";

export async function correoInternoProveedor(cedula: string): Promise<string> {
  return `${cedula.trim()}@${DOMINIO_INTERNO}`;
}

export async function crearCuentaProveedor(
  cedula: string,
  clave: string
): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{6,15}$/.test(cedula)) {
    return { ok: false, error: "Escribe tu cédula sin puntos ni guiones." };
  }
  if (clave.length < 6) {
    return { ok: false, error: "La clave debe tener al menos 6 caracteres." };
  }
  const { error } = await clienteAdmin().auth.admin.createUser({
    email: await correoInternoProveedor(cedula),
    password: clave,
    email_confirm: true,
  });
  if (error) {
    const yaExiste = /already|registered/i.test(error.message);
    return {
      ok: false,
      error: yaExiste
        ? "Ya hay una cuenta con esa cédula. Inicia sesión con tu clave."
        : "No pudimos crear tu cuenta. Inténtalo de nuevo.",
    };
  }
  return { ok: true };
}
