import { useState } from 'react';
import Icon from './Icon';

export default function PasswordField({
  label,
  value,
  onChange,
  error,
  invalid,
  hint,
  autoComplete,
  required = false,
  disabled = false,
}) {
  const [show, setShow] = useState(false);
  const bad = !!error || !!invalid;
  const inputId = `pw-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return (
    <div className={`field${bad ? ' field-error' : ''}`}>
      <label className="field-label" htmlFor={inputId}>
        {label}
        {required && ' *'}
      </label>
      <span className="pw-wrap">
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={bad}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Icon name={show ? 'eyeoff' : 'eye'} size={18} />
        </button>
      </span>
      {error ? (
        <span className="error-text" role="alert">
          <Icon name="alert" size={14} />
          {error}
        </span>
      ) : (
        hint && <span className="hint-text">{hint}</span>
      )}
    </div>
  );
}
