import { NavLink } from 'react-router-dom';
import { ROLE_LABEL } from '../config/constants';
import Icon from './Icon';
import Logo from './Logo';

export default function Sidebar({ user, items = [], logout }) {
  const initials = (user?.nombre || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const isStaff = user?.rol !== 'SOLICITANTE';

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Logo />
      </div>
      <div className="role-label">{isStaff ? 'ESPACIO DE TRABAJO' : 'MI ESPACIO'}</div>
      <nav className="nav-list" aria-label="Navegación principal">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`.trim()}
          >
            {item.icon && <Icon name={item.icon} />}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="sidebar-profile">
          <div className={`avatar ${isStaff ? 'staff' : ''}`}>{initials}</div>
          <div>
            <strong>{user?.nombre || 'Usuario'}</strong>
            <small>{ROLE_LABEL[user?.rol] || user?.rol}</small>
          </div>
          <button
            type="button"
            className="icon-button dark"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={logout}
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
