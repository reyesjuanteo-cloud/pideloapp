"use client";

// Notificaciones push del navegador: el trabajador se entera de solicitudes
// nuevas y el cliente de ofertas, aunque tengan la app cerrada.
//
// En iPhone funcionan cuando la app está instalada en la pantalla de inicio
// (iOS 16.4+) o como app nativa; en Android y computador, directo.
import { supabase } from "@/lib/supabase/cliente";

export type EstadoNotificaciones =
  | "no-soportado"
  | "pendiente"
  | "activas"
  | "bloqueadas";

export function estadoNotificaciones(): EstadoNotificaciones {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "no-soportado";
  }
  if (Notification.permission === "granted") return "activas";
  if (Notification.permission === "denied") return "bloqueadas";
  return "pendiente";
}

// Pasa la llave pública VAPID al formato que exige el navegador
function aBufferVapid(base64: string): ArrayBuffer {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  const buffer = new ArrayBuffer(crudo.length);
  const vista = new Uint8Array(buffer);
  for (let i = 0; i < crudo.length; i++) vista[i] = crudo.charCodeAt(i);
  return buffer;
}

export async function activarNotificaciones(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (estadoNotificaciones() === "no-soportado") {
    return {
      ok: false,
      error:
        "Tu navegador no soporta notificaciones. En iPhone: comparte → Agregar a inicio, y actívalas desde la app instalada.",
    };
  }
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") {
    return {
      ok: false,
      error: "Sin el permiso no podemos avisarte. Actívalo en los ajustes del navegador.",
    };
  }

  const registro = await navigator.serviceWorker.register("/sw-push.js");
  await navigator.serviceWorker.ready;
  const suscripcion =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: aBufferVapid(process.env.NEXT_PUBLIC_VAPID_PUBLICA!),
    }));

  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return { ok: false, error: "Inicia sesión primero." };

  const json = suscripcion.toJSON();
  const { error } = await sb.from("suscripciones_push").upsert({
    endpoint: suscripcion.endpoint,
    usuario_id: session.user.id,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  });
  if (error) return { ok: false, error: "No se pudo guardar la suscripción." };
  return { ok: true };
}

// Bip + vibración cuando llega algo con la app abierta (sin archivo de audio)
export function sonarAviso(): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([180, 80, 180]);
    }
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const ahora = ctx.currentTime;
    [880, 1175].forEach((frecuencia, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = frecuencia;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.001, ahora + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.3, ahora + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ahora + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ahora + i * 0.18);
      osc.stop(ahora + i * 0.18 + 0.18);
    });
  } catch {
    // Sin audio disponible: la notificación visual basta
  }
}
