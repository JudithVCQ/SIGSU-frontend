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
          {options.map((o) => {
            const val = typeof o === 'object' && o !== null ? (o.value ?? o.id) : o;
            const text = typeof o === 'object' && o !== null ? (o.label ?? o.nombre) : o;
            return (
              <option key={String(val)} value={String(val)}>
                {text}
              </option>
            );
          })}
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
