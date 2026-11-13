/**
 * src/services/evidencias.js — Utilidades para mostrar evidencias (sin llamadas HTTP).
 *
 * El backend devuelve en EvidenciaResponse.archivoUrl una URL pública de Cloudinary
 * (ej. https://res.cloudinary.com/<cloud>/image/upload/v123/solicitud_11_xxx.jpg).
 * Cloudinary permite transformar el archivo agregando parámetros después de "/upload/":
 *  - Miniatura liviana: "c_fill,w_400,h_300/"
 *  - Forzar descarga:   "fl_attachment/"
 * Los recursos "raw" (/raw/upload/) no admiten transformaciones: se usa la URL original.
 */

const MINIATURA = 'c_fill,w_400,h_300';
const DESCARGA  = 'fl_attachment';

/** true si la URL es de Cloudinary y admite transformaciones (image/video upload). */
export function esUrlCloudinary(url) {
  if (typeof url !== 'string' || !url) return false;
  try {
    const { hostname, pathname } = new URL(url);
    const esHost = hostname === 'res.cloudinary.com' || hostname.endsWith('.cloudinary.com');
    return esHost && /\/(image|video)\/upload\//.test(pathname);
  } catch {
    return false;
  }
}

function insertarTransformacion(url, transformacion) {
  if (!esUrlCloudinary(url)) return url;
  if (url.includes(`/upload/${transformacion}/`)) return url;
  return url.replace('/upload/', `/upload/${transformacion}/`);
}

/** URL de miniatura liviana (Cloudinary) o la URL original. */
export function urlMiniatura(url) {
  return insertarTransformacion(url, MINIATURA) ?? null;
}

/** URL que fuerza la descarga (Cloudinary) o la URL original. */
export function urlDescarga(url) {
  return insertarTransformacion(url, DESCARGA) ?? null;
}

/**
 * Tipo de evidencia para decidir cómo mostrarla: 'imagen' | 'pdf' | 'otro'.
 * Usa tipoMime; si no viene (mocks), infiere por la extensión del nombre.
 */
export function tipoEvidencia(evidencia) {
  const mime = (evidencia?.tipoMime ?? '').toLowerCase();
  if (mime.startsWith('image/')) return 'imagen';
  if (mime === 'application/pdf') return 'pdf';
  if (mime) return 'otro';

  const nombre = (evidencia?.nombreArchivo ?? evidencia?.nombre ?? evidencia?.name ?? '').toLowerCase();
  if (/\.(jpe?g|png|gif|webp)$/.test(nombre)) return 'imagen';
  if (nombre.endsWith('.pdf')) return 'pdf';
  return 'otro';
}
