// ⚠️ TEMPORAL: credenciales de desarrollo mientras se configura Supabase.
// Eliminar este archivo (y su uso en actions.ts) cuando el login real esté activo.
export const DEMO_USERS = [
  {
    email: "cliente@pidelo.app",
    password: "pidelo123",
    role: "cliente",
    home: "/customer/dashboard",
  },
  {
    email: "domi@pidelo.app",
    password: "pidelo123",
    role: "domiciliario",
    home: "/driver/dashboard",
  },
] as const;

export const DEMO_SESSION_COOKIE = "pidelo-demo-session";
