import Icon from './Icon';

export default function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  invalid,
  hint,
  textarea = false,
  autoComplete,
  required = false,
  disabled = false,
}) {
  const bad = !!error || !!invalid;

  return (
    <label className={`field${bad ? ' field-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && ' *'}
      </span>
      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          aria-invalid={bad}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={bad}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error ? (
        <span className="error-text" role="alert">
          <Icon name="alert" size={14} />
          {error}
        </span>
      ) : (
        hint && <span className="hint-text">{hint}</span>
      )}
    </label>
  );
}
