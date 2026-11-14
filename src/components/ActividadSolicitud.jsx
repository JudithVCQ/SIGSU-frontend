/**
 * ActividadSolicitud.jsx — Una sola línea de tiempo que mezcla el historial de
 * estados y los comentarios, ordenada por fecha. El primer evento es siempre
 * "Solicitud registrada por <solicitante>" (derivado de creadoEn).
 */
import Icon from './Icon';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import Button from './Button';

const ts = (d) => {
  if (!d) return null;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
};

const iniciales = (name) => {
  if (!name) return 'U';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
};

/** Devuelve los eventos en orden cronológico ascendente (el más antiguo primero). */
export function construirActividad({ solicitud, historial = [], comentarios = [] }) {
  const eventos = [];

  eventos.push({
    key: 'registro',
    tipo: 'registro',
    texto: solicitud?.solicitante
      ? `Solicitud registrada por ${solicitud.solicitante}`
      : 'Solicitud registrada',
    tiempo: solicitud?.fecha ?? '',
    orden: ts(solicitud?.creadoEn) ?? -Infinity,
    seq: 0,
  });

  historial.forEach((h, i) => {
    eventos.push({
      key: `h-${h.id ?? i}`,
      tipo: 'estado',
      texto: h.estadoOrigen ? `${h.estadoOrigen} → ${h.estadoDestino}` : `Estado: ${h.estadoDestino}`,
      detalle: h.observacion || '',
      autor: h.cambiadoPor,
      tiempo: h.tiempo,
      orden: ts(h.cambiadoEn) ?? Infinity,
      seq: 1 + i,
    });
  });

  comentarios.forEach((c, i) => {
    eventos.push({
      key: `c-${c.id ?? i}`,
      tipo: 'comentario',
      texto: c.texto,
      autor: c.nombre,
      rol: c.rol,
      tiempo: c.tiempo,
      orden: ts(c.creadoEn) ?? Infinity,
      seq: 1000 + i,
    });
  });

  // El registro siempre va primero; el resto por fecha (los sin fecha, al final en su orden)
  return eventos.sort((a, b) => {
    if (a.tipo === 'registro') return -1;
    if (b.tipo === 'registro') return 1;
    if (a.orden !== b.orden) return a.orden < b.orden ? -1 : 1;
    return a.seq - b.seq;
  });
}

export default function ActividadSolicitud({
  eventos,
  errores = [],
  onReintentar,
  children,
  titulo = 'Actividad',
}) {
  return (
    <section className="panel info-panel actividad" aria-labelledby="actividad-titulo">
      <h2 id="actividad-titulo">{titulo}</h2>
      {errores.filter(Boolean).map((msg) => (
        <ErrorState key={msg} message={msg} onRetry={onReintentar} compact />
      ))}
      {eventos.length === 0 ? (
        <EmptyState title="Aún no hay actividad" compact />
      ) : (
        <ol className="actividad-lista">
          {eventos.map((ev) => (
            <li key={ev.key} className={`actividad-item actividad-${ev.tipo}`}>
              <span className="actividad-marca" aria-hidden="true">
                {ev.tipo === 'comentario'
                  ? <span className="avatar small">{iniciales(ev.autor)}</span>
                  : <span className="actividad-punto"><Icon name={ev.tipo === 'registro' ? 'file' : 'check'} size={12} /></span>}
              </span>
              <div className="actividad-cuerpo">
                {ev.tipo === 'comentario' ? (
                  <>
                    <div className="comment-head">
                      <strong>{ev.autor}</strong>
                      {ev.rol && <span>{ev.rol}</span>}
                      <small>{ev.tiempo}</small>
                    </div>
                    <p className="actividad-texto">{ev.texto}</p>
                  </>
                ) : (
                  <>
                    <div className="comment-head">
                      <strong>{ev.texto}</strong>
                      <small>{ev.tiempo}</small>
                    </div>
                    {(ev.detalle || ev.autor) && (
                      <p className="actividad-texto">{ev.detalle || `por ${ev.autor}`}</p>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {children}
    </section>
  );
}

/** Cuadro para comentar, al final de la Actividad. */
export function FormularioActividad({ valor, onChange, onSubmit, enviando, etiqueta, placeholder, boton, nota }) {
  return (
    <form className="actividad-form" onSubmit={onSubmit}>
      <textarea
        aria-label={etiqueta}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
      {nota && <small className="actividad-nota">{nota}</small>}
      <Button type="submit" icon="send" disabled={enviando || !valor.trim()}>
        {boton}
      </Button>
    </form>
  );
}
