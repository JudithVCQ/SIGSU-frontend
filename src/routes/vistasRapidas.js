/**
 * Vistas rápidas del sidebar: enlaces a una lista ya filtrada por ?vista=<id>.
 *
 * Fuente única de verdad: las listas filtran con `filtro` y el sidebar cuenta con
 * el mismo `filtro` sobre la MISMA llamada que hace la lista (`cargarListaBase`),
 * por eso los contadores coinciden con lo que se ve al abrir cada vista.
 */
import { ROLES } from '../config/constants';
import { ESTADO_UI_TO_API } from '../services/mappers.js';
import { getSolicitudes } from '../services/solicitudes.js';
import { getSolicitudesMock } from '../mocks/solicitudes';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** Estado en formato backend, también para datos de mocks que solo traen la etiqueta. */
export function estadoApiDe(s) {
  return s?.estadoApi || ESTADO_UI_TO_API[s?.estado] || s?.estado || '';
}

const sinResponsable = (s) =>
  s?.responsableId == null && (!s?.responsable || s.responsable === 'Sin asignar');

export const VISTAS_RAPIDAS = {
  [ROLES.SUPERVISOR]: {
    ruta: '/supervisor/solicitudes',
    vistas: [
      { id: 'sin-clasificar', label: 'Sin clasificar', icon: 'edit', filtro: (s) => estadoApiDe(s) === 'REGISTRADA' },
      { id: 'por-asignar', label: 'Por asignar', icon: 'users', filtro: (s) => estadoApiDe(s) === 'EN_EVALUACION' && sinResponsable(s) },
      { id: 'por-cerrar', label: 'Por cerrar', icon: 'check', filtro: (s) => estadoApiDe(s) === 'RESUELTA' },
    ],
  },
  [ROLES.TECNICO]: {
    ruta: '/tecnico',
    vistas: [
      { id: 'por-iniciar', label: 'Por iniciar', icon: 'clock', filtro: (s) => estadoApiDe(s) === 'ASIGNADA' },
      { id: 'en-atencion', label: 'En atención', icon: 'settings', filtro: (s) => estadoApiDe(s) === 'EN_ATENCION' },
      { id: 'resueltas', label: 'Resueltas', icon: 'check', filtro: (s) => estadoApiDe(s) === 'RESUELTA' },
    ],
  },
  [ROLES.SOLICITANTE]: {
    ruta: '/solicitante/solicitudes',
    vistas: [
      { id: 'abiertas', label: 'Abiertas', icon: 'clock', filtro: (s) => estadoApiDe(s) !== 'CERRADA' },
      { id: 'cerradas', label: 'Cerradas', icon: 'check', filtro: (s) => estadoApiDe(s) === 'CERRADA' },
    ],
  },
  // ADMINISTRADOR: sin vistas rápidas
};

/** Configuración de una vista por rol e id, o null si no existe. */
export function buscarVista(rol, id) {
  if (!id) return null;
  return VISTAS_RAPIDAS[rol]?.vistas.find((v) => v.id === id) ?? null;
}

/** Enlace de una vista rápida. */
export function rutaDeVista(rol, id) {
  const cfg = VISTAS_RAPIDAS[rol];
  return cfg ? `${cfg.ruta}?vista=${encodeURIComponent(id)}` : null;
}

/** Cuenta cuántas solicitudes caen en cada vista del rol: { [id]: número }. */
export function contarPorVista(rol, lista = []) {
  const cfg = VISTAS_RAPIDAS[rol];
  if (!cfg) return {};
  return Object.fromEntries(cfg.vistas.map((v) => [v.id, lista.filter(v.filtro).length]));
}

/**
 * La misma llamada que hace la lista de cada rol (ver BandejaSolicitudes,
 * MisAsignaciones y MisSolicitudes). Una sola llamada, sin parámetros por vista.
 */
export async function cargarListaBase(user) {
  const rol = user?.rol;
  if (!VISTAS_RAPIDAS[rol]) return [];
  if (USE_MOCKS) {
    const todas = getSolicitudesMock();
    return rol === ROLES.TECNICO ? todas.filter((r) => r.responsable && r.responsable === user?.nombre) : todas;
  }
  if (rol === ROLES.TECNICO) return getSolicitudes({ responsableId: user?.id });
  return getSolicitudes();
}
