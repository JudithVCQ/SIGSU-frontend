import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES, ROLE_HOME } from '../config/constants';
import AuthShell from './AuthShell';
import Button from '../components/Button';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import Icon from '../components/Icon';

const USE_MOCKS  = import.meta.env.VITE_USE_MOCKS === 'true';
const EMAIL_DOMAIN = '@universidad.edu';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [params]   = useSearchParams();

  const notice     = location.state?.notice || '';
  // Mensaje de sesión caducada enviado por apiClient vía query param
  const expiredMsg = params.get('expired') === '1'
    ? (params.get('msg') || 'Tu sesión ha caducado. Inicia sesión nuevamente.')
    : '';

  const [correo,    setCorreo]    = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState(null); // { title, message }
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (USE_MOCKS) {
      // ── Modo mocks: lógica simulada (dev) ──────────────────────────────
      const cleanEmail = correo.trim().toLowerCase();
      const isValidEmail = cleanEmail.endsWith(EMAIL_DOMAIN) && cleanEmail.length > EMAIL_DOMAIN.length;
      if (!isValidEmail || !password.trim()) {
        setError({
          title: 'Correo o contraseña incorrectos',
          message: 'Verifica tus credenciales e inténtalo nuevamente.',
        });
        return;
      }
      const usernamePart   = cleanEmail.replace(EMAIL_DOMAIN, '');
      const formattedName  = usernamePart.split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Usuario';
      await login({ id: 1, nombre: formattedName, correo: cleanEmail, rol: ROLES.SOLICITANTE });
      navigate(ROLE_HOME[ROLES.SOLICITANTE]);
      return;
    }

    // ── Modo real ─────────────────────────────────────────────────────────
    if (!correo.trim() || !password.trim()) {
      setError({
        title: 'Campos incompletos',
        message: 'Ingresa tu correo institucional y contraseña.',
      });
      return;
    }

    setLoading(true);
    try {
      const usuario = await login({ correo: correo.trim().toLowerCase(), contrasena: password });
      navigate(ROLE_HOME[usuario.rol] ?? '/login');
    } catch (err) {
      let title = 'No se pudo iniciar sesión';
      let message = err.message ?? 'Inténtalo más tarde.';

      if (err.status === 400 || err.status === 401) {
        title = 'Correo o contraseña incorrectos';
        message = 'Verifica tus credenciales e inténtalo nuevamente.';
      } else if (!err.status || err.status === 0 || err.name === 'AbortError' || err.isTimeout || err.isNetwork) {
        title = 'Error de conexión';
        message = 'No pudimos conectar con el servidor. Puede estar iniciando, intenta de nuevo en unos segundos.';
      } else if (err.status >= 500) {
        title = 'Error en el servidor';
        message = 'El servidor tuvo un problema. Intenta más tarde.';
      }

      setError({ title, message });
    } finally {
      setLoading(false);
    }
  };

  // Acceso rápido para desarrollo (solo con VITE_USE_MOCKS=true)
  const handleDevLogin = async (rol, nombre, correo_dev) => {
    await login({ id: `DEV-${rol}`, nombre, correo: correo_dev, rol });
    navigate(ROLE_HOME[rol]);
  };

  return (
    <AuthShell>
      <h1>Iniciar sesión</h1>
      <p className="auth-lead">Ingresa con tu correo institucional</p>

      {notice && (
        <div className="message success" role="status">
          <Icon name="check" />
          <div><strong>{notice}</strong></div>
        </div>
      )}

      {expiredMsg && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>{expiredMsg}</strong></div>
        </div>
      )}

      {error && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div>
            <strong>{error.title}</strong>
            <p>{error.message}</p>
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Correo institucional"
          type="email"
          value={correo}
          onChange={(v) => { setCorreo(v); setError(null); }}
          placeholder={USE_MOCKS ? `nombre${EMAIL_DOMAIN}` : 'tu@correo.edu'}
          invalid={!!error}
          autoComplete="username"
          disabled={loading}
        />
        <PasswordField
          label="Contraseña"
          value={password}
          onChange={(v) => { setPassword(v); setError(null); }}
          invalid={!!error}
          autoComplete="current-password"
          disabled={loading}
        />
        <Button type="submit" full disabled={loading}>
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="auth-nota">
        <Icon name="alert" size={16} />
        <span>Las cuentas las crea el administrador del sistema. Si no puedes ingresar, comunícate con él.</span>
      </p>

      {/* Acceso rápido por rol: SOLO en modo mocks */}
      {USE_MOCKS && (
        <div className="auth-dev">
          <small>Acceso rápido por rol (modo desarrollo)</small>
          <div className="auth-dev-buttons">
            {[
              [ROLES.SOLICITANTE, 'Camila Rojas',  'solicitante'],
              [ROLES.SUPERVISOR,  'Ana Martínez',  'supervisor'],
              [ROLES.TECNICO,     'Diego Morales', 'tecnico'],
              [ROLES.ADMIN,       'Carlos Ramos',  'admin'],
            ].map(([rol, nombre, slug]) => (
              <button
                key={rol}
                type="button"
                className="auth-dev-btn"
                onClick={() => handleDevLogin(rol, nombre, `${slug}@universidad.edu`)}
              >
                {nombre.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
