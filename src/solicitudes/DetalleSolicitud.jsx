import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../config/constants';
import { getSolicitudByCodigo, ESTADO_NIVEL } from '../mocks/solicitudes';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Icon from '../components/Icon';
import './solicitudes.css';

export default function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const solicitud = getSolicitudByCodigo(id);
  const level = ESTADO_NIVEL[solicitud.estado] ?? 0;
  const tieneResponsable = solicitud.responsable && solicitud.responsable !== 'Sin asignar';

  const [comentarios, setComentarios] = useState(
    tieneResponsable
      ? [
          {
            nombre: solicitud.responsable,
            rol: solicitud.rolResponsable || 'Técnico asignado',
            texto: 'Revisé el reporte y ya coordinamos la visita. Te avisaré apenas termine.',
            tiempo: `${solicitud.fecha} · 12:10`,
          },
          {
            nombre: user?.nombre || 'Camila Rojas',
            rol: 'Solicitante',
            texto: 'Gracias. Estaré en el aula hasta las 4 p. m. por si necesitan acceso.',
            tiempo: `${solicitud.fecha} · 12:32`,
          },
        ]
      : []
  );

  const [nuevoComentario, setNuevoComentario] = useState('');

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setComentarios([
      ...comentarios,
      {
        nombre: user?.nombre || 'Usuario',
        rol: user?.rol === ROLES.SOLICITANTE ? 'Solicitante' : 'Personal',
        texto: nuevoComentario.trim(),
        tiempo: 'Ahora',
      },
    ]);
    setNuevoComentario('');
  };

  const getBackPath = () => {
    if (user?.rol === ROLES.SUPERVISOR) return '/supervisor/solicitudes';
    if (user?.rol === ROLES.TECNICO) return '/tecnico';
    return '/solicitante/solicitudes';
  };

  const getBackLabel = () => {
    if (user?.rol === ROLES.SUPERVISOR) return 'Volver a solicitudes';
    if (user?.rol === ROLES.TECNICO) return 'Volver a mis asignaciones';
    return 'Volver a mis solicitudes';
  };

  const getInitials = (name) => {
    if (!name || name === 'Sin asignar') return 'U';
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const timelineSteps = [
    {
      titulo: 'Solicitud registrada',
      descripcion: 'Registro inicial de la solicitud en el sistema.',
      tiempo: `${solicitud.fecha} · 09:42`,
    },
    {
      titulo: 'Responsable asignado',
      descripcion: `La solicitud fue asignada a ${solicitud.responsable}.`,
      tiempo: `${solicitud.fecha} · 10:15`,
    },
    {
      titulo: 'Solicitud en atención',
      descripcion: `${solicitud.responsable} inició los trabajos de atención.`,
      tiempo: `${solicitud.fecha} · 11:24`,
    },
    {
      titulo: 'Solicitud resuelta',
      descripcion: 'El servicio fue completado con solución registrada.',
      tiempo: `${solicitud.fecha} · 16:05`,
    },
    {
      titulo: 'Solicitud cerrada',
      descripcion: 'Cerrada formalmente tras la conformidad del servicio.',
      tiempo: `${solicitud.fecha} · 18:30`,
    },
  ]
    .slice(0, level + 1)
    .reverse();

  const textosEstado = [
    'Tu solicitud espera ser asignada a un responsable.',
    'Ya tiene responsable. La atención comenzará pronto.',
    'El responsable está trabajando en tu solicitud.',
    'El servicio fue completado. Gracias por reportarlo.',
    'La solicitud fue cerrada. El historial queda disponible.',
  ];

  return (
    <div>
      <button type="button" className="back-link" onClick={() => navigate(getBackPath())}>
        <Icon name="arrow" size={18} /> {getBackLabel()}
      </button>

      <div className="detail-head">
        <div>
          <div className="row wrap">
            <span className="code">{solicitud.codigo}</span>
            <Badge texto={solicitud.estado} />
            <Badge texto={solicitud.prioridad} />
          </div>
          <h1>{solicitud.titulo}</h1>
          <p>Registrada el {solicitud.fecha} a las 09:42</p>
        </div>
      </div>

      <div className="detail-grid">
        <main className="detail-main">
          {/* Panel de datos principales */}
          <section className="panel info-panel">
            <h2>Datos principales</h2>
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
                <small>Estado</small>
                <Badge texto={solicitud.estado} />
              </div>
              <div>
                <small>Prioridad</small>
                <Badge texto={solicitud.prioridad} />
              </div>
            </div>
            <div className="description">
              <small>Descripción</small>
              <p>{solicitud.descripcion}</p>
            </div>
          </section>

          {/* Historial / Timeline */}
          <section className="panel timeline">
            <h2>Historial de la solicitud</h2>
            {timelineSteps.map((step, idx) => (
              <div className="timeline-item" key={step.titulo}>
                <div className={`timeline-dot ${idx === 0 ? 'active' : ''}`}>
                  {idx === 0 && <Icon name="check" size={12} />}
                </div>
                <div>
                  <strong>{step.titulo}</strong>
                  <p>{step.descripcion}</p>
                  <small>{step.tiempo}</small>
                </div>
                {idx < timelineSteps.length - 1 && <i />}
              </div>
            ))}
          </section>

          {/* Comentarios */}
          <section className="panel info-panel">
            <h2>Comentarios</h2>
            {comentarios.length === 0 ? (
              <p className="muted-note">
                Aún no hay comentarios. Puedes escribir uno si tienes más información.
              </p>
            ) : (
              <div className="comments">
                {comentarios.map((c, i) => (
                  <div className="comment" key={i}>
                    <div
                      className={`avatar small ${c.rol === 'Solicitante' ? '' : 'staff'}`.trim()}
                    >
                      {getInitials(c.nombre)}
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

            <form className="comment-form" onSubmit={handleSendComment}>
              <textarea
                aria-label="Escribir comentario"
                placeholder="Escribe un comentario o actualización..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
              />
              <Button type="submit" icon="send">
                Comentar
              </Button>
            </form>
          </section>

          {/* Evidencias */}
          <section className="panel info-panel">
            <h2>Evidencias</h2>
            {!solicitud.evidencias || solicitud.evidencias.length === 0 ? (
              <p className="muted-note">No se adjuntaron archivos a esta solicitud.</p>
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
          </section>
        </main>

        <aside>
          {/* Estado actual & barra de progreso */}
          <section className="panel status-panel">
            <div className="card-label">ESTADO ACTUAL</div>
            <Badge texto={solicitud.estado} />
            <p>{textosEstado[Math.min(level, 4)]}</p>

            <div className="progress">
              {[0, 1, 2, 3].map((n) => (
                <span key={n} className={n <= Math.min(level, 3) ? 'done' : ''} />
              ))}
            </div>
            <div className="progress-labels">
              <span>Registrada</span>
              <span>Resuelta</span>
            </div>
          </section>

          {/* Responsable asignado */}
          <section className="panel contact-panel">
            <div className="card-label">RESPONSABLE ASIGNADO</div>
            {tieneResponsable ? (
              <>
                <div className="contact">
                  <div className="avatar staff">{getInitials(solicitud.responsable)}</div>
                  <div>
                    <strong>{solicitud.responsable}</strong>
                    <span>{solicitud.rolResponsable || 'Soporte técnico'}</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  full
                  icon="send"
                  onClick={() =>
                    document.querySelector('.comment-form textarea')?.focus()
                  }
                >
                  Enviar comentario
                </Button>
              </>
            ) : (
              <p className="muted-note">
                Todavía no hay un responsable asignado. Te avisaremos cuando lo haya.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
