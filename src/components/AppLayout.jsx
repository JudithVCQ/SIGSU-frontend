import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NAV_BY_ROLE } from '../routes/navConfig';
import { ROLE_LABEL } from '../config/constants';
export default function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="topbar"><strong>SIGSU</strong>
        <span>{user.nombre} · {ROLE_LABEL[user.rol]} <button onClick={logout}>Cerrar sesión</button></span></header>
      <div className="shell">
        <nav className="sidebar" aria-label="Navegación principal">
          {NAV_BY_ROLE[user.rol].map((i) => <NavLink key={i.to} to={i.to} end>{i.label}</NavLink>)}
        </nav>
        <main className="content"><Outlet /></main>
      </div>
    </div>);
}
