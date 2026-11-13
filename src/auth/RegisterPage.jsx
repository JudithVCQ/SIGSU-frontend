import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import Button from '../components/Button';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import { registrarUsuario } from '../services/usuarios.js';
import Icon from '../components/Icon';

const USE_MOCKS    = import.meta.env.VITE_USE_MOCKS === 'true';
const EMAIL_DOMAIN = '@universidad.edu';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombres:   '',
    apellidos: '',
    correo:    '',
    password:  '',
    confirm:   '',
  });

  const [tried,   setTried]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const updateField = (field) => (val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setApiError('');
  };

  const errors = {
    nombres:   form.nombres.trim().length < 2 ? 'Ingresa tus nombres' : '',
    apellidos: form.apellidos.trim().length < 2 ? 'Ingresa tus apellidos' : '',
    correo:    !form.correo.trim().toLowerCase().endsWith(EMAIL_DOMAIN.toLowerCase())
                 ? `Usa tu correo institucional (…${EMAIL_DOMAIN})`
                 : '',
    password:  form.password.length < 8 ? 'Mínimo 8 caracteres' : '',
    confirm:   form.confirm !== form.password || !form.confirm
                 ? 'Las contraseñas no coinciden'
                 : '',
  };

  const getError = (field) => (tried ? errors[field] : '');
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTried(true);
    setApiError('');
    if (hasErrors) return;

    if (USE_MOCKS) {
      navigate('/login', {
        state: { notice: 'Cuenta creada. Inicia sesión para continuar.' },
      });
      return;
    }

    setLoading(true);
    try {
      // POST /api/usuarios con rol SOLICITANTE
      // El backend no acepta un campo "tipo de usuario"; el rol se fija en SOLICITANTE.
      await registrarUsuario({
        nombres:    form.nombres.trim(),
        apellidos:  form.apellidos.trim(),
        correo:     form.correo.trim().toLowerCase(),
        contrasena: form.password,
        rol:        'SOLICITANTE',
      });
      navigate('/login', {
        state: { notice: 'Cuenta creada correctamente. Inicia sesión para continuar.' },
      });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        // SUPUESTO: si POST /api/usuarios requiere autenticación de admin,
        // lo indicamos al usuario. Registrado en diagnóstico §9.1.
        setApiError('El registro de nuevos usuarios lo realiza el administrador del sistema.');
      } else if (err.status === 409) {
        setApiError('Ya existe una cuenta con ese correo electrónico.');
      } else {
        setApiError(err.message ?? 'No se pudo crear la cuenta. Inténtalo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="eyebrow">NUEVA CUENTA</div>
      <h1>Registro de usuario</h1>
      <p className="auth-lead">
        Crea tu cuenta con el correo de la universidad. Solo toma un minuto.
      </p>

      {apiError && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>{apiError}</strong></div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="two-col">
          <FormField
            label="Nombres"
            value={form.nombres}
            onChange={updateField('nombres')}
            placeholder="Ej. Camila"
            error={getError('nombres')}
            autoComplete="given-name"
            required
          />
          <FormField
            label="Apellidos"
            value={form.apellidos}
            onChange={updateField('apellidos')}
            placeholder="Ej. Rojas Vega"
            error={getError('apellidos')}
            autoComplete="family-name"
            required
          />
        </div>
        <FormField
          label="Correo institucional"
          type="email"
          value={form.correo}
          onChange={updateField('correo')}
          placeholder={`nombre${EMAIL_DOMAIN}`}
          error={getError('correo')}
          autoComplete="email"
          required
        />
        <div className="two-col">
          <PasswordField
            label="Contraseña"
            value={form.password}
            onChange={updateField('password')}
            error={getError('password')}
            hint="Mínimo 8 caracteres"
            autoComplete="new-password"
            required
          />
          <PasswordField
            label="Confirmar contraseña"
            value={form.confirm}
            onChange={updateField('confirm')}
            error={getError('confirm')}
            autoComplete="new-password"
            required
          />
        </div>
        <Button type="submit" full disabled={loading}>
          {loading ? 'Registrando…' : 'Registrar'}
        </Button>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-link">Inicia sesión</Link>
      </p>
    </AuthShell>
  );
}
