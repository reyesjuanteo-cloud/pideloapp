import { Landing } from "@/features/landing/landing";

export const metadata = { title: "Bienvenido — Pídelo" };

export default function BienvenidaPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg px-6 py-10">
      <Landing />
    </main>
  );
}
