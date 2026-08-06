"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Cámara con guía de encuadre para fotografiar un documento: el aspirante
// alinea la cédula dentro del marco y toma la foto ahí mismo, sin salir a la
// galería del teléfono.
export function CamaraDocumento({
  titulo,
  instruccion,
  frontal = false,
  onTomar,
  onCerrar,
}: {
  titulo: string;
  instruccion: string;
  frontal?: boolean;
  onTomar: (foto: File) => void;
  onCerrar: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const capturaRef = useRef<File | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let activo = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: frontal ? "user" : { ideal: "environment" },
            width: { ideal: 1600 },
          },
        });
        if (!activo || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setListo(true);
      } catch (e) {
        setError(
          e instanceof Error && e.name === "NotAllowedError"
            ? "Permite el acceso a la cámara para tomar la foto."
            : "No pudimos abrir la cámara en este dispositivo."
        );
      }
    })();
    return () => {
      activo = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [frontal]);

  function tomar() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    if (frontal) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        capturaRef.current = new File([blob], "documento.jpg", { type: "image/jpeg" });
        setVista(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <div className="flex items-center justify-between p-4">
        <p className="font-display text-h3 font-semibold text-white">{titulo}</p>
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local
          <img src={vista} alt="" className="max-h-full w-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`size-full object-cover ${frontal ? "-scale-x-100" : ""}`}
            />
            {/* Marco guía */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative aspect-[1.586/1] w-[86%] rounded-xl border-2 border-accent shadow-[0_0_0_9999px_rgba(36,26,20,0.55)]">
                <span className="absolute -top-9 left-1/2 w-max -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-caption font-semibold font-body text-ink">
                  {instruccion}
                </span>
              </div>
            </div>
          </>
        )}
        {error && (
          <p className="absolute inset-x-6 bottom-10 rounded-md bg-error/90 p-3 text-center text-body font-body text-white">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 p-6">
        {vista ? (
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button
              fullWidth
              onClick={() => capturaRef.current && onTomar(capturaRef.current)}
            >
              Usar esta foto
            </Button>
            <button
              onClick={() => {
                setVista(null);
                capturaRef.current = null;
              }}
              className="flex items-center justify-center gap-1.5 text-body font-body text-white/80"
            >
              <RotateCcw className="size-4" />
              Repetir
            </button>
          </div>
        ) : (
          <button
            onClick={tomar}
            disabled={!listo}
            aria-label="Tomar foto"
            className="flex size-18 items-center justify-center rounded-full border-4 border-white/40 bg-white text-ink disabled:opacity-40"
          >
            <Camera className="size-7" />
          </button>
        )}
      </div>
    </div>
  );
}
