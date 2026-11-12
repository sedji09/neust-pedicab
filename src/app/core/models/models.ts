export type UserRole = 'student' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string;
  phone: string;
  idNumber: string; // Student ID or Driver License / Employee ID
  department?: string; // College or Division (e.g. CICT, Engineering)
  assignedBicycleId?: string; // If driver
  assignedBicycleNumber?: string;
  accountStatus: 'active' | 'suspended' | 'pending';
  authProvider?: 'local' | 'google';
  password?: string;
  createdAt?: string;
}

export interface RegisterUserDto {
  fullName: string;
  email: string;
  idNumber: string;
  password: string;
  phone: string;
  department: string;
  role: UserRole;
  avatarUrl?: string;
  assignedBicycleNumber?: string;
}

export type BicycleStatus = 'available' | 'almost_full' | 'full' | 'on_trip' | 'maintenance' | 'offline';

export type BookingStatus =
  | 'pending'
  | 'searching'
  | 'accepted'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_driver_found';

export interface BookingRequest {
  id: string;
  bookingNumber: string;
  studentId: string;
  studentName: string;
  studentPhoto?: string;
  studentIdNumber: string;
  studentPhone?: string;
  passengerCount?: number;
  pickupLocationId?: string;
  pickupName: string;
  pickupLat: number;
  pickupLng: number;
  pickupInstructions?: string;
  destinationId?: string;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  distanceMeters: number;
  estimatedMinutes: number;
  fareAmount: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhoto?: string;
  assignedDriverPhone?: string;
  assignedBikeId?: string;
  assignedBikeNumber?: string;
  driverLocation?: { lat: number; lng: number; heading?: number };
  targetDriverId?: string;
  requestExpiresAt?: number;
  rejectedDriverIds?: string[];
  rejectedBikeNumbers?: string[];
  eligibleBikeNumbers?: string[];
  eligibleDriverIds?: string[];
  notifiedDriversCount?: number;
}

export interface Coordinates {
  x: number; // 0-100% on the NEUST campus map canvas
  y: number; // 0-100% on the NEUST campus map canvas
  lat: number; // Actual GPS Latitude (~15.4593)
  lng: number; // Actual GPS Longitude (~120.9576)
}

export interface Bicycle {
  id: string;
  bikeNumber: string;
  driverId: string;
  driverName: string;
  driverPhoto: string;
  driverPhone: string;
  passengerCount: number;
  maxCapacity: number;
  status: BicycleStatus;
  currentLocation: Coordinates & { stationName?: string };
  currentDestination: string;
  pickupLocation: string;
  heading: number; // 0-360 degrees
  speedKmH: number;
  lastUpdate: string;
  batteryPercent: number;
  activeTripId?: string;
}

export type LocationCategory = 'academic' | 'administrative' | 'services' | 'gate' | 'recreation' | 'facility';

export type CampusLocationStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

export interface CampusLocation {
  id: string;
  code: string;
  name: string;
  buildingNumber: string;
  category: LocationCategory;
  coordinates: Coordinates;
  pickupCoordinates?: { lat: number; lng: number };
  dropoffCoordinates?: { lat: number; lng: number };
  gpsAccuracy?: number;
  isPickupActive: boolean;
  isDropoffAllowed?: boolean;
  status?: CampusLocationStatus;
  submittedBy?: string;
  submittedByRole?: 'driver' | 'admin';
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  waitingCount: number;
  description: string;
  icon: string;
}

export interface CreateLocationProposalDto {
  name: string;
  code?: string;
  buildingNumber?: string;
  category: LocationCategory;
  description?: string;
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  isPickupAllowed?: boolean;
  isDropoffAllowed?: boolean;
  submittedBy?: string;
  submittedByRole?: 'driver' | 'admin';
}

export type QueueStatus = 'waiting' | 'called' | 'boarded' | 'completed' | 'cancelled' | 'skipped';

export interface QueueEntry {
  id: string;
  queueNumber: string; // e.g. Q-008
  studentId: string;
  studentName: string;
  studentPhoto: string;
  studentIdNumber: string;
  pickupLocationId: string;
  pickupLocationName: string;
  destinationId: string;
  destinationName: string;
  status: QueueStatus;
  position: number;
  estimatedWaitMinutes: number;
  createdAt: string;
  calledAt?: string;
  boardedAt?: string;
  completedAt?: string;
  assignedBikeNumber?: string;
  assignedDriverName?: string;
  customPickupPin?: CustomPickupPin;
  pickupInstructions?: string;
}

export interface TripPassenger {
  studentId: string;
  studentName: string;
  queueNumber: string;
  destination: string;
  boardedAt: string;
  customPickupPin?: CustomPickupPin;
  pickupInstructions?: string;
}

export interface Trip {
  id: string;
  tripNumber: string;
  bicycleId: string;
  bicycleNumber: string;
  driverId: string;
  driverName: string;
  driverPhoto: string;
  pickupLocation: string;
  destination: string;
  passengerCount: number;
  maxCapacity: number;
  status: 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  distanceMeters?: number;
  passengers: TripPassenger[];
}

export type MaintenanceStatus = 'submitted' | 'under_review' | 'under_maintenance' | 'resolved';

export interface MaintenanceReport {
  id: string;
  reportNumber: string;
  bicycleId: string;
  bicycleNumber: string;
  driverId: string;
  driverName: string;
  issueType: 'Flat Tire' | 'Brake Problem' | 'Chain / Gears' | 'Battery / Lighting' | 'Frame / Seat' | 'Other';
  description: string;
  photoUrl?: string;
  status: MaintenanceStatus;
  reportedAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}

export interface ServiceAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'operational';
  targetAudience: 'all' | 'students' | 'drivers';
  publishedAt: string;
  author: string;
  isActive: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'queue' | 'trip' | 'maintenance' | 'system' | 'driver';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface ChatMessage {
  id: string;
  bookingId?: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'driver';
  receiverId: string;
  receiverName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// --- Geolocation & Leaflet Advanced Feature Models ---

export interface CustomPickupPin {
  lat: number;
  lng: number;
  x?: number; // Map canvas percentage (0-100)
  y?: number; // Map canvas percentage (0-100)
  addressText: string;
  nearestBuildingName?: string;
  nearestBuildingNumber?: string;
  distanceToNearestMeters?: number;
  isInsideCampusBoundary: boolean;
  notes?: string;
}

export type ZoneType = 'pickup' | 'dropoff' | 'both' | 'restricted';

export interface DesignatedZone {
  id: string;
  name: string;
  type: ZoneType;
  center: { lat: number; lng: number };
  radiusMeters: number;
  polygonCoords?: Array<{ lat: number; lng: number }>;
  isEnabled: boolean;
  description: string;
  capacity?: number;
  activeShuttlesCount?: number;
  waitingPassengerCount?: number;
}

export interface NearestBicycleResult {
  bicycle: Bicycle;
  straightLineDistanceMeters: number;
  walkingDistanceMeters: number;
  estimatedArrivalMinutes: number;
  isAvailableForTrip: boolean;
  ineligibilityReason?: string;
}

export interface RouteTrackingSession {
  tripId: string;
  bikeId: string;
  bikeNumber: string;
  driverId: string;
  driverName: string;
  driverPhoto: string;
  status: 'heading_to_pickup' | 'arrived_at_pickup' | 'en_route_destination' | 'completed';
  driverCoords: { lat: number; lng: number; heading: number };
  pickupCoords: { lat: number; lng: number; name: string };
  destinationCoords: { lat: number; lng: number; name: string };
  distanceRemainingMeters: number;
  estimatedArrivalMinutes: number;
  waypoints: Array<[number, number]>;
  lastUpdated: string;
}

export interface DemandHeatPoint {
  lat: number;
  lng: number;
  weight: number; // 0.0 to 1.0 intensity
  locationName: string;
  waitingCount: number;
  x?: number;
  y?: number;
}


