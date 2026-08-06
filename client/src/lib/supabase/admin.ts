// Cliente con la llave secreta — SOLO para server actions. Salta RLS.
// Nunca importar desde componentes de cliente.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function clienteAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export function claveAdminValida(clave: string): boolean {
  return clave === process.env.ADMIN_CLAVE;
}
