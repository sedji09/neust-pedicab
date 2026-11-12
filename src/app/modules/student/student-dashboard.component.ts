import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonToast
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  navigateOutline,
  timeOutline,
  peopleOutline,
  ticketOutline,
  mapOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  refreshOutline,
  callOutline,
  qrCodeOutline,
  personOutline,
  logOutOutline,
  keyOutline,
  createOutline,
  layersOutline,
  sparklesOutline,
  arrowForwardOutline,
  radioOutline,
  searchOutline,
  locationOutline,
  star,
  starOutline,
  cardOutline,
  chatbubbleOutline,
  pinOutline,
  shieldCheckmarkOutline,
  walkOutline,
  speedometerOutline,
  batteryChargingOutline,
  personCircleOutline,
  chevronForwardOutline,
  chevronDownOutline,
  schoolOutline,
  logInOutline,
  radioButtonOnOutline, closeOutline,
  addOutline, removeOutline, people,
  languageOutline, checkmarkCircle,
  locateOutline, arrowBackOutline, chevronBackOutline, checkmarkOutline,
  globeOutline, pricetagOutline, ellipsisHorizontal, chatbubbleEllipsesOutline,
  chevronUpOutline, restaurantOutline, businessOutline, location, cashOutline, flashOutline, swapHorizontalOutline, checkmarkDoneOutline, notificationsOutline,
  person, bicycle, sendOutline, send, chatbubbles, chatbubblesOutline, chatbubbleEllipses, call,
  thumbsUp, thumbsUpOutline, ellipsisVertical
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { StateService } from '../../core/services/state.service';
import { ApiService } from '../../core/services/api.service';
import { LanguageService, SupportedLanguage } from '../../core/services/language.service';
import { GeolocationService, GeoPosition } from '../../core/services/geolocation.service';
import { PickupLocationService } from '../../core/services/pickup-location.service';
import { BicycleFinderService } from '../../core/services/bicycle-finder.service';
import { BicycleTrackingService } from '../../core/services/bicycle-tracking.service';
import { ChatService } from '../../core/services/chat.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  Bicycle,
  CampusLocation,
  QueueEntry,
  Trip,
  CustomPickupPin,
  NearestBicycleResult,
  RouteTrackingSession,
  BookingRequest,
  BookingStatus,
  AppNotification,
  UserRole
} from '../../core/models/models';
import { CampusMapComponent } from '../../shared/components/campus-map/campus-map.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonToast,
    CampusMapComponent
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  // Navigation tabs: 'home' | 'map' | 'queue' | 'history' | 'messages'
  public currentTab: 'home' | 'map' | 'queue' | 'history' | 'messages' = 'home';
  public chatInputText: string = '';

  // Dedicated Notifications Tab filtering
  public notifFilter: 'all' | 'trip' | 'queue' | 'system' = 'all';

  public get filteredNotifications(): AppNotification[] {
    const list = this.stateService.getStateSnapshot().notifications || [];
    if (this.notifFilter === 'all') return list;
    return list.filter(n => n.type === this.notifFilter);
  }

  public get unreadNotificationCount(): number {
    const list = this.stateService.getStateSnapshot().notifications || [];
    return list.filter(n => !n.isRead).length;
  }

  public markAllNotificationsRead(): void {
    this.stateService.markNotificationsAsRead();
    this.displayToast('Lahat ng notifications ay namarkahang nabasa na.');
  }

  public onNotificationCardClick(notif: AppNotification): void {
    if (notif.type === 'trip' || notif.type === 'queue') {
      this.currentTab = 'queue';
      this.stateService.setActiveTab('queue');
    }
  }

  public getNotificationTypeIcon(type: string): string {
    if (type === 'trip' || type === 'driver') return 'bicycle-outline';
    if (type === 'queue') return 'flash-outline';
    if (type === 'safety') return 'shield-checkmark-outline';
    return 'notifications-outline';
  }

  private requireSignInForBooking(): boolean {
    if (this.authService.isAuthenticated) {
      return true;
    }
    const isFil = this.langService.currentLanguage === 'fil';
    this.displayToast(
      isFil
        ? 'Mag-sign in muna para makapag-book ng pedicab. View-only ang Guest mode.'
        : 'Please sign in first to book a pedicab. Guest mode is view-only.'
    );
    if (this.authService.isGuestBrowsing) {
      this.authService.exitGuestMode();
    }
    this.authService.isAuthModalOpen = true;
    return false;
  }

  // Queue form selection
  public selectedPickupId = 'loc-gate';
  public selectedDestId = 'loc-cict';
  public pickupInstructions = '';
  public passengerCount = 1;

  public setPassengerCount(count: number): void {
    this.passengerCount = Math.max(1, Math.min(4, count));
  }

  public incrementPassengerCount(): void {
    if (this.passengerCount < 4) {
      this.passengerCount++;
    }
  }

  public decrementPassengerCount(): void {
    if (this.passengerCount > 1) {
      this.passengerCount--;
    }
  }

  // Campus Fare (Default: ₱10/head, configurable by Admin)
  public farePerHead = 10;
  public get totalBookingFare(): number {
    return this.passengerCount * this.farePerHead;
  }

  // ==================== AUTHENTIC GRAB SCREEN NAVIGATION ENGINE ====================
  // 'entry': Screen 1 (Image 1: Top Blue Header, "Where to?" rounded search bar, Group Ride promo, Frequently Used list)
  // 'search': Screen 2 (Image 2: Pickup/Drop-off dual field, Suggested/Recent tabs, Choose on Map pill)
  // 'map_pick': Screen 3 (Image 3: Full-screen interactive map with center pin, Suggested pickup spots bottom sheet, "Choose This Pickup")
  // 'confirm': Screen 4 (Image 4 & 5: Map with route line + Grab bottom sheet with vehicle card, expandable passenger selector, and Book button)
  public grabScreen: 'entry' | 'search' | 'map_pick' | 'confirm' = 'entry';
  public activeSearchTarget: 'pickup' | 'destination' = 'destination';
  public locationSearchQuery = '';
  public activeSearchTab: 'suggested' | 'saved' | 'recent' = 'suggested';
  public isVehicleDrawerExpanded = true;

  public get filteredCampusLocations(): CampusLocation[] {
    const list = (this.stateService.getStateSnapshot().locations || [])
      .filter(l => l.status === 'approved' || !l.status);
    if (!this.locationSearchQuery.trim()) return list;
    const q = this.locationSearchQuery.toLowerCase().trim();
    return list.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.buildingNumber.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q)
    );
  }

  public get popularCampusLocations(): CampusLocation[] {
    const list = (this.stateService.getStateSnapshot().locations || [])
      .filter(l => l.status === 'approved' || !l.status);
    const priorityCodes = ['GATE', 'TERM', 'CICT', 'ENG', 'COE', 'GYM', 'POOL', 'ARCH', 'CED', 'CRIM', 'CMBT', 'LIB', 'ADM', 'MUS', 'GRD', 'MRT', 'CAF'];
    return list.filter(l => priorityCodes.includes(l.code));
  }

  public openGrabSearch(target: 'pickup' | 'destination' = 'destination'): void {
    this.activeSearchTarget = target;
    this.locationSearchQuery = '';
    this.grabScreen = 'search';
  }

  public openGrabMapPick(): void {
    this.grabScreen = 'map_pick';
  }

  public confirmMapPickup(): void {
    if (this.selectedDestId) {
      this.grabScreen = 'confirm';
    } else {
      this.activeSearchTarget = 'destination';
      this.grabScreen = 'search';
    }
  }

  public selectGrabDestination(loc: CampusLocation): void {
    this.selectedDestId = loc.id;
    this.updateNearestBicycles();
    // Smooth transition straight to Grab Screen 4 (Confirm Ride Sheet with Map Route)!
    this.grabScreen = 'confirm';
    this.displayToast(`Drop-off: ${loc.name}`);
  }

  public selectGrabPickup(loc: CampusLocation): void {
    const locs = this.stateService.getStateSnapshot().locations;
    const lat = loc.pickupCoordinates?.lat ?? loc.coordinates.lat;
    const lng = loc.pickupCoordinates?.lng ?? loc.coordinates.lng;
    this.customPickupPin = this.pickupService.buildPickupPin(
      lat,
      lng,
      locs
    );
    this.selectedPickupId = loc.id;
    this.activeSearchTarget = 'destination';
    this.displayToast(`Pickup: ${loc.name}`);
  }

  public useCurrentGpsLocation(): void {
    if (this.currentGeoPosition) {
      const locs = this.stateService.getStateSnapshot().locations;
      this.customPickupPin = this.pickupService.buildPickupPin(
        this.currentGeoPosition.lat,
        this.currentGeoPosition.lng,
        locs
      );
      this.activeSearchTarget = 'destination';
      this.displayToast('Pickup set to current GPS location');
    } else {
      this.geoService.detectOrInitPosition();
      this.displayToast('Detecting GPS location...');
    }
  }

  public backToEntry(): void {
    this.grabScreen = 'entry';
  }

  public backToSearch(): void {
    this.grabScreen = 'search';
  }

  // Feature 1: Custom Pickup Pin State
  public customPickupPin: CustomPickupPin | null = null;
  public enablePinDropMode = false;

  // Feature 2: Nearest Bicycles State
  public nearestBicycles: NearestBicycleResult[] = [];
  public currentGeoPosition: GeoPosition | null = null;

  // Feature 4: Live Route Tracking Session
  public activeTrackingSession: RouteTrackingSession | null = null;
  public recentlyCompletedBooking: BookingRequest | null = null;
  private lastKnownActiveBookingId: string | null = null;

  // Quick destination/pickup filter search
  public destinationSearchText = '';
  public searchTargetMode: 'pickup' | 'destination' = 'destination';

  public openLocationSearch(target: 'pickup' | 'destination' = 'destination'): void {
    this.searchTargetMode = target;
    this.destinationSearchText = '';
    this.isSearchModalOpen = true;
  }

  public selectLocationFromSearch(loc: CampusLocation): void {
    if (this.searchTargetMode === 'pickup') {
      const locs = this.stateService.getStateSnapshot().locations;
      this.customPickupPin = this.pickupService.buildPickupPin(
        loc.coordinates.lat,
        loc.coordinates.lng,
        locs
      );
      this.selectedPickupId = loc.id;
      this.isSearchModalOpen = false;
      this.updateNearestBicycles();
      this.displayToast(`Pickup set to: ${loc.name} (${loc.buildingNumber})`);
    } else {
      this.selectedDestId = loc.id;
      this.isSearchModalOpen = false;
      this.updateNearestBicycles();
      this.currentTab = 'queue';
      this.displayToast(`Destination set: ${loc.name} (${loc.buildingNumber})`);
    }
  }

  // Toast
  public showToast = false;
  public toastMessage = '';

  // Modals
  public isEditProfileOpen = false;
  public isChangePasswordOpen = false;
  public isTicketQROpen = false;
  public isSearchModalOpen = false;
  public isRateModalOpen = false;
  public isBikePassModalOpen = false;
  public selectedTripDetails: Trip | null = null;
  public isTripModalOpen = false;

  // Rating state (Reference Image 2 Screen 8)
  public selectedRating = 5;
  public ratingComment = '';
  public ratingTags: string[] = ['On-time pickup', 'Friendly driver', 'Safe driving', 'Clean bicycle'];
  public selectedRatingTags: string[] = ['On-time pickup', 'Safe driving'];

  // Profile fields
  public editName = '';
  public editPhone = '';
  public editDept = '';

  private subs = new Subscription();
  private xamppPollInterval: any = null;
  private cancelledBookingIds = new Set<string>();

  public setAppLanguage(lang: SupportedLanguage): void {
    this.langService.setLanguage(lang);
    this.displayToast(lang === 'en' ? 'App language set to English (Default)' : 'Pinalitan ang wika sa Filipino');
  }

  private lastKnownBookingStatus: string | null = null;

  constructor(
    public authService: AuthService,
    public stateService: StateService,
    public apiService: ApiService,
    public langService: LanguageService,
    public geoService: GeolocationService,
    public pickupService: PickupLocationService,
    public bicycleFinder: BicycleFinderService,
    public trackingService: BicycleTrackingService,
    public chatService: ChatService,
    public notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ location, mapOutline, bicycleOutline, locationOutline, arrowForwardOutline, closeCircleOutline, alertCircleOutline, refreshOutline, callOutline, qrCodeOutline, arrowBackOutline, shieldCheckmarkOutline, flashOutline, globeOutline, locateOutline, chatbubbleEllipsesOutline, person, cashOutline, pricetagOutline, ellipsisHorizontal, personCircleOutline, schoolOutline, logInOutline, languageOutline, checkmarkCircle, createOutline, chevronForwardOutline, keyOutline, personOutline, swapHorizontalOutline, logOutOutline, checkmarkDoneOutline, notificationsOutline, searchOutline, closeOutline, bicycle, chevronDownOutline, navigateOutline, timeOutline, peopleOutline, ticketOutline, checkmarkCircleOutline, layersOutline, sparklesOutline, radioOutline, star, starOutline, cardOutline, chatbubbleOutline, pinOutline, walkOutline, speedometerOutline, batteryChargingOutline, addOutline, removeOutline, people, chevronBackOutline, checkmarkOutline, chevronUpOutline, restaurantOutline, businessOutline, send, sendOutline, chatbubbles, chatbubblesOutline, chatbubbleEllipses, call, thumbsUp, thumbsUpOutline, ellipsisVertical });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.editName = user.fullName || '';
      this.editPhone = user.phone || '';
      this.editDept = user.department || 'College of Information & Communications Technology (CICT)';
    }

    // Subscribe to Geolocation
    this.subs.add(
      this.geoService.currentPosition$.subscribe(pos => {
        this.currentGeoPosition = pos;
        this.updateNearestBicycles();
      })
    );

    // Subscribe to Bicycles for real-time recalculation & capacity reflection
    this.subs.add(
      this.stateService.bicycles$.subscribe(() => {
        this.updateNearestBicycles();
        this.cdr.detectChanges();
      })
    );

    // Subscribe to Bookings for real-time driver acceptance, arrival, and drop-off reflection
    this.subs.add(
      this.stateService.bookings$.subscribe(bookings => {
        const active = this.myActiveBooking;
        if (active) {
          // Detect real-time booking status change on active ride
          if (this.lastKnownBookingStatus && this.lastKnownBookingStatus !== active.status) {
            this.handleStudentBookingStatusTransition(active, this.lastKnownBookingStatus, active.status);
          }
          this.lastKnownBookingStatus = active.status;
          this.lastKnownActiveBookingId = active.id;
          this.recentlyCompletedBooking = null;
        } else if (this.lastKnownActiveBookingId) {
          const justFinished = bookings.find(b => b.id === this.lastKnownActiveBookingId && b.status === 'completed');
          if (justFinished) {
            this.recentlyCompletedBooking = justFinished;
            this.lastKnownActiveBookingId = null;
            this.lastKnownBookingStatus = null;
            const isFil = this.langService.currentLanguage === 'fil';
            this.notificationService.notify(
              isFil ? '🎉 Naihatid na sa Destinasyon!' : '🎉 Arrived at Destination!',
              isFil
                ? `Ligtas na nakarating sa ${justFinished.destinationName} kasama si ${justFinished.assignedDriverName || 'Driver'}. Pamasahe: ₱${justFinished.fareAmount || 10}.00`
                : `You have arrived safely at ${justFinished.destinationName} with ${justFinished.assignedDriverName || 'Driver'}. Fare: ₱${justFinished.fareAmount || 10}.00`,
              'trip',
              undefined,
              undefined,
              'completed'
            );
          }
        }
        this.updateNearestBicycles();
        this.cdr.detectChanges();
      })
    );

    // Subscribe to Chat Messages for real-time cross-tab messages from driver
    this.subs.add(
      this.chatService.messages$.subscribe(() => {
        this.cdr.detectChanges();
        if (this.isMessengerOpen) {
          setTimeout(() => this.scrollToBottom(), 60);
        }
      })
    );

    // Subscribe to Queues & Trips for real-time boarding & drop-off updates
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

    // Subscribe to active route tracking session
    this.subs.add(
      this.trackingService.activeSession$.subscribe(session => {
        this.activeTrackingSession = session;
      })
    );

    // Subscribe to Admin Fare per Head (Default ₱10/pax)
    this.subs.add(
      this.stateService.farePerHead$.subscribe(fare => {
        this.farePerHead = fare;
      })
    );

    // Subscribe to Global Active Tab Navigation from Header (Notifications, Profile, Map, etc.)
    this.subs.add(
      this.stateService.activeTab$.subscribe(tab => {
        if (tab && tab !== this.currentTab) {
          this.currentTab = tab as any;
        }
      })
    );

    // Subscribe to Header Search Pinning (Pins location on map and switches to map view)
    this.subs.add(
      this.stateService.searchPinnedLocation$.subscribe(loc => {
        if (loc) {
          const locs = this.stateService.getStateSnapshot().locations;
          this.customPickupPin = this.pickupService.buildPickupPin(
            loc.coordinates.lat,
            loc.coordinates.lng,
            locs
          );
          this.selectedDestId = loc.id;
          this.currentTab = 'map';
          const isFil = this.langService.currentLanguage === 'fil';
          this.displayToast(isFil ? `Nai-pin sa mapa: ${loc.name}` : `Pinned on map: ${loc.name}`);
        }
      })
    );

    // Set initial custom pickup pin at NEUST Terminal / Main Entrance (inside boundary)
    const locs = this.stateService.getStateSnapshot().locations;
    this.customPickupPin = this.pickupService.buildPickupPin(15.444889, 120.940417, locs);

    // Poll XAMPP backend every 2 seconds for cross-device booking & live driver GPS updates
    this.xamppPollInterval = setInterval(() => {
      const active = this.myActiveBooking;
      if (!active || this.cancelledBookingIds.has(active.id)) return;

      this.apiService.getBookingStatusXampp(active.id).subscribe(res => {
        if (this.cancelledBookingIds.has(active.id) || this.myActiveBooking?.id !== active.id) return;
        if (res.success && res.booking) {
          this.stateService.syncRemoteBooking(res.booking);
          this.cdr.detectChanges();
        }
      });

      if (
        active.status === 'driver_arriving' ||
        active.status === 'driver_arrived' ||
        active.status === 'in_progress'
      ) {
        this.apiService.getLiveTrackingXampp(active.id, active.studentId).subscribe(trackRes => {
          const driver = trackRes?.booking?.driver;
          if (trackRes?.status === 'success' && driver?.lat && driver?.lng) {
            const bikeNo = driver.bike_number || active.assignedBikeNumber;
            if (bikeNo) {
              this.stateService.syncRemoteDriverLocation(
                bikeNo,
                Number(driver.lat),
                Number(driver.lng),
                driver.heading !== undefined ? Number(driver.heading) : undefined
              );
              this.cdr.detectChanges();
            }
          }
        });
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.xamppPollInterval) {
      clearInterval(this.xamppPollInterval);
      this.xamppPollInterval = null;
    }
    this.stateService.setMessengerOpen(false);
    this.subs.unsubscribe();
  }

  // --- Feature 1: Custom Pickup Pin Handlers ---

  public togglePinDropMode(): void {
    this.enablePinDropMode = !this.enablePinDropMode;
    if (this.enablePinDropMode) {
      this.currentTab = 'map';
      this.displayToast('Map Pin Mode Activated: Tap or drag pin to select your pickup location.');
    }
  }

  public onPickupPinChanged(pin: CustomPickupPin): void {
    this.customPickupPin = pin;
    this.updateNearestBicycles();

    if (!pin.isInsideCampusBoundary) {
      this.displayToast('⚠️ Warning: Selected pin is outside permitted NEUST campus boundaries.');
    }
  }

  public useCurrentGPSLocation(): void {
    if (!this.currentGeoPosition) return;
    const locs = this.stateService.getStateSnapshot().locations;
    this.customPickupPin = this.pickupService.buildPickupPin(
      this.currentGeoPosition.lat,
      this.currentGeoPosition.lng,
      locs
    );
    this.updateNearestBicycles();
    this.displayToast(`Pickup pin set to your current GPS position (${this.customPickupPin.addressText}).`);
  }

  // --- Feature 2: Nearest Bicycle Finder Handlers ---

  public updateNearestBicycles(): void {
    const bikes = this.stateService.getStateSnapshot().bicycles;
    const originLat = this.customPickupPin ? this.customPickupPin.lat : (this.currentGeoPosition?.lat || 15.446853);
    const originLng = this.customPickupPin ? this.customPickupPin.lng : (this.currentGeoPosition?.lng || 120.939454);

    const locations = this.stateService.getStateSnapshot().locations;
    const dest = locations.find(l => l.id === this.selectedDestId);
    const destName = dest ? dest.name : undefined;

    this.nearestBicycles = this.bicycleFinder.findNearestBicycles(
      originLat,
      originLng,
      bikes,
      destName
    );
  }

  public selectBicycle(result: NearestBicycleResult): void {
    if (!result.isAvailableForTrip) {
      this.displayToast(`Cannot select ${result.bicycle.bikeNumber}: ${result.ineligibilityReason}`);
      return;
    }

    this.displayToast(`Selected ${result.bicycle.bikeNumber} (Driver: ${result.bicycle.driverName})! Proceeding to queue.`);
    this.selectedBike = result.bicycle;
    this.currentTab = 'queue';
  }

  // --- Queue Actions ---

  public joinQueueAction(): void {
    if (!this.requireSignInForBooking()) {
      return;
    }

    if (this.customPickupPin && !this.customPickupPin.isInsideCampusBoundary) {
      this.displayToast('Cannot confirm booking: Please drag your pickup pin inside NEUST campus grounds.');
      return;
    }

    const user = this.authService.currentUser;
    const entry = this.stateService.joinQueue(
      {
        id: user.id,
        name: user.fullName,
        avatarUrl: user.avatarUrl,
        idNumber: user.idNumber
      },
      this.selectedPickupId,
      this.selectedDestId,
      this.customPickupPin || undefined,
      this.pickupInstructions
    );

    // If an available bike was nearest, auto-initiate tracking session preview
    const available = this.nearestBicycles.find(b => b.isAvailableForTrip);
    if (available && this.customPickupPin) {
      const locations = this.stateService.getStateSnapshot().locations;
      const targetDest = locations.find(l => l.id === this.selectedDestId) || locations[1];
      this.trackingService.startTrackingSession(
        'trip-' + Date.now(),
        available.bicycle,
        this.customPickupPin,
        {
          name: targetDest.name,
          lat: targetDest.coordinates.lat,
          lng: targetDest.coordinates.lng
        }
      );
    }

    this.displayToast(`Joined Queue as ${entry.queueNumber}! Position: #${entry.position}`);
  }

  public cancelQueueAction(queueId: string): void {
    this.stateService.cancelQueue(queueId);
    this.trackingService.stopTrackingSession();
    this.displayToast('Your queue ticket was cancelled.');
  }

  public onMapQueueSelected(loc: CampusLocation): void {
    this.selectedDestId = loc.id;
    this.updateNearestBicycles();
    this.currentTab = 'queue';
  }

  // Active queue entry
  public get myActiveQueue(): QueueEntry | undefined {
    const queues = this.stateService.getStateSnapshot().queues;
    const studentId = this.authService.currentUser?.id || 'student-001';
    return queues.find(q =>
      (q.studentId === studentId || q.studentId === 'student-001') &&
      (q.status === 'waiting' || q.status === 'called' || q.status === 'boarded')
    );
  }

  // Queue history
  public get myQueueHistory(): QueueEntry[] {
    const queues = this.stateService.getStateSnapshot().queues;
    const studentId = this.authService.currentUser?.id || 'student-001';
    return queues.filter(q =>
      (q.studentId === studentId || q.studentId === 'student-001') &&
      (q.status === 'completed' || q.status === 'cancelled')
    );
  }

  public openCreateAccountModal(): void {
    this.authService.isAuthModalOpen = true;
  }

  // Completed trips
  public get myTripHistory(): Trip[] {
    return this.stateService.getStateSnapshot().trips;
  }

  // Available pedicabs count & list
  public get availableBikesCount(): number {
    return this.stateService.getStateSnapshot().bicycles.filter(b => b.status === 'available' || b.status === 'almost_full').length;
  }

  public get allOperationalBicycles(): Bicycle[] {
    const list = this.stateService.getStateSnapshot().bicycles || [];
    return list.filter(b => b.status === 'available' || b.status === 'almost_full');
  }

  // Returns count of active pedicabs with at least `seatsNeeded` available seats
  public getAvailableBikesForCapacity(seatsNeeded: number): number {
    return this.allOperationalBicycles.filter(b => (b.maxCapacity - b.passengerCount) >= seatsNeeded).length;
  }

  // Returns list of active pedicabs with at least `seatsNeeded` available seats
  public getAvailableBikesListForCapacity(seatsNeeded: number): Bicycle[] {
    return this.allOperationalBicycles.filter(b => (b.maxCapacity - b.passengerCount) >= seatsNeeded);
  }

  // Count of pedicabs matching current passengerCount selection
  public get currentCapacityAvailableBikesCount(): number {
    return this.getAvailableBikesForCapacity(this.passengerCount);
  }

  public get availablePedicabsList(): Bicycle[] {
    const bikes = this.stateService.getStateSnapshot().bicycles;
    // Only pedicabs that can actually take passengers (exclude full, on trip, maintenance, offline)
    return bikes.filter(b =>
      (b.status === 'available' || b.status === 'almost_full') &&
      b.maxCapacity - b.passengerCount > 0
    );
  }

  @ViewChildren(CampusMapComponent) private campusMapComponents?: QueryList<CampusMapComponent>;

  public selectTab(tab: 'home' | 'map' | 'queue' | 'history' | 'messages'): void {
    this.currentTab = tab;
    this.stateService.setActiveTab(tab);
    if (tab === 'map') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        this.campusMapComponents?.forEach(m => m.invalidateMapSize());
      }, 80);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        this.campusMapComponents?.forEach(m => m.invalidateMapSize());
      }, 300);
    }
    if (tab === 'queue') {
      if (!this.myActiveBooking && !this.myActiveQueue) {
        this.grabScreen = 'entry';
      }
    }
    if (tab === 'messages') {
      this.chatService.markAllAsRead();
    }
  }

  @ViewChild('messengerStream') private messengerStreamRef?: ElementRef;

  public isMessengerOpen: boolean = false;

  public get isDriverAssigned(): boolean {
    return !!this.myActiveBooking && (
      this.myActiveBooking.status === 'accepted' ||
      this.myActiveBooking.status === 'driver_arriving' ||
      this.myActiveBooking.status === 'driver_arrived' ||
      this.myActiveBooking.status === 'in_progress'
    );
  }

  public openMessengerChat(): void {
    this.isMessengerOpen = true;
    this.stateService.setMessengerOpen(true);
    this.chatService.markAllAsRead();
    setTimeout(() => this.scrollToBottom(), 80);
  }

  public closeMessengerChat(): void {
    this.isMessengerOpen = false;
    this.stateService.setMessengerOpen(false);
  }

  public scrollToBottom(): void {
    try {
      if (this.messengerStreamRef?.nativeElement) {
        const el = this.messengerStreamRef.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
  }

  public get activeBookingMessages() {
    return this.chatService.getMessagesForBooking(this.myActiveBooking?.id);
  }

  public get latestDriverMessage() {
    return this.chatService.getLatestMessageForBooking(this.myActiveBooking?.id);
  }

  public get unreadMessagesCount(): number {
    return this.chatService.currentMessages.filter(m => m.senderRole === 'driver' && !m.isRead).length;
  }

  public sendStudentMessage(): void {
    if (!this.chatInputText || !this.chatInputText.trim()) return;
    const user = this.authService.currentUser;
    this.chatService.sendStudentMessage(
      this.chatInputText,
      user?.id || 'student-001',
      user?.fullName || 'Juan Dela Cruz',
      this.myActiveBooking
    );
    this.chatInputText = '';
    setTimeout(() => this.scrollToBottom(), 60);
  }

  public sendQuickMessage(presetText: string): void {
    const user = this.authService.currentUser;
    this.chatService.sendStudentMessage(
      presetText,
      user?.id || 'student-001',
      user?.fullName || 'Juan Dela Cruz',
      this.myActiveBooking
    );
    setTimeout(() => this.scrollToBottom(), 60);
  }

  public closeBookingFlow(): void {
    this.selectTab('home');
  }

  public openQuickRideSearch(): void {
    this.selectTab('queue');
    this.grabScreen = 'search';
    this.activeSearchTarget = 'destination';
  }

  public bookPedicab(bike: Bicycle): void {
    if (!this.requireSignInForBooking()) {
      return;
    }
    this.selectedBike = bike;
    this.selectTab('queue');
    this.grabScreen = 'confirm';
    this.displayToast(`Selected ${bike.bikeNumber} with driver ${bike.driverName}. Confirm your pickup location.`);
  }

  // --- JoyRide Enhanced Transportation Booking ---

  private cachedActiveTripPinKey = '';
  private cachedActiveTripPin: CustomPickupPin | null = null;

  public get myActiveBooking(): BookingRequest | undefined {
    const studentId = this.authService.currentUser?.id || 'student-001';
    return this.stateService.getActiveBookingForStudent(studentId);
  }

  public get activeTripPickupPin(): CustomPickupPin | null {
    const active = this.myActiveBooking;
    if (active) {
      const key = `${active.id}::${active.pickupLat}::${active.pickupLng}::${active.pickupName}`;
      if (key !== this.cachedActiveTripPinKey || !this.cachedActiveTripPin) {
        this.cachedActiveTripPinKey = key;
        this.cachedActiveTripPin = {
          lat: active.pickupLat,
          lng: active.pickupLng,
          addressText: active.pickupName,
          nearestBuildingName: active.pickupName,
          nearestBuildingNumber: '',
          distanceToNearestMeters: 0,
          isInsideCampusBoundary: true
        };
      }
      return this.cachedActiveTripPin;
    }
    this.cachedActiveTripPinKey = '';
    this.cachedActiveTripPin = null;
    return this.customPickupPin;
  }

  public get bookingRouteDistance(): number {
    const pLat = this.customPickupPin?.lat || 15.444889;
    const pLng = this.customPickupPin?.lng || 120.940417;
    const dest = this.selectedDestination;
    const dLat = dest ? (dest.dropoffCoordinates?.lat ?? dest.coordinates.lat) : 15.449353;
    const dLng = dest ? (dest.dropoffCoordinates?.lng ?? dest.coordinates.lng) : 120.940410;
    return Math.max(100, this.stateService.calculateHaversineMeters(pLat, pLng, dLat, dLng));
  }

  public get bookingRouteEta(): number {
    return Math.max(2, Math.round(this.bookingRouteDistance / 150));
  }

  public pinOnMap(): void {
    this.currentTab = 'map';
    this.displayToast('I-click o i-drag ang pin sa nais mong pickup point sa mapa.');
  }

  public bookPedicabJoyRide(): void {
    if (!this.requireSignInForBooking()) {
      return;
    }

    if (this.isPickupInvalid) {
      this.displayToast('⚠️ Nasa labas ng campus boundary ang pickup point mo. Mangyaring i-pin ito sa loob ng NEUST.');
      return;
    }

    const user = this.authService.currentUser;
    const student = {
      id: user?.id || 'student-001',
      name: user?.fullName || 'Maria Angela Santos',
      idNumber: user?.idNumber || '2023-01042',
      phone: user?.phone || '0927-123-4567',
      avatarUrl: user?.avatarUrl
    };

    const pickupName = this.customPickupPin?.addressText || 'NEUST Terminal Gate';
    const pickupLat = this.customPickupPin?.lat || 15.444889;
    const pickupLng = this.customPickupPin?.lng || 120.940417;

    const dest = this.selectedDestination;
    const destName = dest ? `${dest.name} (${dest.buildingNumber})` : 'College of Information & Communications Technology (CICT)';
    const destLat = dest ? (dest.dropoffCoordinates?.lat ?? dest.coordinates.lat) : 15.449353;
    const destLng = dest ? (dest.dropoffCoordinates?.lng ?? dest.coordinates.lng) : 120.940410;

    const booking = this.stateService.createTransportationBooking(
      student,
      {
        name: pickupName,
        lat: pickupLat,
        lng: pickupLng,
        instructions: this.pickupInstructions,
        locationId: this.selectedPickupId
      },
      {
        name: destName,
        lat: destLat,
        lng: destLng,
        locationId: this.selectedDestId
      },
      this.passengerCount,
      this.selectedBike?.bikeNumber
    );

    this.lastKnownActiveBookingId = booking.id;
    this.recentlyCompletedBooking = null;

    // Call XAMPP backend asynchronously and lock onto server booking_uid for 2-phone sync
    this.apiService.createBookingXampp(booking).subscribe(res => {
      if (res.success && res.booking?.id) {
        if (this.cancelledBookingIds.has(booking.id)) {
          this.cancelledBookingIds.add(res.booking.id);
          this.apiService.cancelBookingXampp(res.booking.id).subscribe();
          return;
        }
        this.lastKnownActiveBookingId = res.booking.id;
        this.stateService.syncRemoteBooking(res.booking, booking.id);
      } else if (!res.success && (res as any).existingBookingUid) {
        // If an old stuck booking exists in MySQL, cancel it and re-push this booking cleanly
        const oldId = (res as any).existingBookingUid;
        this.apiService.cancelBookingXampp(oldId, 'Replaced by new booking').subscribe(() => {
          this.apiService.createBookingXampp(booking).subscribe(retryRes => {
            if (retryRes.success && retryRes.booking?.id) {
              this.lastKnownActiveBookingId = retryRes.booking.id;
              this.stateService.syncRemoteBooking(retryRes.booking, booking.id);
            }
          });
        });
      }
    });

    const eligibleCount = booking.eligibleBikeNumbers?.length || 0;
    const bikesText = booking.eligibleBikeNumbers?.join(', ') || 'online pedicabs';
    const isFil = this.langService.currentLanguage === 'fil';
    this.displayToast(
      isFil
        ? `📡 Nag-popup na sa ${eligibleCount} available na pedicab (${bikesText}) na may ≥${this.passengerCount} upuan! Paunahan sila sa pag-accept.`
        : `📡 Sent request to ${eligibleCount} available pedicab(s) (${bikesText}) with ≥${this.passengerCount} open seats! Waiting for a driver to accept.`
    );
  }

  public dismissCompletedBookingBanner(): void {
    this.recentlyCompletedBooking = null;
    this.grabScreen = 'entry';
  }

  public cancelBookingJoyRide(bookingId: string): void {
    this.cancelledBookingIds.add(bookingId);
    this.lastKnownActiveBookingId = null;
    this.recentlyCompletedBooking = null;
    this.grabScreen = 'entry';
    this.stateService.cancelTransportationBooking(bookingId);
    this.apiService.cancelBookingXampp(bookingId).subscribe();
    this.displayToast('Booking request cancelled.');
  }

  public retryBookingJoyRide(bookingId: string): void {
    this.stateService.retryTransportationBooking(bookingId);
    this.displayToast('Muling naghahanap ng available na driver...');
  }

  // --- Booking UI helpers ---
  public selectedBike: Bicycle | null = null;

  public readonly popularDestinationIds = ['loc-cict', 'loc-admin', 'loc-eng', 'loc-lib', 'loc-cmbt', 'loc-gate'];

  public get popularDestinations(): CampusLocation[] {
    const locs = this.stateService.getStateSnapshot().locations;
    return this.popularDestinationIds
      .map(id => locs.find(l => l.id === id))
      .filter((l): l is CampusLocation => !!l);
  }

  public get selectedDestination(): CampusLocation | undefined {
    return this.stateService.getStateSnapshot().locations.find(l => l.id === this.selectedDestId);
  }

  /** Pedicab shown in the booking summary: the one the student picked, otherwise the nearest eligible one. */
  public get bookingPedicab(): Bicycle | null {
    if (this.selectedBike) return this.selectedBike;
    const nearest = this.nearestBicycles.find(r => r.isAvailableForTrip);
    return nearest ? nearest.bicycle : null;
  }

  public get bookingEtaMinutes(): number | null {
    const bike = this.bookingPedicab;
    if (!bike) return null;
    const match = this.nearestBicycles.find(r => r.bicycle.id === bike.id);
    return match ? match.estimatedArrivalMinutes : null;
  }

  public get bookingDistanceMeters(): number | null {
    const bike = this.bookingPedicab;
    if (!bike) return null;
    const match = this.nearestBicycles.find(r => r.bicycle.id === bike.id);
    return match ? match.straightLineDistanceMeters : null;
  }

  public get isPickupInvalid(): boolean {
    return !!this.customPickupPin && !this.customPickupPin.isInsideCampusBoundary;
  }

  public chooseDestination(locId: string): void {
    this.selectedDestId = locId;
    this.updateNearestBicycles();
  }

  public clearSelectedBike(): void {
    this.selectedBike = null;
  }

  // --- Real-time Terminal Detection & Queue Monitoring ---
  public readonly TERMINAL_LOCATIONS = [
    {
      id: 'term-gate',
      locationId: 'loc-gate',
      name: 'NEUST Main Gate Terminal (Pilahan sa Gate)',
      shortName: 'Main Gate Terminal',
      landmark: 'Main Entrance Pilahan • 15.444889, 120.940417',
      lat: 15.444889,
      lng: 120.940417,
      radiusMeters: 90
    },
    {
      id: 'term-arch',
      locationId: 'loc-arch',
      name: 'College of Architecture Terminal (Paradahan sa Archi)',
      shortName: 'Architecture Terminal',
      landmark: 'Architecture Building Paradahan • 15.446868, 120.939533',
      lat: 15.446868,
      lng: 120.939533,
      radiusMeters: 90
    }
  ];

  public get terminalQueues() {
    const bikes = this.stateService.getStateSnapshot().bicycles || [];
    return this.TERMINAL_LOCATIONS.map(term => {
      const queuedBikes = bikes.filter(bike => {
        // Pedicab must be actively waiting (not on trip, not offline, not in maintenance, not full)
        if (bike.status === 'maintenance' || bike.status === 'offline' || bike.status === 'on_trip') {
          return false;
        }
        if (bike.passengerCount >= bike.maxCapacity) {
          return false;
        }

        if (!bike.currentLocation) return false;
        const dist = this.bicycleFinder.calculateHaversineDistance(
          term.lat,
          term.lng,
          bike.currentLocation.lat,
          bike.currentLocation.lng
        );

        return dist <= term.radiusMeters;
      });

      const count = queuedBikes.length;
      const totalSeats = queuedBikes.reduce((acc, b) => acc + (b.maxCapacity - b.passengerCount), 0);

      let statusText = 'Ready to Board';
      let statusColor: 'green' | 'amber' | 'gray' = 'green';
      let etaWaitText = 'No waiting time • Sakay agad';

      if (count === 0) {
        statusText = 'No Pedicab Parked';
        statusColor = 'gray';
        etaWaitText = 'Estimated ~3-5 mins wait';
      } else if (count === 1) {
        statusText = '1 Pedicab in Queue';
        statusColor = 'amber';
        etaWaitText = '~1-2 mins board time';
      } else {
        statusText = `${count} Pedicabs Ready in Queue`;
        statusColor = 'green';
        etaWaitText = 'Ready to Board • Fast queue';
      }

      return {
        id: term.id,
        name: term.name,
        shortName: term.shortName,
        landmark: term.landmark,
        lat: term.lat,
        lng: term.lng,
        locationId: term.locationId,
        bicycles: queuedBikes,
        availableCount: count,
        totalSeats,
        statusText,
        statusColor,
        etaWaitText
      };
    });
  }

  public bookFromTerminal(terminal: any): void {
    this.selectedPickupId = terminal.locationId;
    this.customPickupPin = {
      lat: terminal.lat,
      lng: terminal.lng,
      addressText: terminal.name,
      isInsideCampusBoundary: true
    };
    this.updateNearestBicycles();
    this.selectTab('queue');
    this.grabScreen = 'confirm';
    this.displayToast(`Pickup set to ${terminal.name}. Pumili ng pupuntahan.`);
  }

  public get activeBikesCount(): number {
    return this.stateService.getStateSnapshot().bicycles.filter(b => b.status === 'on_trip').length;
  }

  public get totalWaitingStudents(): number {
    return this.stateService.getStateSnapshot().queues.filter(q => q.status === 'waiting').length;
  }

  public quickSelectDestination(locId: string): void {
    this.selectedDestId = locId;
    this.updateNearestBicycles();
    this.currentTab = 'queue';
  }

  public saveProfile(): void {
    this.authService.updateProfile({
      fullName: this.editName,
      phone: this.editPhone,
      department: this.editDept
    });
    this.isEditProfileOpen = false;
    this.displayToast('Student profile updated successfully.');
  }

  public viewTripDetails(trip: Trip): void {
    this.selectedTripDetails = trip;
    this.isTripModalOpen = true;
  }

  public get searchFilteredLocations(): CampusLocation[] {
    const locs = this.stateService.getStateSnapshot().locations;
    if (!this.destinationSearchText.trim()) return locs;
    const q = this.destinationSearchText.toLowerCase();
    return locs.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.buildingNumber.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q)
    );
  }

  public selectSearchDestination(loc: CampusLocation): void {
    this.selectLocationFromSearch(loc);
  }

  public toggleRatingTag(tag: string): void {
    const idx = this.selectedRatingTags.indexOf(tag);
    if (idx > -1) {
      this.selectedRatingTags.splice(idx, 1);
    } else {
      this.selectedRatingTags.push(tag);
    }
  }

  public submitRating(): void {
    this.isRateModalOpen = false;
    this.displayToast(`Thank you! Rated ${this.selectedRating} ★ for ${this.activeTrackingSession?.driverName || 'driver'}.`);
  }

  private handleStudentBookingStatusTransition(booking: BookingRequest, oldStatus: string, newStatus: string): void {
    const isFil = this.langService.currentLanguage === 'fil';
    if (newStatus === 'driver_arrived') {
      // Driver arrived at student pickup location: Special 4-tone arrival chime + strong double vibration pattern
      this.notificationService.notify(
        isFil ? '📍 Nandiyan na si Kuya Driver!' : '📍 Driver Has Arrived at Pickup!',
        isFil
          ? `Nandito na si Kuya ${booking.assignedDriverName || 'Driver'} (${booking.assignedBikeNumber}) sa ${booking.pickupName}! Maaari ka nang sumakay.`
          : `Kuya ${booking.assignedDriverName || 'Driver'} (${booking.assignedBikeNumber}) has arrived at ${booking.pickupName}! Please meet your pedicab.`,
        'trip',
        undefined,
        undefined,
        'arrival'
      );
    } else if (newStatus === 'driver_arriving' || newStatus === 'accepted') {
      this.notificationService.notify(
        isFil ? '🚴 Tinanggap ang Iyong Booking!' : '🚴 Driver Accepted Your Ride!',
        isFil
          ? `Tinanggap ni Kuya ${booking.assignedDriverName || 'Driver'} (${booking.assignedBikeNumber}) ang biyahe at papunta na sa ${booking.pickupName}.`
          : `Kuya ${booking.assignedDriverName || 'Driver'} (${booking.assignedBikeNumber}) accepted your ride and is en route to ${booking.pickupName}.`,
        'trip',
        undefined,
        undefined,
        'accepted'
      );
    } else if (newStatus === 'in_progress') {
      this.notificationService.notify(
        isFil ? '🚀 Nagsimula na ang Biyahe!' : '🚀 Trip In Progress!',
        isFil
          ? `Papunta na sa ${booking.destinationName} lulan ng ${booking.assignedBikeNumber}. Ingat sa biyahe!`
          : `Heading to ${booking.destinationName} on ${booking.assignedBikeNumber}. Have a safe trip!`,
        'trip',
        undefined,
        undefined,
        'general'
      );
    }
  }

  public displayToast(msg: string, type: 'trip' | 'queue' | 'system' | 'safety' | 'driver' = 'system'): void {
    this.notificationService.showInAppToast('NEUST BikeGo', msg, type);
  }
}
