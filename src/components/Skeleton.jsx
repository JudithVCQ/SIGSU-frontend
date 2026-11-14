/**
 * Skeleton.jsx — Marcadores de carga (sin texto técnico).
 *
 * Variantes:
 *  - "filas":   filas de tabla (props: filas, columnas)
 *  - "kpi":     tarjetas KPI (prop: cantidad)
 *  - "detalle": cabecera y paneles de una pantalla de detalle
 *
 * Se anuncia a lectores de pantalla como "Cargando" (role="status").
 */
import './estados.css';

function Barra({ ancho = '100%', alto = 14, className = '' }) {
  return <span className={`skeleton-barra ${className}`.trim()} style={{ width: ancho, height: alto }} aria-hidden="true" />;
}

export function SkeletonFilas({ filas = 5, columnas = 4 }) {
  return (
    <div className="skeleton skeleton-filas" role="status" aria-busy="true" aria-label="Cargando">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: filas }, (_, i) => (
        <div className="skeleton-fila" key={i} style={{ gridTemplateColumns: `1.6fr repeat(${Math.max(columnas - 1, 1)}, 1fr)` }}>
          {Array.from({ length: columnas }, (_, j) => (
            <Barra key={j} ancho={j === 0 ? '85%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKpis({ cantidad = 4 }) {
  return (
    <div className="kpi-grid skeleton" role="status" aria-busy="true" aria-label="Cargando">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: cantidad }, (_, i) => (
        <article className="kpi skeleton-kpi" key={i} aria-hidden="true">
          <Barra ancho={44} alto={44} className="skeleton-cuadro" />
          <div className="skeleton-kpi-texto">
            <Barra ancho={56} alto={26} />
            <Barra ancho="70%" alto={12} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function SkeletonDetalle() {
  return (
    <div className="skeleton skeleton-detalle" role="status" aria-busy="true" aria-label="Cargando">
      <span className="sr-only">Cargando…</span>
      <div aria-hidden="true">
        <Barra ancho={120} alto={14} />
        <Barra ancho="55%" alto={28} className="skeleton-titulo" />
        <Barra ancho="35%" alto={14} />
      </div>
      <div className="skeleton-panel" aria-hidden="true">
        <Barra ancho="30%" alto={16} />
        <Barra />
        <Barra ancho="90%" />
        <Barra ancho="75%" />
      </div>
      <div className="skeleton-panel" aria-hidden="true">
        <Barra ancho="25%" alto={16} />
        <Barra />
        <Barra ancho="60%" />
      </div>
    </div>
  );
}

export default function Skeleton({ variante = 'filas', ...props }) {
  if (variante === 'kpi') return <SkeletonKpis {...props} />;
  if (variante === 'detalle') return <SkeletonDetalle {...props} />;
  return <SkeletonFilas {...props} />;
}
