import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSolicitudesMock, SUPERVISOR_KPIS, CARGA_POR_CATEGORIA } from '../mocks/solicitudes';
import { esVencida } from '../config/vigencia';
import { saludoSegunHora } from '../config/saludo';
import { getDashboard } from '../services/dashboard.js';
import { getSolicitudes } from '../services/solicitudes.js';
import { calificacionDisponible, esVistaPreviaLocal, getResumenCalificaciones } from '../services/calificaciones.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import KpiCard from '../components/KpiCard';
import RequestTable from '../components/RequestTable';
import Icon from '../components/Icon';
import './dashboard.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const formatPromedio = (n) => (typeof n === 'number' ? n.toFixed(1) : '—');

export default function SupervisorDashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [kpis,       setKpis]       = useState(null);
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(!USE_MOCKS);
  const [error,      setError]      = useState('');
  const [cargaCat,   setCargaCat]   = useState([]);

  // Calificación del servicio: se carga aparte para que un fallo no afecte al resto del dashboard
  const mostrarCalificacion = calificacionDisponible();
  const [resumenCal, setResumenCal] = useState(null);
  const [loadingCal, setLoadingCal] = useState(mostrarCalificacion);
  const [errorCal,   setErrorCal]   = useState('');

  const cargarCalificaciones = useCallback(async () => {
    setLoadingCal(true);
    setErrorCal('');
    try {
      setResumenCal(await getResumenCalificaciones());
    } catch (err) {
      setErrorCal(err?.message || 'No se pudieron cargar las calificaciones.');
    } finally {
      setLoadingCal(false);
    }
  }, []);

  useEffect(() => {
    if (mostrarCalificacion) cargarCalificaciones();
  }, [mostrarCalificacion, cargarCalificaciones]);

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
        title={`${saludoSegunHora()}, ${firstName}`}
        text="Este es el estado general de los servicios universitarios."
      />

      {error && (
        <div className="message error" role="alert" style={{ marginBottom: '24px' }}>
          <Icon name="alert" /><div><strong>{error}</strong></div>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard number={loading ? '…' : String(kpis?.total ?? 0)}      label="Solicitudes totales" />
        <KpiCard number={loading ? '…' : String(kpis?.atendidas ?? 0)}  label="Atendidas" tone="dark" />
        <KpiCard number={loading ? '…' : `${kpis?.porcentajeResuelto ?? 0}%`} label="Porcentaje resuelto" tone="gold" />
        <KpiCard number={loading ? '…' : String(kpis?.vencidas ?? 0)}   label="Vencidas"             change="Superan plazo de atención" tone="danger" icon="alert" />
        {mostrarCalificacion && (
          <KpiCard
            number={loadingCal ? '…' : (resumenCal?.total ? `${formatPromedio(resumenCal.promedio)} / 5` : '—')}
            label="Calificación promedio"
            change={
              errorCal ? 'No se pudo cargar'
                : loadingCal ? ''
                : resumenCal?.total ? `${resumenCal.total} ${resumenCal.total === 1 ? 'calificación' : 'calificaciones'}`
                : 'Sin calificaciones aún'
            }
            icon="check"
          />
        )}
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

      {mostrarCalificacion && (
        <section className="panel workload calificacion-tecnicos" aria-labelledby="cal-tecnicos-titulo">
          <div className="panel-head">
            <div>
              <h2 id="cal-tecnicos-titulo">Calificación por técnico</h2>
              <p>Promedio de las calificaciones de los solicitantes (1 a 5)</p>
              {esVistaPreviaLocal() && (
                <p className="muted-note">Vista previa: solo incluye calificaciones registradas en este navegador.</p>
              )}
            </div>
          </div>
          {loadingCal ? (
            <p className="muted-note" role="status">Cargando calificaciones…</p>
          ) : errorCal ? (
            <div className="work-row">
              <div className="message error" role="alert">
                <Icon name="alert" /><div><strong>{errorCal}</strong></div>
              </div>
              <Button variant="secondary" onClick={cargarCalificaciones}>Reintentar</Button>
            </div>
          ) : !resumenCal?.porTecnico?.length ? (
            <p className="muted-note work-row">Aún no hay calificaciones registradas.</p>
          ) : (
            resumenCal.porTecnico.map((t) => (
              <div className="work-row" key={t.responsable}>
                <div>
                  <span>{t.responsable}</span>
                  <b>
                    {formatPromedio(t.promedio)} / 5 · {t.total} {t.total === 1 ? 'calificación' : 'calificaciones'}
                  </b>
                </div>
                <div className="bar">
                  <i style={{ width: `${Math.round((t.promedio / 5) * 100)}%` }} />
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}
