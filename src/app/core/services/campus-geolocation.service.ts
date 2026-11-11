import { Injectable } from '@angular/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { PickupLocationService } from './pickup-location.service';

export interface GpsLocationResult {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  accuracyLevel: 'high' | 'medium' | 'low';
  isInsideCampus: boolean;
  timestamp: number;
  warningMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampusGeolocationService {
  private activeWatchId: string | number | null = null;

  constructor() {}

  /**
   * Requests and checks GPS location permissions using Capacitor with fallback
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      if (typeof Geolocation?.requestPermissions === 'function') {
        const status = await Geolocation.requestPermissions();
        return status.location === 'granted' || status.coarseLocation === 'granted';
      }
    } catch (e) {
      console.warn('Capacitor Geolocation permission check fallback:', e);
    }

    // Web Fallback
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      try {
        const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return res.state === 'granted' || res.state === 'prompt';
      } catch (err) {}
    }

    return true; // Attempt anyway
  }

  /**
   * Captures actual smartphone GPS coordinates using high accuracy
   */
  public async getCurrentGpsLocation(): Promise<GpsLocationResult> {
    const hasPerm = await this.requestPermissions();
    if (!hasPerm) {
      throw new Error('Kailangang payagan ang Location Permission ng iyong device upang ma-detect ang GPS.');
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    let rawPos: Position | GeolocationPosition | null = null;

    try {
      rawPos = await Geolocation.getCurrentPosition(options);
    } catch (err: any) {
      console.warn('Capacitor getCurrentPosition failed, falling back to navigator.geolocation:', err);
      rawPos = await this.getWebFallbackPosition(options);
    }

    if (!rawPos || !rawPos.coords) {
      throw new Error('Hindi ma-detect ang iyong GPS position. Pakitiyak na naka-ON ang Location/GPS ng iyong smartphone.');
    }

    const lat = Number(rawPos.coords.latitude.toFixed(7));
    const lng = Number(rawPos.coords.longitude.toFixed(7));
    const accuracy = Math.round(rawPos.coords.accuracy || 10);
    const timestamp = rawPos.timestamp || Date.now();

    // Accuracy Quality Evaluation
    let accuracyLevel: 'high' | 'medium' | 'low' = 'high';
    let warningMessage: string | undefined;

    if (accuracy > 35) {
      accuracyLevel = 'low';
      warningMessage = `Medyo mababa ang GPS accuracy (${accuracy}m). Subukang lumabas sa open sky o mag-refresh, o i-adjust nang manu-mano ang pin sa mapa.`;
    } else if (accuracy > 15) {
      accuracyLevel = 'medium';
      warningMessage = `GPS accuracy ay ±${accuracy}m. Maaari mong i-adjust ang pin para sa mas eksaktong posisyon.`;
    }

    // Campus boundary validation using exact NEUST polygon ray-casting
    const isInsideCampus = PickupLocationService.isInsideCampusBoundary(lat, lng);
    if (!isInsideCampus && !warningMessage) {
      warningMessage = 'Pansin: Ang iyong detected GPS location ay nasa labas ng campus boundary ng NEUST Sumacab. Pakitiyak na nasa loob ka ng campus.';
    }

    return {
      lat,
      lng,
      accuracy,
      accuracyLevel,
      isInsideCampus,
      timestamp,
      warningMessage
    };
  }

  /**
   * Browser / HTML5 Geolocation fallback
   */
  private getWebFallbackPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        return reject(new Error('Walang GPS/Geolocation support ang browser/device na ito.'));
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos),
        err => reject(new Error(`GPS Error (${err.code}): ${err.message}`)),
        options
      );
    });
  }

  /**
   * Starts high-precision live tracking for active rider on trips
   */
  public async startRiderTracking(
    onLocationUpdate: (pos: { lat: number; lng: number; heading?: number; speed?: number; accuracy?: number }) => void,
    onError?: (err: any) => void
  ): Promise<void> {
    this.stopRiderTracking();

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    try {
      const watchId = await Geolocation.watchPosition(options, (position, err) => {
        if (err) {
          if (onError) onError(err);
          return;
        }
        if (position && position.coords) {
          onLocationUpdate({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading || 0,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0,
            accuracy: position.coords.accuracy
          });
        }
      });
      this.activeWatchId = watchId;
    } catch (e) {
      console.warn('Capacitor watchPosition failed, using HTML5 watchPosition:', e);
      if ('geolocation' in navigator) {
        this.activeWatchId = navigator.geolocation.watchPosition(
          pos => {
            onLocationUpdate({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              heading: pos.coords.heading || 0,
              speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
              accuracy: pos.coords.accuracy
            });
          },
          err => { if (onError) onError(err); },
          options
        );
      }
    }
  }

  /**
   * Stops live tracking cleanly to conserve battery when trip completes
   */
  public async stopRiderTracking(): Promise<void> {
    if (this.activeWatchId !== null) {
      try {
        if (typeof this.activeWatchId === 'string') {
          await Geolocation.clearWatch({ id: this.activeWatchId });
        } else if (typeof this.activeWatchId === 'number') {
          navigator.geolocation.clearWatch(this.activeWatchId);
        }
      } catch (err) {
        console.warn('Error clearing GPS watch:', err);
      }
      this.activeWatchId = null;
    }
  }
}

