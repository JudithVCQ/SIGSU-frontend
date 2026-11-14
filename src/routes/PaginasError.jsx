/**
 * PaginasError.jsx — Pantallas 404 (no encontrada) y 403 (sin permiso).
 * Se muestran dentro del layout de la aplicación; el botón lleva al panel del rol.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../config/constants';
import Icon from '../components/Icon';
import '../components/estados.css';

function PaginaError({ codigo, icono, titulo, texto }) {
  const { user } = useAuth();
  const inicio = (user && ROLE_HOME[user.rol]) || '/login';
  return (
    <div className="pagina-error" role="alert">
      <span className="estado-icono" aria-hidden="true"><Icon name={icono} size={28} /></span>
      <div className="pagina-error-codigo" aria-hidden="true">{codigo}</div>
      <h1>{titulo}</h1>
      <p>{texto}</p>
      <div className="pagina-error-acciones">
        <Link to={inicio} className="btn btn-primary">Volver a mi panel</Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <PaginaError
      codigo="404"
      icono="search"
      titulo="No encontramos esta página"
      texto="La dirección no existe o fue movida. Revisa el enlace o vuelve a tu panel."
    />
  );
}

export function ForbiddenPage() {
  return (
    <PaginaError
      codigo="403"
      icono="alert"
      titulo="No tienes acceso a esta sección"
      texto="Tu rol no incluye esta pantalla. Si crees que es un error, comunícate con el administrador."
    />
  );
}
