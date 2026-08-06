"use client";

// Llamada de voz dentro de la app (WebRTC). El audio viaja directo entre los
// dos celulares; Supabase Realtime solo se usa para que se pongan de acuerdo
// (señalización). Así nadie necesita conocer el número del otro.
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/cliente";

export type EstadoLlamada =
  | "inactiva"
  | "llamando" // yo llamo y espero que contesten
  | "entrante" // me están llamando
  | "conectando"
  | "en_curso"
  | "error";

const SERVIDORES: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

type Senal =
  | { tipo: "oferta"; de: string; sdp: RTCSessionDescriptionInit }
  | { tipo: "respuesta"; de: string; sdp: RTCSessionDescriptionInit }
  | { tipo: "ice"; de: string; candidato: RTCIceCandidateInit }
  | { tipo: "colgar"; de: string };

export function useLlamada(pedidoId: string, yoId: string | null) {
  const [estado, setEstado] = useState<EstadoLlamada>("inactiva");
  const [mudo, setMudo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [detalle, setDetalle] = useState<string | null>(null);

  const canalRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ofertaPendiente = useRef<RTCSessionDescriptionInit | null>(null);
  const iceEnEspera = useRef<RTCIceCandidateInit[]>([]);

  const limpiar = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    ofertaPendiente.current = null;
    iceEnEspera.current = [];
    setSegundos(0);
    setMudo(false);
  }, []);

  const enviar = useCallback((senal: Senal) => {
    void canalRef.current?.send({ type: "broadcast", event: "senal", payload: senal });
  }, []);

  const colgar = useCallback(() => {
    if (yoId) enviar({ tipo: "colgar", de: yoId });
    limpiar();
    setEstado("inactiva");
    setDetalle(null);
  }, [enviar, limpiar, yoId]);

  // Prepara la conexión: micrófono, envío de audio y candidatos de red.
  const crearConexion = useCallback(async () => {
    const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    localRef.current = flujo;
    const pc = new RTCPeerConnection(SERVIDORES);
    flujo.getTracks().forEach((t) => pc.addTrack(t, flujo));

    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
        void audioRef.current.play();
      }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && yoId) {
        enviar({ tipo: "ice", de: yoId, candidato: e.candidate.toJSON() });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setEstado("en_curso");
      if (pc.connectionState === "failed") {
        setDetalle("No se pudo establecer la llamada. Intenta de nuevo.");
        limpiar();
        setEstado("error");
      }
      if (pc.connectionState === "disconnected") {
        limpiar();
        setEstado("inactiva");
      }
    };
    pcRef.current = pc;
    return pc;
  }, [enviar, limpiar, yoId]);

  // Canal de señalización del pedido
  useEffect(() => {
    if (!yoId) return;
    const sb = supabase();
    const canal = sb.channel(`llamada-${pedidoId}`, { config: { broadcast: { self: false } } });

    canal.on("broadcast", { event: "senal" }, async ({ payload }) => {
      const senal = payload as Senal;
      if (senal.de === yoId) return;

      if (senal.tipo === "oferta") {
        ofertaPendiente.current = senal.sdp;
        setEstado("entrante");
      } else if (senal.tipo === "respuesta") {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(senal.sdp));
        iceEnEspera.current.forEach((c) => void pc.addIceCandidate(new RTCIceCandidate(c)));
        iceEnEspera.current = [];
        setEstado("conectando");
      } else if (senal.tipo === "ice") {
        const pc = pcRef.current;
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(senal.candidato));
        } else {
          iceEnEspera.current.push(senal.candidato);
        }
      } else if (senal.tipo === "colgar") {
        limpiar();
        setEstado("inactiva");
      }
    });

    void canal.subscribe();
    canalRef.current = canal;
    return () => {
      limpiar();
      void sb.removeChannel(canal);
      canalRef.current = null;
    };
  }, [pedidoId, yoId, limpiar]);

  // Cronómetro de la llamada
  useEffect(() => {
    if (estado !== "en_curso") return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [estado]);

  const llamar = useCallback(async () => {
    if (!yoId) return;
    setDetalle(null);
    try {
      setEstado("llamando");
      const pc = await crearConexion();
      const oferta = await pc.createOffer();
      await pc.setLocalDescription(oferta);
      enviar({ tipo: "oferta", de: yoId, sdp: oferta });
    } catch {
      setDetalle("Permite el micrófono para llamar.");
      limpiar();
      setEstado("error");
    }
  }, [crearConexion, enviar, limpiar, yoId]);

  const aceptar = useCallback(async () => {
    if (!yoId || !ofertaPendiente.current) return;
    try {
      setEstado("conectando");
      const pc = await crearConexion();
      await pc.setRemoteDescription(new RTCSessionDescription(ofertaPendiente.current));
      iceEnEspera.current.forEach((c) => void pc.addIceCandidate(new RTCIceCandidate(c)));
      iceEnEspera.current = [];
      const respuesta = await pc.createAnswer();
      await pc.setLocalDescription(respuesta);
      enviar({ tipo: "respuesta", de: yoId, sdp: respuesta });
    } catch {
      setDetalle("Permite el micrófono para contestar.");
      limpiar();
      setEstado("error");
    }
  }, [crearConexion, enviar, limpiar, yoId]);

  const alternarMudo = useCallback(() => {
    const pista = localRef.current?.getAudioTracks()[0];
    if (!pista) return;
    pista.enabled = !pista.enabled;
    setMudo(!pista.enabled);
  }, []);

  return {
    estado,
    detalle,
    mudo,
    segundos,
    audioRef,
    llamar,
    aceptar,
    colgar,
    alternarMudo,
  };
}
