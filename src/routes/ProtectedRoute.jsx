import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../config/constants';

// La autorización real vive en el backend; esto solo evita mostrar vistas ajenas al rol (RNF-006).
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  // Mientras se valida el token contra /api/auth/perfil, no redirigir todavía
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: 'var(--muted)', fontSize: '14px',
      }}>
        Verificando sesión…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to={ROLE_HOME[user.rol]} replace />;
  return <Outlet />;
}
