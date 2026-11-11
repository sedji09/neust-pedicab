import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonToast,
  IonToggle
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  navigateOutline,
  timeOutline,
  peopleOutline,
  ticketOutline,
  addOutline,
  removeOutline,
  playOutline,
  stopOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  callOutline,
  locateOutline,
  cameraOutline,
  buildOutline,
  refreshOutline,
  personOutline,
  logOutOutline,
  speedometerOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline,
  locationOutline,
  radioOutline,
  checkmarkDoneOutline,
  closeOutline,
  pinOutline,
  walkOutline,
  cashOutline,
  pricetagOutline,
  chatbubbleEllipsesOutline,
  chatbubbleEllipses,
  send,
  walletOutline,
  trendingUpOutline,
  chevronForwardOutline,
  sparklesOutline,
  flashOutline,
  informationCircleOutline,
  thumbsUpOutline,
  mapOutline,
  warningOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { StateService } from '../../core/services/state.service';
import { ApiService } from '../../core/services/api.service';
import { LanguageService } from '../../core/services/language.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { BicycleFinderService } from '../../core/services/bicycle-finder.service';
import { BicycleTrackingService } from '../../core/services/bicycle-tracking.service';
import { PickupLocationService } from '../../core/services/pickup-location.service';
import { CampusGeolocationService, GpsLocationResult } from '../../core/services/campus-geolocation.service';
import { ChatService } from '../../core/services/chat.service';
import { NotificationService } from '../../core/services/notification.service';
import { CampusMapComponent } from '../../shared/components/campus-map/campus-map.component';
import {
  Bicycle,
  QueueEntry,
  Trip,
  MaintenanceReport,
  BicycleStatus,
  DesignatedZone,
  BookingRequest,
  BookingStatus,
  CampusLocation,
  LocationCategory,
  CustomPickupPin,
  ChatMessage
} from '../../core/models/models';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonToast,
    CampusMapComponent
  ],
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.scss']
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  // Tabs: 'dashboard' (Biyahe) | 'queue' (Pila) | 'trip' (Mapa) | 'history' (Kita) | 'profile' (Iba Pa) | 'maintenance'
  public currentTab: 'dashboard' | 'queue' | 'trip' | 'history' | 'profile' | 'maintenance' = 'dashboard';

  public myBikeNumber = 'BIKE-003';

  // --- Driver Chat with Student ---
  public isDriverChatOpen = false;
  public driverChatInput = '';
  public get driverQuickReplies(): string[] {
    return this.isFil
      ? [
          'Papunta na po ako sa inyo! 🛵',
          'Nandito na po sa pickup point 📍',
          'Saan po kayo banda nakatayo? 🙋‍♂️',
          'Sige po, sakay na po kayo! 🚲',
          'Paki-ready po ang baryang pamasahe 💵'
        ]
      : [
          'On my way to your pickup! 🛵',
          'Arrived at the pickup point 📍',
          'Where are you standing? 🙋‍♂️',
          'All set, please hop in! 🚲',
          'Please prepare exact fare 💵'
        ];
  }

  // --- GPS Campus Location Mapping (Feature 1, 2, 3) ---
  public isMapLocationModalOpen = false;
  public isDetectingGps = false;
  public mappingGpsWarning: string | null = null;
  public mappingDuplicateWarning: string | null = null;

  public newLocName = '';
  public newLocCategory: LocationCategory = 'academic';
  public newLocBuildingNumber = '';
  public newLocDescription = '';
  public newLocLat: number | null = null;
  public newLocLng: number | null = null;
  public newLocAccuracy: number | null = null;
  public newLocAccuracyLevel: 'high' | 'medium' | 'low' = 'high';
  public newLocPickupAllowed = true;
  public newLocDropoffAllowed = true;
  public newLocSeparateStopping = false;
  public newLocStoppingLat: number | null = null;
  public newLocStoppingLng: number | null = null;
  public isPinAdjusting = false;

  // Active Trip Start Form
  public isStartTripModalOpen = false;
  public tripPickupId = 'loc-gate';
  public tripDestId = 'loc-cict';

  // GPS Geolocation tracking
  public isGpsActive = false;
  private watchPositionId: number | null = null;
  private simulationInterval: any = null;
  public liveLat: number = 15.444889;
  public liveLng: number = 120.940417;
  public liveHeading = 90;
  public lastGpsTimestamp = 'Kamakailan';
  public gpsAccuracyMeters = 3.5;

  // Designated Zone detection
  public currentZone: DesignatedZone | null = null;

  // Maintenance form
  public isMaintenanceModalOpen = false;
  public issueType: MaintenanceReport['issueType'] = 'Flat Tire';
  public issueDescription = '';
  public maintenancePhotoUrl = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80';

  // Sound / Audio alert
  private lastAlertBookingId: string | null = null;

  // Toast
  public showToast = false;
  public toastMessage = '';

  private subs = new Subscription();

  constructor(
    public authService: AuthService,
    public stateService: StateService,
    public apiService: ApiService,
    public langService: LanguageService,
    public geoService: GeolocationService,
    public bicycleFinder: BicycleFinderService,
    public trackingService: BicycleTrackingService,
    public pickupService: PickupLocationService,
    public campusGeolocationService: CampusGeolocationService,
    public chatService: ChatService,
    public notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      bicycleOutline,
      navigateOutline,
      timeOutline,
      peopleOutline,
      ticketOutline,
      addOutline,
      removeOutline,
      playOutline,
      stopOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      callOutline,
      locateOutline,
      cameraOutline,
      buildOutline,
      refreshOutline,
      personOutline,
      logOutOutline,
      speedometerOutline,
      shieldCheckmarkOutline,
      arrowForwardOutline,
      locationOutline,
      radioOutline,
      checkmarkDoneOutline,
      closeOutline,
      pinOutline,
      walkOutline,
      cashOutline,
      pricetagOutline,
      chatbubbleEllipsesOutline,
      chatbubbleEllipses,
      send,
      walletOutline,
      trendingUpOutline,
      chevronForwardOutline,
      sparklesOutline,
      flashOutline,
      informationCircleOutline,
      thumbsUpOutline,
      mapOutline,
      warningOutline,
      checkmarkOutline
    });
  }

  public get isFil(): boolean {
    return this.langService.currentLanguage === 'fil';
  }

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user.assignedBicycleNumber) {
      this.myBikeNumber = user.assignedBicycleNumber;
    }

    // Auto-start GPS broadcast for driver
    this.startGpsTracking();

    // Listen for real-time state updates (bookings, bicycles, queues, trips) across tabs/roles
    this.subs.add(
      this.stateService.bookings$.subscribe(() => {
        const incoming = this.incomingBookingRequest;
        if (incoming && incoming.id !== this.lastAlertBookingId) {
          this.lastAlertBookingId = incoming.id;
          const isFil = this.isFil;
          this.notificationService.notify(
            isFil ? '🔔 Bagong Hiling ng Biyahe!' : '🔔 New Ride Request!',
            isFil
              ? `Hiling ni ${incoming.studentName} sa ${incoming.pickupName} (${incoming.passengerCount} pasahero, ₱${incoming.fareAmount}.00).`
              : `${incoming.studentName} requested a pickup at ${incoming.pickupName} (${incoming.passengerCount} pax, ₱${incoming.fareAmount}.00).`,
            'driver',
            undefined,
            undefined,
            'request'
          );
        }
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.stateService.bicycles$.subscribe(() => {
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.stateService.queues$.subscribe(() => {
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.stateService.trips$.subscribe(() => {
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.stopGpsTracking();
    this.subs.unsubscribe();
  }

  private playIncomingSound(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio autoplay policy
    }
  }

  public get myBicycle(): Bicycle {
    const bikes = this.stateService.getStateSnapshot().bicycles;
    return bikes.find(b => b.bikeNumber === this.myBikeNumber) || bikes[0];
  }

  public get activeTrip(): Trip | undefined {
    const trips = this.stateService.getStateSnapshot().trips;
    return trips.find(t => t.bicycleNumber === this.myBikeNumber && t.status === 'active');
  }

  public get completedTripsToday(): Trip[] {
    const trips = this.stateService.getStateSnapshot().trips;
    return trips.filter(t => t.bicycleNumber === this.myBikeNumber && t.status === 'completed');
  }

  public get completedBookingsToday(): BookingRequest[] {
    const bookings = this.stateService.getStateSnapshot().bookings || [];
    const user = this.authService.currentUser;
    return bookings.filter(b =>
      (b.assignedBikeNumber === this.myBikeNumber || b.assignedDriverId === user?.id) &&
      b.status === 'completed'
    );
  }

  public get totalEarningsToday(): number {
    const tripEarnings = this.completedTripsToday.reduce((sum, t) => sum + ((t.passengerCount || 1) * 10), 0);
    const bookingEarnings = this.completedBookingsToday.reduce((sum, b) => sum + (b.fareAmount || ((b.passengerCount || 1) * 10)), 0);
    return tripEarnings + bookingEarnings;
  }

  public get totalTripsCountToday(): number {
    return this.completedTripsToday.length + this.completedBookingsToday.length;
  }

  public get totalPassengersServedToday(): number {
    const tripPax = this.completedTripsToday.reduce((sum, t) => sum + (t.passengerCount || 1), 0);
    const bookingPax = this.completedBookingsToday.reduce((sum, b) => sum + (b.passengerCount || 1), 0);
    return tripPax + bookingPax;
  }

  public get waitingPassengers(): QueueEntry[] {
    const queues = this.stateService.getStateSnapshot().queues;
    return queues.filter(q => q.status === 'waiting' || q.status === 'called');
  }

  public get boardedQueuePassengers(): QueueEntry[] {
    const queues = this.stateService.getStateSnapshot().queues;
    return queues.filter(q => q.assignedBikeNumber === this.myBikeNumber && q.status === 'boarded');
  }

  public get myMaintenanceReports(): MaintenanceReport[] {
    const reports = this.stateService.getStateSnapshot().maintenanceReports;
    return reports.filter(r => r.bicycleNumber === this.myBikeNumber);
  }

  // Calculate distance from driver's current position to student's pickup point
  public getDistanceToPickup(q: QueueEntry): number {
    const targetLat = q.customPickupPin ? q.customPickupPin.lat : 15.4578;
    const targetLng = q.customPickupPin ? q.customPickupPin.lng : 120.9602;
    return this.bicycleFinder.calculateHaversineDistance(
      this.liveLat,
      this.liveLng,
      targetLat,
      targetLng
    );
  }

  // --- Pilahan / Terminal Check-In & Auto-Detection ---

  public get currentTerminal(): 'gate' | 'arki' | 'roaming' {
    const locName = (this.myBicycle?.currentLocation?.stationName || '').toLowerCase();
    const lat = this.myBicycle?.currentLocation?.lat;
    const lng = this.myBicycle?.currentLocation?.lng;

    if (locName.includes('gate') || locName.includes('terminal')) return 'gate';
    if (locName.includes('arki') || locName.includes('architecture')) return 'arki';

    if (lat && lng) {
      const distGate = this.bicycleFinder.calculateHaversineDistance(lat, lng, 15.444889, 120.940417);
      const distArki = this.bicycleFinder.calculateHaversineDistance(lat, lng, 15.447738, 120.940822);
      if (distGate <= 75) return 'gate';
      if (distArki <= 75) return 'arki';
    }

    return 'roaming';
  }

  public get isAutoDetectedByGps(): boolean {
    if (!this.liveLat || !this.liveLng) return false;
    const distGate = this.bicycleFinder.calculateHaversineDistance(this.liveLat, this.liveLng, 15.444889, 120.940417);
    const distArki = this.bicycleFinder.calculateHaversineDistance(this.liveLat, this.liveLng, 15.447738, 120.940822);
    return distGate <= 75 || distArki <= 75;
  }

  public setTerminalAction(terminal: 'gate' | 'arki' | 'roaming'): void {
    this.stateService.setDriverTerminal(this.myBikeNumber, terminal);
    if (terminal === 'gate') {
      this.displayToast('🏛️ Naka-check in sa Pilahan sa Gate! Makikita na sa Live Map ng mga estudyante.');
    } else if (terminal === 'arki') {
      this.displayToast('📐 Naka-check in sa Gilid ng Arki! Makikita na sa Live Map ng mga estudyante.');
    } else {
      this.displayToast('🚴 Naka-set sa Nagroronda sa Campus / Walang Pila.');
    }
  }

  // --- JoyRide Driver Online Status & Incoming Ride Request Engine ---

  public get isDriverOnline(): boolean {
    return this.myBicycle?.status !== 'offline';
  }

  public toggleDriverOnline(): void {
    const nextState = !this.isDriverOnline;
    this.stateService.setDriverOnlineStatus(this.myBikeNumber, nextState);
    this.displayToast(
      nextState
        ? '🟢 NAKA-ONLINE KA NA! Handa nang tumanggap ng mga booking.'
        : '⚪ NAKA-PAHINGA KA NA. Hindi ka muna makakatanggap ng rides.'
    );
  }

  public get incomingBookingRequest(): BookingRequest | undefined {
    // Only receive requests if driver is online and has no currently active trip
    if (!this.isDriverOnline || this.myActiveBooking) return undefined;
    return this.stateService.getIncomingRequestForDriver(
      this.authService.currentUser?.id,
      this.myBikeNumber
    );
  }

  public get requestRemainingSeconds(): number {
    const req = this.incomingBookingRequest;
    if (!req || !req.requestExpiresAt) return 20;
    const diff = Math.ceil((req.requestExpiresAt - Date.now()) / 1000);
    return Math.max(0, Math.min(20, diff));
  }

  public get myActiveBooking(): BookingRequest | undefined {
    return this.stateService.getActiveBookingForDriver(
      this.authService.currentUser?.id,
      this.myBikeNumber
    );
  }

  public acceptIncomingBooking(booking: BookingRequest): void {
    const user = this.authService.currentUser;
    const driverInfo = {
      id: user?.id || 'driver-001',
      name: user?.fullName || 'Pedro Ramirez',
      phone: user?.phone || '0917-555-0101',
      photo: user?.avatarUrl,
      bikeNumber: this.myBikeNumber
    };

    const success = this.stateService.driverRespondBooking(booking.id, driverInfo, 'accept');
    if (success) {
      this.apiService.respondBookingXampp(
        booking.id,
        driverInfo.id,
        driverInfo.name,
        driverInfo.phone,
        driverInfo.bikeNumber,
        'accept'
      ).subscribe();

      // Send initial welcome message
      this.chatService.initBookingWelcome({
        ...booking,
        assignedDriverId: driverInfo.id,
        assignedDriverName: driverInfo.name,
        assignedDriverPhone: driverInfo.phone,
        assignedBikeNumber: driverInfo.bikeNumber
      });

      this.currentTab = 'dashboard';
      this.displayToast(`Tinanggap ang booking para kay ${booking.studentName}! Pumunta na sa pickup point.`);
    } else {
      this.displayToast('⚠️ Ang booking ay na-accept na ng ibang driver o nag-expire na.');
    }
  }

  public rejectIncomingBooking(booking: BookingRequest): void {
    const user = this.authService.currentUser;
    const driverInfo = {
      id: user?.id || 'driver-001',
      name: user?.fullName || 'Pedro Ramirez',
      phone: user?.phone || '0917-555-0101',
      bikeNumber: this.myBikeNumber
    };

    this.stateService.driverRespondBooking(booking.id, driverInfo, 'reject');
    this.apiService.respondBookingXampp(
      booking.id,
      driverInfo.id,
      driverInfo.name,
      driverInfo.phone,
      driverInfo.bikeNumber,
      'reject'
    ).subscribe();

    this.displayToast('Tinanggihan ang request. Inililipat sa ibang driver.');
  }

  public advanceBookingStatus(booking: BookingRequest, newStatus: BookingStatus): void {
    this.stateService.updateBookingStatus(booking.id, newStatus);
    this.apiService.updateTripStatusXampp(booking.id, newStatus).subscribe();

    if (newStatus === 'driver_arriving') {
      this.displayToast(`Papunta na sa sakayan ni ${booking.studentName} (${booking.pickupName})`);
    } else if (newStatus === 'driver_arrived') {
      this.displayToast(`Nakarating na sa pickup point! Inabisuhan si ${booking.studentName}.`);
    } else if (newStatus === 'in_progress') {
      this.displayToast(`Nakasakay na si ${booking.studentName}! Simulan ang biyahe patungong ${booking.destinationName}.`);
    } else if (newStatus === 'completed') {
      const fare = booking.fareAmount || ((booking.passengerCount || 1) * 10);
      this.displayToast(`✅ Naibaba / Naihatid na si ${booking.studentName}! Nakolekta: ₱${fare}.00 CASH. Balik sa 4/4 ang available na upuan!`);
      this.currentTab = 'dashboard';
    }
  }

  public dropOffBookingAction(booking: BookingRequest): void {
    this.advanceBookingStatus(booking, 'completed');
  }

  public dropOffQueuePassengerAction(q: QueueEntry): void {
    const ok = this.stateService.dropOffBoardedQueuePassenger(q.id, this.myBikeNumber);
    if (ok) {
      const freeSeats = this.myBicycle.maxCapacity - this.myBicycle.passengerCount;
      this.displayToast(`✅ Naibaba na si ${q.studentName} sa ${q.destinationName}! Available na upuan: ${freeSeats}/${this.myBicycle.maxCapacity}.`);
    }
  }

  public dropOffAllPassengersAction(): void {
    this.stateService.dropOffAllPassengers(this.myBikeNumber);
    this.trackingService.stopTrackingSession();
    this.displayToast(`✅ Naihatid na ang lahat ng sakay! Balik na sa 4/4 (Apat) ang available na upuan ng ${this.myBikeNumber}.`);
    this.currentTab = 'dashboard';
  }

  public updateBookingTripStatus(bookingId: string, newStatus: BookingStatus): void {
    const booking = this.myActiveBooking;
    if (booking) {
      this.advanceBookingStatus(booking, newStatus);
    }
  }

  // --- Driver Chat Methods ---
  public get activeBookingMessages(): ChatMessage[] {
    return this.chatService.getMessagesForBooking(this.myActiveBooking?.id);
  }

  public get unreadStudentMessagesCount(): number {
    return this.chatService.currentMessages.filter(
      m => m.bookingId === this.myActiveBooking?.id && m.senderRole === 'student' && !m.isRead
    ).length;
  }

  public openDriverChat(): void {
    this.isDriverChatOpen = true;
    this.chatService.markAllAsRead();
  }

  public closeDriverChat(): void {
    this.isDriverChatOpen = false;
  }

  public sendDriverMessage(): void {
    if (!this.driverChatInput.trim() || !this.myActiveBooking) return;
    this.chatService.sendDriverMessage(
      this.driverChatInput,
      this.myActiveBooking,
      this.authService.currentUser
    );
    this.driverChatInput = '';
  }

  public sendQuickDriverReply(text: string): void {
    if (!this.myActiveBooking) return;
    this.chatService.sendDriverMessage(
      text,
      this.myActiveBooking,
      this.authService.currentUser
    );
  }

  public setAvailabilityStatus(status: BicycleStatus): void {
    if (this.myBicycle.status === 'maintenance') {
      this.displayToast('Kasalukuyang inaayos ang sasakyan. Hindi mababago ang status!');
      return;
    }
    this.stateService.setBicycleStatus(this.myBikeNumber, status);
    const tagalogLabels: Record<string, string> = {
      available: 'Available (Handa sa Pasada)',
      on_trip: 'May Sakay / On Trip',
      almost_full: 'Pahinga / Halos Puno',
      offline: 'Naka-Offline (Pahinga)'
    };
    this.displayToast(`Katayuan: ${tagalogLabels[status] || status.toUpperCase()}`);
  }

  public incrementPassenger(): void {
    if (this.myBicycle.passengerCount >= this.myBicycle.maxCapacity) {
      this.displayToast('Puno na ang kapasidad ng shuttle (4/4 pasahero)!');
      return;
    }
    this.stateService.updatePassengerCount(this.myBikeNumber, 1);
  }

  public decrementPassenger(): void {
    if (this.myBicycle.passengerCount <= 0) return;
    this.stateService.updatePassengerCount(this.myBikeNumber, -1);
  }

  public onStartTripClick(): void {
    if (this.myBicycle.status === 'maintenance') {
      this.displayToast('Hindi masisimulan ang biyahe: May iniulat na sira ang sasakyan!');
      return;
    }
    this.isStartTripModalOpen = true;
  }

  public confirmStartTrip(): void {
    const locations = this.stateService.getStateSnapshot().locations;
    const pickup = locations.find(l => l.id === this.tripPickupId)?.name || 'Main Entrance Gate';
    const dest = locations.find(l => l.id === this.tripDestId)?.name || 'CICT Building';

    const trip = this.stateService.startTrip(this.myBikeNumber, pickup, dest);
    this.isStartTripModalOpen = false;
    if (trip) {
      this.currentTab = 'trip';
      this.displayToast(`Nagsimula ang Biyahe ${trip.tripNumber}!`);
      this.startGpsTracking();
    }
  }

  public endCurrentTrip(): void {
    const trip = this.stateService.endTrip(this.myBikeNumber);
    this.trackingService.stopTrackingSession();
    if (trip) {
      this.displayToast(`Natapos ang Biyahe ${trip.tripNumber}! Handa na sa panibagong pasahero.`);
      this.currentTab = 'dashboard';
    }
  }

  public callPassengerAction(q: QueueEntry): void {
    const user = this.authService.currentUser;
    this.stateService.callPassenger(q.id, this.myBikeNumber, user.fullName);

    // If student has custom pickup, launch live tracking session to guide driver to them
    if (q.customPickupPin) {
      this.trackingService.startTrackingSession(
        'trip-call-' + Date.now(),
        this.myBicycle,
        q.customPickupPin,
        {
          name: q.destinationName,
          lat: 15.4612,
          lng: 120.9568
        }
      );
    }

    this.displayToast(`Tinawag si ${q.studentName} (${q.queueNumber})!`);
  }

  public boardPassengerAction(q: QueueEntry): void {
    if (this.myBicycle.passengerCount >= this.myBicycle.maxCapacity) {
      this.displayToast('Hindi maisakay: Puno na ang 4/4 na upuan!');
      return;
    }
    const success = this.stateService.boardPassenger(q.id, this.myBikeNumber);
    if (success) {
      this.displayToast(`Kumpirmadong nakasakay si ${q.studentName}!`);
    }
  }

  public skipPassengerAction(q: QueueEntry): void {
    this.stateService.skipPassenger(q.id);
    this.displayToast(`Nilaktawan ang pasahero ${q.queueNumber}.`);
  }

  // --- Live GPS Route Tracking Transmission ---

  public toggleGpsTracking(): void {
    if (this.isGpsActive) {
      this.stopGpsTracking();
    } else {
      this.startGpsTracking();
    }
  }

  private startGpsTracking(): void {
    this.isGpsActive = true;

    // Check real navigator geolocation
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        this.watchPositionId = navigator.geolocation.watchPosition(
          (position) => {
            const rawLat = position.coords.latitude;
            const rawLng = position.coords.longitude;
            // If GPS is inside NEUST campus boundary, use hardware GPS
            if (this.pickupService.isInsideCampusBoundary(rawLat, rawLng)) {
              this.handlePositionUpdate(
                rawLat,
                rawLng,
                position.coords.heading || 0,
                position.coords.accuracy
              );
            } else {
              // Device GPS is outside campus (development/testing off-campus)
              this.startSimulatedMovement();
            }
          },
          () => {
            this.startSimulatedMovement();
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 }
        );
      } catch (e) {
        this.startSimulatedMovement();
      }
    } else {
      this.startSimulatedMovement();
    }
  }

  private startSimulatedMovement(): void {
    if (this.simulationInterval) return;

    let step = 0;
    // Campus loop coordinates inside NEUST Sumacab grounds
    const waypoints = [
      { lat: 15.449353, lng: 120.940410, heading: 180 }, // CICT (beside Physical Education / Gym)
      { lat: 15.4463, lng: 120.9392, heading: 150 }, // Admin Plaza
      { lat: 15.4458, lng: 120.9398, heading: 140 }, // Admin South
      { lat: 15.4455, lng: 120.9406, heading: 160 }, // Banaba St East
      { lat: 15.444889, lng: 120.940417, heading: 200 } // Trike Terminal
    ];

    this.simulationInterval = setInterval(() => {
      if (!this.isGpsActive) return;
      // Only simulate GPS road movement when actively on a trip/booking so parked terminal bikes stay at their terminal
      if (!this.myActiveBooking && !this.activeTrip) return;
      step = (step + 1) % waypoints.length;
      const target = waypoints[step];
      this.handlePositionUpdate(target.lat, target.lng, target.heading, 4.0);
    }, 6000);
  }

  private handlePositionUpdate(lat: number, lng: number, heading: number, accuracy: number): void {
    this.liveLat = Number(lat.toFixed(6));
    this.liveLng = Number(lng.toFixed(6));
    this.liveHeading = heading || 0;
    this.gpsAccuracyMeters = Number(accuracy.toFixed(1));
    this.lastGpsTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Update StateService and broadcast with real-time heading
    this.stateService.updateDriverLocation(
      this.myBikeNumber,
      this.liveLat,
      this.liveLng,
      undefined,
      undefined,
      this.liveHeading
    );

    // Send real-time GPS coordinate to backend XAMPP database
    this.apiService.updateDriverGpsXampp({
      bike_number: this.myBikeNumber,
      driver_id: this.authService.currentUser?.id || 'driver-003',
      lat: this.liveLat,
      lng: this.liveLng,
      heading: this.liveHeading,
      speed_kmh: 12.0
    }).subscribe();

    // Update active route tracking session
    this.trackingService.updateDriverPosition(this.liveLat, this.liveLng, this.liveHeading);

    // Detect Designated Zone Entry
    this.checkZoneProximity(this.liveLat, this.liveLng);
  }

  private checkZoneProximity(lat: number, lng: number): void {
    const zones = this.stateService.getStateSnapshot().designatedZones || [];
    let detectedZone: DesignatedZone | null = null;

    for (const z of zones) {
      if (!z.isEnabled) continue;
      const dist = this.bicycleFinder.calculateHaversineDistance(lat, lng, z.center.lat, z.center.lng);
      if (dist <= z.radiusMeters) {
        detectedZone = z;
        break;
      }
    }

    if (detectedZone && (!this.currentZone || this.currentZone.id !== detectedZone.id)) {
      this.currentZone = detectedZone;
      if (detectedZone.type === 'restricted') {
        this.displayToast(`⚠️ Babala: Nakapasok sa Restricted Zone (${detectedZone.name})! Mag-ingat o lumabas.`);
      } else {
        this.displayToast(`📍 Nakapasok sa Campus Zone: ${detectedZone.name}`);
      }
    } else if (!detectedZone) {
      this.currentZone = null;
    }
  }

  private stopGpsTracking(): void {
    this.isGpsActive = false;
    if (this.watchPositionId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // --- Maintenance Reporting ---

  public submitMaintenanceAction(): void {
    this.submitMaintenanceReport();
  }

  public submitMaintenanceReport(): void {
    if (!this.issueDescription.trim()) {
      this.displayToast('Pakilagay ang maikling paliwanag sa sira o problema.');
      return;
    }
    const user = this.authService.currentUser;
    this.stateService.submitMaintenanceReport({
      bicycleNumber: this.myBikeNumber,
      driverName: user.fullName,
      issueType: this.issueType,
      description: this.issueDescription,
      photoUrl: this.maintenancePhotoUrl
    });
    this.isMaintenanceModalOpen = false;
    this.issueDescription = '';
    this.displayToast('Naisumite na ang report sa Campus Dispatch at Mekaniko.');
  }

  // --- GPS Campus Location Mapping Methods ---

  public get mySubmittedLocations(): CampusLocation[] {
    const user = this.authService.currentUser;
    const list = this.stateService.getStateSnapshot().locations || [];
    return list.filter(l =>
      l.submittedBy === user?.id ||
      l.submittedBy === user?.fullName ||
      (l.submittedByRole === 'driver' && l.id.startsWith('loc-custom-'))
    );
  }

  public get mappingPickupPinPreview(): CustomPickupPin | null {
    if (this.newLocLat === null || this.newLocLng === null) return null;
    return {
      lat: this.newLocLat,
      lng: this.newLocLng,
      addressText: this.newLocName || 'Nai-map na Lokasyon',
      nearestBuildingName: this.newLocName || 'Campus Grounds',
      nearestBuildingNumber: this.newLocBuildingNumber || '',
      distanceToNearestMeters: 0,
      isInsideCampusBoundary: PickupLocationService.isInsideCampusBoundary(this.newLocLat, this.newLocLng)
    };
  }

  public openMapLocationModal(): void {
    this.newLocName = '';
    this.newLocCategory = 'academic';
    this.newLocBuildingNumber = '';
    this.newLocDescription = '';
    this.newLocLat = null;
    this.newLocLng = null;
    this.newLocAccuracy = null;
    this.newLocAccuracyLevel = 'high';
    this.newLocPickupAllowed = true;
    this.newLocDropoffAllowed = true;
    this.newLocSeparateStopping = false;
    this.newLocStoppingLat = null;
    this.newLocStoppingLng = null;
    this.mappingGpsWarning = null;
    this.mappingDuplicateWarning = null;
    this.isPinAdjusting = false;

    this.isMapLocationModalOpen = true;
    this.detectDeviceGps();
  }

  public async detectDeviceGps(): Promise<void> {
    this.isDetectingGps = true;
    this.mappingGpsWarning = null;

    try {
      const res = await this.campusGeolocationService.getCurrentGpsLocation();
      this.newLocLat = res.lat;
      this.newLocLng = res.lng;
      this.newLocAccuracy = res.accuracy;
      this.newLocAccuracyLevel = res.accuracyLevel;
      this.mappingGpsWarning = res.warningMessage || null;

      this.checkDuplicateOnNameOrCoords();
      this.displayToast(`GPS Na-detect: ±${res.accuracy}m linaw (${res.accuracyLevel.toUpperCase()})`);
    } catch (err: any) {
      console.warn('GPS detection error:', err);
      this.mappingGpsWarning = err.message || 'Hindi ma-detect ang GPS.';
      this.displayToast(this.mappingGpsWarning || 'GPS Error');
    } finally {
      this.isDetectingGps = false;
    }
  }

  public checkDuplicateOnNameOrCoords(): void {
    if (this.newLocLat === null || this.newLocLng === null) return;
    const nameToCheck = this.newLocName.trim() || 'Bagong Gusali';
    const dup = this.stateService.checkForDuplicateLocation(nameToCheck, this.newLocLat, this.newLocLng);
    if (dup.isDuplicate && dup.reason) {
      this.mappingDuplicateWarning = dup.reason;
    } else {
      this.mappingDuplicateWarning = null;
    }
  }

  public onMappingPinChanged(pin: CustomPickupPin): void {
    this.newLocLat = Number(pin.lat.toFixed(7));
    this.newLocLng = Number(pin.lng.toFixed(7));
    this.checkDuplicateOnNameOrCoords();
  }

  public async submitMappedLocation(): Promise<void> {
    if (!this.newLocName.trim()) {
      this.displayToast('Pakilagay ang pangalan ng gusali o pasilidad.');
      return;
    }
    if (this.newLocLat === null || this.newLocLng === null) {
      this.displayToast('Kailangang ma-detect o mai-pin ang GPS coordinates bago i-save.');
      return;
    }

    try {
      const user = this.authService.currentUser;
      const res = await this.stateService.proposeCampusLocation({
        name: this.newLocName,
        category: this.newLocCategory,
        buildingNumber: this.newLocBuildingNumber,
        description: this.newLocDescription,
        latitude: this.newLocLat,
        longitude: this.newLocLng,
        gpsAccuracy: this.newLocAccuracy || undefined,
        pickupLatitude: this.newLocSeparateStopping && this.newLocStoppingLat ? this.newLocStoppingLat : this.newLocLat,
        pickupLongitude: this.newLocSeparateStopping && this.newLocStoppingLng ? this.newLocStoppingLng : this.newLocLng,
        dropoffLatitude: this.newLocSeparateStopping && this.newLocStoppingLat ? this.newLocStoppingLat : this.newLocLat,
        dropoffLongitude: this.newLocSeparateStopping && this.newLocStoppingLng ? this.newLocStoppingLng : this.newLocLng,
        isPickupAllowed: this.newLocPickupAllowed,
        isDropoffAllowed: this.newLocDropoffAllowed,
        submittedBy: user?.fullName || 'Rider',
        submittedByRole: 'driver'
      });

      this.isMapLocationModalOpen = false;
      this.displayToast(res.message);
      this.currentTab = 'dashboard';
    } catch (err: any) {
      this.displayToast(`Error: ${err.message || 'Hindi nai-save ang lokasyon.'}`);
    }
  }

  public displayToast(msg: string, type: 'trip' | 'queue' | 'system' | 'safety' | 'driver' = 'system'): void {
    this.toastMessage = msg;
    this.showToast = true;
    this.notificationService.showInAppToast('NEUST BikeGo', msg, type);
  }
}
