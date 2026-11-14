import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSidebarContraido } from '../hooks/useSidebarContraido';
import { NAV_BY_ROLE } from '../routes/navConfig';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const items = (user && NAV_BY_ROLE[user.rol]) || [];
  const [contraido, alternarSidebar] = useSidebarContraido();

  return (
    <div className={`app-shell${contraido ? ' sidebar-contraido' : ''}`}>
      <Sidebar
        user={user}
        items={items}
        logout={logout}
        contraido={contraido}
        onAlternar={alternarSidebar}
      />
      <div className="main-shell">
        <Header user={user} logout={logout} />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <BottomNav items={items} logout={logout} />
    </div>
  );
}
