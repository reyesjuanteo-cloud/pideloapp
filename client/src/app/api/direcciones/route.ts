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

// --- Google Geocoding: se usa solo si hay llave configurada ---
type ResultadoGoogle = {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  address_components: { long_name: string; types: string[] }[];
};

function aLugarGoogle(r: ResultadoGoogle): Lugar {
  const parte = (tipo: string) =>
    r.address_components.find((c) => c.types.includes(tipo))?.long_name ?? "";
  const via = parte("route");
  const numero = parte("street_number");
  return {
    texto: via ? (numero ? `${via} #${numero}` : via) : r.formatted_address.split(",")[0],
    barrio: parte("sublocality") || parte("neighborhood"),
    ciudad: parte("locality") || parte("administrative_area_level_2") || "Girardot",
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
  };
}

async function conGoogle(
  params: string
): Promise<ResultadoGoogle[] | null> {
  const llave = process.env.GOOGLE_MAPS_LLAVE;
  if (!llave) return null;
  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}&language=es&region=co&key=${llave}`,
      { next: { revalidate: 60 } }
    );
    if (!r.ok) return null;
    const datos = await r.json();
    if (datos.status !== "OK") return null;
    return datos.results as ResultadoGoogle[];
  } catch {
    return null;
  }
}

export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const q = url.searchParams.get("q");

  try {
    // Google primero cuando está configurado: resuelve mejor las direcciones
    // colombianas. Si no hay llave o falla, sigue Photon.
    if (lat && lng) {
      const google = await conGoogle(`latlng=${lat},${lng}`);
      if (google?.length) {
        return NextResponse.json({
          ...aLugarGoogle(google[0]),
          lat: Number(lat),
          lng: Number(lng),
        });
      }
    } else if (q && q.trim().length >= 3) {
      const google = await conGoogle(
        `address=${encodeURIComponent(q + ", Girardot, Cundinamarca, Colombia")}` +
          `&bounds=4.24,-74.88|4.36,-74.72`
      );
      if (google?.length) {
        const municipios = ["girardot", "ricaurte", "flandes"];
        const lugares = google
          .map(aLugarGoogle)
          .filter((l) => municipios.includes(l.ciudad.toLowerCase()))
          .slice(0, 6);
        if (lugares.length) return NextResponse.json(lugares);
      }
    }

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
