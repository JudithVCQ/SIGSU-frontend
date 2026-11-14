/**
 * Nombre corto para mostrar: primer nombre + primer apellido.
 * Usa `nombres`/`apellidos` si vienen (API); si no, las dos primeras palabras de `nombre`.
 */
export function nombreCorto(user) {
  const primera = (txt) => (txt || '').trim().split(/\s+/)[0] || '';
  const nombres = (user?.nombres || '').trim();
  const apellidos = (user?.apellidos || '').trim();
  if (nombres || apellidos) {
    return [primera(nombres), primera(apellidos)].filter(Boolean).join(' ') || 'Usuario';
  }
  const partes = (user?.nombre || '').trim().split(/\s+/).filter(Boolean);
  return partes.slice(0, 2).join(' ') || 'Usuario';
}

/** Iniciales (máximo 2) para el avatar. */
export function iniciales(user) {
  return (nombreCorto(user) === 'Usuario' ? '' : nombreCorto(user))
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';
}
