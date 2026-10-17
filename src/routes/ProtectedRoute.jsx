import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../config/constants';
// La autorización real vive en el backend; esto solo evita mostrar vistas ajenas al rol (RNF-006).
export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to={ROLE_HOME[user.rol]} replace />;
  return <Outlet />;
}
