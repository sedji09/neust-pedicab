import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  isSimulated?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  // NEUST Sumacab Center coordinates (Cabanatuan City)
  public static readonly NEUST_CENTER = { lat: 15.446853, lng: 120.939454 };

  private currentPositionSubject = new BehaviorSubject<GeoPosition>({
    lat: GeolocationService.NEUST_CENTER.lat,
    lng: GeolocationService.NEUST_CENTER.lng,
    accuracy: 10,
    heading: 0,
    speed: 0,
    timestamp: Date.now(),
    isSimulated: true
  });

  public currentPosition$: Observable<GeoPosition> = this.currentPositionSubject.asObservable();
  public hasPermission = false;
  private watchId: number | null = null;

  constructor(private ngZone: NgZone) {
    this.detectOrInitPosition();
  }

  /**
   * Initializes or fetches initial device position, falling back gracefully
   */
  public async detectOrInitPosition(): Promise<GeoPosition> {
    if (typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 10000
          });
        });

        this.hasPermission = true;
        const geoPos: GeoPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading || 0,
          speed: pos.coords.speed || 0,
          timestamp: pos.timestamp,
          isSimulated: false
        };

        this.ngZone.run(() => {
          this.currentPositionSubject.next(geoPos);
        });
        return geoPos;
      } catch (err) {
        // Permissions denied or timed out (e.g. desktop sandbox or simulator)
        // Fall back gracefully to NEUST Sumacab campus center
        return this.getSimulatedPosition();
      }
    }

    return this.getSimulatedPosition();
  }

  public getSimulatedPosition(offsetLat = 0, offsetLng = 0): GeoPosition {
    const geoPos: GeoPosition = {
      lat: GeolocationService.NEUST_CENTER.lat + offsetLat,
      lng: GeolocationService.NEUST_CENTER.lng + offsetLng,
      accuracy: 15,
      heading: 45,
      speed: 0,
      timestamp: Date.now(),
      isSimulated: true
    };
    this.currentPositionSubject.next(geoPos);
    return geoPos;
  }

  public setCustomPosition(lat: number, lng: number, heading = 0): void {
    const geoPos: GeoPosition = {
      lat,
      lng,
      accuracy: 5,
      heading,
      speed: 0,
      timestamp: Date.now(),
      isSimulated: false
    };
    this.currentPositionSubject.next(geoPos);
  }

  /**
   * Watches GPS position continuously
   */
  public startTracking(callback?: (pos: GeoPosition) => void): number {
    if (this.watchId !== null) return this.watchId;

    if (typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.ngZone.run(() => {
            const geoPos: GeoPosition = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading || 0,
              speed: pos.coords.speed || 0,
              timestamp: pos.timestamp,
              isSimulated: false
            };
            this.currentPositionSubject.next(geoPos);
            if (callback) callback(geoPos);
          });
        },
        () => {
          // Fallback simulation
          const current = this.currentPositionSubject.value;
          if (callback) callback(current);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
      return this.watchId;
    }

    return 1;
  }

  public stopTracking(): void {
    if (this.watchId !== null && typeof window !== 'undefined' && 'navigator' in window) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

