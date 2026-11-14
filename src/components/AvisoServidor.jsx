/**
 * AvisoServidor.jsx — Aviso no bloqueante cuando el servidor tarda en responder
 * (arranque en frío de Render). Se alimenta de onSlowRequest de apiClient.
 */
import { useEffect, useState } from 'react';
import { onSlowRequest } from '../services/apiClient.js';
import Icon from './Icon';
import './estados.css';

export const MENSAJE_SERVIDOR_INICIANDO = 'El servidor se está iniciando, puede tardar hasta un minuto.';

export default function AvisoServidor() {
  const [lento, setLento] = useState(false);

  useEffect(() => onSlowRequest((pendiente) => setLento(Boolean(pendiente))), []);

  if (!lento) return null;
  return (
    <div className="aviso-servidor" role="status" aria-live="polite">
      <Icon name="clock" size={18} />
      <span>{MENSAJE_SERVIDOR_INICIANDO}</span>
    </div>
  );
}
