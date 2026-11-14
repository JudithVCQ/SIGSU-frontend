import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSolicitudesMock, SOLICITUDES_MOCK } from '../mocks/solicitudes';
import {
  getSolicitudes,
  getSolicitudAny,
  asignarTecnico,
  cambiarEstado,
} from '../services/solicitudes.js';
import { getTecnicos } from '../services/usuarios.js';
import { getDashboard } from '../services/dashboard.js';
import { getErrorMessage } from '../services/apiClient.js';
import { mensajeBackend } from './mensajeBackend';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import ConfirmModal from '../components/ConfirmModal';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function AsignarTecnico() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  // Estados de datos
  const [solicitud,        setSolicitud]        = useState(null);
  const [sinAsignarList,   setSinAsignarList]   = useState([]);
  const [tecnicos,         setTecnicos]         = useState([]);
  const [cargasMap,        setCargasMap]        = useState({}); // { [tecnicoId]: number }
  const [selectedTecnicoId,setSelectedTecnicoId]= useState('');

  // Estados de UI
  const [loading,         setLoading]         = useState(true);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [errGeneral,      setErrGeneral]      = useState('');
  const [modalOpen,       setModalOpen]       = useState(false);
  const [successInfo,     setSuccessInfo]     = useState(null);

  // Cargar datos según si hay :id o si es bandeja general /supervisor/asignacion
  useEffect(() => {
    setLoading(true);
    setErrGeneral('');
    setSuccessInfo(null);
    setSelectedTecnicoId('');

    if (USE_MOCKS) {
      if (id) {
        const s = getSolicitudesMock().find((x) => x.codigo === id || String(x.id) === String(id));
        setSolicitud(s || null);
        if (!s) setErrGeneral('No se encontró la solicitud.');
      } else {
        const unassigned = getSolicitudesMock().filter(
          (x) => !x.responsable || x.responsable === 'Sin asignar'
        );
        setSinAsignarList(unassigned);
      }
      setLoading(false);
      return;
    }

    if (id) {
      // Flujo con solicitud específica
      getSolicitudAny(id)
        .then((sol) => {
          setSolicitud(sol);
        })
        .catch((err) => {
          setErrGeneral(getErrorMessage(err, 'No se pudo cargar la solicitud.'));
        })
        .finally(() => setLoading(false));
    } else {
      // Flujo bandeja general: GET /api/solicitudes?sinAsignar=true
      getSolicitudes({ sinAsignar: true })
        .then((list) => {
          setSinAsignarList(list);
        })
        .catch((err) => {
          setErrGeneral(getErrorMessage(err, 'No se pudieron cargar las solicitudes sin asignar.'));
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Cargar técnicos y cargas cuando se tenga una solicitud seleccionada
  useEffect(() => {
    if (!solicitud) return;

    // Regla RN-004: Debe tener área y categoría antes de buscar técnicos
    const faltaClasificacion = !solicitud.areaId || !solicitud.categoriaId;
    if (faltaClasificacion) {
      setTecnicos([]);
      return;
    }

    setLoadingTecnicos(true);

    if (USE_MOCKS) {
      // Mock técnicos
      setTecnicos([
        { id: 101, nombre: 'Diego Morales', correo: 'diego.morales@universidad.edu', areaId: solicitud.areaId || 1 },
        { id: 102, nombre: 'Laura Díaz',    correo: 'laura.diaz@universidad.edu',    areaId: solicitud.areaId || 1 },
        { id: 103, nombre: 'Carlos Peña',   correo: 'carlos.pena@universidad.edu',   areaId: solicitud.areaId || 2 },
      ]);
      setCargasMap({ 101: 3, 102: 1, 103: 2 });
      setLoadingTecnicos(false);
      return;
    }

    // Modo real: Cargar técnicos del área y dashboard para cargas de trabajo
    Promise.allSettled([
      getTecnicos(solicitud.areaId),
      getDashboard(),
    ])
      .then(([resTecs, resDash]) => {
        if (resTecs.status === 'fulfilled') {
          setTecnicos(resTecs.value || []);
        } else {
          setTecnicos([]);
        }

        // Mapear carga de técnicos desde dashboard.porResponsable
        if (resDash.status === 'fulfilled' && resDash.value?.porResponsable) {
          const map = {};
          resDash.value.porResponsable.forEach((item) => {
            if (item.id) map[item.id] = item.total;
            if (item.nombre) map[item.nombre] = item.total;
          });
          setCargasMap(map);
        }
      })
      .finally(() => setLoadingTecnicos(false));
  }, [solicitud]);

  // Manejo de confirmación de asignación
  const handleConfirmAsignar = async () => {
    setModalOpen(false);
    if (!selectedTecnicoId || !solicitud) return;

    const tecnicoObj = tecnicos.find((t) => String(t.id) === String(selectedTecnicoId));
    setSubmitting(true);
    setErrGeneral('');

    if (USE_MOCKS) {
      const target = SOLICITUDES_MOCK.find((s) => s.codigo === (solicitud.codigo || id));
      if (target) {
        target.responsable = tecnicoObj?.nombre || 'Técnico asignado';
        target.estado = 'Asignada';
      }
      setSolicitud((prev) => ({
        ...prev,
        responsable: tecnicoObj?.nombre || 'Técnico asignado',
        estado: 'Asignada',
      }));
      setSuccessInfo({
        message: `Solicitud asignada exitosamente a ${tecnicoObj?.nombre || 'el técnico seleccionado'}.`,
        estado: 'Asignada',
        tecnicoNombre: tecnicoObj?.nombre,
      });
      setSubmitting(false);
      return;
    }

    try {
      // 1. Invocar POST /api/solicitudes/{solicitudId}/asignaciones {tecnicoId}
      await asignarTecnico(solicitud.id, Number(selectedTecnicoId));

      // 2. Volver a pedir la solicitud para conocer el estado real
      let actual = null;
      let aviso = '';
      try {
        actual = await getSolicitudAny(solicitud.id);
      } catch (errGet) {
        aviso = `Técnico asignado, pero no se pudo consultar el estado actual: ${mensajeBackend(errGet)}`;
      }

      // 3. Si no avanzó sola a ASIGNADA, intentar PUT /estado. Si falla, se informa
      //    el error del backend y se muestra el estado REAL (nunca "Asignada" por defecto).
      if (actual && actual.estadoApi !== 'ASIGNADA') {
        try {
          actual = await cambiarEstado(solicitud.id, 'ASIGNADA', {
            observacion: `Técnico asignado: ${tecnicoObj?.nombre || selectedTecnicoId}`,
          });
        } catch (errEstado) {
          aviso = `Técnico asignado, pero no se pudo actualizar el estado: ${mensajeBackend(errEstado)}`;
        }
      }

      if (actual) setSolicitud(actual);
      setSuccessInfo({
        message: `Técnico asignado con éxito a la solicitud ${solicitud.codigo}.`,
        estado: actual?.estado ?? 'Desconocido',
        tecnicoNombre: tecnicoObj?.nombre || 'Técnico',
        aviso,
      });
    } catch (err) {
      setErrGeneral(getErrorMessage(err, 'No se pudo completar la asignación del técnico.'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTecnico = tecnicos.find((t) => String(t.id) === String(selectedTecnicoId));

  // RENDER 1: Vista general /supervisor/asignacion (sin :id)
  if (!id) {
    return (
      <div>
        <PageHead
          title="Asignación de solicitudes"
          text="Gestiona las solicitudes pendientes de técnico y distribuye la carga operativa."
        />

        {errGeneral && (
          <div className="message error" role="alert" style={{ marginBottom: '16px' }}>
            <Icon name="alert" />
            <div><strong>{errGeneral}</strong></div>
          </div>
        )}

        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <h2>Solicitudes sin asignar</h2>
              <p>Esperando derivación a un técnico especialista</p>
            </div>
          </div>

          {loading ? (
            <p className="muted-note">Cargando solicitudes sin asignar…</p>
          ) : sinAsignarList.length === 0 ? (
            <div className="empty">
              <Icon name="check" size={28} />
              <strong>No hay solicitudes pendientes de asignación</strong>
              <p>Todas las solicitudes activas ya cuentan con un técnico responsable.</p>
              <Button variant="secondary" onClick={() => navigate('/supervisor/solicitudes')}>
                Ir a todas las solicitudes
              </Button>
            </div>
          ) : (
            <div className="desktop-table">
              <table className="req-table">
                <thead>
                  <tr>
                    <th>Solicitud</th>
                    <th>Categoría</th>
                    <th>Área</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sinAsignarList.map((r) => {
                    const faltaClasificar = !r.areaId || !r.categoriaId;
                    return (
                      <tr key={r.codigo || r.id}>
                        <td>
                          <div className="request-link static">
                            <strong>{r.codigo}</strong>
                            <span>{r.titulo}</span>
                          </div>
                        </td>
                        <td>{r.categoria || <small className="muted-note">Sin categoría</small>}</td>
                        <td>{r.area || <small className="muted-note">Sin área</small>}</td>
                        <td>{r.prioridad ? <Badge texto={r.prioridad} /> : '—'}</td>
                        <td><Badge texto={r.estado} /></td>
                        <td className="act">
                          {faltaClasificar ? (
                            <Button
                              variant="secondary"
                              onClick={() => navigate(`/supervisor/solicitudes/${r.codigo || r.id}/clasificar`)}
                            >
                              Clasificar primero
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={() => navigate(`/supervisor/solicitudes/${r.codigo || r.id}/asignar`)}
                            >
                              Asignar técnico
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  // RENDER 2: Flujo directo con :id (/supervisor/solicitudes/:id/asignar)
  if (loading) {
    return (
      <div className="narrow-page">
        <p className="muted-note">Cargando datos de la solicitud y técnicos…</p>
      </div>
    );
  }

  if (errGeneral && !solicitud) {
    return (
      <div className="narrow-page">
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>{errGeneral}</strong></div>
        </div>
        <Button onClick={() => navigate('/supervisor/solicitudes')}>Volver a solicitudes</Button>
      </div>
    );
  }

  const faltaClasificacion = !solicitud?.areaId || !solicitud?.categoriaId;

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
        title="Asignar técnico responsable"
        text="Deriva la orden de trabajo al personal técnico idóneo para su atención."
      />

      {/* Resumen de la solicitud */}
      <section className="panel info-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span className="code" style={{ marginRight: '8px' }}>{solicitud?.codigo}</span>
            <Badge texto={solicitud?.estado} />
            {solicitud?.prioridad && <Badge texto={solicitud?.prioridad} />}
          </div>
          <small className="muted-note">
            Área: <strong>{solicitud?.area || 'No asignada'}</strong>
          </small>
        </div>

        <h2 style={{ marginTop: '12px', fontSize: '18px' }}>{solicitud?.titulo}</h2>
        <div className="info-grid" style={{ marginTop: '12px' }}>
          <div><small>Categoría</small><span>{solicitud?.categoria || '—'}</span></div>
          <div><small>Área técnica</small><span>{solicitud?.area || '—'}</span></div>
          <div><small>Ubicación</small><span>{solicitud?.ubicacion || '—'}</span></div>
          <div><small>Responsable actual</small><span>{solicitud?.responsable || 'Sin asignar'}</span></div>
        </div>
      </section>

      {/* Error de operación */}
      {errGeneral && (
        <div className="message error" role="alert" style={{ marginBottom: '20px' }}>
          <Icon name="alert" />
          <div><strong>Error en la asignación</strong><p>{errGeneral}</p></div>
        </div>
      )}

      {/* Pantalla de Éxito */}
      {successInfo && (
        <div
          className={`message ${successInfo.aviso ? 'error' : 'success'}`}
          role={successInfo.aviso ? 'alert' : 'status'}
          style={{ marginBottom: '20px' }}
        >
          <Icon name={successInfo.aviso ? 'alert' : 'check'} />
          <div style={{ flex: 1 }}>
            <strong>{successInfo.aviso || successInfo.message}</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              Estado actual: <strong>{successInfo.estado}</strong> · Responsable: <strong>{successInfo.tecnicoNombre}</strong>
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
              <Button onClick={() => navigate(`/solicitudes/${solicitud?.codigo}`)}>
                Ver detalle de solicitud
              </Button>
              <Button variant="secondary" onClick={() => navigate('/supervisor/asignacion')}>
                Ir a pendientes de asignación
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BLOQUEO POR REGLA RN-004: Falta clasificar */}
      {!successInfo && faltaClasificacion && (
        <div className="message error" role="alert" style={{ padding: '20px' }}>
          <Icon name="alert" size={24} />
          <div>
            <strong style={{ fontSize: '15px' }}>Asignación bloqueada</strong>
            <p style={{ margin: '6px 0 16px 0', lineHeight: 1.5 }}>
              Para poder asignar un técnico, la solicitud debe contar previamente con una <strong>categoría</strong> y un <strong>área responsable</strong> definidas.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(`/supervisor/solicitudes/${solicitud?.codigo || solicitud?.id}/clasificar`)}
            >
              Clasificar solicitud ahora
            </Button>
          </div>
        </div>
      )}

      {/* Formulario de selección de técnico (solo si cumple RN-004) */}
      {!successInfo && !faltaClasificacion && (
        <section className="panel" style={{ padding: '24px' }}>
          <div className="panel-head" style={{ marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', margin: 0 }}>Técnicos disponibles en {solicitud.area}</h2>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0 0' }}>
                Selecciona al técnico que asumirá la orden de trabajo.
              </p>
            </div>
          </div>

          {loadingTecnicos ? (
            <p className="muted-note">Cargando personal técnico y disponibilidad…</p>
          ) : tecnicos.length === 0 ? (
            <div className="empty">
              <Icon name="alert" size={24} />
              <strong>No se encontraron técnicos activos en esta área</strong>
              <p>Revisa la configuración de usuarios en el sistema.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
              {tecnicos.map((t) => {
                const carga = cargasMap[t.id] ?? cargasMap[t.nombre] ?? 0;
                const isSelected = String(t.id) === String(selectedTecnicoId);

                return (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? 'var(--verde)' : 'var(--borde)'}`,
                      background: isSelected ? 'var(--verde-suave)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="radio"
                        name="tecnicoId"
                        value={String(t.id)}
                        checked={isSelected}
                        onChange={() => setSelectedTecnicoId(String(t.id))}
                      />
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--carbon)' }}>
                          {t.nombre}
                        </strong>
                        <small style={{ color: 'var(--muted)' }}>{t.correo}</small>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        className="badge"
                        style={{
                          background: carga > 4 ? 'var(--peligro-fondo)' : '#EAECEB',
                          color: carga > 4 ? '#8B2C2C' : 'var(--carbon)',
                          fontSize: '11px',
                        }}
                      >
                        {carga} {carga === 1 ? 'orden activa' : 'órdenes activas'}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/supervisor/solicitudes')}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!selectedTecnicoId || submitting}
              onClick={() => setModalOpen(true)}
            >
              {submitting ? 'Asignando…' : 'Asignar técnico'}
            </Button>
          </div>
        </section>
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={modalOpen}
        title="¿Confirmar asignación técnica?"
        message={`¿Deseas asignar la solicitud ${solicitud?.codigo} a ${selectedTecnico?.nombre}? El técnico recibirá la orden en su bandeja de asignaciones.`}
        confirmText="Confirmar asignación"
        cancelText="Volver"
        isDestructive={false}
        icon="users"
        onConfirm={handleConfirmAsignar}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
