/** src/services/catalogos.js — Categorías, Áreas, Prioridades y Estados */
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient.js';
import { mapCatalogo } from './mappers.js';

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------
export async function getCategorias() {
  return (await apiGet('/api/categorias')).map(mapCatalogo);
}

export async function crearCategoria(body) {
  const payload = {
    codigo: body.codigo,
    nombre: body.nombre,
    activo: typeof body.activo === 'boolean' ? body.activo : true,
  };
  return mapCatalogo(await apiPost('/api/categorias', payload));
}

export async function actualizarCategoria(id, body) {
  const payload = {
    codigo: body.codigo,
    nombre: body.nombre,
    activo: typeof body.activo === 'boolean' ? body.activo : true,
  };
  return mapCatalogo(await apiPut(`/api/categorias/${id}`, payload));
}

/** Desactivación lógica enviando siempre codigo, nombre y activo: false */
export async function desactivarCategoria(id, itemActual) {
  return actualizarCategoria(id, {
    codigo: itemActual.codigo,
    nombre: itemActual.nombre,
    activo: false,
  });
}

export async function eliminarCategoria(id) {
  return apiDelete(`/api/categorias/${id}`);
}

// ---------------------------------------------------------------------------
// Áreas
// ---------------------------------------------------------------------------
export async function getAreas() {
  return (await apiGet('/api/areas')).map(mapCatalogo);
}

export async function crearArea(body) {
  const payload = {
    codigo: body.codigo,
    nombre: body.nombre,
    activo: typeof body.activo === 'boolean' ? body.activo : true,
  };
  return mapCatalogo(await apiPost('/api/areas', payload));
}

export async function actualizarArea(id, body) {
  const payload = {
    codigo: body.codigo,
    nombre: body.nombre,
    activo: typeof body.activo === 'boolean' ? body.activo : true,
  };
  return mapCatalogo(await apiPut(`/api/areas/${id}`, payload));
}

/** Desactivación lógica enviando siempre codigo, nombre y activo: false */
export async function desactivarArea(id, itemActual) {
  return actualizarArea(id, {
    codigo: itemActual.codigo,
    nombre: itemActual.nombre,
    activo: false,
  });
}

export async function eliminarArea(id) {
  return apiDelete(`/api/areas/${id}`);
}

// ---------------------------------------------------------------------------
// Prioridades
// ---------------------------------------------------------------------------
export async function getPrioridades() {
  return (await apiGet('/api/prioridades')).map(mapCatalogo);
}

export async function crearPrioridad(body) {
  const payload = {
    codigo: body.codigo,
    nombre: body.nombre,
    nivel:  Number(body.nivel),
    activo: typeof body.activo === 'boolean' ? body.activo : true,
  };
  return mapCatalogo(await apiPost('/api/prioridades', payload));
}

export async function actualizarPrioridad(id, body) {
  const payload = {
    codigo: body.codigo,
    nombre: body.nombre,
    nivel:  Number(body.nivel),
    activo: typeof body.activo === 'boolean' ? body.activo : true,
  };
  return mapCatalogo(await apiPut(`/api/prioridades/${id}`, payload));
}

/** Desactivación lógica enviando siempre codigo, nombre, nivel y activo: false */
export async function desactivarPrioridad(id, itemActual) {
  return actualizarPrioridad(id, {
    codigo: itemActual.codigo,
    nombre: itemActual.nombre,
    nivel:  Number(itemActual.nivel),
    activo: false,
  });
}

export async function eliminarPrioridad(id) {
  return apiDelete(`/api/prioridades/${id}`);
}

// ---------------------------------------------------------------------------
// Estados (Solo lectura)
// ---------------------------------------------------------------------------
export async function getEstados() {
  return apiGet('/api/solicitudes/estados');
}
