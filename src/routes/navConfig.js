import { ROLES as R } from '../config/constants';

// Navegación lateral por rol (UX/UI sección 4 y prototipos)
export const NAV_BY_ROLE = {
  [R.SOLICITANTE]: [
    { to: '/solicitante', label: 'Inicio', short: 'Inicio', icon: 'home' },
    { to: '/solicitante/solicitudes', label: 'Mis solicitudes', short: 'Solicitudes', icon: 'file' },
    { to: '/solicitante/nueva', label: 'Nueva solicitud', short: 'Nueva', icon: 'plus' },
  ],
  [R.SUPERVISOR]: [
    { to: '/supervisor', label: 'Dashboard', short: 'Dashboard', icon: 'grid' },
    { to: '/supervisor/solicitudes', label: 'Solicitudes', short: 'Solicitudes', icon: 'file' },
    { to: '/supervisor/asignacion', label: 'Asignación', short: 'Asignar', icon: 'users' },
  ],
  [R.TECNICO]: [
    { to: '/tecnico', label: 'Mis asignaciones', short: 'Asignaciones', icon: 'file' },
  ],
  [R.ADMIN]: [
    { to: '/admin/usuarios', label: 'Usuarios', short: 'Usuarios', icon: 'users' },
    { to: '/admin/catalogos', label: 'Catálogos', short: 'Catálogos', icon: 'layers' },
  ],
};
