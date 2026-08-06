import { NextResponse } from "next/server";

// Direcciones de la zona (Girardot, Ricaurte, Flandes).
//   ?lat=&lng=   → qué dirección hay en ese punto (pin del mapa)
//   ?q=texto     → buscar una dirección escrita
//
// Se consulta desde el servidor, no desde el navegador: así las llaves no se
// exponen y no chocamos con los bloqueos de CORS de los proveedores.
//
// Orden de proveedores (el primero que responda gana):
//   1. Google      — si hay GOOGLE_MAPS_LLAVE
//   2. Geoapify    — si hay GEOAPIFY_LLAVE (resuelve bien el formato
//                    colombiano: "Cl 25 #8 13")
//   3. Photon      — gratis y sin llave, como último recurso

export type Lugar = {
  texto: string;
  barrio: string;
  ciudad: string;
  lat: number;
  lng: number;
};

const MUNICIPIOS = ["girardot", "ricaurte", "flandes"];
const CAJA = { oeste: -74.88, sur: 4.24, este: -74.72, norte: 4.36 };
const CENTRO = { lat: 4.295, lon: -74.796 };

function enZona(lugar: Lugar): boolean {
  return MUNICIPIOS.includes(lugar.ciudad.toLowerCase());
}

// ---------------------------------------------------------------- Geoapify
type PropiedadesGeoapify = {
  street?: string;
  housenumber?: string;
  name?: string;
  formatted?: string;
  suburb?: string;
  district?: string;
  city?: string;
  county?: string;
};

function aLugarGeoapify(p: PropiedadesGeoapify, lat: number, lon: number): Lugar {
  const via = p.street ?? p.name ?? p.formatted?.split(",")[0] ?? "Punto en el mapa";
  return {
    texto: p.housenumber ? `${via} #${p.housenumber}` : via,
    barrio: p.suburb ?? p.district ?? "",
    ciudad: p.city ?? p.county ?? "Girardot",
    lat,
    lng: lon,
  };
}

async function geoapify(
  ruta: string,
  params: string
): Promise<PropiedadesGeoapify[] | null> {
  const llave = process.env.GEOAPIFY_LLAVE;
  if (!llave) return null;
  try {
    const r = await fetch(
      `https://api.geoapify.com/v1/geocode/${ruta}?${params}&lang=es&apiKey=${llave}`,
      { next: { revalidate: 60 } }
    );
    if (!r.ok) return null;
    const datos = (await r.json()) as {
      features?: { properties: PropiedadesGeoapify }[];
    };
    return (datos.features ?? []).map((f) => f.properties);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ Google
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

async function google(params: string): Promise<ResultadoGoogle[] | null> {
  const llave = process.env.GOOGLE_MAPS_LLAVE;
  if (!llave) return null;
  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}&language=es&region=co&key=${llave}`,
      { next: { revalidate: 60 } }
    );
    if (!r.ok) return null;
    const datos = await r.json();
    return datos.status === "OK" ? (datos.results as ResultadoGoogle[]) : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ Photon
type RasgoPhoton = {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    suburb?: string;
    city?: string;
    county?: string;
  };
  geometry: { coordinates: [number, number] };
};

function aLugarPhoton(rasgo: RasgoPhoton): Lugar {
  const p = rasgo.properties;
  const via = p.street ?? p.name ?? "Punto en el mapa";
  return {
    texto: p.housenumber ? `${via} #${p.housenumber}` : via,
    barrio: p.district ?? p.suburb ?? "",
    ciudad: p.city ?? p.county ?? "Girardot",
    lat: rasgo.geometry.coordinates[1],
    lng: rasgo.geometry.coordinates[0],
  };
}

async function photon(ruta: string, params: string): Promise<RasgoPhoton[] | null> {
  try {
    const r = await fetch(`https://photon.komoot.io/${ruta}?${params}`, {
      next: { revalidate: 60 },
    });
    if (!r.ok) return null;
    const datos = (await r.json()) as { features?: RasgoPhoton[] };
    return datos.features ?? [];
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------------
export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const q = url.searchParams.get("q");

  // El pin manda: se devuelven siempre las coordenadas exactas del usuario.
  if (lat && lng) {
    const numLat = Number(lat);
    const numLng = Number(lng);

    const g = await google(`latlng=${lat},${lng}`);
    if (g?.length) {
      return NextResponse.json({ ...aLugarGoogle(g[0]), lat: numLat, lng: numLng });
    }

    const ga = await geoapify("reverse", `lat=${lat}&lon=${lng}`);
    if (ga?.length) {
      return NextResponse.json(aLugarGeoapify(ga[0], numLat, numLng));
    }

    const ph = await photon("reverse", `lat=${lat}&lon=${lng}`);
    if (ph?.length) {
      return NextResponse.json({ ...aLugarPhoton(ph[0]), lat: numLat, lng: numLng });
    }
    return NextResponse.json({ error: "sin_respuesta" }, { status: 502 });
  }

  if (q && q.trim().length >= 3) {
    const g = await google(
      `address=${encodeURIComponent(`${q}, Girardot, Cundinamarca, Colombia`)}` +
        `&bounds=${CAJA.sur},${CAJA.oeste}|${CAJA.norte},${CAJA.este}`
    );
    if (g?.length) {
      const lugares = g.map(aLugarGoogle).filter(enZona).slice(0, 6);
      if (lugares.length) return NextResponse.json(lugares);
    }

    const ga = await geoapifyConCoordenadas(q);
    if (ga?.length) return NextResponse.json(ga);

    const ph = await photon(
      "api",
      `q=${encodeURIComponent(q)}&lat=${CENTRO.lat}&lon=${CENTRO.lon}&limit=8`
    );
    if (ph?.length) {
      return NextResponse.json(ph.map(aLugarPhoton).filter(enZona).slice(0, 6));
    }
    return NextResponse.json([]);
  }

  return NextResponse.json({ error: "parametros" }, { status: 400 });
}

// Búsqueda de Geoapify conservando las coordenadas de cada resultado.
async function geoapifyConCoordenadas(q: string): Promise<Lugar[] | null> {
  const llave = process.env.GEOAPIFY_LLAVE;
  if (!llave) return null;
  try {
    const r = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}` +
        `&filter=rect:${CAJA.oeste},${CAJA.sur},${CAJA.este},${CAJA.norte}` +
        `&bias=proximity:${CENTRO.lon},${CENTRO.lat}&limit=8&lang=es&apiKey=${llave}`,
      { next: { revalidate: 60 } }
    );
    if (!r.ok) return null;
    const datos = (await r.json()) as {
      features?: {
        properties: PropiedadesGeoapify & { lat: number; lon: number };
      }[];
    };
    return (datos.features ?? [])
      .map((f) => aLugarGeoapify(f.properties, f.properties.lat, f.properties.lon))
      .filter(enZona)
      .slice(0, 6);
  } catch {
    return null;
  }
}
