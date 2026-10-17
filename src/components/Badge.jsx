const TYPE_TO_TEXT = {
  pending: 'Pendiente',
  assigned: 'Asignada',
  working: 'En atención',
  resolved: 'Resuelta',
  closed: 'Cerrada',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
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
  // Soporta tanto la API del repo (texto="Pendiente") como la del mockup (type="working" o children)
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
