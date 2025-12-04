import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const CUSTOMER_ID = import.meta.env.VITE_CUSTOMER_ID ?? 'customer-azuga';

interface DashboardSummary {
  totalVehicles: number;
  problematicVehicles: number;
  healthyVehicles: number;
  appointmentsBooked: number;
}

interface DeviceEvent {
  id: string;
  eventType: string;
  occurredAt: string;
  vehicle: {
    label: string;
  };
  payload: Record<string, any>;
}

const donutColors = ['#36B37E', '#FFAB00', '#FF5630'];
const navItems = ['Live', 'SafetyCam', 'Dashboard', 'Rewards', 'Reports', 'Maintenance', 'Admin'];

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function bootstrap() {
      try {
        const [summaryRes, eventsRes] = await Promise.all([
          axios.get(`${API_URL}/dashboard/${CUSTOMER_ID}`),
          axios.get(`${API_URL}/events`, { params: { customerId: CUSTOMER_ID, limit: 5 } }),
        ]);
        setSummary(summaryRes.data);
        setEvents(eventsRes.data.events ?? []);
      } catch (err) {
        console.error(err);
        setError('Unable to connect to Vehicle Health services.');
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const milesTrend = useMemo(() => {
    const baseline = summary?.totalVehicles ?? 0;
    return ['30-Nov', '01-Dec', '02-Dec', '03-Dec', '04-Dec'].map((label, idx) => ({
      label,
      miles: Math.round((baseline * 80 + idx * 120) * (summary?.healthyVehicles ? 1.1 : 0.6)),
    }));
  }, [summary]);

  const donutData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Healthy', value: summary.healthyVehicles },
      { name: 'In Review', value: summary.problematicVehicles },
      { name: 'Unknown', value: Math.max(summary.totalVehicles - summary.healthyVehicles - summary.problematicVehicles, 0) },
    ];
  }, [summary]);

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-mark">az</span>uga
          <span className="cid">CID: 28907</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item} className={`nav-btn ${item === 'Live' ? 'active' : ''}`}>
              {item}
            </button>
          ))}
        </nav>
        <div className="user-pill">
          <span className="status-dot" />
          <span>Hi, Narayanar_Pro Reddy</span>
        </div>
      </header>

      <main className="layout-grid">
        <section className="event-panel">
          <div className="panel-head">
            <h2>Live</h2>
            <div className="filters">
              <button className="ghost">Events</button>
              <button className="ghost">Group/Vehicle</button>
              <button className="ghost">Tags</button>
            </div>
          </div>
          <div className="event-list">
            {loading && <p className="muted">Loading events...</p>}
            {error && <p className="error-text">{error}</p>}
            {!loading && events.length === 0 && <p className="muted">No events yet.</p>}
            {events.map((event) => (
              <article key={event.id} className="event-card">
                <div>
                  <p className="vehicle-label">{event.vehicle.label}</p>
                  <p className="event-type">{event.eventType}</p>
                </div>
                <div>
                  <p className="muted">
                    {new Date(event.occurredAt).toLocaleString(undefined, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="muted small">{event.payload?.location ?? 'Unknown location'}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="map-panel">
          <div className="map-toolbar">
            <div>
              <button className="ghost">Map Options</button>
              <button className="ghost">Legend</button>
              <button className="ghost">Recenter</button>
            </div>
            <button className="ghost">Live Update Settings</button>
          </div>
          <div className="map-placeholder">
            <p>Montpelier Community Association</p>
          </div>
          <div className="quick-actions">
            <button className="primary">Find Nearest Vehicle</button>
            <button className="secondary">Send Track-Me Links</button>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Dashboard</h2>
            <div className="stats">
              <div>
                <p className="stat-label">Active Vehicles</p>
                <p className="stat-value">{summary?.totalVehicles ?? '-'}</p>
              </div>
              <div>
                <p className="stat-label">Problematic</p>
                <p className="stat-value warning">{summary?.problematicVehicles ?? '-'}</p>
              </div>
              <div>
                <p className="stat-label">Appointments</p>
                <p className="stat-value">{summary?.appointmentsBooked ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-head">
              <div>
                <p className="muted">Miles Driven</p>
                <strong>Total Miles</strong>
              </div>
              <select>
                <option>Our Goal</option>
                <option>Last Week</option>
              </select>
            </div>
            <div className="chart-body">
              <ResponsiveContainer height={180} width="100%">
                <AreaChart data={milesTrend}>
                  <defs>
                    <linearGradient id="milesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="miles" stroke="#1D4ED8" fillOpacity={1} fill="url(#milesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-head">
              <strong>Vehicle Utilization (last 7 days)</strong>
            </div>
            <div className="chart-body donut">
              {summary ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={2}>
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={donutColors[index % donutColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="muted">Loading utilization...</p>
              )}
              <div className="legend">
                <span className="legend-dot healthy" /> Healthy
                <span className="legend-dot warning" /> Problematic
                <span className="legend-dot neutral" /> Unknown
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
