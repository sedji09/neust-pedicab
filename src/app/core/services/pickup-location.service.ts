import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CampusLocation, CustomPickupPin } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PickupLocationService {
  // Official NEUST Sumacab Campus Boundary Polygon (WGS84 Lat/Lng)
  // Strictly confined to the actual NEUST campus grounds.
  // Terminal anchor point at South: 15°26'41.6"N 120°56'25.5"E (15.444889, 120.940417) - Pilahan ng NEUST Trike Bike
  public static CAMPUS_BOUNDARY_POLYGON: Array<[number, number]> = [
    [15.4512, 120.9382], // North: Grandstand / Athletic Field Top (Avocado St)
    [15.4510, 120.9388], // North: Grandstand North road
    [15.4506, 120.9398], // North-East: Edge near Malunggay Ave
    [15.4498, 120.9410], // North-East: Near NEUST Open Gym
    [15.4488, 120.9418], // East: Along Swimming Pool and College of Engineering complex
    [15.4480, 120.9418], // East: Swimming pool perimeter
    [15.4474, 120.9414], // East: Along Narra Ave campus edge
    [15.4465, 120.9410], // East: East of NEUST Administration
    [15.4455, 120.9408], // South-East: Banaba St inner roadway
    [15.444889, 120.940417], // SOUTH ANCHOR: 15°26'41.6"N 120°56'25.5"E (Pilahan ng NEUST Trike/Bike Shuttle)
    [15.4445, 120.9392], // South: South of Rico Fajardo Hall / Hostel
    [15.4447, 120.9378], // South-West: Inner campus corner above creek
    [15.4455, 120.9370], // West: Along Sapang Buhay Creek inside campus
    [15.4468, 120.9366], // West: Along Kasoy St inside campus
    [15.4480, 120.9365], // West: West of Telecom Tower & NEUST Mart
    [15.4492, 120.9366], // North-West: West of Athletic Field
    [15.4506, 120.9372], // North-West: Curve around Grandstand
    [15.4512, 120.9382]  // Closing back to North Grandstand top
  ];

  // Map canvas coordinate calibration (confined strictly to NEUST Sumacab campus)
  private readonly LAT_MIN = 15.4445;
  private readonly LAT_MAX = 15.4512;
  private readonly LNG_MIN = 120.9364;
  private readonly LNG_MAX = 120.9416;

  private selectedPickupPinSubject = new BehaviorSubject<CustomPickupPin | null>(null);
  public selectedPickupPin$: Observable<CustomPickupPin | null> = this.selectedPickupPinSubject.asObservable();

  constructor() { }

  /**
   * Ray-Casting Algorithm to test if a GPS point (lat, lng) is inside the NEUST campus polygon
   */
  public static isInsideCampusBoundary(lat: number, lng: number): boolean {
    const poly = PickupLocationService.CAMPUS_BOUNDARY_POLYGON;
    let isInside = false;

    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0];
      const yi = poly[i][1];
      const xj = poly[j][0];
      const yj = poly[j][1];

      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);

      if (intersect) isInside = !isInside;
    }

    return isInside;
  }

  public isInsideCampusBoundary(lat: number, lng: number): boolean {
    return PickupLocationService.isInsideCampusBoundary(lat, lng);
  }

  /**
   * Finds nearest recognized campus building or station using Haversine formula
   */
  public findNearestCampusLocation(
    lat: number,
    lng: number,
    locations: CampusLocation[]
  ): { location: CampusLocation; distanceMeters: number } | null {
    if (!locations || locations.length === 0) return null;

    let nearestLoc = locations[0];
    let minDistance = Infinity;

    for (const loc of locations) {
      const d = this.calculateDistanceMeters(lat, lng, loc.coordinates.lat, loc.coordinates.lng);
      if (d < minDistance) {
        minDistance = d;
        nearestLoc = loc;
      }
    }

    return {
      location: nearestLoc,
      distanceMeters: Math.round(minDistance)
    };
  }

  /**
   * Generates a validated CustomPickupPin object from GPS coordinates
   */
  public buildPickupPin(
    lat: number,
    lng: number,
    locations: CampusLocation[],
    notes?: string
  ): CustomPickupPin {
    const isInside = this.isInsideCampusBoundary(lat, lng);
    const nearest = this.findNearestCampusLocation(lat, lng, locations);
    const percentCoords = this.coordsToMapPercent(lat, lng);

    let addressText = 'NEUST Sumacab Campus';
    let nearestBuildingName = 'NEUST Campus Grounds';
    let nearestBuildingNumber = 'Sumacab';
    let distanceToNearestMeters = 0;

    if (nearest) {
      nearestBuildingName = nearest.location.name;
      nearestBuildingNumber = nearest.location.buildingNumber;
      distanceToNearestMeters = nearest.distanceMeters;

      if (nearest.distanceMeters <= 20) {
        addressText = `At ${nearest.location.name} (${nearest.location.buildingNumber})`;
      } else {
        addressText = `Near ${nearest.location.name} (~${nearest.distanceMeters}m away)`;
      }
    }

    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      x: percentCoords.x,
      y: percentCoords.y,
      addressText,
      nearestBuildingName,
      nearestBuildingNumber,
      distanceToNearestMeters,
      isInsideCampusBoundary: isInside,
      notes: notes || ''
    };
  }

  public setSelectedPickupPin(pin: CustomPickupPin | null): void {
    this.selectedPickupPinSubject.next(pin);
  }

  public getSelectedPickupPin(): CustomPickupPin | null {
    return this.selectedPickupPinSubject.value;
  }

  /**
   * Converts GPS Lat/Lng to visual canvas percentage coordinates (x: 0-100%, y: 0-100%)
   */
  public coordsToMapPercent(lat: number, lng: number): { x: number; y: number } {
    const x = ((lng - this.LNG_MIN) / (this.LNG_MAX - this.LNG_MIN)) * 100;
    // Latitude decreases as Y increases on screen
    const y = ((this.LAT_MAX - lat) / (this.LAT_MAX - this.LAT_MIN)) * 100;

    return {
      x: Math.max(5, Math.min(95, Number(x.toFixed(2)))),
      y: Math.max(5, Math.min(95, Number(y.toFixed(2))))
    };
  }

  /**
   * Converts visual canvas percentage coordinates (x: 0-100%, y: 0-100%) to GPS Lat/Lng
   */
  public mapPercentToCoords(x: number, y: number): { lat: number; lng: number } {
    const lng = this.LNG_MIN + (x / 100) * (this.LNG_MAX - this.LNG_MIN);
    const lat = this.LAT_MAX - (y / 100) * (this.LAT_MAX - this.LAT_MIN);

    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    };
  }

  /**
   * Standard Haversine distance in meters
   */
  public calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

