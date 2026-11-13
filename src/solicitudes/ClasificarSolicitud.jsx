import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROLES, VIGENCIA } from '../config/constants';
import { aFechaInput, fechaInputAIso } from '../config/vigencia';
import { useAuth } from '../hooks/useAuth';
import { getSolicitudByCodigo as getMock, SOLICITUDES_MOCK } from '../mocks/solicitudes';
import {
  getSolicitudAny,
  clasificarSolicitud,
} from '../services/solicitudes.js';
import { getCategorias, getPrioridades, getAreas } from '../services/catalogos.js';
import { getErrorMessage } from '../services/apiClient.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import SolicitudesSolicitantePanel from '../components/SolicitudesSolicitantePanel';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function ClasificarSolicitud() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const esSupervisorOAdmin = user?.rol === ROLES.SUPERVISOR || user?.rol === ROLES.ADMIN;

  const [solicitud,   setSolicitud]   = useState(null);
  const [categorias,  setCategorias]  = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [areas,       setAreas]       = useState([]);

  const [categoriaId, setCategoriaId] = useState('');
  const [prioridadId, setPrioridadId] = useState('');
  const [areaId,      setAreaId]      = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [errLoad,     setErrLoad]     = useState('');
  const [errSubmit,   setErrSubmit]   = useState('');
  const [successInfo, setSuccessInfo] = useState(null); // { message, estado, estadoApi }
  const [tried,       setTried]       = useState(false);

  // Carga inicial de solicitud y catálogos
  useEffect(() => {
    setLoading(true);
    setErrLoad('');

    if (USE_MOCKS) {
      const s = getMock(id);
      if (!s) {
        setErrLoad('No se encontró la solicitud.');
        setLoading(false);
        return;
      }
      setSolicitud(s);
      setCategorias([
        { id: 1, nombre: 'Mantenimiento', activo: true },
        { id: 2, nombre: 'Soporte informático', activo: true },
        { id: 3, nombre: 'Infraestructura', activo: true },
        { id: 4, nombre: 'Trámites', activo: true },
      ]);
      setPrioridades([
        { id: 1, nombre: 'Alta', nivel: 1, activo: true },
        { id: 2, nombre: 'Media', nivel: 2, activo: true },
        { id: 3, nombre: 'Baja', nivel: 3, activo: true },
      ]);
      setAreas([
        { id: 1, nombre: 'Tecnologías de la Información', activo: true },
        { id: 2, nombre: 'Servicios Generales y Mantenimiento', activo: true },
        { id: 3, nombre: 'Secretaría Académica', activo: true },
      ]);

      // Precarga en mocks si ya tenía datos
      if (s.categoriaId) setCategoriaId(String(s.categoriaId));
      else if (s.categoria) {
        const cMap = { 'Mantenimiento': '1', 'Soporte informático': '2', 'Infraestructura': '3', 'Trámites': '4' };
        if (cMap[s.categoria]) setCategoriaId(cMap[s.categoria]);
      }
      if (s.prioridadId) setPrioridadId(String(s.prioridadId));
      else if (s.prioridad) {
        const pMap = { 'Alta': '1', 'Media': '2', 'Baja': '3' };
        if (pMap[s.prioridad]) setPrioridadId(pMap[s.prioridad]);
      }
      if (s.areaId) setAreaId(String(s.areaId));
      else if (s.area) {
        const aMap = { 'Tecnologías de la Información': '1', 'Servicios Generales y Mantenimiento': '2', 'Secretaría Académica': '3' };
        if (aMap[s.area]) setAreaId(aMap[s.area]);
      }
      if (s.fechaLimite) {
        const d = new Date(s.fechaLimite);
        if (!isNaN(d.getTime())) setFechaLimite(aFechaInput(d));
      }

      setLoading(false);
      return;
    }

    Promise.all([
      getSolicitudAny(id),
      getCategorias(),
      getPrioridades(),
      getAreas(),
    ])
      .then(([sol, cats, prios, ars]) => {
        setSolicitud(sol);
        const catsActivas = cats.filter((c) => c.activo !== false);
        const priosActivas = prios.filter((p) => p.activo !== false);
        const arsActivas = ars.filter((a) => a.activo !== false);

        setCategorias(catsActivas);
        setPrioridades(priosActivas);
        setAreas(arsActivas);

        // Precarga si la solicitud ya estaba clasificada
        if (sol.categoriaId) {
          setCategoriaId(String(sol.categoriaId));
        } else if (sol.categoria) {
          const found = catsActivas.find((c) => c.nombre === sol.categoria);
          if (found) setCategoriaId(String(found.id));
        }

        if (sol.prioridadId) {
          setPrioridadId(String(sol.prioridadId));
        } else if (sol.prioridad) {
          const found = priosActivas.find((p) => p.nombre === sol.prioridad);
          if (found) setPrioridadId(String(found.id));
        }

        if (sol.areaId) {
          setAreaId(String(sol.areaId));
        } else if (sol.area) {
          const found = arsActivas.find((a) => a.nombre === sol.area);
          if (found) setAreaId(String(found.id));
        }

        if (sol.fechaLimite) {
          const d = new Date(sol.fechaLimite);
          if (!isNaN(d.getTime())) setFechaLimite(aFechaInput(d));
        } else if (sol.prioridadId || sol.prioridad) {
          const prioObj = priosActivas.find((p) => String(p.id) === String(sol.prioridadId) || p.nombre === sol.prioridad);
          const prioNombre = prioObj?.nombre || sol.prioridad || 'Media';
          const dias = VIGENCIA.plazoDiasPorPrioridad[prioNombre] ?? VIGENCIA.plazoDiasSinPrioridad;
          const fechaBase = sol.creadoEn ? new Date(sol.creadoEn) : new Date();
          fechaBase.setDate(fechaBase.getDate() + dias);
          setFechaLimite(aFechaInput(fechaBase));
        }
      })
      .catch((err) => {
        setErrLoad(getErrorMessage(err, 'No se pudo cargar la información para clasificar.'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Actualizar fecha límite sugerida al cambiar la prioridad
  const handlePrioridadChange = (val) => {
    setPrioridadId(val);
    const prioObj = prioridades.find((p) => String(p.id) === String(val));
    const prioNombre = prioObj?.nombre || 'Media';
    const dias = VIGENCIA.plazoDiasPorPrioridad[prioNombre] ?? VIGENCIA.plazoDiasSinPrioridad;

    const fechaBase = new Date();
    fechaBase.setDate(fechaBase.getDate() + dias);
    const sugerida = aFechaInput(fechaBase);
    setFechaLimite(sugerida);
  };

  // Validaciones de formulario
  const errors = {
    categoriaId: !categoriaId ? 'Selecciona una categoría' : '',
    prioridadId: !prioridadId ? 'Selecciona una prioridad' : '',
    areaId:      !areaId      ? 'Selecciona el área responsable' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const getFieldError = (k) => (tried ? errors[k] : '');

  // Determinar si ya estaba clasificada
  const yaClasificada = Boolean(
    solicitud && (
      solicitud.categoriaId ||
      solicitud.areaId ||
      solicitud.prioridadId ||
      (solicitud.categoria && solicitud.categoria !== 'Sin categoría' && solicitud.categoria !== '—')
    )
  );

  // Determinar si ya tiene técnico asignado (si lo tiene, se bloquea la edición de clasificación)
  const tieneTecnicoAsignado = Boolean(
    solicitud && (
      (solicitud.responsableId && solicitud.responsableId !== 0) ||
      (solicitud.responsable && solicitud.responsable !== 'Sin asignar')
    )
  );

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTried(true);
    setErrSubmit('');
    setSuccessInfo(null);

    if (hasErrors) return;

    setSubmitting(true);

    if (USE_MOCKS) {
      // Modo mocks
      const cat = categorias.find((c) => String(c.id) === String(categoriaId))?.nombre || '';
      const prio = prioridades.find((p) => String(p.id) === String(prioridadId))?.nombre || '';
      const area = areas.find((a) => String(a.id) === String(areaId))?.nombre || '';

      const fechaLimiteIso = fechaInputAIso(fechaLimite);

      const target = SOLICITUDES_MOCK.find((s) => s.codigo === (solicitud.codigo || id));
      if (target) {
        target.categoria = cat;
        target.categoriaId = Number(categoriaId);
        target.prioridad = prio;
        target.prioridadId = Number(prioridadId);
        target.area = area;
        target.areaId = Number(areaId);
        target.estado = 'En evaluación';
        target.fechaLimite = fechaLimiteIso;
      }

      setSolicitud((prev) => ({
        ...prev,
        categoria: cat,
        categoriaId: Number(categoriaId),
        prioridad: prio,
        prioridadId: Number(prioridadId),
        area,
        areaId: Number(areaId),
        estado: 'En evaluación',
        fechaLimite: fechaLimiteIso,
      }));

      setSuccessInfo({
        message: yaClasificada ? 'Clasificación actualizada correctamente.' : 'Solicitud clasificada correctamente.',
        estado: 'En evaluación',
        estadoApi: 'EN_EVALUACION',
      });
      setSubmitting(false);
      return;
    }

    try {
      // Fecha límite en ISO (fin del día local) si fue seleccionada
      const fechaIso = fechaInputAIso(fechaLimite);

      // 1. Invocar PUT /api/solicitudes/{id}/clasificacion
      await clasificarSolicitud(solicitud.id, {
        categoriaId: Number(categoriaId),
        prioridadId: Number(prioridadId),
        areaId:      Number(areaId),
        fechaLimite: fechaIso,
      });

      // 2. Volver a pedir la solicitud (GET) y mostrar el estado devuelto por el backend
      // NO llamamos a PUT /estado bajo ninguna circunstancia
      const updated = await getSolicitudAny(solicitud.id);
      setSolicitud(updated);

      setSuccessInfo({
        message: yaClasificada ? 'Clasificación actualizada con éxito.' : 'Solicitud clasificada con éxito.',
        estado: updated?.estado || 'Registrada',
        estadoApi: updated?.estadoApi || 'REGISTRADA',
      });
    } catch (err) {
      // Mostrar el mensaje tal cual del backend sin ocultarlo
      const rawMsg = err.body?.message || (typeof err.body === 'string' && err.body.trim() ? err.body : null) || err.message;
      setErrSubmit(rawMsg || 'El backend rechazó la clasificación.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="narrow-page">
        <p className="muted-note">Cargando datos de la solicitud y catálogos…</p>
      </div>
    );
  }

  if (errLoad) {
    return (
      <div className="narrow-page">
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>{errLoad}</strong></div>
        </div>
        <Button onClick={() => navigate('/supervisor/solicitudes')}>
          Volver a solicitudes
        </Button>
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
        title={yaClasificada ? 'Editar clasificación' : 'Clasificar y priorizar solicitud'}
        text={yaClasificada
          ? 'Modifica la categoría, prioridad, área responsable o plazo estimado para la atención.'
          : 'Define categoría, prioridad, área responsable y plazo estimado para la atención.'}
      />

      {/* Resumen de la solicitud a clasificar */}
      <section className="panel info-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span className="code" style={{ marginRight: '8px' }}>{solicitud?.codigo}</span>
            <Badge texto={solicitud?.estado} />
          </div>
          <small className="muted-note">
            Registrada el {solicitud?.fecha || solicitud?.creadoEn || 'Reciente'}
          </small>
        </div>

        <h2 style={{ marginTop: '12px', fontSize: '18px' }}>{solicitud?.titulo}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '4px 0 12px 0' }}>
          <strong>Ubicación:</strong> {solicitud?.ubicacion}
          {solicitud?.solicitante && ` · Solicitante: ${solicitud.solicitante}`}
          {solicitud?.responsable && solicitud?.responsable !== 'Sin asignar' && (
            <span> · Responsable: <strong>{solicitud.responsable}</strong></span>
          )}
        </p>
        <p style={{ fontSize: '13px', lineHeight: 1.5, background: '#f8faf9', padding: '12px', borderRadius: '6px' }}>
          {solicitud?.descripcion}
        </p>
      </section>

      {/* Detección de duplicados: otras solicitudes del mismo solicitante */}
      {esSupervisorOAdmin && (
        <SolicitudesSolicitantePanel
          solicitanteId={solicitud?.solicitanteId}
          solicitanteNombre={solicitud?.solicitante}
          excluirSolicitudId={solicitud?.id ?? solicitud?.codigo ?? id}
        />
      )}

      {/* BLOQUEO: Si ya hay técnico asignado, no se ofrece edición */}
      {tieneTecnicoAsignado ? (
        <div
          className="message"
          style={{
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            padding: '18px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
          role="alert"
        >
          <Icon name="alert" size={22} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '15px', display: 'block', marginBottom: '6px' }}>
              Para cambiar el área, primero hay que reasignar
            </strong>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
              Esta solicitud ya cuenta con un técnico asignado (<strong>{solicitud?.responsable}</strong>).
              Por regla operativa, no se permite reclasificar ni modificar el área técnica mientras exista una asignación activa.
            </p>
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <Button
                variant="secondary"
                onClick={() => navigate('/supervisor/solicitudes')}
              >
                Volver a solicitudes
              </Button>
              <Button onClick={() => navigate(`/solicitudes/${solicitud?.codigo || solicitud?.id}`)}>
                Ver detalle de la solicitud
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mensaje de error si falló la operación (muestra mensaje directo del backend) */}
          {errSubmit && (
            <div className="message error" role="alert" style={{ marginBottom: '20px' }}>
              <Icon name="alert" />
              <div>
                <strong>Error del backend al clasificar</strong>
                <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{errSubmit}</p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito tras clasificar */}
          {successInfo && (
            <div className="message success" role="status" style={{ marginBottom: '20px' }}>
              <Icon name="check" />
              <div style={{ flex: 1 }}>
                <strong>{successInfo.message}</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  Estado devuelto por el backend: <strong>{successInfo.estado}</strong> ({successInfo.estadoApi}).
                </p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/supervisor/solicitudes/${solicitud?.codigo || solicitud?.id}/asignar`)}
                  >
                    Continuar a asignar técnico
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/supervisor/solicitudes')}
                  >
                    Volver a la bandeja
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de clasificación / edición */}
          {!successInfo && (
            <form className="form-card" onSubmit={handleSubmit} noValidate>
              <div className="form-section">
                <div className="form-section-head">
                  <span>1</span>
                  <div>
                    <h2>Clasificación operativa</h2>
                    <p>Elige el área técnica y el tipo de servicio.</p>
                  </div>
                </div>

                {/* Categoría */}
                <label className={`field ${getFieldError('categoriaId') ? 'field-error' : ''}`}>
                  <span className="field-label">Categoría *</span>
                  <span className="select-wrap">
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      aria-invalid={!!getFieldError('categoriaId')}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                      ))}
                    </select>
                    <Icon name="down" size={16} />
                  </span>
                  {getFieldError('categoriaId') && (
                    <span className="error-text" role="alert">
                      <Icon name="alert" size={14} /> {getFieldError('categoriaId')}
                    </span>
                  )}
                </label>

                {/* Área Responsable */}
                <label className={`field ${getFieldError('areaId') ? 'field-error' : ''}`}>
                  <span className="field-label">Área responsable *</span>
                  <span className="select-wrap">
                    <select
                      value={areaId}
                      onChange={(e) => setAreaId(e.target.value)}
                      aria-invalid={!!getFieldError('areaId')}
                    >
                      <option value="">Selecciona el área responsable</option>
                      {areas.map((a) => (
                        <option key={a.id} value={String(a.id)}>{a.nombre}</option>
                      ))}
                    </select>
                    <Icon name="down" size={16} />
                  </span>
                  {getFieldError('areaId') && (
                    <span className="error-text" role="alert">
                      <Icon name="alert" size={14} /> {getFieldError('areaId')}
                    </span>
                  )}
                </label>
              </div>

              <div className="form-section">
                <div className="form-section-head">
                  <span>2</span>
                  <div>
                    <h2>Prioridad y plazo</h2>
                    <p>Establece la urgencia y la fecha límite de atención.</p>
                  </div>
                </div>

                {/* Prioridad */}
                <label className={`field ${getFieldError('prioridadId') ? 'field-error' : ''}`}>
                  <span className="field-label">Prioridad *</span>
                  <span className="select-wrap">
                    <select
                      value={prioridadId}
                      onChange={(e) => handlePrioridadChange(e.target.value)}
                      aria-invalid={!!getFieldError('prioridadId')}
                    >
                      <option value="">Selecciona una prioridad</option>
                      {prioridades.map((p) => (
                        <option key={p.id} value={String(p.id)}>{p.nombre}</option>
                      ))}
                    </select>
                    <Icon name="down" size={16} />
                  </span>
                  {getFieldError('prioridadId') && (
                    <span className="error-text" role="alert">
                      <Icon name="alert" size={14} /> {getFieldError('prioridadId')}
                    </span>
                  )}
                </label>

                {/* Fecha Límite */}
                <label className="field">
                  <span className="field-label">Fecha límite sugerida</span>
                  <input
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    min={aFechaInput(new Date())}
                  />
                  <span className="field-hint" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    Plazo sugerido según prioridad. Puedes ajustarlo libremente.
                  </span>
                </label>
              </div>

              <div className="form-footer">
                <p>Los campos marcados con * son obligatorios.</p>
                <div className="row">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/supervisor/solicitudes')}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? (yaClasificada ? 'Guardando cambios…' : 'Guardando clasificación…')
                      : (yaClasificada ? 'Guardar cambios' : 'Guardar clasificación')}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
