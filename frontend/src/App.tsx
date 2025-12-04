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
  BarChart,
  Bar,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const CUSTOMER_ID = import.meta.env.VITE_CUSTOMER_ID ?? 'customer-azuga';

interface DashboardSummary {
  totalVehicles: number;
  problematicVehicles: number;
  healthyVehicles: number;
  appointmentsBooked: number;
  fleetHealthScore: number; // percentage 0-100
  activeAlerts: number;
  serviceBookings: number;
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
const navItems = ['Live', 'Alerts', 'Dashboard', 'Maintenance'] as const;
type NavTab = (typeof navItems)[number];

const STATIC_EVENTS: DeviceEvent[] = [
  {
    id: 'vh101-ign-on',
    eventType: 'tripstart',
    occurredAt: '2025-12-04T10:00:00Z',
    vehicle: { label: 'VH-101 Ops 1' },
    payload: {
      eventLabel: 'Ignition On',
      location: 'Washington National Pike, Boyds, MD',
      speedMph: 0,
    },
  },
  {
    id: 'vh101-gps-idle',
    eventType: 'gps',
    occurredAt: '2025-12-04T10:02:00Z',
    vehicle: { label: 'VH-101 Ops 1' },
    payload: {
      eventLabel: 'GPS Fix (Idling)',
      location: 'Boyds Depot, MD',
      speedMph: 8,
    },
  },
  {
    id: 'vh101-gps-hwy',
    eventType: 'gps',
    occurredAt: '2025-12-04T10:05:00Z',
    vehicle: { label: 'VH-101 Ops 1' },
    payload: {
      eventLabel: 'GPS Fix (Cruising)',
      location: 'Washington National Pike, Boyds, MD',
      speedMph: 64,
    },
  },
  {
    id: 'vh101-dtc',
    eventType: 'dtc',
    occurredAt: '2025-12-04T10:06:30Z',
    vehicle: { label: 'VH-101 Ops 1' },
    payload: {
      eventLabel: 'DTC P0420',
      location: 'Boyds, MD',
      code: 'P0420',
      severity: 'High',
      description: 'Catalyst efficiency below threshold',
    },
  },
  {
    id: 'vh101-ign-off',
    eventType: 'tripend',
    occurredAt: '2025-12-04T10:20:00Z',
    vehicle: { label: 'VH-101 Ops 1' },
    payload: {
      eventLabel: 'Ignition Off',
      location: 'Gaithersburg, MD',
      speedMph: 0,
    },
  },
  {
    id: 'vh102-ign-on',
    eventType: 'tripstart',
    occurredAt: '2025-12-04T09:40:00Z',
    vehicle: { label: 'VH-102 Ops 2' },
    payload: {
      eventLabel: 'Ignition On',
      location: 'Myersville Yard, MD',
      speedMph: 0,
    },
  },
  {
    id: 'vh102-gps-hwy',
    eventType: 'gps',
    occurredAt: '2025-12-04T09:50:00Z',
    vehicle: { label: 'VH-102 Ops 2' },
    payload: {
      eventLabel: 'GPS Fix (Highway 75 MPH)',
      location: '3002 Ventrie Ct, Myersville, MD',
      speedMph: 75,
    },
  },
  {
    id: 'vh102-dtc',
    eventType: 'dtc',
    occurredAt: '2025-12-04T09:52:30Z',
    vehicle: { label: 'VH-102 Ops 2' },
    payload: {
      eventLabel: 'DTC P0301',
      location: 'Myersville, MD',
      code: 'P0301',
      severity: 'Medium',
      description: 'Cylinder 1 misfire detected',
    },
  },
  {
    id: 'vh102-ign-off',
    eventType: 'tripend',
    occurredAt: '2025-12-04T10:05:00Z',
    vehicle: { label: 'VH-102 Ops 2' },
    payload: {
      eventLabel: 'Ignition Off',
      location: 'Mount Airy, MD',
      speedMph: 0,
    },
  },
  {
    id: 'vh103-parked',
    eventType: 'gps',
    occurredAt: '2025-12-04T10:15:00Z',
    vehicle: { label: 'VH-103 Ops 3' },
    payload: {
      eventLabel: 'GPS Fix (Stopped)',
      location: '7631 Airpark Rd, Gaithersburg, MD',
      speedMph: 0,
    },
  },
];

type AlertItem = {
  id: string;
  vehicleLabel: string;
  code: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  when: string;
  location: string;
  status: 'Open' | 'In Review' | 'Closed';
};

type ProblemVehicle = {
  id: string;
  label: string;
  location: string;
  status: 'Problematic' | 'Healthy';
  dtcs: { code: string; description: string; severity: string }[];
};

type MaintenanceItem = {
  id: string;
  vehicleLabel: string;
  dtcSummary: string;
  status: 'Scheduled' | 'Completed' | 'In Progress';
  scheduledFor: string;
  source: 'Firestone API' | 'Manual';
  location: string;
};

const ALERT_ITEMS: AlertItem[] = [
  {
    id: 'alert-p0420',
    vehicleLabel: 'VH-101 Ops 1',
    code: 'P0420',
    severity: 'High',
    description: 'Catalyst efficiency below threshold',
    when: '5 min ago',
    location: 'Boyds, MD',
    status: 'Open',
  },
  {
    id: 'alert-p0301',
    vehicleLabel: 'VH-102 Ops 2',
    code: 'P0301',
    severity: 'Medium',
    description: 'Cylinder 1 misfire detected',
    when: '18 min ago',
    location: 'Myersville, MD',
    status: 'In Review',
  },
];

const PROBLEM_VEHICLES: ProblemVehicle[] = [
  {
    id: 'VH-101',
    label: 'VH-101 Ops 1',
    location: 'Gaithersburg, MD',
    status: 'Problematic',
    dtcs: [
      {
        code: 'P0420',
        description: 'Catalyst efficiency below threshold',
        severity: 'High',
      },
    ],
  },
  {
    id: 'VH-102',
    label: 'VH-102 Ops 2',
    location: 'Mount Airy, MD',
    status: 'Problematic',
    dtcs: [
      {
        code: 'P0301',
        description: 'Cylinder 1 misfire detected',
        severity: 'Medium',
      },
    ],
  },
];

const HEALTHY_VEHICLES: ProblemVehicle[] = [
  {
    id: 'VH-103',
    label: 'VH-103 Ops 3',
    location: 'Gaithersburg HQ, MD',
    status: 'Healthy',
    dtcs: [],
  },
];

const STATIC_SUMMARY: DashboardSummary = {
  // Numbers inspired by design mocks
  totalVehicles: 1250,
  healthyVehicles: 1045,
  problematicVehicles: 205,
  appointmentsBooked: 178,
  fleetHealthScore: 83.6,
  activeAlerts: 205,
  serviceBookings: 178,
};

const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: 'mnt-1',
    vehicleLabel: 'VH-101 Ops 1',
    dtcSummary: 'P0420 – Catalyst efficiency below threshold',
    status: 'Scheduled',
    scheduledFor: 'Dec 06, 10:30 AM',
    source: 'Firestone API',
    location: 'Bridgestone – Gaithersburg, MD',
  },
  {
    id: 'mnt-2',
    vehicleLabel: 'VH-102 Ops 2',
    dtcSummary: 'P0301 – Cylinder 1 misfire detected',
    status: 'In Progress',
    scheduledFor: 'Dec 05, 02:00 PM',
    source: 'Firestone API',
    location: 'Bridgestone – Frederick, MD',
  },
  {
    id: 'mnt-3',
    vehicleLabel: 'VH-103 Ops 3',
    dtcSummary: 'Preventive inspection – 7,500 mile service',
    status: 'Completed',
    scheduledFor: 'Dec 02, 09:00 AM',
    source: 'Manual',
    location: 'Bridgestone – Gaithersburg, MD',
  },
];

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(STATIC_SUMMARY);
  const [events, setEvents] = useState<DeviceEvent[]>(STATIC_EVENTS);
  const [activeTab, setActiveTab] = useState<NavTab>('Live');
  const [drilldown, setDrilldown] = useState<'none' | 'problematic' | 'healthy'>('none');
  const [timeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [segment, setSegment] = useState<'all' | 'delivery' | 'service'>('all');

  useEffect(() => {
    async function bootstrap() {
      try {
        const summaryRes = await axios.get(`${API_URL}/dashboard/${CUSTOMER_ID}`);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error(err);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => {
        if (prev.length === 0) return prev;
        const [first, ...rest] = prev;
        const rotated: DeviceEvent[] = [
          ...rest,
          {
            ...first,
            occurredAt: new Date().toISOString(),
          },
        ];
        return rotated;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);



  const donutData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Healthy', value: summary.healthyVehicles },
      { name: 'In Review', value: summary.problematicVehicles },
      { name: 'Unknown', value: Math.max(summary.totalVehicles - summary.healthyVehicles - summary.problematicVehicles, 0) },
    ];
  }, [summary]);

  const severityBarData = useMemo(
    () => [
      { label: 'High', value: PROBLEM_VEHICLES.filter((v) => v.dtcs.some((d) => d.severity === 'High')).length },
      { label: 'Medium', value: PROBLEM_VEHICLES.filter((v) => v.dtcs.some((d) => d.severity === 'Medium')).length },
      { label: 'Low', value: PROBLEM_VEHICLES.filter((v) => v.dtcs.some((d) => d.severity === 'Low')).length },
    ],
    [],
  );

  const maintenanceBarData = useMemo(
    () => [
      { label: 'Completed', value: MAINTENANCE_ITEMS.filter((m) => m.status === 'Completed').length },
      { label: 'Scheduled', value: MAINTENANCE_ITEMS.filter((m) => m.status === 'Scheduled').length },
      { label: 'In Progress', value: MAINTENANCE_ITEMS.filter((m) => m.status === 'In Progress').length },
    ],
    [],
  );

  const alerts = useMemo(
    () => ALERT_ITEMS,
    [],
  );

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-mark">Azuga</span>Azuga
          <span className="cid">CID: 1059</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item}
              className={`nav-btn ${item === activeTab ? 'active' : ''}`}
              onClick={() => setActiveTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="user-pill">
          <span className="status-dot" />
          <span>Hi, Narayana Reddy</span>
        </div>
      </header>

      <main
        className={`layout-grid ${
          activeTab === 'Live'
            ? 'live-layout'
            : activeTab === 'Dashboard'
            ? 'dashboard-layout'
            : 'single-column'
        }`}
      >
        {activeTab === 'Live' && (
          <>
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
                {events.map((event) => {
                  const label = event.payload?.eventLabel ?? event.eventType;
                  const speed = typeof event.payload?.speedMph === 'number' ? Math.round(event.payload.speedMph) : null;
                  return (
                    <article key={event.id} className="event-card">
                      <div>
                        <p className="vehicle-label">{event.vehicle.label}</p>
                        <p className="event-type">{label}</p>
                        {speed !== null && <span className="speed-pill">{speed} MPH</span>}
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
                  );
                })}
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
          </>
        )}

        {activeTab === 'Alerts' && (
          <section className="alerts-panel">
            <div className="panel-head">
              <h2>Alerts</h2>
              <span className="badge">{alerts.length} open</span>
            </div>
            <div className="alerts-list">
              {alerts.map((alert) => (
                <article key={alert.id} className="alert-card">
                  <div>
                    <p className="vehicle-label">{alert.vehicleLabel}</p>
                    <p className="event-type">DTC {alert.code}</p>
                    <p className="muted small">{alert.description}</p>
                  </div>
                  <div className="alert-meta">
                    <span className={`pill ${alert.severity === 'High' ? 'pill-danger' : 'pill-warning'}`}>
                      {alert.severity} Severity
                    </span>
                    <span className="muted small">{alert.when}</span>
                    <span className="muted small">{alert.location}</span>
                    <span className="pill pill-outline">{alert.status}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Dashboard' && (
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Dashboard</h2>
            </div>

            <div className="kpi-row">
              <button
                type="button"
                className="kpi-card"
                onClick={() => setDrilldown('none')}
              >
                <p className="kpi-label">Total Vehicles</p>
                <p className="kpi-value">{summary?.totalVehicles ?? '-'}</p>
                <p className="kpi-sub">Fleet size across all segments</p>
              </button>
              <button
                type="button"
                className="kpi-card"
                onClick={() => setDrilldown('healthy')}
              >
                <p className="kpi-label">Fleet Health Score</p>
                <p className="kpi-value">{summary?.fleetHealthScore.toFixed(1)}%</p>
                <p className="kpi-sub kpi-trend positive">↑ 3.2% vs last period</p>
              </button>
              <button
                type="button"
                className="kpi-card"
                onClick={() => setActiveTab('Alerts')}
              >
                <p className="kpi-label">Active Alerts</p>
                <p className="kpi-value">{summary?.activeAlerts ?? '-'}</p>
                <p className="kpi-sub kpi-trend negative">↓ 8% after campaigns</p>
              </button>
              <button
                type="button"
                className="kpi-card"
                onClick={() => setActiveTab('Maintenance')}
              >
                <p className="kpi-label">Service Bookings</p>
                <p className="kpi-value">{summary?.serviceBookings ?? '-'}</p>
                <p className="kpi-sub kpi-trend positive">↑ 24% vs last month</p>
              </button>
            </div>

            <div className="stats">
              <button
                type="button"
                className="stat-card"
                onClick={() => setDrilldown('problematic')}
              >
                <p className="stat-label">Problematic Vehicles</p>
                <p className="stat-value warning">{summary?.problematicVehicles ?? '-'}</p>
              </button>
              <button
                type="button"
                className="stat-card"
                onClick={() => setDrilldown('healthy')}
              >
                <p className="stat-label">No Issue Vehicles</p>
                <p className="stat-value ok">{summary?.healthyVehicles ?? '-'}</p>
              </button>
              <div className="stat-card passive">
                <p className="stat-label">Total Active</p>
                <p className="stat-value">{summary?.totalVehicles ?? '-'}</p>
              </div>
            </div>

           

            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <strong>Vehicle Health Status</strong>
                  <p className="muted small">
                    Healthy vs problematic vehicles ({summary?.healthyVehicles ?? 0} healthy /{' '}
                    {summary?.problematicVehicles ?? 0} problematic)
                  </p>
                </div>
                <div className="pill-toggle-group">
                  <button
                    type="button"
                    className={`pill-toggle ${segment === 'all' ? 'active' : ''}`}
                    onClick={() => setSegment('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`pill-toggle ${segment === 'delivery' ? 'active' : ''}`}
                    onClick={() => setSegment('delivery')}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    className={`pill-toggle ${segment === 'service' ? 'active' : ''}`}
                    onClick={() => setSegment('service')}
                  >
                    Service
                  </button>
                </div>
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
                <div className="chart-footer">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setActiveTab('Alerts');
                    }}
                  >
                    View active DTC alerts
                  </button>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-head">
                <strong>DTC severity mix</strong>
                <span className="muted small">Last 7 days</span>
              </div>
              <div className="chart-body">
                <ResponsiveContainer height={180} width="100%">
                  <BarChart data={severityBarData}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill="#ef4444" />
                      <Cell fill="#f97316" />
                      <Cell fill="#22c55e" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footer">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setDrilldown('problematic')}
                >
                  Drill into vehicles with DTCs
                </button>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-head">
                <strong>Maintenance pipeline</strong>
                <span className="muted small">From Firestone & manual bookings</span>
              </div>
              <div className="chart-body">
                <ResponsiveContainer height={180} width="100%">
                  <BarChart data={maintenanceBarData}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footer">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setActiveTab('Maintenance')}
                >
                  View maintenance work orders
                </button>
              </div>
            </div>

            <div className="chart-card drilldown-card">
              <div className="chart-head">
                <strong>Vehicle details</strong>
                {drilldown === 'problematic' && <span className="pill pill-danger">Problematic vehicles</span>}
                {drilldown === 'healthy' && <span className="pill pill-success">No issue vehicles</span>}
              </div>
              <div className="drilldown-body">
                {drilldown === 'none' && <p className="muted">Click a metric to see the related vehicles and DTCs.</p>}
                {drilldown === 'problematic' && (
                  <ul className="drilldown-list">
                    {PROBLEM_VEHICLES.map((vehicle) => (
                      <li key={vehicle.id} className="drilldown-item">
                        <div>
                          <strong>{vehicle.label}</strong>
                          <p className="muted small">{vehicle.location}</p>
                        </div>
                        <div className="dtc-tags">
                          {vehicle.dtcs.map((dtc) => (
                            <span key={dtc.code} className="pill pill-danger">
                              {dtc.code} – {dtc.description}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {drilldown === 'healthy' && (
                  <ul className="drilldown-list">
                    {HEALTHY_VEHICLES.map((vehicle) => (
                      <li key={vehicle.id} className="drilldown-item">
                        <div>
                          <strong>{vehicle.label}</strong>
                          <p className="muted small">{vehicle.location}</p>
                        </div>
                        <span className="pill pill-success">No active DTCs</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Maintenance' && (
          <section className="maintenance-panel">
            <div className="panel-head">
              <h2>Maintenance</h2>
              <p className="muted small">Latest work orders synced from Bridgestone Firestone service.</p>
            </div>
            <div className="maintenance-list">
              {MAINTENANCE_ITEMS.map((item) => (
                <article key={item.id} className="maintenance-card">
                  <div>
                    <p className="vehicle-label">{item.vehicleLabel}</p>
                    <p className="muted small">{item.dtcSummary}</p>
                  </div>
                  <div className="maintenance-meta">
                    <span
                      className={`pill ${
                        item.status === 'Completed'
                          ? 'pill-success'
                          : item.status === 'Scheduled'
                          ? 'pill-warning'
                          : 'pill-info'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="muted small">{item.scheduledFor}</span>
                    <span className="muted small">{item.location}</span>
                    <span className="pill pill-outline">{item.source}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
