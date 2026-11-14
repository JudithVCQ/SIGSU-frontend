import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ROLES, ROLE_LABEL } from '../config/constants';
import {
  getUsuarios,
  getRoles,
  registrarUsuario,
  actualizarUsuario,
  cambiarRol,
  desactivarUsuario,
  activarUsuario,
} from '../services/usuarios.js';
import { getAreas } from '../services/catalogos.js';
import { getErrorMessage } from '../services/apiClient.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import ConfirmModal from '../components/ConfirmModal';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import PasswordField from '../components/PasswordField';
import FormModal from '../components/FormModal';
import './administracion.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const ROLES_FALLBACK = [
  ROLES.SOLICITANTE,
  ROLES.TECNICO,
  ROLES.SUPERVISOR,
  ROLES.ADMIN,
];

export default function GestionUsuarios() {
  const { user: currentUser } = useAuth();

  // Estados principales
  const [usuarios,  setUsuarios]  = useState([]);
  const [roles,     setRoles]     = useState(ROLES_FALLBACK);
  const [areas,     setAreas]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [errLoad,   setErrLoad]   = useState('');
  const [feedback,  setFeedback]  = useState(null); // { type, message }

  // Filtros
  const [busqueda,      setBusqueda]      = useState('');
  const [filtroRol,     setFiltroRol]     = useState('');
  const [filtroArea,    setFiltroArea]    = useState('');
  const [filtroEstado,  setFiltroEstado]  = useState('');

  // Modales
  const [showCreate,         setShowCreate]         = useState(false);
  const [editingUser,        setEditingUser]        = useState(null);
  const [userToDeactivate,   setUserToDeactivate]   = useState(null);
  const [pendingRoleChange,  setPendingRoleChange]  = useState(null); // { user, newRol, nextData }

  // Cargar usuarios, roles y áreas
  const cargarDatos = async () => {
    if (USE_MOCKS) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrLoad('');
    try {
      const [uList, rList, aList] = await Promise.all([
        getUsuarios(),
        getRoles().catch(() => ROLES_FALLBACK),
        getAreas().catch(() => []),
      ]);
      setUsuarios(uList);
      if (Array.isArray(rList) && rList.length > 0) setRoles(rList);
      if (Array.isArray(aList)) setAreas(aList);
    } catch (err) {
      setErrLoad(getErrorMessage(err, 'No se pudo cargar la lista de usuarios.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Limpiar mensaje de feedback tras 5 segundos
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Nombre de área según ID
  const getAreaNombre = (areaId) => {
    if (!areaId) return 'Sin área';
    const a = areas.find((x) => String(x.id) === String(areaId));
    return a ? a.nombre : 'Sin área';
  };

  // Iniciales para avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Filtrado de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Búsqueda por texto (nombre, correo)
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const nom = (u.nombre || `${u.nombres || ''} ${u.apellidos || ''}`).toLowerCase();
        const cor = (u.correo || '').toLowerCase();
        if (!nom.includes(q) && !cor.includes(q)) return false;
      }
      // Filtro por Rol
      if (filtroRol && u.rol !== filtroRol) return false;
      // Filtro por Área
      if (filtroArea) {
        if (filtroArea === 'sin-area') {
          if (u.areaId) return false;
        } else if (String(u.areaId) !== filtroArea) {
          return false;
        }
      }
      // Filtro por Estado
      if (filtroEstado) {
        if (filtroEstado === 'activos' && !u.activo) return false;
        if (filtroEstado === 'inactivos' && u.activo) return false;
      }
      return true;
    });
  }, [usuarios, busqueda, filtroRol, filtroArea, filtroEstado]);

  // Manejo de Desactivación con ConfirmModal
  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await desactivarUsuario(userToDeactivate.id, userToDeactivate);
      setFeedback({ type: 'success', message: `El usuario "${userToDeactivate.nombre}" fue desactivado.` });
      setUserToDeactivate(null);
      await cargarDatos();
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'No se pudo desactivar el usuario.') });
      setUserToDeactivate(null);
    }
  };

  // Manejo de Reactivación directa
  const handleActivar = async (user) => {
    try {
      await activarUsuario(user.id, user);
      setFeedback({ type: 'success', message: `El usuario "${user.nombre}" fue reactivado.` });
      await cargarDatos();
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'No se pudo reactivar el usuario.') });
    }
  };

  // Pantalla en modo MOCKS
  if (USE_MOCKS) {
    return (
      <div>
        <PageHead
          title="Gestión de usuarios"
          text="Administra las cuentas de usuario, roles de acceso y áreas técnicas asignadas."
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
              La administración de usuarios y asignación de roles requiere comunicación con la API activa.
              Configura <code>VITE_USE_MOCKS=false</code> en tu archivo de entorno <code>.env</code> para habilitar este módulo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title="Gestión de usuarios"
        text="Administra las cuentas de usuario, roles de acceso y áreas técnicas asignadas."
        action={
          <Button variant="primary" icon="plus" onClick={() => setShowCreate(true)}>
            Nuevo usuario
          </Button>
        }
      />

      {/* Alerta de feedback temporal */}
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

      {/* Error de carga */}
      {errLoad && (
        <div className="message error" style={{ marginBottom: '20px' }} role="alert">
          <Icon name="alert" />
          <div style={{ flex: 1 }}>
            <strong>{errLoad}</strong>
            <div style={{ marginTop: '8px' }}>
              <Button variant="secondary" onClick={cargarDatos}>Reintentar carga</Button>
            </div>
          </div>
        </div>
      )}

      {/* Panel principal de tabla y filtros */}
      <section className="panel table-panel">
        <div className="filters filters-admin">
          {/* Búsqueda por texto */}
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar usuarios"
            />
          </label>

          {/* Filtro por Rol */}
          <FormSelect
            label="Rol"
            value={filtroRol}
            onChange={setFiltroRol}
            placeholder="Todos los roles"
            options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] || r }))}
          />

          {/* Filtro por Área */}
          <FormSelect
            label="Área"
            value={filtroArea}
            onChange={setFiltroArea}
            placeholder="Todas las áreas"
            options={[
              { value: 'sin-area', label: 'Sin área asignada' },
              ...areas.map((a) => ({ value: String(a.id), label: a.nombre })),
            ]}
          />

          {/* Filtro por Estado */}
          <FormSelect
            label="Estado"
            value={filtroEstado}
            onChange={setFiltroEstado}
            placeholder="Todos los estados"
            options={[
              { value: 'activos', label: 'Solo activos' },
              { value: 'inactivos', label: 'Solo inactivos' },
            ]}
          />
        </div>

        <div className="results-label">
          {loading
            ? 'Cargando usuarios desde el servidor…'
            : `Mostrando ${usuariosFiltrados.length} de ${usuarios.length} usuarios`}
        </div>

        {/* Estado de carga */}
        {loading && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            <p>Conectando con el servidor…</p>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && usuariosFiltrados.length === 0 && (
          <div className="empty">
            <Icon name="users" size={36} />
            <strong>No se encontraron usuarios</strong>
            <p>
              {busqueda || filtroRol || filtroArea || filtroEstado
                ? 'Prueba ajustando los filtros de búsqueda.'
                : 'Aún no hay usuarios registrados.'}
            </p>
            {(busqueda || filtroRol || filtroArea || filtroEstado) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setBusqueda('');
                  setFiltroRol('');
                  setFiltroArea('');
                  setFiltroEstado('');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

        {/* Tabla en escritorio (> 720px) */}
        {!loading && usuariosFiltrados.length > 0 && (
          <div className="desktop-table">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Área responsable</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const roleSlug = (u.rol || '').toLowerCase();
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar ${!u.activo ? 'inactive' : ''}`}>
                            {getInitials(u.nombre)}
                          </div>
                          <div className="user-info">
                            <strong>
                              {u.nombre}
                              {isCurrent && <span className="self-badge">Tú</span>}
                            </strong>
                            <small>ID: {u.id}</small>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--carbon)' }}>{u.correo}</td>
                      <td>
                        <span className={`role-tag role-tag-${roleSlug}`}>
                          {ROLE_LABEL[u.rol] || u.rol}
                        </span>
                      </td>
                      <td style={{ color: u.areaId ? 'var(--carbon)' : 'var(--muted)' }}>
                        {getAreaNombre(u.areaId)}
                      </td>
                      <td>
                        <Badge texto={u.activo ? 'Activo' : 'Inactivo'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            icon="edit"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => setEditingUser(u)}
                            title="Editar datos y rol"
                          >
                            Editar
                          </Button>
                          {u.activo ? (
                            <Button
                              variant="danger"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => setUserToDeactivate(u)}
                              disabled={isCurrent}
                              title={isCurrent ? 'No puedes desactivar tu propia cuenta' : 'Desactivar acceso'}
                            >
                              Desactivar
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--verde)' }}
                              onClick={() => handleActivar(u)}
                              title="Reactivar acceso al sistema"
                            >
                              Activar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tarjetas en mobile (<= 720px) */}
        {!loading && usuariosFiltrados.length > 0 && (
          <div className="mobile-cards">
            {usuariosFiltrados.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              const roleSlug = (u.rol || '').toLowerCase();
              return (
                <article className="user-card" key={u.id}>
                  <div className="user-card-head">
                    <div className="user-cell">
                      <div className={`user-avatar ${!u.activo ? 'inactive' : ''}`}>
                        {getInitials(u.nombre)}
                      </div>
                      <div className="user-info">
                        <strong>
                          {u.nombre}
                          {isCurrent && <span className="self-badge">Tú</span>}
                        </strong>
                        <small>{u.correo}</small>
                      </div>
                    </div>
                    <Badge texto={u.activo ? 'Activo' : 'Inactivo'} />
                  </div>

                  <div className="user-card-meta">
                    <div>
                      <small>Rol</small>
                      <span className={`role-tag role-tag-${roleSlug}`}>
                        {ROLE_LABEL[u.rol] || u.rol}
                      </span>
                    </div>
                    <div>
                      <small>Área</small>
                      <span>{getAreaNombre(u.areaId)}</span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <Button
                      variant="secondary"
                      icon="edit"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setEditingUser(u)}
                    >
                      Editar
                    </Button>
                    {u.activo ? (
                      <Button
                        variant="danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setUserToDeactivate(u)}
                        disabled={isCurrent}
                      >
                        Desactivar
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--verde)' }}
                        onClick={() => handleActivar(u)}
                      >
                        Activar
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal: Crear Usuario */}
      {showCreate && (
        <CreateUserModal
          roles={roles}
          areas={areas}
          onClose={() => setShowCreate(false)}
          onSuccess={async () => {
            setShowCreate(false);
            setFeedback({ type: 'success', message: 'Usuario creado exitosamente.' });
            await cargarDatos();
          }}
          onAreaAssignFailed={async (creado) => {
            setShowCreate(false);
            await cargarDatos();
            setFeedback({
              type: 'error',
              message: 'Usuario creado, pero no se pudo asignar el área. Edítalo para asignarla.',
            });
            setEditingUser(creado);
          }}
        />
      )}

      {/* Modal: Editar Usuario */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isSelf={currentUser?.id === editingUser.id}
          roles={roles}
          areas={areas}
          onClose={() => setEditingUser(null)}
          onConfirmRoleChange={(payload) => setPendingRoleChange(payload)}
          onSuccess={async () => {
            setEditingUser(null);
            setFeedback({ type: 'success', message: 'Usuario actualizado exitosamente.' });
            await cargarDatos();
          }}
        />
      )}

      {/* ConfirmModal: Cambio de Rol */}
      <ConfirmModal
        isOpen={Boolean(pendingRoleChange)}
        title="¿Confirmas el cambio de rol?"
        message={`Vas a cambiar el rol del usuario "${pendingRoleChange?.user?.nombre}" de ${
          ROLE_LABEL[pendingRoleChange?.user?.rol] || pendingRoleChange?.user?.rol
        } a ${ROLE_LABEL[pendingRoleChange?.newRol] || pendingRoleChange?.newRol}. Esto modificará sus permisos en el sistema.`}
        confirmText="Confirmar cambio de rol"
        cancelText="Cancelar"
        isDestructive={false}
        icon="alert"
        onConfirm={async () => {
          if (!pendingRoleChange) return;
          const { user, newRol, nextData, onSuccessCallback } = pendingRoleChange;
          try {
            // Guardar datos básicos
            await actualizarUsuario(user.id, nextData);
            // Cambiar rol
            await cambiarRol(user.id, newRol);
            setPendingRoleChange(null);
            if (onSuccessCallback) onSuccessCallback();
          } catch (err) {
            setFeedback({ type: 'error', message: getErrorMessage(err, 'No se pudo cambiar el rol del usuario.') });
            setPendingRoleChange(null);
          }
        }}
        onCancel={() => setPendingRoleChange(null)}
      />

      {/* ConfirmModal: Desactivar Usuario (RN-009) */}
      <ConfirmModal
        isOpen={Boolean(userToDeactivate)}
        title={`¿Desactivar a ${userToDeactivate?.nombre}?`}
        message="Desactivar no borra el historial. El usuario perderá acceso al sistema pero sus solicitudes, comentarios y atenciones históricas se conservarán intactas."
        confirmText="Desactivar usuario"
        cancelText="Cancelar"
        isDestructive={true}
        icon="alert"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setUserToDeactivate(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponente: Modal Crear Usuario
// ─────────────────────────────────────────────────────────────────────────────
function CreateUserModal({ roles, areas, onClose, onSuccess, onAreaAssignFailed }) {
  const [nombres,    setNombres]    = useState('');
  const [apellidos,  setApellidos]  = useState('');
  const [correo,     setCorreo]     = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol,        setRol]        = useState(ROLES.SOLICITANTE);
  const [areaId,     setAreaId]     = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [tried,      setTried]      = useState(false);

  // Validación
  const esTecnico = rol === ROLES.TECNICO;
  const errors = {
    nombres:    !nombres.trim() ? 'El nombre es obligatorio' : '',
    apellidos:  !apellidos.trim() ? 'Los apellidos son obligatorios' : '',
    correo:     !correo.trim()
      ? 'El correo es obligatorio'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
      ? 'Formato de correo no válido'
      : '',
    contrasena: !contrasena
      ? 'La contraseña es obligatoria'
      : contrasena.length < 8
      ? 'La contraseña debe tener al menos 8 caracteres'
      : contrasena.length > 72
      ? 'La contraseña no puede exceder 72 caracteres'
      : '',
    rol:        !rol ? 'Selecciona un rol' : '',
    areaId:     esTecnico && !areaId ? 'El área es obligatoria para el rol Técnico' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const getErr = (k) => (tried ? errors[k] : '');

  // Detección de cambios respecto al estado inicial
  const hasChanges =
    nombres !== '' ||
    apellidos !== '' ||
    correo !== '' ||
    contrasena !== '' ||
    rol !== ROLES.SOLICITANTE ||
    areaId !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTried(true);
    setErrorMsg('');

    if (hasErrors) return;

    setSubmitting(true);
    try {
      // 1. POST /api/usuarios: no acepta areaId (contrato CrearUsuarioRequest)
      const payload = {
        nombres:    nombres.trim(),
        apellidos:  apellidos.trim(),
        correo:     correo.trim().toLowerCase(),
        contrasena,
        rol,
      };

      const creado = await registrarUsuario(payload);

      // 2. Flujo normal: si se seleccionó área (ej. TECNICO), se asigna mediante PUT /api/usuarios/{id}
      if (areaId && creado?.id) {
        try {
          await actualizarUsuario(creado.id, {
            nombres:   creado.nombres || nombres.trim(),
            apellidos: creado.apellidos || apellidos.trim(),
            correo:    creado.correo || correo.trim().toLowerCase(),
            areaId:    Number(areaId),
            activo:    true,
          });
          onSuccess();
        } catch {
          // Si el POST funciona y el PUT de área falla, NO repetimos el POST.
          // Notificamos y abrimos el modal de edición de ese usuario para asignarla.
          if (onAreaAssignFailed) {
            onAreaAssignFailed(creado);
          } else {
            onSuccess();
          }
        }
      } else {
        onSuccess();
      }
    } catch (err) {
      // Manejo amigable y normalizado de errores del backend
      if (err.status === 409 || err.message?.toLowerCase().includes('correo') || err.body?.message?.toLowerCase().includes('correo')) {
        setErrorMsg('Ya existe un usuario registrado con este correo electrónico.');
      } else if (err.status === 400) {
        setErrorMsg(err.body?.message || err.message || 'Datos inválidos. Revisa que todos los campos requeridos cumplan el formato.');
      } else if (err.status === 403) {
        setErrorMsg('No tienes permisos de administrador para registrar usuarios.');
      } else {
        setErrorMsg(getErrorMessage(err, 'No se pudo crear el usuario.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      title="Registrar nuevo usuario"
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
            {submitting ? 'Creando usuario…' : 'Crear usuario'}
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

      <div className="form-row-2">
        <FormField
          label="Nombres"
          value={nombres}
          onChange={setNombres}
          placeholder="Ej. Carlos"
          required
          error={getErr('nombres')}
        />
        <FormField
          label="Apellidos"
          value={apellidos}
          onChange={setApellidos}
          placeholder="Ej. Mendoza"
          required
          error={getErr('apellidos')}
        />
      </div>

      <FormField
        label="Correo electrónico"
        type="email"
        value={correo}
        onChange={setCorreo}
        placeholder="usuario@universidad.edu"
        autoComplete="off"
        required
        error={getErr('correo')}
      />

      {/* new-password: evita que Chrome autollene la contraseña de la sesión actual */}
      <PasswordField
        label="Contraseña"
        value={contrasena}
        onChange={setContrasena}
        autoComplete="new-password"
        required
        hint="Debe tener al menos 8 caracteres."
        error={getErr('contrasena')}
      />

      <div className="form-row-2">
        <FormSelect
          label="Rol del sistema"
          value={rol}
          onChange={(val) => {
            setRol(val);
            if (val !== ROLES.TECNICO && !areaId) setAreaId('');
          }}
          required
          options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] || r }))}
          error={getErr('rol')}
        />

        <FormSelect
          label={esTecnico ? 'Área técnica' : 'Área responsable'}
          value={areaId}
          onChange={setAreaId}
          required={esTecnico}
          placeholder={esTecnico ? 'Selecciona el área' : 'Sin área asignada'}
          options={areas.map((a) => ({ value: String(a.id), label: a.nombre }))}
          error={getErr('areaId')}
        />
      </div>
    </FormModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponente: Modal Editar Usuario
// ─────────────────────────────────────────────────────────────────────────────
function EditUserModal({ user, isSelf, roles, areas, onClose, onConfirmRoleChange, onSuccess }) {
  const [nombres,    setNombres]    = useState(user.nombres || user.nombre || '');
  const [apellidos,  setApellidos]  = useState(user.apellidos || '');
  const [correo,     setCorreo]     = useState(user.correo || '');
  const [rol,        setRol]        = useState(user.rol || ROLES.SOLICITANTE);
  const [areaId,     setAreaId]     = useState(user.areaId ? String(user.areaId) : '');
  const [activo,     setActivo]     = useState(user.activo ?? true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [tried,      setTried]      = useState(false);

  const esTecnico = rol === ROLES.TECNICO;
  const errors = {
    nombres:   !nombres.trim() ? 'El nombre es obligatorio' : '',
    apellidos: !apellidos.trim() ? 'Los apellidos son obligatorios' : '',
    correo:    !correo.trim()
      ? 'El correo es obligatorio'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
      ? 'Formato de correo no válido'
      : '',
    areaId:    esTecnico && !areaId ? 'El área es obligatoria para el rol Técnico' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const getErr = (k) => (tried ? errors[k] : '');

  // Detección de cambios respecto a los valores iniciales cargados
  const initialNombres  = user.nombres || user.nombre || '';
  const initialApellidos = user.apellidos || '';
  const initialCorreo   = user.correo || '';
  const initialRol      = user.rol || ROLES.SOLICITANTE;
  const initialAreaId   = user.areaId ? String(user.areaId) : '';
  const initialActivo   = user.activo ?? true;

  const hasChanges =
    nombres !== initialNombres ||
    apellidos !== initialApellidos ||
    correo !== initialCorreo ||
    rol !== initialRol ||
    areaId !== initialAreaId ||
    activo !== initialActivo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTried(true);
    setErrorMsg('');

    if (hasErrors) return;

    const nextData = {
      nombres:   nombres.trim(),
      apellidos: apellidos.trim(),
      correo:    correo.trim().toLowerCase(),
      areaId:    areaId ? Number(areaId) : null,
      activo:    isSelf ? true : activo,
    };

    // Si cambió el rol, se solicita confirmación con ConfirmModal
    if (rol !== user.rol && !isSelf) {
      onConfirmRoleChange({
        user,
        newRol: rol,
        nextData,
        onSuccessCallback: onSuccess,
      });
      return;
    }

    setSubmitting(true);
    try {
      await actualizarUsuario(user.id, nextData);
      onSuccess();
    } catch (err) {
      if (err.status === 409 || err.message?.toLowerCase().includes('correo') || err.body?.message?.toLowerCase().includes('correo')) {
        setErrorMsg('Ya existe un usuario registrado con este correo electrónico.');
      } else if (err.status === 400) {
        setErrorMsg(err.body?.message || err.message || 'Datos inválidos. Revisa que todos los campos requeridos cumplan el formato.');
      } else if (err.status === 403) {
        setErrorMsg('No tienes permisos de administrador para modificar usuarios.');
      } else {
        setErrorMsg(getErrorMessage(err, 'No se pudo actualizar el usuario.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      title={`Editar usuario #${user.id}`}
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

      <div className="form-row-2">
        <FormField
          label="Nombres"
          value={nombres}
          onChange={setNombres}
          required
          error={getErr('nombres')}
        />
        <FormField
          label="Apellidos"
          value={apellidos}
          onChange={setApellidos}
          required
          error={getErr('apellidos')}
        />
      </div>

      <FormField
        label="Correo electrónico"
        type="email"
        value={correo}
        onChange={setCorreo}
        required
        error={getErr('correo')}
      />

      <div className="form-row-2">
        <FormSelect
          label="Rol del sistema"
          value={rol}
          onChange={setRol}
          required
          options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] || r }))}
          disabled={isSelf}
          nota={isSelf ? 'No puedes cambiar tu propio rol de administrador.' : undefined}
        />

        <FormSelect
          label={esTecnico ? 'Área técnica' : 'Área responsable'}
          value={areaId}
          onChange={setAreaId}
          required={esTecnico}
          placeholder={esTecnico ? 'Selecciona el área (obligatoria)' : 'Sin área asignada'}
          options={areas.map((a) => ({ value: String(a.id), label: a.nombre }))}
          error={getErr('areaId')}
        />
      </div>

      {/* Estado Activo / Inactivo */}
      <label className={`toggle-field ${isSelf ? 'disabled' : ''}`}>
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => !isSelf && setActivo(e.target.checked)}
          disabled={isSelf}
        />
        <div>
          <strong>Usuario activo</strong>
          <span style={{ display: 'block', fontSize: '13px', color: 'var(--muted)' }}>
            {isSelf
              ? 'No puedes desactivar tu propia cuenta de administrador.'
              : activo
              ? 'El usuario puede iniciar sesión y operar en el sistema.'
              : 'El usuario no podrá iniciar sesión (conserva su historial).'}
          </span>
        </div>
      </label>

      <p className="hint-text" style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
        La contraseña no se puede modificar desde aquí.
      </p>
    </FormModal>
  );
}
