/**
 * src/services/calificaciones.js — Calificación del servicio por el solicitante.
 *
 * El backend AÚN NO publica nada de calificación (ni endpoint, ni campo en
 * SolicitudResponse, ni métricas en DashboardResponse). Mientras tanto:
 *  - Modo mocks: funciona completo con src/mocks/calificaciones.js.
 *  - Modo API:   la funcionalidad se reporta como no disponible y la UI la oculta.
 *
 * Propuesta de contrato, a confirmar con backend (ajustar cuando se publique):
 *  - GET  /api/solicitudes/{id}/calificacion  → { puntaje, comentario, creadoEn } | 404
 *  - POST /api/solicitudes/{id}/calificacion  ← { puntaje, comentario? }
 *  - GET  /api/dashboard → agregar calificacionPromedio, totalCalificaciones,
 *                          calificacionPorResponsable [{ responsable, promedio, total }]
 * Al publicarse: poner CALIFICACION_API_DISPONIBLE = true, implementar las ramas
 * de API con apiClient y agregar mapCalificacion en mappers.js.
 */
import { CALIFICACION } from '../config/constants';
import { esFinalizada } from '../config/vigencia';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** Cambiar a true cuando backend publique el endpoint de calificación. */
const CALIFICACION_API_DISPONIBLE = false;

const NO_DISPONIBLE = 'La calificación del servicio aún no está disponible.';

/** true si la funcionalidad de calificación puede usarse en el modo actual. */
export function calificacionDisponible() {
  return USE_MOCKS || CALIFICACION_API_DISPONIBLE;
}

/** Solo se califican solicitudes RESUELTA o CERRADA. */
export function esCalificable(solicitud) {
  return esFinalizada(solicitud);
}

/**
 * Obtiene la calificación de una solicitud.
 * @returns {Promise<null | { puntaje: number, comentario: string, creadoEn: string }>}
 */
export async function getCalificacion(solicitud) {
  if (!solicitud || !calificacionDisponible()) return null;
  if (USE_MOCKS) {
    const { getCalificacionMock } = await import('../mocks/calificaciones.js');
    return getCalificacionMock(solicitud.codigo);
  }
  return null; // Pendiente: GET /api/solicitudes/{id}/calificacion
}

/** Valida los datos de una calificación. Devuelve el mensaje de error o ''. */
export function validarCalificacion({ puntaje, comentario } = {}) {
  const { puntajeMin, puntajeMax, maxComentario } = CALIFICACION;
  if (!Number.isInteger(puntaje) || puntaje < puntajeMin || puntaje > puntajeMax) {
    return `Selecciona una calificación de ${puntajeMin} a ${puntajeMax}.`;
  }
  if (comentario && comentario.length > maxComentario) {
    return `El comentario no puede superar los ${maxComentario} caracteres.`;
  }
  return '';
}

/**
 * Registra la calificación del solicitante (una sola vez, sin edición).
 * Las validaciones del front son de experiencia; la regla real la aplica el backend.
 */
export async function calificarSolicitud(solicitud, { puntaje, comentario } = {}) {
  if (!calificacionDisponible()) throw new Error(NO_DISPONIBLE);
  if (!solicitud) throw new Error('No se encontró la solicitud.');
  if (!esCalificable(solicitud)) {
    throw new Error('Solo puedes calificar una solicitud resuelta o cerrada.');
  }
  const error = validarCalificacion({ puntaje, comentario });
  if (error) throw new Error(error);

  const texto = (comentario ?? '').trim();

  if (USE_MOCKS) {
    const { getCalificacionMock, addCalificacionMock } = await import('../mocks/calificaciones.js');
    if (getCalificacionMock(solicitud.codigo)) {
      throw new Error('Esta solicitud ya fue calificada.');
    }
    return addCalificacionMock({ solicitudCodigo: solicitud.codigo, puntaje, comentario: texto });
  }
  throw new Error(NO_DISPONIBLE); // Pendiente: POST /api/solicitudes/{id}/calificacion
}

/**
 * Resumen para el dashboard del supervisor.
 * @returns {Promise<null | { promedio: number|null, total: number,
 *   porTecnico: Array<{ responsable: string, promedio: number, total: number }> }>}
 *   null si la funcionalidad no está disponible.
 */
export async function getResumenCalificaciones() {
  if (!calificacionDisponible()) return null;
  if (USE_MOCKS) {
    const { getResumenCalificacionesMock } = await import('../mocks/calificaciones.js');
    const r = getResumenCalificacionesMock();
    return {
      ...r,
      porTecnico: [...r.porTecnico].sort((a, b) => b.promedio - a.promedio || b.total - a.total),
    };
  }
  return null; // Pendiente: campos de calificación en GET /api/dashboard
}
