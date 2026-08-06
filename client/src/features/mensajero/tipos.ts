// Perfil del mensajero. Estos tipos definen el esquema que luego será la
// tabla `mensajeros` en la base de datos — la infraestructura primero.
export type Vehiculo = "moto" | "bicicleta";

export type EstadoMensajero = "en_revision" | "aprobado" | "rechazado";

// "Todos" = trabaja en los tres municipios de la zona piloto.
export type Municipio = "Girardot" | "Ricaurte" | "Flandes" | "Todos";

// Resultado de la verificación facial hecha en el dispositivo del aspirante.
// Solo lo ve el equipo en el panel: al aspirante no se le muestran puntajes.
export type ResultadoVerificacion = {
  similitud: number | null; // rostro en vivo vs foto de la cédula (0-1)
  antispoof: number | null; // probabilidad de rostro real (no foto/pantalla)
  vivacidad: number | null; // probabilidad de video en vivo
  rostroEnCedula: boolean;
  fecha: string;
  // El aspirante no pudo completar los gestos: el equipo revisa a mano.
  revisionManual?: boolean;
};

export type PerfilMensajero = {
  nombre: string;
  celular: string; // 10 dígitos
  correo: string; // para enviarle la confirmación de aprobación
  documento: string; // cédula
  municipio: Municipio;
  vehiculo: Vehiculo;
  placa?: string; // solo moto
  estado: EstadoMensajero;
  fechaRegistro: string;
};
