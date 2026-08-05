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
    </AuthCard>
  );
}
