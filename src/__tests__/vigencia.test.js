import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calcularFechaLimite,
  esVencida,
  obtenerFechaRegistro,
  obtenerFechaLimite,
  describirPlazo,
  aFechaInput,
  fechaInputAIso,
} from '../config/vigencia.js';

// Fechas construidas en hora local para que las pruebas no dependan de la zona horaria.
const local = (d, h = 0, m = 0, s = 0) => new Date(2026, 10, d, h, m, s); // noviembre 2026
const finDelDia = (d) => local(d, 23, 59, 59).toISOString();

describe('config/vigencia.js: fechaLimite (modo mocks)', () => {
  const ahora = local(13, 10); // 13 nov 2026, 10:00

  describe('obtenerFechaLimite', () => {
    it('usa fechaLimite de la solicitud aunque haya prioridad y fecha de registro', () => {
      const s = { fechaLimite: finDelDia(20), prioridad: 'Alta', fechaRegistro: local(10) };
      expect(obtenerFechaLimite(s).getTime()).toBe(local(20, 23, 59, 59).getTime());
    });

    it('acepta fechaLimite como Date', () => {
      const d = local(15);
      expect(obtenerFechaLimite({ fechaLimite: d })).toBe(d);
    });

    it('en mocks usa VIGENCIA como respaldo si no hay fechaLimite', () => {
      const s = { prioridad: 'Media', fechaRegistro: local(10, 9) };
      expect(obtenerFechaLimite(s).getTime()).toBe(local(15, 9).getTime());
    });

    it('ignora fechaLimite inválida y usa el respaldo', () => {
      const s = { fechaLimite: 'no-es-fecha', prioridad: 'Alta', fechaRegistro: local(10, 9) };
      expect(obtenerFechaLimite(s).getTime()).toBe(local(12, 9).getTime());
    });

    it('retorna null sin solicitud ni datos', () => {
      expect(obtenerFechaLimite(null)).toBeNull();
      expect(obtenerFechaLimite({})).toBeNull();
    });
  });

  describe('esVencida con fechaLimite', () => {
    it('true cuando fechaLimite ya pasó', () => {
      expect(esVencida({ fechaLimite: finDelDia(12), estadoApi: 'EN_ATENCION' }, ahora)).toBe(true);
    });

    it('false cuando fechaLimite es hoy al final del día', () => {
      expect(esVencida({ fechaLimite: finDelDia(13), estadoApi: 'EN_ATENCION' }, ahora)).toBe(false);
    });

    it('false si está resuelta aunque fechaLimite haya pasado', () => {
      expect(esVencida({ fechaLimite: finDelDia(1), estado: 'Resuelta' }, ahora)).toBe(false);
    });
  });

  describe('describirPlazo', () => {
    const conLimite = (d) => ({ fechaLimite: finDelDia(d), estadoApi: 'ASIGNADA' });

    it('vence hoy', () => {
      expect(describirPlazo(conLimite(13), ahora)).toMatchObject({ estado: 'vigente', texto: 'Vence hoy' });
    });

    it('vence en 1 día (singular)', () => {
      expect(describirPlazo(conLimite(14), ahora)).toMatchObject({ estado: 'vigente', texto: 'Vence en 1 día' });
    });

    it('vence en N días', () => {
      expect(describirPlazo(conLimite(16), ahora)).toMatchObject({ estado: 'vigente', texto: 'Vence en 3 días' });
    });

    it('vencida hace 1 día (singular)', () => {
      expect(describirPlazo(conLimite(12), ahora)).toMatchObject({ estado: 'vencida', texto: 'Vencida hace 1 día' });
    });

    it('vencida hace N días', () => {
      expect(describirPlazo(conLimite(9), ahora)).toMatchObject({ estado: 'vencida', texto: 'Vencida hace 4 días' });
    });

    it('vencida hoy cuando el límite pasó más temprano el mismo día', () => {
      const s = { fechaLimite: local(13, 8).toISOString(), estadoApi: 'EN_ATENCION' };
      expect(describirPlazo(s, ahora)).toMatchObject({ estado: 'vencida', texto: 'Vencida hoy' });
    });

    it('finalizada (sin cuenta regresiva) si está resuelta o cerrada', () => {
      const r = describirPlazo({ fechaLimite: finDelDia(9), estadoApi: 'CERRADA' }, ahora);
      expect(r.estado).toBe('finalizada');
      expect(r.texto).toBe('');
      expect(r.fecha.getTime()).toBe(local(9, 23, 59, 59).getTime());
    });

    it('retorna null si no hay fecha límite', () => {
      expect(describirPlazo({ estadoApi: 'ASIGNADA' }, ahora)).toBeNull();
      expect(describirPlazo(null, ahora)).toBeNull();
    });
  });

  describe('aFechaInput / fechaInputAIso', () => {
    it('aFechaInput usa la fecha local, también a las 23:59', () => {
      expect(aFechaInput(local(13, 23, 59, 59))).toBe('2026-11-13');
      expect(aFechaInput(local(1, 0, 0, 0))).toBe('2026-11-01');
    });

    it('aFechaInput retorna cadena vacía ante valores inválidos', () => {
      expect(aFechaInput(null)).toBe('');
      expect(aFechaInput(new Date('x'))).toBe('');
    });

    it('fechaInputAIso devuelve el fin del día local y es reversible con aFechaInput', () => {
      const iso = fechaInputAIso('2026-11-15');
      expect(new Date(iso).getTime()).toBe(local(15, 23, 59, 59).getTime());
      expect(aFechaInput(new Date(iso))).toBe('2026-11-15');
    });

    it('fechaInputAIso retorna null si no hay valor o es inválido', () => {
      expect(fechaInputAIso('')).toBeNull();
      expect(fechaInputAIso('no-es-fecha')).toBeNull();
    });
  });
});

describe('config/vigencia.js: modo API real (VITE_USE_MOCKS=false)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function importarEnModoApi() {
    vi.stubEnv('VITE_USE_MOCKS', 'false');
    vi.resetModules();
    return import('../config/vigencia.js');
  }

  const ahora = local(13, 10);

  it('usa fechaLimite cuando el backend la devuelve', async () => {
    const v = await importarEnModoApi();
    const s = { fechaLimite: finDelDia(12), estadoApi: 'EN_ATENCION' };
    expect(v.obtenerFechaLimite(s)).not.toBeNull();
    expect(v.esVencida(s, ahora)).toBe(true);
    expect(v.describirPlazo(s, ahora)).toMatchObject({ estado: 'vencida', texto: 'Vencida hace 1 día' });
  });

  it('sin fechaLimite no calcula con VIGENCIA: null y no vencida', async () => {
    const v = await importarEnModoApi();
    const s = { prioridad: 'Alta', creadoEn: local(1).toISOString(), estadoApi: 'EN_ATENCION' };
    expect(v.obtenerFechaLimite(s)).toBeNull();
    expect(v.esVencida(s, ahora)).toBe(false);
    expect(v.describirPlazo(s, ahora)).toBeNull();
  });
});

describe('config/vigencia.js', () => {
  // Fecha fija base para los tests: 2026-10-10T10:00:00.000Z
  const fechaRegistroFija = new Date('2026-10-10T10:00:00.000Z');

  describe('obtenerFechaRegistro', () => {
    it('obtiene la fecha cuando se proporciona como Date en fechaRegistro', () => {
      const res = obtenerFechaRegistro({ fechaRegistro: fechaRegistroFija });
      expect(res).toEqual(fechaRegistroFija);
    });

    it('parsea string ISO en fechaRegistro', () => {
      const res = obtenerFechaRegistro({ fechaRegistro: '2026-10-10T10:00:00.000Z' });
      expect(res.getTime()).toBe(fechaRegistroFija.getTime());
    });

    it('utiliza creadoEn si fechaRegistro no está presente', () => {
      const res = obtenerFechaRegistro({ creadoEn: '2026-10-10T10:00:00.000Z' });
      expect(res.getTime()).toBe(fechaRegistroFija.getTime());
    });

    it('retorna null ante solicitudes sin fecha válida', () => {
      expect(obtenerFechaRegistro(null)).toBeNull();
      expect(obtenerFechaRegistro({})).toBeNull();
      expect(obtenerFechaRegistro({ fechaRegistro: 'fecha-invalida' })).toBeNull();
    });
  });

  describe('calcularFechaLimite', () => {
    it('calcula fecha límite para prioridad Alta (+2 días)', () => {
      const solicitud = {
        fechaRegistro: fechaRegistroFija,
        prioridad: 'Alta',
      };
      const limite = calcularFechaLimite(solicitud);
      expect(limite).not.toBeNull();

      // Esperado: 2026-10-12 a la misma hora
      const esperado = new Date(fechaRegistroFija.getTime());
      esperado.setDate(esperado.getDate() + 2);
      expect(limite.getTime()).toBe(esperado.getTime());
    });

    it('calcula fecha límite para prioridad Media (+5 días)', () => {
      const solicitud = {
        fechaRegistro: fechaRegistroFija,
        prioridad: 'Media',
      };
      const limite = calcularFechaLimite(solicitud);
      const esperado = new Date(fechaRegistroFija.getTime());
      esperado.setDate(esperado.getDate() + 5);
      expect(limite.getTime()).toBe(esperado.getTime());
    });

    it('calcula fecha límite para prioridad Baja (+10 días)', () => {
      const solicitud = {
        fechaRegistro: fechaRegistroFija,
        prioridad: 'Baja',
      };
      const limite = calcularFechaLimite(solicitud);
      const esperado = new Date(fechaRegistroFija.getTime());
      esperado.setDate(esperado.getDate() + 10);
      expect(limite.getTime()).toBe(esperado.getTime());
    });

    it('aplica plazo por defecto sin prioridad (+2 días)', () => {
      const solicitud = {
        fechaRegistro: fechaRegistroFija,
        prioridad: null,
      };
      const limite = calcularFechaLimite(solicitud);
      const esperado = new Date(fechaRegistroFija.getTime());
      esperado.setDate(esperado.getDate() + 2);
      expect(limite.getTime()).toBe(esperado.getTime());
    });

    it('retorna null si la solicitud es nula o no tiene fecha', () => {
      expect(calcularFechaLimite(null)).toBeNull();
      expect(calcularFechaLimite({})).toBeNull();
    });
  });

  describe('esVencida (usando fechas fijas de referencia)', () => {
    const solicitudAlta = {
      fechaRegistro: new Date('2026-10-10T10:00:00.000Z'),
      prioridad: 'Alta', // límite: 2026-10-12T10:00:00.000Z
      estadoApi: 'EN_ATENCION',
    };

    it('retorna false cuando la fecha fija de referencia es anterior a la fecha límite', () => {
      const fechaAntes = new Date('2026-10-11T12:00:00.000Z');
      expect(esVencida(solicitudAlta, fechaAntes)).toBe(false);
    });

    it('retorna false exactamente en la fecha límite', () => {
      const fechaExacta = new Date('2026-10-12T10:00:00.000Z');
      expect(esVencida(solicitudAlta, fechaExacta)).toBe(false);
    });

    it('retorna true cuando la fecha fija de referencia ha superado la fecha límite', () => {
      const fechaDespues = new Date('2026-10-12T10:00:01.000Z');
      expect(esVencida(solicitudAlta, fechaDespues)).toBe(true);
    });

    it('retorna false si la solicitud ya está RESUELTA aunque la fecha haya pasado', () => {
      const fechaDespues = new Date('2026-10-20T00:00:00.000Z');
      const resueltaApi = { ...solicitudAlta, estadoApi: 'RESUELTA' };
      const resueltaUi = { fechaRegistro: solicitudAlta.fechaRegistro, prioridad: 'Alta', estado: 'Resuelta' };

      expect(esVencida(resueltaApi, fechaDespues)).toBe(false);
      expect(esVencida(resueltaUi, fechaDespues)).toBe(false);
    });

    it('retorna false si la solicitud está CERRADA aunque la fecha haya pasado', () => {
      const fechaDespues = new Date('2026-10-20T00:00:00.000Z');
      const cerradaApi = { ...solicitudAlta, estadoApi: 'CERRADA' };
      const cerradaUi = { fechaRegistro: solicitudAlta.fechaRegistro, prioridad: 'Alta', estado: 'Cerrada' };

      expect(esVencida(cerradaApi, fechaDespues)).toBe(false);
      expect(esVencida(cerradaUi, fechaDespues)).toBe(false);
    });

    it('retorna false si la solicitud es nula o inválida', () => {
      const fechaDespues = new Date('2026-10-20T00:00:00.000Z');
      expect(esVencida(null, fechaDespues)).toBe(false);
      expect(esVencida({}, fechaDespues)).toBe(false);
    });
  });
});
