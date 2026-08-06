"use client";

// Verificación facial en el dispositivo (nada sale del celular, solo el
// resultado). Pipeline: cámara → detección y movimientos (parpadeo + giro)
// → anti-spoofing (¿foto o pantalla?) → comparación de embeddings contra la
// foto de la cédula → puntuación de confianza.
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cargarMotorFacial, configMotor } from "./motor-facial";
import type { ResultadoVerificacion } from "./tipos";

type Paso = "cargando" | "buscando" | "parpadeo" | "giro" | "analizando" | "listo" | "error";

const instrucciones: Record<Paso, string> = {
  cargando: "Preparando la cámara y los modelos…",
  buscando: "Ubica tu rostro dentro del círculo",
  parpadeo: "Parpadea dos veces",
  giro: "Gira la cabeza a un lado y vuelve al centro",
  analizando: "Analizando…",
  listo: "Verificación completada",
  error: "No se pudo completar la verificación",
};

export function VerificacionFacial({
  fotoCedula,
  onCompletar,
  onCerrar,
}: {
  fotoCedula: File;
  onCompletar: (resultado: ResultadoVerificacion, captura: Blob) => void;
  onCerrar: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paso, setPaso] = useState<Paso>("cargando");
  const [detalleError, setDetalleError] = useState("");
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [atascado, setAtascado] = useState(false);
  const capturaRef = useRef<Blob | null>(null);

  // Si los gestos no se detectan (poca luz, cámara de gama baja), no dejar al
  // aspirante encerrado: a los 40 s se ofrece continuar con revisión manual.
  useEffect(() => {
    if (paso === "listo" || paso === "error") return;
    const t = setTimeout(() => setAtascado(true), 40000);
    return () => clearTimeout(t);
  }, [paso]);

  useEffect(() => {
    let activo = true;
    let stream: MediaStream | null = null;
    // El bundle ESM de navegador no expone tipos utilizables aquí.
    let humano: import("@vladmandic/human").default | null = null;

    async function iniciar() {
      try {
        const Human = await cargarMotorFacial();
        humano = new Human(configMotor(true));
        await humano.load();

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 640 },
        });
        if (!activo || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setPaso("buscando");

        let parpadeos = 0;
        let giro = false;
        let parpadeoPrevio = false;
        let estable = 0;

        const bucle = async () => {
          if (!activo || !videoRef.current) return;
          const res = await humano!.detect(videoRef.current);
          const cara = res.face?.[0];
          const gestos: string[] = (res.gesture ?? []).map((g) => String(g.gesture));

          if (cara && cara.box) {
            const [, , w] = [cara.box[0], cara.box[1], cara.box[2]];
            const proporcion = w / (videoRef.current.videoWidth || 640);
            const parpadeando = gestos.some((g) => g.includes("blink"));
            const girado = gestos.some((g) => g === "facing left" || g === "facing right");
            const centrado = gestos.some((g) => g === "facing center") || !girado;

            setPaso((actual) => {
              if (actual === "buscando") {
                if (proporcion > 0.22) {
                  estable += 1;
                  if (estable > 8) return "parpadeo";
                } else estable = 0;
                return actual;
              }
              if (actual === "parpadeo") {
                if (parpadeando && !parpadeoPrevio) parpadeos += 1;
                parpadeoPrevio = parpadeando;
                if (parpadeos >= 2) return "giro";
                return actual;
              }
              if (actual === "giro") {
                if (girado) giro = true;
                if (giro && centrado && !parpadeando) return "analizando";
                return actual;
              }
              return actual;
            });
          }
          requestAnimationFrame(() => void bucle());
        };
        void bucle();

        // Cuando el paso llegue a "analizando", el efecto de abajo captura.
      } catch (e) {
        console.error("verificacion facial:", e);
        if (activo) {
          setDetalleError(
            e instanceof Error && e.name === "NotAllowedError"
              ? "Permite el acceso a la cámara para continuar."
              : "Tu navegador no pudo iniciar la verificación."
          );
          setPaso("error");
        }
      }
    }

    void iniciar();
    return () => {
      activo = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Captura y análisis final al llegar a "analizando"
  useEffect(() => {
    if (paso !== "analizando" || !videoRef.current) return;
    let cancelado = false;

    async function analizar() {
      try {
        const Human = await cargarMotorFacial();
        const humano = new Human(configMotor(false));
        await humano.load();

        // 1. Rostro en vivo
        const video = videoRef.current!;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        const captura: Blob = await new Promise((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error("captura"))), "image/jpeg", 0.85)
        );
        const vivo = await humano.detect(canvas);
        const caraViva = vivo.face?.[0];

        // 2. Rostro del documento
        const imgCedula = new Image();
        imgCedula.src = URL.createObjectURL(fotoCedula);
        await imgCedula.decode();
        const doc = await humano.detect(imgCedula);
        const caraDoc = doc.face?.[0];

        // 3. Comparación de embeddings + puntuación
        const similitud =
          caraViva?.embedding && caraDoc?.embedding
            ? humano.match.similarity(caraViva.embedding, caraDoc.embedding)
            : null;

        const r: ResultadoVerificacion = {
          similitud: similitud !== null ? Math.round(similitud * 100) / 100 : null,
          antispoof: caraViva?.real !== undefined ? Math.round(caraViva.real * 100) / 100 : null,
          vivacidad: caraViva?.live !== undefined ? Math.round(caraViva.live * 100) / 100 : null,
          rostroEnCedula: Boolean(caraDoc),
          fecha: new Date().toISOString(),
        };
        if (cancelado) return;
        capturaRef.current = captura;
        setResultado(r);
        setPaso("listo");
      } catch {
        if (!cancelado) {
          setDetalleError("El análisis falló. Inténtalo de nuevo con buena luz.");
          setPaso("error");
        }
      }
    }

    void analizar();
    return () => {
      cancelado = true;
    };
  }, [paso, fotoCedula]);

  const completado = ["parpadeo", "giro", "analizando", "listo"].indexOf(paso);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/95 px-6">
      <button
        onClick={onCerrar}
        aria-label="Cerrar"
        className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <X className="size-5" />
      </button>

      <div className="relative size-72 overflow-hidden rounded-full border-4 border-accent">
        <video ref={videoRef} playsInline muted className="size-full -scale-x-100 object-cover" />
      </div>

      <p className="text-center font-display text-h3 font-semibold text-white">
        {instrucciones[paso]}
      </p>
      {paso === "error" && (
        <p className="text-center text-caption font-body text-white/70">{detalleError}</p>
      )}

      <div className="flex items-center gap-3 text-caption font-body text-white/70">
        {["Rostro", "Parpadeo", "Giro"].map((etiqueta, i) => (
          <span key={etiqueta} className="flex items-center gap-1">
            <CheckCircle2
              className={`size-4 ${completado > i ? "text-success" : "text-white/30"}`}
            />
            {etiqueta}
          </span>
        ))}
      </div>

      {paso === "listo" && resultado && (
        <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg bg-white/10 p-4 text-body font-body text-white">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-success" />
            Resultado
          </p>
          <p className="flex justify-between">
            <span>Similitud con cédula</span>
            <span className="font-semibold">
              {resultado.similitud !== null ? `${Math.round(resultado.similitud * 100)}%` : "—"}
            </span>
          </p>
          <p className="flex justify-between">
            <span>Anti-spoofing</span>
            <span className="font-semibold">
              {resultado.antispoof !== null ? `${Math.round(resultado.antispoof * 100)}%` : "—"}
            </span>
          </p>
          <Button
            fullWidth
            onClick={() => onCompletar(resultado, capturaRef.current!)}
            className="mt-2"
          >
            Continuar
          </Button>
        </div>
      )}

      {(paso === "error" || (atascado && paso !== "listo")) && (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() =>
              onCompletar(
                {
                  similitud: null,
                  antispoof: null,
                  vivacidad: null,
                  rostroEnCedula: false,
                  fecha: new Date().toISOString(),
                  revisionManual: true,
                },
                capturaRef.current ?? new Blob()
              )
            }
          >
            Continuar y que el equipo revise mis fotos
          </Button>
          <button onClick={onCerrar} className="text-caption font-body text-white/70">
            Volver e intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
