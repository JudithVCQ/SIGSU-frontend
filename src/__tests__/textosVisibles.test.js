import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Recorre los componentes .jsx y comprueba textos visibles (sin contar comentarios)
const SRC = path.resolve(__dirname, '..');

function archivosJsx(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : archivosJsx(p);
    return e.name.endsWith('.jsx') ? [p] : [];
  });
}

const sinComentarios = (codigo) =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // {/* ... */} de JSX
    .replace(/\/\*[\s\S]*?\*\//g, '')     // /* ... */
    .replace(/(^|[^:])\/\/.*$/gm, '$1');  // // ... (sin romper "https://")

const archivos = archivosJsx(SRC);

describe('Textos visibles', () => {
  it('no muestran códigos internos de reglas de negocio (RN-xxx, RF-xxx, HU-xx)', () => {
    const hallazgos = archivos.flatMap((f) => {
      const m = sinComentarios(fs.readFileSync(f, 'utf8')).match(/\b(RN|RF|HU)-?\d{2,3}\b/g);
      return m ? [`${path.relative(SRC, f)}: ${m.join(', ')}`] : [];
    });
    expect(hallazgos).toEqual([]);
  });
});
