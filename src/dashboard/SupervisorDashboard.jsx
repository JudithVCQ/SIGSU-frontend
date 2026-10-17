import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getSolicitudesMock,
  SUPERVISOR_KPIS,
  CARGA_POR_CATEGORIA,
} from '../mocks/solicitudes';
import { esVencida } from '../config/vigencia';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import KpiCard from '../components/KpiCard';
import RequestTable from '../components/RequestTable';
import Icon from '../components/Icon';
import './dashboard.css';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = getSolicitudesMock();
  const vencidasCount = items.filter((s) => esVencida(s)).length;

  const firstName = user?.nombre ? user.nombre.split(' ')[0] : 'Ana';

  return (
    <div>
      <PageHead
        eyebrow="SÁBADO, 17 DE OCTUBRE"
        title={`Buenos días, ${firstName}`}
        text="Este es el estado general de los servicios universitarios."
      />

      <div className="kpi-grid">
        <KpiCard
          number={SUPERVISOR_KPIS.totales}
          label="Solicitudes totales"
          change="+12% este mes"
        />
        <KpiCard
          number={SUPERVISOR_KPIS.enAtencion}
          label="En atención"
          change="6 de alta prioridad"
          tone="dark"
        />
        <KpiCard
          number={SUPERVISOR_KPIS.resueltasTiempo}
          label="Resueltas a tiempo"
          change="+4% vs. periodo anterior"
          tone="gold"
        />
        <KpiCard
          number={String(vencidasCount)}
          label="Vencidas"
          change="Superan plazo de atención"
          tone="danger"
          icon="alert"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Solicitudes recientes</h2>
              <p>Últimas actualizaciones del sistema</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/supervisor/solicitudes')}
            >
              Ver todas <Icon name="chevron" size={16} />
            </Button>
          </div>
          <RequestTable
            compact
            mostrarVencidas
            requests={items}
            onOpen={(code) => navigate(`/solicitudes/${code}`)}
          />
        </section>

        <aside className="panel workload">
          <div className="panel-head">
            <div>
              <h2>Carga por categoría</h2>
              <p>Solicitudes activas</p>
            </div>
          </div>
          {CARGA_POR_CATEGORIA.map((item) => (
            <div className="work-row" key={item.categoria}>
              <div>
                <span>{item.categoria}</span>
                <b>{item.cantidad}</b>
              </div>
              <div className="bar">
                <i style={{ width: `${item.porcentaje}%` }} />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
