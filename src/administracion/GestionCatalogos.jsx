import { useState, useEffect, useMemo } from 'react';
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  desactivarCategoria,
  getAreas,
  crearArea,
  actualizarArea,
  desactivarArea,
  getPrioridades,
  crearPrioridad,
  actualizarPrioridad,
  desactivarPrioridad,
  getEstados,
} from '../services/catalogos.js';
import { ESTADO_API_TO_UI } from '../services/mappers.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import { SkeletonFilas } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import FormField from '../components/FormField';
import FormModal from '../components/FormModal';
import './administracion.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const TABS = {
  CATEGORIAS:  'categorias',
  PRIORIDADES: 'prioridades',
  ESTADOS:     'estados',
  AREAS:       'areas',
};

const TAB_CONFIG = {
  [TABS.CATEGORIAS]:  { label: 'Categorías',  singular: 'categoría',  icon: 'layers' },
  [TABS.PRIORIDADES]: { label: 'Prioridades', singular: 'prioridad',  icon: 'alert' },
  [TABS.ESTADOS]:     { label: 'Estados',     singular: 'estado',     icon: 'clock' },
  [TABS.AREAS]:       { label: 'Áreas',       singular: 'área',       icon: 'home' },
};

const ESTADOS_DESCRIPCION = {
  REGISTRADA:    'Solicitud registrada por el solicitante; en espera de evaluación y clasificación.',
  EN_EVALUACION: 'Solicitud clasificada y priorizada por supervisión; pendiente de asignación técnica.',
  ASIGNADA:      'Orden de trabajo asignada a un técnico responsable para su atención.',
  EN_ATENCION:   'El técnico responsable se encuentra realizando los trabajos de atención.',
  RESUELTA:      'Atención concluida con solución técnica documentada y evidencias registradas.',
  CERRADA:       'Solicitud verificada y cerrada formalmente por la supervisión.',
};

export default function GestionCatalogos() {
  const [activeTab,    setActiveTab]    = useState(TABS.CATEGORIAS);
  const [categorias,   setCategorias]   = useState([]);
  const [areas,        setAreas]        = useState([]);
  const [prioridades,  setPrioridades]  = useState([]);
  const [estados,      setEstados]      = useState([]);

  const [loading,      setLoading]      = useState(true);
  const [errLoad,      setErrLoad]      = useState('');
  const [feedback,     setFeedback]     = useState(null); // { type, message }
  const [busqueda,     setBusqueda]     = useState('');

  // Modales
  const [showCreate,       setShowCreate]       = useState(false);
  const [editingItem,      setEditingItem]      = useState(null);
  const [itemToDeactivate, setItemToDeactivate] = useState(null);

  // Carga de todos los catálogos activos
  const cargarCatalogos = async () => {
    if (USE_MOCKS) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrLoad('');
    try {
      const [cats, ars, prios, ests] = await Promise.all([
        getCategorias().catch(() => []),
        getAreas().catch(() => []),
        getPrioridades().catch(() => []),
        getEstados().catch(() => [
          'REGISTRADA',
          'EN_EVALUACION',
          'ASIGNADA',
          'EN_ATENCION',
          'RESUELTA',
          'CERRADA',
        ]),
      ]);
      setCategorias(cats);
      setAreas(ars);
      setPrioridades(prios);
      setEstados(Array.isArray(ests) ? ests : []);
    } catch {
      setErrLoad('No pudimos cargar los catálogos. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Limpiar mensaje de feedback tras 5 segundos
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Limpiar búsqueda al cambiar de pestaña
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setBusqueda('');
  };

  // Filtrado de elementos de la pestaña activa
  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let list = [];
    if (activeTab === TABS.CATEGORIAS)  list = categorias;
    if (activeTab === TABS.AREAS)        list = areas;
    if (activeTab === TABS.PRIORIDADES)  list = prioridades;
    if (activeTab === TABS.ESTADOS) {
      return estados.filter((e) => {
        if (!q) return true;
        const uiText = (ESTADO_API_TO_UI[e] || e).toLowerCase();
        const descText = (ESTADOS_DESCRIPCION[e] || '').toLowerCase();
        return e.toLowerCase().includes(q) || uiText.includes(q) || descText.includes(q);
      });
    }

    return list.filter((item) => {
      if (!q) return true;
      const c = (item.codigo || '').toLowerCase();
      const n = (item.nombre || '').toLowerCase();
      const idStr = String(item.id || '');
      return c.includes(q) || n.includes(q) || idStr.includes(q);
    });
  }, [activeTab, categorias, areas, prioridades, estados, busqueda]);

  // Manejo de desactivación con ConfirmModal (RN-009)
  const handleConfirmDeactivate = async () => {
    if (!itemToDeactivate) return;
    const { item, type } = itemToDeactivate;
    try {
      if (type === TABS.CATEGORIAS) {
        await desactivarCategoria(item.id, item);
      } else if (type === TABS.AREAS) {
        await desactivarArea(item.id, item);
      } else if (type === TABS.PRIORIDADES) {
        await desactivarPrioridad(item.id, item);
      }
      setFeedback({
        type: 'success',
        message: `${TAB_CONFIG[type].label.slice(0, -1)} "${item.nombre}" desactivada con éxito.`,
      });
      setItemToDeactivate(null);
      await cargarCatalogos();
    } catch (err) {
      const msg = err.body?.message || (typeof err.body === 'string' && err.body.trim() ? err.body : null) || err.message;
      setFeedback({
        type: 'error',
        message: msg || 'El backend rechazó la desactivación.',
      });
      setItemToDeactivate(null);
    }
  };

  // Modo Mocks
  if (USE_MOCKS) {
    return (
      <div>
        <PageHead
          title="Gestión de catálogos"
          text="Administra las categorías de servicio, áreas responsables, niveles de prioridad y ciclo de vida."
        />
        <div
          className="message"
          style={{
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px',
          }}
          role="alert"
        >
          <Icon name="alert" size={24} />
          <div>
            <strong style={{ fontSize: '15px' }}>Disponible solo con el backend real</strong>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', lineHeight: 1.5 }}>
              La administración de catálogos requiere conexión con la API en vivo.
              Configura <code>VITE_USE_MOCKS=false</code> en tu archivo de entorno <code>.env</code> para utilizar este módulo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentTabCfg = TAB_CONFIG[activeTab];
  const isReadOnlyTab = activeTab === TABS.ESTADOS;

  return (
    <div>
      <PageHead
        title="Gestión de catálogos"
        text="Administra las categorías de servicio, áreas responsables, niveles de prioridad y consulta los estados del sistema."
        action={
          !isReadOnlyTab && (
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setShowCreate(true)}
            >
              Nueva {currentTabCfg.singular}
            </Button>
          )
        }
      />

      {/* Alerta de feedback */}
      {feedback && (
        <div
          className={`message ${feedback.type === 'error' ? 'error' : 'success'}`}
          style={{ marginBottom: '16px' }}
          role="status"
        >
          <Icon name={feedback.type === 'error' ? 'alert' : 'check'} />
          <div><strong>{feedback.message}</strong></div>
        </div>
      )}

      {/* Barra de pestañas */}
      <nav className="catalog-tabs" aria-label="Pestañas de catálogos">
        <button
          type="button"
          className={`catalog-tab ${activeTab === TABS.CATEGORIAS ? 'active' : ''}`}
          onClick={() => handleTabChange(TABS.CATEGORIAS)}
        >
          Categorías
          <span className="tab-badge">{categorias.length}</span>
        </button>
        <button
          type="button"
          className={`catalog-tab ${activeTab === TABS.PRIORIDADES ? 'active' : ''}`}
          onClick={() => handleTabChange(TABS.PRIORIDADES)}
        >
          Prioridades
          <span className="tab-badge">{prioridades.length}</span>
        </button>
        <button
          type="button"
          className={`catalog-tab ${activeTab === TABS.ESTADOS ? 'active' : ''}`}
          onClick={() => handleTabChange(TABS.ESTADOS)}
        >
          Estados
          <span className="tab-badge">{estados.length}</span>
        </button>
        <button
          type="button"
          className={`catalog-tab ${activeTab === TABS.AREAS ? 'active' : ''}`}
          onClick={() => handleTabChange(TABS.AREAS)}
        >
          Áreas
          <span className="tab-badge">{areas.length}</span>
        </button>
      </nav>

      {/* Aviso contextual de la pestaña activa */}
      {isReadOnlyTab ? (
        <div className="catalog-notice" role="note">
          <Icon name="alert" size={18} />
          <div>
            <strong>Los estados los define el sistema.</strong>
            <span> Esta lista es de solo lectura y representa el ciclo de vida oficial de las solicitudes.</span>
          </div>
        </div>
      ) : (
        <div className="catalog-notice" role="note">
          <Icon name="check" size={18} />
          <div>
            <strong>Solo se muestran los elementos activos.</strong>
            <span> Desactivar no borra el historial. Los elementos desactivados se excluyen de futuras operaciones.</span>
          </div>
        </div>
      )}

      {/* Panel con buscador y tabla */}
      <section className="panel table-panel">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--borde)' }}>
          <label className="search-field" style={{ maxWidth: '420px' }}>
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder={`Buscar en ${currentTabCfg.label.toLowerCase()}…`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label={`Buscar ${currentTabCfg.label}`}
            />
          </label>
        </div>

        {!loading && !errLoad && (
          <div className="results-label">
            {`Mostrando ${itemsFiltrados.length} elementos en ${currentTabCfg.label}`}
          </div>
        )}

        {/* Estado de carga */}
        {loading && <SkeletonFilas filas={5} columnas={5} />}

        {/* Error de carga */}
        {!loading && errLoad && <ErrorState message={errLoad} onRetry={cargarCatalogos} />}

        {/* Estado vacío */}
        {!loading && !errLoad && itemsFiltrados.length === 0 && (
          <EmptyState
            icon="layers"
            title="No se encontraron registros"
            text={busqueda
              ? 'Prueba con otro término de búsqueda.'
              : `No hay ${currentTabCfg.label.toLowerCase()} activas registradas.`}
            action={busqueda ? (
              <Button variant="secondary" onClick={() => setBusqueda('')}>
                Limpiar búsqueda
              </Button>
            ) : undefined}
          />
        )}

        {/* Tabla en escritorio (> 720px) */}
        {!loading && !errLoad && itemsFiltrados.length > 0 && (
          <div className="desktop-table">
            <table>
              <thead>
                <tr>
                  {isReadOnlyTab ? (
                    <>
                      <th style={{ width: '22%' }}>Código del Enum</th>
                      <th style={{ width: '22%' }}>Etiqueta UI</th>
                      <th style={{ width: '18%' }}>Indicador</th>
                      <th>Descripción operativa</th>
                    </>
                  ) : (
                    <>
                      <th style={{ width: '10%' }}>ID</th>
                      <th style={{ width: '22%' }}>Código</th>
                      <th>Nombre</th>
                      {activeTab === TABS.PRIORIDADES && <th style={{ width: '14%' }}>Nivel</th>}
                      <th style={{ width: '14%' }}>Estado</th>
                      <th style={{ width: '18%', textAlign: 'right' }}>Acciones</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {isReadOnlyTab
                  ? itemsFiltrados.map((code) => {
                      const uiText = ESTADO_API_TO_UI[code] || code;
                      return (
                        <tr key={code}>
                          <td>
                            <code style={{ fontSize: '13px', fontWeight: 600, color: 'var(--verde)' }}>
                              {code}
                            </code>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--carbon)' }}>{uiText}</strong>
                          </td>
                          <td>
                            <Badge texto={uiText} />
                          </td>
                          <td style={{ color: 'var(--muted)', fontSize: '12px' }}>
                            {ESTADOS_DESCRIPCION[code] || 'Estado del flujo.'}
                          </td>
                        </tr>
                      );
                    })
                  : itemsFiltrados.map((item) => (
                      <tr key={item.id}>
                        <td style={{ color: 'var(--muted)' }}>#{item.id}</td>
                        <td>
                          <code style={{ fontSize: '13px', fontWeight: 600, color: 'var(--verde)' }}>
                            {item.codigo}
                          </code>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--carbon)' }}>{item.nombre}</strong>
                        </td>
                        {activeTab === TABS.PRIORIDADES && (
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--carbon)' }}>
                              {item.nivel !== null && item.nivel !== undefined ? item.nivel : '—'}
                            </span>
                          </td>
                        )}
                        <td>
                          <Badge texto={item.activo ? 'Activo' : 'Inactivo'} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <Button
                              variant="secondary"
                              icon="edit"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => setEditingItem({ item, type: activeTab })}
                              title={`Editar ${currentTabCfg.singular}`}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="danger"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => setItemToDeactivate({ item, type: activeTab })}
                              title={`Desactivar ${currentTabCfg.singular}`}
                            >
                              Desactivar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tarjetas en mobile (<= 720px) */}
        {!loading && !errLoad && itemsFiltrados.length > 0 && (
          <div className="mobile-cards">
            {isReadOnlyTab
              ? itemsFiltrados.map((code) => {
                  const uiText = ESTADO_API_TO_UI[code] || code;
                  return (
                    <article className="catalog-card" key={code}>
                      <div className="catalog-card-head">
                        <div>
                          <h4>{uiText}</h4>
                          <code style={{ fontSize: '13px', color: 'var(--verde)' }}>{code}</code>
                        </div>
                        <Badge texto={uiText} />
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                        {ESTADOS_DESCRIPCION[code] || 'Estado del sistema.'}
                      </p>
                    </article>
                  );
                })
              : itemsFiltrados.map((item) => (
                  <article className="catalog-card" key={item.id}>
                    <div className="catalog-card-head">
                      <div>
                        <h4>{item.nombre}</h4>
                        <code style={{ fontSize: '13px', color: 'var(--verde)' }}>{item.codigo}</code>
                      </div>
                      <Badge texto={item.activo ? 'Activo' : 'Inactivo'} />
                    </div>

                    <div className="catalog-card-meta">
                      <div>
                        <small>ID</small>
                        <span>#{item.id}</span>
                      </div>
                      {activeTab === TABS.PRIORIDADES && (
                        <div>
                          <small>Nivel</small>
                          <span>{item.nivel ?? '—'}</span>
                        </div>
                      )}
                    </div>

                    <div className="catalog-card-actions">
                      <Button
                        variant="secondary"
                        icon="edit"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setEditingItem({ item, type: activeTab })}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setItemToDeactivate({ item, type: activeTab })}
                      >
                        Desactivar
                      </Button>
                    </div>
                  </article>
                ))}
          </div>
        )}
      </section>

      {/* Modal: Crear Elemento */}
      {showCreate && (
        <CreateCatalogModal
          type={activeTab}
          onClose={() => setShowCreate(false)}
          onSuccess={async () => {
            setShowCreate(false);
            setFeedback({
              type: 'success',
              message: `${currentTabCfg.label.slice(0, -1)} creada exitosamente.`,
            });
            await cargarCatalogos();
          }}
        />
      )}

      {/* Modal: Editar Elemento */}
      {editingItem && (
        <EditCatalogModal
          data={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={async () => {
            setEditingItem(null);
            setFeedback({
              type: 'success',
              message: `${TAB_CONFIG[editingItem.type].label.slice(0, -1)} actualizada exitosamente.`,
            });
            await cargarCatalogos();
          }}
        />
      )}

      {/* ConfirmModal: Desactivar Elemento (RN-009) */}
      <ConfirmModal
        isOpen={Boolean(itemToDeactivate)}
        title={`¿Desactivar ${
          itemToDeactivate ? TAB_CONFIG[itemToDeactivate.type].singular : ''
        } "${itemToDeactivate?.item?.nombre}"?`}
        message="Desactivar no borra el historial. Al desactivarlo, dejará de estar disponible para nuevas solicitudes pero se conservará en los registros históricos."
        confirmText="Desactivar elemento"
        cancelText="Cancelar"
        isDestructive={true}
        icon="alert"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setItemToDeactivate(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponente: Modal Crear Elemento
// ─────────────────────────────────────────────────────────────────────────────
function CreateCatalogModal({ type, onClose, onSuccess }) {
  const [codigo,     setCodigo]     = useState('');
  const [nombre,     setNombre]     = useState('');
  const [nivel,      setNivel]      = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [tried,      setTried]      = useState(false);

  const isPrioridad = type === TABS.PRIORIDADES;
  const cfg = TAB_CONFIG[type];

  // Validaciones según CatalogoRequest y PrioridadRequest
  const errors = {
    codigo: !codigo.trim()
      ? 'El código es obligatorio'
      : codigo.trim().length > 30
      ? 'El código no puede superar 30 caracteres'
      : '',
    nombre: !nombre.trim()
      ? 'El nombre es obligatorio'
      : nombre.trim().length > 100
      ? 'El nombre no puede superar 100 caracteres'
      : '',
    nivel: isPrioridad && (!nivel || isNaN(Number(nivel)) || Number(nivel) < 1)
      ? 'El nivel debe ser un número entero mayor o igual a 1'
      : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const getErr = (k) => (tried ? errors[k] : '');

  // Detección de cambios respecto al estado inicial
  const hasChanges =
    codigo !== '' ||
    nombre !== '' ||
    (isPrioridad && nivel !== '1');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTried(true);
    setErrorMsg('');

    if (hasErrors) return;

    setSubmitting(true);
    try {
      if (type === TABS.CATEGORIAS) {
        await crearCategoria({
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          activo: true,
        });
      } else if (type === TABS.AREAS) {
        await crearArea({
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          activo: true,
        });
      } else if (type === TABS.PRIORIDADES) {
        await crearPrioridad({
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          nivel:  parseInt(nivel, 10),
          activo: true,
        });
      }
      onSuccess();
    } catch (err) {
      const msg = err.body?.message || (typeof err.body === 'string' && err.body.trim() ? err.body : null) || err.message;
      setErrorMsg(msg || 'El backend rechazó el registro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      title={`Nueva ${cfg.singular}`}
      onClose={onClose}
      hasChanges={hasChanges}
      isSubmitting={submitting}
      onSubmit={handleSubmit}
      actions={({ requestClose }) => (
        <>
          <Button variant="secondary" onClick={requestClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : `Guardar ${cfg.singular}`}
          </Button>
        </>
      )}
    >
      {errorMsg && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>{errorMsg}</strong></div>
        </div>
      )}

      <FormField
        label="Código"
        value={codigo}
        onChange={setCodigo}
        placeholder="Ej. CAT-SOPORTE, PRIO-ALTA, AREA-TI"
        required
        hint="Máximo 30 caracteres. Se guardará en mayúsculas."
        error={getErr('codigo')}
      />

      <FormField
        label="Nombre"
        value={nombre}
        onChange={setNombre}
        placeholder={`Nombre de la ${cfg.singular}`}
        required
        hint="Máximo 100 caracteres."
        error={getErr('nombre')}
      />

      {isPrioridad && (
        <FormField
          label="Nivel de urgencia"
          type="number"
          value={nivel}
          onChange={setNivel}
          placeholder="1"
          required
          hint="Número entero ≥ 1 (1 = mayor prioridad/urgencia)."
          error={getErr('nivel')}
        />
      )}
    </FormModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponente: Modal Editar Elemento
// ─────────────────────────────────────────────────────────────────────────────
function EditCatalogModal({ data, onClose, onSuccess }) {
  const { item, type } = data;
  const cfg = TAB_CONFIG[type];
  const isPrioridad = type === TABS.PRIORIDADES;

  const [codigo,     setCodigo]     = useState(item.codigo || '');
  const [nombre,     setNombre]     = useState(item.nombre || '');
  const [nivel,      setNivel]      = useState(item.nivel !== null && item.nivel !== undefined ? String(item.nivel) : '1');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [tried,      setTried]      = useState(false);

  const errors = {
    codigo: !codigo.trim()
      ? 'El código es obligatorio'
      : codigo.trim().length > 30
      ? 'El código no puede superar 30 caracteres'
      : '',
    nombre: !nombre.trim()
      ? 'El nombre es obligatorio'
      : nombre.trim().length > 100
      ? 'El nombre no puede superar 100 caracteres'
      : '',
    nivel: isPrioridad && (!nivel || isNaN(Number(nivel)) || Number(nivel) < 1)
      ? 'El nivel debe ser un número entero mayor o igual a 1'
      : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const getErr = (k) => (tried ? errors[k] : '');

  // Detección de cambios respecto a los valores iniciales cargados
  const initialCodigo = item.codigo || '';
  const initialNombre = item.nombre || '';
  const initialNivel  = item.nivel !== null && item.nivel !== undefined ? String(item.nivel) : '1';

  const hasChanges =
    codigo !== initialCodigo ||
    nombre !== initialNombre ||
    (isPrioridad && nivel !== initialNivel);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTried(true);
    setErrorMsg('');

    if (hasErrors) return;

    setSubmitting(true);
    try {
      if (type === TABS.CATEGORIAS) {
        await actualizarCategoria(item.id, {
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          activo: true,
        });
      } else if (type === TABS.AREAS) {
        await actualizarArea(item.id, {
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          activo: true,
        });
      } else if (type === TABS.PRIORIDADES) {
        await actualizarPrioridad(item.id, {
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          nivel:  parseInt(nivel, 10),
          activo: true,
        });
      }
      onSuccess();
    } catch (err) {
      const msg = err.body?.message || (typeof err.body === 'string' && err.body.trim() ? err.body : null) || err.message;
      setErrorMsg(msg || 'El backend rechazó los cambios.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      title={`Editar ${cfg.singular} #${item.id}`}
      onClose={onClose}
      hasChanges={hasChanges}
      isSubmitting={submitting}
      onSubmit={handleSubmit}
      actions={({ requestClose }) => (
        <>
          <Button variant="secondary" onClick={requestClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando cambios…' : 'Guardar cambios'}
          </Button>
        </>
      )}
    >
      {errorMsg && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>{errorMsg}</strong></div>
        </div>
      )}

      <FormField
        label="Código"
        value={codigo}
        onChange={setCodigo}
        required
        hint="Máximo 30 caracteres."
        error={getErr('codigo')}
      />

      <FormField
        label="Nombre"
        value={nombre}
        onChange={setNombre}
        required
        hint="Máximo 100 caracteres."
        error={getErr('nombre')}
      />

      {isPrioridad && (
        <FormField
          label="Nivel de urgencia"
          type="number"
          value={nivel}
          onChange={setNivel}
          required
          hint="Número entero ≥ 1."
          error={getErr('nivel')}
        />
      )}
    </FormModal>
  );
}
