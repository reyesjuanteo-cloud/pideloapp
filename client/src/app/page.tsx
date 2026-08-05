import { Landing } from "@/features/landing/landing";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 size-96 rounded-full bg-accent/15 blur-3xl"
      />
      <Landing />
    </div>
  );
}
