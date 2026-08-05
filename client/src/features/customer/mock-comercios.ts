import type { Comercio } from "./types";

// Datos de ejemplo — reemplazar por una consulta a Supabase cuando exista la tabla `comercios`.
export const mockComercios: Comercio[] = [
  {
    id: "1",
    nombre: "Arepería La 14",
    categoria: "Comida",
    zona: "Centro, Girardot",
    tiempoMin: 20,
    tiempoMax: 35,
    costoDomicilio: 5000,
  },
  {
    id: "2",
    nombre: "Sushi Ocho",
    categoria: "Comida",
    zona: "Ricaurte",
    tiempoMin: 30,
    tiempoMax: 45,
    costoDomicilio: 5000,
  },
  {
    id: "3",
    nombre: "Panadería San Roque",
    categoria: "Panadería",
    zona: "Flandes",
    tiempoMin: 15,
    tiempoMax: 25,
    costoDomicilio: 5000,
  },
  {
    id: "4",
    nombre: "Droguería Vital",
    categoria: "Farmacia",
    zona: "Centro, Girardot",
    tiempoMin: 15,
    tiempoMax: 30,
    costoDomicilio: 5000,
  },
  {
    id: "5",
    nombre: "Mercado La Cosecha",
    categoria: "Mercado",
    zona: "Ricaurte",
    tiempoMin: 40,
    tiempoMax: 60,
    costoDomicilio: 5000,
  },
];

export const categorias = ["Todos", "Comida", "Panadería", "Farmacia", "Mercado"];
