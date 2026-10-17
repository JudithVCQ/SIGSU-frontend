import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EVIDENCIA } from '../config/constants';
import {
  getSolicitudByCodigo,
  updateSolicitudEstado,
  addComentarioSolicitud,
  addEvidenciasSolicitud,
} from '../mocks/solicitudes';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import ConfirmModal from '../components/ConfirmModal';
import './solicitudes.css';

export default function AtencionSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Obtener la solicitud activa
  const initialSolicitud = getSolicitudByCodigo(id);
  const [solicitud, setSolicitud] = useState(initialSolicitud);

  // Estados de formularios locales
  const [notaAvance, setNotaAvance] = useState('');
  const [solucionTexto, setSolucionTexto] = useState(solicitud?.solucion || '');
  const [solucionError, setSolucionError] = useState('');
  const [archivoError, setArchivoError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);

  // Validación de asignación y existencia (RN-005)
  if (!solicitud || solicitud.responsable !== user?.nombre) {
    return (
      <div className="narrow-page">
        <PageHead
          title="Atención no disponible"
          text="No tienes asignada esta orden de trabajo o la solicitud no existe."
        />
        <div className="empty">
          <Icon name="alert" size={32} />
          <strong>Acceso restringido</strong>
          <p>
            Solo el técnico designado como responsable puede atender esta solicitud (Regla de negocio RN-005).
          </p>
          <Button onClick={() => navigate('/tecnico')}>Volver a mis asignaciones</Button>
        </div>
      </div>
    );
  }

  // Iniciar atención (Asignada -> En atención) (RN-005)
  const handleIniciarAtencion = () => {
    const updated = updateSolicitudEstado(solicitud.codigo, 'En atención');
    const nuevoComentario = {
      nombre: user.nombre,
      rol: 'Soporte técnico',
      texto: 'Inició formalmente la atención técnica de la solicitud en sitio.',
      tiempo: 'Hoy · Justo ahora',
    };
    addComentarioSolicitud(solicitud.codigo, nuevoComentario);

    setSolicitud({
      ...updated,
      comentarios: [...(updated.comentarios || []), nuevoComentario],
    });
    setMensajeExito("Atención iniciada con éxito. El estado cambió a 'En atención'.");
  };

  // Registrar nota de avance
  const handleAgregarAvance = (e) => {
    e.preventDefault();
    if (!notaAvance.trim()) return;

    const comentario = {
      nombre: user.nombre,
      rol: 'Soporte técnico',
      texto: notaAvance.trim(),
      tiempo: 'Hoy · Justo ahora',
    };

    addComentarioSolicitud(solicitud.codigo, comentario);
    setSolicitud({
      ...solicitud,
      comentarios: [...(solicitud.comentarios || []), comentario],
    });
    setNotaAvance('');
    setMensajeExito('Avance técnico registrado en el historial de la solicitud.');
  };

  // Subir evidencias técnicas respetando límites de EVIDENCIA
  const handleUploadEvidencias = (e) => {
    setArchivoError('');
    const files = Array.from(e.target.files || []);
    const valid = [];

    for (const f of files) {
      if (!EVIDENCIA.tipos.includes(f.type)) {
        setArchivoError(`Formato no admitido en "${f.name}". Usa PNG, JPG o PDF.`);
        continue;
      }
      if (f.size > EVIDENCIA.maxMB * 1024 * 1024) {
        setArchivoError(`"${f.name}" supera el peso máximo de ${EVIDENCIA.maxMB} MB.`);
        continue;
      }
      valid.push({
        nombre: f.name,
        tamano: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      });
    }

    if (valid.length > 0) {
      addEvidenciasSolicitud(solicitud.codigo, valid);
      setSolicitud({
        ...solicitud,
        evidencias: [...(solicitud.evidencias || []), ...valid],
      });
      setMensajeExito(`${valid.length} archivo(s) de evidencia técnica adjuntado(s).`);
    }
    e.target.value = '';
  };

  // Pre-confirmación de solución (RN-006)
  const handlePreMarcarResuelta = (e) => {
    e.preventDefault();
    setSolucionError('');

    if (solucionTexto.trim().length < 10) {
      setSolucionError('Debes describir la solución técnica aplicada (mínimo 10 caracteres) antes de marcar como resuelta.');
      return;
    }

    setModalConfirmOpen(true);
  };

  // Confirmar resolución final (En atención -> Resuelta)
  const handleConfirmarResolucion = () => {
    setModalConfirmOpen(false);

    const updated = updateSolicitudEstado(solicitud.codigo, 'Resuelta', {
      solucion: solucionTexto.trim(),
    });

    const comentarioResolucion = {
      nombre: user.nombre,
      rol: 'Soporte técnico',
      texto: `Solución técnica registrada: ${solucionTexto.trim()}`,
      tiempo: 'Hoy · Justo ahora',
    };
    addComentarioSolicitud(solicitud.codigo, comentarioResolucion);

    setSolicitud({
      ...updated,
      solucion: solucionTexto.trim(),
      comentarios: [...(updated.comentarios || []), comentarioResolucion],
    });

    setMensajeExito(
      'Solución registrada con éxito. La solicitud pasó a estado "Resuelta" y queda pendiente de revisión del supervisor.'
    );
  };

  return (
    <div>
      <button type="button" className="back-link" onClick={() => navigate('/tecnico')}>
        <Icon name="arrow" size={18} /> Volver a mis asignaciones
      </button>

      {/* Cabecera de la solicitud */}
      <div className="detail-head">
        <div>
          <div className="row wrap">
            <span className="code">{solicitud.codigo}</span>
            <Badge texto={solicitud.estado} />
            <Badge texto={solicitud.prioridad} />
          </div>
          <h1>Atención: {solicitud.titulo}</h1>
          <p>Registrada el {solicitud.fecha} · Responsable: {solicitud.responsable}</p>
        </div>
      </div>

      {/* Mensaje de confirmación o notificación temporal */}
      {mensajeExito && (
        <div className="message success" role="status">
          <Icon name="check" />
          <div>
            <strong>{mensajeExito}</strong>
          </div>
        </div>
      )}

      {/* Banner de acción según estado */}
      {solicitud.estado === 'Asignada' && (
        <div className="atencion-banner">
          <div>
            <h3>Orden de trabajo lista para iniciar</h3>
            <p>
              Para registrar avances técnicos, adjuntar evidencias y registrar la solución,
              inicia formalmente la atención de esta solicitud.
            </p>
          </div>
          <Button variant="primary" icon="check" onClick={handleIniciarAtencion}>
            Iniciar atención
          </Button>
        </div>
      )}

      {solicitud.estado === 'Resuelta' && (
        <div className="message success" style={{ marginBottom: '24px' }}>
          <Icon name="check" />
          <div>
            <strong>Solicitud Resuelta · Pendiente de revisión del supervisor</strong>
            <p>
              Los trabajos técnicos han finalizado y la solución ha sido documentada. El supervisor
              se encargará de revisar la conformidad para el cierre formal (RN-007).
            </p>
          </div>
        </div>
      )}

      {solicitud.estado === 'Cerrada' && (
        <div className="message" style={{ background: '#e6e7e7', color: '#5f6466', marginBottom: '24px' }}>
          <Icon name="check" />
          <div>
            <strong>Solicitud Cerrada</strong>
            <p>Esta solicitud fue cerrada formalmente tras la conformidad del servicio. Vista de solo lectura.</p>
          </div>
        </div>
      )}

      <div className="detail-grid">
        <main className="detail-main">
          {/* Panel de datos de la orden */}
          <section className="panel info-panel">
            <h2>Datos del servicio reportado</h2>
            <div className="info-grid">
              <div>
                <small>Categoría</small>
                <span>{solicitud.categoria}</span>
              </div>
              <div>
                <small>Ubicación</small>
                <span>{solicitud.ubicacion}</span>
              </div>
              <div>
                <small>Estado actual</small>
                <Badge texto={solicitud.estado} />
              </div>
              <div>
                <small>Prioridad asignada</small>
                <Badge texto={solicitud.prioridad} />
              </div>
            </div>
            <div className="description">
              <small>Descripción del problema</small>
              <p>{solicitud.descripcion}</p>
            </div>
          </section>

          {/* Formulario de registro de solución (Solo cuando está En atención) */}
          {solicitud.estado === 'En atención' && (
            <section className="panel info-panel">
              <h2>Registrar solución técnica</h2>
              <p className="hint-text" style={{ marginBottom: '16px' }}>
                Regla RN-006: Solo con solución registrada la solicitud puede pasar a estado "Resuelta".
              </p>

              {solucionError && (
                <div className="message error" role="alert" style={{ marginBottom: '16px' }}>
                  <Icon name="alert" />
                  <div>
                    <strong>Falta registrar la solución</strong>
                    <p>{solucionError}</p>
                  </div>
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
                    onChange={(e) => {
                      setSolucionTexto(e.target.value);
                      setSolucionError('');
                    }}
                    rows={4}
                  />
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button type="submit" variant="primary" icon="check">
                    Marcar como Resuelta
                  </Button>
                </div>
              </form>
            </section>
          )}

          {/* Vista de solución registrada si ya está Resuelta o Cerrada */}
          {(solicitud.estado === 'Resuelta' || solicitud.estado === 'Cerrada') && solicitud.solucion && (
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

          {/* Historial de avances y comentarios */}
          <section className="panel info-panel">
            <h2>Avances y notas de trabajo</h2>
            {(!solicitud.comentarios || solicitud.comentarios.length === 0) ? (
              <p className="muted-note">Aún no se han registrado notas de avance para esta orden de trabajo.</p>
            ) : (
              <div className="comments">
                {solicitud.comentarios.map((c, idx) => (
                  <div className="comment" key={idx}>
                    <div className="avatar small staff">
                      {c.nombre ? c.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('') : 'T'}
                    </div>
                    <div>
                      <div className="comment-head">
                        <strong>{c.nombre}</strong>
                        <span>{c.rol}</span>
                        <small>{c.tiempo}</small>
                      </div>
                      <p>{c.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Solo permite agregar notas si está En atención */}
            {solicitud.estado === 'En atención' && (
              <form className="comment-form" onSubmit={handleAgregarAvance}>
                <textarea
                  aria-label="Registrar nota de avance"
                  placeholder="Registrar una nota técnica de avance o coordinación..."
                  value={notaAvance}
                  onChange={(e) => setNotaAvance(e.target.value)}
                />
                <Button type="submit" icon="send" disabled={!notaAvance.trim()}>
                  Agregar nota de avance
                </Button>
              </form>
            )}
          </section>

          {/* Evidencias */}
          <section className="panel info-panel">
            <h2>Evidencias técnicas y del solicitante</h2>
            {archivoError && (
              <div className="message error" role="alert" style={{ marginBottom: '14px' }}>
                <Icon name="alert" />
                <div>
                  <strong>Error de adjunto</strong>
                  <p>{archivoError}</p>
                </div>
              </div>
            )}

            {(!solicitud.evidencias || solicitud.evidencias.length === 0) ? (
              <p className="muted-note">No se han registrado evidencias para esta solicitud.</p>
            ) : (
              <div className="evidence-grid">
                {solicitud.evidencias.map((f, i) => (
                  <div className="evidence" key={`${f.nombre || f.name}-${i}`}>
                    <div className="evidence-thumb">
                      <Icon name="image" size={26} />
                    </div>
                    <strong>{f.nombre || f.name}</strong>
                    <small>{f.tamano || f.size}</small>
                  </div>
                ))}
              </div>
            )}

            {solicitud.estado === 'En atención' && (
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

        {/* Panel lateral de resumen del servicio */}
        <aside>
          <section className="panel status-panel">
            <div className="card-label">ESTADO DE LA ATENCIÓN</div>
            <Badge texto={solicitud.estado} />
            <p style={{ marginTop: '10px' }}>
              {solicitud.estado === 'Asignada' && 'La orden está asignada a tu nombre pero aún no ha iniciado.'}
              {solicitud.estado === 'En atención' && 'Trabajos en curso. Recuerda registrar la solución para finalizar.'}
              {solicitud.estado === 'Resuelta' && 'Solución concluida. Esperando confirmación y cierre del supervisor.'}
              {solicitud.estado === 'Cerrada' && 'Servicio concluido y cerrado formalmente.'}
            </p>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--borde)' }}>
              <div className="card-label">DATOS RÁPIDOS</div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0' }}>
                <strong>Código:</strong> {solicitud.codigo}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0' }}>
                <strong>Prioridad:</strong> {solicitud.prioridad}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0' }}>
                <strong>Ubicación:</strong> {solicitud.ubicacion}
              </p>
            </div>
          </section>
        </aside>
      </div>

      {/* Modal de confirmación para marcar como Resuelta */}
      <ConfirmModal
        isOpen={modalConfirmOpen}
        title="¿Marcar solicitud como Resuelta?"
        message="Confirma que los trabajos técnicos han concluido y la solución fue verificada. La solicitud pasará a revisión del supervisor para su cierre formal (RN-006 y RN-007)."
        confirmText="Confirmar resolución"
        cancelText="Continuar editando"
        isDestructive={false}
        icon="check"
        onConfirm={handleConfirmarResolucion}
        onCancel={() => setModalConfirmOpen(false)}
      />
    </div>
  );
}
