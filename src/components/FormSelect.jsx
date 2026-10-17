import Icon from './Icon';

export default function FormSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecciona una opción',
  error,
  required = false,
}) {
  return (
    <label className={`field${error ? ' field-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && ' *'}
      </span>
      <span className="select-wrap">
        <select
          aria-label={label}
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <Icon name="down" size={16} />
      </span>
      {error && (
        <span className="error-text" role="alert">
          <Icon name="alert" size={14} />
          {error}
        </span>
      )}
    </label>
  );
}
