import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';
import {
  ResponsiveContainer,
  Tooltip,
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
  fleetHealthScore: number;
  activeAlerts: number;
  serviceBookings: number;
}

const STATIC_SUMMARY: DashboardSummary = {
  totalVehicles: 50,
  healthyVehicles: 43,
  problematicVehicles: 7,
  appointmentsBooked: 9,
  fleetHealthScore: 82,
  activeAlerts: 7,
  serviceBookings: 9,
};

const donutColors = ['#36B37E', '#FFAB00', '#FF5630'];
const navItems = ['Dashboard', 'Fleet Vehicles', 'Notifications', 'Appointments', 'Service Stations', 'Settings'] as const;
type NavTab = (typeof navItems)[number];

type Vehicle = {
  id: string;
  name: string;
  licensePlate: string;
  healthScore: number;
  location: string;
  lastUpdated: string;
  dtcCodes: number;
  alerts: number;
  status: 'warning' | 'critical' | 'healthy';
};

const FLEET_VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'Peterbilt 579 #102',
    licensePlate: 'TX-9583-PB',
    healthScore: 68,
    location: 'Dallas, TX',
    lastUpdated: '12 min ago',
    dtcCodes: 1,
    alerts: 1,
    status: 'warning',
  },
  {
    id: '2',
    name: 'Volvo VNL 860 #104',
    licensePlate: 'TX-3892-VL',
    healthScore: 71,
    location: 'Austin, TX',
    lastUpdated: '3 min ago',
    dtcCodes: 1,
    alerts: 2,
    status: 'warning',
  },
  {
    id: '3',
    name: 'Volvo #150',
    licensePlate: 'TX-1043-VO',
    healthScore: 58,
    location: 'San Antonio, TX',
    lastUpdated: '10 min ago',
    alerts: 1,
    dtcCodes: 0,
    status: 'warning',
  },
  {
    id: '4',
    name: 'Freightliner Cascadia #101',
    licensePlate: 'TX-4521-FL',
    healthScore: 45,
    location: 'Houston, TX',
    lastUpdated: '5 min ago',
    dtcCodes: 2,
    alerts: 3,
    status: 'critical',
  },
];

type VehicleRequiringAttention = {
  id: string;
  name: string;
  location: string;
  status: 'Critical' | 'Warning';
};

const VEHICLES_REQUIRING_ATTENTION: VehicleRequiringAttention[] = [
  {
    id: '1',
    name: 'Freightliner Cascadia #101',
    location: 'Houston, TX',
    status: 'Critical',
  },
  {
    id: '2',
    name: 'Peterbilt 579 #102',
    location: 'Dallas, TX',
    status: 'Warning',
  },
  {
    id: '3',
    name: 'Volvo VNL 860 #104',
    location: 'Austin, TX',
    status: 'Warning',
  },
];

type Notification = {
  id: string;
  title: string;
  summary: string;
  time: string;
};

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Weekly Fleet Health Summary',
    summary: '2 vehicles require immediate attention. 3 vehicles scheduled for maintenance.',
    time: '2 hours ago',
  },
  {
    id: '2',
    title: 'New DTC Alert',
    summary: 'P0420 detected on Freightliner Cascadia #101',
    time: '5 hours ago',
  },
];

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(STATIC_SUMMARY);
  const [activeTab, setActiveTab] = useState<NavTab>('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'warning' | 'critical'>('warning');

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

  const donutData = useMemo(() => {
    if (!summary) return [];
    const healthy = summary.healthyVehicles;
    const predictive = 3; // AI predicted issues
    const tireHealth = 4; // Tire health issues
    return [
      { name: 'Healthy', value: healthy },
      { name: 'Predictive Maintenance', value: predictive },
      { name: 'Tire Health Issues', value: tireHealth },
    ];
  }, [summary]);

  const filteredVehicles = useMemo(() => {
    let filtered = FLEET_VEHICLES;
    
    if (searchQuery) {
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter((v) => v.status === filterStatus);
    }
    
    return filtered;
  }, [searchQuery, filterStatus]);

  const handleNavigateToFleetVehicles = () => {
    setActiveTab('Fleet Vehicles');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon"></div>
          </div>
          <div className="logo-text">
            <div className="logo-title">FindMyService</div>
            <div className="logo-subtitle">by Bridgestone</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item}
              className={`nav-item ${item === activeTab ? 'active' : ''}`}
              onClick={() => setActiveTab(item)}
            >
              {item === 'Dashboard' && <span className="nav-icon">📊</span>}
              {item === 'Fleet Vehicles' && <span className="nav-icon">🚛</span>}
              {item === 'Notifications' && (
                <>
                  <span className="nav-icon">🔔</span>
                  <span className="notification-badge">2</span>
                </>
              )}
              {item === 'Appointments' && <span className="nav-icon">📅</span>}
              {item === 'Service Stations' && <span className="nav-icon">📍</span>}
              {item === 'Settings' && <span className="nav-icon">⚙️</span>}
              <span className="nav-label">{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        {activeTab === 'Dashboard' && (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">Fleet Dashboard</h1>
                <p className="dashboard-subtitle">AI-Powered Predictive Maintenance Overview</p>
              </div>
              <div className="dashboard-status">
                <span className="status-indicator">
                  <span className="status-icon">⚡</span>
                  AI Analysis Active
                </span>
                <span className="last-updated">Last updated: Just now</span>
              </div>
            </div>

            <div className="metrics-row">
              <div className="metric-card" onClick={handleNavigateToFleetVehicles} style={{ cursor: 'pointer' }}>
                <div className="metric-content">
                  <div>
                    <p className="metric-label">Total Fleet</p>
                    <p className="metric-value">{summary?.totalVehicles ?? 50}</p>
                    <p className="metric-sub">Avg Health: {summary?.fleetHealthScore ?? 82}%</p>
                  </div>
                  <div className="metric-icon">🚛🚛</div>
                </div>
              </div>

              <div className="metric-card predictive" onClick={handleNavigateToFleetVehicles} style={{ cursor: 'pointer' }}>
                <div className="metric-content">
                  <div>
                    <p className="metric-label">Predictive Maintenance</p>
                    <p className="metric-value">3</p>
                    <p className="metric-sub">AI predicted issues</p>
                  </div>
                  <div className="metric-icon warning">⚠️</div>
                </div>
              </div>

              <div className="metric-card tire-health" onClick={handleNavigateToFleetVehicles} style={{ cursor: 'pointer' }}>
                <div className="metric-content">
                  <div>
                    <p className="metric-label">Tire Health</p>
                    <p className="metric-value">4</p>
                    <p className="metric-sub">Requires attention</p>
                  </div>
                  <div className="metric-icon critical">🔴</div>
                </div>
              </div>

              <div className="metric-card services" onClick={handleNavigateToFleetVehicles} style={{ cursor: 'pointer' }}>
                <div className="metric-content">
                  <div>
                    <p className="metric-label">Upcoming Services</p>
                    <p className="metric-value">{summary?.serviceBookings ?? 9}</p>
                    <p className="metric-sub">Scheduled maintenance</p>
                  </div>
                  <div className="metric-icon">🔧</div>
                </div>
              </div>
            </div>

            <div className="fleet-health-section">
              <h2 className="section-title">Fleet Health Distribution</h2>
              <p className="section-subtitle">Click on a segment to view vehicles</p>
              <div className="donut-chart-container">
                <div className="donut-chart-wrapper">
                  {summary && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          onClick={handleNavigateToFleetVehicles}
                          style={{ cursor: 'pointer' }}
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={donutColors[index % donutColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="donut-legend">
                  <div className="legend-item">
                    <span className="legend-color healthy"></span>
                    <span>Healthy</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color predictive"></span>
                    <span>Predictive Maintenance</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color tire"></span>
                    <span>Tire Health Issues</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bottom-panels">
              <div className="panel vehicles-panel" onClick={handleNavigateToFleetVehicles} style={{ cursor: 'pointer' }}>
                <div className="panel-header">
                  <h3 className="panel-title">
                    <span className="panel-icon">▲</span>
                    Vehicles Requiring Attention
                  </h3>
                  <button className="view-all-btn" onClick={(e) => { e.stopPropagation(); handleNavigateToFleetVehicles(); }}>
                    View All
                  </button>
                </div>
                <div className="vehicles-list">
                  {VEHICLES_REQUIRING_ATTENTION.slice(0, 3).map((vehicle) => (
                    <div key={vehicle.id} className="vehicle-item">
                      <span className="vehicle-icon">🚛</span>
                      <div className="vehicle-info">
                        <div className="vehicle-name">{vehicle.name}</div>
                        <div className="vehicle-location">{vehicle.location}</div>
                      </div>
                      <span className={`status-badge ${vehicle.status.toLowerCase()}`}>
                        {vehicle.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel notifications-panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <span className="panel-icon">🔔</span>
                    Notifications
                  </h3>
                  <button className="view-all-btn">View All</button>
                </div>
                <div className="notifications-list">
                  {NOTIFICATIONS.map((notification) => (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-summary">{notification.summary}</div>
                      <div className="notification-time">{notification.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Fleet Vehicles' && (
          <div className="fleet-vehicles-container">
            <div className="fleet-vehicles-header">
              <div>
                <h1 className="page-title">Fleet Vehicles</h1>
                <p className="page-subtitle">Monitor and manage your entire fleet</p>
              </div>
            </div>

            <div className="fleet-vehicles-controls">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-container">
                <button
                  className={`filter-btn ${filterStatus === 'warning' ? 'active' : ''}`}
                  onClick={() => setFilterStatus(filterStatus === 'warning' ? 'all' : 'warning')}
                >
                  <span className="filter-icon">🔽</span>
                  Warning
                </button>
              </div>
            </div>

            <div className="vehicles-grid">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="vehicle-card">
                  <div className="vehicle-card-header">
                    <span className="vehicle-card-icon">🚛</span>
                    <span className="vehicle-card-warning">Warning</span>
                  </div>
                  <div className="vehicle-card-body">
                    <h3 className="vehicle-card-name">{vehicle.name}</h3>
                    <p className="vehicle-card-plate">{vehicle.licensePlate}</p>
                    <div className="health-score-section">
                      <div className="health-score-label">Health Score</div>
                      <div className="health-score-bar-container">
                        <div
                          className="health-score-bar"
                          style={{
                            width: `${vehicle.healthScore}%`,
                            backgroundColor: vehicle.healthScore < 60 ? '#FF5630' : '#FFAB00',
                          }}
                        ></div>
                      </div>
                      <div className="health-score-value">{vehicle.healthScore}%</div>
                    </div>
                    <div className="vehicle-card-meta">
                      <div className="meta-item">
                        <span className="meta-icon">📍</span>
                        <span>{vehicle.location}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">🕐</span>
                        <span>{vehicle.lastUpdated}</span>
                      </div>
                    </div>
                    <div className="vehicle-card-tags">
                      {vehicle.dtcCodes > 0 && (
                        <span className="tag">{vehicle.dtcCodes} DTC Code{vehicle.dtcCodes > 1 ? 's' : ''}</span>
                      )}
                      {vehicle.alerts > 0 && (
                        <span className="tag">{vehicle.alerts} Alert{vehicle.alerts > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'Notifications' || activeTab === 'Appointments' || activeTab === 'Service Stations' || activeTab === 'Settings') && (
          <div className="placeholder-page">
            <h2>{activeTab}</h2>
            <p>This section is coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
