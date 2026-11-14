import { getErrorMessage } from '../services/apiClient.js';

/**
 * Mensaje legible de un error del backend: prioriza el texto que devuelve
 * el servidor (body.message o cuerpo de texto) y, si no hay, usa getErrorMessage.
 */
export function mensajeBackend(err, fallback = 'Error desconocido.') {
  const body = err?.body;
  if (body && typeof body === 'object' && typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim();
  }
  if (typeof body === 'string' && body.trim()) return body.trim();
  return getErrorMessage(err, fallback);
}
