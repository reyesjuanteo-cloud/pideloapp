"use client";

import { Circle } from "lucide-react";

export function AvailabilityToggle({
  available,
  onToggle,
}: {
  available: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold font-body transition-colors duration-300 ease-in-out ${
        available
          ? "border-success bg-success/10 text-success"
          : "border-border bg-surface text-muted"
      }`}
    >
      <Circle className={`size-2.5 ${available ? "fill-success" : "fill-muted"}`} />
      {available ? "Disponible" : "No disponible"}
    </button>
  );
}
