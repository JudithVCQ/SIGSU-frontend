/**
 * AvisoServidor.jsx — Aviso no bloqueante cuando una petición tarda más de 8 s
 * (p. ej. arranque en frío). Se alimenta de onSlowRequest de apiClient.
 */
import { useEffect, useState } from 'react';
import { onSlowRequest } from '../services/apiClient.js';
import Icon from './Icon';
import './estados.css';

export const MENSAJE_LENTITUD = 'Esto está tardando más de lo habitual…';

export default function AvisoServidor() {
  const [lento, setLento] = useState(false);

  useEffect(() => onSlowRequest((pendiente) => setLento(Boolean(pendiente))), []);

  if (!lento) return null;
  return (
    <div className="aviso-servidor" role="status" aria-live="polite">
      <Icon name="clock" size={18} />
      <span>{MENSAJE_LENTITUD}</span>
    </div>
  );
}
