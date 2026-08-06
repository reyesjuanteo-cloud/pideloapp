"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";

// Campo de foto: abre la cámara en el celular, muestra vista previa y
// entrega el archivo. La compresión ocurre al subir (comprimirImagen).
export function FotoInput({
  label,
  ayuda,
  valor,
  onChange,
  error,
}: {
  label: string;
  ayuda?: string;
  valor: File | null;
  onChange: (archivo: File | null) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [vista, setVista] = useState<string | null>(null);

  function seleccionar(archivo: File | null) {
    onChange(archivo);
    if (vista) URL.revokeObjectURL(vista);
    setVista(archivo ? URL.createObjectURL(archivo) : null);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
        {label}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => seleccionar(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex min-h-16 items-center gap-3 rounded-md border bg-surface p-3 text-left transition-colors duration-300 ease-in-out ${
          error ? "border-error" : valor ? "border-success" : "border-border"
        }`}
      >
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob), next/image no aplica
          <img src={vista} alt="" className="size-12 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Camera className="size-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-body font-body text-ink">
            {valor ? "Foto lista — toca para cambiarla" : "Tomar o elegir foto"}
          </span>
          {ayuda && <span className="block text-caption font-body text-muted">{ayuda}</span>}
        </span>
        {valor && <CheckCircle2 className="size-5 shrink-0 text-success" />}
      </button>
      {error && <p className="text-caption text-error font-body">{error}</p>}
    </div>
  );
}

// Reduce la foto a máx. 1280px y JPEG 80% — suficiente para revisión y liviano.
export async function comprimirImagen(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolver, rechazar) =>
    canvas.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error("No se pudo procesar la foto"))),
      "image/jpeg",
      0.8
    )
  );
}
