"use client";

// Carga el motor facial como script autohospedado (public/motor/human.js).
// Se evita el empaquetador a propósito: la librería trae su propio TensorFlow
// para navegador y su build de Node rompe la compilación del servidor.
import type Human from "@vladmandic/human";

type ConstructorHuman = new (config: object) => Human;

// El bundle IIFE expone el módulo completo en window.Human; el constructor
// viene en su propiedad `default` (o `Human`).
type ModuloHuman =
  | ConstructorHuman
  | { default?: ConstructorHuman; Human?: ConstructorHuman };

declare global {
  interface Window {
    Human?: ModuloHuman;
  }
}

function extraerConstructor(modulo: ModuloHuman): ConstructorHuman | null {
  if (typeof modulo === "function") return modulo;
  return modulo.default ?? modulo.Human ?? null;
}

let promesa: Promise<ConstructorHuman> | null = null;

export function cargarMotorFacial(): Promise<ConstructorHuman> {
  if (promesa) return promesa;
  promesa = new Promise((resolver, rechazar) => {
    const yaCargado = window.Human && extraerConstructor(window.Human);
    if (yaCargado) {
      resolver(yaCargado);
      return;
    }
    const script = document.createElement("script");
    script.src = "/motor/human.js";
    script.async = true;
    script.onload = () => {
      const constructor = window.Human ? extraerConstructor(window.Human) : null;
      if (constructor) resolver(constructor);
      else rechazar(new Error("El motor facial no quedó disponible"));
    };
    script.onerror = () => rechazar(new Error("No se pudo cargar el motor facial"));
    document.head.appendChild(script);
  });
  return promesa;
}

// Configuración común: solo los módulos de rostro que necesitamos.
export function configMotor(conGestos: boolean) {
  return {
    modelBasePath: "/modelos",
    face: {
      enabled: true,
      detector: { rotation: false, maxDetected: 1 },
      mesh: { enabled: true },
      iris: { enabled: conGestos },
      description: { enabled: true },
      antispoof: { enabled: true },
      liveness: { enabled: true },
      emotion: { enabled: false },
    },
    body: { enabled: false },
    hand: { enabled: false },
    object: { enabled: false },
    gesture: { enabled: conGestos },
    filter: { enabled: false },
  };
}
