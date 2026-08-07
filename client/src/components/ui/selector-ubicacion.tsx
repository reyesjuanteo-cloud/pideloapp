"use client";

// Selector de ubicación con dirección escrita Y pin en el mapa.
//
// Regla de la casa: cuando ambos existen, MANDA EL PIN — es lo que la persona
// confirmó con sus ojos sobre el mapa. La dirección escrita sirve para llegar
// rápido a la zona y como texto legible; si lo que se escribió y lo que hay
// bajo el pin no se parecen, se avisa en vez de fijar en silencio una de las
// dos. Reutilizable: registro de negocios, de proveedores y solicitudes.
import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { CENTRO_ZONA, MapaBase } from "@/components/ui/mapa-base";

export type UbicacionElegida = {
  direccion: string; // texto que ve el mensajero/proveedor
  barrio: string;
  ciudad: string;
  lat: number;
  lng: number;
};

type Lugar = {
  texto: string;
  barrio: string;
  ciudad: string;
  lat: number;
  lng: number;
};

// Similitud tolerante para direcciones colombianas: normaliza abreviaturas
// (cra/kr/carrera, cl/calle) y compara los números, que son lo que importa.
// "Carrera 10 #15-20" ≈ "Cra 10 #15 20" → coinciden.
function numerosDe(texto: string): string[] {
  return texto.toLowerCase().match(/\d+/g) ?? [];
}

function viaDe(texto: string): string {
  const t = texto.toLowerCase();
  if (/\b(carrera|cra|kr|kra)\b/.test(t)) return "carrera";
  if (/\b(calle|cl|cll)\b/.test(t)) return "calle";
  if (/\b(diagonal|dg)\b/.test(t)) return "diagonal";
  if (/\b(transversal|tv|trans)\b/.test(t)) return "transversal";
  return "";
}

export function direccionesParecidas(a: string, b: string): boolean {
  const numsA = numerosDe(a);
  const numsB = numerosDe(b);
  if (numsA.length === 0 || numsB.length === 0) return true; // nada que comparar
  const viaIgual = !viaDe(a) || !viaDe(b) || viaDe(a) === viaDe(b);
  // La vía principal (primer número) debe coincidir; con eso basta para saber
  // que hablan de la misma calle.
  return viaIgual && numsA[0] === numsB[0];
}

export function SelectorUbicacion({
  etiqueta = "Dirección",
  ayuda,
  onElegir,
}: {
  etiqueta?: string;
  ayuda?: string;
  onElegir: (ubicacion: UbicacionElegida | null) => void;
}) {
  const [escrita, setEscrita] = useState("");
  const [sugerencias, setSugerencias] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [centro, setCentro] = useState<[number, number]>(CENTRO_ZONA);
  const [bajoPin, setBajoPin] = useState<Lugar | null>(null);
  const [pinMovido, setPinMovido] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onElegirRef = useRef(onElegir);

  useEffect(() => {
    onElegirRef.current = onElegir;
  }, [onElegir]);

  // Lo elegido: SIEMPRE las coordenadas del pin. El texto es la dirección
  // escrita si se parece a lo que hay bajo el pin (suele ser más precisa en
  // placas); si no se parece o no hay escrita, el texto del pin.
  useEffect(() => {
    if (!bajoPin) {
      onElegirRef.current(null);
      return;
    }
    const coinciden = escrita.trim().length < 5 || direccionesParecidas(escrita, bajoPin.texto);
    onElegirRef.current({
      direccion: coinciden && escrita.trim().length >= 5 ? escrita.trim() : bajoPin.texto,
      barrio: bajoPin.barrio,
      ciudad: bajoPin.ciudad,
      lat: bajoPin.lat,
      lng: bajoPin.lng,
    });
  }, [bajoPin, escrita]);

  function buscar(consulta: string) {
    setEscrita(consulta);
    if (debounce.current) clearTimeout(debounce.current);
    if (consulta.trim().length < 4) {
      setSugerencias([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/direcciones?q=${encodeURIComponent(consulta)}`);
        const lugares = r.ok ? await r.json() : [];
        setSugerencias(Array.isArray(lugares) ? lugares.slice(0, 4) : []);
      } catch {
        setSugerencias([]);
      } finally {
        setBuscando(false);
      }
    }, 450);
  }

  async function alMoverse(nuevoCentro: [number, number]) {
    setPinMovido(true);
    try {
      const r = await fetch(
        `/api/direcciones?lat=${nuevoCentro[1]}&lng=${nuevoCentro[0]}`
      );
      if (r.ok) setBajoPin(await r.json());
    } catch {
      // Sin conexión: se conservan las coordenadas aunque falte el texto.
      setBajoPin({
        texto: "Punto en el mapa",
        barrio: "",
        ciudad: "Girardot",
        lat: nuevoCentro[1],
        lng: nuevoCentro[0],
      });
    }
  }

  const discrepan =
    pinMovido &&
    bajoPin !== null &&
    escrita.trim().length >= 5 &&
    !direccionesParecidas(escrita, bajoPin.texto);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-label font-semibold uppercase tracking-wide text-muted font-body">
        {etiqueta}
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          placeholder="Carrera 10 #15-20"
          value={escrita}
          onChange={(e) => buscar(e.target.value)}
          className="min-h-12 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-body font-body text-ink placeholder:text-muted transition-colors duration-300 ease-in-out focus:outline-none focus:border-primary"
        />
      </div>

      {sugerencias.length > 0 && (
        <div className="flex flex-col rounded-md border border-border bg-surface">
          {sugerencias.map((lugar, i) => (
            <button
              key={`${lugar.lat}-${lugar.lng}`}
              type="button"
              onClick={() => {
                setEscrita(lugar.texto);
                setSugerencias([]);
                setCentro([lugar.lng, lugar.lat]);
                setBajoPin(lugar);
              }}
              className={`flex items-center gap-2 p-2.5 text-left hover:bg-bg ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <MapPin className="size-3.5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-body font-body text-ink">
                  {lugar.texto}
                </span>
                <span className="block text-caption font-body text-muted">
                  {lugar.barrio ? `${lugar.barrio} · ` : ""}
                  {lugar.ciudad}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {buscando && (
        <p className="text-caption font-body text-muted">Buscando direcciones…</p>
      )}

      {/* Mapa con pin fijo al centro: se arrastra el mapa, no el pin */}
      <div className="relative h-52 overflow-hidden rounded-lg border border-border">
        <MapaBase
          centro={centro}
          zoom={16}
          onMoveEnd={alMoverse}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <MapPin className="size-8 fill-primary text-primary-dark drop-shadow" />
        </div>
      </div>

      {bajoPin && (
        <p className="text-caption font-body text-muted">
          El pin marca:{" "}
          <span className="font-semibold text-ink">{bajoPin.texto}</span>
          {bajoPin.barrio ? ` · ${bajoPin.barrio}` : ""} · {bajoPin.ciudad}
        </p>
      )}

      {discrepan && (
        <p className="rounded-md bg-accent/10 p-2.5 text-caption font-body text-accent-deep">
          Lo que escribiste y el punto del mapa no parecen coincidir. Se usará la
          ubicación del pin — muévelo si no es el lugar correcto.
        </p>
      )}

      {ayuda && <p className="text-caption font-body text-muted">{ayuda}</p>}
    </div>
  );
}
