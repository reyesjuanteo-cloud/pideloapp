// Datos de ejemplo — reemplazar por la tabla `productos` de Supabase.
export type Producto = {
  id: string;
  comercioId: string;
  nombre: string;
  descripcion: string;
  precio: number;
};

export const mockProductos: Producto[] = [
  // Arepería La 14
  { id: "p1", comercioId: "1", nombre: "Arepa de queso", descripcion: "Con queso costeño fundido", precio: 8500 },
  { id: "p2", comercioId: "1", nombre: "Arepa rellena mixta", descripcion: "Carne desmechada y pollo", precio: 14000 },
  { id: "p3", comercioId: "1", nombre: "Chicha artesanal", descripcion: "Vaso de 12 oz", precio: 4500 },
  { id: "p4", comercioId: "1", nombre: "Combo arepa + jugo", descripcion: "Arepa de queso y jugo natural", precio: 16500 },
  // Sushi Ocho
  { id: "p5", comercioId: "2", nombre: "Roll California x8", descripcion: "Cangrejo, aguacate y pepino", precio: 24900 },
  { id: "p6", comercioId: "2", nombre: "Roll Teriyaki x8", descripcion: "Pollo teriyaki y queso crema", precio: 27500 },
  { id: "p7", comercioId: "2", nombre: "Gyozas x5", descripcion: "De cerdo, con salsa ponzu", precio: 15900 },
  { id: "p8", comercioId: "2", nombre: "Té frío de la casa", descripcion: "Con hierbabuena", precio: 6500 },
  // Panadería San Roque
  { id: "p9", comercioId: "3", nombre: "Croissant de mantequilla", descripcion: "Horneado del día", precio: 4200 },
  { id: "p10", comercioId: "3", nombre: "Pan campesino", descripcion: "Masa madre, 500 g", precio: 7800 },
  { id: "p11", comercioId: "3", nombre: "Torta de zanahoria", descripcion: "Porción con nueces", precio: 6500 },
  { id: "p12", comercioId: "3", nombre: "Café con leche", descripcion: "12 oz", precio: 4000 },
  // Droguería Vital
  { id: "p13", comercioId: "4", nombre: "Acetaminofén 500 mg x10", descripcion: "Tabletas", precio: 5200 },
  { id: "p14", comercioId: "4", nombre: "Suero oral", descripcion: "Sabor natural, 500 ml", precio: 7800 },
  { id: "p15", comercioId: "4", nombre: "Vitamina C x30", descripcion: "Tabletas masticables", precio: 12500 },
  { id: "p16", comercioId: "4", nombre: "Curitas x20", descripcion: "Surtidas", precio: 4900 },
  // Mercado La Cosecha
  { id: "p17", comercioId: "5", nombre: "Huevos AA x12", descripcion: "De gallina feliz", precio: 14500 },
  { id: "p18", comercioId: "5", nombre: "Leche entera 1 L", descripcion: "Bolsa", precio: 4800 },
  { id: "p19", comercioId: "5", nombre: "Aguacate hass x2", descripcion: "Listos para hoy", precio: 7900 },
  { id: "p20", comercioId: "5", nombre: "Café molido 500 g", descripcion: "Tostión media", precio: 18900 },
];

export function productosDeComercio(comercioId: string): Producto[] {
  return mockProductos.filter((p) => p.comercioId === comercioId);
}
