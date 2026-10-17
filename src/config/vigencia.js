import { VIGENCIA } from './constants';

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'set', 'oct', 'nov', 'dic',
];

/**
 * Obtiene el objeto Date de registro de una solicitud.
 * Si cuenta con `fechaRegistro`, la utiliza; de lo contrario, intenta parsear `fecha`.
 */
export function obtenerFechaRegistro(solicitud) {
  if (!solicitud) return null;
  if (solicitud.fechaRegistro instanceof Date) {
    return solicitud.fechaRegistro;
  }
  if (typeof solicitud.fechaRegistro === 'string') {
    const parsed = new Date(solicitud.fechaRegistro);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

/**
 * Calcula la fecha límite de atención de una solicitud según su prioridad (RF-034).
 * fechaLimite = fecha de registro + plazo según prioridad.
 */
export function calcularFechaLimite(solicitud) {
  if (!solicitud) return null;
  const fechaReg = obtenerFechaRegistro(solicitud);
  if (!fechaReg) return null;

  const plazoDias =
    VIGENCIA.plazoDiasPorPrioridad[solicitud.prioridad] ??
    VIGENCIA.plazoDiasSinPrioridad;

  const limite = new Date(fechaReg.getTime());
  limite.setDate(limite.getDate() + plazoDias);
  return limite;
}

/**
 * Determina si una solicitud se encuentra vencida (RF-034).
 * Criterio: estado distinto de 'Resuelta' y 'Cerrada' Y ahora > fechaLimite.
 * "Vencida" no es un estado nuevo, sino un indicador derivado.
 */
export function esVencida(solicitud, ahora = new Date()) {
  if (!solicitud) return false;
  if (solicitud.estado === 'Resuelta' || solicitud.estado === 'Cerrada') {
    return false;
  }

  const limite = calcularFechaLimite(solicitud);
  if (!limite) return false;

  return ahora.getTime() > limite.getTime();
}

/**
 * Formatea una fecha en formato visual legible (ej. "18 oct, 2026").
 */
export function formatearFechaVisual(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = MESES[date.getMonth()];
  const anio = date.getFullYear();
  return `${dia} ${mes}, ${anio}`;
}
