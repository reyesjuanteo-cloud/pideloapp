import Link from "next/link";
import { AuthCard } from "@/features/auth/auth-card";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "Iniciar sesión — Pídelo" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Inicia sesión"
      subtitle="Pide, sigue tu domicilio y repite tus favoritos."
      footer={
        <>
          <span className="text-muted">¿No tienes cuenta? </span>
          <Link href="/register" className="text-primary font-semibold hover:text-primary-dark">
            Regístrate
          </Link>
        </>
      }
    >
      <LoginForm />
      {/* ⚠️ TEMPORAL: quitar cuando Supabase esté configurado — ver demo-users.ts */}
      <div className="rounded-md border border-border bg-bg p-3 font-body">
        <p className="text-label font-semibold uppercase tracking-wide text-muted">
          Acceso demo (temporal)
        </p>
        <p className="mt-1.5 text-caption text-muted">
          Cliente: <span className="font-mono text-ink">cliente@pidelo.app · pidelo123</span>
        </p>
        <p className="text-caption text-muted">
          Domiciliario: <span className="font-mono text-ink">domi@pidelo.app · pidelo123</span>
        </p>
      </div>
    </AuthCard>
  );
}
