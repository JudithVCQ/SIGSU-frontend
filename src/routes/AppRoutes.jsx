import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES as R, ROLE_HOME } from '../config/constants';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/AppLayout';
import { NotFoundPage } from './PaginasError';
import LoginPage from '../auth/LoginPage';
import SolicitanteDashboard from '../solicitudes/SolicitanteDashboard';
import MisSolicitudes from '../solicitudes/MisSolicitudes';
import NuevaSolicitud from '../solicitudes/NuevaSolicitud';
import DetalleSolicitud from '../solicitudes/DetalleSolicitud';
import SupervisorDashboard from '../dashboard/SupervisorDashboard';
import BandejaSolicitudes from '../solicitudes/BandejaSolicitudes';
import ClasificarSolicitud from '../solicitudes/ClasificarSolicitud';
import AsignarTecnico from '../solicitudes/AsignarTecnico';
import RevisarCerrar from '../solicitudes/RevisarCerrar';
import MisAsignaciones from '../solicitudes/MisAsignaciones';
import AtencionSolicitud from '../solicitudes/AtencionSolicitud';
import GestionUsuarios from '../administracion/GestionUsuarios';
import GestionCatalogos from '../administracion/GestionCatalogos';

export default function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? ROLE_HOME[user.rol] : '/login'} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
          <Route element={<ProtectedRoute roles={[R.SOLICITANTE]} />}>
            <Route path="/solicitante" element={<SolicitanteDashboard />} />
            <Route path="/solicitante/solicitudes" element={<MisSolicitudes />} />
            <Route path="/solicitante/nueva" element={<NuevaSolicitud />} />
          </Route>
          <Route element={<ProtectedRoute roles={[R.SUPERVISOR]} />}>
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route path="/supervisor/solicitudes" element={<BandejaSolicitudes />} />
            <Route path="/supervisor/solicitudes/:id/clasificar" element={<ClasificarSolicitud />} />
            <Route path="/supervisor/asignacion" element={<AsignarTecnico />} />
            <Route path="/supervisor/solicitudes/:id/asignar" element={<AsignarTecnico />} />
            <Route path="/supervisor/solicitudes/:id/cerrar" element={<RevisarCerrar />} />
          </Route>
          <Route element={<ProtectedRoute roles={[R.TECNICO]} />}>
            <Route path="/tecnico" element={<MisAsignaciones />} />
            <Route path="/tecnico/atencion/:id" element={<AtencionSolicitud />} />
          </Route>
          <Route element={<ProtectedRoute roles={[R.ADMIN]} />}>
            <Route path="/admin/usuarios" element={<GestionUsuarios />} />
            <Route path="/admin/catalogos" element={<GestionCatalogos />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
