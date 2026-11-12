import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSolicitudesMock, SUPERVISOR_KPIS, CARGA_POR_CATEGORIA } from '../mocks/solicitudes';
import { esVencida } from '../config/vigencia';
import { getDashboard } from '../services/dashboard.js';
import { getSolicitudes } from '../services/solicitudes.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import KpiCard from '../components/KpiCard';
import RequestTable from '../components/RequestTable';
import Icon from '../components/Icon';
import './dashboard.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function SupervisorDashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [kpis,       setKpis]       = useState(null);
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(!USE_MOCKS);
  const [error,      setError]      = useState('');
  const [cargaCat,   setCargaCat]   = useState([]);

  const firstName = user?.nombre ? user.nombre.split(' ')[0] : 'Ana';

  useEffect(() => {
    if (USE_MOCKS) {
      const all = getSolicitudesMock();
      const vencidasCount = all.filter(s => esVencida(s)).length;
      setKpis({
        total:      Number(SUPERVISOR_KPIS.totales),
        pendientes: all.filter(s => s.estado === 'Pendiente' || s.estado === 'Registrada' || s.estado === 'En evaluación').length,
        atendidas:  all.filter(s => s.estado === 'Resuelta'  || s.estado === 'Cerrada').length,
        vencidas:   vencidasCount,
        porcentajeResuelto: 89,
        tiempoPromedioAtencionHoras: 4,
      });
      setItems(all);
      setCargaCat(CARGA_POR_CATEGORIA.map(c => ({ nombre: c.categoria, total: c.cantidad })));
      return;
    }

    setLoading(true);
    Promise.all([
      getDashboard(),
      getSolicitudes(),
    ])
      .then(([dash, sols]) => {
        setKpis(dash);
        setItems(sols.slice(0, 20)); // Dashboard muestra las recientes
        setCargaCat(dash.porCategoria ?? []);
      })
      .catch(err => setError(err.message ?? 'No se pudieron cargar los indicadores.'))
      .finally(() => setLoading(false));
  }, []);

  const maxCat = cargaCat.length ? Math.max(...cargaCat.map(c => c.total), 1) : 1;

  return (
    <div>
      <PageHead
        eyebrow={new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        title={`Buenos días, ${firstName}`}
        text="Este es el estado general de los servicios universitarios."
      />

      {error && (
        <div className="message error" role="alert" style={{ marginBottom: '24px' }}>
          <Icon name="alert" /><div><strong>{error}</strong></div>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard number={loading ? '…' : String(kpis?.total ?? 0)}      label="Solicitudes totales"  change="+12% este mes" />
        <KpiCard number={loading ? '…' : String(kpis?.atendidas ?? 0)}  label="En atención"          change="Activas ahora" tone="dark" />
        <KpiCard number={loading ? '…' : `${kpis?.porcentajeResuelto ?? 0}%`} label="Resueltas a tiempo" change="+4% vs. período anterior" tone="gold" />
        <KpiCard number={loading ? '…' : String(kpis?.vencidas ?? 0)}   label="Vencidas"             change="Superan plazo de atención" tone="danger" icon="alert" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Solicitudes recientes</h2>
              <p>Últimas actualizaciones del sistema</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/supervisor/solicitudes')}>
              Ver todas <Icon name="chevron" size={16} />
            </Button>
          </div>
          {loading ? (
            <p className="muted-note">Cargando solicitudes…</p>
          ) : (
            <RequestTable
              compact
              requests={items}
              onOpen={(code) => navigate(`/solicitudes/${code}`)}
            />
          )}
        </section>

        <aside className="panel workload">
          <div className="panel-head">
            <div>
              <h2>Carga por categoría</h2>
              <p>Solicitudes activas</p>
            </div>
          </div>
          {loading ? (
            <p className="muted-note">Cargando…</p>
          ) : (
            cargaCat.map((item) => (
              <div className="work-row" key={item.nombre ?? item.categoria}>
                <div>
                  <span>{item.nombre ?? item.categoria}</span>
                  <b>{item.total ?? item.cantidad}</b>
                </div>
                <div className="bar">
                  <i style={{ width: `${Math.round(((item.total ?? item.cantidad) / maxCat) * 100)}%` }} />
                </div>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
