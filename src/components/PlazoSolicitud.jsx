/**
 * PlazoSolicitud.jsx — Muestra la fecha límite de atención y el tiempo restante.
 *
 * Usa `fechaLimite` de la solicitud (o el respaldo de VIGENCIA en modo mocks).
 * Si no hay fecha límite disponible no renderiza nada: el backend aún no
 * devuelve el campo en SolicitudResponse.
 *
 * Variantes:
 *  - "info"   (por defecto): celda para `.info-grid` con etiqueta "Fecha límite".
 *  - "inline": fecha + texto en una línea compacta, para celdas de tabla.
 * `fallback` se renderiza cuando no hay fecha límite (por defecto, nada).
 */
import Badge from './Badge';
import { describirPlazo, formatearFechaVisual } from '../config/vigencia';

export default function PlazoSolicitud({ solicitud, variant = 'info', ahora, fallback = null }) {
  const plazo = describirPlazo(solicitud, ahora);
  if (!plazo) return fallback;

  const fecha = formatearFechaVisual(plazo.fecha);
  const vencida = plazo.estado === 'vencida';
  const textoClass = `plazo-texto${vencida ? ' plazo-vencida' : ''}`;

  if (variant === 'inline') {
    return (
      <span className="plazo-inline">
        <span>{fecha}</span>
        {plazo.texto && <small className={textoClass}>{plazo.texto}</small>}
      </span>
    );
  }

  return (
    <div className="plazo-info">
      <small>Fecha límite</small>
      <span>{fecha}</span>
      {plazo.texto && <span className={textoClass}>{plazo.texto}</span>}
      {vencida && <div className="plazo-badge"><Badge texto="Vencida" /></div>}
    </div>
  );
}
