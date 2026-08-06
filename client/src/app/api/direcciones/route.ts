import { NextResponse } from "next/server";

// Geocodificación con Photon (Komoot, datos de OpenStreetMap): gratis, sin
// llave y sin los bloqueos de Nominatim, que responde 429 tanto al navegador
// como a los servidores de despliegue.
//   ?lat=&lng=   → qué dirección hay en ese punto (pin del mapa)
//   ?q=texto     → buscar una dirección escrita
const BASE = "https://photon.komoot.io";
const CENTRO = { lat: 4.295, lon: -74.796 }; // Girardot–Ricaurte–Flandes

export type Lugar = {
  texto: string;
  barrio: string;
  ciudad: string;
  lat: number;
  lng: number;
};

type PropiedadesPhoton = {
  name?: string;
  street?: string;
  housenumber?: string;
  district?: string;
  suburb?: string;
  city?: string;
  county?: string;
  type?: string;
};

type RasgoPhoton = {
  properties: PropiedadesPhoton;
  geometry: { coordinates: [number, number] };
};

function aLugar(rasgo: RasgoPhoton): Lugar {
  const p = rasgo.properties;
  const via = p.street ?? p.name ?? "Punto en el mapa";
  const texto = p.housenumber ? `${via} #${p.housenumber}` : via;
  // Photon a veces trae el nombre del sitio en `name` y la vía en `street`:
  // si son distintos, mostrar ambos ayuda a reconocer el lugar.
  const conSitio =
    p.name && p.street && p.name !== p.street ? `${p.name} · ${texto}` : texto;
  return {
    texto: conSitio,
    barrio: p.district ?? p.suburb ?? "",
    ciudad: p.city ?? p.county ?? "Girardot",
    lat: rasgo.geometry.coordinates[1],
    lng: rasgo.geometry.coordinates[0],
  };
}

export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const q = url.searchParams.get("q");

  try {
    if (lat && lng) {
      const r = await fetch(`${BASE}/reverse?lat=${lat}&lon=${lng}`, {
        next: { revalidate: 60 },
      });
      if (!r.ok) return NextResponse.json({ error: "sin_respuesta" }, { status: 502 });
      const datos = (await r.json()) as { features: RasgoPhoton[] };
      const rasgo = datos.features?.[0];
      if (!rasgo) return NextResponse.json({ error: "sin_resultados" }, { status: 404 });
      // El pin manda: se conservan las coordenadas exactas del usuario.
      return NextResponse.json({
        ...aLugar(rasgo),
        lat: Number(lat),
        lng: Number(lng),
      });
    }

    if (q && q.trim().length >= 3) {
      const r = await fetch(
        `${BASE}/api?q=${encodeURIComponent(q)}&lat=${CENTRO.lat}&lon=${CENTRO.lon}&limit=8`,
        { next: { revalidate: 60 } }
      );
      if (!r.ok) return NextResponse.json({ error: "sin_respuesta" }, { status: 502 });
      const datos = (await r.json()) as { features: RasgoPhoton[] };
      // Solo resultados de la zona de operación.
      const municipios = ["girardot", "ricaurte", "flandes"];
      const lugares = (datos.features ?? [])
        .map(aLugar)
        .filter((l) => municipios.includes(l.ciudad.toLowerCase()))
        .slice(0, 6);
      return NextResponse.json(lugares);
    }

    return NextResponse.json({ error: "parametros" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "fallo" }, { status: 502 });
  }
}
