// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { esUrlCloudinary, urlMiniatura, urlDescarga, tipoEvidencia } from '../services/evidencias.js';
import EvidenciaCard from '../components/EvidenciaCard';

const CLOUD_IMG = 'https://res.cloudinary.com/demo/image/upload/v1731/solicitud_11_abc.jpg';
const CLOUD_PDF = 'https://res.cloudinary.com/demo/image/upload/v1731/solicitud_11_informe.pdf';
const CLOUD_RAW = 'https://res.cloudinary.com/demo/raw/upload/v1731/solicitud_11_doc.pdf';
const OTRA_URL  = 'https://archivos.ejemplo.edu/evidencias/foto.png';

describe('services/evidencias.js', () => {
  it('detecta URLs de Cloudinary que admiten transformaciones', () => {
    expect(esUrlCloudinary(CLOUD_IMG)).toBe(true);
    expect(esUrlCloudinary(CLOUD_RAW)).toBe(false);
    expect(esUrlCloudinary(OTRA_URL)).toBe(false);
    expect(esUrlCloudinary('no-es-url')).toBe(false);
    expect(esUrlCloudinary(null)).toBe(false);
  });

  it('urlMiniatura inserta c_fill,w_400,h_300 después de /upload/ solo en Cloudinary', () => {
    expect(urlMiniatura(CLOUD_IMG)).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_300/v1731/solicitud_11_abc.jpg',
    );
    expect(urlMiniatura(OTRA_URL)).toBe(OTRA_URL);
    expect(urlMiniatura(CLOUD_RAW)).toBe(CLOUD_RAW);
  });

  it('urlDescarga inserta fl_attachment después de /upload/ solo en Cloudinary', () => {
    expect(urlDescarga(CLOUD_PDF)).toBe(
      'https://res.cloudinary.com/demo/image/upload/fl_attachment/v1731/solicitud_11_informe.pdf',
    );
    expect(urlDescarga(OTRA_URL)).toBe(OTRA_URL);
    expect(urlDescarga(CLOUD_RAW)).toBe(CLOUD_RAW);
  });

  it('no duplica la transformación si ya está presente', () => {
    const ya = urlDescarga(CLOUD_IMG);
    expect(urlDescarga(ya)).toBe(ya);
  });

  it('tipoEvidencia usa tipoMime y, sin él, la extensión', () => {
    expect(tipoEvidencia({ tipoMime: 'image/png' })).toBe('imagen');
    expect(tipoEvidencia({ tipoMime: 'application/pdf' })).toBe('pdf');
    expect(tipoEvidencia({ tipoMime: 'text/plain' })).toBe('otro');
    expect(tipoEvidencia({ nombre: 'foto.JPG' })).toBe('imagen');
    expect(tipoEvidencia({ nombre: 'informe.pdf' })).toBe('pdf');
    expect(tipoEvidencia({})).toBe('otro');
  });
});

describe('EvidenciaCard', () => {
  const imagen = {
    nombreArchivo: 'proyector.jpg',
    tipoMime: 'image/jpeg',
    archivoUrl: CLOUD_IMG,
    tamano: '1.8 MB',
  };
  const pdf = {
    nombreArchivo: 'informe.pdf',
    tipoMime: 'application/pdf',
    archivoUrl: CLOUD_PDF,
    tamano: '640 KB',
  };

  it('muestra <img> con la miniatura de Cloudinary y alt con el nombre', () => {
    render(<EvidenciaCard evidencia={imagen} />);
    const img = screen.getByRole('img', { name: 'proyector.jpg' });
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', urlMiniatura(CLOUD_IMG));
    expect(screen.getByText('1.8 MB')).toBeInTheDocument();
  });

  it('abre el archivo original en una pestaña nueva', () => {
    render(<EvidenciaCard evidencia={imagen} />);
    const link = screen.getByRole('link', { name: 'Abrir proyector.jpg en una pestaña nueva' });
    expect(link).toHaveAttribute('href', CLOUD_IMG);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('ofrece "Descargar" con fl_attachment', () => {
    render(<EvidenciaCard evidencia={pdf} />);
    const descargar = screen.getByRole('link', { name: 'Descargar informe.pdf' });
    expect(descargar).toHaveAttribute('href', urlDescarga(CLOUD_PDF));
    expect(descargar).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('muestra el ícono de PDF (sin <img>) para documentos PDF', () => {
    const { container } = render(<EvidenciaCard evidencia={pdf} />);
    expect(screen.getByRole('img', { name: 'Documento PDF: informe.pdf' })).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('si la imagen no carga vuelve al ícono genérico sin romper la vista', () => {
    const { container } = render(<EvidenciaCard evidencia={imagen} />);
    fireEvent.error(container.querySelector('img'));
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Archivo: proyector.jpg' })).toBeInTheDocument();
    // Los enlaces siguen disponibles
    expect(screen.getByRole('link', { name: 'Descargar proyector.jpg' })).toBeInTheDocument();
  });

  it('sin URL (mocks) muestra nombre e ícono, sin enlaces', () => {
    render(<EvidenciaCard evidencia={{ nombre: 'toma_red_lab4.jpg', tamano: '1.2 MB' }} />);
    expect(screen.getByText('toma_red_lab4.jpg')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Archivo: toma_red_lab4.jpg' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
