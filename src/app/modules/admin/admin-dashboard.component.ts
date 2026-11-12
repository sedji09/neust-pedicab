import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonToggle,
  IonToast
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  navigateOutline,
  timeOutline,
  peopleOutline,
  ticketOutline,
  buildOutline,
  megaphoneOutline,
  mapOutline,
  searchOutline,
  addOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  speedometerOutline,
  shieldCheckmarkOutline,
  schoolOutline,
  constructOutline,
  barChartOutline,
  swapHorizontalOutline,
  layersOutline,
  closeOutline,
  flameOutline,
  radioOutline,
  pinOutline,
  trashOutline,
  cashOutline,
  pricetagOutline,
  locateOutline,
  locationOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { StateService } from '../../core/services/state.service';
import { PassengerDemandService } from '../../core/services/passenger-demand.service';
import { PickupLocationService } from '../../core/services/pickup-location.service';
import {
  Bicycle,
  CampusLocation,
  Trip,
  MaintenanceReport,
  ServiceAnnouncement,
  User,
  DesignatedZone,
  DemandHeatPoint,
  LocationCategory,
  CampusLocationStatus,
  CustomPickupPin
} from '../../core/models/models';
import { CampusMapComponent } from '../../shared/components/campus-map/campus-map.component';
import { INITIAL_DEMO_USERS } from '../../core/data/campus-data';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonModal,
    IonToggle,
    IonToast,
    CampusMapComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  public currentTab: 'overview' | 'bicycles' | 'trips' | 'demand' | 'zones' | 'maintenance' | 'locations' | 'announcements' | 'users' = 'overview';

  public tripSearchQuery = '';
  public studentSearchQuery = '';
  public bicycleSearchQuery = '';

  // Feature 5: Demand Heatmap State
  public showHeatmap = true;

  // Feature 3: Designated Zones & Geofencing State
  public isNewZoneModalOpen = false;
  public newZoneName = '';
  public newZoneType: DesignatedZone['type'] = 'pickup';
  public newZoneRadiusMeters = 40;
  public newZoneLat = 15.4462;
  public newZoneLng = 120.9392;
  public newZoneDescription = '';

  // Other Modals
  public isNewBikeModalOpen = false;
  public isNewAnnouncementModalOpen = false;
  public isReviewMaintenanceModalOpen = false;
  public selectedReport: MaintenanceReport | null = null;
  public adminResolutionNotes = '';

  public newBikeNumber = '';
  public newDriverName = '';
  public newMaxCapacity = 4;

  public newAncTitle = '';
  public newAncContent = '';
  public newAncType: ServiceAnnouncement['type'] = 'operational';

  // Feature: Campus Fare & Tariff Management (Editable per-passenger rate)
  public currentFarePerHead = 10;
  public editFareInput = 10;

  // Feature 3: Campus Location Approval & Management
  public locationViewTab: 'pending' | 'directory' = 'pending';
  public locationSearchQuery = '';
  public locationCategoryFilter = 'all';

  public selectedLocForReview: CampusLocation | null = null;
  public isReviewLocModalOpen = false;
  public reviewAdjustedLat: number | null = null;
  public reviewAdjustedLng: number | null = null;
  public reviewAdjustedPickupLat: number | null = null;
  public reviewAdjustedPickupLng: number | null = null;
  public reviewRejectionReason = '';

  // Direct Registration & GPS Mapping Modal
  public isDirectRegisterModalOpen = false;
  public adminNewLocName = '';
  public adminNewLocCode = '';
  public adminNewLocBldg = '';
  public adminNewLocCategory: LocationCategory = 'academic';
  public adminNewLocLat: number = 15.447800;
  public adminNewLocLng: number = 120.939200;
  public adminNewLocDesc = '';
  public adminNewLocPickupAllowed = true;
  public adminNewLocDropoffAllowed = true;
  public adminNewLocSeparateStopping = false;
  public adminNewLocStoppingLat: number | null = null;
  public adminNewLocStoppingLng: number | null = null;
  public adminDirectDuplicateWarning: string | null = null;
  public isGpsDetecting = false;
  public adminGpsAccuracy: number | null = 4;

  public get isAdminLocInsideCampus(): boolean {
    return PickupLocationService.isInsideCampusBoundary(this.adminNewLocLat, this.adminNewLocLng);
  }

  public get adminMappingPinPreview(): CustomPickupPin | null {
    if (this.adminNewLocLat === null || this.adminNewLocLng === null) return null;
    return {
      lat: this.adminNewLocLat,
      lng: this.adminNewLocLng,
      addressText: this.adminNewLocName || 'Nai-map na Gusali / Lokasyon',
      nearestBuildingName: this.adminNewLocName || 'Campus Grounds',
      nearestBuildingNumber: this.adminNewLocBldg || '',
      distanceToNearestMeters: 0,
      isInsideCampusBoundary: this.isAdminLocInsideCampus
    };
  }

  public showToast = false;
  public toastMessage = '';

  public get usersList(): User[] {
    return this.authService.getAllUsers();
  }

  constructor(
    public authService: AuthService,
    public stateService: StateService,
    public demandService: PassengerDemandService
  ) {
    addIcons({
      bicycleOutline,
      navigateOutline,
      timeOutline,
      peopleOutline,
      ticketOutline,
      buildOutline,
      megaphoneOutline,
      mapOutline,
      searchOutline,
      addOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      speedometerOutline,
      shieldCheckmarkOutline,
      schoolOutline,
      constructOutline,
      barChartOutline,
      swapHorizontalOutline,
      layersOutline,
      closeOutline,
      flameOutline,
      radioOutline,
      pinOutline,
      trashOutline,
      cashOutline,
      pricetagOutline,
      locateOutline,
      locationOutline
    });
  }

  ngOnInit(): void {
    this.stateService.farePerHead$.subscribe(fare => {
      this.currentFarePerHead = fare;
      this.editFareInput = fare;
    });
  }

  public updateFareSettings(customAmount?: number): void {
    const amount = customAmount !== undefined ? customAmount : Number(this.editFareInput);
    if (!amount || amount < 1) {
      this.displayToast('⚠️ Maglagay ng valid na halaga ng pamasahe (minimum ₱1).');
      return;
    }
    this.stateService.setFarePerHead(amount);
    this.editFareInput = amount;
    this.displayToast(`✅ Na-update ang pamasahe sa ₱${amount}.00 kada pasahero!`);
  }

  // --- Feature 5: Passenger Demand Heatmap Data & Metrics ---

  public get demandHeatPoints(): DemandHeatPoint[] {
    const queues = this.stateService.getStateSnapshot().queues;
    const locations = this.stateService.getStateSnapshot().locations;
    return this.demandService.generateDemandHeatPoints(queues, locations);
  }

  public get demandMetrics() {
    return this.demandService.getDemandMetrics(this.demandHeatPoints);
  }

  public toggleHeatmap(): void {
    this.showHeatmap = !this.showHeatmap;
    this.displayToast(`Demand Heatmap Layer: ${this.showHeatmap ? 'ENABLED' : 'DISABLED'}`);
  }

  // --- Feature 3: Geofencing & Designated Zones Operations ---

  public submitNewZone(): void {
    if (!this.newZoneName.trim()) {
      this.displayToast('Please enter a zone name.');
      return;
    }

    this.stateService.addDesignatedZone({
      name: this.newZoneName,
      type: this.newZoneType,
      radiusMeters: Number(this.newZoneRadiusMeters) || 40,
      center: {
        lat: Number(this.newZoneLat) || 15.4593,
        lng: Number(this.newZoneLng) || 120.9576
      },
      description: this.newZoneDescription || 'Campus designated zone'
    });

    this.isNewZoneModalOpen = false;
    this.newZoneName = '';
    this.newZoneDescription = '';
    this.displayToast('New designated zone configured on Leaflet map.');
  }

  public toggleZone(id: string): void {
    this.stateService.toggleDesignatedZone(id);
    this.displayToast('Zone visibility toggled.');
  }

  public deleteZone(id: string): void {
    this.stateService.deleteDesignatedZone(id);
    this.displayToast('Designated zone removed.');
  }

  // --- General Dashboard Metrics ---

  public get totalBicycles(): number {
    return this.stateService.getStateSnapshot().bicycles.length;
  }

  public get availableBicycles(): number {
    return this.stateService.getStateSnapshot().bicycles.filter(b => b.status === 'available' || b.status === 'almost_full').length;
  }

  public get activeBicycles(): number {
    return this.stateService.getStateSnapshot().bicycles.filter(b => b.status === 'on_trip').length;
  }

  public get maintenanceBicycles(): number {
    return this.stateService.getStateSnapshot().bicycles.filter(b => b.status === 'maintenance').length;
  }

  public get ongoingTrips(): number {
    return this.stateService.getStateSnapshot().trips.filter(t => t.status === 'active').length;
  }

  public get completedTrips(): number {
    return this.stateService.getStateSnapshot().trips.filter(t => t.status === 'completed').length;
  }

  public get waitingPassengersCount(): number {
    return this.stateService.getStateSnapshot().queues.filter(q => q.status === 'waiting').length;
  }

  public get filteredTrips(): Trip[] {
    const list = this.stateService.getStateSnapshot().trips;
    if (!this.tripSearchQuery.trim()) return list;
    const q = this.tripSearchQuery.toLowerCase();
    return list.filter(t => 
      t.tripNumber.toLowerCase().includes(q) ||
      t.bicycleNumber.toLowerCase().includes(q) ||
      t.driverName.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
    );
  }

  public get filteredStudents(): User[] {
    const students = this.usersList.filter(u => u.role === 'student');
    if (!this.studentSearchQuery.trim()) return students;
    const q = this.studentSearchQuery.toLowerCase();
    return students.filter(s => 
      s.fullName.toLowerCase().includes(q) ||
      s.idNumber.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }

  public get driverUsers(): User[] {
    return this.usersList.filter(u => u.role === 'driver');
  }

  public submitNewBicycle(): void {
    if (!this.newBikeNumber.trim()) {
      this.displayToast('Please enter a bicycle number (e.g. BIKE-006).');
      return;
    }
    this.stateService.registerBicycle({
      bikeNumber: this.newBikeNumber.toUpperCase(),
      driverName: this.newDriverName || 'Reserve Driver',
      maxCapacity: this.newMaxCapacity || 4
    });
    this.isNewBikeModalOpen = false;
    this.newBikeNumber = '';
    this.newDriverName = '';
    this.displayToast('New bicycle registered to fleet.');
  }

  public openMaintenanceReview(report: MaintenanceReport): void {
    this.selectedReport = report;
    this.adminResolutionNotes = report.adminNotes || '';
    this.isReviewMaintenanceModalOpen = true;
  }

  public resolveReport(): void {
    if (!this.selectedReport) return;
    this.stateService.updateMaintenanceStatus(this.selectedReport.id, 'resolved', this.adminResolutionNotes);
    this.isReviewMaintenanceModalOpen = false;
    this.displayToast(`Report ${this.selectedReport.reportNumber} resolved! Pedicab ${this.selectedReport.bicycleNumber} restored.`);
  }

  public setReportUnderMaintenance(): void {
    if (!this.selectedReport) return;
    this.stateService.updateMaintenanceStatus(this.selectedReport.id, 'under_maintenance', this.adminResolutionNotes);
    this.isReviewMaintenanceModalOpen = false;
    this.displayToast(`Report ${this.selectedReport.reportNumber} marked as under active maintenance.`);
  }

  public toggleStationPickup(loc: CampusLocation): void {
    loc.isPickupActive = !loc.isPickupActive;
    this.displayToast(`Pickup point for ${loc.name}: ${loc.isPickupActive ? 'ACTIVE' : 'DISABLED'}`);
  }

  public submitAnnouncement(): void {
    if (!this.newAncTitle.trim()) {
      this.displayToast('Please enter announcement title.');
      return;
    }
    this.stateService.createAnnouncement({
      title: this.newAncTitle,
      content: this.newAncContent,
      type: this.newAncType,
      author: 'Fleet Operations Admin'
    });
    this.isNewAnnouncementModalOpen = false;
    this.newAncTitle = '';
    this.newAncContent = '';
    this.displayToast('Campus transit announcement broadcasted.');
  }

  public toggleAccountStatus(user: User): void {
    const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    this.authService.updateUserById(user.id, { accountStatus: nextStatus });
    this.displayToast(`User ${user.fullName} is now ${nextStatus.toUpperCase()}.`);
  }

  // --- Feature 3: Campus Location Approval & Directory Management ---

  public get pendingLocations(): CampusLocation[] {
    const list = this.stateService.getStateSnapshot().locations || [];
    return list.filter(l => l.status === 'pending');
  }

  public get approvedLocations(): CampusLocation[] {
    const list = this.stateService.getStateSnapshot().locations || [];
    return list.filter(l => l.status === 'approved' || !l.status);
  }

  public get filteredAdminLocations(): CampusLocation[] {
    let list = this.approvedLocations;
    if (this.locationCategoryFilter !== 'all') {
      list = list.filter(l => l.category === this.locationCategoryFilter);
    }
    if (this.locationSearchQuery.trim()) {
      const q = this.locationSearchQuery.toLowerCase().trim();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.buildingNumber.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public get reviewPinPreview(): CustomPickupPin | null {
    if (!this.selectedLocForReview || this.reviewAdjustedLat === null || this.reviewAdjustedLng === null) return null;
    return {
      lat: this.reviewAdjustedLat,
      lng: this.reviewAdjustedLng,
      addressText: this.selectedLocForReview.name,
      nearestBuildingName: this.selectedLocForReview.name,
      nearestBuildingNumber: this.selectedLocForReview.buildingNumber || '',
      distanceToNearestMeters: 0,
      isInsideCampusBoundary: PickupLocationService.isInsideCampusBoundary(this.reviewAdjustedLat, this.reviewAdjustedLng)
    };
  }

  public openReviewModal(loc: CampusLocation): void {
    this.selectedLocForReview = loc;
    this.reviewAdjustedLat = loc.coordinates.lat;
    this.reviewAdjustedLng = loc.coordinates.lng;
    this.reviewAdjustedPickupLat = loc.pickupCoordinates?.lat ?? loc.coordinates.lat;
    this.reviewAdjustedPickupLng = loc.pickupCoordinates?.lng ?? loc.coordinates.lng;
    this.reviewRejectionReason = '';
    this.isReviewLocModalOpen = true;
  }

  public onReviewPinChanged(pin: CustomPickupPin): void {
    this.reviewAdjustedLat = Number(pin.lat.toFixed(7));
    this.reviewAdjustedLng = Number(pin.lng.toFixed(7));
  }

  public approveSelectedLocation(): void {
    if (!this.selectedLocForReview) return;
    const admin = this.authService.currentUser?.fullName || 'Campus Administrator';
    this.stateService.approveCampusLocation(
      this.selectedLocForReview.id,
      admin,
      {
        lat: this.reviewAdjustedLat || this.selectedLocForReview.coordinates.lat,
        lng: this.reviewAdjustedLng || this.selectedLocForReview.coordinates.lng,
        pickupLat: this.reviewAdjustedPickupLat || undefined,
        pickupLng: this.reviewAdjustedPickupLng || undefined
      }
    );
    this.isReviewLocModalOpen = false;
    this.displayToast(`Naaprubahan ang ${this.selectedLocForReview.name}! Live na ito sa student booking.`);
    this.selectedLocForReview = null;
  }

  public rejectSelectedLocation(): void {
    if (!this.selectedLocForReview) return;
    const admin = this.authService.currentUser?.fullName || 'Campus Administrator';
    this.stateService.rejectCampusLocation(
      this.selectedLocForReview.id,
      admin,
      this.reviewRejectionReason || 'Hindi pasok sa criteria ng unibersidad'
    );
    this.isReviewLocModalOpen = false;
    this.displayToast(`Tinanggihan ang proposal para sa ${this.selectedLocForReview.name}.`);
    this.selectedLocForReview = null;
  }

  public deactivateLocation(loc: CampusLocation): void {
    this.stateService.deactivateCampusLocation(loc.id);
    this.displayToast(`Na-deactivate na ang ${loc.name}.`);
  }

  public openDirectRegisterModal(): void {
    this.adminNewLocName = '';
    this.adminNewLocCode = '';
    this.adminNewLocBldg = '';
    this.adminNewLocCategory = 'academic';
    this.adminNewLocLat = 15.447800;
    this.adminNewLocLng = 120.939200;
    this.adminNewLocDesc = '';
    this.adminNewLocPickupAllowed = true;
    this.adminNewLocDropoffAllowed = true;
    this.adminNewLocSeparateStopping = false;
    this.adminNewLocStoppingLat = null;
    this.adminNewLocStoppingLng = null;
    this.adminDirectDuplicateWarning = null;
    this.adminGpsAccuracy = 4;
    this.isDirectRegisterModalOpen = true;
  }

  public triggerAdminGpsDetection(): void {
    this.isGpsDetecting = true;
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.isGpsDetecting = false;
          const lat = Number(pos.coords.latitude.toFixed(7));
          const lng = Number(pos.coords.longitude.toFixed(7));
          const acc = Math.round(pos.coords.accuracy);

          // Check if within campus boundary
          if (PickupLocationService.isInsideCampusBoundary(lat, lng)) {
            this.adminNewLocLat = lat;
            this.adminNewLocLng = lng;
            this.adminGpsAccuracy = acc;
            this.displayToast(`✅ Matagumpay na nakuha ang GPS: ±${acc}m accuracy.`);
          } else {
            // Keep at campus center
            this.adminNewLocLat = 15.447800;
            this.adminNewLocLng = 120.939200;
            this.adminGpsAccuracy = 4;
            this.displayToast('Naka-center sa NEUST Sumacab Campus. I-drag ang pin sa eksaktong gusali.');
          }
          this.checkDirectDuplicate();
        },
        (err) => {
          this.isGpsDetecting = false;
          this.displayToast('Hindi mabasa ang device GPS. Naka-set sa campus center.');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      this.isGpsDetecting = false;
      this.displayToast('Hindi suportado ang GPS detection. I-drag ang pin sa mapa.');
    }
  }

  public onDirectRegisterPinChanged(pin: CustomPickupPin): void {
    this.adminNewLocLat = Number(pin.lat.toFixed(7));
    this.adminNewLocLng = Number(pin.lng.toFixed(7));
    this.checkDirectDuplicate();
  }

  public checkDirectDuplicate(): void {
    if (!this.adminNewLocName.trim() && !this.adminNewLocLat) {
      this.adminDirectDuplicateWarning = null;
      return;
    }
    const dup = this.stateService.checkForDuplicateLocation(
      this.adminNewLocName,
      this.adminNewLocLat,
      this.adminNewLocLng
    );
    this.adminDirectDuplicateWarning = dup.isDuplicate ? (dup.reason || 'May umiiral nang lokasyon na may parehong pangalan o GPS coordinates.') : null;
  }

  public async submitDirectRegisterLocation(): Promise<void> {
    if (!this.adminNewLocName.trim()) {
      this.displayToast('Paki-lagay ang pangalan ng gusali o pasilidad.');
      return;
    }

    if (!this.isAdminLocInsideCampus) {
      this.displayToast('Paalala: Ang GPS pin ay dapat nasa loob ng NEUST Sumacab campus boundary.');
      return;
    }

    const admin = this.authService.currentUser?.fullName || 'System Administrator';
    const stoppingLat = this.adminNewLocSeparateStopping ? (this.adminNewLocStoppingLat || this.adminNewLocLat) : undefined;
    const stoppingLng = this.adminNewLocSeparateStopping ? (this.adminNewLocStoppingLng || this.adminNewLocLng) : undefined;

    try {
      const res = await this.stateService.proposeCampusLocation({
        name: this.adminNewLocName.trim(),
        code: this.adminNewLocCode.trim(),
        buildingNumber: this.adminNewLocBldg.trim(),
        category: this.adminNewLocCategory,
        description: this.adminNewLocDesc.trim(),
        latitude: this.adminNewLocLat,
        longitude: this.adminNewLocLng,
        pickupLatitude: stoppingLat,
        pickupLongitude: stoppingLng,
        isPickupAllowed: this.adminNewLocPickupAllowed,
        isDropoffAllowed: this.adminNewLocDropoffAllowed,
        gpsAccuracy: this.adminGpsAccuracy || 4,
        submittedBy: admin,
        submittedByRole: 'admin'
      });

      this.isDirectRegisterModalOpen = false;
      this.locationViewTab = 'directory';
      this.displayToast(`✅ Matagumpay na nairehistro at na-publish ang "${this.adminNewLocName}" sa Campus Directory!`);
    } catch (err: any) {
      this.displayToast(err?.message || 'Nagkaroon ng error sa pag-save ng lokasyon.');
    }
  }

  public displayToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
  }
}
