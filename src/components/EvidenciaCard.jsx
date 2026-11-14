/**
 * EvidenciaCard.jsx — Tarjeta de una evidencia adjunta a una solicitud.
 *
 * - Imagen (tipoMime image/*): miniatura real (liviana si es Cloudinary).
 *   Si la imagen no carga, vuelve al ícono genérico sin romper la vista.
 * - PDF: ícono de PDF.
 * - Imagen con `onVer`: clic abre el visor ampliado (VisorImagenes).
 * - Resto con URL (PDF, o imagen sin visor): clic abre el archivo en una pestaña nueva.
 * - Con URL siempre hay un enlace "Descargar".
 * - Sin URL (mocks o datos incompletos): solo nombre, tamaño e ícono.
 */
import { useState } from 'react';
import Icon from './Icon';
import { tipoEvidencia, urlMiniatura, urlDescarga } from '../services/evidencias.js';

export default function EvidenciaCard({ evidencia, onVer }) {
  const [imgError, setImgError] = useState(false);

  const nombre = evidencia?.nombreArchivo ?? evidencia?.nombre ?? evidencia?.name ?? 'archivo';
  const tamano = evidencia?.tamano ?? evidencia?.size ?? '';
  const url    = evidencia?.archivoUrl ?? evidencia?.url ?? null;
  const tipo   = tipoEvidencia(evidencia);
  const mostrarImagen = tipo === 'imagen' && Boolean(url) && !imgError;

  let visual;
  if (mostrarImagen) {
    visual = (
      <img src={urlMiniatura(url)} alt={nombre} loading="lazy" onError={() => setImgError(true)} />
    );
  } else if (tipo === 'pdf') {
    visual = (
      <span className="evidence-pdf" role="img" aria-label={`Documento PDF: ${nombre}`}>
        <Icon name="file" size={26} />
        <span aria-hidden="true">PDF</span>
      </span>
    );
  } else {
    visual = (
      <span className="evidence-generico" role="img" aria-label={`Archivo: ${nombre}`}>
        <Icon name={tipo === 'imagen' ? 'image' : 'file'} size={26} />
      </span>
    );
  }

  const thumb = (
    <div className={`evidence-thumb${mostrarImagen ? ' evidence-thumb-img' : ''}`}>{visual}</div>
  );

  // Imágenes con visor: el clic amplía la imagen en lugar de abrir otra pestaña
  const abreVisor = mostrarImagen && typeof onVer === 'function';

  return (
    <div className="evidence">
      {abreVisor ? (
        <button
          type="button"
          className="evidence-link evidence-ver"
          onClick={onVer}
          aria-label={`Ver ${nombre} en grande`}
          title={nombre}
        >
          {thumb}
          <strong>{nombre}</strong>
        </button>
      ) : url ? (
        <a
          className="evidence-link"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${nombre} en una pestaña nueva`}
          title={nombre}
        >
          {thumb}
          <strong>{nombre}</strong>
        </a>
      ) : (
        <>
          {thumb}
          <strong title={nombre}>{nombre}</strong>
        </>
      )}
      {tamano && <small>{tamano}</small>}
      {url && (
        <a
          className="evidence-descargar"
          href={urlDescarga(url)}
          download={nombre}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Descargar ${nombre}`}
        >
          <Icon name="down" size={14} /> Descargar
        </a>
      )}
    </div>
  );
}
