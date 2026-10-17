import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EMAIL_DOMAIN } from '../config/constants';
import AuthShell from './AuthShell';
import Button from '../components/Button';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import FormSelect from '../components/FormSelect';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    type: '',
  });

  const [tried, setTried] = useState(false);

  const updateField = (field) => (val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const errors = {
    name: form.name.trim().split(/\s+/).filter(Boolean).length < 2
      ? 'Ingresa tus nombres y apellidos'
      : '',
    email: !form.email.trim().toLowerCase().endsWith(EMAIL_DOMAIN.toLowerCase())
      ? `Usa tu correo institucional (${EMAIL_DOMAIN})`
      : '',
    password: form.password.length < 8 ? 'Mínimo 8 caracteres' : '',
    confirm: form.confirm !== form.password || !form.confirm
      ? 'Las contraseñas no coinciden'
      : '',
    type: !form.type ? 'Selecciona tu tipo de usuario' : '',
  };

  const getError = (field) => (tried ? errors[field] : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    setTried(true);

    const hasErrors = Object.values(errors).some(Boolean);
    if (!hasErrors) {
      // TODO: conectar con el backend cuando exista el endpoint de registro (HU-03, Sprint 5)
      navigate('/login', {
        state: { notice: 'Cuenta creada correctamente. Inicia sesión para continuar.' },
      });
    }
  };

  return (
    <AuthShell>
      <div className="eyebrow">NUEVA CUENTA</div>
      <h1>Registro de usuario</h1>
      <p className="auth-lead">
        Crea tu cuenta con el correo de la universidad. Solo toma un minuto.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Nombres y apellidos"
          value={form.name}
          onChange={updateField('name')}
          placeholder="Ej. Camila Rojas Vega"
          error={getError('name')}
          autoComplete="name"
          required
        />
        <FormField
          label="Correo institucional"
          type="email"
          value={form.email}
          onChange={updateField('email')}
          placeholder={`nombre${EMAIL_DOMAIN}`}
          error={getError('email')}
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
        <FormSelect
          label="Tipo de usuario"
          value={form.type}
          onChange={updateField('type')}
          options={['Estudiante', 'Docente', 'Personal administrativo']}
          placeholder="Selecciona una opción"
          error={getError('type')}
          required
        />
        <Button type="submit" full>
          Registrar
        </Button>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-link">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
