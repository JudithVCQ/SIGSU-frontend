import { NavLink } from 'react-router-dom';
import Icon from './Icon';

export default function BottomNav({ items = [], logout }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          {item.icon && <Icon name={item.icon} size={20} />}
          <span>{item.short || item.label}</span>
        </NavLink>
      ))}
      <button type="button" onClick={logout} aria-label="Cerrar sesión">
        <Icon name="logout" size={20} />
        <span>Salir</span>
      </button>
    </nav>
  );
}
