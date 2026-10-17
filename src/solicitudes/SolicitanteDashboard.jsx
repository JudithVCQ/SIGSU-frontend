import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSolicitudesMock, ESTADO_NIVEL } from '../mocks/solicitudes';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import KpiCard from '../components/KpiCard';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import './solicitudes.css';

export default function SolicitanteDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const items = getSolicitudesMock();

  const firstName = user?.nombre ? user.nombre.split(' ')[0] : 'Camila';

  const pendientes = items.filter((r) => (ESTADO_NIVEL[r.estado] ?? 0) <= 1).length;
  const enAtencion = items.filter((r) => r.estado === 'En atención').length;
  const resueltas = items.filter((r) => (ESTADO_NIVEL[r.estado] ?? 0) >= 3).length;

  return (
    <div>
      <PageHead
        eyebrow="SÁBADO, 17 DE OCTUBRE"
        title={`Hola, ${firstName}`}
        text="Revisa el avance de tus solicitudes o registra una nueva."
      />

      <section className="cta-banner">
        <div>
          <h2>¿Algo no funciona en el campus?</h2>
          <p>
            Cuéntanos qué ocurre y el equipo indicado se encargará. Tiempo promedio de primera
            respuesta: 4 horas.
          </p>
        </div>
        <Button
          variant="accent"
          icon="plus"
          onClick={() => navigate('/solicitante/nueva')}
        >
          Nueva solicitud
        </Button>
      </section>

      <div className="kpi-grid">
        <KpiCard
          icon="clock"
          number={String(pendientes)}
          label="Pendientes"
          change="Esperando asignación"
        />
        <KpiCard
          icon="layers"
          tone="dark"
          number={String(enAtencion)}
          label="En atención"
          change="Un responsable trabaja en ellas"
        />
        <KpiCard
          icon="check"
          tone="gold"
          number={String(resueltas)}
          label="Resueltas"
          change="Últimos 30 días"
        />
      </div>

      <section className="panel recent-panel">
        <div className="panel-head">
          <div>
            <h2>Solicitudes recientes</h2>
            <p>Tus últimas actualizaciones</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/solicitante/solicitudes')}
          >
            Ver todas <Icon name="chevron" size={16} />
          </Button>
        </div>

        <div>
          {items.slice(0, 4).map((r) => (
            <button
              key={r.codigo}
              type="button"
              className="recent-item"
              onClick={() => navigate(`/solicitudes/${r.codigo}`)}
            >
              <div className="recent-main">
                <strong>{r.codigo}</strong>
                <span>{r.titulo}</span>
                <small>
                  {r.categoria} · {r.fecha}
                </small>
              </div>
              <div className="recent-badges">
                <Badge texto={r.estado} />
                <Badge texto={r.prioridad} />
              </div>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
