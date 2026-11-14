/**
 * EmptyState.jsx — Estado vacío: ícono, título, texto y acción opcional.
 */
import Icon from './Icon';
import './estados.css';

export default function EmptyState({ icon = 'file', title, text, action, compact = false }) {
  return (
    <div className={`estado estado-vacio${compact ? ' estado-compacto' : ''}`}>
      <span className="estado-icono" aria-hidden="true"><Icon name={icon} size={28} /></span>
      {title && <strong className="estado-titulo">{title}</strong>}
      {text && <p className="estado-texto">{text}</p>}
      {action && <div className="estado-accion">{action}</div>}
    </div>
  );
}
