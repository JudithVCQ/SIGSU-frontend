import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../config/constants';
import { getSolicitudByCodigo as getMock, ESTADO_NIVEL as ESTADO_NIVEL_MOCK } from '../mocks/solicitudes';
import {
  getSolicitudByCodigo,
  getSeguimientos,
  addSeguimiento,
  getEvidencias,
  getHistorial,
} from '../services/solicitudes.js';
import { ESTADO_NIVEL } from '../services/mappers.js';
import { formatFechaVisual } from '../services/mappers.js';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Icon from '../components/Icon';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function DetalleSolicitud() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [solicitud,   setSolicitud]   = useState(null);
  const [seguimientos,setSeguimientos]= useState([]);
  const [evidencias,  setEvidencias]  = useState([]);
  const [historial,   setHistorial]   = useState([]);
  const [loading,     setLoading]     = useState(!USE_MOCKS);
  const [errSol,      setErrSol]      = useState('');
  const [errSeg,      setErrSeg]      = useState('');
  const [errEvi,      setErrEvi]      = useState('');
  const [errHist,     setErrHist]     = useState('');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [sendingComment,  setSendingComment]  = useState(false);

  useEffect(() => {
    if (USE_MOCKS) {
      const s = getMock(id);
      setSolicitud(s);
      setSeguimientos(s?.comentarios ?? []);
      setEvidencias(s?.evidencias ?? []);
      // Timeline simulado (mocks no tienen historial real)
      setHistorial([]);
      return;
    }

    setLoading(true);
    getSolicitudByCodigo(id)
      .then((s) => {
        setSolicitud(s);
        setLoading(false);
        // Carga paralela de los recursos anidados
        Promise.allSettled([
          getSeguimientos(s.id).then(setSeguimientos).catch(e => setErrSeg(e.message)),
          getEvidencias(s.id).then(setEvidencias).catch(e => setErrEvi(e.message)),
          getHistorial(s.id).then(setHistorial).catch(e => setErrHist(e.message)),
        ]);
      })
      .catch(e => { setErrSol(e.message ?? 'No se encontró la solicitud.'); setLoading(false); });
  }, [id]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    setSendingComment(true);
    try {
      if (USE_MOCKS) {
        setSeguimientos(prev => [...prev, {
          nombre: user?.nombre || 'Usuario',
          rol:    user?.rol === ROLES.SOLICITANTE ? 'Solicitante' : 'Personal',
          texto:  nuevoComentario.trim(),
          tiempo: 'Ahora',
        }]);
      } else {
        const nuevo = await addSeguimiento(solicitud.id, nuevoComentario.trim());
        setSeguimientos(prev => [...prev, nuevo]);
      }
      setNuevoComentario('');
    } catch (err) {
      alert(err.message ?? 'No se pudo enviar el comentario.');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) return <div className="narrow-page"><p className="muted-note">Cargando solicitud…</p></div>;
  if (errSol)  return (
    <div className="narrow-page">
      <div className="message error" role="alert">
        <Icon name="alert" /><div><strong>{errSol}</strong></div>
      </div>
      <Button onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );
  if (!solicitud) return null;

  const isSupervisor    = user?.rol === ROLES.SUPERVISOR;
  const isTecnico       = user?.rol === ROLES.TECNICO;
  const esMiSolicitud   = isTecnico && solicitud.responsableId === user?.id;

  const estadoUi  = solicitud.estado ?? '';
  const nivel     = ESTADO_NIVEL[estadoUi] ?? (USE_MOCKS ? (ESTADO_NIVEL_MOCK?.[estadoUi] ?? 0) : 0);

  const getBackPath = () => {
    if (isSupervisor) return '/supervisor/solicitudes';
    if (isTecnico)    return '/tecnico';
    return '/solicitante/solicitudes';
  };
  const getBackLabel = () => {
    if (isSupervisor) return 'Volver a solicitudes';
    if (isTecnico)    return 'Volver a mis asignaciones';
    return 'Volver a mis solicitudes';
  };
  const getInitials = (name) => {
    if (!name || name === 'Sin asignar') return 'U';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  // Timeline: preferir historial real, o simular si está en mocks
  const timelineItems = historial.length > 0
    ? [...historial].reverse()
    : (USE_MOCKS ? buildMockTimeline(solicitud, nivel) : []);

  const textosEstado = {
    'Registrada':    'Tu solicitud espera ser clasificada y asignada.',
    'En evaluación': 'Solicitud clasificada. Esperando asignación de técnico.',
    'Asignada':      'Ya tiene responsable. La atención comenzará pronto.',
    'En atención':   'El responsable está trabajando en tu solicitud.',
    'Resuelta':      'El servicio fue completado. Gracias por reportarlo.',
    'Cerrada':       'La solicitud fue cerrada. El historial queda disponible.',
  };

  return (
    <div>
      <button type="button" className="back-link" onClick={() => navigate(getBackPath())}>
        <Icon name="arrow" size={18} /> {getBackLabel()}
      </button>

      <div className="detail-head">
        <div>
          <div className="row wrap">
            <span className="code">{solicitud.codigo}</span>
            <Badge texto={estadoUi} />
            {solicitud.prioridad && <Badge texto={solicitud.prioridad} />}
          </div>
          <h1>{solicitud.titulo}</h1>
          <p>Registrada el {solicitud.fecha || formatFechaVisual(solicitud.creadoEn)}</p>
        </div>
        {esMiSolicitud && (solicitud.estadoApi === 'ASIGNADA' || solicitud.estadoApi === 'EN_ATENCION') && (
          <Button variant="primary" onClick={() => navigate(`/tecnico/atencion/${solicitud.codigo}`)}>
            Ir a atención
          </Button>
        )}
      </div>

      <div className="detail-grid">
        <main className="detail-main">
          {/* Datos principales */}
          <section className="panel info-panel">
            <h2>Datos principales</h2>
            <div className="info-grid">
              <div><small>Categoría</small><span>{solicitud.categoria || '—'}</span></div>
              <div><small>Ubicación</small><span>{solicitud.ubicacion || '—'}</span></div>
              <div><small>Estado</small><Badge texto={estadoUi} /></div>
              {solicitud.prioridad && <div><small>Prioridad</small><Badge texto={solicitud.prioridad} /></div>}
              {solicitud.area && <div><small>Área responsable</small><span>{solicitud.area}</span></div>}
            </div>
            <div className="description">
              <small>Descripción</small>
              <p>{solicitud.descripcion}</p>
              {solicitud.solucion && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--borde)' }}>
                  <small>Solución registrada por el técnico</small>
                  <p>{solicitud.solucion}</p>
                </div>
              )}
            </div>
          </section>

          {/* Historial de estados */}
          <section className="panel timeline">
            <h2>Historial de la solicitud</h2>
            {errHist && <p className="muted-note" style={{ color: 'var(--peligro)' }}>{errHist}</p>}
            {timelineItems.length === 0 && !errHist && (
              <p className="muted-note">Aún no hay cambios de estado registrados.</p>
            )}
            {timelineItems.map((item, idx) => (
              <div className="timeline-item" key={item.id ?? idx}>
                <div className={`timeline-dot ${idx === 0 ? 'active' : ''}`}>
                  {idx === 0 && <Icon name="check" size={12} />}
                </div>
                <div>
                  {item.estadoDestino
                    ? <strong>{item.estadoOrigen} → {item.estadoDestino}</strong>
                    : <strong>{item.titulo}</strong>
                  }
                  <p>{item.observacion || item.descripcion || (item.cambiadoPor ? `por ${item.cambiadoPor}` : '')}</p>
                  <small>{item.tiempo || item.cambiadoEn || ''}</small>
                </div>
              </div>
            ))}
          </section>

          {/* Seguimientos / Comentarios */}
          <section className="panel info-panel">
            <h2>Comentarios</h2>
            {errSeg && <p className="muted-note" style={{ color: 'var(--peligro)' }}>{errSeg}</p>}
            {seguimientos.length === 0 && !errSeg ? (
              <p className="muted-note">Aún no hay comentarios.</p>
            ) : (
              <div className="comments">
                {seguimientos.map((c, i) => (
                  <div className="comment" key={c.id ?? i}>
                    <div className={`avatar small ${c.rol === 'Solicitante' ? '' : 'staff'}`.trim()}>
                      {getInitials(c.nombre)}
                    </div>
                    <div>
                      <div className="comment-head">
                        <strong>{c.nombre}</strong>
                        {c.rol && <span>{c.rol}</span>}
                        <small>{c.tiempo}</small>
                      </div>
                      <p>{c.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form className="comment-form" onSubmit={handleSendComment}>
              <textarea
                aria-label="Escribir comentario"
                placeholder="Escribe un comentario o actualización..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
              />
              <Button type="submit" icon="send" disabled={sendingComment || !nuevoComentario.trim()}>
                {sendingComment ? 'Enviando…' : 'Comentar'}
              </Button>
            </form>
          </section>

          {/* Evidencias */}
          <section className="panel info-panel">
            <h2>Evidencias</h2>
            {errEvi && <p className="muted-note" style={{ color: 'var(--peligro)' }}>{errEvi}</p>}
            {evidencias.length === 0 && !errEvi ? (
              <p className="muted-note">No se adjuntaron archivos a esta solicitud.</p>
            ) : (
              <div className="evidence-grid">
                {evidencias.map((f, i) => (
                  <div className="evidence" key={f.id ?? i}>
                    <div className="evidence-thumb"><Icon name="image" size={26} /></div>
                    <strong>{f.nombre || f.name}</strong>
                    <small>{f.tamano || f.size}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside>
          {/* Estado actual */}
          <section className="panel status-panel">
            <div className="card-label">ESTADO ACTUAL</div>
            <Badge texto={estadoUi} />
            <p style={{ marginTop: '8px' }}>{textosEstado[estadoUi] ?? ''}</p>
            <div className="progress">
              {[0, 1, 2, 3].map((n) => (
                <span key={n} className={n <= Math.min(nivel, 3) ? 'done' : ''} />
              ))}
            </div>
            <div className="progress-labels">
              <span>Registrada</span>
              <span>Resuelta</span>
            </div>
          </section>

          {/* Responsable */}
          <section className="panel contact-panel">
            <div className="card-label">RESPONSABLE ASIGNADO</div>
            {solicitud.responsable && solicitud.responsable !== 'Sin asignar' ? (
              <>
                <div className="contact">
                  <div className="avatar staff">{getInitials(solicitud.responsable)}</div>
                  <div>
                    <strong>{solicitud.responsable}</strong>
                    <span>{solicitud.rolResponsable || 'Técnico'}</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  full
                  icon="send"
                  onClick={() => document.querySelector('.comment-form textarea')?.focus()}
                >
                  Enviar comentario
                </Button>
              </>
            ) : (
              <p className="muted-note">Todavía no hay un responsable asignado.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function buildMockTimeline(solicitud, nivel) {
  const steps = [
    { titulo: 'Solicitud registrada',   descripcion: 'Registro inicial.', tiempo: solicitud.fecha },
    { titulo: 'Responsable asignado',   descripcion: `Asignada a ${solicitud.responsable}.`, tiempo: solicitud.fecha },
    { titulo: 'Solicitud en atención',  descripcion: 'Técnico inició labores.', tiempo: solicitud.fecha },
    { titulo: 'Solicitud resuelta',     descripcion: 'Solución registrada.', tiempo: solicitud.fecha },
    { titulo: 'Solicitud cerrada',      descripcion: 'Cerrada formalmente.', tiempo: solicitud.fecha },
  ];
  return steps.slice(0, nivel + 1).reverse();
}
