/** src/services/solicitudes.js — CRUD de solicitudes y recursos anidados */
import { apiGet, apiPost, apiPut } from './apiClient.js';
import {
  mapSolicitud,
  mapSeguimiento,
  mapEvidencia,
  mapHistorialItem,
  mapAsignacion,
} from './mappers.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// ---------------------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------------------

/**
 * GET /api/solicitudes con filtros opcionales del servidor.
 * Parámetros aceptados: estado, texto, desde, hasta, categoriaId,
 * prioridadId, responsableId, sinAsignar (todos opcionales).
 */
export async function getSolicitudes(params = {}) {
  const qs = buildQS(params);
  const data = await apiGet(`/api/solicitudes${qs}`);
  return (data ?? []).map(mapSolicitud);
}

/** GET /api/solicitudes/{id} */
export async function getSolicitudById(id) {
  const data = await apiGet(`/api/solicitudes/${id}`);
  return mapSolicitud(data);
}

/** GET /api/solicitudes/codigo/{codigo} */
export async function getSolicitudByCodigo(codigo) {
  const data = await apiGet(`/api/solicitudes/codigo/${encodeURIComponent(codigo)}`);
  return mapSolicitud(data);
}

/** Busca solicitud por ID numérico o por código (SIG-...) de forma defensiva */
export async function getSolicitudAny(param) {
  if (!param) return null;
  const str = String(param).trim();
  if (/^\d+$/.test(str)) {
    try {
      return await getSolicitudById(Number(str));
    } catch {
      return await getSolicitudByCodigo(str);
    }
  }
  return await getSolicitudByCodigo(str);
}

/** GET /api/solicitudes/estados */
export async function getEstados() {
  return apiGet('/api/solicitudes/estados');
}

// ---------------------------------------------------------------------------
// FUTURO: cuando el backend soporte filtro solicitanteId en /api/solicitudes?solicitanteId=X,
// cambiar solo esta función para llamar a getSolicitudes({ solicitanteId }) en lugar de
// filtrar en el cliente.
// ---------------------------------------------------------------------------

/**
 * Devuelve las solicitudes del mismo solicitante, excluyendo la actual.
 * Filtra en el cliente porque el backend actual aún no dispone de ?solicitanteId.
 * @param {number|string|null} solicitanteId - ID del solicitante
 * @param {number|string|null} excluirSolicitudId - ID numérico o código a excluir
 * @returns {Promise<Array>}
 */
export async function getSolicitudesPorSolicitante(solicitanteId, excluirSolicitudId = null) {
  if (!solicitanteId) return [];

  let solicitudes = [];
  if (USE_MOCKS) {
    const { getSolicitudesPorSolicitanteMock } = await import('../mocks/solicitudes.js');
    return getSolicitudesPorSolicitanteMock(solicitanteId, excluirSolicitudId);
  }

  solicitudes = await getSolicitudes();

  return solicitudes.filter((s) => {
    if (String(s.solicitanteId) !== String(solicitanteId)) return false;
    if (excluirSolicitudId != null) {
      if (s.id != null && String(s.id) === String(excluirSolicitudId)) return false;
      if (s.codigo && String(s.codigo) === String(excluirSolicitudId)) return false;
    }
    return true;
  });
}

/**
 * POST /api/solicitudes
 * Body: { titulo, descripcion, ubicacion }
 */
export async function crearSolicitud(payload) {
  const data = await apiPost('/api/solicitudes', {
    titulo:      payload.titulo,
    descripcion: payload.descripcion,
    ubicacion:   payload.ubicacion,
  });
  return mapSolicitud(data);
}

/**
 * PUT /api/solicitudes/{id}/estado
 * Body: { estado, observacion?, solucion? }
 * El campo `estado` debe ser el enum del backend (ej. "EN_ATENCION").
 */
export async function cambiarEstado(id, estadoApi, opciones = {}) {
  const body = { estado: estadoApi };
  if (opciones.observacion) body.observacion = opciones.observacion;
  if (opciones.solucion)    body.solucion    = opciones.solucion;
  const data = await apiPut(`/api/solicitudes/${id}/estado`, body);
  return mapSolicitud(data);
}

/**
 * PUT /api/solicitudes/{id}/clasificacion
 * Body: { categoriaId, prioridadId, areaId, fechaLimite? }
 */
export async function clasificarSolicitud(id, payload) {
  const body = {
    categoriaId:  payload.categoriaId,
    prioridadId:  payload.prioridadId,
    areaId:       payload.areaId,
  };
  if (payload.fechaLimite) body.fechaLimite = payload.fechaLimite;
  const data = await apiPut(`/api/solicitudes/${id}/clasificacion`, body);
  return mapSolicitud(data);
}

// ---------------------------------------------------------------------------
// Seguimientos (comentarios / notas de avance)
// ---------------------------------------------------------------------------

/** GET /api/solicitudes/{id}/seguimientos */
export async function getSeguimientos(solicitudId) {
  const data = await apiGet(`/api/solicitudes/${solicitudId}/seguimientos`);
  return (data ?? []).map(mapSeguimiento);
}

/** POST /api/solicitudes/{id}/seguimientos  — body: { contenido } */
export async function addSeguimiento(solicitudId, contenido) {
  const data = await apiPost(`/api/solicitudes/${solicitudId}/seguimientos`, { contenido });
  return mapSeguimiento(data);
}

// ---------------------------------------------------------------------------
// Evidencias
// ---------------------------------------------------------------------------

/** GET /api/solicitudes/{id}/evidencias */
export async function getEvidencias(solicitudId) {
  const data = await apiGet(`/api/solicitudes/${solicitudId}/evidencias`);
  return (data ?? []).map(mapEvidencia);
}

/**
 * POST /api/solicitudes/{id}/evidencias
 * SUPUESTO: el backend acepta multipart/form-data con campo "archivo".
 * El contrato OpenAPI declara application/json con binary, pero lo habitual
 * en Spring Boot es multipart. Si el backend requiere otro campo, ajustar
 * en apiClient.apiUpload. Registrado en §diagnóstico §9.3.
 * @param {number} solicitudId
 * @param {File} file
 * @param {number|null} seguimientoId - opcional, asocia la evidencia a un seguimiento
 */
export async function subirEvidencia(solicitudId, file, seguimientoId = null) {
  const form = new FormData();
  // SUPUESTO: el campo se llama "archivo". Puede ser "file" o "multipartFile"; confirmación pendiente.
  form.append('archivo', file);
  if (seguimientoId != null) form.append('seguimientoId', String(seguimientoId));

  const data = await fetch(
    `${import.meta.env.VITE_API_URL ?? ''}/api/solicitudes/${solicitudId}/evidencias`,
    {
      method:  'POST',
      headers: buildAuthHeaders(),
      body:    form,
    }
  );
  if (!data.ok) {
    const body = await data.json().catch(() => null);
    const err  = new Error(
      data.status === 413
        ? 'El archivo supera el tamaño máximo permitido por el servidor.'
        : body?.message ?? `Error al subir evidencia (${data.status}).`
    );
    err.status = data.status;
    throw err;
  }
  const json = await data.json().catch(() => null);
  return mapEvidencia(json);
}

// ---------------------------------------------------------------------------
// Historial de estados
// ---------------------------------------------------------------------------

/** GET /api/solicitudes/{id}/historial */
export async function getHistorial(solicitudId) {
  const data = await apiGet(`/api/solicitudes/${solicitudId}/historial`);
  return (data ?? []).map(mapHistorialItem);
}

// ---------------------------------------------------------------------------
// Asignaciones
// ---------------------------------------------------------------------------

/** POST /api/solicitudes/{solicitudId}/asignaciones  — body: { tecnicoId } */
export async function asignarTecnico(solicitudId, tecnicoId) {
  const data = await apiPost(`/api/solicitudes/${solicitudId}/asignaciones`, { tecnicoId });
  return mapAsignacion(data);
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function buildQS(params) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

function buildAuthHeaders() {
  const token = sessionStorage.getItem('sigsu.token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

