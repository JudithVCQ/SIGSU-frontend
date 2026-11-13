/** src/services/dashboard.js — Indicadores de supervisión */
import { apiGet } from './apiClient.js';
import { mapDashboard } from './mappers.js';

/**
 * GET /api/dashboard con filtros opcionales:
 * desde (date), hasta (date), categoriaId (int), prioridadId (int)
 */
export async function getDashboard(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const qs = entries.length
    ? '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    : '';
  const data = await apiGet(`/api/dashboard${qs}`);
  return mapDashboard(data);
}

