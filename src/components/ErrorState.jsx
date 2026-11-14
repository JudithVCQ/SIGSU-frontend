/**
 * ErrorState.jsx — Error de carga con botón "Reintentar".
 * Muestra solo un mensaje amable; nunca códigos HTTP ni trazas.
 */
import Button from './Button';
import Icon from './Icon';
import './estados.css';

export default function ErrorState({
  message = 'No pudimos cargar la información. Revisa tu conexión e inténtalo de nuevo.',
  onRetry,
  compact = false,
}) {
  return (
    <div className={`estado estado-error${compact ? ' estado-compacto' : ''}`} role="alert">
      <span className="estado-icono estado-icono-error" aria-hidden="true"><Icon name="alert" size={28} /></span>
      <p className="estado-texto estado-texto-fuerte">{message}</p>
      {onRetry && (
        <div className="estado-accion">
          <Button variant="secondary" icon="clock" onClick={onRetry}>Reintentar</Button>
        </div>
      )}
    </div>
  );
}
