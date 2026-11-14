/**
 * Pagination.jsx — Paginación reutilizable.
 *
 * Muestra "1–10 de 37" con los botones ‹ › y se repite arriba (a la derecha de la tabla)
 * y abajo. Se oculta por completo si solo hay una página.
 *
 * Props:
 *  - pagina:   página actual, base 0
 *  - total:    cantidad total de elementos
 *  - tamano:   elementos por página (10 por defecto)
 *  - onChange: (nuevaPagina) => void
 *  - posicion: 'arriba' | 'abajo'
 */
import { useEffect, useState } from 'react';
import Icon from './Icon';
import './estados.css';

export const TAMANO_PAGINA = 10;

/** Rango visible: { inicio, fin } con base 1 ("1–10 de 37"). */
export function rangoPagina(pagina, total, tamano = TAMANO_PAGINA) {
  if (total === 0) return { inicio: 0, fin: 0 };
  return { inicio: pagina * tamano + 1, fin: Math.min((pagina + 1) * tamano, total) };
}

/**
 * Estado de paginación para una lista ya filtrada.
 * `reiniciarCon` (texto o número): al cambiar, vuelve a la primera página (ej. los filtros).
 */
export function usePaginacion(lista, reiniciarCon = '', tamano = TAMANO_PAGINA) {
  const [pagina, setPagina] = useState(0);
  useEffect(() => { setPagina(0); }, [reiniciarCon]);

  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));
  const actual = Math.min(pagina, totalPaginas - 1);
  const items = lista.slice(actual * tamano, (actual + 1) * tamano);

  return { pagina: actual, setPagina, items, total, tamano, totalPaginas };
}

export default function Pagination({ pagina, total, tamano = TAMANO_PAGINA, onChange, posicion = 'arriba' }) {
  const totalPaginas = Math.ceil(total / tamano);
  if (totalPaginas <= 1) return null;

  const { inicio, fin } = rangoPagina(pagina, total, tamano);
  const primera = pagina <= 0;
  const ultima = pagina >= totalPaginas - 1;

  return (
    <nav className={`paginacion paginacion-${posicion}`} aria-label={`Paginación (${posicion})`}>
      <span className="paginacion-contador" aria-live="polite">
        {inicio}–{fin} de {total}
      </span>
      <div className="paginacion-botones">
        <button
          type="button"
          className="paginacion-btn"
          aria-label="Página anterior"
          onClick={() => onChange(pagina - 1)}
          disabled={primera}
        >
          <span className="paginacion-flecha paginacion-flecha-izq"><Icon name="chevron" size={16} /></span>
        </button>
        <button
          type="button"
          className="paginacion-btn"
          aria-label="Página siguiente"
          onClick={() => onChange(pagina + 1)}
          disabled={ultima}
        >
          <Icon name="chevron" size={16} />
        </button>
      </div>
    </nav>
  );
}
