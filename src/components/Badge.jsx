/**
 * Badge.jsx — Muestra un indicador de estado o prioridad.
 * Acepta los valores de UI (ej. "En atención", "Registrada", "Alta")
 * o los alias de mocks (type="working", etc.).
 */

const TYPE_TO_TEXT = {
  pending:    'Registrada',   // alias legacy para mocks
  registered: 'Registrada',
  evaluation: 'En evaluación',
  assigned:   'Asignada',
  working:    'En atención',
  resolved:   'Resuelta',
  closed:     'Cerrada',
  high:       'Alta',
  medium:     'Media',
  low:        'Baja',
  activo:     'Activo',
  inactivo:   'Inactivo',
  active:     'Activo',
  inactive:   'Inactivo',
};

const slug = (t) => {
  if (!t) return '';
  return String(t)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
};

export default function Badge({ texto, type, children }) {
  const displayText = children ?? texto ?? (type ? TYPE_TO_TEXT[type] : '');

  let badgeClass = '';
  if (type) {
    const mapped = TYPE_TO_TEXT[type];
    badgeClass = mapped ? `badge-${slug(mapped)}` : `badge-${type}`;
  } else if (displayText) {
    badgeClass = `badge-${slug(displayText)}`;
  }

  return (
    <span className={`badge ${badgeClass}`.trim()}>
      <span className="badge-dot" aria-hidden="true" />
      {displayText}
    </span>
  );
}
