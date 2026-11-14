/**
 * ServidorIniciando.jsx — Pantalla de espera mientras el servidor arranca y aún no se conoce
 * al usuario de la sesión. Se actualiza sola cuando el servidor responde.
 */
import Button from './Button';
import Icon from './Icon';
import { MENSAJE_SERVIDOR_INICIANDO } from './AvisoServidor';
import './estados.css';

export default function ServidorIniciando({ onIrAlLogin }) {
  return (
    <div className="pagina-error pagina-error-completa" role="status" aria-live="polite">
      <span className="estado-icono" aria-hidden="true"><Icon name="clock" size={28} /></span>
      <h1>El servidor se está iniciando</h1>
      <p>{MENSAJE_SERVIDOR_INICIANDO} Esta pantalla se actualizará sola cuando esté listo.</p>
      {onIrAlLogin && (
        <div className="pagina-error-acciones">
          <Button variant="secondary" onClick={onIrAlLogin}>Ir al inicio de sesión</Button>
        </div>
      )}
    </div>
  );
}
