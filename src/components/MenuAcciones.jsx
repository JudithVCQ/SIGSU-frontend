/**
 * MenuAcciones.jsx — Menú "⋯" accesible para las acciones secundarias de una fila.
 * Botón con aria-haspopup/expanded; Escape cierra, flechas navegan, clic fuera cierra.
 */
import { useState, useRef, useEffect, useId } from 'react';

export default function MenuAcciones({ etiqueta = 'Más acciones', acciones = [] }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef(null);
  const boton = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto) raiz.current?.querySelector('[role="menuitem"]')?.focus();
  }, [abierto]);

  if (!acciones.length) return null;

  const cerrar = () => { setAbierto(false); boton.current?.focus(); };

  const onKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = [...raiz.current.querySelectorAll('[role="menuitem"]')];
      const i = items.indexOf(document.activeElement);
      const sig = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
      items[sig]?.focus();
    }
  };

  return (
    <span className="menu-acciones" ref={raiz} onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
      <button
        ref={boton}
        type="button"
        className="menu-acciones-btn"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        aria-label={etiqueta}
        onClick={() => setAbierto((v) => !v)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {abierto && (
        <ul className="menu-acciones-lista" role="menu" id={id}>
          {acciones.map((a) => (
            <li key={a.label} role="none">
              <button
                type="button"
                role="menuitem"
                className="menu-acciones-item"
                onClick={() => { setAbierto(false); a.onClick(); }}
              >
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
