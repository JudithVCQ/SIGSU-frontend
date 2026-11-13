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
 * Calcula la fecha límite de atención a partir de VIGENCIA.
 * SOLO usado en modo mocks como respaldo cuando la solicitud no trae fechaLimite.
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
 * Obtiene la fecha límite de atención de una solicitud.
 * 1. Usa `fechaLimite` si viene en la solicitud (ambos modos). El backend
 *    aún no la devuelve en SolicitudResponse, pero se prepara para cuando lo haga.
 * 2. Si no viene: en modo mocks la calcula con VIGENCIA; en modo real devuelve null.
 */
export function obtenerFechaLimite(solicitud) {
  if (!solicitud) return null;
  const { fechaLimite } = solicitud;
  if (fechaLimite instanceof Date && !isNaN(fechaLimite.getTime())) return fechaLimite;
  if (typeof fechaLimite === 'string' && fechaLimite) {
    const d = new Date(fechaLimite);
    if (!isNaN(d.getTime())) return d;
  }
  return calcularFechaLimite(solicitud);
}

/** true si la solicitud ya está resuelta o cerrada (el plazo deja de correr). */
export function esFinalizada(solicitud) {
  if (!solicitud) return false;
  const e = solicitud.estadoApi ?? solicitud.estado;
  return e === 'RESUELTA' || e === 'Resuelta' || e === 'CERRADA' || e === 'Cerrada';
}

/**
 * Determina si una solicitud está vencida.
 * Sin fecha límite disponible devuelve false (en modo real, hasta que el backend
 * devuelva fechaLimite, el KPI de vencidas viene del dashboard).
 */
export function esVencida(solicitud, ahora) {
  if (!solicitud || esFinalizada(solicitud)) return false;
  const limite = obtenerFechaLimite(solicitud);
  if (!limite) return false;
  const ref = ahora instanceof Date ? ahora : new Date();
  return ref.getTime() > limite.getTime();
}

/** Días de calendario (hora local) entre dos fechas: b - a. */
function diasCalendario(a, b) {
  const ia = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const ib = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ib.getTime() - ia.getTime()) / 86400000);
}

/**
 * Describe el plazo de atención de una solicitud para mostrarlo en la UI.
 * @returns {null | { fecha: Date, estado: 'vigente'|'vencida'|'finalizada', texto: string }}
 *   null si no hay fecha límite disponible (la UI debe ocultar el plazo).
 */
export function describirPlazo(solicitud, ahora) {
  const fecha = obtenerFechaLimite(solicitud);
  if (!fecha) return null;
  if (esFinalizada(solicitud)) return { fecha, estado: 'finalizada', texto: '' };

  const ref = ahora instanceof Date ? ahora : new Date();
  if (ref.getTime() > fecha.getTime()) {
    const dias = diasCalendario(fecha, ref);
    let texto = `Vencida hace ${dias} días`;
    if (dias <= 0) texto = 'Vencida hoy';
    else if (dias === 1) texto = 'Vencida hace 1 día';
    return { fecha, estado: 'vencida', texto };
  }

  const dias = diasCalendario(ref, fecha);
  let texto = `Vence en ${dias} días`;
  if (dias <= 0) texto = 'Vence hoy';
  else if (dias === 1) texto = 'Vence en 1 día';
  return { fecha, estado: 'vigente', texto };
}

/** Formatea una fecha como "YYYY-MM-DD" en hora local (para <input type="date">). */
export function aFechaInput(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convierte el valor de un <input type="date"> ("YYYY-MM-DD") al final de ese
 * día en hora local, expresado en ISO (UTC). Devuelve null si es inválido.
 */
export function fechaInputAIso(valor) {
  if (!valor) return null;
  const d = new Date(`${valor}T23:59:59`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Formatea una fecha para display visual (ej. "18 oct, 2026") */
export function formatearFechaVisual(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = MESES[date.getMonth()];
  const anio = date.getFullYear();
  return `${dia} ${mes}, ${anio}`;
}
