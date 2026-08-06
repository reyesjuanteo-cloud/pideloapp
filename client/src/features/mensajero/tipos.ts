// Perfil del mensajero. Estos tipos definen el esquema que luego será la
// tabla `mensajeros` en la base de datos — la infraestructura primero.
export type Vehiculo = "moto" | "bicicleta";

export type EstadoMensajero = "en_revision" | "aprobado" | "rechazado";

export type Municipio = "Girardot" | "Ricaurte" | "Flandes";

export type PerfilMensajero = {
  nombre: string;
  celular: string; // 10 dígitos
  documento: string; // cédula
  municipio: Municipio;
  vehiculo: Vehiculo;
  // Solo para moto:
  placa?: string;
  licencia?: string;
  soatVigente?: boolean;
  estado: EstadoMensajero;
  fechaRegistro: string;
};
