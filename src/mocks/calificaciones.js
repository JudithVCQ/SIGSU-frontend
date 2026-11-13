// TEMPORAL: calificaciones simuladas. El backend aún no publica el endpoint de calificación.
import { getSolicitudesMock } from './solicitudes';

function haceDias(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString();
}

/**
 * Calificaciones semilla (una por solicitud, indexadas por código).
 * SIG-00118 (Resuelta) queda sin calificar a propósito para probar el formulario.
 */
const INITIAL_CALIFICACIONES = [
  { solicitudCodigo: 'SIG-00115', puntaje: 5, comentario: 'Muy rápido, la red volvió a funcionar el mismo día.', creadoEn: haceDias(10) },
  { solicitudCodigo: 'SIG-00109', puntaje: 4, comentario: 'Buena atención, aunque tardaron en responder.', creadoEn: haceDias(13) },
  { solicitudCodigo: 'SIG-00102', puntaje: 3, comentario: '', creadoEn: haceDias(17) },
  { solicitudCodigo: 'SIG-00098', puntaje: 5, comentario: 'Excelente trabajo.', creadoEn: haceDias(22) },
];

let calificaciones = [...INITIAL_CALIFICACIONES];

/** Devuelve la calificación de una solicitud (por código) o null. */
export function getCalificacionMock(codigo) {
  if (!codigo) return null;
  return calificaciones.find((c) => c.solicitudCodigo === codigo) ?? null;
}

/** Registra una calificación. Las validaciones de negocio están en el servicio. */
export function addCalificacionMock({ solicitudCodigo, puntaje, comentario }) {
  const nueva = {
    solicitudCodigo,
    puntaje,
    comentario: comentario ?? '',
    creadoEn: new Date().toISOString(),
  };
  calificaciones = [...calificaciones, nueva];
  return nueva;
}

/** Resumen para el dashboard: promedio general y promedio por técnico responsable. */
export function getResumenCalificacionesMock() {
  const solicitudes = getSolicitudesMock();
  const responsablePor = (codigo) =>
    solicitudes.find((s) => s.codigo === codigo)?.responsable || 'Sin asignar';

  const total = calificaciones.length;
  const suma = calificaciones.reduce((acc, c) => acc + c.puntaje, 0);

  const grupos = new Map();
  calificaciones.forEach((c) => {
    const resp = responsablePor(c.solicitudCodigo);
    const g = grupos.get(resp) ?? { responsable: resp, suma: 0, total: 0 };
    g.suma += c.puntaje;
    g.total += 1;
    grupos.set(resp, g);
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

/** Solo para pruebas: restablece las calificaciones semilla. */
export function resetCalificacionesMock() {
  calificaciones = [...INITIAL_CALIFICACIONES];
}
