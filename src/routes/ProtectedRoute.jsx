import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ForbiddenPage } from './PaginasError';
import ServidorIniciando from '../components/ServidorIniciando';

// La autorización real vive en el backend; esto solo evita mostrar vistas ajenas al rol (RNF-006).
export default function ProtectedRoute({ roles }) {
  const { user, loading, descartarSesion } = useAuth();

  // Hay un token vigente pero aún no sabemos quién es: el servidor puede estar iniciándose
  if (loading) return <ServidorIniciando onIrAlLogin={descartarSesion} />;

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <ForbiddenPage />;
  return <Outlet />;
}
