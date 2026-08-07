// Catálogo de documentos legales. El contenido vive en archivos markdown
// (src/contenido/legal) para que se puedan editar sin tocar código.
export const DOCUMENTOS = [
  {
    ruta: "privacidad",
    archivo: "politica-privacidad",
    titulo: "Política de Privacidad y Tratamiento de Datos",
    resumen: "Qué datos recogemos, para qué, con quién los compartimos y tus derechos.",
  },
  {
    ruta: "terminos",
    archivo: "terminos-condiciones",
    titulo: "Términos y Condiciones de Uso",
    resumen: "Las reglas del servicio para quienes piden por la app.",
  },
  {
    ruta: "aviso-privacidad",
    archivo: "aviso-privacidad",
    titulo: "Aviso de Privacidad",
    resumen: "Resumen corto de cómo tratamos tus datos.",
  },
  {
    ruta: "autorizacion-datos",
    archivo: "autorizacion-tratamiento",
    titulo: "Autorización de Tratamiento de Datos",
    resumen: "El texto que aceptas al registrarte.",
  },
  {
    ruta: "permisos",
    archivo: "consentimiento-permisos",
    titulo: "Ubicación, cámara y datos biométricos",
    resumen: "Qué hacemos con cada permiso y qué pasa si lo niegas.",
  },
  {
    ruta: "eliminar-cuenta",
    archivo: "eliminacion-cuenta",
    titulo: "Eliminación de Cuenta y Datos",
    resumen: "Cómo borrar tu cuenta y qué se conserva por ley.",
  },
  {
    ruta: "pagos",
    archivo: "politica-pagos",
    titulo: "Política de Pagos",
    resumen: "Cuánto cuesta, cómo se paga y cómo gana el mensajero.",
  },
  {
    ruta: "devoluciones",
    archivo: "devoluciones-cancelaciones",
    titulo: "Devoluciones, Cancelaciones y Reembolsos",
    resumen: "Qué hacer si cancelas o si algo salió mal con tu pedido.",
  },
  {
    ruta: "comercios",
    archivo: "terminos-comercios",
    titulo: "Términos para Comercios Aliados",
    resumen: "Condiciones para los negocios que reciben pedidos.",
  },
  {
    ruta: "mensajeros",
    archivo: "terminos-repartidores",
    titulo: "Términos para Mensajeros",
    resumen: "Condiciones para quienes reparten con Pídelo.",
  },
  {
    ruta: "cookies",
    archivo: "politica-cookies",
    titulo: "Política de Cookies",
    resumen: "Qué guardamos en tu navegador y por qué.",
  },
] as const;

export type Documento = (typeof DOCUMENTOS)[number];
