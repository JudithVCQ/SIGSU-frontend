import { describe, it, expect } from 'vitest';
import {
  calcularFechaLimite,
  esVencida,
  obtenerFechaRegistro,
} from '../config/vigencia.js';

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
