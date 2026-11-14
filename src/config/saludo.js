/**
 * Saludo según la hora local del navegador.
 *  - 05:00–11:59 → "Buenos días"
 *  - 12:00–18:59 → "Buenas tardes"
 *  - resto       → "Buenas noches"
 */
export function saludoSegunHora(fecha = new Date()) {
  const h = fecha instanceof Date && !isNaN(fecha.getTime()) ? fecha.getHours() : new Date().getHours();
  if (h >= 5 && h <= 11) return 'Buenos días';
  if (h >= 12 && h <= 18) return 'Buenas tardes';
  return 'Buenas noches';
}
