import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EVIDENCIA } from '../config/constants';
import {
  getSolicitudByCodigo as getMock,
  updateSolicitudEstado,
  addComentarioSolicitud,
  addEvidenciasSolicitud,
} from '../mocks/solicitudes';
import {
  getSolicitudByCodigo,
  getSeguimientos,
  addSeguimiento,
  getEvidencias,
  cambiarEstado,
  subirEvidencia,
} from '../services/solicitudes.js';
import { formatFechaVisual } from '../services/mappers.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import Badge from '../components/Badge';
import PlazoSolicitud from '../components/PlazoSolicitud';
import Icon from '../components/Icon';
import EvidenciasGaleria from '../components/EvidenciasGaleria';
import ConfirmModal from '../components/ConfirmModal';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function AtencionSolicitud() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const fileInputRef = useRef(null);

  const [solicitud,     setSolicitud]     = useState(null);
  const [seguimientos,  setSeguimientos]  = useState([]);
  const [evidencias,    setEvidencias]    = useState([]);
  const [loading,       setLoading]       = useState(!USE_MOCKS);
  const [errLoad,       setErrLoad]       = useState('');

  const [notaAvance,    setNotaAvance]    = useState('');
  const [solucionTexto, setSolucionTexto] = useState('');
  const [solucionError, setSolucionError] = useState('');
  const [archivoError,  setArchivoError]  = useState('');
  const [mensajeExito,  setMensajeExito]  = useState('');
  const [modalOpen,     setModalOpen]     = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => {
    if (USE_MOCKS) {
      const s = getMock(id);
      setSolicitud(s);
      setSeguimientos(s?.comentarios ?? []);
      setEvidencias(s?.evidencias ?? []);
      return;
    }
    setLoading(true);
    getSolicitudByCodigo(id)
      .then(s => {
        setSolicitud(s);
        setSolucionTexto(s.solucion ?? '');
        setLoading(false);
        Promise.allSettled([
          getSeguimientos(s.id).then(setSeguimientos),
          getEvidencias(s.id).then(setEvidencias),
        ]);
      })
      .catch(e => { setErrLoad(e.message ?? 'No se encontró la solicitud.'); setLoading(false); });
  }, [id]);

  if (loading) return <div className="narrow-page"><p className="muted-note">Cargando orden de trabajo…</p></div>;
  if (errLoad) return (
    <div className="narrow-page">
      <div className="message error" role="alert"><Icon name="alert" /><div><strong>{errLoad}</strong></div></div>
      <Button onClick={() => navigate('/tecnico')}>Volver</Button>
    </div>
  );
  if (!solicitud) return null;

  // Verificación de asignación por ID (modo real) o por nombre (mocks)
  const esResponsable = USE_MOCKS
    ? solicitud.responsable === user?.nombre
    : solicitud.responsableId === user?.id;

  if (!esResponsable) {
    return (
      <div className="narrow-page">
        <PageHead title="Atención no disponible" text="No tienes asignada esta orden o no existe." />
        <div className="empty">
          <Icon name="alert" size={32} />
          <strong>Acceso restringido</strong>
          <p>Solo el técnico designado puede atender esta solicitud.</p>
          <Button onClick={() => navigate('/tecnico')}>Volver a mis asignaciones</Button>
        </div>
      </div>
    );
  }

  const estadoApi = solicitud.estadoApi ?? solicitud.estado;
  const estadoUi  = solicitud.estado ?? '';
  const esAsignada    = estadoApi === 'ASIGNADA'    || estadoUi === 'Asignada';
  const esEnAtencion  = estadoApi === 'EN_ATENCION' || estadoUi === 'En atención';
  const esResuelta    = estadoApi === 'RESUELTA'    || estadoUi === 'Resuelta';
  const esCerrada     = estadoApi === 'CERRADA'     || estadoUi === 'Cerrada';
  // Estados en los que el técnico aún no puede iniciar la atención ni agregar notas
  const noAsignadaAun = !esAsignada && !esEnAtencion && !esResuelta && !esCerrada;

  // Iniciar atención
  const handleIniciarAtencion = async () => {
    setSubmitting(true);
    try {
      if (USE_MOCKS) {
        const updated = updateSolicitudEstado(solicitud.codigo, 'En atención');
        const c = { nombre: user.nombre, rol: 'Soporte técnico', texto: 'Inició la atención.', tiempo: 'Ahora' };
        addComentarioSolicitud(solicitud.codigo, c);
        setSolicitud({ ...updated, comentarios: [...(updated.comentarios || []), c] });
        setSeguimientos(prev => [...prev, c]);
      } else {
        const updated = await cambiarEstado(solicitud.id, 'EN_ATENCION', {
          observacion: 'Atención iniciada por el técnico.',
        });
        setSolicitud(updated);
        const nuevo = await addSeguimiento(solicitud.id, 'Inició formalmente la atención técnica.');
        setSeguimientos(prev => [...prev, nuevo]);
      }
      setMensajeExito("Atención iniciada. El estado cambió a 'En atención'.");
    } catch (err) {
      alert(err.message ?? 'No se pudo iniciar la atención.');
    } finally { setSubmitting(false); }
  };

  // Registrar nota de avance
  const handleAgregarAvance = async (e) => {
    e.preventDefault();
    if (!notaAvance.trim()) return;
    setSubmitting(true);
    try {
      if (USE_MOCKS) {
        const c = { nombre: user.nombre, rol: 'Soporte técnico', texto: notaAvance.trim(), tiempo: 'Ahora' };
        addComentarioSolicitud(solicitud.codigo, c);
        setSeguimientos(prev => [...prev, c]);
      } else {
        const nuevo = await addSeguimiento(solicitud.id, notaAvance.trim());
        setSeguimientos(prev => [...prev, nuevo]);
      }
      setNotaAvance('');
      setMensajeExito('Nota de avance registrada.');
    } catch (err) {
      alert(err.message ?? 'No se pudo registrar la nota.');
    } finally { setSubmitting(false); }
  };

  // Subir evidencias
  const handleUploadEvidencias = async (e) => {
    setArchivoError('');
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (!EVIDENCIA.tipos.includes(f.type)) {
        setArchivoError(`Formato no admitido en "${f.name}". Usa PNG, JPG o PDF.`); continue;
      }
      if (f.size > EVIDENCIA.maxMB * 1024 * 1024) {
        setArchivoError(`"${f.name}" supera el peso máximo de ${EVIDENCIA.maxMB} MB.`); continue;
      }
      try {
        if (USE_MOCKS) {
          const ev = { nombre: f.name, tamano: `${(f.size / 1024 / 1024).toFixed(1)} MB` };
          addEvidenciasSolicitud(solicitud.codigo, [ev]);
          setEvidencias(prev => [...prev, ev]);
        } else {
          const ev = await subirEvidencia(solicitud.id, f);
          setEvidencias(prev => [...prev, ev]);
        }
        setMensajeExito(`Evidencia "${f.name}" adjuntada.`);
      } catch (err) {
        setArchivoError(err.message ?? `Error al subir "${f.name}".`);
      }
    }
    e.target.value = '';
  };

  // Pre-confirmar resolución
  const handlePreMarcarResuelta = (e) => {
    e.preventDefault();
    setSolucionError('');
    if (solucionTexto.trim().length < 10) {
      setSolucionError('Describe la solución con al menos 10 caracteres antes de marcar como resuelta.');
      return;
    }
    setModalOpen(true);
  };

  // Confirmar resolución
  const handleConfirmarResolucion = async () => {
    setModalOpen(false);
    setSubmitting(true);
    try {
      if (USE_MOCKS) {
        const updated = updateSolicitudEstado(solicitud.codigo, 'Resuelta', { solucion: solucionTexto.trim() });
        setSolicitud({ ...updated, solucion: solucionTexto.trim() });
      } else {
        const updated = await cambiarEstado(solicitud.id, 'RESUELTA', { solucion: solucionTexto.trim() });
        setSolicitud(updated);
        const nuevo = await addSeguimiento(solicitud.id, `Solución técnica registrada: ${solucionTexto.trim()}`);
        setSeguimientos(prev => [...prev, nuevo]);
      }
      setMensajeExito('Solución registrada. La solicitud pasó a estado "Resuelta".');
    } catch (err) {
      alert(err.message ?? 'No se pudo marcar como resuelta.');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <button type="button" className="back-link" onClick={() => navigate('/tecnico')}>
        <Icon name="arrow" size={18} /> Volver a mis asignaciones
      </button>

      <div className="detail-head">
        <div>
          <div className="row wrap">
            <span className="code">{solicitud.codigo}</span>
            <Badge texto={estadoUi} />
            {solicitud.prioridad && <Badge texto={solicitud.prioridad} />}
          </div>
          <h1>Atención: {solicitud.titulo}</h1>
          <p>Registrada el {solicitud.fecha || formatFechaVisual(solicitud.creadoEn)} · Responsable: {solicitud.responsable}</p>
        </div>
      </div>

      {mensajeExito && (
        <div className="message success" role="status" style={{ marginBottom: '16px' }}>
          <Icon name="check" /><div><strong>{mensajeExito}</strong></div>
        </div>
      )}

      {noAsignadaAun && (
        <div className="message" role="status" style={{ marginBottom: '24px' }}>
          <Icon name="alert" />
          <div>
            <strong>Esta solicitud aún no figura como asignada. Pide al supervisor que revise su estado.</strong>
          </div>
        </div>
      )}

      {esAsignada && (
        <div className="atencion-banner">
          <div>
            <h3>Orden de trabajo lista para iniciar</h3>
            <p>Para registrar avances e iniciar formalmente la atención, usa el botón a la derecha.</p>
          </div>
          <Button variant="primary" icon="check" onClick={handleIniciarAtencion} disabled={submitting}>
            {submitting ? 'Iniciando…' : 'Iniciar atención'}
          </Button>
        </div>
      )}

      {esResuelta && (
        <div className="message success" style={{ marginBottom: '24px' }}>
          <Icon name="check" />
          <div>
            <strong>Solicitud Resuelta · Pendiente de revisión del supervisor</strong>
            <p>Los trabajos han finalizado. El supervisor revisará la conformidad para el cierre.</p>
          </div>
        </div>
      )}

      {esCerrada && (
        <div className="message" style={{ background: '#e6e7e7', color: '#5f6466', marginBottom: '24px' }}>
          <Icon name="check" />
          <div><strong>Solicitud Cerrada</strong><p>Vista de solo lectura.</p></div>
        </div>
      )}

      <div className="detail-grid">
        <main className="detail-main">
          {/* Datos del servicio */}
          <section className="panel info-panel">
            <h2>Datos del servicio reportado</h2>
            <div className="info-grid">
              <div><small>Categoría</small><span>{solicitud.categoria || '—'}</span></div>
              <div><small>Ubicación</small><span>{solicitud.ubicacion}</span></div>
              <div><small>Estado actual</small><Badge texto={estadoUi} /></div>
              {solicitud.prioridad && <div><small>Prioridad asignada</small><Badge texto={solicitud.prioridad} /></div>}
              <PlazoSolicitud solicitud={solicitud} />
            </div>
            <div className="description">
              <small>Descripción del problema</small>
              <p>{solicitud.descripcion}</p>
            </div>
          </section>

          {/* Formulario de solución (solo En atención) */}
          {esEnAtencion && (
            <section className="panel info-panel">
              <h2>Registrar solución técnica</h2>
              <p className="hint-text" style={{ marginBottom: '16px' }}>
                Solo con solución registrada la solicitud puede pasar a &quot;Resuelta&quot;.
              </p>
              {solucionError && (
                <div className="message error" role="alert" style={{ marginBottom: '16px' }}>
                  <Icon name="alert" /><div><strong>Falta registrar la solución</strong><p>{solucionError}</p></div>
                </div>
              )}
              <form onSubmit={handlePreMarcarResuelta}>
                <div className={`field ${solucionError ? 'field-error' : ''}`}>
                  <label className="field-label" htmlFor="solucion-textarea">
                    Detalle de la solución aplicada *
                  </label>
                  <textarea
                    id="solucion-textarea"
                    placeholder="Describe los trabajos realizados, componentes reparados o reemplazados y las pruebas de funcionamiento efectuadas..."
                    value={solucionTexto}
                    onChange={(e) => { setSolucionTexto(e.target.value); setSolucionError(''); }}
                    rows={4}
                  />
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="primary" icon="check" disabled={submitting}>
                    Marcar como Resuelta
                  </Button>
                </div>
              </form>
            </section>
          )}

          {/* Solución ya registrada */}
          {(esResuelta || esCerrada) && solicitud.solucion && (
            <section className="panel info-panel">
              <h2>Solución técnica aplicada</h2>
              <div style={{ background: '#f7faf8', padding: '16px', borderRadius: '8px', border: '1px solid #dbe6e1' }}>
                <small style={{ color: 'var(--verde)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  REGISTRO DE RESOLUCIÓN
                </small>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{solicitud.solucion}</p>
              </div>
            </section>
          )}

          {/* Avances y notas */}
          <section className="panel info-panel">
            <h2>Avances y notas de trabajo</h2>
            {seguimientos.length === 0 ? (
              <p className="muted-note">Aún no se han registrado notas de avance.</p>
            ) : (
              <div className="comments">
                {seguimientos.map((c, idx) => (
                  <div className="comment" key={c.id ?? idx}>
                    <div className="avatar small staff">
                      {(c.nombre || 'T').split(' ').map(w => w[0]).slice(0, 2).join('')}
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
            {(esAsignada || esEnAtencion) && (
              <form className="comment-form" onSubmit={handleAgregarAvance}>
                <textarea
                  aria-label="Registrar nota de avance"
                  placeholder="Registrar una nota técnica de avance o coordinación..."
                  value={notaAvance}
                  onChange={(e) => setNotaAvance(e.target.value)}
                />
                <Button type="submit" icon="send" disabled={submitting || !notaAvance.trim()}>
                  {submitting ? 'Guardando…' : 'Agregar nota de avance'}
                </Button>
              </form>
            )}
          </section>

          {/* Evidencias */}
          <section className="panel info-panel">
            <h2>Evidencias técnicas y del solicitante</h2>
            {archivoError && (
              <div className="message error" role="alert" style={{ marginBottom: '14px' }}>
                <Icon name="alert" /><div><strong>Error de adjunto</strong><p>{archivoError}</p></div>
              </div>
            )}
            {evidencias.length === 0 ? (
              <p className="muted-note">No se han registrado evidencias para esta solicitud.</p>
            ) : (
              <EvidenciasGaleria evidencias={evidencias} />
            )}
            {esEnAtencion && (
              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="upload"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%' }}
                >
                  <Icon name="upload" size={20} />
                  <span>
                    <strong>Adjuntar foto o reporte técnico de atención</strong>
                    <small>{EVIDENCIA.formatosTexto}</small>
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple
                  accept={EVIDENCIA.tipos.join(',')}
                  onChange={handleUploadEvidencias}
                />
              </div>
            )}
          </section>
        </main>

        {/* Panel lateral */}
        <aside>
          <section className="panel status-panel">
            <div className="card-label">ESTADO DE LA ATENCIÓN</div>
            <Badge texto={estadoUi} />
            <p style={{ marginTop: '10px' }}>
              {esAsignada   && 'La orden está asignada. Inicia cuando estés listo.'}
              {esEnAtencion && 'Trabajos en curso. Registra la solución para finalizar.'}
              {esResuelta   && 'Solución concluida. Esperando confirmación del supervisor.'}
              {esCerrada    && 'Servicio concluido y cerrado formalmente.'}
            </p>
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--borde)' }}>
              <div className="card-label">DATOS RÁPIDOS</div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0' }}>
                <strong>Código:</strong> {solicitud.codigo}
              </p>
              {solicitud.prioridad && (
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0' }}>
                  <strong>Prioridad:</strong> {solicitud.prioridad}
                </p>
              )}
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0' }}>
                <strong>Ubicación:</strong> {solicitud.ubicacion}
              </p>
            </div>
          </section>
        </aside>
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        title="¿Marcar solicitud como Resuelta?"
        message="Confirma que los trabajos han concluido y la solución fue verificada. La solicitud pasará a revisión del supervisor."
        confirmText="Confirmar resolución"
        cancelText="Continuar editando"
        isDestructive={false}
        icon="check"
        onConfirm={handleConfirmarResolucion}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
