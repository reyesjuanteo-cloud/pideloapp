import type { Comercio } from "./types";

// Datos de ejemplo — reemplazar por una consulta a Supabase cuando exista la tabla `comercios`.
export const mockComercios: Comercio[] = [
  {
    id: "1",
    nombre: "Arepería La 14",
    categoria: "Comida",
    zona: "El Poblado",
    tiempoMin: 20,
    tiempoMax: 35,
    costoDomicilio: 3500,
  },
  {
    id: "2",
    nombre: "Sushi Ocho",
    categoria: "Comida",
    zona: "Laureles",
    tiempoMin: 30,
    tiempoMax: 45,
    costoDomicilio: 4200,
  },
  {
    id: "3",
    nombre: "Panadería San Roque",
    categoria: "Panadería",
    zona: "Envigado",
    tiempoMin: 15,
    tiempoMax: 25,
    costoDomicilio: 2800,
  },
  {
    id: "4",
    nombre: "Droguería Vital",
    categoria: "Farmacia",
    zona: "El Poblado",
    tiempoMin: 15,
    tiempoMax: 30,
    costoDomicilio: 3000,
  },
  {
    id: "5",
    nombre: "Mercado La Cosecha",
    categoria: "Mercado",
    zona: "Laureles",
    tiempoMin: 40,
    tiempoMax: 60,
    costoDomicilio: 5000,
  },
];

export const categorias = ["Todos", "Comida", "Panadería", "Farmacia", "Mercado"];
