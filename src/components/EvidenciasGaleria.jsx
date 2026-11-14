/**
 * EvidenciasGaleria.jsx — Grilla de evidencias con visor de imágenes.
 *
 * Al hacer clic en una imagen se abre VisorImagenes con TODAS las imágenes de
 * la solicitud como carrusel, empezando por la elegida. Los PDF y otros archivos
 * se abren en una pestaña nueva (desde EvidenciaCard).
 */
import { useState, useMemo } from 'react';
import EvidenciaCard from './EvidenciaCard';
import VisorImagenes from './VisorImagenes';
import { tipoEvidencia, urlMiniatura, urlDescarga } from '../services/evidencias.js';

const urlDe    = (e) => e?.archivoUrl ?? e?.url ?? null;
const nombreDe = (e) => e?.nombreArchivo ?? e?.nombre ?? e?.name ?? 'archivo';

export default function EvidenciasGaleria({ evidencias = [], className = '', style }) {
  const [abierta, setAbierta] = useState(null); // índice dentro de `imagenes`

  // Solo las imágenes con URL entran al carrusel
  const imagenes = useMemo(
    () => evidencias
      .filter((e) => tipoEvidencia(e) === 'imagen' && urlDe(e))
      .map((e) => ({
        url:       urlDe(e),
        miniatura: urlMiniatura(urlDe(e)),
        descarga:  urlDescarga(urlDe(e)),
        nombre:    nombreDe(e),
      })),
    [evidencias],
  );

  return (
    <>
      <div className={`evidence-grid ${className}`.trim()} style={style}>
        {evidencias.map((f, i) => {
          const idx = imagenes.findIndex((img) => img.url === urlDe(f));
          return (
            <EvidenciaCard
              key={f.id ?? i}
              evidencia={f}
              onVer={idx >= 0 ? () => setAbierta(idx) : undefined}
            />
          );
        })}
      </div>

      {abierta !== null && (
        <VisorImagenes imagenes={imagenes} indiceInicial={abierta} onClose={() => setAbierta(null)} />
      )}
    </>
  );
}
