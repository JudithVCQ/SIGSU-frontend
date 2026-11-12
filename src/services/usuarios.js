/** src/services/usuarios.js — Gestión de usuarios */
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient.js';
import { mapUsuario } from './mappers.js';

export async function getUsuarios()              { return (await apiGet('/api/usuarios')).map(mapUsuario); }
export async function getTecnicos(areaId)        {
  const qs = areaId ? `?areaId=${areaId}` : '';
  return (await apiGet(`/api/usuarios/tecnicos${qs}`)).map(mapUsuario);
}
export async function getRoles()                 { return apiGet('/api/usuarios/roles'); }

export async function registrarUsuario(body)     { return mapUsuario(await apiPost('/api/usuarios', body)); }
export async function actualizarUsuario(id, body){ return mapUsuario(await apiPut(`/api/usuarios/${id}`, body)); }
export async function cambiarRol(id, rol)        { return mapUsuario(await apiPut(`/api/usuarios/${id}/rol`, { rol })); }
export async function eliminarUsuario(id)        { return apiDelete(`/api/usuarios/${id}`); }

