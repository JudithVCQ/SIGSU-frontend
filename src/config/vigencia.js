import { VIGENCIA } from './constants';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];

/** Obtiene la fecha de registro de una solicitud (compatibilidad con mocks) */
export function obtenerFechaRegistro(solicitud) {
  if (!solicitud) return null;
  if (solicitud.fechaRegistro instanceof Date)        return solicitud.fechaRegistro;
  if (typeof solicitud.fechaRegistro === 'string') {
    const p = new Date(solicitud.fechaRegistro);
    if (!isNaN(p.getTime())) return p;
  }
  if (solicitud.creadoEn) {
    const p = new Date(solicitud.creadoEn);
    if (!isNaN(p.getTime())) return p;
  }
  return null;
}

/**
 * Calcula la fecha límite de atención.
 * SOLO usado en modo mocks: en modo real, el backend no devuelve fechaLimite
 * en SolicitudResponse (ver diagnóstico §4.1).
 */
export function calcularFechaLimite(solicitud) {
  if (!USE_MOCKS || !solicitud) return null;
  const fechaReg = obtenerFechaRegistro(solicitud);
  if (!fechaReg) return null;
  const plazoDias = VIGENCIA.plazoDiasPorPrioridad[solicitud.prioridad] ?? VIGENCIA.plazoDiasSinPrioridad;
  const limite = new Date(fechaReg.getTime());
  limite.setDate(limite.getDate() + plazoDias);
  return limite;
}

/**
 * Determina si una solicitud está vencida.
 * En modo real siempre devuelve false (el KPI de vencidas viene del dashboard).
 * En modo mocks calcula localmente.
 */
export function esVencida(solicitud, ahora) {
  if (!USE_MOCKS) return false;   // En modo real no calculamos vencidas localmente
  if (!solicitud) return false;
  const e = solicitud.estadoApi ?? solicitud.estado;
  if (e === 'RESUELTA' || e === 'Resuelta' || e === 'CERRADA' || e === 'Cerrada') return false;
  const limite = calcularFechaLimite(solicitud);
  if (!limite) return false;
  const ref = ahora instanceof Date ? ahora : new Date();
  return ref.getTime() > limite.getTime();
}

/** Formatea una fecha para display visual (ej. "18 oct, 2026") */
export function formatearFechaVisual(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = MESES[date.getMonth()];
  const anio = date.getFullYear();
  return `${dia} ${mes}, ${anio}`;
}
