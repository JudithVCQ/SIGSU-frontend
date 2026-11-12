/** src/services/catalogos.js — Categorías, Áreas y Prioridades */
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient.js';
import { mapCatalogo } from './mappers.js';

// Categorías
export async function getCategorias()          { return (await apiGet('/api/categorias')).map(mapCatalogo); }
export async function crearCategoria(body)     { return mapCatalogo(await apiPost('/api/categorias', body)); }
export async function actualizarCategoria(id, body) { return mapCatalogo(await apiPut(`/api/categorias/${id}`, body)); }
export async function eliminarCategoria(id)    { return apiDelete(`/api/categorias/${id}`); }

// Áreas
export async function getAreas()               { return (await apiGet('/api/areas')).map(mapCatalogo); }
export async function crearArea(body)          { return mapCatalogo(await apiPost('/api/areas', body)); }
export async function actualizarArea(id, body) { return mapCatalogo(await apiPut(`/api/areas/${id}`, body)); }
export async function eliminarArea(id)         { return apiDelete(`/api/areas/${id}`); }

// Prioridades
export async function getPrioridades()         { return (await apiGet('/api/prioridades')).map(mapCatalogo); }
export async function crearPrioridad(body)     { return mapCatalogo(await apiPost('/api/prioridades', body)); }
export async function actualizarPrioridad(id, body) { return mapCatalogo(await apiPut(`/api/prioridades/${id}`, body)); }
export async function eliminarPrioridad(id)    { return apiDelete(`/api/prioridades/${id}`); }

