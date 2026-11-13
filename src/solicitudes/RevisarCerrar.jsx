import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSolicitudByCodigo as getMock, SOLICITUDES_MOCK } from '../mocks/solicitudes';
import {
  getSolicitudAny,
  getEvidencias,
  getHistorial,
  cambiarEstado,
} from '../services/solicitudes.js';
import { getErrorMessage } from '../services/apiClient.js';
import { formatFechaVisual } from '../services/mappers.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import Badge from '../components/Badge';
import PlazoSolicitud from '../components/PlazoSolicitud';
import Icon from '../components/Icon';
import ConfirmModal from '../components/ConfirmModal';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function RevisarCerrar() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [solicitud,   setSolicitud]   = useState(null);
  const [evidencias,  setEvidencias]  = useState([]);
  const [historial,   setHistorial]   = useState([]);

  const [loading,     setLoading]     = useState(true);
  const [errLoad,     setErrLoad]     = useState('');
  const [observacion, setObservacion] = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [errSubmit,   setErrSubmit]   = useState('');
  const [cerradaExito,setCerradaExito]= useState(false);

  useEffect(() => {
    setLoading(true);
    setErrLoad('');

    if (USE_MOCKS) {
      const s = getMock(id);
      if (!s) {
        setErrLoad('No se encontró la solicitud.');
      } else {
        setSolicitud(s);
        setEvidencias(s.evidencias || []);
        setHistorial([
          { id: 1, estadoOrigen: 'En atención', estadoDestino: 'Resuelta', cambiadoPor: s.responsable, observacion: 'Solución registrada', tiempo: s.fecha },
          { id: 2, estadoOrigen: 'Asignada', estadoDestino: 'En atención', cambiadoPor: s.responsable, observacion: 'Inicio de labores', tiempo: s.fecha },
        ]);
      }
      setLoading(false);
      return;
    }

    getSolicitudAny(id)
      .then((sol) => {
        setSolicitud(sol);
        return Promise.allSettled([
          getEvidencias(sol.id),
          getHistorial(sol.id),
        ]);
      })
      .then(([resEvi, resHist]) => {
        if (resEvi.status === 'fulfilled') setEvidencias(resEvi.value || []);
        if (resHist.status === 'fulfilled') setHistorial(resHist.value || []);
      })
      .catch((err) => {
        setErrLoad(getErrorMessage(err, 'No se pudo cargar la información para revisión.'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirmarCierre = async () => {
    setModalOpen(false);
    setSubmitting(true);
    setErrSubmit('');

    if (USE_MOCKS) {
      const target = SOLICITUDES_MOCK.find((s) => s.codigo === (solicitud.codigo || id));
      if (target) target.estado = 'Cerrada';
      setSolicitud((prev) => ({ ...prev, estado: 'Cerrada' }));
      setCerradaExito(true);
      setSubmitting(false);
      return;
    }

    try {
      // Invocar PUT /api/solicitudes/{id}/estado con CERRADA
      const updated = await cambiarEstado(solicitud.id, 'CERRADA', {
        observacion: observacion.trim() || 'Conformidad de servicio otorgada por el supervisor.',
      });

      setSolicitud(updated);
      setCerradaExito(true);
    } catch (err) {
      setErrSubmit(getErrorMessage(err, 'No se pudo cerrar la solicitud. Verifica permisos o estado.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="narrow-page">
        <p className="muted-note">Cargando datos de resolución y evidencias…</p>
      </div>
    );
  }

  if (errLoad || !solicitud) {
    return (
      <div className="narrow-page">
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>{errLoad || 'Solicitud no encontrada'}</strong></div>
        </div>
        <Button onClick={() => navigate('/supervisor/solicitudes')}>Volver a solicitudes</Button>
      </div>
    );
  }

  // Validación de Regla RN-007: Solo solicitudes en RESUELTA pueden cerrarse
  const esResuelta = USE_MOCKS
    ? (solicitud.estado === 'Resuelta')
    : (solicitud.estadoApi === 'RESUELTA' || solicitud.estado === 'Resuelta');

  if (!esResuelta && !cerradaExito) {
    return (
      <div className="narrow-page">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate('/supervisor/solicitudes')}
        >
          <Icon name="arrow" size={18} /> Volver a solicitudes
        </button>

        <PageHead title="Revisión no disponible" text="Control de conformidad de servicio." />

        <div className="message error" role="alert" style={{ padding: '20px' }}>
          <Icon name="alert" size={24} />
          <div>
            <strong style={{ fontSize: '15px' }}>Restricción de cierre (Regla de negocio RN-007)</strong>
            <p style={{ margin: '6px 0 16px 0', lineHeight: 1.5 }}>
              Solo una solicitud con estado <strong>Resuelta</strong> puede ser cerrada formalmente tras la conformidad del servicio.
              El estado actual de esta solicitud es <strong>{solicitud.estado}</strong>.
            </p>
            <Button onClick={() => navigate(`/solicitudes/${solicitud.codigo}`)}>
              Ver detalle de la solicitud
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="narrow-page">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate('/supervisor/solicitudes')}
      >
        <Icon name="arrow" size={18} /> Volver a solicitudes
      </button>

      <PageHead
        title="Revisar y cerrar solicitud"
        text="Verifica la solución técnica y evidencias antes de otorgar la conformidad formal (RN-007)."
      />

      {/* Pantalla de éxito tras el cierre */}
      {cerradaExito && (
        <div className="message success" role="status" style={{ marginBottom: '24px' }}>
          <Icon name="check" size={24} />
          <div>
            <strong style={{ fontSize: '15px' }}>Solicitud cerrada formalmente con éxito</strong>
            <p style={{ margin: '6px 0 14px 0' }}>
              La solicitud <strong>{solicitud.codigo}</strong> ha pasado a estado <strong>Cerrada</strong>. El historial queda archivado con conformidad de supervisión.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={() => navigate(`/solicitudes/${solicitud.codigo}`)}>
                Ver detalle final
              </Button>
              <Button variant="secondary" onClick={() => navigate('/supervisor/solicitudes')}>
                Ir a la bandeja
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error al intentar cerrar */}
      {errSubmit && (
        <div className="message error" role="alert" style={{ marginBottom: '20px' }}>
          <Icon name="alert" />
          <div><strong>Error al cerrar la solicitud</strong><p>{errSubmit}</p></div>
        </div>
      )}

      {/* Datos del servicio y técnico */}
      <section className="panel info-panel" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span className="code" style={{ marginRight: '8px' }}>{solicitud.codigo}</span>
            <Badge texto={solicitud.estado} />
            {solicitud.prioridad && <Badge texto={solicitud.prioridad} />}
          </div>
          <small className="muted-note">
            Técnico responsable: <strong>{solicitud.responsable || 'No indicado'}</strong>
          </small>
        </div>

        <h2 style={{ marginTop: '12px', fontSize: '18px' }}>{solicitud.titulo}</h2>
        <div className="info-grid" style={{ marginTop: '12px' }}>
          <div><small>Categoría</small><span>{solicitud.categoria || '—'}</span></div>
          <div><small>Ubicación</small><span>{solicitud.ubicacion || '—'}</span></div>
          <div><small>Solicitante</small><span>{solicitud.solicitante || '—'}</span></div>
          <div><small>Fecha registro</small><span>{solicitud.fecha || formatFechaVisual(solicitud.creadoEn)}</span></div>
          <PlazoSolicitud solicitud={solicitud} />
        </div>

        <div className="description" style={{ marginTop: '14px' }}>
          <small>Descripción del problema reportado</small>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', lineHeight: 1.5 }}>
            {solicitud.descripcion}
          </p>
        </div>
      </section>

      {/* Solución técnica registrada por el técnico */}
      <section className="panel info-panel" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="check" size={18} /> Solución técnica documentada por el técnico
        </h2>

        <div style={{ background: '#f5f9f7', border: '1px solid #cce2d6', padding: '16px', borderRadius: '8px', marginTop: '10px' }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--carbon)' }}>
            {solicitud.solucion || <em className="muted-note">No se registró texto de solución.</em>}
          </p>
        </div>
      </section>

      {/* Evidencias adjuntas */}
      <section className="panel info-panel" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px' }}>Evidencias fotográficas / documentales</h2>
        {evidencias.length === 0 ? (
          <p className="muted-note">No se adjuntaron archivos de evidencia a esta solicitud.</p>
        ) : (
          <div className="evidence-grid" style={{ marginTop: '12px' }}>
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

      {/* Historial de transiciones */}
      <section className="panel timeline" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px' }}>Trazabilidad del ciclo de atención</h2>
        {historial.length === 0 ? (
          <p className="muted-note">Sin registros en el historial.</p>
        ) : (
          [...historial].reverse().map((h, idx) => (
            <div className="timeline-item" key={h.id ?? idx}>
              <div className={`timeline-dot ${idx === 0 ? 'active' : ''}`}>
                {idx === 0 && <Icon name="check" size={12} />}
              </div>
              <div>
                <strong>{h.estadoOrigen} → {h.estadoDestino}</strong>
                <p>{h.observacion || (h.cambiadoPor ? `Registrado por ${h.cambiadoPor}` : '')}</p>
                <small>{h.tiempo || h.cambiadoEn || ''}</small>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Formulario de cierre si aún no está cerrada */}
      {!cerradaExito && (
        <section className="panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Dictamen de conformidad</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px 0' }}>
            Ingresa una observación formal de cierre antes de archivar la solicitud.
          </p>

          <label className="field">
            <span className="field-label">Observación de conformidad del supervisor (opcional)</span>
            <textarea
              rows={3}
              placeholder="Ej. Servicio verificado en sitio. El equipo opera correctamente y el usuario manifestó conformidad."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </label>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/supervisor/solicitudes')}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon="check"
              disabled={submitting}
              onClick={() => setModalOpen(true)}
            >
              {submitting ? 'Cerrando…' : 'Cerrar solicitud formalmente'}
            </Button>
          </div>
        </section>
      )}

      {/* Modal de confirmación de cierre */}
      <ConfirmModal
        isOpen={modalOpen}
        title="¿Confirmar cierre definitivo de la solicitud?"
        message={`Confirma que la solución de la solicitud ${solicitud.codigo} fue revisada y cumple con la calidad requerida. Esta acción dará por finalizado el servicio formalmente (RN-007).`}
        confirmText="Aprobar y cerrar"
        cancelText="Volver a revisar"
        isDestructive={false}
        icon="check"
        onConfirm={handleConfirmarCierre}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
