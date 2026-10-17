import { ROLES as R } from '../config/constants';
// Navegación lateral por rol (UX/UI sección 4 y prototipos)
export const NAV_BY_ROLE = {
  [R.SOLICITANTE]: [{ to: '/solicitante', label: 'Inicio' }, { to: '/solicitante/solicitudes', label: 'Mis solicitudes' }, { to: '/solicitante/nueva', label: 'Nueva solicitud' }],
  [R.SUPERVISOR]: [{ to: '/supervisor', label: 'Dashboard' }, { to: '/supervisor/solicitudes', label: 'Solicitudes' }, { to: '/supervisor/asignacion', label: 'Asignación' }],
  [R.TECNICO]: [{ to: '/tecnico', label: 'Mis asignaciones' }],
  [R.ADMIN]: [{ to: '/admin/usuarios', label: 'Usuarios' }, { to: '/admin/catalogos', label: 'Catálogos' }],
};
