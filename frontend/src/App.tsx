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
  totalVehicles: 100,
  healthyVehicles: 49,
  problematicVehicles: 3,
  appointmentsBooked: 9,
  fleetHealthScore: 87,
  activeAlerts: 56,
  serviceBookings: 2,
};

const donutColors = ['#36B37E', '#FFAB00', '#FF5630'];
const navItems = ['Dashboard', 'Fleet Vehicles', 'Notifications', 'Appointments', 'Service Stations'] as const;
type NavTab = (typeof navItems)[number];

type DtcDetail = {
  code: string;
  description: string;
  prediction: string;
  confidence: number;
  action: string;
};

type ServiceDetail = {
  type: string;
  dueDate: string;
  dueMileage?: number;
  priority: 'low' | 'medium' | 'high';
};

type NearbyStation = {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating: number;
  services: string[];
  hours: string;
  discount?: string;
  specialOffer?: {
    text: string;
    validUntil: string;
  };
};

type ServiceOption = {
  id: string;
  name: string;
  price: number;
};

type AppointmentStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

type Appointment = {
  id: string;
  vehicleId: string;
  vehicleName: string;
  status: AppointmentStatus;
  location: string;
  date: string;
  time: string;
  services: string[];
  notes?: string;
  urgencyNote?: string;
  estimatedCost: number;
};

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
  mileage?: number;
  vehicleType?: string;
  dtcDetails?: DtcDetail[];
  services?: ServiceDetail[];
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
    mileage: 287432,
    vehicleType: 'Semi Truck',
    dtcDetails: [
      {
        code: 'P0420',
        description: 'Catalyst System Efficiency Below Threshold',
        prediction: 'Predicted failure: 14-21 days',
        confidence: 78,
        action: 'Inspect catalytic converter',
      },
    ],
    services: [
      {
        type: 'Transmission Service',
        dueDate: '2024-02-28',
        dueMileage: 295000,
        priority: 'medium',
      },
    ],
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
    mileage: 245123,
    vehicleType: 'Semi Truck',
    dtcDetails: [
      {
        code: 'P0301',
        description: 'Cylinder 1 Misfire Detected',
        prediction: 'Predicted failure: 7-14 days',
        confidence: 82,
        action: 'Check spark plugs and ignition system',
      },
    ],
    services: [
      {
        type: 'Oil Change',
        dueDate: '2024-01-15',
        dueMileage: 250000,
        priority: 'high',
      },
    ],
  },
  {
    id: '3',
    name: 'Volvo #150',
    licensePlate: 'TX-1043-VO',
    healthScore: 78,
    location: 'San Antonio, TX',
    lastUpdated: '10 min ago',
    alerts: 1,
    dtcCodes: 0,
    status: 'warning',
    mileage: 312456,
    vehicleType: 'Semi Truck',
    dtcDetails: [],
    services: [
      {
        type: 'Brake Inspection',
        dueDate: '2024-01-20',
        priority: 'high',
      },
    ],
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
    mileage: 198765,
    vehicleType: 'Semi Truck',
    dtcDetails: [
      {
        code: 'P0420',
        description: 'Catalyst System Efficiency Below Threshold',
        prediction: 'Predicted failure: 3-7 days',
        confidence: 92,
        action: 'Immediate inspection required',
      },
      {
        code: 'P0302',
        description: 'Cylinder 2 Misfire Detected',
        prediction: 'Predicted failure: 5-10 days',
        confidence: 75,
        action: 'Check ignition system',
      },
    ],
    services: [
      {
        type: 'Engine Service',
        dueDate: '2024-01-10',
        priority: 'high',
      },
    ],
  },
  // Add more vehicles to reach a realistic fleet size
  {
    id: '5',
    name: 'Kenworth T680 #201',
    licensePlate: 'TX-7821-KW',
    healthScore: 85,
    location: 'El Paso, TX',
    lastUpdated: '1 hour ago',
    dtcCodes: 0,
    alerts: 0,
    status: 'healthy',
    mileage: 156789,
    vehicleType: 'Semi Truck',
    dtcDetails: [],
    services: [],
  },
  {
    id: '6',
    name: 'Mack Anthem #301',
    licensePlate: 'TX-4523-MK',
    healthScore: 88,
    location: 'Fort Worth, TX',
    lastUpdated: '2 hours ago',
    dtcCodes: 0,
    alerts: 0,
    status: 'healthy',
    mileage: 134567,
    vehicleType: 'Semi Truck',
    dtcDetails: [],
    services: [],
  },
  {
    id: '7',
    name: 'Mack Anthem #106',
    licensePlate: 'TX-7890-MK',
    healthScore: 35,
    location: 'Houston, TX',
    lastUpdated: '1 hour ago',
    dtcCodes: 1,
    alerts: 1,
    status: 'critical',
    mileage: 298765,
    vehicleType: 'Semi Truck',
    dtcDetails: [
      {
        code: 'P0300',
        description: 'Engine Misfire Detected',
        prediction: 'Predicted failure: 1-3 days',
        confidence: 96,
        action: 'Immediate inspection required',
      },
    ],
    services: [],
  },
  { 
    id: '8',
    name: 'Peterbilt 579 #103',
    licensePlate: 'TX-9583-PB',
    healthScore: 78,
    location: 'Dallas, TX',
    lastUpdated: '12 min ago',
    dtcCodes: 1,
    alerts: 1,
    status: 'warning',
    mileage: 287432,
    vehicleType: 'Semi Truck',
    dtcDetails: [
      {
        code: 'P0420',
        description: 'Catalyst System Efficiency Below Threshold',
        prediction: 'Predicted failure: 14-21 days',
        confidence: 78,
        action: 'Inspect catalytic converter',
      },
    ],
    services: [
      {
        type: 'Transmission Service',
        dueDate: '2024-02-28',
        dueMileage: 295000,
        priority: 'medium',
      },
    ],
  },
  {
    id: '9',
    name: 'Volvo VNL 860 #105',
    licensePlate: 'TX-3892-VL',
    healthScore: 81,
    location: 'Austin, TX',
    lastUpdated: '3 min ago',
    dtcCodes: 1,
    alerts: 2,
    status: 'warning',
    mileage: 245123,
    vehicleType: 'Semi Truck',
    dtcDetails: [],
    services: [
      {
        type: 'Oil Change',
        dueDate: '2024-01-15',
        dueMileage: 250000,
        priority: 'high',
      },
    ],
  },
  {
    id: '10',
    name: 'Volvo #151',
    licensePlate: 'TX-1043-VO',
    healthScore: 58,
    location: 'San Antonio, TX',
    lastUpdated: '10 min ago',
    alerts: 1,
    dtcCodes: 0,
    status: 'warning',
    mileage: 312456,
    vehicleType: 'Semi Truck',
    dtcDetails: [],
    services: [
      {
        type: 'Brake Inspection',
        dueDate: '2024-01-20',
        priority: 'high',
      },
    ],
  },
  {
    id: '11',
    name: 'Freightliner Cascadia #102',
    licensePlate: 'TX-4521-FL',
    healthScore: 78,
    location: 'Houston, TX',
    lastUpdated: '5 min ago',
    dtcCodes: 2,
    alerts: 3,
    status: 'critical',
    mileage: 198765,
    vehicleType: 'Semi Truck',
    dtcDetails: [ ],
    services: [
      {
        type: 'Engine Service',
        dueDate: '2024-01-10',
        priority: 'high',
      },
    ],
  },
  // Add more vehicles to reach a realistic fleet size
  {
    id: '12',
    name: 'Kenworth T680 #202',
    licensePlate: 'TX-7821-KW',
    healthScore: 85,
    location: 'El Paso, TX',
    lastUpdated: '1 hour ago',
    dtcCodes: 0,
    alerts: 0,
    status: 'healthy',
    mileage: 156789,
    vehicleType: 'Semi Truck',
    dtcDetails: [],
    services: [],
  },
  {
    id: '13',
    name: 'Mack Anthem #302',
    licensePlate: 'TX-4523-MK',
    healthScore: 88,
    location: 'Fort Worth, TX',
    lastUpdated: '2 hours ago',
    dtcCodes: 0,
    alerts: 0,
    status: 'healthy',
    mileage: 134567,
    vehicleType: 'Semi Truck',
    dtcDetails: [],
    services: [],
  },
  {
    id: '14',
    name: 'Mack Anthem #107',
    licensePlate: 'TX-7890-MK',
    healthScore: 35,
    location: 'Houston, TX',
    lastUpdated: '1 hour ago',
    dtcCodes: 1,
    alerts: 1,
    status: 'critical',
    mileage: 298765,
    vehicleType: 'Semi Truck',
    dtcDetails: [
      {
        code: 'P0300',
        description: 'Engine Misfire Detected',
        prediction: 'Predicted failure: 1-3 days',
        confidence: 96,
        action: 'Immediate inspection required',
      },
    ],
    services: [],
  },
];


type NotificationType = 'Summary' | 'Urgent' | 'Offer' | 'Reminder';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  vehicles?: string[];
  actions?: {
  label: string;
    type: 'primary' | 'secondary';
    onClick?: () => void;
  }[];
  highlight?: string;
  isRead?: boolean;
};

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'Summary',
    title: 'Weekly Fleet Health Summary',
    description: '2 vehicles require immediate attention. 3 vehicles have upcoming maintenance. View detailed report.',
    time: '3 days ago',
    vehicles: ['VH-001', 'VH-006'],
    isRead: false,
  },
  {
    id: '2',
    type: 'Urgent',
    title: 'Critical Alert: Mack Anthem #106',
    description: 'Engine misfire detected with 96% confidence. Breakdown predicted within 1-3 days. Nearest Firestone station has availability today.',
    time: '3 days ago',
    vehicles: ['VH-006'],
    actions: [
      { label: 'View Vehicle', type: 'primary' },
      { label: 'Find Station', type: 'secondary' },
    ],
    isRead: false,
  },
  {
    id: '3',
    type: 'Offer',
    title: 'Exclusive Fleet Discount Available',
    description: '20% off brake service at Bridgestone Fleet Center. Valid for your fleet vehicles until Feb 20.',
    time: '5 days ago',
    highlight: '20% off - 20% off Brake Service',
    actions: [
      { label: 'Book Appointment', type: 'primary' },
    ],
    isRead: true,
  },
  {
    id: '4',
    type: 'Reminder',
    title: 'Service Reminder: Freightliner #101',
    description: 'Recommended service during upcoming weekend layover at Houston Terminal. Book now to avoid breakdown.',
    time: '7 days ago',
    vehicles: ['VH-001'],
    isRead: true,
  },
];

type VehicleDetailTab = 'Overview' | 'Predictive Alerts' | 'Tire Health' | 'Layover Analysis' | 'Nearby Stations';

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(STATIC_SUMMARY);
  const [activeTab, setActiveTab] = useState<NavTab>('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'warning' | 'critical'>('warning');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleDetailTab, setVehicleDetailTab] = useState<VehicleDetailTab>('Overview');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<NearbyStation | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const [appointmentTab, setAppointmentTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [stationSearchQuery, setStationSearchQuery] = useState('');
  const [stationSortBy, setStationSortBy] = useState<'Nearest First' | 'Rating' | 'Name'>('Nearest First');

  const appointments: Appointment[] = [
    {
      id: '1',
      vehicleId: '4',
      vehicleName: 'Freightliner Cascadia #101',
      status: 'Confirmed',
      location: 'Firestone Complete Auto Care - Downtown',
      date: '2024-02-03',
      time: '08:00 AM',
      services: ['Thermostat Replacement', 'Battery Check', 'Tire Inspection'],
      notes: 'Weekend service during layover',
      estimatedCost: 650,
    },
    {
      id: '2',
      vehicleId: '7',
      vehicleName: 'Mack Anthem #106',
      status: 'Pending',
      location: 'Bridgestone Fleet Center',
      date: '2024-01-30',
      time: '07:00 AM',
      services: ['Engine Diagnostics', 'Fuel System Check', 'Emergency Tire Replacement'],
      urgencyNote: 'URGENT - Critical condition',
      estimatedCost: 4200,
    },
    {
      id: '3',
      vehicleId: '2',
      vehicleName: 'Volvo VNL 860 #104',
      status: 'Confirmed',
      location: 'Firestone Commercial - Highway 59',
      date: '2024-02-10',
      time: '10:00 AM',
      services: ['Oil Change', 'Brake Inspection'],
      estimatedCost: 380,
    },
  ];

  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'Pending' || apt.status === 'Confirmed'
  );
  const pastAppointments: Appointment[] = [];

  const appointmentStats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'Pending').length,
    confirmed: appointments.filter(a => a.status === 'Confirmed').length,
    estimatedTotal: appointments.reduce((sum, apt) => sum + apt.estimatedCost, 0),
  };

  const serviceStations: NearbyStation[] = [
    {
      id: 'ss1',
      name: 'Firestone Complete Auto Care - Downtown',
      address: '1234 Main St, Houston, TX 77001',
      distance: 2.3,
      rating: 4.8,
      services: ['Tire Service', 'Oil Change', 'Brake Service', 'Engine Diagnostics', 'Fleet Service'],
      hours: 'Open Today 7AM-7PM',
      discount: '15%',
      specialOffer: {
        text: '15% off Fleet Services',
        validUntil: '2024-02-15',
      },
    },
    {
      id: 'ss2',
      name: 'Bridgestone Fleet Center',
      address: '5678 Industrial Blvd, Houston, TX 77002',
      distance: 4.1,
      rating: 4.9,
      services: ['All Tire Brands', 'Fleet Service', 'Preventive Maintenance', 'AC Service', 'Battery'],
      hours: 'Open 24/7',
      discount: '20%',
      specialOffer: {
        text: '20% off Fleet Services',
        validUntil: '2024-02-28',
      },
    },
    {
      id: 'ss3',
      name: 'Firestone Commercial - Highway 59',
      address: '9012 Highway 59, Houston, TX 77003',
      distance: 6.8,
      rating: 4.6,
      services: ['Tire Replacement', 'Alignment', 'Suspension', 'Fleet Accounts'],
      hours: 'Open Today 6AM-10PM',
    },
    {
      id: 'ss4',
      name: 'Bridgestone Tire & Service',
      address: '3456 Commerce Dr, Houston, TX 77004',
      distance: 8.2,
      rating: 4.7,
      services: ['All Tire Brands', 'Preventive Maintenance', 'AC Service', 'Battery'],
      hours: 'Open Today 8AM-6PM',
      discount: '10%',
      specialOffer: {
        text: 'Free Tire Rotation with Service',
        validUntil: '2024-02-28',
      },
    },
    {
      id: 'ss5',
      name: 'Firestone Express Service',
      address: '7890 Business Park Dr, Houston, TX 77005',
      distance: 5.5,
      rating: 4.5,
      services: ['Quick Service', 'Oil Change', 'Tire Service', 'Battery'],
      hours: 'Open Today 6AM-8PM',
      discount: '10%',
    },
  ];

  const filteredAndSortedStations = useMemo(() => {
    let filtered = serviceStations;
    
    if (stationSearchQuery) {
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(stationSearchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(stationSearchQuery.toLowerCase())
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
      if (stationSortBy === 'Nearest First') {
        return a.distance - b.distance;
      } else if (stationSortBy === 'Rating') {
        return b.rating - a.rating;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
    
    return sorted;
  }, [stationSearchQuery, stationSortBy]);

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

  // Calculate metrics from actual vehicle data
  const dashboardMetrics = useMemo(() => {
    const totalVehicles = FLEET_VEHICLES.length;
    const vehiclesRequiringAttention = FLEET_VEHICLES.filter(v => v.status === 'warning' || v.status === 'critical');
    const predictiveMaintenance = FLEET_VEHICLES.filter(v => v.healthScore < 70 || v.dtcCodes > 0);
    const tireHealthIssues = FLEET_VEHICLES.filter(v => v.status === 'warning' && v.healthScore < 65);
    const healthyVehicles = FLEET_VEHICLES.filter(v => v.status === 'healthy' || (v.healthScore >= 70 && v.dtcCodes === 0 && v.alerts === 0));
    
    return {
      totalVehicles,
      vehiclesRequiringAttention: vehiclesRequiringAttention.length,
      predictiveMaintenance: predictiveMaintenance.length,
      tireHealthIssues: tireHealthIssues.length,
      healthyVehicles: healthyVehicles.length,
    };
  }, []);

  const donutData = useMemo(() => {
    const healthy = dashboardMetrics.healthyVehicles;
    const predictive = dashboardMetrics.predictiveMaintenance;
    const tireHealth = dashboardMetrics.tireHealthIssues;
    return [
      { name: 'Healthy', value: healthy },
      { name: 'Predictive Maintenance', value: predictive },
      { name: 'Tire Health Issues', value: tireHealth },
    ];
  }, [dashboardMetrics]);

  const filteredVehicles = useMemo(() => {
    let filtered = FLEET_VEHICLES;
    
    if (searchQuery) {
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterStatus === 'warning') {
      // Show both warning and critical vehicles when filter is 'warning'
      filtered = filtered.filter((v) => v.status === 'warning' || v.status === 'critical');
    } else if (filterStatus === 'critical') {
      filtered = filtered.filter((v) => v.status === 'critical');
    }
    // If 'all', show all vehicles
    
    return filtered;
  }, [searchQuery, filterStatus]);

  const handleNavigateToFleetVehicles = (filterType?: 'all' | 'warning' | 'critical') => {
    setActiveTab('Fleet Vehicles');
    if (filterType) {
      setFilterStatus(filterType);
      setSearchQuery(''); // Clear search when navigating
    }
  };

  const serviceOptions: ServiceOption[] = [
    { id: '1', name: 'Oil Change', price: 89 },
    { id: '2', name: 'Brake Inspection', price: 49 },
    { id: '3', name: 'Tire Rotation', price: 35 },
    { id: '4', name: 'Tire Replacement', price: 150 },
    { id: '5', name: 'Engine Diagnostics', price: 125 },
    { id: '6', name: 'Transmission Service', price: 195 },
    { id: '7', name: 'Coolant Flush', price: 119 },
    { id: '8', name: 'DOT Inspection', price: 75 },
  ];

  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM',
  ];

  const handleBookNow = (station: NearbyStation) => {
    setSelectedStation(station);
    setShowBookingModal(true);
    setSelectedService('');
    setPreferredDate('');
    setPreferredTime('');
    setAdditionalNotes('');
  };

  const handleConfirmBooking = () => {
    // Handle booking confirmation logic here
    console.log('Booking confirmed:', {
      vehicle: selectedVehicle,
      station: selectedStation,
      service: selectedService,
      date: preferredDate,
      time: preferredTime,
      notes: additionalNotes,
    });
    setShowBookingModal(false);
    setSelectedStation(null);
  };

  const getNearbyStations = (location: string): NearbyStation[] => {
    // Return different stations based on vehicle location
    if (location.includes('Houston')) {
      return [
        {
          id: '1',
          name: 'Firestone Commercial - Highway 59',
          address: '9012 Highway 59, Houston, TX 77003',
          distance: 6.8,
          rating: 4.6,
          services: ['Tire Replacement', 'Alignment', 'Suspension', 'Fleet Accounts'],
          hours: 'Open Today 6AM-10PM',
        },
        {
          id: '2',
          name: 'Bridgestone Tire & Service',
          address: '3456 Commerce Dr, Houston, TX 77004',
          distance: 8.2,
          rating: 4.7,
          services: ['All Tire Brands', 'Preventive Maintenance', 'AC Service', 'Battery'],
          hours: 'Open Today 8AM-6PM',
          discount: '10%',
          specialOffer: {
            text: 'Free Tire Rotation with Service',
            validUntil: '2024-02-28',
          },
        },
      ];
    } else if (location.includes('Dallas')) {
      return [
        {
          id: '3',
          name: 'Bridgestone Service Center - Dallas',
          address: '123 Main St, Dallas, TX 75201',
          distance: 2.3,
          rating: 4.8,
          services: ['Tire Service', 'Brake Service', 'Oil Change', 'Fleet Accounts'],
          hours: 'Open Today 7AM-8PM',
        },
        {
          id: '4',
          name: 'Firestone Complete Auto Care',
          address: '456 Oak Ave, Dallas, TX 75202',
          distance: 5.7,
          rating: 4.5,
          services: ['All Services', 'Tire Replacement', 'Alignment', 'Battery'],
          hours: 'Open Today 6AM-10PM',
          discount: '15%',
        },
      ];
    } else {
      // Default stations for other locations
      return [
        {
          id: '5',
          name: 'Bridgestone Service Center',
          address: '789 Service Rd, ' + location,
          distance: 3.5,
          rating: 4.7,
          services: ['Tire Service', 'Maintenance', 'Fleet Accounts'],
          hours: 'Open Today 8AM-6PM',
        },
      ];
    }
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
                  {/* <span className="status-icon">⚡</span> */}
                
                </span>
                <span className="last-updated">Last updated: Just now</span>
                </div>
              </div>

            <div className="metrics-row">
              <div className="metric-card" onClick={(e) => {
                e.stopPropagation();
                handleNavigateToFleetVehicles();
              }} style={{ cursor: 'pointer' }}>
                <div className="metric-content">
                      <div>
                    <p className="metric-label">Total Fleet</p>
                    <p className="metric-value">{dashboardMetrics.totalVehicles}</p>
                    <p className="metric-sub">Avg Health: {summary?.fleetHealthScore ?? 82}%</p>
                      </div>
                  <div className="metric-icon">🚛🚛</div>
                </div>
              </div>

              <div className="metric-card predictive" onClick={(e) => {
                e.stopPropagation();
                handleNavigateToFleetVehicles('warning');
              }} style={{ cursor: 'pointer' }}>
                <div className="metric-content">
                      <div>
                    <p className="metric-label">Predictive Maintenance</p>
                    <p className="metric-value">{dashboardMetrics.predictiveMaintenance}</p>
                    <p className="metric-sub">AI predicted issues</p>
                      </div>
                  <div className="metric-icon warning">⚠️</div>
              </div>
              </div>

              <div className="metric-card tire-health" onClick={(e) => {
                e.stopPropagation();
                handleNavigateToFleetVehicles('warning');
              }} style={{ cursor: 'pointer' }}>
                <div className="metric-content">
                <div>
                    <p className="metric-label">Tire Health</p>
                    <p className="metric-value">{dashboardMetrics.tireHealthIssues}</p>
                    <p className="metric-sub">Requires attention</p>
                </div>
                  <div className="metric-icon critical">🔴</div>
              </div>
              </div>

              <div className="metric-card services" onClick={(e) => {
                e.stopPropagation();
                handleNavigateToFleetVehicles();
              }} style={{ cursor: 'pointer' }}>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToFleetVehicles('all');
                          }}
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
              <div className="panel vehicles-panel" onClick={(e) => {
                e.stopPropagation();
                handleNavigateToFleetVehicles('warning');
              }} style={{ cursor: 'pointer' }}>
                <div className="panel-header">
                  <h3 className="panel-title">
                    <span className="panel-icon">▲</span>
                    Vehicles Requiring Attention
                  </h3>
                  <button className="view-all-btn" onClick={(e) => { e.stopPropagation(); handleNavigateToFleetVehicles('warning'); }}>
                    View All
                  </button>
            </div>
                <div className="vehicles-list">
                  {FLEET_VEHICLES.filter(v => v.status === 'warning' || v.status === 'critical')
                    .slice(0, 3)
                    .map((vehicle) => (
                    <div 
                      key={vehicle.id} 
                      className="vehicle-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicle(vehicle);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="vehicle-icon">🚛</span>
                      <div className="vehicle-info">
                        <div className="vehicle-name">{vehicle.name}</div>
                        <div className="vehicle-location">{vehicle.location}</div>
                  </div>
                      <span className={`status-badge ${vehicle.status}`}>
                        {vehicle.status === 'critical' ? 'Critical' : 'Warning'}
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
                      <div className="notification-summary">{notification.description}</div>
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
              <div className="fleet-vehicles-stats">
                <span className="vehicles-count">
                  {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} 
                  {filterStatus === 'warning' && ' (Warning/Critical)'}
                  {filterStatus === 'critical' && ' (Critical)'}
                  {filterStatus === 'all' && ' (All)'}
                </span>
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
                <div key={vehicle.id} className="vehicle-card" onClick={() => setSelectedVehicle(vehicle)} style={{ cursor: 'pointer' }}>
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

        {activeTab === 'Notifications' && (
          <div className="notifications-page">
            <div className="notifications-header">
                <div>
                <h1 className="notifications-title">Notifications</h1>
                <p className="notifications-subtitle">
                  {notifications.filter(n => !n.isRead).length} unread notifications
                  </p>
                </div>
              <button
                className="mark-all-read-btn"
                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
              >
                <span className="checkmark-icon">✓</span>
                Mark all as read
              </button>
            </div>

            <div className="notifications-list">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
                >
                  <div className="notification-icon-wrapper">
                    <div className={`notification-icon ${notification.type.toLowerCase()}`}>
                      {notification.type === 'Summary' && '📄'}
                      {notification.type === 'Urgent' && '⚠️'}
                      {notification.type === 'Offer' && '🎁'}
                      {notification.type === 'Reminder' && '📅'}
                </div>
              </div>
                  
                  <div className="notification-content">
                    <div className="notification-header-row">
                      <span className={`notification-type-badge ${notification.type.toLowerCase()}`}>
                        {notification.type}
                        {!notification.isRead && <span className="unread-dot"></span>}
                      </span>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    
                    <h3 className="notification-title">{notification.title}</h3>
                    <p className="notification-description">{notification.description}</p>
                    
                    {notification.vehicles && (
                      <div className="notification-vehicles">
                        Vehicles: {notification.vehicles.join(', ')}
                      </div>
                    )}
                    
                    {notification.highlight && (
                      <div className="notification-highlight">
                        {notification.highlight}
                </div>
                    )}
                    
                    {notification.actions && (
                      <div className="notification-actions">
                        {notification.actions.map((action, index) => (
              <button
                            key={index}
                            className={`notification-action-btn ${action.type}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (action.label === 'Book Appointment') {
                                // Find a station for booking - use Bridgestone for the offer
                                const vehicle = FLEET_VEHICLES.find(v => v.id === '1') || FLEET_VEHICLES[0];
                                const stations = getNearbyStations(vehicle.location);
                                const station = stations.find(s => s.name.includes('Bridgestone')) || stations[0];
                                if (station && vehicle) {
                                  setSelectedVehicle(vehicle);
                                  handleBookNow(station);
                                }
                              } else if (action.label === 'View Vehicle') {
                                const vehicle = FLEET_VEHICLES.find(v => v.name.includes('Mack Anthem #106')) || FLEET_VEHICLES.find(v => v.name.includes('Mack Anthem')) || FLEET_VEHICLES[0];
                                if (vehicle) {
                                  setSelectedVehicle(vehicle);
                                  setActiveTab('Fleet Vehicles');
                                }
                              } else if (action.label === 'Find Station') {
                                const vehicle = FLEET_VEHICLES.find(v => v.name.includes('Mack Anthem #106')) || FLEET_VEHICLES.find(v => v.name.includes('Mack Anthem')) || FLEET_VEHICLES[0];
                                if (vehicle) {
                                  setSelectedVehicle(vehicle);
                                  setVehicleDetailTab('Nearby Stations');
                                  setActiveTab('Fleet Vehicles');
                                }
                              }
                            }}
                          >
                            {action.label}
              </button>
                        ))}
                </div>
                    )}
            </div>

                  <div className="notification-arrow">→</div>
            </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Appointments' && (
          <div className="appointments-page">
            <div className="appointments-header">
              <div>
                <h1 className="appointments-title">Appointments</h1>
                <p className="appointments-subtitle">Manage your service appointments</p>
              </div>
              <button className="new-appointment-btn" onClick={() => {
                // Open booking modal - you can customize this
                const vehicle = FLEET_VEHICLES[0];
                const station = getNearbyStations(vehicle.location)[0];
                if (station) {
                  setSelectedVehicle(vehicle);
                  handleBookNow(station);
                }
              }}>
                <span className="plus-icon">+</span>
                New Appointment
              </button>
            </div>

            {/* Summary Cards */}
            <div className="appointment-stats-row">
              <div className="appointment-stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-label">Total</div>
                  <div className="stat-value">{appointmentStats.total}</div>
                </div>
              </div>
              <div className="appointment-stat-card">
                <div className="stat-icon warning">⚠️</div>
                <div className="stat-content">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value">{appointmentStats.pending}</div>
                </div>
              </div>
              <div className="appointment-stat-card">
                <div className="stat-icon success">✓</div>
                <div className="stat-content">
                  <div className="stat-label">Confirmed</div>
                  <div className="stat-value">{appointmentStats.confirmed}</div>
                </div>
              </div>
              <div className="appointment-stat-card">
                <div className="stat-icon">$</div>
                <div className="stat-content">
                  <div className="stat-label">Est. Total</div>
                  <div className="stat-value">${appointmentStats.estimatedTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="appointment-tabs">
              <button
                className={`appointment-tab ${appointmentTab === 'Upcoming' ? 'active' : ''}`}
                onClick={() => setAppointmentTab('Upcoming')}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
              <button
                className={`appointment-tab ${appointmentTab === 'Past' ? 'active' : ''}`}
                onClick={() => setAppointmentTab('Past')}
              >
                Past ({pastAppointments.length})
              </button>
            </div>

            {/* Appointment Cards */}
            <div className="appointments-list">
              {(appointmentTab === 'Upcoming' ? upcomingAppointments : pastAppointments).map((appointment) => (
                <div key={appointment.id} className="appointment-card">
                  <div className="appointment-card-header">
                    <span className={`appointment-status-badge ${appointment.status.toLowerCase()}`}>
                      {appointment.status === 'Confirmed' && '✓ '}
                      {appointment.status === 'Pending' && '⚠️ '}
                      {appointment.status}
                    </span>
                    <div className="appointment-cost">
                      <div className="cost-value">${appointment.estimatedCost.toLocaleString()}</div>
                      <div className="cost-label">Estimated</div>
              </div>
            </div>

                  <div className="appointment-card-body">
                    <h3 className="appointment-vehicle-name">{appointment.vehicleName}</h3>
                    
                    <div className="appointment-details">
                      <div className="appointment-detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{appointment.location}</span>
                      </div>
                      <div className="appointment-detail-item">
                        <span className="detail-icon">📅</span>
                        <span>{appointment.date}</span>
                      </div>
                      <div className="appointment-detail-item">
                        <span className="detail-icon">🕐</span>
                        <span>{appointment.time}</span>
                      </div>
                    </div>

                    <div className="appointment-services">
                      {appointment.services.map((service, index) => (
                        <span key={index} className="service-tag">{service}</span>
                      ))}
                </div>

                    {appointment.notes && (
                      <div className="appointment-notes">
                        {appointment.notes}
                      </div>
                    )}

                    {appointment.urgencyNote && (
                      <div className="appointment-urgency">
                        {appointment.urgencyNote}
                      </div>
                    )}

                    <div className="appointment-actions">
                      {appointment.status === 'Pending' && (
                        <>
                          <button className="appointment-action-btn primary" onClick={() => {
                            // Handle confirm
                            console.log('Confirm appointment:', appointment.id);
                          }}>
                            Confirm
                  </button>
                          <button className="appointment-action-btn secondary" onClick={() => {
                            // Handle decline
                            console.log('Decline appointment:', appointment.id);
                          }}>
                            Decline
                  </button>
                        </>
                      )}
                      <button className="appointment-action-btn secondary" onClick={() => {
                        // Handle reschedule
                        const vehicle = FLEET_VEHICLES.find(v => v.id === appointment.vehicleId);
                        const station = getNearbyStations(vehicle?.location || '')[0];
                        if (vehicle && station) {
                          setSelectedVehicle(vehicle);
                          handleBookNow(station);
                        }
                      }}>
                        Reschedule
                  </button>
                      {appointment.status === 'Confirmed' && (
                        <button className="appointment-action-btn secondary" onClick={() => {
                          // Handle cancel
                          console.log('Cancel appointment:', appointment.id);
                        }}>
                          Cancel
                        </button>
                      )}
                </div>
              </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Service Stations' && (
          <div className="service-stations-page">
            <div className="service-stations-header">
              <div>
                <h1 className="service-stations-title">Service Stations</h1>
                <p className="service-stations-subtitle">Find Firestone & Bridgestone locations near your fleet</p>
                </div>
            </div>

            <div className="service-stations-controls">
              <div className="station-search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="station-search-input"
                  placeholder="Search stations..."
                  value={stationSearchQuery}
                  onChange={(e) => setStationSearchQuery(e.target.value)}
                />
              </div>
              <div className="station-filter-container">
                  <button
                  className="station-filter-btn"
                    onClick={() => {
                    const options: ('Nearest First' | 'Rating' | 'Name')[] = ['Nearest First', 'Rating', 'Name'];
                    const currentIndex = options.indexOf(stationSortBy);
                    setStationSortBy(options[(currentIndex + 1) % options.length]);
                    }}
                  >
                  <span className="filter-icon">🔽</span>
                  {stationSortBy}
                  </button>
                </div>
              </div>

            <div className="stations-map-placeholder">
              <div className="map-pin-large">📍</div>
              <div className="map-placeholder-text">Interactive Map</div>
              <div className="map-stations-count">Showing {filteredAndSortedStations.length} stations</div>
            </div>

            <div className="service-stations-list">
              {filteredAndSortedStations.map((station) => (
                <div key={station.id} className="service-station-card">
                  <div className="station-card-left">
                    <div className="station-card-header">
                      <h3 className="station-card-name">{station.name}</h3>
                      {station.discount && (
                        <span className="station-discount-badge-large">{station.discount} OFF</span>
                      )}
              </div>
                    
                    <div className="station-card-details">
                      <div className="station-detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{station.address}</span>
              </div>
                      <div className="station-detail-item">
                        <span className="detail-icon">🕐</span>
                        <span>{station.hours}</span>
                      </div>
                    </div>

                    <div className="station-services-list">
                      {station.services.map((service, index) => (
                        <span key={index} className="service-tag">{service}</span>
                      ))}
                    </div>

                    {station.specialOffer && (
                      <div className="station-promotion-box">
                        <div className="promotion-text">{station.specialOffer.text}</div>
                        <div className="promotion-valid">Valid until {station.specialOffer.validUntil}</div>
                      </div>
                    )}
                  </div>

                  <div className="station-card-right">
                    <div className="station-distance-large">{station.distance} mi</div>
                    <div className="station-rating-large">
                      <span className="star-icon">⭐</span>
                      {station.rating}
                    </div>
                    <div className="station-actions-column">
                      <button className="station-action-btn call-btn">
                        <span className="action-icon">📞</span>
                        Call
                      </button>
                      <button className="station-action-btn directions-btn-station">
                        <span className="action-icon">✈️</span>
                        Directions
                      </button>
                <button
                        className="station-action-btn book-service-btn"
                        onClick={() => {
                          const vehicle = FLEET_VEHICLES[0];
                          setSelectedVehicle(vehicle);
                          handleBookNow(station);
                        }}
                      >
                        Book Service
                </button>
              </div>
            </div>
                </div>
              ))}
            </div>
          </div>
        )}

       
      </main>

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <div className="vehicle-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="vehicle-detail-header">
              <div className="vehicle-detail-title">
                <div className="vehicle-icon-large">🚛</div>
                <div>
                  <h2 className="vehicle-detail-name">{selectedVehicle.name}</h2>
                  <div className="vehicle-detail-meta">
                    <span>{selectedVehicle.licensePlate}</span>
                    {selectedVehicle.vehicleType && (
                      <>
                        <span className="bullet">•</span>
                        <span>{selectedVehicle.vehicleType}</span>
                      </>
                    )}
              </div>
                </div>
              </div>
              <div className="vehicle-health-score-display">
                <div className="health-score-label-header">Health Score</div>
                <div className="health-score-value-large">
                  {selectedVehicle.healthScore}%
                  <button className="close-btn" onClick={() => setSelectedVehicle(null)}>✕</button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="vehicle-detail-tabs">
              {(['Overview', 'Predictive Alerts', 'Tire Health', 'Layover Analysis', 'Nearby Stations'] as VehicleDetailTab[]).map((tab) => (
                <button
                  key={tab}
                  className={`vehicle-detail-tab ${vehicleDetailTab === tab ? 'active' : ''}`}
                  onClick={() => setVehicleDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="vehicle-detail-content">
              {vehicleDetailTab === 'Overview' && (
                <div className="overview-content">
                  {/* Key Metrics */}
                  <div className="key-metrics-row">
                    <div className="key-metric-card">
                      <div className="key-metric-label">Mileage</div>
                      <div className="key-metric-value">
                        {selectedVehicle.mileage ? `${selectedVehicle.mileage.toLocaleString()} mi` : 'N/A'}
                      </div>
                    </div>
                    <div className="key-metric-card">
                      <div className="key-metric-label">Location</div>
                      <div className="key-metric-value">{selectedVehicle.location}</div>
                    </div>
                    <div className="key-metric-card">
                      <div className="key-metric-label">DTC Codes</div>
                      <div className="key-metric-value">{selectedVehicle.dtcCodes}</div>
                    </div>
                    <div className="key-metric-card">
                      <div className="key-metric-label">Last Update</div>
                      <div className="key-metric-value">{selectedVehicle.lastUpdated}</div>
              </div>
            </div>

                  {/* Active DTC Codes */}
                  {selectedVehicle.dtcDetails && selectedVehicle.dtcDetails.length > 0 && (
                    <div className="detail-section">
                      <div className="detail-section-header">
                        <span className="section-icon">⚠️</span>
                        <h3 className="detail-section-title">Active DTC Codes</h3>
              </div>
                      <div className="detail-section-content">
                        {selectedVehicle.dtcDetails.map((dtc, index) => (
                          <div key={index} className="dtc-card">
                            <div className="dtc-header">
                              <span className="dtc-code-badge">{dtc.code}</span>
                              <span className="dtc-confidence">{dtc.confidence}% confidence</span>
                        </div>
                            <div className="dtc-description">{dtc.description}</div>
                            <div className="dtc-prediction">{dtc.prediction}</div>
                            <div className="dtc-action">
                              <span className="action-icon">→</span>
                              <span className="action-text">{dtc.action}</span>
              </div>
            </div>
                          ))}
                        </div>
                    </div>
                  )}

                  {/* Upcoming Services */}
                  {selectedVehicle.services && selectedVehicle.services.length > 0 && (
                    <div className="detail-section">
                      <div className="detail-section-header">
                        <span className="section-icon">📅</span>
                        <h3 className="detail-section-title">Upcoming Services</h3>
              </div>
                      <div className="detail-section-content">
                        {selectedVehicle.services.map((service, index) => (
                          <div key={index} className="service-card">
                            <div className="service-info">
                              <div className="service-type">{service.type}</div>
                              <div className="service-due">
                                Due: {service.dueDate}
                                {service.dueMileage && ` or ${service.dueMileage.toLocaleString()} mi`}
                        </div>
                            </div>
                            <span className={`service-priority-badge ${service.priority}`}>
                              {service.priority}
                            </span>
                        </div>
                        ))}
                      </div>
                    </div>
                  )}
                        </div>
              )}

              {vehicleDetailTab === 'Predictive Alerts' && (
                <div className="tab-content-placeholder">
                  <h3>Predictive Alerts</h3>
                  <p>AI-powered predictive maintenance alerts will be displayed here.</p>
                  {selectedVehicle.dtcDetails && selectedVehicle.dtcDetails.length > 0 && (
                    <div className="alerts-list">
                      {selectedVehicle.dtcDetails.map((dtc, index) => (
                        <div key={index} className="alert-item">
                          <div className="alert-code">{dtc.code}</div>
                          <div className="alert-description">{dtc.description}</div>
                          <div className="alert-prediction">{dtc.prediction}</div>
                        </div>
                      ))}
                    </div>
                )}
              </div>
              )}

              {vehicleDetailTab === 'Tire Health' && (
                <div className="tab-content-placeholder">
                  <h3>Tire Health</h3>
                  <p>Tire health monitoring data will be displayed here.</p>
                  <div className="tire-health-grid">
                    <div className="tire-position">
                      <div className="tire-label">Front Left</div>
                      <div className="tire-status healthy">Good</div>
            </div>
                    <div className="tire-position">
                      <div className="tire-label">Front Right</div>
                      <div className="tire-status healthy">Good</div>
                    </div>
                    <div className="tire-position">
                      <div className="tire-label">Rear Left</div>
                      <div className="tire-status warning">Monitor</div>
                    </div>
                    <div className="tire-position">
                      <div className="tire-label">Rear Right</div>
                      <div className="tire-status healthy">Good</div>
                    </div>
                  </div>
                </div>
              )}

              {vehicleDetailTab === 'Layover Analysis' && (
                <div className="tab-content-placeholder">
                  <h3>Layover Analysis</h3>
                  <p>Layover and rest period analysis will be displayed here.</p>
                  <div className="layover-stats">
                    <div className="stat-item">
                      <div className="stat-label">Average Layover Time</div>
                      <div className="stat-value">4.2 hours</div>
            </div>
                    <div className="stat-item">
                      <div className="stat-label">Total Layovers (30 days)</div>
                      <div className="stat-value">12</div>
                  </div>
                  </div>
                </div>
              )}

              {vehicleDetailTab === 'Nearby Stations' && (
                <div className="nearby-stations-content">
                  <h3 className="nearby-stations-title">Nearby Service Stations</h3>
                  <div className="stations-list">
                    {getNearbyStations(selectedVehicle.location).map((station) => (
                      <div key={station.id} className="station-card">
                        <div className="station-card-header">
                          <div className="station-name-section">
                            <h4 className="station-name">{station.name}</h4>
                            {station.discount && (
                              <span className="station-discount-badge">{station.discount} OFF</span>
                            )}
                          </div>
                          <div className="station-distance-rating">
                            <span className="station-distance">{station.distance} mi</span>
                            <span className="station-rating">
                              <span className="star-icon">⭐</span>
                              {station.rating}
                    </span>
                  </div>
                        </div>
                        <div className="station-address">
                          <span className="location-icon">📍</span>
                          {station.address}
                        </div>
                        <div className="station-services">
                          {station.services.map((service, index) => (
                            <span key={index} className="service-tag">{service}</span>
              ))}
            </div>
                        {station.specialOffer && (
                          <div className="station-special-offer">
                            <div className="special-offer-text">{station.specialOffer.text}</div>
                            <div className="special-offer-valid">Valid until {station.specialOffer.validUntil}</div>
                          </div>
                        )}
                        <div className="station-hours">{station.hours}</div>
                        <div className="station-actions">
                          <button className="directions-btn">
                            <span className="directions-icon">✈️</span>
                            Directions
                          </button>
                          <button className="book-now-btn" onClick={() => handleBookNow(station)}>Book Now</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedVehicle && selectedStation && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <div>
                <h2 className="booking-modal-title">Book Service Appointment</h2>
                <p className="booking-modal-subtitle">Schedule maintenance during vehicle layover</p>
              </div>
              <button className="close-btn" onClick={() => setShowBookingModal(false)}>✕</button>
            </div>

            <div className="booking-modal-content">
              {/* Vehicle and Station Selection */}
              <div className="booking-selection-cards">
                <div className="booking-selection-card">
                  <div className="booking-card-icon vehicle-icon-bg">🚛</div>
                  <div className="booking-card-info">
                    <div className="booking-card-title">{selectedVehicle.name}</div>
                    <div className="booking-card-subtitle">{selectedVehicle.licensePlate}</div>
                  </div>
                </div>
                <div className="booking-selection-card">
                  <div className="booking-card-icon station-icon-bg">📍</div>
                  <div className="booking-card-info">
                    <div className="booking-card-title">{selectedStation.name}</div>
                    <div className="booking-card-subtitle">{selectedStation.distance} mi away</div>
                  </div>
                </div>
              </div>

              {/* Select Services */}
              <div className="booking-section">
                <h3 className="booking-section-title">Select Services</h3>
                <div className="services-grid">
                  {serviceOptions.map((service) => (
                    <label key={service.id} className="service-option">
                      <input
                        type="radio"
                        name="service"
                        value={service.id}
                        checked={selectedService === service.id}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="service-radio"
                      />
                      <div className="service-option-content">
                        <span className="service-name">{service.name}</span>
                        <span className="service-price">${service.price}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Date and Time */}
              <div className="booking-section">
                <div className="booking-form-row">
                  <div className="booking-form-group">
                    <label className="booking-form-label">Preferred Date</label>
                    <div className="booking-input-wrapper">
                      <input
                        type="text"
                        className="booking-input"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        placeholder="dd/mm/yyyy"
                        onFocus={(e) => e.target.type = 'date'}
                        onBlur={(e) => {
                          if (!e.target.value) {
                            e.target.type = 'text';
                          }
                        }}
                      />
                      <span className="booking-input-icon">📅</span>
                    </div>
                  </div>
                  <div className="booking-form-group">
                    <label className="booking-form-label">Preferred Time</label>
                    <div className="booking-input-wrapper">
                      <select
                        className="booking-input"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                      >
                        <option value="">Select time</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <span className="booking-input-icon">🔽</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="booking-section">
                <label className="booking-form-label">Additional Notes</label>
                <textarea
                  className="booking-textarea"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any special instructions or concerns..."
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="booking-modal-actions">
                <button className="booking-cancel-btn" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button className="booking-confirm-btn" onClick={handleConfirmBooking}>
                  <span className="confirm-icon">✓</span>
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
