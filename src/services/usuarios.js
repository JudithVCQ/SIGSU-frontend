/** src/services/usuarios.js — Gestión de usuarios */
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient.js';
import { mapUsuario } from './mappers.js';

export async function getUsuarios() {
  return (await apiGet('/api/usuarios')).map(mapUsuario);
}

export async function getTecnicos(areaId) {
  const qs = areaId ? `?areaId=${areaId}` : '';
  return (await apiGet(`/api/usuarios/tecnicos${qs}`)).map(mapUsuario);
}

export async function getRoles() {
  return apiGet('/api/usuarios/roles');
}

/**
 * POST /api/usuarios
 * Según openapi.json (CrearUsuarioRequest): NO acepta areaId.
 * Payload: { nombres, apellidos, correo, contrasena, rol }
 */
export async function registrarUsuario(body) {
  const payload = {
    nombres:    body.nombres,
    apellidos:  body.apellidos,
    correo:     body.correo,
    contrasena: body.contrasena,
    rol:        body.rol,
  };
  return mapUsuario(await apiPost('/api/usuarios', payload));
}

/**
 * PUT /api/usuarios/{id}
 * Según openapi.json (ActualizarUsuarioRequest):
 * Exige nombres, apellidos y correo.
 * Envía SIEMPRE nombres, apellidos, correo, areaId y activo.
 */
export async function actualizarUsuario(id, body) {
  const payload = {
    nombres:   body.nombres,
    apellidos: body.apellidos,
    correo:    body.correo,
    areaId:    body.areaId !== undefined && body.areaId !== null && body.areaId !== '' ? Number(body.areaId) : null,
    activo:    typeof body.activo === 'boolean' ? body.activo : true,
  };
  return mapUsuario(await apiPut(`/api/usuarios/${id}`, payload));
}

export async function cambiarRol(id, rol) {
  return mapUsuario(await apiPut(`/api/usuarios/${id}/rol`, { rol }));
}

/**
 * Desactiva un usuario enviando todos los campos requeridos por ActualizarUsuarioRequest
 * con activo: false (desactivación lógica para cumplir RN-009).
 */
export async function desactivarUsuario(id, datos) {
  let nombres = (datos.nombres || '').trim();
  let apellidos = (datos.apellidos || '').trim();
  if (!nombres && datos.nombre) {
    const parts = datos.nombre.trim().split(/\s+/);
    nombres = parts[0] || 'Usuario';
    apellidos = parts.slice(1).join(' ') || apellidos || '.';
  }
  return actualizarUsuario(id, {
    nombres,
    apellidos,
    correo: datos.correo,
    areaId: datos.areaId ? Number(datos.areaId) : null,
    activo: false,
  });
}

/**
 * Reactiva un usuario enviando todos los campos requeridos por ActualizarUsuarioRequest
 * con activo: true.
 */
export async function activarUsuario(id, datos) {
  let nombres = (datos.nombres || '').trim();
  let apellidos = (datos.apellidos || '').trim();
  if (!nombres && datos.nombre) {
    const parts = datos.nombre.trim().split(/\s+/);
    nombres = parts[0] || 'Usuario';
    apellidos = parts.slice(1).join(' ') || apellidos || '.';
  }
  return actualizarUsuario(id, {
    nombres,
    apellidos,
    correo: datos.correo,
    areaId: datos.areaId ? Number(datos.areaId) : null,
    activo: true,
  });
}

export async function eliminarUsuario(id) {
  return apiDelete(`/api/usuarios/${id}`);
}
