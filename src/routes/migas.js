/**
 * Ruta de navegación (migas de pan) de la barra superior.
 * Ej.: /supervisor/solicitudes/SOL-2026-000007/clasificar
 *   → Supervisión › Solicitudes › SOL-2026-000007 › Clasificar
 * Cada miga: { label, to? , codigo? }. La última no tiene enlace (página actual).
 */
import { ROLES } from '../config/constants';
import { buscarVista } from './vistasRapidas';

const AREAS = {
  [ROLES.SUPERVISOR]:  { label: 'Supervisión',     to: '/supervisor' },
  [ROLES.TECNICO]:     { label: 'Espacio técnico', to: '/tecnico' },
  [ROLES.SOLICITANTE]: { label: 'Mi espacio',      to: '/solicitante' },
  [ROLES.ADMIN]:       { label: 'Administración',  to: '/admin/usuarios' },
};

const LISTA_DEL_ROL = {
  [ROLES.SUPERVISOR]:  { label: 'Solicitudes',      to: '/supervisor/solicitudes' },
  [ROLES.TECNICO]:     { label: 'Mis asignaciones', to: '/tecnico' },
  [ROLES.SOLICITANTE]: { label: 'Mis solicitudes',  to: '/solicitante/solicitudes' },
};

const ACCIONES_SUPERVISOR = {
  clasificar: 'Clasificar',
  asignar: 'Asignar técnico',
  cerrar: 'Revisar y cerrar',
};

const PAGINAS = {
  '/solicitante': [AREAS[ROLES.SOLICITANTE], { label: 'Inicio' }],
  '/solicitante/solicitudes': [AREAS[ROLES.SOLICITANTE], { label: 'Mis solicitudes', to: '/solicitante/solicitudes' }],
  '/solicitante/nueva': [AREAS[ROLES.SOLICITANTE], { label: 'Nueva solicitud' }],
  '/supervisor': [AREAS[ROLES.SUPERVISOR], { label: 'Dashboard' }],
  '/supervisor/solicitudes': [AREAS[ROLES.SUPERVISOR], { label: 'Solicitudes', to: '/supervisor/solicitudes' }],
  '/supervisor/asignacion': [AREAS[ROLES.SUPERVISOR], { label: 'Asignación' }],
  '/tecnico': [AREAS[ROLES.TECNICO], { label: 'Mis asignaciones', to: '/tecnico' }],
  '/admin/usuarios': [AREAS[ROLES.ADMIN], { label: 'Usuarios' }],
  '/admin/catalogos': [AREAS[ROLES.ADMIN], { label: 'Catálogos' }],
};

const ROL_DE_RUTA = {
  '/solicitante/solicitudes': ROLES.SOLICITANTE,
  '/supervisor/solicitudes': ROLES.SUPERVISOR,
  '/tecnico': ROLES.TECNICO,
};

const decodificar = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

/** Devuelve la lista de migas para la ruta actual (la última es la página actual). */
export function migasDePan(pathname = '/', search = '', rol) {
  const ruta = pathname.replace(/\/+$/, '') || '/';
  let migas;

  if (PAGINAS[ruta]) {
    migas = PAGINAS[ruta].map((m) => ({ ...m }));
    // Vista rápida aplicada (?vista=) como último nivel
    const vista = buscarVista(ROL_DE_RUTA[ruta], new URLSearchParams(search).get('vista'));
    if (vista) migas.push({ label: vista.label });
  } else {
    let m;
    if ((m = ruta.match(/^\/supervisor\/solicitudes\/([^/]+)\/(clasificar|asignar|cerrar)$/))) {
      const codigo = decodificar(m[1]);
      migas = [
        AREAS[ROLES.SUPERVISOR],
        LISTA_DEL_ROL[ROLES.SUPERVISOR],
        { label: codigo, to: `/solicitudes/${m[1]}`, codigo: true },
        { label: ACCIONES_SUPERVISOR[m[2]] },
      ];
    } else if ((m = ruta.match(/^\/tecnico\/atencion\/([^/]+)$/))) {
      migas = [AREAS[ROLES.TECNICO], LISTA_DEL_ROL[ROLES.TECNICO], { label: decodificar(m[1]), codigo: true }];
    } else if ((m = ruta.match(/^\/solicitudes\/([^/]+)$/))) {
      // Detalle compartido: la ruta depende del rol de quien lo abre
      const area = AREAS[rol];
      const lista = LISTA_DEL_ROL[rol];
      migas = [area, lista, { label: decodificar(m[1]), codigo: true }].filter(Boolean);
    } else {
      migas = AREAS[rol] ? [AREAS[rol]] : [];
    }
  }

  // La última miga es la página actual: sin enlace
  return migas.map((mg, i) => (i === migas.length - 1 ? { ...mg, to: undefined } : { ...mg }));
}
