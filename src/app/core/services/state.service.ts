import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CampusRoutingService } from './campus-routing.service';
import { PickupLocationService } from './pickup-location.service';
import { NotificationService } from './notification.service';
import { LanguageService } from './language.service';
import { ApiService } from './api.service';
import {
  Bicycle,
  CampusLocation,
  QueueEntry,
  Trip,
  MaintenanceReport,
  ServiceAnnouncement,
  AppNotification,
  BicycleStatus,
  DesignatedZone,
  CustomPickupPin,
  RouteTrackingSession,
  BookingRequest,
  BookingStatus,
  CreateLocationProposalDto,
  CampusLocationStatus
} from '../models/models';
import {
  INITIAL_BICYCLES,
  INITIAL_CAMPUS_LOCATIONS,
  INITIAL_QUEUES,
  INITIAL_TRIPS,
  INITIAL_MAINTENANCE_REPORTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_DESIGNATED_ZONES
} from '../data/campus-data';

interface AppStateData {
  bicycles: Bicycle[];
  locations: CampusLocation[];
  queues: QueueEntry[];
  trips: Trip[];
  maintenanceReports: MaintenanceReport[];
  announcements: ServiceAnnouncement[];
  notifications: AppNotification[];
  designatedZones?: DesignatedZone[];
  bookings?: BookingRequest[];
  farePerHead?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private readonly STORAGE_KEY = 'neust_bikego_app_state_v7';
  private broadcastChannel: BroadcastChannel | null = null;
  private remoteBookingIds = new Set<string>();
  private cancelledBookingIds = new Set<string>();

  // Subjects
  private bicyclesSubject = new BehaviorSubject<Bicycle[]>(INITIAL_BICYCLES);
  private locationsSubject = new BehaviorSubject<CampusLocation[]>(INITIAL_CAMPUS_LOCATIONS);
  private queuesSubject = new BehaviorSubject<QueueEntry[]>(INITIAL_QUEUES);
  private tripsSubject = new BehaviorSubject<Trip[]>(INITIAL_TRIPS);
  private maintenanceSubject = new BehaviorSubject<MaintenanceReport[]>(INITIAL_MAINTENANCE_REPORTS);
  private announcementsSubject = new BehaviorSubject<ServiceAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  private designatedZonesSubject = new BehaviorSubject<DesignatedZone[]>(INITIAL_DESIGNATED_ZONES);
  private activeTrackingSessionSubject = new BehaviorSubject<RouteTrackingSession | null>(null);
  private bookingsSubject = new BehaviorSubject<BookingRequest[]>([]);
  private farePerHeadSubject = new BehaviorSubject<number>(10);

  // Observables
  public bicycles$: Observable<Bicycle[]> = this.bicyclesSubject.asObservable();
  public locations$: Observable<CampusLocation[]> = this.locationsSubject.asObservable();
  public approvedLocations$: Observable<CampusLocation[]> = this.locationsSubject.pipe(
    map(locs => locs.filter(l => l.status === 'approved' || !l.status))
  );
  public pendingLocations$: Observable<CampusLocation[]> = this.locationsSubject.pipe(
    map(locs => locs.filter(l => l.status === 'pending'))
  );
  public queues$: Observable<QueueEntry[]> = this.queuesSubject.asObservable();
  public trips$: Observable<Trip[]> = this.tripsSubject.asObservable();
  public maintenance$: Observable<MaintenanceReport[]> = this.maintenanceSubject.asObservable();
  public announcements$: Observable<ServiceAnnouncement[]> = this.announcementsSubject.asObservable();
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();
  public designatedZones$: Observable<DesignatedZone[]> = this.designatedZonesSubject.asObservable();
  public activeTrackingSession$: Observable<RouteTrackingSession | null> = this.activeTrackingSessionSubject.asObservable();
  public bookings$: Observable<BookingRequest[]> = this.bookingsSubject.asObservable();
  public farePerHead$: Observable<number> = this.farePerHeadSubject.asObservable();

  // Global Tab Navigation & Header Search Synchronization
  public activeTab$ = new BehaviorSubject<string>('home');
  public searchPinnedLocation$ = new BehaviorSubject<CampusLocation | null>(null);
  public isNotificationsPageOpen$ = new BehaviorSubject<boolean>(false);
  public isProfilePageOpen$ = new BehaviorSubject<boolean>(false);
  public isMessengerOpen$ = new BehaviorSubject<boolean>(false);
  public lastClaimedBookingNotice$ = new BehaviorSubject<{
    bookingId: string;
    bookingNumber: string;
    studentName: string;
    claimedByDriverId: string;
    claimedByDriverName: string;
    claimedByBikeNumber: string;
    timestamp: number;
  } | null>(null);

  public setMessengerOpen(isOpen: boolean): void {
    this.isMessengerOpen$.next(isOpen);
  }

  public setActiveTab(tab: string): void {
    this.activeTab$.next(tab);
  }

  public openNotificationsPage(): void {
    this.isNotificationsPageOpen$.next(true);
    this.isProfilePageOpen$.next(false);
  }

  public closeNotificationsPage(): void {
    this.isNotificationsPageOpen$.next(false);
  }

  public openProfilePage(): void {
    this.isProfilePageOpen$.next(true);
    this.isNotificationsPageOpen$.next(false);
  }

  public closeProfilePage(): void {
    this.isProfilePageOpen$.next(false);
  }

  public pinLocationFromSearch(loc: CampusLocation): void {
    this.searchPinnedLocation$.next(loc);
    this.isNotificationsPageOpen$.next(false);
    this.isProfilePageOpen$.next(false);
    this.activeTab$.next('map');
  }

  // Animation & simulation timer
  private simulationTimer: any = null;
  public isSimulationActive = true;
  private activeRouteWaypoints: Map<string, Array<[number, number]>> = new Map();
  // Map of bikes actively transmitting real hardware GPS from driver's mobile phone
  private activeHardwareGpsBikes = new Map<string, number>();

  constructor(
    private ngZone: NgZone,
    private routingService: CampusRoutingService,
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private apiService: ApiService
  ) {
    this.initBroadcastChannel();
    this.loadState();
    this.startCampusSimulation();
    this.syncBicyclesFromXampp();

    // Periodic check for booking timeouts & real-time storage synchronization across tabs/windows
    setInterval(() => {
      this.syncRegisteredDriverBicycles();
      this.syncBookingsFromStorage();
      this.checkAndHandleBookingTimeouts();
    }, 1000);

    // Periodic cross-device pedicab fleet sync from XAMPP PHP/MySQL
    setInterval(() => {
      this.syncBicyclesFromXampp();
    }, 4000);
  }

  private readonly LEGACY_FAKE_BIKE_IDS = new Set<string>();
  private readonly LEGACY_FAKE_DRIVER_IDS = new Set<string>();

  /**
   * Automatically syncs any newly registered Driver accounts from the users database into the active Pedicab fleet (`bicyclesSubject`).
   * Ensures that only real/registered pedicabs appear on the Live Map and receive bookings.
   */
  public syncRegisteredDriverBicycles(): void {
    try {
      const rawUsers = localStorage.getItem('neust_bikego_users_database_v2');
      if (!rawUsers) return;
      const users = JSON.parse(rawUsers);
      if (!Array.isArray(users)) return;

      const currentBikes = [...this.bicyclesSubject.value].filter(
        b => !this.LEGACY_FAKE_BIKE_IDS.has(b.id) && !this.LEGACY_FAKE_DRIVER_IDS.has(b.driverId)
      );
      let changed = currentBikes.length !== this.bicyclesSubject.value.length;

      for (const u of users) {
        if (u && u.role === 'driver' && !this.LEGACY_FAKE_DRIVER_IDS.has(u.id)) {
          const bikeNum = (u.assignedBicycleNumber || `PEDICAB-${u.id.slice(-3).toUpperCase()}`).trim().toUpperCase();
          const existingIdx = currentBikes.findIndex(
            b => b.driverId === u.id || b.bikeNumber.toUpperCase() === bikeNum
          );

          if (existingIdx === -1) {
            const newBike: Bicycle = {
              id: `bike-reg-${u.id}`,
              bikeNumber: bikeNum,
              driverId: u.id,
              driverName: u.fullName || 'Registered Driver',
              driverPhoto: u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
              driverPhone: u.phone || '0917-000-0000',
              passengerCount: 0,
              maxCapacity: 4,
              status: 'available',
              currentLocation: {
                x: 75.0,
                y: 82.0,
                lat: 15.444889,
                lng: 120.940417,
                stationName: 'Pilahan sa Gate (Main Gate Terminal)'
              },
              currentDestination: 'Main Entrance Gate',
              pickupLocation: 'Main Entrance Gate',
              heading: 0,
              speedKmH: 0,
              lastUpdate: 'Just now',
              batteryPercent: 100
            };
            currentBikes.push(newBike);
            changed = true;
          } else {
            // Keep registered driver metadata synced
            const existing = currentBikes[existingIdx];
            if (
              existing.driverName !== u.fullName ||
              existing.bikeNumber !== bikeNum ||
              (u.phone && existing.driverPhone !== u.phone)
            ) {
              currentBikes[existingIdx] = {
                ...existing,
                bikeNumber: bikeNum,
                driverId: u.id,
                driverName: u.fullName || existing.driverName,
                driverPhone: u.phone || existing.driverPhone,
                driverPhoto: u.avatarUrl || existing.driverPhoto
              };
              changed = true;
            }
          }
        }
      }

      if (changed) {
        this.bicyclesSubject.next(currentBikes);
        this.saveState();
      }
    } catch (e) {
      // Ignore storage read errors
    }
  }

  /**
   * Ensures the currently logged-in driver's pedicab is present in the live fleet
   * so it appears on the Live Map and in Student booking availability.
   */
  public ensureActiveDriverOnMap(
    driver: { id: string; fullName: string; phone?: string; avatarUrl?: string; bikeNumber: string },
    lat = 15.444889,
    lng = 120.940417
  ): void {
    const bikeNum = (driver.bikeNumber || 'BIKE-001').trim().toUpperCase();
    const currentBikes = [...this.bicyclesSubject.value];
    const existingIdx = currentBikes.findIndex(
      b => b.bikeNumber.trim().toUpperCase() === bikeNum || (driver.id && b.driverId === driver.id)
    );

    if (existingIdx === -1) {
      const newBike: Bicycle = {
        id: `bike-active-${bikeNum.toLowerCase()}`,
        bikeNumber: bikeNum,
        driverId: driver.id,
        driverName: driver.fullName || 'Campus Driver',
        driverPhoto: driver.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        driverPhone: driver.phone || '0917-555-0101',
        passengerCount: 0,
        maxCapacity: 4,
        status: 'available',
        currentLocation: {
          x: 75.0,
          y: 82.0,
          lat,
          lng,
          stationName: 'Pilahan sa Gate (Main Gate Terminal)'
        },
        currentDestination: 'Main Entrance Gate',
        pickupLocation: 'Main Entrance Gate',
        heading: 0,
        speedKmH: 0,
        lastUpdate: 'Just now',
        batteryPercent: 100
      };
      currentBikes.push(newBike);
      this.bicyclesSubject.next(currentBikes);
      this.saveState();
      this.apiService.upsertBicycleXampp(newBike).subscribe();
    } else {
      this.apiService.upsertBicycleXampp(currentBikes[existingIdx]).subscribe();
    }
  }

  /**
   * Fetches live pedicab availability and positions from XAMPP MySQL for cross-device sync
   */
  public syncBicyclesFromXampp(): void {
    this.apiService.getBicyclesXampp().subscribe(res => {
      if (!res.success || !Array.isArray(res.bicycles) || res.bicycles.length === 0) return;

      const remoteBikes = res.bicycles.filter(b => !this.LEGACY_FAKE_BIKE_IDS.has((b.id || '').toLowerCase()));
      if (remoteBikes.length === 0) return;

      const currentBikes = [...this.bicyclesSubject.value];
      let changed = false;

      remoteBikes.forEach(remote => {
        const idx = currentBikes.findIndex(
          b => b.bikeNumber.trim().toUpperCase() === remote.bikeNumber.trim().toUpperCase()
        );
        if (idx === -1) {
          currentBikes.push({
            ...remote,
            id: `bike-active-${remote.bikeNumber.toLowerCase()}`
          });
          changed = true;
        } else {
          const local = currentBikes[idx];
          if (
            local.status !== remote.status ||
            local.passengerCount !== remote.passengerCount ||
            Math.abs((local.currentLocation?.lat || 0) - (remote.currentLocation?.lat || 0)) > 0.00001 ||
            Math.abs((local.currentLocation?.lng || 0) - (remote.currentLocation?.lng || 0)) > 0.00001
          ) {
            currentBikes[idx] = {
              ...local,
              ...remote,
              id: local.id
            };
            changed = true;
          }
        }
      });

      if (changed) {
        this.bicyclesSubject.next(currentBikes);
        this.saveState();
      }
    });
  }

  // --- Real-Time Sync & Storage ---

  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('neust_bikego_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          this.ngZone.run(() => {
            if (event.data && event.data.type === 'STATE_UPDATE') {
              this.applyState(event.data.payload, false);
            } else if (event.data && event.data.type === 'BOOKING_CLAIMED') {
              this.lastClaimedBookingNotice$.next(event.data.payload);
              if (event.data.state) {
                this.applyState(event.data.state, false);
              }
            }
          });
        };
      }

      // Cross-tab & multi-window storage listener for guaranteed real-time Driver <-> Passenger sync
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === this.STORAGE_KEY && event.newValue) {
          try {
            const parsed: AppStateData = JSON.parse(event.newValue);
            this.ngZone.run(() => {
              this.applyState(parsed, false);
            });
          } catch (e) {
            console.warn('Error parsing cross-tab storage update:', e);
          }
        }
      });
    }
  }

  private getBookingStatusRank(status: BookingStatus): number {
    const ranks: Record<BookingStatus, number> = {
      pending: 0,
      searching: 1,
      accepted: 2,
      driver_arriving: 3,
      driver_arrived: 4,
      in_progress: 5,
      completed: 6,
      cancelled: 6,
      no_driver_found: 2
    };
    return ranks[status] ?? 0;
  }

  /**
   * Synchronizes bookings from localStorage before writing or on periodic tick so background
   * GPS updates on a Driver tab never overwrite a newly created Passenger booking!
   */
  public syncBookingsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const parsed: AppStateData = JSON.parse(raw);
      if (!parsed.bookings || !Array.isArray(parsed.bookings)) return;

      const currentBookings = [...this.bookingsSubject.value];
      let hasChanges = false;
      const mergedMap = new Map<string, BookingRequest>();

      for (const b of currentBookings) {
        mergedMap.set(b.id, b);
      }

      for (const sb of parsed.bookings) {
        const local = mergedMap.get(sb.id);
        if (!local) {
          mergedMap.set(sb.id, sb);
          hasChanges = true;
        } else {
          const sbTime = new Date(sb.updatedAt || sb.createdAt || 0).getTime();
          const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
          const sbRank = this.getBookingStatusRank(sb.status);
          const localRank = this.getBookingStatusRank(local.status);

          if (sbTime > localTime || (sbTime === localTime && sbRank > localRank) || (local.status === 'searching' && sb.status !== 'searching')) {
            mergedMap.set(sb.id, sb);
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.bookingsSubject.next(mergedList);
      }
    } catch (e) {
      // Ignore storage read errors
    }
  }

  private broadcastUpdate(): void {
    const currentState = this.getStateSnapshot();
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'STATE_UPDATE',
        payload: currentState
      });
    }
  }

  private saveState(): void {
    // Merge any newer bookings from storage before saving so background GPS ticks never clobber new bookings
    this.syncBookingsFromStorage();
    const state = this.getStateSnapshot();
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
    this.broadcastUpdate();
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem('neust_bikego_app_state_v6') || localStorage.getItem('neust_bikego_app_state_v5') || localStorage.getItem('neust_bikego_app_state_v4') || localStorage.getItem('neust_bikego_app_state_v3');
      if (raw) {
        const parsed: AppStateData = JSON.parse(raw);
        // Ensure verified campus locations have the exact coordinates requested by user
        if (parsed.locations) {
          // Merge any newly introduced initial campus locations
          const existingIds = new Set(parsed.locations.map(l => l.id));
          for (const initLoc of INITIAL_CAMPUS_LOCATIONS) {
            if (!existingIds.has(initLoc.id)) {
              parsed.locations.push({ ...initLoc });
            }
          }

          parsed.locations = parsed.locations.map(loc => {
            if (loc.id === 'loc-cict' || loc.code === 'CICT') {
              return {
                ...loc,
                coordinates: { x: 65.4, y: 35.1, lat: 15.448850, lng: 120.939800 },
                pickupCoordinates: { lat: 15.448700, lng: 120.939700 },
                dropoffCoordinates: { lat: 15.448700, lng: 120.939700 },
                description: 'College of Information and Communications Technology (CICT) Building, beside Physical Education & Athletic Field.'
              };
            }
            if (loc.id === 'loc-eng' || loc.code === 'ENG') {
              return {
                ...loc,
                name: 'College of Engineering',
                coordinates: { x: 68.0, y: 48.0, lat: 15.446990, lng: 120.940490 }
              };
            }
            if (loc.id === 'loc-gym' || loc.code === 'GYM') {
              return {
                ...loc,
                name: 'NEUST Gymnasium / NEUST Gym',
                coordinates: { x: 72.0, y: 32.0, lat: 15.448650, lng: 120.941100 }
              };
            }
            if (loc.id === 'loc-pool' || loc.code === 'POOL') {
              return {
                ...loc,
                name: 'NEUST Swimming Pool',
                coordinates: { x: 78.0, y: 35.0, lat: 15.448300, lng: 120.941630 }
              };
            }
            if (loc.id === 'loc-museum' || loc.code === 'MUS') {
              return {
                ...loc,
                name: 'University Museum',
                coordinates: { x: 58.0, y: 68.0, lat: 15.445240, lng: 120.939610 }
              };
            }
            if (loc.id === 'loc-arch' || loc.code === 'ARCH') {
              return {
                ...loc,
                name: 'College of Architecture (Gilid ng Arki)',
                coordinates: { x: 55.0, y: 55.0, lat: 15.446868, lng: 120.939533 },
                pickupCoordinates: { lat: 15.446868, lng: 120.939533 },
                dropoffCoordinates: { lat: 15.446868, lng: 120.939533 }
              };
            }
            if (loc.id === 'loc-ced' || loc.code === 'CED') {
              return {
                ...loc,
                name: 'College of Education',
                coordinates: { x: 48.0, y: 45.0, lat: 15.447290, lng: 120.938630 }
              };
            }
            if (loc.id === 'loc-crim' || loc.code === 'CRIM') {
              return {
                ...loc,
                name: 'College of Criminology',
                coordinates: { x: 40.0, y: 28.0, lat: 15.448880, lng: 120.938170 }
              };
            }
            if (loc.id === 'loc-grandstand' || loc.code === 'GRD') {
              return {
                ...loc,
                name: 'NEUST Grandstand & Athletic Field',
                coordinates: { x: 50.0, y: 22.0, lat: 15.449350, lng: 120.939350 }
              };
            }
            if (loc.id === 'loc-cmbt' || loc.code === 'CMBT') {
              return {
                ...loc,
                coordinates: { x: 52.0, y: 65.0, lat: 15.445500, lng: 120.939200 }
              };
            }
            if (loc.id === 'loc-nstp' || loc.code === 'NSTP' || loc.coordinates.lat < 15.4444) {
              return {
                ...loc,
                coordinates: { x: 72.0, y: 78.0, lat: 15.445200, lng: 120.940600 }
              };
            }
            return loc;
          });
        }
        if (!parsed.bicycles || !Array.isArray(parsed.bicycles) || parsed.bicycles.length === 0) {
          parsed.bicycles = [...INITIAL_BICYCLES];
        } else {
          parsed.bicycles = parsed.bicycles.map(b => {
            if (!b.currentLocation || b.currentLocation.lat < 15.4444) {
              return {
                ...b,
                currentLocation: {
                  ...(b.currentLocation || { x: 75.0, y: 82.0 }),
                  lat: 15.444889,
                  lng: 120.940417,
                  stationName: 'Pilahan sa Gate (Main Gate Terminal)'
                }
              };
            }
            return b;
          });
        }
        if (parsed.queues) {
          parsed.queues = parsed.queues.filter(q => q.id !== 'q-001' && q.id !== 'q-002' && q.id !== 'q-003');
        }
        if (parsed.trips) {
          parsed.trips = parsed.trips.filter(t => t.id !== 'trip-101' && t.id !== 'trip-100' && t.id !== 'trip-099');
        }
        if (parsed.maintenanceReports) {
          parsed.maintenanceReports = parsed.maintenanceReports.filter(m => m.id !== 'mnt-001' && m.id !== 'mnt-002');
        }
        if (parsed.bookings) {
          parsed.bookings = parsed.bookings.map(b => {
            if (b.destinationId === 'loc-cict' || b.destinationName?.includes('CICT')) {
              return {
                ...b,
                destinationLat: 15.448850,
                destinationLng: 120.939800
              };
            }
            if (b.destinationId === 'loc-cmbt' || b.destinationName?.includes('CMBT') || b.destinationName?.includes('Management')) {
              return {
                ...b,
                destinationLat: 15.445500,
                destinationLng: 120.939200
              };
            }
            return b;
          });
        }
        if (typeof parsed.farePerHead === 'number') {
          this.farePerHeadSubject.next(parsed.farePerHead);
        }
        this.applyState(parsed, false);
        this.syncRegisteredDriverBicycles();
        return;
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    this.syncRegisteredDriverBicycles();
    // Seed initial notifications
    this.notificationsSubject.next([
      {
        id: 'notif-1',
        userId: 'student-001',
        title: 'Welcome to NEUST BikeGo!',
        message: 'Real-time campus bicycle tracking and digital queueing is now live at Sumacab Campus.',
        type: 'system',
        timestamp: 'Just now',
        isRead: false
      }
    ]);
  }

  private applyState(state: Partial<AppStateData>, shouldSave = true): void {
    if (state.bicycles) this.bicyclesSubject.next(state.bicycles);
    if (state.locations) this.locationsSubject.next(state.locations);
    if (state.queues) this.queuesSubject.next(state.queues);
    if (state.trips) this.tripsSubject.next(state.trips);
    if (state.maintenanceReports) this.maintenanceSubject.next(state.maintenanceReports);
    if (state.announcements) this.announcementsSubject.next(state.announcements);
    if (state.notifications) this.notificationsSubject.next(state.notifications);
    if (state.designatedZones) this.designatedZonesSubject.next(state.designatedZones);
    if (state.bookings) this.bookingsSubject.next(state.bookings);
    if (typeof state.farePerHead === 'number') this.farePerHeadSubject.next(state.farePerHead);
    if (shouldSave) {
      this.saveState();
    }
  }

  public getStateSnapshot(): AppStateData {
    return {
      bicycles: this.bicyclesSubject.value,
      locations: this.locationsSubject.value,
      queues: this.queuesSubject.value,
      trips: this.tripsSubject.value,
      maintenanceReports: this.maintenanceSubject.value,
      announcements: this.announcementsSubject.value,
      notifications: this.notificationsSubject.value,
      designatedZones: this.designatedZonesSubject.value,
      bookings: this.bookingsSubject.value,
      farePerHead: this.farePerHeadSubject.value
    };
  }

  public getFarePerHead(): number {
    return this.farePerHeadSubject.value;
  }

  public setFarePerHead(newFare: number): void {
    const validFare = Math.max(1, Math.round(newFare));
    this.farePerHeadSubject.next(validFare);
    this.saveState();
  }

  // --- Bicycle Operations ---

  public updatePassengerCount(bikeNumber: string, delta: number): void {
    const list = [...this.bicyclesSubject.value];
    const index = list.findIndex(b => b.bikeNumber === bikeNumber);
    if (index === -1) return;

    const bike = { ...list[index] };
    const newCount = Math.max(0, Math.min(bike.maxCapacity, bike.passengerCount + delta));
    bike.passengerCount = newCount;

    // Recalculate status based on capacity
    if (bike.status !== 'maintenance' && bike.status !== 'offline') {
      if (newCount >= bike.maxCapacity) {
        bike.status = 'full';
      } else if (newCount === bike.maxCapacity - 1) {
        bike.status = 'almost_full';
      } else if (newCount > 0) {
        bike.status = 'on_trip';
      } else {
        bike.status = 'available';
      }
    }
    bike.lastUpdate = 'Just now';
    list[index] = bike;
    this.bicyclesSubject.next(list);
    this.saveState();
    this.apiService.upsertBicycleXampp(bike).subscribe();
  }

  public setBicycleStatus(bikeNumber: string, status: BicycleStatus): void {
    const list = [...this.bicyclesSubject.value];
    const index = list.findIndex(b => b.bikeNumber === bikeNumber);
    if (index === -1) return;

    const bike = { ...list[index], status };
    if (status === 'available') {
      bike.passengerCount = 0;
    }
    bike.lastUpdate = 'Just now';
    list[index] = bike;
    this.bicyclesSubject.next(list);
    this.saveState();
    this.apiService.upsertBicycleXampp(bike).subscribe();
  }

  public updateDriverLocation(bikeNumber: string, lat: number, lng: number, x?: number, y?: number, heading?: number): void {
    // Record that this bike is being controlled by a real mobile phone hardware GPS
    this.activeHardwareGpsBikes.set(bikeNumber, Date.now());

    const list = [...this.bicyclesSubject.value];
    const index = list.findIndex(b => b.bikeNumber === bikeNumber);
    if (index === -1) return;

    const bike = { ...list[index] };

    // Geofenced Pilahan Auto-Detection (Gate vs Gilid ng Arki vs Nagroronda)
    let stationName = bike.currentLocation?.stationName || 'Nagroronda sa Campus';
    const distToGate = this.calculateHaversineMeters(lat, lng, 15.444889, 120.940417);
    const distToArki = this.calculateHaversineMeters(lat, lng, 15.447738, 120.940822);
    if (distToGate <= 75) {
      stationName = 'NEUST Gate & Trike Bike Terminal (Terminal)';
    } else if (distToArki <= 75) {
      stationName = 'College of Architecture (Gilid ng Arki)';
    } else if (bike.status === 'on_trip') {
      stationName = 'Bumabyahe sa Campus';
    } else {
      stationName = 'Nagroronda sa Campus';
    }

    bike.currentLocation = {
      lat,
      lng,
      x: x !== undefined ? x : bike.currentLocation.x,
      y: y !== undefined ? y : bike.currentLocation.y,
      stationName
    };
    if (heading !== undefined) {
      bike.heading = heading;
    }
    bike.lastUpdate = 'Just now';
    list[index] = bike;
    this.bicyclesSubject.next(list);

    // If there is an active booking assigned to this real rider, update route distance & ETA
    const bookings = [...this.bookingsSubject.value];
    let bookingsUpdated = false;
    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      if (b.assignedBikeNumber === bikeNumber && (b.status === 'accepted' || b.status === 'driver_arriving' || b.status === 'in_progress')) {
        const isArriving = b.status === 'accepted' || b.status === 'driver_arriving';
        const targetLat = isArriving ? b.pickupLat : b.destinationLat;
        const targetLng = isArriving ? b.pickupLng : b.destinationLng;
        const dist = this.calculateHaversineMeters(lat, lng, targetLat, targetLng);

        if (isArriving && dist < 15) {
          b.status = 'driver_arrived';
          b.distanceMeters = 0;
          b.estimatedMinutes = 0;
          bookingsUpdated = true;
        } else {
          b.distanceMeters = Math.max(10, Math.round(dist));
          b.estimatedMinutes = Math.max(1, Math.ceil(b.distanceMeters / 200));
          bookingsUpdated = true;
        }
      }
    }
    if (bookingsUpdated) {
      this.bookingsSubject.next(bookings);
    }

    this.saveState();
  }

  public setDriverTerminal(bikeNumber: string, terminal: 'gate' | 'arki' | 'roaming'): void {
    const list = [...this.bicyclesSubject.value];
    const index = list.findIndex(b => b.bikeNumber === bikeNumber);
    if (index === -1) return;

    const bike = { ...list[index] };
    if (terminal === 'gate') {
      bike.currentLocation = {
        lat: 15.444889,
        lng: 120.940417,
        x: 75.0,
        y: 82.0,
        stationName: 'NEUST Gate & Trike Bike Terminal (Terminal)'
      };
      bike.pickupLocation = 'NEUST Gate & Trike Terminal';
    } else if (terminal === 'arki') {
      bike.currentLocation = {
        lat: 15.447738,
        lng: 120.940822,
        x: 55.0,
        y: 55.0,
        stationName: 'College of Architecture (Gilid ng Arki)'
      };
      bike.pickupLocation = 'College of Architecture (Gilid ng Arki)';
    } else {
      bike.currentLocation = {
        lat: 15.4468,
        lng: 120.9398,
        x: 50.0,
        y: 50.0,
        stationName: 'Nagroronda sa Campus'
      };
      bike.pickupLocation = 'Campus Grounds';
    }
    bike.lastUpdate = 'Just now';
    list[index] = bike;
    this.bicyclesSubject.next(list);
    this.saveState();
    this.apiService.upsertBicycleXampp(bike).subscribe();
  }

  public registerBicycle(newBike: Partial<Bicycle>): void {
    const list = [...this.bicyclesSubject.value];
    const bikeNumber = newBike.bikeNumber || `BIKE-00${list.length + 1}`;
    const bike: Bicycle = {
      id: 'bike-' + Date.now(),
      bikeNumber: bikeNumber,
      driverId: newBike.driverId || 'unassigned',
      driverName: newBike.driverName || 'Unassigned Driver',
      driverPhoto: newBike.driverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      driverPhone: newBike.driverPhone || '0900-000-0000',
      passengerCount: 0,
      maxCapacity: newBike.maxCapacity || 4,
      status: 'available',
      currentLocation: { x: 75.0, y: 82.0, lat: 15.444889, lng: 120.940417, stationName: 'NEUST Gate & Trike Terminal' },
      currentDestination: 'Main Entrance Gate',
      pickupLocation: 'Main Entrance Gate',
      heading: 0,
      speedKmH: 0,
      lastUpdate: 'Just now',
      batteryPercent: 100,
      ...newBike
    };
    list.push(bike);
    this.bicyclesSubject.next(list);
    this.saveState();
  }

  // --- Queue Operations ---

  public joinQueue(
    student: { id: string; name: string; avatarUrl: string; idNumber: string },
    pickupId: string,
    destinationId: string,
    customPickupPin?: CustomPickupPin,
    pickupInstructions?: string
  ): QueueEntry {
    const locations = this.locationsSubject.value;
    const pickup = locations.find(l => l.id === pickupId) || locations[0];
    const destination = locations.find(l => l.id === destinationId) || locations[1];

    const currentQueues = this.queuesSubject.value;
    const activeWaiting = currentQueues.filter(q => q.pickupLocationId === pickupId && q.status === 'waiting');
    
    // Generate sequential queue number
    const nextNum = currentQueues.length + 1;
    const queueNumber = `Q-${String(nextNum).padStart(3, '0')}`;
    const position = activeWaiting.length + 1;
    const estimatedWaitMinutes = position * 3; // ~3 mins per turn

    const newEntry: QueueEntry = {
      id: 'q-' + Date.now(),
      queueNumber,
      studentId: student.id,
      studentName: student.name,
      studentPhoto: student.avatarUrl,
      studentIdNumber: student.idNumber,
      pickupLocationId: pickup.id,
      pickupLocationName: customPickupPin ? customPickupPin.addressText : pickup.name,
      destinationId: destination.id,
      destinationName: destination.name,
      status: 'waiting',
      position,
      estimatedWaitMinutes,
      createdAt: new Date().toISOString(),
      customPickupPin,
      pickupInstructions
    };

    const updatedQueues = [...currentQueues, newEntry];
    this.queuesSubject.next(updatedQueues);

    // Update location waiting count
    this.refreshLocationWaitingCounts(updatedQueues);

    // Add confirmation notification
    const pickupLabel = customPickupPin ? customPickupPin.addressText : pickup.name;
    this.addNotification({
      userId: student.id,
      title: `Queue Confirmed: ${queueNumber}`,
      message: `You are #${position} in line for ${pickupLabel} heading to ${destination.name}. Estimated wait: ${estimatedWaitMinutes} mins.`,
      type: 'queue'
    });

    this.saveState();
    return newEntry;
  }

  // --- Designated Zones Operations (Feature 3) ---

  public addDesignatedZone(zone: Partial<DesignatedZone>): DesignatedZone {
    const zones = [...this.designatedZonesSubject.value];
    const newZone: DesignatedZone = {
      id: 'zone-' + Date.now(),
      name: zone.name || 'New Campus Zone',
      type: zone.type || 'pickup',
      center: zone.center || { lat: 15.446853, lng: 120.939454 },
      radiusMeters: zone.radiusMeters || 40,
      isEnabled: true,
      description: zone.description || 'Designated campus pedicab zone',
      capacity: zone.capacity || 4,
      activeShuttlesCount: 0,
      waitingPassengerCount: 0,
      ...zone
    };
    zones.push(newZone);
    this.designatedZonesSubject.next(zones);
    this.saveState();
    return newZone;
  }

  public toggleDesignatedZone(zoneId: string): void {
    const zones = [...this.designatedZonesSubject.value];
    const idx = zones.findIndex(z => z.id === zoneId);
    if (idx === -1) return;
    zones[idx] = { ...zones[idx], isEnabled: !zones[idx].isEnabled };
    this.designatedZonesSubject.next(zones);
    this.saveState();
  }

  public deleteDesignatedZone(zoneId: string): void {
    const zones = this.designatedZonesSubject.value.filter(z => z.id !== zoneId);
    this.designatedZonesSubject.next(zones);
    this.saveState();
  }

  // --- Live Route Tracking Operations (Feature 4) ---

  public setActiveTrackingSession(session: RouteTrackingSession | null): void {
    this.activeTrackingSessionSubject.next(session);
  }

  public getActiveTrackingSession(): RouteTrackingSession | null {
    return this.activeTrackingSessionSubject.value;
  }

  public cancelQueue(queueId: string): void {
    const queues = [...this.queuesSubject.value];
    const index = queues.findIndex(q => q.id === queueId);
    if (index === -1) return;

    const entry = queues[index];
    entry.status = 'cancelled';
    queues[index] = entry;

    // Recalculate remaining waiting positions
    this.recalculatePositions(queues, entry.pickupLocationId);
    this.queuesSubject.next(queues);
    this.refreshLocationWaitingCounts(queues);
    this.saveState();
  }

  public callPassenger(queueId: string, bikeNumber: string, driverName: string): void {
    const queues = [...this.queuesSubject.value];
    const index = queues.findIndex(q => q.id === queueId);
    if (index === -1) return;

    const entry = { ...queues[index] };
    entry.status = 'called';
    entry.calledAt = new Date().toISOString();
    entry.assignedBikeNumber = bikeNumber;
    entry.assignedDriverName = driverName;
    queues[index] = entry;

    this.queuesSubject.next(queues);

    // Alert the student
    this.addNotification({
      userId: entry.studentId,
      title: `Bicycle Arrived! Queue ${entry.queueNumber}`,
      message: `${bikeNumber} (Driver ${driverName}) is ready for boarding at ${entry.pickupLocationName}!`,
      type: 'queue'
    });

    this.saveState();
  }

  public boardPassenger(queueId: string, bikeNumber: string): boolean {
    const bicycles = [...this.bicyclesSubject.value];
    const bikeIndex = bicycles.findIndex(b => b.bikeNumber === bikeNumber);
    if (bikeIndex === -1) return false;

    const bike = bicycles[bikeIndex];
    if (bike.passengerCount >= bike.maxCapacity) {
      return false; // Capacity reached
    }

    const queues = [...this.queuesSubject.value];
    const qIndex = queues.findIndex(q => q.id === queueId);
    if (qIndex === -1) return false;

    const entry = { ...queues[qIndex] };
    entry.status = 'boarded';
    entry.boardedAt = new Date().toISOString();
    queues[qIndex] = entry;

    // Increment passenger count on the bicycle
    this.updatePassengerCount(bikeNumber, 1);

    // Recalculate queue positions
    this.recalculatePositions(queues, entry.pickupLocationId);
    this.queuesSubject.next(queues);
    this.refreshLocationWaitingCounts(queues);

    this.addNotification({
      userId: entry.studentId,
      title: `Boarded ${bikeNumber}`,
      message: `You have successfully boarded ${bikeNumber}. Have a safe campus trip to ${entry.destinationName}!`,
      type: 'trip'
    });

    this.saveState();
    return true;
  }

  /**
   * Driver drops off a specific boarded queue passenger at their destination.
   * Frees up the seat(s) immediately and resets to 0/4 (4 available seats) when no other passengers remain.
   */
  public dropOffBoardedQueuePassenger(queueId: string, bikeNumber: string): boolean {
    const queues = [...this.queuesSubject.value];
    const qIndex = queues.findIndex(q => q.id === queueId);
    if (qIndex === -1) return false;

    const entry = { ...queues[qIndex] };
    entry.status = 'completed';
    entry.completedAt = new Date().toISOString();
    queues[qIndex] = entry;
    this.queuesSubject.next(queues);
    this.refreshLocationWaitingCounts(queues);

    const bicycles = [...this.bicyclesSubject.value];
    const bikeIdx = bicycles.findIndex(b => b.bikeNumber === bikeNumber);
    if (bikeIdx > -1) {
      const bike = { ...bicycles[bikeIdx] };
      const remainingBoarded = queues.filter(q => q.assignedBikeNumber === bikeNumber && q.status === 'boarded').length;
      const activeBookingsForBike = this.bookingsSubject.value.filter(
        b => b.assignedBikeNumber === bikeNumber &&
             (b.status === 'accepted' || b.status === 'driver_arriving' || b.status === 'driver_arrived' || b.status === 'in_progress')
      );
      const activeBookingPax = activeBookingsForBike.reduce((sum, b) => sum + (b.passengerCount || 1), 0);

      // Update destination coordinates if matched
      const destLoc = this.locationsSubject.value.find(l => l.id === entry.destinationId || l.name === entry.destinationName);
      if (destLoc) {
        bike.currentLocation = {
          ...bike.currentLocation,
          lat: destLoc.dropoffCoordinates?.lat ?? destLoc.coordinates.lat,
          lng: destLoc.dropoffCoordinates?.lng ?? destLoc.coordinates.lng,
          stationName: destLoc.name
        };
      }

      if (remainingBoarded === 0 && activeBookingPax === 0) {
        bike.passengerCount = 0;
        bike.status = 'available';
      } else {
        bike.passengerCount = Math.max(0, Math.min(bike.maxCapacity, remainingBoarded + activeBookingPax));
        bike.status = bike.passengerCount >= bike.maxCapacity ? 'full' : (bike.passengerCount === bike.maxCapacity - 1 ? 'almost_full' : 'on_trip');
      }
      bike.pickupLocation = entry.destinationName;
      bike.lastUpdate = 'Just now';
      bicycles[bikeIdx] = bike;
      this.bicyclesSubject.next(bicycles);

      // Record completed trip in history
      this.tripsSubject.next([
        {
          id: 'trip-' + Date.now(),
          tripNumber: `TRIP-${Date.now().toString().slice(-6)}`,
          bicycleId: bike.id,
          bicycleNumber: bike.bikeNumber,
          driverId: bike.driverId,
          driverName: bike.driverName,
          driverPhoto: bike.driverPhoto,
          pickupLocation: entry.pickupLocationName,
          destination: entry.destinationName,
          passengerCount: 1,
          maxCapacity: bike.maxCapacity,
          status: 'completed',
          startTime: entry.boardedAt || entry.createdAt,
          endTime: new Date().toISOString(),
          distanceMeters: 450,
          passengers: [
            {
              studentId: entry.studentId,
              studentName: entry.studentName,
              queueNumber: entry.queueNumber,
              destination: entry.destinationName,
              boardedAt: entry.boardedAt || entry.createdAt
            }
          ]
        },
        ...this.tripsSubject.value
      ]);
    }

    this.addNotification({
      userId: entry.studentId,
      title: `Dropped off at ${entry.destinationName}! ✅`,
      message: `You have arrived safely at ${entry.destinationName} via ${bikeNumber}. Thank you for riding NEUST BikeGo!`,
      type: 'trip'
    });

    this.saveState();
    return true;
  }

  /**
   * Driver drops off ALL current passengers on their pedicab (active bookings, boarded queues, or manual count)
   * and immediately resets the pedicab to 0/4 passengers (4 Available Seats / Available status).
   */
  public dropOffAllPassengers(bikeNumber: string): void {
    const nowIso = new Date().toISOString();

    // 1. Complete any active JoyRide bookings assigned to this bike
    const bookings = [...this.bookingsSubject.value];
    let lastDestName: string | undefined;
    let lastDestLat: number | undefined;
    let lastDestLng: number | undefined;
    const newTrips: Trip[] = [];

    const bikes = [...this.bicyclesSubject.value];
    const bikeIdx = bikes.findIndex(b => b.bikeNumber === bikeNumber);
    const bikeRef = bikeIdx > -1 ? bikes[bikeIdx] : null;

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      if (
        b.assignedBikeNumber === bikeNumber &&
        (b.status === 'accepted' || b.status === 'driver_arriving' || b.status === 'driver_arrived' || b.status === 'in_progress')
      ) {
        const updatedBooking: BookingRequest = {
          ...b,
          status: 'completed',
          distanceMeters: 0,
          estimatedMinutes: 0,
          updatedAt: nowIso
        };
        bookings[i] = updatedBooking;
        lastDestName = b.destinationName;
        lastDestLat = b.destinationLat;
        lastDestLng = b.destinationLng;

        this.activeRouteWaypoints.delete(`${b.id}_arriving`);
        this.activeRouteWaypoints.delete(`${b.id}_in_progress`);

        newTrips.push({
          id: 'trip-' + Date.now() + '-' + i,
          tripNumber: `TRIP-${Date.now().toString().slice(-6)}`,
          bicycleId: bikeRef?.id || b.assignedBikeId || 'bike-003',
          bicycleNumber: bikeNumber,
          driverId: b.assignedDriverId || bikeRef?.driverId || 'driver-003',
          driverName: b.assignedDriverName || bikeRef?.driverName || 'Campus Driver',
          driverPhoto: b.assignedDriverPhoto || bikeRef?.driverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          pickupLocation: b.pickupName,
          destination: b.destinationName,
          passengerCount: b.passengerCount || 1,
          maxCapacity: bikeRef?.maxCapacity || 4,
          status: 'completed',
          startTime: b.createdAt,
          endTime: nowIso,
          distanceMeters: b.distanceMeters || 450,
          passengers: [
            {
              studentId: b.studentId,
              studentName: b.studentName,
              queueNumber: b.bookingNumber,
              destination: b.destinationName,
              boardedAt: b.updatedAt
            }
          ]
        });

        this.addNotification({
          userId: b.studentId,
          title: `Dropped off at ${b.destinationName}! ✅`,
          message: `You have arrived safely at ${b.destinationName} via ${b.assignedDriverName || 'Driver'} (${bikeNumber}).`,
          type: 'trip'
        });
      }
    }
    this.bookingsSubject.next(bookings);

    // 2. Complete any boarded queue entries assigned to this bike
    const queues = [...this.queuesSubject.value];
    for (let i = 0; i < queues.length; i++) {
      const q = queues[i];
      if (q.assignedBikeNumber === bikeNumber && (q.status === 'boarded' || q.status === 'called')) {
        queues[i] = {
          ...q,
          status: 'completed',
          completedAt: nowIso
        };
        lastDestName = lastDestName || q.destinationName;

        this.addNotification({
          userId: q.studentId,
          title: `Dropped off at ${q.destinationName}! ✅`,
          message: `You have arrived safely at ${q.destinationName} via ${bikeNumber}.`,
          type: 'trip'
        });
      }
    }
    this.queuesSubject.next(queues);
    this.refreshLocationWaitingCounts(queues);

    // 3. Complete any active pedicab loop trips on this bike
    const trips = [...this.tripsSubject.value];
    for (let i = 0; i < trips.length; i++) {
      if (trips[i].bicycleNumber === bikeNumber && trips[i].status === 'active') {
        trips[i] = {
          ...trips[i],
          status: 'completed',
          endTime: nowIso,
          passengerCount: Math.max(1, bikeRef?.passengerCount || 1),
          distanceMeters: 500
        };
      }
    }
    this.tripsSubject.next([...newTrips, ...trips]);

    // 4. Reset the bicycle to 0 passengers (4/4 Available Seats!) and 'available' status
    if (bikeIdx > -1) {
      const updatedBike: Bicycle = {
        ...bikes[bikeIdx],
        passengerCount: 0,
        status: 'available',
        activeTripId: undefined,
        speedKmH: 0,
        lastUpdate: 'Just now',
        pickupLocation: lastDestName || bikes[bikeIdx].pickupLocation,
        currentLocation: {
          ...bikes[bikeIdx].currentLocation,
          lat: lastDestLat ?? bikes[bikeIdx].currentLocation.lat,
          lng: lastDestLng ?? bikes[bikeIdx].currentLocation.lng,
          stationName: lastDestName || bikes[bikeIdx].currentLocation.stationName
        }
      };
      bikes[bikeIdx] = updatedBike;
      this.bicyclesSubject.next(bikes);
    }

    this.saveState();
  }

  public skipPassenger(queueId: string): void {
    const queues = [...this.queuesSubject.value];
    const index = queues.findIndex(q => q.id === queueId);
    if (index === -1) return;

    const entry = { ...queues[index] };
    entry.status = 'skipped';
    queues[index] = entry;

    this.recalculatePositions(queues, entry.pickupLocationId);
    this.queuesSubject.next(queues);
    this.refreshLocationWaitingCounts(queues);
    this.saveState();
  }

  private recalculatePositions(queues: QueueEntry[], pickupId: string): void {
    let pos = 1;
    for (const q of queues) {
      if (q.pickupLocationId === pickupId && q.status === 'waiting') {
        q.position = pos;
        q.estimatedWaitMinutes = pos * 3;
        pos++;
      }
    }
  }

  private refreshLocationWaitingCounts(queues: QueueEntry[]): void {
    const locations = [...this.locationsSubject.value];
    for (const loc of locations) {
      loc.waitingCount = queues.filter(q => q.pickupLocationId === loc.id && (q.status === 'waiting' || q.status === 'called')).length;
    }
    this.locationsSubject.next(locations);
  }

  // --- GPS Campus Location Mapping & Management ---

  public checkForDuplicateLocation(name: string, lat: number, lng: number): {
    isDuplicate: boolean;
    existingLocation?: CampusLocation;
    distanceMeters?: number;
    reason?: string;
  } {
    const list = this.locationsSubject.value.filter(l => l.status === 'approved' || !l.status);
    const cleanName = name.trim().toLowerCase();

    for (const loc of list) {
      const locClean = loc.name.trim().toLowerCase();
      const dist = this.calculateHaversineMeters(lat, lng, loc.coordinates.lat, loc.coordinates.lng);

      if (dist < 25) {
        return {
          isDuplicate: true,
          existingLocation: loc,
          distanceMeters: Math.round(dist),
          reason: `Napakalapit sa nakarehistrong gusali na '${loc.name}' (~${Math.round(dist)}m ang distansya).`
        };
      }

      if (cleanName.length >= 4 && (locClean.includes(cleanName) || cleanName.includes(locClean))) {
        return {
          isDuplicate: true,
          existingLocation: loc,
          distanceMeters: Math.round(dist),
          reason: `May katulad na pangalan sa umiiral nang lokasyon na '${loc.name}'.`
        };
      }
    }

    return { isDuplicate: false };
  }

  public async proposeCampusLocation(dto: CreateLocationProposalDto): Promise<{
    success: boolean;
    location: CampusLocation;
    message: string;
    duplicateWarning?: string;
  }> {
    const isInsideCampus = PickupLocationService.isInsideCampusBoundary(dto.latitude, dto.longitude);
    if (!isInsideCampus) {
      throw new Error('Nasa labas ng campus boundary ng NEUST Sumacab ang napiling GPS location.');
    }

    const dupCheck = this.checkForDuplicateLocation(dto.name, dto.latitude, dto.longitude);

    const isDirectAdmin = dto.submittedByRole === 'admin';
    const status: CampusLocationStatus = isDirectAdmin ? 'approved' : 'pending';
    const locationUid = 'loc-custom-' + Date.now();

    const newLoc: CampusLocation = {
      id: locationUid,
      code: dto.code || dto.name.substring(0, 4).toUpperCase(),
      name: dto.name.trim(),
      buildingNumber: dto.buildingNumber?.trim() || '',
      category: dto.category,
      coordinates: {
        x: 50.0,
        y: 50.0,
        lat: Number(dto.latitude.toFixed(7)),
        lng: Number(dto.longitude.toFixed(7))
      },
      pickupCoordinates: dto.pickupLatitude && dto.pickupLongitude ? {
        lat: Number(dto.pickupLatitude.toFixed(7)),
        lng: Number(dto.pickupLongitude.toFixed(7))
      } : {
        lat: Number(dto.latitude.toFixed(7)),
        lng: Number(dto.longitude.toFixed(7))
      },
      dropoffCoordinates: dto.dropoffLatitude && dto.dropoffLongitude ? {
        lat: Number(dto.dropoffLatitude.toFixed(7)),
        lng: Number(dto.dropoffLongitude.toFixed(7))
      } : {
        lat: Number(dto.latitude.toFixed(7)),
        lng: Number(dto.longitude.toFixed(7))
      },
      gpsAccuracy: dto.gpsAccuracy,
      isPickupActive: dto.isPickupAllowed !== false,
      isDropoffAllowed: dto.isDropoffAllowed !== false,
      status,
      submittedBy: dto.submittedBy || 'Campus User',
      submittedByRole: dto.submittedByRole || 'driver',
      submittedAt: new Date().toISOString(),
      approvedBy: isDirectAdmin ? dto.submittedBy : undefined,
      approvedAt: isDirectAdmin ? new Date().toISOString() : undefined,
      waitingCount: 0,
      description: dto.description?.trim() || '',
      icon: dto.category === 'academic' ? 'school-outline' : (dto.category === 'recreation' ? 'trophy-outline' : 'business-outline')
    };

    const currentList = [...this.locationsSubject.value];
    this.locationsSubject.next([newLoc, ...currentList]);
    this.saveState();

    // Send asynchronously to PHP XAMPP backend if available
    try {
      fetch('http://localhost/neust-bike-api/propose_campus_location.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dto,
          locationUid
        })
      }).catch(() => {});
    } catch (e) {}

    return {
      success: true,
      location: newLoc,
      message: isDirectAdmin 
        ? `Matagumpay na naitala at naaprubahan ang ${newLoc.name}.`
        : `Naisumite na ang ${newLoc.name}. Hinihintay na lamang ang pagsusuri at approval ng Administrator.`,
      duplicateWarning: dupCheck.isDuplicate ? dupCheck.reason : undefined
    };
  }

  public approveCampusLocation(
    id: string,
    adminName: string,
    adjustedCoords?: { lat: number; lng: number; pickupLat?: number; pickupLng?: number }
  ): void {
    const list = this.locationsSubject.value.map(loc => {
      if (loc.id === id) {
        return {
          ...loc,
          status: 'approved' as CampusLocationStatus,
          approvedBy: adminName,
          approvedAt: new Date().toISOString(),
          coordinates: adjustedCoords ? {
            ...loc.coordinates,
            lat: adjustedCoords.lat,
            lng: adjustedCoords.lng
          } : loc.coordinates,
          pickupCoordinates: adjustedCoords?.pickupLat && adjustedCoords?.pickupLng ? {
            lat: adjustedCoords.pickupLat,
            lng: adjustedCoords.pickupLng
          } : loc.pickupCoordinates
        };
      }
      return loc;
    });

    this.locationsSubject.next(list);
    this.saveState();

    try {
      fetch('http://localhost/neust-bike-api/review_campus_location.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationUid: id,
          action: 'approve',
          adminName,
          ...(adjustedCoords ? {
            latitude: adjustedCoords.lat,
            longitude: adjustedCoords.lng,
            pickupLatitude: adjustedCoords.pickupLat,
            pickupLongitude: adjustedCoords.pickupLng
          } : {})
        })
      }).catch(() => {});
    } catch (e) {}
  }

  public rejectCampusLocation(id: string, adminName: string, reason?: string): void {
    const list = this.locationsSubject.value.map(loc => {
      if (loc.id === id) {
        return {
          ...loc,
          status: 'rejected' as CampusLocationStatus,
          rejectionReason: reason || 'Hindi pasok sa criteria ng unibersidad',
          approvedBy: adminName,
          approvedAt: new Date().toISOString()
        };
      }
      return loc;
    });

    this.locationsSubject.next(list);
    this.saveState();

    try {
      fetch('http://localhost/neust-bike-api/review_campus_location.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationUid: id,
          action: 'reject',
          adminName,
          rejectionReason: reason
        })
      }).catch(() => {});
    } catch (e) {}
  }

  public updateCampusLocation(id: string, updates: Partial<CampusLocation>): void {
    const list = this.locationsSubject.value.map(loc => {
      if (loc.id === id) {
        return { ...loc, ...updates };
      }
      return loc;
    });

    this.locationsSubject.next(list);
    this.saveState();

    try {
      fetch('http://localhost/neust-bike-api/review_campus_location.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationUid: id,
          action: 'edit',
          name: updates.name,
          latitude: updates.coordinates?.lat,
          longitude: updates.coordinates?.lng,
          pickupLatitude: updates.pickupCoordinates?.lat,
          pickupLongitude: updates.pickupCoordinates?.lng,
          description: updates.description
        })
      }).catch(() => {});
    } catch (e) {}
  }

  public deactivateCampusLocation(id: string): void {
    const list = this.locationsSubject.value.map(loc => {
      if (loc.id === id) {
        return { ...loc, status: 'inactive' as CampusLocationStatus };
      }
      return loc;
    });

    this.locationsSubject.next(list);
    this.saveState();

    try {
      fetch('http://localhost/neust-bike-api/review_campus_location.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationUid: id,
          action: 'deactivate'
        })
      }).catch(() => {});
    } catch (e) {}
  }

  // --- Trip Operations ---

  public startTrip(bikeNumber: string, pickup: string, destination: string): Trip | null {
    const bicycles = [...this.bicyclesSubject.value];
    const bikeIndex = bicycles.findIndex(b => b.bikeNumber === bikeNumber);
    if (bikeIndex === -1) return null;

    const bike = { ...bicycles[bikeIndex] };
    if (bike.status === 'maintenance') {
      return null;
    }

    const tripId = 'trip-' + Date.now();
    const tripNumber = `TRIP-${Math.floor(100 + Math.random() * 900)}`;
    const newTrip: Trip = {
      id: tripId,
      tripNumber,
      bicycleId: bike.id,
      bicycleNumber: bike.bikeNumber,
      driverId: bike.driverId,
      driverName: bike.driverName,
      driverPhoto: bike.driverPhoto,
      pickupLocation: pickup,
      destination: destination,
      passengerCount: bike.passengerCount,
      maxCapacity: bike.maxCapacity,
      status: 'active',
      startTime: new Date().toISOString(),
      passengers: []
    };

    bike.status = 'on_trip';
    bike.currentDestination = destination;
    bike.pickupLocation = pickup;
    bike.activeTripId = tripId;
    bicycles[bikeIndex] = bike;
    this.bicyclesSubject.next(bicycles);

    const trips = [newTrip, ...this.tripsSubject.value];
    this.tripsSubject.next(trips);
    this.saveState();
    return newTrip;
  }

  public endTrip(bikeNumber: string): Trip | null {
    const bicycles = [...this.bicyclesSubject.value];
    const bikeIndex = bicycles.findIndex(b => b.bikeNumber === bikeNumber);
    if (bikeIndex === -1) return null;

    const bike = { ...bicycles[bikeIndex] };
    const trips = [...this.tripsSubject.value];
    const tripIndex = trips.findIndex(t => t.bicycleNumber === bikeNumber && t.status === 'active');
    
    let completedTrip: Trip | null = null;
    if (tripIndex !== -1) {
      completedTrip = { ...trips[tripIndex] };
      completedTrip.status = 'completed';
      completedTrip.endTime = new Date().toISOString();
      completedTrip.passengerCount = bike.passengerCount;
      completedTrip.distanceMeters = Math.floor(450 + Math.random() * 400);
      trips[tripIndex] = completedTrip;
      this.tripsSubject.next(trips);
    }

    // Mark boarded queues as completed
    const queues = [...this.queuesSubject.value];
    for (const q of queues) {
      if (q.assignedBikeNumber === bikeNumber && q.status === 'boarded') {
        q.status = 'completed';
        q.completedAt = new Date().toISOString();
      }
    }
    this.queuesSubject.next(queues);

    // Reset bicycle to available with 0 passengers at arrival destination
    bike.status = 'available';
    bike.passengerCount = 0;
    bike.activeTripId = undefined;
    bike.pickupLocation = bike.currentDestination;
    bicycles[bikeIndex] = bike;
    this.bicyclesSubject.next(bicycles);

    this.saveState();
    return completedTrip;
  }

  // --- Maintenance Operations ---

  public submitMaintenanceReport(report: Partial<MaintenanceReport>): MaintenanceReport {
    const reports = [...this.maintenanceSubject.value];
    const nextNum = reports.length + 1;
    const reportNumber = `MNT-${String(nextNum).padStart(3, '0')}`;

    const newReport: MaintenanceReport = {
      id: 'mnt-' + Date.now(),
      reportNumber,
      bicycleId: report.bicycleId || 'bike-003',
      bicycleNumber: report.bicycleNumber || 'BIKE-003',
      driverId: report.driverId || 'driver-003',
      driverName: report.driverName || 'Juan Dela Cruz',
      issueType: report.issueType || 'Other',
      description: report.description || 'Routine maintenance required',
      photoUrl: report.photoUrl,
      status: 'submitted',
      reportedAt: new Date().toISOString()
    };

    // Mark the bike as under maintenance immediately
    if (report.bicycleNumber) {
      this.setBicycleStatus(report.bicycleNumber, 'maintenance');
    }

    reports.unshift(newReport);
    this.maintenanceSubject.next(reports);
    this.saveState();
    return newReport;
  }

  public updateMaintenanceStatus(reportId: string, status: MaintenanceReport['status'], notes?: string): void {
    const reports = [...this.maintenanceSubject.value];
    const index = reports.findIndex(r => r.id === reportId);
    if (index === -1) return;

    const report = { ...reports[index], status, adminNotes: notes || reports[index].adminNotes };
    if (status === 'resolved') {
      report.resolvedAt = new Date().toISOString();
      // Restore bicycle to available
      this.setBicycleStatus(report.bicycleNumber, 'available');
    } else if (status === 'under_maintenance') {
      this.setBicycleStatus(report.bicycleNumber, 'maintenance');
    }
    reports[index] = report;
    this.maintenanceSubject.next(reports);
    this.saveState();
  }

  // --- Announcements & Notifications ---

  public createAnnouncement(announcement: Partial<ServiceAnnouncement>): ServiceAnnouncement {
    const list = [...this.announcementsSubject.value];
    const newAnc: ServiceAnnouncement = {
      id: 'anc-' + Date.now(),
      title: announcement.title || 'Campus Service Notice',
      content: announcement.content || '',
      type: announcement.type || 'info',
      targetAudience: announcement.targetAudience || 'all',
      publishedAt: 'Just now',
      author: announcement.author || 'Admin',
      isActive: true
    };
    list.unshift(newAnc);
    this.announcementsSubject.next(list);

    // Broadcast notification
    this.addNotification({
      userId: 'all',
      title: newAnc.title,
      message: newAnc.content,
      type: 'system'
    });

    this.saveState();
    return newAnc;
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): void {
    const list = [...this.notificationsSubject.value];
    // Prevent duplicate notification bursts (e.g. repeated driver accepted spam)
    if (list.length > 0 && list[0].title === notif.title && list[0].message === notif.message) {
      return;
    }

    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      timestamp: 'Just now',
      isRead: false,
      ...notif
    };
    list.unshift(newNotif);
    this.notificationsSubject.next(list);
    this.saveState();

    // Trigger Modern In-App Heads-Up Banner + Mobile Phone Push/Local Notification + Haptic + Chime
    this.notificationService.notify(
      notif.title,
      notif.message,
      (notif.type as any) || 'system'
    );
  }

  public getNotificationsForUser(userId?: string, role?: string): AppNotification[] {
    const all = this.notificationsSubject.value || [];
    return all.filter(n => {
      // 1. Direct match with current user id
      if (userId && n.userId === userId) return true;
      // 2. Broadcast to all users
      if (n.userId === 'all') return true;
      // 3. Explicit targetRole
      if ((n as any).targetRole) {
        return (n as any).targetRole === role || (n as any).targetRole === 'all';
      }
      // 4. Role-based fallback heuristics
      if (role === 'driver') {
        if (n.type === 'maintenance') return true;
        if (n.userId && n.userId.startsWith('driver-')) return true;
        if (n.title.toLowerCase().includes('booking') || n.title.toLowerCase().includes('sakay') || n.title.toLowerCase().includes('pasada')) return true;
        return false;
      } else if (role === 'student') {
        if (n.type === 'maintenance') return false; // Students don't need mechanic work orders
        if (n.userId && n.userId.startsWith('student-')) return true;
        if (n.type === 'queue' || n.type === 'trip') return n.userId === userId;
        return n.type === 'system';
      } else if (role === 'admin') {
        return true; // Admin oversees all
      }
      return n.type === 'system';
    });
  }

  public markNotificationsAsReadForUser(userId?: string, role?: string): void {
    const list = this.notificationsSubject.value.map(n => {
      const isTarget = (userId && n.userId === userId) || n.userId === 'all' || (role && (n as any).targetRole === role);
      return isTarget ? { ...n, isRead: true } : n;
    });
    this.notificationsSubject.next(list);
    this.saveState();
  }

  public markNotificationsAsRead(): void {
    const list = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(list);
    this.saveState();
  }

  // =========================================================================
  // JOYRIDE-STYLE ENHANCED BOOKING & DRIVER DISPATCH ENGINE
  // =========================================================================

  public calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  public getBookingById(bookingId: string): BookingRequest | undefined {
    this.syncBookingsFromStorage();
    return this.bookingsSubject.value.find(b => b.id === bookingId);
  }

  public getActiveBookingForStudent(studentId: string): BookingRequest | undefined {
    return this.bookingsSubject.value.find(
      b => (b.studentId === studentId || b.studentId === 'student-001') &&
           b.status !== 'completed' && b.status !== 'cancelled'
    );
  }

  public getActiveBookingForDriver(driverId: string, bikeNumber?: string): BookingRequest | undefined {
    return this.bookingsSubject.value.find(
      b => ((driverId && b.assignedDriverId === driverId) || (bikeNumber && b.assignedBikeNumber === bikeNumber)) &&
           (b.status === 'accepted' || b.status === 'driver_arriving' || b.status === 'driver_arrived' || b.status === 'in_progress')
    );
  }

  /**
   * Returns all online & operational pedicabs that have enough available seats (`maxCapacity - passengerCount >= neededSeats`)
   * and have not declined this booking.
   */
  public getEligibleBicyclesForBooking(
    neededSeats: number,
    pickupLat = 15.444889,
    pickupLng = 120.940417,
    rejectedDriverIds: string[] = [],
    rejectedBikeNumbers: string[] = [],
    preferredBikeNumber?: string
  ): Bicycle[] {
    const bikes = this.bicyclesSubject.value || [];
    const reqSeats = Math.max(1, Math.min(4, neededSeats || 1));

    const eligible = bikes
      .filter(b => {
        if (b.status === 'offline' || b.status === 'maintenance' || b.status === 'full') {
          return false;
        }
        // Check if pedicab already has an active accepted booking
        if (this.getActiveBookingForDriver(b.driverId, b.bikeNumber)) {
          return false;
        }
        // Check if driver or pedicab already rejected this booking
        if (rejectedDriverIds.includes(b.driverId) || rejectedBikeNumbers.includes(b.bikeNumber)) {
          return false;
        }
        // Seat capacity check: e.g. if passenger booked 4 seats, pedicab MUST have 4 available seats (4 - 0 = 4)
        const availableSeats = Math.max(0, (b.maxCapacity || 4) - (b.passengerCount || 0));
        return availableSeats >= reqSeats;
      })
      .map(b => ({
        bike: b,
        isPreferred: preferredBikeNumber ? b.bikeNumber === preferredBikeNumber : false,
        dist: this.calculateHaversineMeters(pickupLat, pickupLng, b.currentLocation.lat, b.currentLocation.lng)
      }))
      .sort((a, b) => {
        if (a.isPreferred && !b.isPreferred) return -1;
        if (!a.isPreferred && b.isPreferred) return 1;
        return a.dist - b.dist;
      });

    return eligible.map(item => item.bike);
  }

  /**
   * Returns the incoming booking request for a specific driver/pedicab.
   * Implements Capacity-Matched Multi-Driver Broadcast:
   * - If passenger books 4 seats, ALL online pedicabs with 4 available seats see the popup simultaneously!
   * - Pedicabs with fewer available seats than `booking.passengerCount` will NOT get the popup.
   */
  public getIncomingRequestForDriver(driverId?: string, bikeNumber?: string): BookingRequest | undefined {
    const bikes = this.bicyclesSubject.value || [];
    const myBike = bikes.find(
      b => (bikeNumber && b.bikeNumber === bikeNumber) || (driverId && b.driverId === driverId)
    );

    if (!myBike || myBike.status === 'offline' || myBike.status === 'maintenance') {
      return undefined;
    }

    // Driver already busy with an accepted booking
    if (this.getActiveBookingForDriver(driverId || myBike.driverId, myBike.bikeNumber)) {
      return undefined;
    }

    const myAvailableSeats = Math.max(0, (myBike.maxCapacity || 4) - (myBike.passengerCount || 0));
    if (myAvailableSeats <= 0) {
      return undefined;
    }

    const allSearching = this.bookingsSubject.value.filter(b => {
      if (b.status !== 'searching') return false;
      // Already claimed by a driver in the paunahan race
      if (b.assignedDriverId || b.assignedBikeNumber) return false;
      // Rejected by this driver or this pedicab
      if (driverId && b.rejectedDriverIds?.includes(driverId)) return false;
      if (myBike.driverId && b.rejectedDriverIds?.includes(myBike.driverId)) return false;
      if (myBike.bikeNumber && b.rejectedBikeNumbers?.includes(myBike.bikeNumber)) return false;

      // Crucial capacity filter: only show popup if this pedicab has enough open seats for the passenger's booking!
      const neededSeats = Math.max(1, Math.min(4, b.passengerCount || 1));
      if (myAvailableSeats < neededSeats) return false;

      // If targetDriverId is set specifically, check match; otherwise broadcast to all eligible capacity-matched pedicabs
      if (b.targetDriverId && b.targetDriverId !== driverId && b.targetDriverId !== myBike.driverId) {
        return false;
      }

      return true;
    });

    if (allSearching.length === 0) return undefined;
    return allSearching[0];
  }

  /**
   * Broadcasts a booking simultaneously to ALL online pedicabs that have enough available seats
   * (`maxCapacity - passengerCount >= booking.passengerCount`) so they can race ("paunahan") to accept!
   */
  public dispatchToNearestAvailableDriver(booking: BookingRequest, preferredBikeNumber?: string): BookingRequest {
    const rejectedDrivers = booking.rejectedDriverIds || [];
    const rejectedBikes = booking.rejectedBikeNumbers || [];
    const neededSeats = Math.max(1, Math.min(4, booking.passengerCount || 1));

    const eligibleBikes = this.getEligibleBicyclesForBooking(
      neededSeats,
      booking.pickupLat,
      booking.pickupLng,
      rejectedDrivers,
      rejectedBikes,
      preferredBikeNumber
    );

    if (eligibleBikes.length > 0) {
      booking.eligibleBikeNumbers = eligibleBikes.map(b => b.bikeNumber);
      booking.eligibleDriverIds = eligibleBikes.map(b => b.driverId);
      booking.notifiedDriversCount = eligibleBikes.length;
      // Keep targetDriverId and assignedBikeNumber undefined while searching so ALL eligible pedicabs get the popup!
      booking.targetDriverId = undefined;
      booking.assignedDriverId = undefined;
      booking.assignedBikeNumber = undefined;
      booking.requestExpiresAt = Date.now() + 90000; // 90s countdown window
      booking.status = 'searching';
    } else {
      booking.eligibleBikeNumbers = [];
      booking.eligibleDriverIds = [];
      booking.notifiedDriversCount = 0;
      booking.targetDriverId = undefined;
      booking.status = 'no_driver_found';
    }

    return booking;
  }

  /**
   * Step 1-3: Student confirms booking -> Broadcasts to all pedicabs with >= passengerCount available seats!
   */
  public createTransportationBooking(
    student: { id: string; name: string; idNumber: string; phone?: string; avatarUrl?: string },
    pickup: { name: string; lat: number; lng: number; instructions?: string; locationId?: string },
    destination: { name: string; lat: number; lng: number; locationId?: string },
    passengerCount: number = 1,
    preferredBikeNumber?: string
  ): BookingRequest {
    this.syncBookingsFromStorage();
    const bookings = [...this.bookingsSubject.value];

    // If student already has an accepted/in-progress booking, return it;
    // if they had an old 'searching' booking, mark the old one cancelled so their new booking broadcasts cleanly!
    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      if (b.studentId === student.id) {
        if (b.status === 'accepted' || b.status === 'driver_arriving' || b.status === 'driver_arrived' || b.status === 'in_progress') {
          return b;
        }
        if (b.status === 'searching' || b.status === 'pending') {
          bookings[i] = { ...b, status: 'cancelled', updatedAt: new Date().toISOString() };
        }
      }
    }

    const distMeters = Math.max(100, this.calculateHaversineMeters(pickup.lat, pickup.lng, destination.lat, destination.lng));
    const estMinutes = Math.max(2, Math.round(distMeters / 150)); // ~150 meters/min for campus e-trike

    const nowStr = new Date().toISOString();
    const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;

    const pax = Math.max(1, Math.min(4, passengerCount));
    const currentFarePerHead = this.getFarePerHead();
    const calculatedFare = pax * currentFarePerHead;

    let newBooking: BookingRequest = {
      id: 'bk-' + Date.now(),
      bookingNumber,
      studentId: student.id,
      studentName: student.name,
      studentPhoto: student.avatarUrl,
      studentIdNumber: student.idNumber,
      studentPhone: student.phone || '0927-123-4567',
      passengerCount: pax,
      pickupLocationId: pickup.locationId,
      pickupName: pickup.name,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      pickupInstructions: pickup.instructions,
      destinationId: destination.locationId,
      destinationName: destination.name,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      distanceMeters: distMeters,
      estimatedMinutes: estMinutes,
      fareAmount: calculatedFare, // Standard Campus Fare (₱10/head default, editable by Admin)
      status: 'searching',
      createdAt: nowStr,
      updatedAt: nowStr,
      rejectedDriverIds: [],
      rejectedBikeNumbers: []
    };

    // Broadcast to all online pedicabs that have at least `pax` available seats
    newBooking = this.dispatchToNearestAvailableDriver(newBooking, preferredBikeNumber);

    bookings.unshift(newBooking);
    this.bookingsSubject.next(bookings);
    this.saveState();

    if (newBooking.eligibleBikeNumbers && newBooking.eligibleBikeNumbers.length > 0) {
      const isFil = this.languageService.currentLanguage === 'fil';
      const bikesLabel = newBooking.eligibleBikeNumbers.join(', ');
      this.addNotification({
        userId: 'all',
        title: isFil ? `🔔 Bagong Sakay Request (${pax} Pasahero)!` : `🔔 New Ride Request (${pax} Pax)!`,
        message: isFil
          ? `Hiling ni ${newBooking.studentName} sa ${newBooking.pickupName} (${pax} pasahero, ₱${newBooking.fareAmount}.00). Broadcasted sa: ${bikesLabel} (Paunahan sa pag-accept!).`
          : `${newBooking.studentName} requested a pickup at ${newBooking.pickupName} (${pax} pax, ₱${newBooking.fareAmount}.00). Broadcasted to: ${bikesLabel} (First to accept wins!).`,
        type: 'driver'
      });
    }

    return newBooking;
  }

  /**
   * Step 4: Driver responds to incoming request (Accept or Reject)
   * Implements Atomic First-Come-First-Served ("Paunahan") Lock:
   * - Syncs from localStorage first to ensure no other driver tab accepted 1ms earlier.
   * - Only the FIRST driver to accept claims the booking (`status === 'searching' && !assignedDriverId`).
   * - Immediately broadcasts `BOOKING_CLAIMED` so all other drivers' popups close and notify them who won.
   */
  public driverRespondBooking(
    bookingId: string,
    driver: { id: string; name: string; phone?: string; photo?: string; bikeNumber: string },
    action: 'accept' | 'reject'
  ): boolean {
    // 1. Pull latest cross-tab state before checking lock
    this.syncBookingsFromStorage();

    const bookings = [...this.bookingsSubject.value];
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return false;

    const booking = { ...bookings[idx] };

    // 2. Atomic Paunahan Guard: Can only accept/reject if still 'searching' and unclaimed
    if (booking.status !== 'searching' || booking.assignedDriverId || booking.assignedBikeNumber) {
      return false;
    }

    const nowStr = new Date().toISOString();

    if (action === 'accept') {
      const paxCount = Math.max(1, Math.min(4, booking.passengerCount || 1));

      // Verify this pedicab still has enough available seats
      const bikes = [...this.bicyclesSubject.value];
      const targetBikeNum = (driver.bikeNumber || 'BIKE-003').trim().toUpperCase();
      let bIdx = bikes.findIndex(
        b => b.bikeNumber.trim().toUpperCase() === targetBikeNum || (driver.id && b.driverId === driver.id)
      );
      if (bIdx === -1) {
        const newBike: Bicycle = {
          id: `bike-active-${targetBikeNum.toLowerCase()}`,
          bikeNumber: targetBikeNum,
          driverId: driver.id,
          driverName: driver.name,
          driverPhoto: driver.photo || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
          driverPhone: driver.phone || '0917-555-0101',
          passengerCount: 0,
          maxCapacity: 4,
          status: 'available',
          currentLocation: {
            lat: booking.pickupLat || 15.444889,
            lng: booking.pickupLng || 120.940417,
            x: 75,
            y: 82,
            stationName: booking.pickupName || 'Terminal'
          },
          currentDestination: booking.destinationName,
          pickupLocation: booking.pickupName,
          heading: 0,
          speedKmH: 0,
          lastUpdate: 'Just now',
          batteryPercent: 100
        };
        bikes.push(newBike);
        bIdx = bikes.length - 1;
      }

      if (bIdx > -1) {
        const checkBike = bikes[bIdx];
        const freeSeats = Math.max(0, (checkBike.maxCapacity || 4) - (checkBike.passengerCount || 0));
        if (freeSeats < paxCount && checkBike.passengerCount > 0) {
          return false;
        }
      }

      // 3. Winner claims the booking atomically!
      booking.status = 'driver_arriving';
      booking.assignedDriverId = driver.id;
      booking.assignedDriverName = driver.name;
      booking.assignedDriverPhone = driver.phone || '0917-555-0101';
      booking.assignedDriverPhoto = driver.photo;
      booking.assignedBikeNumber = driver.bikeNumber;
      booking.targetDriverId = undefined;
      booking.requestExpiresAt = undefined;
      booking.updatedAt = nowStr;

      // 4. Atomically deduct seats on the winning pedicab (e.g. 4 pax booked -> 4/4 boarded, 0 open seats)
      if (bIdx > -1) {
        const bike = { ...bikes[bIdx] };
        const maxCap = bike.maxCapacity || 4;
        const nextPax = Math.min(maxCap, (bike.passengerCount || 0) + paxCount);
        bike.passengerCount = nextPax;
        bike.status = nextPax >= maxCap ? 'full' : 'on_trip';
        bike.currentDestination = booking.destinationName;
        bike.pickupLocation = booking.pickupName;
        bike.lastUpdate = 'Just now';
        bikes[bIdx] = bike;
        this.bicyclesSubject.next(bikes);
      }

      bookings[idx] = booking;
      this.bookingsSubject.next(bookings);

      const claimNotice = {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        studentName: booking.studentName,
        claimedByDriverId: driver.id,
        claimedByDriverName: driver.name,
        claimedByBikeNumber: driver.bikeNumber,
        timestamp: Date.now()
      };
      this.lastClaimedBookingNotice$.next(claimNotice);

      const isFil = this.languageService.currentLanguage === 'fil';
      this.addNotification({
        userId: booking.studentId,
        title: isFil ? '🚴 Tinanggap ang Iyong Booking!' : '🚴 Driver Accepted Your Ride!',
        message: isFil
          ? `Tinanggap ni Kuya ${driver.name} (${driver.bikeNumber}) ang biyahe at papunta na sa ${booking.pickupName} para sa ${paxCount} pasahero.`
          : `Kuya ${driver.name} (${driver.bikeNumber}) accepted your booking and is en route to ${booking.pickupName} for ${paxCount} passenger(s).`,
        type: 'trip'
      });

      this.saveState();

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'BOOKING_CLAIMED',
          payload: claimNotice,
          state: this.getStateSnapshot()
        });
      }

      return true;
    } else {
      // Reject action by this specific driver/pedicab
      const rejectedDrivers = [...(booking.rejectedDriverIds || [])];
      if (driver.id && !rejectedDrivers.includes(driver.id)) {
        rejectedDrivers.push(driver.id);
      }
      const rejectedBikes = [...(booking.rejectedBikeNumbers || [])];
      if (driver.bikeNumber && !rejectedBikes.includes(driver.bikeNumber)) {
        rejectedBikes.push(driver.bikeNumber);
      }

      booking.rejectedDriverIds = rejectedDrivers;
      booking.rejectedBikeNumbers = rejectedBikes;

      // Re-evaluate remaining eligible pedicabs (popup stays open for other eligible drivers!)
      const redispatched = this.dispatchToNearestAvailableDriver(booking);
      redispatched.updatedAt = nowStr;
      bookings[idx] = redispatched;
      this.bookingsSubject.next(bookings);
      this.saveState();
      return true;
    }
  }

  /**
   * Driver timeout handler: Refreshes broadcast eligible list while drivers are available
   */
  public checkAndHandleBookingTimeouts(): void {
    const now = Date.now();
    const bookings = [...this.bookingsSubject.value];
    let changed = false;

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      if (b.status === 'searching') {
        // Remote XAMPP bookings are controlled by the server/drivers on other phones;
        // do not locally flip them to 'no_driver_found' just because local simulated bikes are busy.
        if (this.remoteBookingIds.has(b.id)) {
          if (b.requestExpiresAt && b.requestExpiresAt <= now) {
            bookings[i] = {
              ...b,
              requestExpiresAt: now + 90000,
              updatedAt: new Date().toISOString()
            };
            changed = true;
          }
          continue;
        }

        // Keep eligible bikes list dynamically updated in case a pedicab freed up seats or went online
        const neededSeats = Math.max(1, Math.min(4, b.passengerCount || 1));
        const currentEligible = this.getEligibleBicyclesForBooking(
          neededSeats,
          b.pickupLat,
          b.pickupLng,
          b.rejectedDriverIds || [],
          b.rejectedBikeNumbers || []
        );
        const currentBikeNums = currentEligible.map(bike => bike.bikeNumber);
        const prevBikeNums = b.eligibleBikeNumbers || [];

        if (currentBikeNums.join(',') !== prevBikeNums.join(',')) {
          bookings[i] = {
            ...b,
            eligibleBikeNumbers: currentBikeNums,
            eligibleDriverIds: currentEligible.map(bike => bike.driverId),
            notifiedDriversCount: currentEligible.length,
            status: currentEligible.length > 0 ? 'searching' : 'no_driver_found',
            updatedAt: new Date().toISOString()
          };
          changed = true;
        } else if (b.requestExpiresAt && b.requestExpiresAt <= now) {
          if (currentEligible.length > 0) {
            // Renew countdown window so real drivers can still accept
            bookings[i] = {
              ...b,
              requestExpiresAt: now + 90000,
              updatedAt: new Date().toISOString()
            };
            changed = true;
          } else {
            bookings[i] = {
              ...b,
              status: 'no_driver_found',
              updatedAt: new Date().toISOString()
            };
            changed = true;
          }
        }
      }
    }

    if (changed) {
      this.bookingsSubject.next(bookings);
      this.saveState();
    }
  }

  /**
   * Advances trip status: accepted -> driver_arriving -> driver_arrived -> in_progress -> completed
   */
  public updateBookingStatus(bookingId: string, newStatus: BookingStatus): void {
    const bookings = [...this.bookingsSubject.value];
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return;

    const booking = { ...bookings[idx] };
    booking.status = newStatus;
    booking.updatedAt = new Date().toISOString();

    if (newStatus === 'driver_arrived') {
      booking.distanceMeters = 0;
      booking.estimatedMinutes = 0;
      const isFil = this.languageService.currentLanguage === 'fil';
      this.addNotification({
        userId: booking.studentId,
        title: isFil ? '📍 Nandiyan na ang Driver sa Sakayan!' : '📍 Driver Has Arrived at Pickup!',
        message: isFil
          ? `Nandito na si Kuya ${booking.assignedDriverName || 'Driver'} (${booking.assignedBikeNumber}) sa ${booking.pickupName}! Sakay na.`
          : `Kuya ${booking.assignedDriverName || 'Driver'} (${booking.assignedBikeNumber}) has arrived at ${booking.pickupName}! Please meet your pedicab.`,
        type: 'trip'
      });
    } else if (newStatus === 'in_progress') {
      this.activeRouteWaypoints.delete(`${booking.id}_arriving`);
      const isFil = this.languageService.currentLanguage === 'fil';
      this.addNotification({
        userId: booking.studentId,
        title: isFil ? '🚀 Nagsimula na ang Biyahe!' : '🚀 Trip In Progress!',
        message: isFil
          ? `Papunta na sa ${booking.destinationName} lulan ng ${booking.assignedBikeNumber}. Ingat sa biyahe!`
          : `Your ride on ${booking.assignedBikeNumber} to ${booking.destinationName} has started. Have a safe trip!`,
        type: 'trip'
      });
    } else if (newStatus === 'completed') {
      booking.distanceMeters = 0;
      booking.estimatedMinutes = 0;
      this.activeRouteWaypoints.delete(`${booking.id}_arriving`);
      this.activeRouteWaypoints.delete(`${booking.id}_in_progress`);

      const droppedPax = Math.max(1, booking.passengerCount || 1);

      // Create trip entry in trips history
      this.tripsSubject.next([
        {
          id: 'trip-' + Date.now(),
          tripNumber: `TRIP-${Date.now().toString().slice(-6)}`,
          bicycleId: booking.assignedBikeId || 'bike-003',
          bicycleNumber: booking.assignedBikeNumber || 'BIKE-003',
          driverId: booking.assignedDriverId || 'driver-001',
          driverName: booking.assignedDriverName || 'Campus Driver',
          driverPhoto: booking.assignedDriverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          pickupLocation: booking.pickupName,
          destination: booking.destinationName,
          passengerCount: droppedPax,
          maxCapacity: 4,
          status: 'completed',
          startTime: booking.createdAt,
          endTime: new Date().toISOString(),
          distanceMeters: booking.distanceMeters || 450,
          passengers: [
            {
              studentId: booking.studentId,
              studentName: booking.studentName,
              queueNumber: booking.bookingNumber,
              destination: booking.destinationName,
              boardedAt: booking.updatedAt
            }
          ]
        },
        ...this.tripsSubject.value
      ]);

      // Release bike seats and return to available (0/4 passengers = 4 available seats when no other active passengers remain)
      if (booking.assignedBikeNumber || booking.assignedDriverId) {
        const bikes = [...this.bicyclesSubject.value];
        const targetBikeNum = (booking.assignedBikeNumber || '').trim().toUpperCase();
        const bIdx = bikes.findIndex(
          b =>
            (targetBikeNum && b.bikeNumber.trim().toUpperCase() === targetBikeNum) ||
            (booking.assignedDriverId && b.driverId === booking.assignedDriverId)
        );
        if (bIdx > -1) {
          const bike = { ...bikes[bIdx] };
          const matchedBikeNum = bike.bikeNumber.trim().toUpperCase();
          const otherActiveBookings = bookings.filter(
            (b, i) => i !== idx &&
              (b.assignedBikeNumber || '').trim().toUpperCase() === matchedBikeNum &&
              (b.status === 'accepted' || b.status === 'driver_arriving' || b.status === 'driver_arrived' || b.status === 'in_progress')
          );
          const boardedQueuesCount = this.queuesSubject.value.filter(
            q => (q.assignedBikeNumber || '').trim().toUpperCase() === matchedBikeNum && q.status === 'boarded'
          ).length;

          const remainingPax = otherActiveBookings.reduce((sum, b) => sum + (b.passengerCount || 1), 0) + boardedQueuesCount;

          bike.passengerCount = remainingPax;
          bike.status = remainingPax === 0 ? 'available' : (remainingPax >= bike.maxCapacity ? 'full' : 'almost_full');
          bike.speedKmH = 0;
          bike.pickupLocation = booking.destinationName;
          bike.currentLocation = {
            ...bike.currentLocation,
            lat: booking.destinationLat || bike.currentLocation.lat,
            lng: booking.destinationLng || bike.currentLocation.lng,
            stationName: booking.destinationName || bike.currentLocation.stationName
          };
          bike.lastUpdate = 'Just now';
          bikes[bIdx] = bike;
          this.bicyclesSubject.next(bikes);
        }
      }

      const isFil = this.languageService.currentLanguage === 'fil';
      this.addNotification({
        userId: booking.studentId,
        title: isFil ? `Naihatid na sa ${booking.destinationName}! 🎉` : `Dropped off at ${booking.destinationName}! 🎉`,
        message: isFil
          ? `Ligtas na nakarating sa ${booking.destinationName} kasama si ${booking.assignedDriverName || 'Driver'} (${booking.assignedBikeNumber}). Salamat sa pagsakay!`
          : `You have arrived safely at ${booking.destinationName} via ${booking.assignedDriverName || 'Driver'} (${booking.assignedBikeNumber}). Thank you for riding NEUST BikeGo!`,
        type: 'trip'
      });
    }

    bookings[idx] = booking;
    this.bookingsSubject.next(bookings);
    this.saveState();
  }

  /**
   * Cancel booking by student or driver
   */
  public cancelTransportationBooking(bookingId: string, reason = 'Cancelled by user'): void {
    this.cancelledBookingIds.add(bookingId);
    const bookings = [...this.bookingsSubject.value];
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return;

    const booking = { ...bookings[idx] };
    const wasAccepted = booking.status === 'accepted' || booking.status === 'driver_arriving' || booking.status === 'driver_arrived' || booking.status === 'in_progress';
    booking.status = 'cancelled';
    booking.updatedAt = new Date().toISOString();
    this.activeRouteWaypoints.delete(`${booking.id}_arriving`);
    this.activeRouteWaypoints.delete(`${booking.id}_in_progress`);

    // Release assigned bike seats if it was already accepted
    if (booking.assignedBikeNumber && wasAccepted) {
      const bikes = [...this.bicyclesSubject.value];
      const bIdx = bikes.findIndex(b => b.bikeNumber === booking.assignedBikeNumber);
      if (bIdx > -1) {
        const bike = { ...bikes[bIdx] };
        const cancelledPax = Math.max(1, booking.passengerCount || 1);
        bike.passengerCount = Math.max(0, bike.passengerCount - cancelledPax);
        bike.status = bike.passengerCount === 0 ? 'available' : 'on_trip';
        bike.lastUpdate = 'Just now';
        bikes[bIdx] = bike;
        this.bicyclesSubject.next(bikes);
      }
    }

    bookings[idx] = booking;
    this.bookingsSubject.next(bookings);
    this.saveState();
  }

  /**
   * Retry booking search when 'no_driver_found'
   */
  public retryTransportationBooking(bookingId: string): void {
    const bookings = [...this.bookingsSubject.value];
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return;

    let booking: BookingRequest = { ...bookings[idx], rejectedDriverIds: [] };
    booking = this.dispatchToNearestAvailableDriver(booking);
    booking.updatedAt = new Date().toISOString();

    bookings[idx] = booking;
    this.bookingsSubject.next(bookings);
    this.saveState();
  }

  /**
   * Driver Online / Offline status toggle
   */
  public setDriverOnlineStatus(bikeNumber: string, isOnline: boolean): void {
    this.setBicycleStatus(bikeNumber, isOnline ? 'available' : 'offline');
  }

  // --- Campus Simulation for Demo ---

  private startCampusSimulation(): void {
    // Dense road waypoints forming a smooth loop through NEUST Sumacab Campus roads:
    // Banaba St -> Pili Ave -> Admin -> Library -> Narra Ave -> CICT -> Gym -> Engineering -> Malunggay Ave -> Back
    const waypoints = [
      { x: 70.0, y: 74.0, lat: 15.445200, lng: 120.940350, heading: 325, road: 'Banaba St (Near Gate)' },
      { x: 64.0, y: 66.0, lat: 15.445750, lng: 120.939850, heading: 315, road: 'Pili Ave / CMBT' },
      { x: 58.0, y: 58.0, lat: 15.446250, lng: 120.939400, heading: 340, road: 'Administration / Pili Ave' },
      { x: 56.0, y: 52.0, lat: 15.446750, lng: 120.939350, heading: 355, road: 'Library / Narra Ave' },
      { x: 58.0, y: 46.0, lat: 15.447400, lng: 120.939550, heading: 15,  road: 'Narra Ave (Central)' },
      { x: 61.0, y: 40.0, lat: 15.448100, lng: 120.939680, heading: 15,  road: 'Narra Ave (Approaching CICT)' },
      { x: 65.4, y: 35.1, lat: 15.448700, lng: 120.939750, heading: 75,  road: 'CICT / Grandstand Loop' },
      { x: 70.0, y: 33.5, lat: 15.448650, lng: 120.940600, heading: 100, road: 'NEUST Gym Road' },
      { x: 73.0, y: 38.0, lat: 15.448150, lng: 120.941050, heading: 165, road: 'Malunggay Ave (North)' },
      { x: 71.0, y: 44.0, lat: 15.447500, lng: 120.940750, heading: 195, road: 'Malunggay Ave / Engineering' },
      { x: 68.0, y: 50.0, lat: 15.446950, lng: 120.940480, heading: 195, road: 'College of Engineering' },
      { x: 69.0, y: 58.0, lat: 15.446200, lng: 120.940350, heading: 185, road: 'Banaba St (Mid)' },
      { x: 71.0, y: 66.0, lat: 15.445600, lng: 120.940380, heading: 180, road: 'Banaba St (South)' }
    ];

    let step = 0;
    this.simulationTimer = setInterval(() => {
      if (!this.isSimulationActive) return;
      step = (step + 1) % waypoints.length;

      const list = [...this.bicyclesSubject.value];
      let updated = false;

      // Real-time GrabFood-style tracking for active bookings
      const activeBookings = [...this.bookingsSubject.value];
      let bookingsChanged = false;
      const assignedBikeNumbers: string[] = [];

      for (let bi = 0; bi < activeBookings.length; bi++) {
        const booking = activeBookings[bi];
        if (booking.assignedBikeNumber) {
          assignedBikeNumbers.push(booking.assignedBikeNumber);

          // If this bike is actively being updated by real hardware GPS from the driver's phone,
          // do NOT overwrite with simulated step coordinates!
          const lastGps = this.activeHardwareGpsBikes.get(booking.assignedBikeNumber);
          if (lastGps && (Date.now() - lastGps) < 25000) {
            continue;
          }
        }

        if (booking.status === 'accepted' || booking.status === 'driver_arriving') {
          const bikeIdx = list.findIndex(b => b.bikeNumber === booking.assignedBikeNumber);
          if (bikeIdx > -1) {
            const b = list[bikeIdx];
            const routeKey = `${booking.id}_arriving`;

            // Snap off-campus corrupted GPS (e.g. > 850m away) to campus terminal
            if (this.calculateHaversineMeters(b.currentLocation.lat, b.currentLocation.lng, 15.4470, 120.9390) > 850) {
              b.currentLocation.lat = 15.444889;
              b.currentLocation.lng = 120.940417;
            }

            if (!this.activeRouteWaypoints.has(routeKey) || (this.activeRouteWaypoints.get(routeKey)?.length || 0) === 0) {
              const res = this.routingService.computeCampusGraphRoute(
                [b.currentLocation.lat, b.currentLocation.lng],
                [booking.pickupLat, booking.pickupLng]
              );
              this.activeRouteWaypoints.set(routeKey, [...res.waypoints]);
            }

            const wps = this.activeRouteWaypoints.get(routeKey)!;
            // Pop waypoints that the pedicab is already within 8m of
            while (wps.length > 1) {
              const dHead = this.calculateHaversineMeters(b.currentLocation.lat, b.currentLocation.lng, wps[0][0], wps[0][1]);
              if (dHead < 8) {
                wps.shift();
              } else {
                break;
              }
            }

            const targetWp = wps[0];
            const distToTarget = this.calculateHaversineMeters(b.currentLocation.lat, b.currentLocation.lng, targetWp[0], targetWp[1]);

            if (wps.length <= 1 && distToTarget < 12) {
              // Reached student pickup location along road network
              b.currentLocation.lat = booking.pickupLat;
              b.currentLocation.lng = booking.pickupLng;
              if (booking.status === 'driver_arriving' || booking.status === 'accepted') {
                booking.status = 'driver_arrived';
                booking.distanceMeters = 0;
                booking.estimatedMinutes = 0;
                bookingsChanged = true;
              }
              this.activeRouteWaypoints.delete(routeKey);
              updated = true;
            } else {
              // Step towards target waypoint strictly following the campus road (~14 meters per tick)
              const stepDist = Math.min(distToTarget, 14);
              const stepRatio = stepDist / Math.max(0.001, distToTarget);
              const nextLat = b.currentLocation.lat + (targetWp[0] - b.currentLocation.lat) * stepRatio;
              const nextLng = b.currentLocation.lng + (targetWp[1] - b.currentLocation.lng) * stepRatio;

              const heading = this.routingService.calculateBearing(
                b.currentLocation.lat,
                b.currentLocation.lng,
                targetWp[0],
                targetWp[1]
              );

              list[bikeIdx] = {
                ...b,
                currentLocation: {
                  ...b.currentLocation,
                  lat: Number(nextLat.toFixed(6)),
                  lng: Number(nextLng.toFixed(6))
                },
                heading: Math.round(heading),
                speedKmH: 14,
                lastUpdate: 'Just now'
              };
              updated = true;

              let remainingDist = distToTarget;
              for (let k = 0; k < wps.length - 1; k++) {
                remainingDist += this.calculateHaversineMeters(wps[k][0], wps[k][1], wps[k + 1][0], wps[k + 1][1]);
              }
              booking.distanceMeters = Math.max(10, Math.round(remainingDist));
              booking.estimatedMinutes = Math.max(1, Math.ceil(booking.distanceMeters / 200));
              bookingsChanged = true;
            }
          }
        } else if (booking.status === 'in_progress') {
          const bikeIdx = list.findIndex(b => b.bikeNumber === booking.assignedBikeNumber);
          if (bikeIdx > -1) {
            const b = list[bikeIdx];
            const routeKey = `${booking.id}_in_progress`;

            if (!this.activeRouteWaypoints.has(routeKey) || (this.activeRouteWaypoints.get(routeKey)?.length || 0) === 0) {
              const res = this.routingService.computeCampusGraphRoute(
                [b.currentLocation.lat, b.currentLocation.lng],
                [booking.destinationLat, booking.destinationLng]
              );
              this.activeRouteWaypoints.set(routeKey, [...res.waypoints]);
            }

            const wps = this.activeRouteWaypoints.get(routeKey)!;
            // Pop waypoints that the pedicab is already within 8m of
            while (wps.length > 1) {
              const dHead = this.calculateHaversineMeters(b.currentLocation.lat, b.currentLocation.lng, wps[0][0], wps[0][1]);
              if (dHead < 8) {
                wps.shift();
              } else {
                break;
              }
            }

            const targetWp = wps[0];
            const distToTarget = this.calculateHaversineMeters(b.currentLocation.lat, b.currentLocation.lng, targetWp[0], targetWp[1]);

            if (wps.length <= 1 && distToTarget < 12) {
              // Reached destination along road network
              b.currentLocation.lat = booking.destinationLat;
              b.currentLocation.lng = booking.destinationLng;
              booking.distanceMeters = 0;
              booking.estimatedMinutes = 0;
              this.activeRouteWaypoints.delete(routeKey);
              bookingsChanged = true;
              updated = true;
            } else {
              // Step towards target waypoint strictly following the campus road (~15 meters per tick)
              const stepDist = Math.min(distToTarget, 15);
              const stepRatio = stepDist / Math.max(0.001, distToTarget);
              const nextLat = b.currentLocation.lat + (targetWp[0] - b.currentLocation.lat) * stepRatio;
              const nextLng = b.currentLocation.lng + (targetWp[1] - b.currentLocation.lng) * stepRatio;

              const heading = this.routingService.calculateBearing(
                b.currentLocation.lat,
                b.currentLocation.lng,
                targetWp[0],
                targetWp[1]
              );

              list[bikeIdx] = {
                ...b,
                currentLocation: {
                  ...b.currentLocation,
                  lat: Number(nextLat.toFixed(6)),
                  lng: Number(nextLng.toFixed(6))
                },
                heading: Math.round(heading),
                speedKmH: 15,
                lastUpdate: 'Just now'
              };
              updated = true;

              let remainingDist = distToTarget;
              for (let k = 0; k < wps.length - 1; k++) {
                remainingDist += this.calculateHaversineMeters(wps[k][0], wps[k][1], wps[k + 1][0], wps[k + 1][1]);
              }
              booking.distanceMeters = Math.max(10, Math.round(remainingDist));
              booking.estimatedMinutes = Math.max(1, Math.ceil(booking.distanceMeters / 200));
              bookingsChanged = true;
            }
          }
        }
      }

      // Animate other unassigned bikes smoothly along default campus route
      for (let i = 0; i < list.length; i++) {
        const bike = list[i];
        if (assignedBikeNumbers.includes(bike.bikeNumber)) continue;
        const lastGps = this.activeHardwareGpsBikes.get(bike.bikeNumber);
        if (lastGps && (Date.now() - lastGps) < 25000) continue;

        if (bike.status === 'on_trip' || bike.status === 'almost_full' || bike.status === 'full') {
          const wpIdx = (step + i * 4) % waypoints.length;
          const wp = waypoints[wpIdx];
          const isRoamingWithSeats = bike.status === 'almost_full' || bike.passengerCount < bike.maxCapacity;
          list[i] = {
            ...bike,
            currentLocation: {
              ...bike.currentLocation,
              x: wp.x,
              y: wp.y,
              lat: wp.lat,
              lng: wp.lng,
              stationName: isRoamingWithSeats ? `Nagroronda • ${wp.road}` : `Bumabyahe • ${wp.road}`
            },
            heading: wp.heading,
            speedKmH: Math.floor(11 + (i % 4)),
            lastUpdate: 'Just now'
          };
          updated = true;
        }
      }

      if (updated) {
        this.bicyclesSubject.next(list);
      }
      if (bookingsChanged) {
        this.bookingsSubject.next(activeBookings);
        this.broadcastUpdate();
      }
    }, 1800);
  }

  public toggleSimulation(active?: boolean): boolean {
    this.isSimulationActive = active !== undefined ? active : !this.isSimulationActive;
    return this.isSimulationActive;
  }

  /**
   * Merge a booking fetched from the XAMPP backend into local state without
   * clobbering local-only fields, and keep seat counts in sync on status changes.
   */
  public syncRemoteBooking(
    remoteBooking: Partial<BookingRequest> & { id: string },
    replaceBookingId?: string
  ): void {
    if (!remoteBooking || !remoteBooking.id) return;
    if (
      this.cancelledBookingIds.has(remoteBooking.id) ||
      (replaceBookingId && this.cancelledBookingIds.has(replaceBookingId))
    ) {
      return;
    }
    this.remoteBookingIds.add(remoteBooking.id);

    const current = [...this.bookingsSubject.getValue()];
    const existingIdx = current.findIndex(
      b => b.id === remoteBooking.id || (replaceBookingId ? b.id === replaceBookingId : false)
    );

    const prevStatus = existingIdx > -1 ? current[existingIdx].status : undefined;

    // Never revert a locally cancelled/completed booking back to an older in-flight status
    if (
      (prevStatus === 'cancelled' || prevStatus === 'completed') &&
      remoteBooking.status &&
      remoteBooking.status !== prevStatus
    ) {
      return;
    }

    if (existingIdx > -1) {
      const existing = current[existingIdx];
      current[existingIdx] = {
        ...existing,
        ...remoteBooking,
        id: remoteBooking.id,
        pickupLat: Number(remoteBooking.pickupLat ?? existing.pickupLat),
        pickupLng: Number(remoteBooking.pickupLng ?? existing.pickupLng),
        destinationLat: Number(remoteBooking.destinationLat ?? existing.destinationLat),
        destinationLng: Number(remoteBooking.destinationLng ?? existing.destinationLng),
        distanceMeters: Number(remoteBooking.distanceMeters ?? existing.distanceMeters),
        estimatedMinutes: Number(remoteBooking.estimatedMinutes ?? existing.estimatedMinutes),
        fareAmount: Number(remoteBooking.fareAmount ?? existing.fareAmount)
      };
    } else {
      const normalized: BookingRequest = {
        id: remoteBooking.id,
        bookingNumber: remoteBooking.bookingNumber || remoteBooking.id,
        studentId: remoteBooking.studentId || '',
        studentName: remoteBooking.studentName || 'Student Passenger',
        studentPhone: remoteBooking.studentPhone || '',
        studentIdNumber: remoteBooking.studentIdNumber || '',
        passengerCount: remoteBooking.passengerCount ?? 1,
        pickupName: remoteBooking.pickupName || 'Pickup Point',
        pickupLat: Number(remoteBooking.pickupLat ?? 15.4858),
        pickupLng: Number(remoteBooking.pickupLng ?? 120.9722),
        pickupInstructions: remoteBooking.pickupInstructions,
        destinationName: remoteBooking.destinationName || 'Destination',
        destinationLat: Number(remoteBooking.destinationLat ?? 15.4865),
        destinationLng: Number(remoteBooking.destinationLng ?? 120.9735),
        distanceMeters: Number(remoteBooking.distanceMeters ?? 0),
        estimatedMinutes: Number(remoteBooking.estimatedMinutes ?? 3),
        fareAmount: Number(remoteBooking.fareAmount ?? 15),
        status: (remoteBooking.status as BookingStatus) || 'searching',
        assignedDriverId: remoteBooking.assignedDriverId,
        assignedDriverName: remoteBooking.assignedDriverName,
        assignedDriverPhone: remoteBooking.assignedDriverPhone,
        assignedBikeNumber: remoteBooking.assignedBikeNumber,
        targetDriverId: remoteBooking.targetDriverId,
        requestExpiresAt: remoteBooking.requestExpiresAt,
        createdAt: remoteBooking.createdAt || new Date().toISOString(),
        updatedAt: remoteBooking.updatedAt || new Date().toISOString()
      };
      current.unshift(normalized);
    }

    const merged = existingIdx > -1 ? current[existingIdx] : current[0];
    this.bookingsSubject.next(current);
    this.saveState();

    // Sync seat count on the assigned pedicab when a remote driver accepts or finishes
    if (merged.assignedBikeNumber && prevStatus !== merged.status) {
      const bikes = [...this.bicyclesSubject.getValue()];
      const bikeIdx = bikes.findIndex(b => b.bikeNumber === merged.assignedBikeNumber);
      if (bikeIdx > -1) {
        const bike = bikes[bikeIdx];
        if (merged.status === 'driver_arriving' && prevStatus === 'searching') {
          const pax = merged.passengerCount ?? 1;
          const newCount = Math.min(bike.maxCapacity, (bike.passengerCount || 0) + pax);
          bikes[bikeIdx] = {
            ...bike,
            passengerCount: newCount,
            status: newCount >= bike.maxCapacity ? 'full' : 'almost_full',
            driverName: merged.assignedDriverName || bike.driverName,
            lastUpdate: 'Live'
          };
          this.bicyclesSubject.next(bikes);
        } else if (merged.status === 'completed' || merged.status === 'cancelled') {
          bikes[bikeIdx] = {
            ...bike,
            passengerCount: 0,
            status: 'available',
            lastUpdate: 'Live'
          };
          this.bicyclesSubject.next(bikes);
        }
      }
    }
  }

  /**
   * Update a pedicab's live GPS coordinates from XAMPP tracking and pause
   * simulated movement for that bike so real phone GPS takes priority.
   */
  public syncRemoteDriverLocation(bikeNumber: string, lat: number, lng: number, heading?: number): void {
    if (!bikeNumber || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    this.activeHardwareGpsBikes.set(bikeNumber, Date.now());

    const bikes = [...this.bicyclesSubject.getValue()];
    const idx = bikes.findIndex(b => b.bikeNumber === bikeNumber);
    if (idx === -1) return;

    bikes[idx] = {
      ...bikes[idx],
      currentLocation: {
        ...bikes[idx].currentLocation,
        lat,
        lng
      },
      heading: heading !== undefined && Number.isFinite(heading) ? Math.round(heading) : bikes[idx].heading,
      lastUpdate: 'Live'
    };
    this.bicyclesSubject.next(bikes);
  }
}

