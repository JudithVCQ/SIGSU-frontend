// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { esUrlCloudinary, urlMiniatura, urlDescarga, tipoEvidencia } from '../services/evidencias.js';
import EvidenciaCard from '../components/EvidenciaCard';
import EvidenciasGaleria from '../components/EvidenciasGaleria';

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

describe('EvidenciasGaleria + VisorImagenes', () => {
  const img1 = { id: 1, nombreArchivo: 'aula.jpg', tipoMime: 'image/jpeg', archivoUrl: CLOUD_IMG };
  const img2 = { id: 2, nombreArchivo: 'cable.png', tipoMime: 'image/png', archivoUrl: OTRA_URL };
  const doc  = { id: 3, nombreArchivo: 'informe.pdf', tipoMime: 'application/pdf', archivoUrl: CLOUD_PDF };

  const visor = () => screen.queryByRole('dialog');
  const imagenGrande = () => within(visor()).getAllByRole('img').find((el) => el.classList.contains('visor-imagen'));

  it('al hacer clic en una imagen la amplía (no abre otra pestaña)', () => {
    render(<EvidenciasGaleria evidencias={[img1, img2, doc]} />);
    expect(screen.queryByRole('link', { name: 'Abrir aula.jpg en una pestaña nueva' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver aula.jpg en grande' }));
    expect(visor()).toBeInTheDocument();
    // En grande se usa la URL original, no la miniatura
    expect(imagenGrande()).toHaveAttribute('src', CLOUD_IMG);
    expect(imagenGrande()).toHaveAttribute('alt', 'aula.jpg');
  });

  it('los PDF siguen abriéndose en una pestaña nueva', () => {
    render(<EvidenciasGaleria evidencias={[img1, doc]} />);
    expect(screen.getByRole('link', { name: 'Abrir informe.pdf en una pestaña nueva' })).toHaveAttribute('target', '_blank');
  });

  it('carrusel: contador, siguiente/anterior, teclado y sin incluir PDFs', () => {
    render(<EvidenciasGaleria evidencias={[img1, doc, img2]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver aula.jpg en grande' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Imagen siguiente' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(imagenGrande()).toHaveAttribute('alt', 'cable.png');

    // Circular: siguiente desde la última vuelve a la primera
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('abre en la imagen elegida y permite saltar con las miniaturas', () => {
    render(<EvidenciasGaleria evidencias={[img1, img2]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver cable.png en grande' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver aula.jpg (1 de 2)' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('deslizar con el dedo cambia de imagen', () => {
    render(<EvidenciasGaleria evidencias={[img1, img2]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver aula.jpg en grande' }));
    const escenario = document.querySelector('.visor-escenario');
    fireEvent.touchStart(escenario, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(escenario, { changedTouches: [{ clientX: 150 }] });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('con una sola imagen no muestra flechas ni contador', () => {
    render(<EvidenciasGaleria evidencias={[img1]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver aula.jpg en grande' }));
    expect(screen.queryByRole('button', { name: 'Imagen siguiente' })).not.toBeInTheDocument();
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  });

  it('se cierra con Esc y con el botón Cerrar, y devuelve el foco', () => {
    render(<EvidenciasGaleria evidencias={[img1, img2]} />);
    const abrir = screen.getByRole('button', { name: 'Ver aula.jpg en grande' });
    abrir.focus();
    fireEvent.click(abrir);
    expect(screen.getByRole('button', { name: 'Cerrar visor' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(visor()).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();

    fireEvent.click(abrir);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar visor' }));
    expect(visor()).not.toBeInTheDocument();
  });

  it('ofrece descargar la imagen actual', () => {
    render(<EvidenciasGaleria evidencias={[img1]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver aula.jpg en grande' }));
    expect(within(visor()).getByRole('link', { name: 'Descargar aula.jpg' })).toHaveAttribute('href', urlDescarga(CLOUD_IMG));
  });

  it('si la imagen grande no carga muestra un aviso sin romper el visor', () => {
    render(<EvidenciasGaleria evidencias={[img1, img2]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver aula.jpg en grande' }));
    fireEvent.error(imagenGrande());
    expect(screen.getByText('No se pudo cargar la imagen.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Imagen siguiente' }));
    expect(imagenGrande()).toHaveAttribute('alt', 'cable.png');
  });
});
