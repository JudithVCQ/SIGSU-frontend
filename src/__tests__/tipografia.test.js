import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..');

function archivos(dir, ext) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : archivos(p, ext);
    return e.name.endsWith(ext) ? [p] : [];
  });
}

const rel = (f) => path.relative(SRC, f);

describe('Tipografía', () => {
  it('ningún CSS usa tamaños de letra por debajo de 12px', () => {
    const malos = archivos(SRC, '.css').flatMap((f) => {
      const css = fs.readFileSync(f, 'utf8');
      return [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
        .filter((m) => Number(m[1]) < 12)
        .map((m) => `${rel(f)}: ${m[0]}`);
    });
    expect(malos).toEqual([]);
  });

  it('ningún estilo en línea usa tamaños por debajo de 12px', () => {
    const malos = archivos(SRC, '.jsx').flatMap((f) => {
      const jsx = fs.readFileSync(f, 'utf8');
      return [...jsx.matchAll(/fontSize:\s*['"]?(\d+(?:\.\d+)?)(px)?['"]?/g)]
        .filter((m) => Number(m[1]) < 12)
        .map((m) => `${rel(f)}: ${m[0]}`);
    });
    expect(malos).toEqual([]);
  });

  it('los códigos de solicitud usan la fuente monoespaciada del sistema', () => {
    const global = fs.readFileSync(path.join(SRC, 'styles/global.css'), 'utf8');
    const solicitudes = fs.readFileSync(path.join(SRC, 'solicitudes/solicitudes.css'), 'utf8');
    const regla = (css, sel) => {
      const m = css.match(new RegExp(`(^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
      return m ? m[2] : '';
    };
    for (const [css, sel] of [
      [global, '.request-link strong'],
      [global, '.request-card-head strong'],
      [solicitudes, '.code'],
      [solicitudes, '.duplicados-codigo'],
      [solicitudes, '.recent-main strong'],
    ]) {
      const cuerpo = regla(css, sel);
      expect(cuerpo, sel).toMatch(/font-family:\s*var\(--fuente-mono\)/);
      expect(cuerpo, sel).toMatch(/color:\s*var\(--texto-secundario\)/);
    }
  });
});
