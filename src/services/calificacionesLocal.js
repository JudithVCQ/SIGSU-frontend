/**
 * src/services/calificacionesLocal.js — Almacén TEMPORAL de calificaciones en el navegador.
 *
 * Se usa en modo API mientras el backend no publique el endpoint de calificación,
 * para poder mostrar la funcionalidad con solicitudes reales.
 * Limitaciones: los datos viven solo en este navegador (localStorage); no los ven
 * otros usuarios ni otros equipos. Se elimina cuando exista el endpoint real.
 */

const STORAGE_KEY = 'sigsu.calificaciones.local';

// Respaldo en memoria si localStorage no está disponible (modo privado, pruebas en Node)
let memoria = [];

function leer() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw == null) return memoria;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return memoria;
  }
}

function escribir(lista) {
  memoria = lista;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // Sin almacenamiento persistente: queda solo en memoria durante la sesión
  }
}

const claveDe = (solicitud) => String(solicitud?.id ?? solicitud?.codigo ?? '');

/** Calificación guardada para una solicitud, o null. */
export function getCalificacionLocal(solicitud) {
  const clave = claveDe(solicitud);
  if (!clave) return null;
  return leer().find((c) => c.solicitudKey === clave) ?? null;
}

/** Guarda la calificación junto con el responsable (para el resumen por técnico). */
export function addCalificacionLocal(solicitud, { puntaje, comentario }) {
  const nueva = {
    solicitudKey:    claveDe(solicitud),
    solicitudCodigo: solicitud?.codigo ?? '',
    responsableId:   solicitud?.responsableId ?? null,
    responsable:     solicitud?.responsable && solicitud.responsable !== 'Sin asignar'
      ? solicitud.responsable
      : 'Sin asignar',
    puntaje,
    comentario: comentario ?? '',
    creadoEn: new Date().toISOString(),
  };
  escribir([...leer(), nueva]);
  return nueva;
}

/** Resumen: promedio general y por técnico. */
export function getResumenCalificacionesLocal() {
  const lista = leer();
  const total = lista.length;
  const suma = lista.reduce((acc, c) => acc + c.puntaje, 0);

  const grupos = new Map();
  lista.forEach((c) => {
    const g = grupos.get(c.responsable) ?? { responsable: c.responsable, suma: 0, total: 0 };
    g.suma += c.puntaje;
    g.total += 1;
    grupos.set(c.responsable, g);
  });

  return {
    promedio: total ? suma / total : null,
    total,
    porTecnico: [...grupos.values()].map((g) => ({
      responsable: g.responsable,
      promedio: g.suma / g.total,
      total: g.total,
    })),
  };
}

/** Solo para pruebas. */
export function resetCalificacionesLocal() {
  memoria = [];
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // ignorar
  }
}
