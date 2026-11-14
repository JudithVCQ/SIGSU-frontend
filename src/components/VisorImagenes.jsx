/**
 * VisorImagenes.jsx — Visor a pantalla completa con carrusel (estilo galería de chat).
 *
 * - Muestra la imagen en grande sobre un fondo oscuro.
 * - Varias imágenes: flechas anterior/siguiente, contador "2 / 5", miniaturas abajo,
 *   teclado (← → Esc) y deslizamiento táctil.
 * - Cierra con la X, con Esc o haciendo clic en el fondo.
 * - Accesible: role="dialog", aria-modal, foco inicial en "Cerrar" y se devuelve
 *   el foco al elemento que lo abrió.
 *
 * Props:
 *  - imagenes: [{ url, miniatura, descarga, nombre }]
 *  - indiceInicial: número
 *  - onClose: () => void
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

const UMBRAL_SWIPE = 50; // px

export default function VisorImagenes({ imagenes = [], indiceInicial = 0, onClose }) {
  const total = imagenes.length;
  const [indice, setIndice] = useState(() => Math.min(Math.max(indiceInicial, 0), Math.max(total - 1, 0)));
  const [errores, setErrores] = useState({});
  const cerrarRef = useRef(null);
  const toqueX = useRef(null);

  const anterior  = useCallback(() => setIndice((i) => (i - 1 + total) % total), [total]);
  const siguiente = useCallback(() => setIndice((i) => (i + 1) % total), [total]);

  // Teclado, bloqueo de scroll del fondo y gestión del foco
  useEffect(() => {
    const previo = document.activeElement;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cerrarRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose?.(); }
      else if (e.key === 'ArrowLeft' && total > 1) { e.preventDefault(); anterior(); }
      else if (e.key === 'ArrowRight' && total > 1) { e.preventDefault(); siguiente(); }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowPrevio;
      if (previo && typeof previo.focus === 'function') previo.focus();
    };
  }, [onClose, anterior, siguiente, total]);

  if (!total) return null;
  const actual = imagenes[indice];
  const fallo = Boolean(errores[indice]);

  const onTouchStart = (e) => { toqueX.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    if (toqueX.current == null || total < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? toqueX.current) - toqueX.current;
    if (dx > UMBRAL_SWIPE) anterior();
    else if (dx < -UMBRAL_SWIPE) siguiente();
    toqueX.current = null;
  };

  return createPortal(
    <div
      className="visor"
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de imágenes: ${actual.nombre}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="visor-barra">
        <div className="visor-info">
          <strong>{actual.nombre}</strong>
          {total > 1 && <span aria-live="polite">{indice + 1} / {total}</span>}
        </div>
        <div className="visor-acciones">
          {actual.descarga && (
            <a
              className="visor-boton"
              href={actual.descarga}
              download={actual.nombre}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Descargar ${actual.nombre}`}
            >
              <Icon name="download" size={20} />
            </a>
          )}
          <button ref={cerrarRef} type="button" className="visor-boton" onClick={onClose} aria-label="Cerrar visor">
            <Icon name="close" size={22} />
          </button>
        </div>
      </div>

      <div
        className="visor-escenario"
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {total > 1 && (
          <button type="button" className="visor-boton visor-nav visor-prev" onClick={anterior} aria-label="Imagen anterior">
            <Icon name="arrow" size={26} />
          </button>
        )}

        {fallo ? (
          <div className="visor-error" role="alert">
            <Icon name="image" size={40} />
            <p>No se pudo cargar la imagen.</p>
            {actual.url && (
              <a href={actual.url} target="_blank" rel="noopener noreferrer">Abrir en una pestaña nueva</a>
            )}
          </div>
        ) : (
          <img
            key={actual.url}
            className="visor-imagen"
            src={actual.url}
            alt={actual.nombre}
            onError={() => setErrores((prev) => ({ ...prev, [indice]: true }))}
          />
        )}

        {total > 1 && (
          <button type="button" className="visor-boton visor-nav visor-next" onClick={siguiente} aria-label="Imagen siguiente">
            <Icon name="chevron" size={26} />
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="visor-miniaturas" role="group" aria-label="Miniaturas">
          {imagenes.map((img, i) => (
            <button
              key={img.url ?? i}
              type="button"
              className={`visor-miniatura${i === indice ? ' activa' : ''}`}
              onClick={() => setIndice(i)}
              aria-label={`Ver ${img.nombre} (${i + 1} de ${total})`}
              aria-current={i === indice ? 'true' : undefined}
            >
              <img src={img.miniatura ?? img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
