/**
 * src/services/calificaciones.js — Calificación del servicio por el solicitante.
 *
 * El backend AÚN NO publica nada de calificación (ni endpoint, ni campo en
 * SolicitudResponse, ni métricas en DashboardResponse). Hay tres modos:
 *  - 'mocks': VITE_USE_MOCKS=true → src/mocks/calificaciones.js.
 *  - 'local': API real SIN endpoint de calificación (situación actual) → se guarda
 *             en el navegador (services/calificacionesLocal.js) para poder mostrar
 *             la funcionalidad con solicitudes reales. Solo visible en ese navegador.
 *  - 'api':   API real CON endpoint (cuando backend lo publique).
 *
 * Transición al endpoint real:
 *  1. Poner CALIFICACION_API_DISPONIBLE = true.
 *  2. Implementar las ramas 'api' con apiClient (abajo) y agregar mapCalificacion en mappers.js.
 *  3. Eliminar calificacionesLocal.js y el aviso de "vista previa" en la UI.
 *  Las vistas no cambian: solo usan las funciones de este archivo.
 *
 * Propuesta de contrato, a confirmar con backend:
 *  - GET  /api/solicitudes/{id}/calificacion  → { puntaje, comentario, creadoEn } | 404
 *  - POST /api/solicitudes/{id}/calificacion  ← { puntaje, comentario? }
 *  - GET  /api/dashboard → agregar calificacionPromedio, totalCalificaciones,
 *                          calificacionPorResponsable [{ responsable, promedio, total }]
 */
import { CALIFICACION } from '../config/constants';
import { esFinalizada } from '../config/vigencia';
import {
  getCalificacionLocal,
  addCalificacionLocal,
  getResumenCalificacionesLocal,
} from './calificacionesLocal.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** Cambiar a true cuando backend publique el endpoint de calificación. */
const CALIFICACION_API_DISPONIBLE = false;

const PENDIENTE_API = 'La calificación del servicio aún no está conectada al servidor.';

/** Modo actual: 'mocks' | 'local' | 'api'. */
export function modoCalificacion() {
  if (USE_MOCKS) return 'mocks';
  return CALIFICACION_API_DISPONIBLE ? 'api' : 'local';
}

/** true si la funcionalidad puede usarse (hoy, en todos los modos). */
export function calificacionDisponible() {
  return true;
}

/** true si las calificaciones solo se guardan en este navegador (vista previa). */
export function esVistaPreviaLocal() {
  return modoCalificacion() === 'local';
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
  if (!solicitud) return null;
  switch (modoCalificacion()) {
    case 'mocks': {
      const { getCalificacionMock } = await import('../mocks/calificaciones.js');
      return getCalificacionMock(solicitud.codigo);
    }
    case 'local':
      return getCalificacionLocal(solicitud);
    default:
      throw new Error(PENDIENTE_API); // GET /api/solicitudes/{id}/calificacion
  }
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
 * Las validaciones del front son de experiencia; la regla real la aplicará el backend.
 */
export async function calificarSolicitud(solicitud, { puntaje, comentario } = {}) {
  if (!solicitud) throw new Error('No se encontró la solicitud.');
  if (!esCalificable(solicitud)) {
    throw new Error('Solo puedes calificar una solicitud resuelta o cerrada.');
  }
  const error = validarCalificacion({ puntaje, comentario });
  if (error) throw new Error(error);

  const texto = (comentario ?? '').trim();
  const modo = modoCalificacion();

  if (modo === 'api') throw new Error(PENDIENTE_API); // POST /api/solicitudes/{id}/calificacion

  if (await getCalificacion(solicitud)) {
    throw new Error('Esta solicitud ya fue calificada.');
  }

  if (modo === 'mocks') {
    const { addCalificacionMock } = await import('../mocks/calificaciones.js');
    return addCalificacionMock({ solicitudCodigo: solicitud.codigo, puntaje, comentario: texto });
  }
  return addCalificacionLocal(solicitud, { puntaje, comentario: texto });
}

const ordenarPorTecnico = (r) => ({
  ...r,
  porTecnico: [...r.porTecnico].sort((a, b) => b.promedio - a.promedio || b.total - a.total),
});

/**
 * Resumen para el dashboard del supervisor.
 * @returns {Promise<{ promedio: number|null, total: number,
 *   porTecnico: Array<{ responsable: string, promedio: number, total: number }> }>}
 */
export async function getResumenCalificaciones() {
  switch (modoCalificacion()) {
    case 'mocks': {
      const { getResumenCalificacionesMock } = await import('../mocks/calificaciones.js');
      return ordenarPorTecnico(getResumenCalificacionesMock());
    }
    case 'local':
      return ordenarPorTecnico(getResumenCalificacionesLocal());
    default:
      throw new Error(PENDIENTE_API); // campos de calificación en GET /api/dashboard
  }
}
