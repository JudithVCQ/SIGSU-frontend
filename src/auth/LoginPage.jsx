import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EMAIL_DOMAIN, ROLES, ROLE_HOME } from '../config/constants';
import AuthShell from './AuthShell';
import Button from '../components/Button';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import Icon from '../components/Icon';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleEmailChange = (val) => {
    setEmail(val);
    setError(false);
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    setError(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const isValidEmail = cleanEmail.endsWith(EMAIL_DOMAIN.toLowerCase()) && cleanEmail.length > EMAIL_DOMAIN.length;
    const isValidPassword = password.trim().length >= 1;

    if (!isValidEmail || !isValidPassword) {
      setError(true);
      return;
    }

    // TODO: conectar con el backend (POST /auth/login)
    const usernamePart = cleanEmail.replace(EMAIL_DOMAIN.toLowerCase(), '');
    const formattedName = usernamePart
      .split(/[._-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Camila Rojas';

    const usuario = {
      id: 'USR-001',
      nombre: formattedName,
      correo: cleanEmail,
      rol: ROLES.SOLICITANTE,
    };

    login(usuario);
    navigate(ROLE_HOME[ROLES.SOLICITANTE]);
  };

  const handleDevLogin = (rol, nombre, correo) => {
    // TODO: eliminar al integrar backend
    login({ id: `USR-${rol}`, nombre, correo, rol });
    navigate(ROLE_HOME[rol]);
  };

  return (
    <AuthShell>
      <div className="eyebrow">ACCESO</div>
      <h1>Iniciar sesión</h1>
      <p className="auth-lead">
        Ingresa con tu cuenta institucional para registrar y seguir tus solicitudes.
      </p>

      {notice && (
        <div className="message success" role="status">
          <Icon name="check" />
          <div>
            <strong>{notice}</strong>
          </div>
        </div>
      )}

      {error && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div>
            <strong>Correo o contraseña incorrectos</strong>
            <p>Verifica tus credenciales e inténtalo nuevamente.</p>
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Correo institucional"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder={`nombre${EMAIL_DOMAIN}`}
          invalid={error}
          autoComplete="username"
        />
        <PasswordField
          label="Contraseña"
          value={password}
          onChange={handlePasswordChange}
          invalid={error}
          autoComplete="current-password"
        />
        <Button type="submit" full>
          Iniciar sesión
        </Button>
      </form>

      <p className="auth-switch">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="text-link">
          Regístrate
        </Link>
      </p>

      {import.meta.env.DEV && (
        <div className="auth-dev">
          {/* TODO: eliminar al integrar backend */}
          <small>Acceso rápido por rol (Modo desarrollo)</small>
          <div className="auth-dev-buttons">
            <button
              type="button"
              className="auth-dev-btn"
              onClick={() =>
                handleDevLogin(
                  ROLES.SOLICITANTE,
                  'Camila Rojas',
                  `usuario.solicitante${EMAIL_DOMAIN}`
                )
              }
            >
              Solicitante
            </button>
            <button
              type="button"
              className="auth-dev-btn"
              onClick={() =>
                handleDevLogin(
                  ROLES.SUPERVISOR,
                  'Ana Martínez',
                  `ana.martinez${EMAIL_DOMAIN}`
                )
              }
            >
              Supervisor
            </button>
            <button
              type="button"
              className="auth-dev-btn"
              onClick={() =>
                handleDevLogin(
                  ROLES.TECNICO,
                  'Diego Morales',
                  `diego.morales${EMAIL_DOMAIN}`
                )
              }
            >
              Técnico
            </button>
            <button
              type="button"
              className="auth-dev-btn"
              onClick={() =>
                handleDevLogin(
                  ROLES.ADMIN,
                  'Carlos Ramos',
                  `carlos.ramos${EMAIL_DOMAIN}`
                )
              }
            >
              Administrador
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
