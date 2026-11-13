/**
 * mappers.js — Único punto de traducción backend ↔ UI.
 * NUNCA importes desde las páginas directamente: usa los servicios.
 */

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------

/** Convierte el enum del backend a la etiqueta visible en la UI */
export const ESTADO_API_TO_UI = {
  REGISTRADA:    'Registrada',
  EN_EVALUACION: 'En evaluación',
  ASIGNADA:      'Asignada',
  EN_ATENCION:   'En atención',
  RESUELTA:      'Resuelta',
  CERRADA:       'Cerrada',
};

/** Convierte la etiqueta UI de vuelta al valor del enum backend */
export const ESTADO_UI_TO_API = Object.fromEntries(
  Object.entries(ESTADO_API_TO_UI).map(([k, v]) => [v, k])
);

/** Lista ordenada de estados para filtros de UI */
export const ESTADOS_UI = Object.values(ESTADO_API_TO_UI);

/** Nivel numérico para la barra de progreso */
export const ESTADO_NIVEL = {
  Registrada:      0,
  'En evaluación': 1,
  Asignada:        2,
  'En atención':   3,
  Resuelta:        4,
  Cerrada:         5,
};

// ---------------------------------------------------------------------------
// Usuario
// ---------------------------------------------------------------------------

/**
 * Adapta UsuarioResponse del backend al objeto de sesión que usa la UI.
 * @param {object} u - UsuarioResponse del backend
 * @returns {object} - objeto de sesión normalizado
 */
export function mapUsuario(u) {
  if (!u) return null;
  return {
    id:        u.id,
    nombre:    [u.nombres, u.apellidos].filter(Boolean).join(' ').trim() || 'Usuario',
    nombres:   u.nombres ?? '',
    apellidos: u.apellidos ?? '',
    correo:    u.correo ?? '',
    rol:       u.rol ?? '',
    areaId:    u.areaId ?? null,
    activo:    u.activo ?? true,
  };
}

// ---------------------------------------------------------------------------
// Solicitud
// ---------------------------------------------------------------------------

/**
 * Adapta SolicitudResponse del backend al objeto que usan los componentes.
 * Conserva estadoApi para decisiones de lógica; estadoUi para mostrarlo.
 */
export function mapSolicitud(s) {
  if (!s) return null;
  const estadoApi = s.estado ?? '';
  const estadoUi  = ESTADO_API_TO_UI[estadoApi] ?? estadoApi;
  return {
    // Identidad
    id:                 s.id,
    codigo:             s.codigo ?? '',
    // Datos principales
    titulo:             s.titulo ?? '',
    descripcion:        s.descripcion ?? '',
    ubicacion:          s.ubicacion ?? '',
    solucion:           s.solucion ?? '',
    // Estado (doble representación)
    estado:             estadoUi,          // para Badge y lógica de UI
    estadoApi:          estadoApi,         // para decisiones de acciones y envíos
    // Categoría / Área / Prioridad
    categoriaId:        s.categoriaId ?? null,
    categoria:          s.categoriaNombre ?? '',
    prioridadId:        s.prioridadId ?? null,
    prioridad:          s.prioridadNombre ?? '',
    areaId:             s.areaId ?? null,
    area:               s.areaNombre ?? '',
    // Responsable
    responsableId:      s.responsableId ?? null,
    responsable:        s.responsableNombre ?? 'Sin asignar',
    // Solicitante
    solicitanteId:      s.solicitanteId ?? null,
    solicitante:        s.solicitanteNombre ?? '',
    // Fechas ISO (conserva el formato del backend; formatea en el componente)
    fechaLimite:        s.fechaLimite ?? null,
    creadoEn:           s.creadoEn ?? null,
    actualizadoEn:      s.actualizadoEn ?? null,
    resueltaEn:         s.resueltaEn ?? null,
    cerradaEn:          s.cerradaEn ?? null,
    // Alias de compatibilidad para componentes que usan r.fecha
    fecha:              s.creadoEn ? formatFechaVisual(s.creadoEn) : '',
    // Alias de compatibilidad para responsable (mocks usan r.rolResponsable)
    rolResponsable:     '',
    // Evidencias y comentarios se cargan por separado
    evidencias:         [],
    comentarios:        [],
  };
}

// ---------------------------------------------------------------------------
// Seguimiento (comentario/nota de avance)
// ---------------------------------------------------------------------------

export function mapSeguimiento(s) {
  if (!s) return null;
  return {
    id:           s.id,
    tipo:         s.tipo ?? 'COMENTARIO',
    texto:        s.contenido ?? '',
    nombre:       s.creadoPorNombre ?? 'Usuario',
    creadoPorId:  s.creadoPorId ?? null,
    rol:          '',           // el backend no devuelve el rol en SeguimientoResponse
    tiempo:       s.creadoEn ? formatFechaVisual(s.creadoEn, true) : 'Ahora',
    creadoEn:     s.creadoEn ?? null,
  };
}

// ---------------------------------------------------------------------------
// Evidencia
// ---------------------------------------------------------------------------

export function mapEvidencia(e) {
  if (!e) return null;
  return {
    id:           e.id,
    nombre:       e.nombreArchivo ?? 'archivo',
    tamano:       e.tamanoBytes ? `${(e.tamanoBytes / 1024 / 1024).toFixed(1)} MB` : '',
    tipoMime:     e.tipoMime ?? '',
    url:          e.archivoUrl ?? null,
    seguimientoId: e.seguimientoId ?? null,
    cargadoPorId: e.cargadoPorId ?? null,
    cargadoPor:   e.cargadoPorNombre ?? '',
    creadoEn:     e.creadoEn ?? null,
  };
}

// ---------------------------------------------------------------------------
// Historial de estados
// ---------------------------------------------------------------------------

export function mapHistorialItem(h) {
  if (!h) return null;
  return {
    id:             h.id,
    estadoOrigen:   ESTADO_API_TO_UI[h.estadoOrigen] ?? h.estadoOrigen ?? '',
    estadoDestino:  ESTADO_API_TO_UI[h.estadoDestino] ?? h.estadoDestino ?? '',
    cambiadoPor:    h.cambiadoPorNombre ?? '',
    cambiadoPorId:  h.cambiadoPorId ?? null,
    observacion:    h.observacion ?? '',
    tiempo:         h.cambiadoEn ? formatFechaVisual(h.cambiadoEn, true) : '',
    cambiadoEn:     h.cambiadoEn ?? null,
  };
}

// ---------------------------------------------------------------------------
// Catálogos (Categoría / Área / Prioridad)
// ---------------------------------------------------------------------------

export function parseNivel(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const parsed = parseInt(val, 10);
  if (!isNaN(parsed)) return parsed;
  try {
    const decoded = atob(String(val).trim());
    const decodedNum = parseInt(decoded, 10);
    if (!isNaN(decodedNum)) return decodedNum;
  } catch {
    /* ignorar error si no es base64 */
  }
  return val;
}

export function mapCatalogo(c) {
  if (!c) return null;
  return {
    id:       c.id,
    codigo:   c.codigo ?? '',
    nombre:   c.nombre ?? '',
    nivel:    parseNivel(c.nivel),
    nivelRaw: c.nivel,
    activo:   c.activo ?? true,
  };
}

// ---------------------------------------------------------------------------
// Asignación
// ---------------------------------------------------------------------------

export function mapAsignacion(a) {
  if (!a) return null;
  return {
    id:              a.id,
    solicitudId:     a.solicitudId,
    solicitudCodigo: a.solicitudCodigo ?? '',
    tecnicoId:       a.tecnicoId,
    tecnico:         a.tecnicoNombre ?? '',
    asignadoPorId:   a.asignadoPorId ?? null,
    asignadoPor:     a.asignadoPorNombre ?? '',
    asignadaEn:      a.asignadaEn ?? null,
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function mapDashboard(d) {
  if (!d) return null;
  return {
    total:                      d.total ?? 0,
    pendientes:                 d.pendientes ?? 0,
    atendidas:                  d.atendidas ?? 0,
    vencidas:                   d.vencidas ?? 0,
    porcentajeResuelto:         d.porcentajeResuelto ?? 0,
    tiempoPromedioAtencionHoras: d.tiempoPromedioAtencionHoras ?? 0,
    porCategoria:               (d.porCategoria  ?? []).map(mapIndicador),
    porPrioridad:               (d.porPrioridad  ?? []).map(mapIndicador),
    porResponsable:             (d.porResponsable ?? []).map(mapIndicador),
  };
}

function mapIndicador(i) {
  return { id: i.id, nombre: i.nombre ?? '', total: i.total ?? 0 };
}

// ---------------------------------------------------------------------------
// Helpers de fecha
// ---------------------------------------------------------------------------

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];

export function formatFechaVisual(isoString, incluirHora = false) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const dia  = String(d.getDate()).padStart(2, '0');
  const mes  = MESES[d.getMonth()];
  const anio = d.getFullYear();
  if (!incluirHora) return `${dia} ${mes}, ${anio}`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${dia} ${mes}, ${anio} · ${hh}:${mm}`;
}

