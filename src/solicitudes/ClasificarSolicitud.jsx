import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VIGENCIA } from '../config/constants';
import { getSolicitudByCodigo as getMock, SOLICITUDES_MOCK } from '../mocks/solicitudes';
import {
  getSolicitudAny,
  clasificarSolicitud,
  cambiarEstado,
} from '../services/solicitudes.js';
import { getCategorias, getPrioridades, getAreas } from '../services/catalogos.js';
import { getErrorMessage } from '../services/apiClient.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function ClasificarSolicitud() {
  const { id }     = useParams();
  const navigate   = useNavigate();

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
  const [successInfo, setSuccessInfo] = useState(null); // { message, estado, autoTransitioned }
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
        // Filtrar solo activos
        setCategorias(cats.filter((c) => c.activo !== false));
        setPrioridades(prios.filter((p) => p.activo !== false));
        setAreas(ars.filter((a) => a.activo !== false));

        // Preselección si la solicitud ya tenía valores clasificados
        if (sol.categoriaId) setCategoriaId(String(sol.categoriaId));
        if (sol.prioridadId) setPrioridadId(String(sol.prioridadId));
        if (sol.areaId)      setAreaId(String(sol.areaId));
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
    // Formato YYYY-MM-DD para el input type="date"
    const sugerida = fechaBase.toISOString().split('T')[0];
    setFechaLimite(sugerida);
  };

  // Validaciones
  const errors = {
    categoriaId: !categoriaId ? 'Selecciona una categoría' : '',
    prioridadId: !prioridadId ? 'Selecciona una prioridad' : '',
    areaId:      !areaId      ? 'Selecciona el área responsable' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const getFieldError = (k) => (tried ? errors[k] : '');

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

      const target = SOLICITUDES_MOCK.find((s) => s.codigo === (solicitud.codigo || id));
      if (target) {
        target.categoria = cat;
        target.prioridad = prio;
        target.area = area;
        target.estado = 'En evaluación';
      }

      setSolicitud((prev) => ({
        ...prev,
        categoria: cat,
        prioridad: prio,
        area,
        estado: 'En evaluación',
      }));

      setSuccessInfo({
        message: 'Solicitud clasificada correctamente.',
        estado: 'En evaluación',
        autoTransitioned: true,
      });
      setSubmitting(false);
      return;
    }

    try {
      // Formatear fecha límite en ISO si fue seleccionada
      let fechaIso = null;
      if (fechaLimite) {
        const d = new Date(`${fechaLimite}T23:59:59`);
        fechaIso = !isNaN(d.getTime()) ? d.toISOString() : null;
      }

      // 1. Invocar PUT /api/solicitudes/{id}/clasificacion
      await clasificarSolicitud(solicitud.id, {
        categoriaId: Number(categoriaId),
        prioridadId: Number(prioridadId),
        areaId:      Number(areaId),
        fechaLimite: fechaIso,
      });

      // 2. Volver a pedir la solicitud (GET) para verificar el estado resultante
      const updated = await getSolicitudAny(solicitud.id);
      let estadoFinal = updated?.estado || 'Registrada';
      let autoAdvanced = updated?.estadoApi === 'EN_EVALUACION';

      // 3. Si el estado NO avanzó solo, intentar PUT /estado con EN_EVALUACION
      if (!autoAdvanced && updated?.estadoApi === 'REGISTRADA') {
        try {
          const transitioned = await cambiarEstado(solicitud.id, 'EN_EVALUACION', {
            observacion: 'Solicitud clasificada y derivada a evaluación por supervisor.',
          });
          estadoFinal = transitioned?.estado || 'En evaluación';
          autoAdvanced = true;
        } catch {
          // Si el backend no permite la transición directa, se mantiene el estado devuelto
        }
      }

      setSolicitud(updated);
      setSuccessInfo({
        message: 'Solicitud clasificada con éxito.',
        estado: estadoFinal,
        autoTransitioned: autoAdvanced,
      });
    } catch (err) {
      setErrSubmit(getErrorMessage(err, 'No se pudo clasificar la solicitud. Intenta nuevamente.'));
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
        title="Clasificar y priorizar solicitud"
        text="Define categoría, prioridad, área responsable y plazo estimado para la atención."
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
        </p>
        <p style={{ fontSize: '13px', lineHeight: 1.5, background: '#f8faf9', padding: '12px', borderRadius: '6px' }}>
          {solicitud?.descripcion}
        </p>
      </section>

      {/* Mensaje de error general si falló la operación */}
      {errSubmit && (
        <div className="message error" role="alert" style={{ marginBottom: '20px' }}>
          <Icon name="alert" />
          <div>
            <strong>Error al clasificar</strong>
            <p>{errSubmit}</p>
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
              Estado actual en el sistema: <strong>{successInfo.estado}</strong>.
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

      {/* Formulario de clasificación */}
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
                min={new Date().toISOString().split('T')[0]}
              />
              <span className="field-hint" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                Plazo sugerido automáticamente según SLA de prioridad. Puedes modificarlo si lo requieres.
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
                {submitting ? 'Guardando clasificación…' : 'Guardar clasificación'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
