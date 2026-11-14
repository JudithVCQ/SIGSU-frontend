import { describe, it, expect } from 'vitest';
import { saludoSegunHora } from '../config/saludo.js';

const a = (h, m = 0) => new Date(2026, 10, 13, h, m);

describe('saludoSegunHora (hora local)', () => {
  it('Buenos días de 5:00 a 11:59', () => {
    expect(saludoSegunHora(a(5))).toBe('Buenos días');
    expect(saludoSegunHora(a(11, 59))).toBe('Buenos días');
  });

  it('Buenas tardes de 12:00 a 18:59', () => {
    expect(saludoSegunHora(a(12))).toBe('Buenas tardes');
    expect(saludoSegunHora(a(18, 59))).toBe('Buenas tardes');
  });

  it('Buenas noches de 19:00 a 4:59', () => {
    expect(saludoSegunHora(a(19))).toBe('Buenas noches');
    expect(saludoSegunHora(a(23, 59))).toBe('Buenas noches');
    expect(saludoSegunHora(a(0))).toBe('Buenas noches');
    expect(saludoSegunHora(a(4, 59))).toBe('Buenas noches');
  });
});
