"use server";

// Cuenta del mensajero: entra con cédula y clave.
//
// La cédula se convierte en un correo interno determinista para usar la
// autenticación de Supabase sin inventar un sistema de contraseñas propio.
// El correo real del mensajero vive en `perfiles.correo` y sirve para
// notificarle; este otro solo es su usuario dentro del sistema.
import { clienteAdmin } from "@/lib/supabase/admin";

const DOMINIO_INTERNO = "mensajeros.pidelo.app";

export async function correoInterno(cedula: string): Promise<string> {
  return `${cedula.trim()}@${DOMINIO_INTERNO}`;
}

export async function crearCuentaMensajero(
  cedula: string,
  clave: string
): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{6,10}$/.test(cedula)) return { ok: false, error: "Cédula inválida." };
  if (clave.length < 6) {
    return { ok: false, error: "La clave debe tener al menos 6 caracteres." };
  }

  const admin = clienteAdmin();
  const correo = await correoInterno(cedula);
  const { error } = await admin.auth.admin.createUser({
    email: correo,
    password: clave,
    email_confirm: true, // es un usuario interno: no hay correo que confirmar
  });

  if (error) {
    const yaExiste =
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered");
    return {
      ok: false,
      error: yaExiste
        ? "Ya hay una cuenta con esa cédula. Inicia sesión con tu clave."
        : "No pudimos crear tu cuenta. Inténtalo de nuevo.",
    };
  }
  return { ok: true };
}
