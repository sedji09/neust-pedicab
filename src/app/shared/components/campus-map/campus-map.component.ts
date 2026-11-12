import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  navigateOutline,
  locationOutline,
  personOutline,
  informationCircleOutline,
  layersOutline,
  addOutline,
  removeOutline,
  locateOutline,
  arrowForwardOutline,
  closeOutline,
  timeOutline,
  speedometerOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  mapOutline,
  globeOutline,
  batteryChargingOutline,
  callOutline,
  peopleOutline,
  star,
  pinOutline,
  flameOutline,
  radioOutline,
  shieldCheckmarkOutline,
  shieldOutline
} from 'ionicons/icons';
import {
  Bicycle,
  CampusLocation,
  BicycleStatus,
  CustomPickupPin,
  DesignatedZone,
  RouteTrackingSession,
  DemandHeatPoint,
  BookingRequest
} from '../../../core/models/models';
import { LeafletMapService } from '../../../core/services/leaflet-map.service';
import { PickupLocationService } from '../../../core/services/pickup-location.service';
import { CampusRoutingService } from '../../../core/services/campus-routing.service';
import { LanguageService } from '../../../core/services/language.service';

declare const L: any;

@Component({
  selector: 'app-campus-map',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent
  ],
  templateUrl: './campus-map.component.html',
  styleUrls: ['./campus-map.component.scss']
})
export class CampusMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() bicycles: Bicycle[] = [];
  @Input() locations: CampusLocation[] = [];
  @Input() designatedZones: DesignatedZone[] = [];
  @Input() selectedDestinationId: string | null = null;
  @Input() showHeaderControls = true;
  @Input() compactHeight = false;
  @Input() allowBooking = true;
  @Input() defaultMode: 'visual' | 'leaflet' | 'google' = 'leaflet';

  // Feature 1: Custom Pickup Pin Inputs & Outputs
  @Input() customPickupPin: CustomPickupPin | null = null;
  @Input() enableCustomPickupPin = false;
  @Output() pickupPinChanged = new EventEmitter<CustomPickupPin>();

  // Feature 4: Live Route Tracking Session
  @Input() trackingSession: RouteTrackingSession | null = null;
  @Input() activeBooking: BookingRequest | null = null;

  // Feature 5: Demand Heatmap
  @Input() showHeatmap = false;
  @Input() heatPoints: DemandHeatPoint[] = [];

  @Output() selectBicycle = new EventEmitter<Bicycle>();
  @Output() selectLocation = new EventEmitter<CampusLocation>();
  @Output() queueForDestination = new EventEmitter<CampusLocation>();

  @ViewChild('mapViewport', { static: false }) mapViewport!: ElementRef<HTMLDivElement>;
  @ViewChild('leafletContainer', { static: false }) leafletContainer!: ElementRef<HTMLDivElement>;

  // Display Mode: unified single map ('leaflet')
  public mapMode: 'visual' | 'leaflet' | 'google' = 'leaflet';

  // Layer filter: 'all' | 'bicycles' | 'stations' | 'zones'
  public viewLayer: 'bicycles' | 'stations' | 'zones' | 'all' = 'all';

  // Availability filter: 'all' | 'available' | 'on_trip'
  public filterType: 'all' | 'available' | 'on_trip' = 'all';

  // Unified Trike & Pilahan Filter: 'all' | 'gate' | 'arki' | 'roaming'
  public trikeFilter: 'all' | 'gate' | 'arki' | 'roaming' = 'all';

  // Official Terminal Pilahan Coordinates
  public readonly GATE_COORDS = { lat: 15.444889, lng: 120.940417 };
  public readonly ARKI_COORDS = { lat: 15.446868, lng: 120.939533 };

  // Zoom & Pan state for Visual canvas
  public zoomLevel = 1.0;
  public minZoom = 0.8;
  public maxZoom = 2.4;
  public panX = 0;
  public panY = 0;
  private isDragging = false;
  private startDragX = 0;
  private startDragY = 0;

  // Selected entities for floating card / modal
  public activeBicycle: Bicycle | null = null;
  public activeLocation: CampusLocation | null = null;
  public activeTerminalHub: 'gate' | 'arki' | null = null;
  public isLegendOpen = false;

  // Leaflet map instance and managed layers
  private leafletMap: any = null;
  private leafletBoundaryLayer: any = null;
  private leafletTerminalHubLayers: any[] = [];
  private leafletBikeMarkers: any[] = [];
  private leafletStationMarkers: any[] = [];
  private leafletZoneLayers: any[] = [];
  private leafletPickupMarker: any = null;
  private leafletRoutePolyline: any = null;
  private leafletHeatLayers: any[] = [];
  private resizeObserver: ResizeObserver | null = null;

  // Dedicated JoyRide/Grab Real-Time Tracking Layer Handles
  private leafletPedicabMarker: any = null;
  private leafletPickupStationMarker: any = null;
  private leafletDestinationStationMarker: any = null;

  // Tracking Camera & Deduplication Guards (prevent auto-zoom/pan overrides during user drag)
  private hasFramedTrackingCamera = false;
  private lastFramedTrackingKey = '';
  public userInteractedWithTrackingMap = false;
  private isProgrammaticMove = false;
  private trackingUpdateSeq = 0;
  private lastRenderedTrackingSignature = '';

  constructor(
    private leafletService: LeafletMapService,
    private pickupService: PickupLocationService,
    private routingService: CampusRoutingService,
    public langService: LanguageService
  ) {
    addIcons({
      bicycleOutline,
      navigateOutline,
      locationOutline,
      personOutline,
      informationCircleOutline,
      layersOutline,
      addOutline,
      removeOutline,
      locateOutline,
      arrowForwardOutline,
      closeOutline,
      timeOutline,
      speedometerOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      mapOutline,
      globeOutline,
      batteryChargingOutline,
      callOutline,
      peopleOutline,
      star,
      pinOutline,
      flameOutline,
      radioOutline,
      shieldCheckmarkOutline,
      shieldOutline
    });
  }

  ngOnInit(): void {
    // Always use the unified single Leaflet live GPS map
    this.mapMode = 'leaflet';
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initLeafletMap(), 60);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.leafletMap) {
      if (changes['bicycles']) {
        this.updateLeafletTerminalHubs();
        this.updateLeafletBicycles();
        if (this.activeBooking) {
          this.updateLeafletRoute();
        }
      }
      if (changes['locations'] || changes['selectedDestinationId']) {
        this.updateLeafletTerminalHubs();
        this.updateLeafletLocations();
        if (!this.isLiveTrackingActive()) {
          this.updateLeafletRoute();
        }
      }
      if (changes['designatedZones']) {
        this.updateLeafletZones();
      }
      if (changes['customPickupPin']) {
        const prev = changes['customPickupPin'].previousValue as CustomPickupPin | null | undefined;
        const curr = changes['customPickupPin'].currentValue as CustomPickupPin | null | undefined;
        const coordsChanged =
          !prev ||
          !curr ||
          prev.lat !== curr.lat ||
          prev.lng !== curr.lng ||
          prev.addressText !== curr.addressText;
        if (coordsChanged && !this.isLiveTrackingActive()) {
          this.updateLeafletPickupPin();
          this.updateLeafletRoute();
        }
      }
      if (changes['trackingSession'] || changes['activeBooking']) {
        this.updateLeafletTerminalHubs();
        this.updateLeafletRoute();
      }
      if (changes['showHeatmap'] || changes['heatPoints']) {
        this.updateLeafletHeatmap();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      try { this.resizeObserver.disconnect(); } catch (e) {}
      this.resizeObserver = null;
    }
    if (this.leafletBoundaryLayer) {
      try { this.leafletBoundaryLayer.remove(); } catch (e) {}
    }
    if (this.leafletMap) {
      try {
        this.leafletMap.remove();
      } catch (e) {
        // cleanup safe
      }
    }
  }

  // --- Map Mode Switcher ---

  public setMapMode(mode: 'visual' | 'leaflet' | 'google'): void {
    this.mapMode = 'leaflet';
    setTimeout(() => {
      if (!this.leafletMap) {
        this.initLeafletMap();
      } else {
        this.leafletMap.invalidateSize({ animate: false, pan: false });
        this.refreshAllLeafletLayers();
      }
    }, 80);
  }

  public invalidateMapSize(): void {
    if (this.leafletMap) {
      this.leafletMap.invalidateSize({ animate: false, pan: false });
      this.refreshAllLeafletLayers();
    } else {
      this.initLeafletMap();
    }
  }

  // --- Leaflet Management ---

  private getDefaultCampusZoom(): number {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 16.5;
  }

  private async initLeafletMap(): Promise<void> {
    if (!this.leafletContainer?.nativeElement) return;
    if (this.leafletMap) {
      this.leafletMap.invalidateSize({ animate: false, pan: false });
      return;
    }

    const loaded = await this.leafletService.ensureLeafletLoaded();
    if (!loaded || !this.leafletContainer?.nativeElement || this.leafletMap) return;

    this.leafletMap = this.leafletService.createMap(
      this.leafletContainer.nativeElement,
      15.447000,
      120.939800,
      this.getDefaultCampusZoom()
    );

    if (!this.leafletMap) return;

    // Pause pedicab auto-follow only when the user manually drags away; zoom (+/-) keeps following the pedicab
    this.leafletMap.on('dragstart', () => {
      if (!this.isProgrammaticMove && this.isLiveTrackingActive()) {
        this.userInteractedWithTrackingMap = true;
      }
    });

    // Observe container size changes so Leaflet never renders a 0px blank canvas
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.leafletMap) {
          this.leafletMap.invalidateSize({ animate: false, pan: false });
        }
      });
      this.resizeObserver.observe(this.leafletContainer.nativeElement);
    }

    // Handle map click to drop/move Custom Pickup Pin when enabled
    this.leafletMap.on('click', (e: any) => {
      if (this.enableCustomPickupPin) {
        this.onCoordinatesSelected(e.latlng.lat, e.latlng.lng);
      }
    });

    this.refreshAllLeafletLayers();

    // Ensure Leaflet calculates viewport geometry with zero clipping
    setTimeout(() => {
      if (this.leafletMap) {
        this.leafletMap.invalidateSize({ animate: false, pan: false });
      }
    }, 120);
    setTimeout(() => {
      if (this.leafletMap) {
        this.leafletMap.invalidateSize({ animate: false, pan: false });
      }
    }, 400);
  }

  private refreshAllLeafletLayers(): void {
    if (!this.leafletMap) return;
    this.updateLeafletBoundary();
    this.updateLeafletTerminalHubs();
    this.updateLeafletZones();
    this.updateLeafletLocations();
    this.updateLeafletBicycles();
    this.updateLeafletPickupPin();
    this.updateLeafletRoute();
    this.updateLeafletHeatmap();
  }

  private updateLeafletTerminalHubs(): void {
    if (!this.leafletMap) return;
    this.leafletService.clearLayers(this.leafletMap, this.leafletTerminalHubLayers);
    // Hide terminal hub badges during active single-ride tracking, route preview, or pure Admin location pin-picker mode
    if (this.isLiveTrackingActive() || this.selectedDestinationId || (!this.showHeaderControls && (!this.bicycles || this.bicycles.length === 0))) return;

    this.leafletTerminalHubLayers = this.leafletService.renderTerminalHubMarkers(
      this.leafletMap,
      this.terminalHubSummaries,
      (termId) => {
        this.focusTerminalHub(termId === 'gate' ? 'gate' : 'arki');
      },
      this.langService.currentLanguage
    );
  }

  private updateLeafletBoundary(): void {
    if (!this.leafletMap) return;
    if (this.leafletBoundaryLayer) {
      this.leafletBoundaryLayer.remove();
      this.leafletBoundaryLayer = null;
    }
    this.leafletBoundaryLayer = this.leafletService.renderCampusBoundary(this.leafletMap);
  }

  public isLiveTrackingActive(): boolean {
    return !!(
      this.activeBooking &&
      ['accepted', 'driver_arriving', 'driver_arrived', 'in_progress'].includes(this.activeBooking.status)
    );
  }

  private updateLeafletLocations(): void {
    if (!this.leafletMap) return;
    this.leafletService.clearLayers(this.leafletMap, this.leafletStationMarkers);
    // In live tracking mode or when route is being previewed, station markers are hidden to keep route and Grab Red Pin clean
    if (this.isLiveTrackingActive() || this.selectedDestinationId) return;

    if (this.viewLayer !== 'bicycles') {
      this.leafletStationMarkers = this.leafletService.renderCampusLocationMarkers(
        this.leafletMap,
        this.visibleLocations,
        this.selectedDestinationId,
        (loc) => {
          this.activeBicycle = null;
          this.activeLocation = loc;
          this.selectLocation.emit(loc);
        }
      );
    }
  }

  private updateLeafletBicycles(): void {
    if (!this.leafletMap) return;
    this.leafletService.clearLayers(this.leafletMap, this.leafletBikeMarkers);
    // In live tracking mode or route preview mode, hide idle fleet clutter so the route line is unobstructed
    if (this.isLiveTrackingActive() || this.selectedDestinationId) return;

    this.leafletBikeMarkers = this.leafletService.renderBicycleMarkers(
      this.leafletMap,
      this.filteredBicycles,
      (bike) => {
        this.activeLocation = null;
        this.activeTerminalHub = null;
        this.activeBicycle = bike;
      },
      this.langService.currentLanguage
    );
  }

  private updateLeafletZones(): void {
    if (!this.leafletMap) return;
    this.leafletService.clearLayers(this.leafletMap, this.leafletZoneLayers);
    // In live tracking mode, hide zone circles to keep the road tracking completely clear
    if (this.isLiveTrackingActive()) return;

    if (this.viewLayer !== 'bicycles') {
      this.leafletZoneLayers = this.leafletService.renderZones(this.leafletMap, this.designatedZones);
    }
  }

  private updateLeafletPickupPin(): void {
    if (!this.leafletMap) return;
    if (this.leafletPickupMarker) {
      this.leafletPickupMarker.remove();
      this.leafletPickupMarker = null;
    }

    if (this.customPickupPin && !this.isLiveTrackingActive()) {
      this.leafletPickupMarker = this.leafletService.addDraggablePickupPin(
        this.leafletMap,
        this.customPickupPin.lat,
        this.customPickupPin.lng,
        (lat, lng) => this.onCoordinatesSelected(lat, lng),
        this.customPickupPin.addressText || 'Current location'
      );
    }
  }

  private async updateLeafletRoute(): Promise<void> {
    if (!this.leafletMap) return;

    if (this.isLiveTrackingActive()) {
      await this.updateLeafletTrackingScene();
      return;
    }

    // Clean tracking layers if tracking ended
    this.hasFramedTrackingCamera = false;
    this.lastFramedTrackingKey = '';
    this.userInteractedWithTrackingMap = false;
    this.lastRenderedTrackingSignature = '';

    if (this.leafletPedicabMarker) {
      try { this.leafletPedicabMarker.remove(); } catch (e) {}
      this.leafletPedicabMarker = null;
    }
    if (this.leafletPickupStationMarker) {
      try { this.leafletPickupStationMarker.remove(); } catch (e) {}
      this.leafletPickupStationMarker = null;
    }
    if (this.leafletDestinationStationMarker) {
      try { this.leafletDestinationStationMarker.remove(); } catch (e) {}
      this.leafletDestinationStationMarker = null;
    }
    if (this.leafletRoutePolyline) {
      try { this.leafletRoutePolyline.remove(); } catch (e) {}
      this.leafletRoutePolyline = null;
    }

    // Non-tracking preview routes (e.g. before booking is accepted or destination preview)
    if (this.trackingSession && this.trackingSession.waypoints.length >= 2) {
      this.leafletRoutePolyline = this.leafletService.renderRoutePolyline(
        this.leafletMap,
        this.trackingSession.waypoints,
        true
      );
    } else if (this.customPickupPin && this.selectedDestinationId) {
      const dest = this.locations.find(l => l.id === this.selectedDestinationId);
      if (dest) {
        const destCoords = dest.dropoffCoordinates || dest.coordinates;
        const routeData = await this.routingService.getRoadRoute(
          [this.customPickupPin.lat, this.customPickupPin.lng],
          [destCoords.lat, destCoords.lng]
        );
        if (this.leafletRoutePolyline) {
          try { this.leafletRoutePolyline.remove(); } catch (e) {}
        }
        this.leafletRoutePolyline = this.leafletService.renderRoutePolyline(
          this.leafletMap,
          routeData.waypoints,
          true
        );

        // Render Grab Red Destination Pin with right attached label & + button
        if (this.leafletDestinationStationMarker) {
          try { this.leafletDestinationStationMarker.remove(); } catch (e) {}
        }
        this.leafletDestinationStationMarker = this.leafletService.renderGrabDestinationPin(
          this.leafletMap,
          destCoords.lat,
          destCoords.lng,
          dest.name
        );
      }
    }
  }

  /**
   * JoyRide / GrabFood Live Rider Tracking Engine
   * Road-following polyline, custom pedicab marker with heading, and distinct target station pin
   */
  public async updateLeafletTrackingScene(forceReframe: boolean = false): Promise<void> {
    if (!this.leafletMap || !this.activeBooking || !this.isLiveTrackingActive()) return;

    const booking = this.activeBooking;
    const bike = this.bicycles.find(b => b.bikeNumber === booking.assignedBikeNumber) || this.bicycles[0];
    if (!bike) return;

    const isArriving =
      booking.status === 'accepted' ||
      booking.status === 'driver_arriving' ||
      booking.status === 'driver_arrived';
    const targetLat = isArriving ? booking.pickupLat : booking.destinationLat;
    const targetLng = isArriving ? booking.pickupLng : booking.destinationLng;

    // 1. Guard and ensure origin is within realistic campus envelope
    let originLat = bike.currentLocation?.lat ?? 15.444889;
    let originLng = bike.currentLocation?.lng ?? 120.940417;
    if (!PickupLocationService.isInsideCampusBoundary(originLat, originLng)) {
      // If coordinates were corrupted by off-campus device GPS, snap origin to campus terminal
      originLat = 15.444889;
      originLng = 120.940417;
    }

    const renderSignature = `${booking.id || booking.bookingNumber}::${booking.status}::${originLat.toFixed(5)}::${originLng.toFixed(5)}::${targetLat.toFixed(5)}::${targetLng.toFixed(5)}`;
    if (!forceReframe && renderSignature === this.lastRenderedTrackingSignature && this.leafletRoutePolyline && this.leafletPedicabMarker) {
      return;
    }

    const updateSeq = ++this.trackingUpdateSeq;
    const origin: [number, number] = [originLat, originLng];
    const destination: [number, number] = [targetLat, targetLng];

    const routeData = await this.routingService.getRoadRoute(origin, destination);

    // Abort if a newer update started or tracking ended while awaiting road routing
    if (updateSeq !== this.trackingUpdateSeq || !this.leafletMap || !this.isLiveTrackingActive()) {
      return;
    }

    this.lastRenderedTrackingSignature = renderSignature;
    const waypoints = routeData.waypoints && routeData.waypoints.length >= 2 ? routeData.waypoints : [origin, destination];

    // Clear previous tracking layers atomically after async await
    if (this.leafletRoutePolyline) {
      try { this.leafletRoutePolyline.remove(); } catch (e) {}
      this.leafletRoutePolyline = null;
    }
    if (this.leafletPedicabMarker) {
      try { this.leafletPedicabMarker.remove(); } catch (e) {}
      this.leafletPedicabMarker = null;
    }
    if (this.leafletPickupStationMarker) {
      try { this.leafletPickupStationMarker.remove(); } catch (e) {}
      this.leafletPickupStationMarker = null;
    }
    if (this.leafletDestinationStationMarker) {
      try { this.leafletDestinationStationMarker.remove(); } catch (e) {}
      this.leafletDestinationStationMarker = null;
    }

    // 2. Render road polyline with Grab-style glowing casing and solid vibrant green line
    this.leafletRoutePolyline = this.leafletService.renderRoutePolyline(
      this.leafletMap,
      waypoints,
      true
    );

    // 3. Compute bearing heading towards next road waypoint
    let heading = bike.heading || 0;
    if (waypoints.length >= 2) {
      heading = this.routingService.calculateBearing(
        waypoints[0][0],
        waypoints[0][1],
        waypoints[1][0],
        waypoints[1][1]
      );
    }

    // 4. Render Custom Pedicab Live Marker with real-time heading
    this.leafletPedicabMarker = this.leafletService.renderPedicabMarker(
      this.leafletMap,
      originLat,
      originLng,
      heading,
      bike.bikeNumber,
      booking.assignedDriverName || bike.driverName,
      isArriving
    );

    // 5. Render Distinct Target Station Marker (Pickup or Drop-off)
    if (isArriving) {
      this.leafletPickupStationMarker = this.leafletService.renderPickupStationMarker(
        this.leafletMap,
        booking.pickupLat,
        booking.pickupLng,
        booking.pickupName
      );
    } else {
      this.leafletDestinationStationMarker = this.leafletService.renderDestinationStationMarker(
        this.leafletMap,
        booking.destinationLat,
        booking.destinationLng,
        booking.destinationName
      );
    }

    // 6. Camera follow: center directly on the pedicab at start/phase change,
    // then smoothly panTo its live position without changing the user's zoom level.
    const trackingPhaseKey = `${booking.id || booking.bookingNumber}::${isArriving ? 'arriving' : 'transit'}`;
    const isNewTrackingPhase = trackingPhaseKey !== this.lastFramedTrackingKey;
    const isInitialOrRecenter = forceReframe || !this.hasFramedTrackingCamera || isNewTrackingPhase;

    if (isInitialOrRecenter) {
      this.hasFramedTrackingCamera = true;
      this.lastFramedTrackingKey = trackingPhaseKey;
    }

    if (forceReframe || !this.userInteractedWithTrackingMap) {
      this.isProgrammaticMove = true;
      try {
        if (isInitialOrRecenter) {
          const currentZoom = typeof this.leafletMap.getZoom === 'function' ? this.leafletMap.getZoom() : 17;
          const targetZoom = forceReframe ? Math.max(currentZoom || 17, 16.5) : 17;
          this.leafletMap.setView([originLat, originLng], targetZoom, { animate: true });
        } else {
          // Smoothly follow pedicab coordinates while preserving the exact user zoom level
          this.leafletMap.panTo([originLat, originLng], { animate: true, duration: 0.45 });
        }
      } catch (e) {
      } finally {
        setTimeout(() => {
          this.isProgrammaticMove = false;
        }, 450);
      }
    }
  }

  public recenterTracking(): void {
    if (this.isLiveTrackingActive()) {
      this.userInteractedWithTrackingMap = false;
      this.updateLeafletTrackingScene(true);
    } else if (this.customPickupPin) {
      this.leafletMap?.setView([this.customPickupPin.lat, this.customPickupPin.lng], 17.5, { animate: true });
    } else {
      this.leafletMap?.setView([15.447000, 120.939800], this.getDefaultCampusZoom(), { animate: true });
    }
  }

  private updateLeafletHeatmap(): void {
    if (!this.leafletMap) return;
    this.leafletService.clearLayers(this.leafletMap, this.leafletHeatLayers);

    if (this.showHeatmap && this.heatPoints.length > 0) {
      this.leafletHeatLayers = this.leafletService.renderHeatmap(this.leafletMap, this.heatPoints);
    }
  }

  // --- Pickup Pin Coordination (Feature 1) ---

  public onCoordinatesSelected(lat: number, lng: number): void {
    const pin = this.pickupService.buildPickupPin(lat, lng, this.locations);
    this.customPickupPin = pin;
    this.pickupPinChanged.emit(pin);
    this.updateLeafletPickupPin();
  }

  public onVisualMapClick(event: MouseEvent): void {
    if (!this.enableCustomPickupPin) return;

    // Get click position relative to map canvas
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    const coords = this.pickupService.mapPercentToCoords(percentX, percentY);
    this.onCoordinatesSelected(coords.lat, coords.lng);
  }

  // --- Terminal Pilahan & Roaming Trike Categorization ---

  private calcMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return Math.hypot((lat1 - lat2) * 111320, (lng1 - lng2) * 107180);
  }

  public isWaitingAtGate(bike: Bicycle): boolean {
    if (bike.status === 'offline' || bike.status === 'maintenance' || bike.status === 'on_trip' || bike.status === 'full') {
      return false;
    }
    if (bike.passengerCount >= bike.maxCapacity) return false;
    return this.calcMeters(bike.currentLocation.lat, bike.currentLocation.lng, this.GATE_COORDS.lat, this.GATE_COORDS.lng) <= 75;
  }

  public isWaitingAtArki(bike: Bicycle): boolean {
    if (bike.status === 'offline' || bike.status === 'maintenance' || bike.status === 'on_trip' || bike.status === 'full') {
      return false;
    }
    if (bike.passengerCount >= bike.maxCapacity) return false;
    if (this.isWaitingAtGate(bike)) return false;
    return this.calcMeters(bike.currentLocation.lat, bike.currentLocation.lng, this.ARKI_COORDS.lat, this.ARKI_COORDS.lng) <= 75;
  }

  public isRoamingOrOnTrip(bike: Bicycle): boolean {
    if (bike.status === 'offline' || bike.status === 'maintenance') return false;
    if (!PickupLocationService.isInsideCampusBoundary(bike.currentLocation.lat, bike.currentLocation.lng)) return false;
    return !this.isWaitingAtGate(bike) && !this.isWaitingAtArki(bike);
  }

  public get gateQueuedBikes(): Bicycle[] {
    return this.bicycles.filter(b => this.isWaitingAtGate(b));
  }

  public get arkiQueuedBikes(): Bicycle[] {
    return this.bicycles.filter(b => this.isWaitingAtArki(b));
  }

  public get roamingOrTravelingBikes(): Bicycle[] {
    return this.bicycles.filter(b => this.isRoamingOrOnTrip(b));
  }

  public get gateFreeSeats(): number {
    return this.gateQueuedBikes.reduce((sum, b) => sum + Math.max(0, b.maxCapacity - b.passengerCount), 0);
  }

  public get arkiFreeSeats(): number {
    return this.arkiQueuedBikes.reduce((sum, b) => sum + Math.max(0, b.maxCapacity - b.passengerCount), 0);
  }

  public get roamingFreeSeats(): number {
    return this.roamingOrTravelingBikes.reduce((sum, b) => sum + Math.max(0, b.maxCapacity - b.passengerCount), 0);
  }

  public get allActiveCampusBikes(): Bicycle[] {
    return this.bicycles.filter(
      b => b.status !== 'offline' && b.status !== 'maintenance' &&
           PickupLocationService.isInsideCampusBoundary(b.currentLocation.lat, b.currentLocation.lng)
    );
  }

  public get terminalHubSummaries() {
    const isFil = this.langService.currentLanguage === 'fil';
    return [
      {
        id: 'gate',
        title: isFil ? 'Pilahan sa Gate' : 'Main Gate Stand',
        subtitle: isFil ? 'Pangunahing Terminal sa Entrance' : 'NEUST Main Entrance Terminal',
        iconEmoji: '🚏',
        lat: this.GATE_COORDS.lat,
        lng: this.GATE_COORDS.lng,
        queuedBikes: this.gateQueuedBikes,
        totalFreeSeats: this.gateFreeSeats,
        accent: 'gate' as const
      },
      {
        id: 'arki',
        title: isFil ? 'Gilid ng Arki' : 'Architecture Stand',
        subtitle: isFil ? 'Terminal sa Gilid ng Arki' : 'College of Architecture Terminal',
        iconEmoji: '🏛️',
        lat: this.ARKI_COORDS.lat,
        lng: this.ARKI_COORDS.lng,
        queuedBikes: this.arkiQueuedBikes,
        totalFreeSeats: this.arkiFreeSeats,
        accent: 'arki' as const
      }
    ];
  }

  public get selectedTerminalHubDetail() {
    if (!this.activeTerminalHub) return null;
    return this.terminalHubSummaries.find(t => t.id === this.activeTerminalHub) || null;
  }

  public setTrikeFilter(filter: 'all' | 'gate' | 'arki' | 'roaming'): void {
    this.trikeFilter = filter;
    this.updateLeafletBicycles();

    if (filter === 'gate') {
      this.focusTerminalHub('gate');
    } else if (filter === 'arki') {
      this.focusTerminalHub('arki');
    } else if (filter === 'roaming') {
      this.activeTerminalHub = null;
      this.activeBicycle = null;
      this.activeLocation = null;
      this.leafletMap?.setView([15.4470, 120.9400], 16.5, { animate: true });
    } else {
      this.activeTerminalHub = null;
      this.activeBicycle = null;
      this.activeLocation = null;
      this.leafletMap?.setView([15.446650, 120.939850], 16.5, { animate: true });
    }
  }

  public focusTerminalHub(hub: 'gate' | 'arki'): void {
    this.activeBicycle = null;
    this.activeLocation = null;
    this.activeTerminalHub = hub;
    const coords = hub === 'gate' ? this.GATE_COORDS : this.ARKI_COORDS;
    this.leafletMap?.setView([coords.lat, coords.lng], 18, { animate: true });
  }

  public focusRoamingTrikes(): void {
    this.setTrikeFilter('roaming');
  }

  public getBikeLiveLocationBadge(bike: Bicycle): string {
    const isFil = this.langService.currentLanguage === 'fil';
    if (this.isWaitingAtGate(bike)) {
      return isFil ? 'Nakaabang / Nakapila sa Gate' : 'Waiting / Queued at Gate';
    }
    if (this.isWaitingAtArki(bike)) {
      return isFil ? 'Nakapila sa Gilid ng Arki' : 'Queued at Architecture Stand';
    }
    const free = Math.max(0, bike.maxCapacity - bike.passengerCount);
    if (free > 0) {
      return isFil ? `Nagroronda • ${free} Upuan Bakante` : `Roaming • ${free} Open Seats`;
    }
    return isFil ? 'Bumabyahe (Puno)' : 'In Transit (Full)';
  }

  // --- Filtered Data ---

  public get filteredBicycles(): Bicycle[] {
    // In active ride tracking mode, show ONLY the assigned pedicab rider once accepted
    if (this.activeBooking) {
      if (this.activeBooking.assignedBikeNumber) {
        const assigned = this.bicycles.find(b => b.bikeNumber === this.activeBooking!.assignedBikeNumber);
        return assigned ? [assigned] : [];
      }
      return []; // Hide all bicycles while searching / pending acceptance
    }

    if (this.trikeFilter === 'gate') {
      return this.gateQueuedBikes;
    }
    if (this.trikeFilter === 'arki') {
      return this.arkiQueuedBikes;
    }
    if (this.trikeFilter === 'roaming') {
      return this.roamingOrTravelingBikes;
    }

    if (this.viewLayer === 'stations' || this.viewLayer === 'zones') return [];
    if (this.filterType === 'available') {
      return this.bicycles.filter(b => (b.status === 'available' || b.status === 'almost_full') &&
        PickupLocationService.isInsideCampusBoundary(b.currentLocation.lat, b.currentLocation.lng));
    }
    if (this.filterType === 'on_trip') {
      return this.bicycles.filter(b => (b.status === 'on_trip' || b.status === 'full') &&
        PickupLocationService.isInsideCampusBoundary(b.currentLocation.lat, b.currentLocation.lng));
    }
    return this.bicycles.filter(b => b.status !== 'offline' && b.status !== 'maintenance' &&
      PickupLocationService.isInsideCampusBoundary(b.currentLocation.lat, b.currentLocation.lng));
  }

  public get visibleLocations(): CampusLocation[] {
    if (this.viewLayer === 'bicycles') return [];
    return this.locations;
  }

  // --- Zoom & Pan Controls (Visual Map) ---

  public zoomIn(): void {
    this.zoomLevel = Math.min(this.maxZoom, Number((this.zoomLevel + 0.25).toFixed(2)));
  }

  public zoomOut(): void {
    this.zoomLevel = Math.max(this.minZoom, Number((this.zoomLevel - 0.25).toFixed(2)));
  }

  public resetView(): void {
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  public onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.startDragX = event.clientX - this.panX;
    this.startDragY = event.clientY - this.panY;
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.panX = event.clientX - this.startDragX;
    this.panY = event.clientY - this.startDragY;
  }

  public onMouseUp(): void {
    this.isDragging = false;
  }

  public onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.startDragX = event.touches[0].clientX - this.panX;
      this.startDragY = event.touches[0].clientY - this.panY;
    }
  }

  public onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.panX = event.touches[0].clientX - this.startDragX;
    this.panY = event.touches[0].clientY - this.startDragY;
  }

  public onTouchEnd(): void {
    this.isDragging = false;
  }

  // --- Entity Click Handlers ---

  public onBicycleClicked(bike: Bicycle, event: Event): void {
    event.stopPropagation();
    this.activeLocation = null;
    this.activeBicycle = bike;
    this.selectBicycle.emit(bike);
  }

  public onLocationClicked(loc: CampusLocation, event: Event): void {
    event.stopPropagation();
    this.activeBicycle = null;
    this.activeLocation = loc;
    this.selectLocation.emit(loc);
  }

  public closeFloatingCard(): void {
    this.activeBicycle = null;
    this.activeLocation = null;
    this.activeTerminalHub = null;
  }

  public onSelectShuttleFromDrawer(bike: Bicycle): void {
    this.closeFloatingCard();
    this.selectBicycle.emit(bike);
  }

  public onBookFromTerminalHub(hubId: 'gate' | 'arki'): void {
    const bikes = hubId === 'gate' ? this.gateQueuedBikes : this.arkiQueuedBikes;
    if (bikes.length > 0) {
      const chosen = bikes[0];
      this.closeFloatingCard();
      this.selectBicycle.emit(chosen);
      return;
    }
    const locId = hubId === 'gate' ? 'loc-gate' : 'loc-arch';
    const foundLoc = this.locations.find(l => l.id === locId);
    if (foundLoc) {
      this.closeFloatingCard();
      this.queueForDestination.emit(foundLoc);
    }
  }

  public onQueueHere(loc: CampusLocation): void {
    this.closeFloatingCard();
    this.queueForDestination.emit(loc);
  }

  public getStatusBadgeClass(status: BicycleStatus): string {
    switch (status) {
      case 'available': return 'badge-available';
      case 'almost_full': return 'badge-almost-full';
      case 'full': return 'badge-full';
      case 'on_trip': return 'badge-on-trip';
      case 'maintenance': return 'badge-maintenance';
      default: return 'badge-maintenance';
    }
  }

  public getStatusText(status: BicycleStatus): string {
    switch (status) {
      case 'available': return 'Available';
      case 'almost_full': return 'Almost Full (1 Left)';
      case 'full': return 'Full Capacity';
      case 'on_trip': return 'On Trip';
      case 'maintenance': return 'Maintenance';
      default: return 'Offline';
    }
  }
}
