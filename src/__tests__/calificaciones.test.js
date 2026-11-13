// @vitest-environment jsdom
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

describe('services/calificaciones.js (modo API real sin endpoint: vista previa local)', () => {
  let svc;
  let local;

  beforeEach(async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false');
    vi.resetModules();
    svc = await import('../services/calificaciones.js');
    local = await import('../services/calificacionesLocal.js');
    local.resetCalificacionesLocal();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  // Solicitudes como las devuelve mapSolicitud en modo API
  const real1 = { id: 501, codigo: 'SOL-501', estadoApi: 'CERRADA', responsable: 'Ana Torres', responsableId: 7 };
  const real2 = { id: 502, codigo: 'SOL-502', estadoApi: 'RESUELTA', responsable: 'Ana Torres', responsableId: 7 };
  const real3 = { id: 503, codigo: 'SOL-503', estadoApi: 'RESUELTA', responsable: 'Luis Ramos', responsableId: 8 };

  it('funciona como vista previa local y no llama a fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    expect(svc.modoCalificacion()).toBe('local');
    expect(svc.calificacionDisponible()).toBe(true);
    expect(svc.esVistaPreviaLocal()).toBe(true);

    expect(await svc.getCalificacion(real1)).toBeNull();
    await svc.calificarSolicitud(real1, { puntaje: 4, comentario: 'Bien' });
    expect(await svc.getCalificacion(real1)).toMatchObject({ puntaje: 4, comentario: 'Bien', responsable: 'Ana Torres' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('guarda en localStorage (persiste entre recargas del módulo)', async () => {
    await svc.calificarSolicitud(real1, { puntaje: 5 });
    expect(JSON.parse(localStorage.getItem('sigsu.calificaciones.local'))).toHaveLength(1);

    vi.resetModules();
    const svc2 = await import('../services/calificaciones.js');
    expect(await svc2.getCalificacion(real1)).toMatchObject({ puntaje: 5 });
  });

  it('no permite calificar dos veces la misma solicitud', async () => {
    await svc.calificarSolicitud(real1, { puntaje: 5 });
    await expect(svc.calificarSolicitud(real1, { puntaje: 1 })).rejects.toThrow('ya fue calificada');
  });

  it('el resumen agrupa por técnico real', async () => {
    await svc.calificarSolicitud(real1, { puntaje: 5 });
    await svc.calificarSolicitud(real2, { puntaje: 3 });
    await svc.calificarSolicitud(real3, { puntaje: 5 });

    const r = await svc.getResumenCalificaciones();
    expect(r.total).toBe(3);
    expect(r.promedio).toBeCloseTo(13 / 3);
    expect(r.porTecnico).toEqual([
      { responsable: 'Luis Ramos', promedio: 5, total: 1 },
      { responsable: 'Ana Torres', promedio: 4, total: 2 },
    ]);
  });

  it('resumen vacío sin calificaciones', async () => {
    expect(await svc.getResumenCalificaciones()).toEqual({ promedio: null, total: 0, porTecnico: [] });
  });
});
