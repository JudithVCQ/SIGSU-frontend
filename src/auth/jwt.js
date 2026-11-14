/**
 * jwt.js — Lectura del payload de un JWT sin librerías (solo para la experiencia de usuario:
 * la validez real del token la decide el backend).
 */

/** Decodifica el payload (base64url → JSON). Devuelve null si el token es ilegible. */
export function decodificarPayload(token) {
  if (typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 3 || !partes[1]) return null;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binario = atob(relleno);
    // Soporta caracteres UTF-8 (nombres con tildes) en el payload
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** Fecha de expiración (ms desde epoch) leída de `exp`, o null si no existe o es ilegible. */
export function expiracionMs(token) {
  const exp = decodificarPayload(token)?.exp;
  return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
}

/** true si el token es legible y aún no venció. Un token ilegible cuenta como no vigente. */
export function tokenVigente(token, ahora = Date.now()) {
  const expira = expiracionMs(token);
  return expira !== null && expira > ahora;
}
