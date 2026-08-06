import { cookies } from "next/headers";
import { Splash } from "@/features/onboarding/splash";
import { DEMO_SESSION_COOKIE } from "@/features/auth/demo-users";

export const metadata = { title: "Pídelo" };

// La raíz es el splash: resuelve la sesión y ramifica (ver splash.tsx).
export default async function RaizPage() {
  const cookieStore = await cookies();
  const tieneSesion = cookieStore.has(DEMO_SESSION_COOKIE);
  return <Splash tieneSesion={tieneSesion} />;
}
