import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calificacionDisponible,
  esCalificable,
  getCalificacion,
  calificarSolicitud,
  validarCalificacion,
  getResumenCalificaciones,
} from '../services/calificaciones.js';
import { resetCalificacionesMock } from '../mocks/calificaciones.js';

const resuelta = { codigo: 'SIG-00118', estadoApi: 'RESUELTA', estado: 'Resuelta' };

describe('services/calificaciones.js (modo mocks)', () => {
  beforeEach(() => resetCalificacionesMock());

  it('la funcionalidad está disponible en modo mocks', () => {
    expect(calificacionDisponible()).toBe(true);
  });

  it('solo son calificables las solicitudes RESUELTA o CERRADA', () => {
    expect(esCalificable({ estadoApi: 'RESUELTA' })).toBe(true);
    expect(esCalificable({ estado: 'Cerrada' })).toBe(true);
    expect(esCalificable({ estadoApi: 'EN_ATENCION' })).toBe(false);
    expect(esCalificable(null)).toBe(false);
  });

  it('califica una solicitud resuelta y luego la devuelve', async () => {
    expect(await getCalificacion(resuelta)).toBeNull();
    const nueva = await calificarSolicitud(resuelta, { puntaje: 4, comentario: '  Buen trabajo  ' });
    expect(nueva).toMatchObject({ solicitudCodigo: 'SIG-00118', puntaje: 4, comentario: 'Buen trabajo' });
    expect(await getCalificacion(resuelta)).toMatchObject({ puntaje: 4 });
  });

  it('no permite calificar dos veces la misma solicitud', async () => {
    await calificarSolicitud(resuelta, { puntaje: 5 });
    await expect(calificarSolicitud(resuelta, { puntaje: 3 })).rejects.toThrow('ya fue calificada');
  });

  it('rechaza solicitudes que no están resueltas ni cerradas', async () => {
    await expect(
      calificarSolicitud({ codigo: 'SIG-00129', estadoApi: 'ASIGNADA' }, { puntaje: 5 }),
    ).rejects.toThrow('resuelta o cerrada');
  });

  it('valida puntaje entero de 1 a 5 y comentario de hasta 500 caracteres', async () => {
    expect(validarCalificacion({ puntaje: 0 })).not.toBe('');
    expect(validarCalificacion({ puntaje: 6 })).not.toBe('');
    expect(validarCalificacion({ puntaje: 3.5 })).not.toBe('');
    expect(validarCalificacion({ puntaje: 1 })).toBe('');
    expect(validarCalificacion({ puntaje: 5, comentario: 'x'.repeat(500) })).toBe('');
    expect(validarCalificacion({ puntaje: 5, comentario: 'x'.repeat(501) })).toContain('500');
    await expect(calificarSolicitud(resuelta, { puntaje: 9 })).rejects.toThrow('de 1 a 5');
  });

  it('el resumen calcula promedio, total y promedio por técnico ordenado', async () => {
    // Semillas: Diego Morales 5 y 4; Carlos Peña 3 y 5
    const r = await getResumenCalificaciones();
    expect(r.total).toBe(4);
    expect(r.promedio).toBeCloseTo(4.25);
    expect(r.porTecnico).toEqual([
      { responsable: 'Diego Morales', promedio: 4.5, total: 2 },
      { responsable: 'Carlos Peña', promedio: 4, total: 2 },
    ]);
  });

  it('el resumen incluye las nuevas calificaciones', async () => {
    await calificarSolicitud(resuelta, { puntaje: 1 }); // SIG-00118 → Carlos Peña
    const r = await getResumenCalificaciones();
    expect(r.total).toBe(5);
    expect(r.porTecnico.find((t) => t.responsable === 'Carlos Peña')).toMatchObject({ total: 3, promedio: 3 });
  });
});

describe('services/calificaciones.js (modo API real, sin endpoint en backend)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('no está disponible, no llama a fetch y devuelve null', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false');
    vi.resetModules();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const svc = await import('../services/calificaciones.js');

    expect(svc.calificacionDisponible()).toBe(false);
    expect(await svc.getCalificacion(resuelta)).toBeNull();
    expect(await svc.getResumenCalificaciones()).toBeNull();
    await expect(svc.calificarSolicitud(resuelta, { puntaje: 5 })).rejects.toThrow('no está disponible');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
