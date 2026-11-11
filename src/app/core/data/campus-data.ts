import { CampusLocation, Bicycle, User, MaintenanceReport, ServiceAnnouncement, Trip, QueueEntry, DesignatedZone } from '../models/models';

/**
 * NEUST Sumacab Campus Locations
 * Coordinates map to:
 * - (x, y): percentage position on the NEUST campus map image (0-100%)
 * - (lat, lng): actual real-world GPS coordinates around NEUST Sumacab Campus, Cabanatuan City (15.4593° N, 120.9576° E)
 */
export const INITIAL_CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'loc-gate',
    code: 'GATE',
    name: 'NEUST Gate & Trike Bike Terminal',
    buildingNumber: 'Terminal',
    category: 'gate',
    coordinates: { x: 75.0, y: 82.0, lat: 15.444889, lng: 120.940417 },
    isPickupActive: true,
    waitingCount: 8,
    description: 'Official NEUST Sumacab Trike Bike Pilahan terminal at 15°26\'41.6"N 120°56\'25.5"E.',
    icon: 'enter-outline'
  },
  {
    id: 'loc-cict',
    code: 'CICT',
    name: 'College of Information & Communications Tech',
    buildingNumber: 'Bldg 25',
    category: 'academic',
    coordinates: { x: 64.0, y: 28.0, lat: 15.449353, lng: 120.940410 },
    isPickupActive: true,
    waitingCount: 12,
    description: 'College of Information and Communications Technology (CICT) Building, beside Physical Education & Gym.',
    icon: 'laptop-outline'
  },
  {
    id: 'loc-eng',
    code: 'ENG',
    name: 'College of Engineering',
    buildingNumber: 'COE',
    category: 'academic',
    coordinates: { x: 68.0, y: 48.0, lat: 15.446990, lng: 120.940490 },
    isPickupActive: true,
    waitingCount: 5,
    description: 'College of Engineering building, labs, and workshops along Narra Ave.',
    icon: 'construct-outline'
  },
  {
    id: 'loc-gym',
    code: 'GYM',
    name: 'NEUST Gymnasium / NEUST Gym',
    buildingNumber: 'Gym',
    category: 'recreation',
    coordinates: { x: 72.0, y: 32.0, lat: 15.448650, lng: 120.941100 },
    isPickupActive: true,
    waitingCount: 6,
    description: 'NEUST University Gymnasium and sports arena along Malunggay Ave.',
    icon: 'fitness-outline'
  },
  {
    id: 'loc-pool',
    code: 'POOL',
    name: 'NEUST Swimming Pool',
    buildingNumber: 'Aquatics',
    category: 'recreation',
    coordinates: { x: 78.0, y: 35.0, lat: 15.448300, lng: 120.941630 },
    isPickupActive: true,
    waitingCount: 3,
    description: 'Olympic-size university swimming pool and aquatic sports facility.',
    icon: 'water-outline'
  },
  {
    id: 'loc-museum',
    code: 'MUS',
    name: 'University Museum',
    buildingNumber: 'Museum',
    category: 'services',
    coordinates: { x: 58.0, y: 68.0, lat: 15.445240, lng: 120.939610 },
    isPickupActive: true,
    waitingCount: 2,
    description: 'NEUST Heritage Museum, cultural archives, and gallery along Pili Ave.',
    icon: 'color-palette-outline'
  },
  {
    id: 'loc-arch',
    code: 'ARCH',
    name: 'College of Architecture (Gilid ng Arki)',
    buildingNumber: 'CoA',
    category: 'academic',
    coordinates: { x: 55.0, y: 55.0, lat: 15.446868, lng: 120.939533 },
    isPickupActive: true,
    waitingCount: 4,
    description: 'College of Architecture design studios, drafting halls, and pedicab terminal pilahan sa gilid ng Arki.',
    icon: 'shapes-outline'
  },
  {
    id: 'loc-ced',
    code: 'CED',
    name: 'College of Education',
    buildingNumber: 'CoEd',
    category: 'academic',
    coordinates: { x: 48.0, y: 45.0, lat: 15.447290, lng: 120.938630 },
    isPickupActive: true,
    waitingCount: 6,
    description: 'College of Education teacher training classrooms and lecture halls.',
    icon: 'school-outline'
  },
  {
    id: 'loc-crim',
    code: 'CRIM',
    name: 'College of Criminology',
    buildingNumber: 'CoC',
    category: 'academic',
    coordinates: { x: 40.0, y: 28.0, lat: 15.448880, lng: 120.938170 },
    isPickupActive: true,
    waitingCount: 4,
    description: 'College of Criminology classrooms, drill grounds, and forensics laboratories.',
    icon: 'shield-outline'
  },
  {
    id: 'loc-grandstand',
    code: 'GRD',
    name: 'NEUST Grandstand & Athletic Field',
    buildingNumber: 'Oval',
    category: 'recreation',
    coordinates: { x: 50.0, y: 22.0, lat: 15.449350, lng: 120.939350 },
    isPickupActive: true,
    waitingCount: 2,
    description: 'NEUST Athletic Field, main grandstand stage, and running track.',
    icon: 'trophy-outline'
  },
  {
    id: 'loc-admin',
    code: 'ADM',
    name: 'NEUST Administration Building',
    buildingNumber: 'Bldg 1',
    category: 'administrative',
    coordinates: { x: 55.0, y: 56.0, lat: 15.4462, lng: 120.9392 },
    isPickupActive: true,
    waitingCount: 4,
    description: 'Central Administrative Offices, University President, Cashier, and Registrar at Pili Ave.',
    icon: 'business-outline'
  },
  {
    id: 'loc-cmbt',
    code: 'CMBT',
    name: 'College of Management & Business Tech',
    buildingNumber: 'Bldg 8',
    category: 'academic',
    coordinates: { x: 52.0, y: 65.0, lat: 15.445500, lng: 120.939200 },
    isPickupActive: true,
    waitingCount: 6,
    description: 'Management, Accountancy, and Hospitality classrooms along Pili Ave & Narra Ave.',
    icon: 'briefcase-outline'
  },
  {
    id: 'loc-lib',
    code: 'LIB',
    name: 'University Library',
    buildingNumber: 'Bldg 6',
    category: 'academic',
    coordinates: { x: 58.0, y: 50.0, lat: 15.4466, lng: 120.9395 },
    isPickupActive: true,
    waitingCount: 3,
    description: 'Central Learning Resource Center along Narra Ave.',
    icon: 'book-outline'
  },
  {
    id: 'loc-plaza',
    code: 'PLZ',
    name: 'University Plaza & Quadrangle',
    buildingNumber: 'Plaza',
    category: 'recreation',
    coordinates: { x: 70.0, y: 70.0, lat: 15.4450, lng: 120.9405 },
    isPickupActive: true,
    waitingCount: 4,
    description: 'Central university gathering area and student benches along Banaba St.',
    icon: 'people-outline'
  },
  {
    id: 'loc-hostel',
    code: 'HST',
    name: 'University Hostel (Rico Fajardo Hall)',
    buildingNumber: 'Bldg 3',
    category: 'services',
    coordinates: { x: 56.0, y: 75.0, lat: 15.4448, lng: 120.9392 },
    isPickupActive: true,
    waitingCount: 2,
    description: 'Student dormitories, guest accommodations, and student services on Pili Ave.',
    icon: 'bed-outline'
  },
  {
    id: 'loc-nstp',
    code: 'NSTP',
    name: 'NEUST - NSTP Building',
    buildingNumber: 'Bldg 4',
    category: 'administrative',
    coordinates: { x: 72.0, y: 78.0, lat: 15.4452, lng: 120.9406 },
    isPickupActive: true,
    waitingCount: 3,
    description: 'National Service Training Program head office on Banaba St inside campus.',
    icon: 'ribbon-outline'
  },
  {
    id: 'loc-mart',
    code: 'MRT',
    name: 'NEUST Mart & Student Food Court',
    buildingNumber: 'Coop',
    category: 'services',
    coordinates: { x: 30.0, y: 48.0, lat: 15.4468, lng: 120.9378 },
    isPickupActive: true,
    waitingCount: 7,
    description: 'Campus convenience store, book store, and cafeteria at Kasoy St & Narra Ave.',
    icon: 'cart-outline'
  }
];

export const INITIAL_BICYCLES: Bicycle[] = [
  {
    id: 'bike-001',
    bikeNumber: 'BIKE-001',
    driverId: 'driver-001',
    driverName: 'Pedro Ramirez',
    driverPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    driverPhone: '0917-555-0101',
    passengerCount: 0,
    maxCapacity: 4,
    status: 'available',
    currentLocation: { x: 75.0, y: 82.0, lat: 15.444889, lng: 120.940417, stationName: 'Main Entrance Gate' },
    currentDestination: 'College of Information & Communications Tech (CICT)',
    pickupLocation: 'Main Entrance Gate',
    heading: 330,
    speedKmH: 12.5,
    lastUpdate: 'Just now',
    batteryPercent: 92
  },
  {
    id: 'bike-002',
    bikeNumber: 'BIKE-002',
    driverId: 'driver-002',
    driverName: 'Antonio Luna',
    driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    driverPhone: '0918-555-0102',
    passengerCount: 0,
    maxCapacity: 4,
    status: 'available',
    currentLocation: { x: 55.0, y: 55.0, lat: 15.446868, lng: 120.939533, stationName: 'College of Architecture' },
    currentDestination: 'University Library',
    pickupLocation: 'College of Architecture',
    heading: 45,
    speedKmH: 0,
    lastUpdate: 'Just now',
    batteryPercent: 88
  },
  {
    id: 'bike-003',
    bikeNumber: 'BIKE-003',
    driverId: 'driver-003',
    driverName: 'Juan Dela Cruz',
    driverPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    driverPhone: '0919-555-0103',
    passengerCount: 0,
    maxCapacity: 4,
    status: 'available',
    currentLocation: { x: 75.0, y: 82.0, lat: 15.444889, lng: 120.940417, stationName: 'Main Entrance Gate' },
    currentDestination: 'College of Information & Communications Tech (CICT)',
    pickupLocation: 'Main Entrance Gate',
    heading: 295,
    speedKmH: 0,
    lastUpdate: 'Just now',
    batteryPercent: 85
  },
  {
    id: 'bike-006',
    bikeNumber: 'BIKE-006',
    driverId: 'driver-006',
    driverName: 'Rodrigo Cruz',
    driverPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    driverPhone: '0922-555-0106',
    passengerCount: 0,
    maxCapacity: 4,
    status: 'available',
    currentLocation: { x: 55.0, y: 55.0, lat: 15.446868, lng: 120.939533, stationName: 'College of Architecture' },
    currentDestination: 'Main Entrance Gate',
    pickupLocation: 'College of Architecture',
    heading: 180,
    speedKmH: 0,
    lastUpdate: 'Just now',
    batteryPercent: 90
  },
  {
    id: 'bike-007',
    bikeNumber: 'BIKE-007',
    driverId: 'driver-007',
    driverName: 'Carlos Mendoza',
    driverPhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    driverPhone: '0923-555-0107',
    passengerCount: 3,
    maxCapacity: 4,
    status: 'almost_full',
    currentLocation: { x: 50.0, y: 65.0, lat: 15.4455, lng: 120.9388, stationName: 'Student Canteen' },
    currentDestination: 'College of Engineering',
    pickupLocation: 'Student Canteen',
    heading: 90,
    speedKmH: 8.5,
    lastUpdate: '2 mins ago',
    batteryPercent: 72
  },
  {
    id: 'bike-004',
    bikeNumber: 'BIKE-004',
    driverId: 'driver-004',
    driverName: 'Danilo Ramos',
    driverPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    driverPhone: '0920-555-0104',
    passengerCount: 4,
    maxCapacity: 4,
    status: 'on_trip',
    currentLocation: { x: 67.0, y: 36.0, lat: 15.4478, lng: 120.9408, stationName: 'Bumabyahe (Malunggay Ave)' },
    currentDestination: 'Main Entrance Gate',
    pickupLocation: 'College of Engineering',
    heading: 160,
    speedKmH: 13.8,
    lastUpdate: 'Just now',
    batteryPercent: 84
  },
  {
    id: 'bike-008',
    bikeNumber: 'BIKE-008',
    driverId: 'driver-008',
    driverName: 'Ramon Magsaysay',
    driverPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    driverPhone: '0924-555-0108',
    passengerCount: 1,
    maxCapacity: 4,
    status: 'on_trip',
    currentLocation: { x: 62.0, y: 42.0, lat: 15.44795, lng: 120.93965, stationName: 'Nagroronda (Narra Ave / CICT)' },
    currentDestination: 'CICT & Gymnasium Loop',
    pickupLocation: 'Main Entrance Gate',
    heading: 35,
    speedKmH: 11.2,
    lastUpdate: 'Just now',
    batteryPercent: 91
  },
  {
    id: 'bike-005',
    bikeNumber: 'BIKE-005',
    driverId: 'driver-005',
    driverName: 'Mateo De Silva',
    driverPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    driverPhone: '0921-555-0105',
    passengerCount: 0,
    maxCapacity: 4,
    status: 'maintenance',
    currentLocation: { x: 56.0, y: 78.0, lat: 15.4445, lng: 120.9392, stationName: 'Maintenance Bay (Hostel)' },
    currentDestination: 'None (Under Repair)',
    pickupLocation: 'None',
    heading: 0,
    speedKmH: 0,
    lastUpdate: '15 mins ago',
    batteryPercent: 40
  }
];

export const INITIAL_DEMO_USERS: User[] = [
  {
    id: 'student-001',
    email: 'maria.santos@neust.edu.ph',
    fullName: 'Maria Angela Santos',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    phone: '0927-123-4567',
    idNumber: '2023-01042',
    department: 'College of Information & Communications Tech (CICT)',
    accountStatus: 'active',
    password: 'password123',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'student-002',
    email: 'mark.reyes@neust.edu.ph',
    fullName: 'Mark Vincent Reyes',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    phone: '0928-234-5678',
    idNumber: '2022-04911',
    department: 'College of Engineering',
    accountStatus: 'active',
    password: 'password123',
    createdAt: '2026-01-18T09:30:00.000Z'
  },
  {
    id: 'driver-003',
    email: 'juan.delacruz@neust.edu.ph',
    fullName: 'Juan Dela Cruz',
    role: 'driver',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    phone: '0919-555-0103',
    idNumber: 'DRV-2024-003',
    department: 'Campus Transportation Services',
    assignedBicycleId: 'bike-003',
    assignedBicycleNumber: 'BIKE-003',
    accountStatus: 'active',
    password: 'password123',
    createdAt: '2026-02-01T07:15:00.000Z'
  },
  {
    id: 'driver-001',
    email: 'pedro.ramirez@neust.edu.ph',
    fullName: 'Pedro Ramirez',
    role: 'driver',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '0917-555-0101',
    idNumber: 'DRV-2024-001',
    department: 'Campus Transportation Services',
    assignedBicycleId: 'bike-001',
    assignedBicycleNumber: 'BIKE-001',
    accountStatus: 'active',
    password: 'password123',
    createdAt: '2026-02-01T07:30:00.000Z'
  },
  {
    id: 'admin-001',
    email: 'admin.bautista@neust.edu.ph',
    fullName: 'Engr. Roberto Bautista',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    phone: '0915-999-0011',
    idNumber: 'ADM-88001',
    department: 'University Logistics & Fleet Operations',
    accountStatus: 'active',
    password: 'password123',
    createdAt: '2025-11-10T08:00:00.000Z'
  }
];

export const INITIAL_QUEUES: QueueEntry[] = [
  {
    id: 'q-001',
    queueNumber: 'Q-005',
    studentId: 'student-demo-1',
    studentName: 'Clara Cortez',
    studentPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    studentIdNumber: '2023-08819',
    pickupLocationId: 'loc-gate',
    pickupLocationName: 'Main Entrance Gate',
    destinationId: 'loc-cict',
    destinationName: 'College of Information & Communications Tech (CICT)',
    status: 'called',
    position: 1,
    estimatedWaitMinutes: 1,
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
    calledAt: new Date(Date.now() - 1 * 60000).toISOString(),
    assignedBikeNumber: 'BIKE-003',
    assignedDriverName: 'Juan Dela Cruz'
  },
  {
    id: 'q-002',
    queueNumber: 'Q-006',
    studentId: 'student-demo-2',
    studentName: 'Ramon Garcia',
    studentPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    studentIdNumber: '2022-03120',
    pickupLocationId: 'loc-gate',
    pickupLocationName: 'Main Entrance Gate',
    destinationId: 'loc-cict',
    destinationName: 'College of Information & Communications Tech (CICT)',
    status: 'waiting',
    position: 2,
    estimatedWaitMinutes: 4,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: 'q-003',
    queueNumber: 'Q-007',
    studentId: 'student-demo-3',
    studentName: 'Bea Alonzo',
    studentPhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    studentIdNumber: '2024-00192',
    pickupLocationId: 'loc-gate',
    pickupLocationName: 'Main Entrance Gate',
    destinationId: 'loc-eng',
    destinationName: 'College of Engineering',
    status: 'waiting',
    position: 3,
    estimatedWaitMinutes: 7,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString()
  }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-101',
    tripNumber: 'TRIP-101',
    bicycleId: 'bike-003',
    bicycleNumber: 'BIKE-003',
    driverId: 'driver-003',
    driverName: 'Juan Dela Cruz',
    driverPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    pickupLocation: 'Main Entrance Gate',
    destination: 'College of Information & Communications Tech (CICT)',
    passengerCount: 2,
    maxCapacity: 4,
    status: 'active',
    startTime: new Date(Date.now() - 8 * 60000).toISOString(),
    passengers: [
      {
        studentId: 'student-demo-4',
        studentName: 'Joshua Aquino',
        queueNumber: 'Q-003',
        destination: 'College of Information & Communications Tech (CICT)',
        boardedAt: new Date(Date.now() - 7 * 60000).toISOString()
      },
      {
        studentId: 'student-demo-5',
        studentName: 'Liza Soberano',
        queueNumber: 'Q-004',
        destination: 'College of Information & Communications Tech (CICT)',
        boardedAt: new Date(Date.now() - 6 * 60000).toISOString()
      }
    ]
  },
  {
    id: 'trip-100',
    tripNumber: 'TRIP-100',
    bicycleId: 'bike-003',
    bicycleNumber: 'BIKE-003',
    driverId: 'driver-003',
    driverName: 'Juan Dela Cruz',
    driverPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    pickupLocation: 'NEUST Administration Building',
    destination: 'Main Entrance Gate',
    passengerCount: 4,
    maxCapacity: 4,
    status: 'completed',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
    endTime: new Date(Date.now() - 32 * 60000).toISOString(),
    distanceMeters: 650,
    passengers: []
  },
  {
    id: 'trip-099',
    tripNumber: 'TRIP-099',
    bicycleId: 'bike-001',
    bicycleNumber: 'BIKE-001',
    driverId: 'driver-001',
    driverName: 'Pedro Ramirez',
    driverPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    pickupLocation: 'Main Entrance Gate',
    destination: 'University Library',
    passengerCount: 3,
    maxCapacity: 4,
    status: 'completed',
    startTime: new Date(Date.now() - 75 * 60000).toISOString(),
    endTime: new Date(Date.now() - 60 * 60000).toISOString(),
    distanceMeters: 520,
    passengers: []
  }
];

export const INITIAL_MAINTENANCE_REPORTS: MaintenanceReport[] = [
  {
    id: 'mnt-001',
    reportNumber: 'MNT-041',
    bicycleId: 'bike-005',
    bicycleNumber: 'BIKE-005',
    driverId: 'driver-005',
    driverName: 'Mateo De Silva',
    issueType: 'Flat Tire',
    description: 'Rear tire puncture occurred near the University Plaza pathway. Requires inner tube replacement.',
    photoUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
    status: 'under_maintenance',
    reportedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    adminNotes: 'Work order dispatched to campus mechanical crew.'
  },
  {
    id: 'mnt-002',
    reportNumber: 'MNT-040',
    bicycleId: 'bike-002',
    bicycleNumber: 'BIKE-002',
    driverId: 'driver-002',
    driverName: 'Antonio Luna',
    issueType: 'Brake Problem',
    description: 'Front caliper brake feels loose on downhill slope heading to Grandstand. Adjusted cable tension.',
    status: 'resolved',
    reportedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    resolvedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    adminNotes: 'Caliper pads inspected and tightened. Test ride passed.'
  }
];

export const INITIAL_ANNOUNCEMENTS: ServiceAnnouncement[] = [
  {
    id: 'anc-001',
    title: 'Peak Hours Notice: 8:00 AM & 5:00 PM',
    content: 'All available campus bicycles are deployed to Main Gate and CICT routes to minimize wait times during morning and dismissal peaks.',
    type: 'operational',
    targetAudience: 'all',
    publishedAt: 'Today, 7:30 AM',
    author: 'Campus Logistics Administration',
    isActive: true
  },
  {
    id: 'anc-002',
    title: 'Designated Shuttle Pickup Points',
    content: 'Please wait at designated BikeGo stations marked with official campus signage. Maximum passenger limit is strictly 4 passengers per bicycle.',
    type: 'info',
    targetAudience: 'students',
    publishedAt: 'Yesterday',
    author: 'NEUST Student Affairs Office',
    isActive: true
  }
];

export const INITIAL_DESIGNATED_ZONES: DesignatedZone[] = [
  {
    id: 'zone-gate',
    name: 'Main Entrance Terminal Zone',
    type: 'both',
    center: { lat: 15.444889, lng: 120.940417 },
    radiusMeters: 45,
    isEnabled: true,
    description: 'Primary student drop-off and pickup terminal at Mahogany Blvd & Pan-Philippine Highway.',
    capacity: 6,
    activeShuttlesCount: 2,
    waitingPassengerCount: 8
  },
  {
    id: 'zone-cict',
    name: 'CICT — Bldg 25 Tech Hub Zone',
    type: 'both',
    center: { lat: 15.449353, lng: 120.940410 },
    radiusMeters: 40,
    isEnabled: true,
    description: 'High-density pickup and drop-off zone fronting College of ICT beside Physical Education & Gymnasium.',
    capacity: 5,
    activeShuttlesCount: 1,
    waitingPassengerCount: 12
  },
  {
    id: 'zone-admin-circle',
    name: 'Admin & Library Central Circle',
    type: 'both',
    center: { lat: 15.4462, lng: 120.9392 },
    radiusMeters: 50,
    isEnabled: true,
    description: 'Central campus rotary connecting Administration, Library, and Plaza.',
    capacity: 4,
    activeShuttlesCount: 1,
    waitingPassengerCount: 7
  },
  {
    id: 'zone-engineering',
    name: 'College of Engineering Station',
    type: 'pickup',
    center: { lat: 15.446990, lng: 120.940490 },
    radiusMeters: 35,
    isEnabled: true,
    description: 'Dedicated pickup bay for Engineering building along Narra Ave.',
    capacity: 3,
    activeShuttlesCount: 1,
    waitingPassengerCount: 5
  },
  {
    id: 'zone-grandstand',
    name: 'NEUST Athletic Field & Grandstand Zone',
    type: 'dropoff',
    center: { lat: 15.449350, lng: 120.939350 },
    radiusMeters: 55,
    isEnabled: true,
    description: 'Sports complex and athletic facilities around the NEUST Grandstand.',
    capacity: 4,
    activeShuttlesCount: 0,
    waitingPassengerCount: 1
  },
  {
    id: 'zone-restricted-creek',
    name: 'Sapang Buhay Creek Restricted Sector',
    type: 'restricted',
    center: { lat: 15.4460, lng: 120.9360 },
    radiusMeters: 40,
    isEnabled: true,
    description: 'Restricted area: water drainage and maintenance easement along Kasoy St. Bicycle entry prohibited.',
    capacity: 0,
    activeShuttlesCount: 0,
    waitingPassengerCount: 0
  }
];


