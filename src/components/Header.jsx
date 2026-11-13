import { useLocation } from 'react-router-dom';
import { ROLE_LABEL } from '../config/constants';
import Icon from './Icon';

const TITLES = {
  '/solicitante': 'Inicio',
  '/solicitante/solicitudes': 'Mis solicitudes',
  '/solicitante/nueva': 'Registrar solicitud',
  '/supervisor': 'Panel general',
  '/supervisor/solicitudes': 'Solicitudes',
  '/supervisor/asignacion': 'Asignación de técnicos',
  '/tecnico': 'Mis asignaciones',
  '/admin/usuarios': 'Gestión de usuarios',
  '/admin/catalogos': 'Gestión de catálogos',
};

export default function Header({ user, logout }) {
  const location = useLocation();
  const initials = (user?.nombre || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const isStaff = user?.rol !== 'SOLICITANTE';
  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith('/solicitudes/') ? 'Detalle de solicitud' : 'SIGSU');

  return (
    <header className="topbar">
      <div className="top-title">{title}</div>
      <div className="top-actions">
        <button
          type="button"
          className="icon-button notification"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Icon name="bell" />
          <span />
        </button>
        <div className="top-profile">
          <div className={`avatar small ${isStaff ? 'staff' : ''}`}>{initials}</div>
          <div>
            <strong>{user?.nombre || 'Usuario'}</strong>
            <small>{ROLE_LABEL[user?.rol] || user?.rol}</small>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={logout}
            style={{ width: '32px', height: '32px' }}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
