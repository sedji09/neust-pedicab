import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Bicycle, CustomPickupPin, RouteTrackingSession } from '../models/models';
import { BicycleFinderService } from './bicycle-finder.service';

@Injectable({
  providedIn: 'root'
})
export class BicycleTrackingService {
  private activeSessionSubject = new BehaviorSubject<RouteTrackingSession | null>(null);
  public activeSession$: Observable<RouteTrackingSession | null> = this.activeSessionSubject.asObservable();

  constructor(private bicycleFinder: BicycleFinderService) {}

  /**
   * Starts a live route tracking session when a student is assigned to a bicycle or books a ride
   */
  public startTrackingSession(
    tripId: string,
    bicycle: Bicycle,
    pickupPin: CustomPickupPin,
    destination: { name: string; lat: number; lng: number }
  ): RouteTrackingSession {
    const waypoints: Array<[number, number]> = [
      [bicycle.currentLocation.lat, bicycle.currentLocation.lng],
      [pickupPin.lat, pickupPin.lng],
      [destination.lat, destination.lng]
    ];

    const distToPickup = this.bicycleFinder.calculateHaversineDistance(
      bicycle.currentLocation.lat,
      bicycle.currentLocation.lng,
      pickupPin.lat,
      pickupPin.lng
    );

    const session: RouteTrackingSession = {
      tripId,
      bikeId: bicycle.id,
      bikeNumber: bicycle.bikeNumber,
      driverId: bicycle.driverId,
      driverName: bicycle.driverName,
      driverPhoto: bicycle.driverPhoto,
      status: distToPickup <= 25 ? 'arrived_at_pickup' : 'heading_to_pickup',
      driverCoords: {
        lat: bicycle.currentLocation.lat,
        lng: bicycle.currentLocation.lng,
        heading: bicycle.heading || 0
      },
      pickupCoords: {
        lat: pickupPin.lat,
        lng: pickupPin.lng,
        name: pickupPin.addressText
      },
      destinationCoords: {
        lat: destination.lat,
        lng: destination.lng,
        name: destination.name
      },
      distanceRemainingMeters: distToPickup,
      estimatedArrivalMinutes: Math.max(1, Math.ceil(distToPickup / 250)),
      waypoints,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.activeSessionSubject.next(session);
    return session;
  }

  /**
   * Updates driver position in real time and handles geofence arrival detection
   */
  public updateDriverPosition(
    lat: number,
    lng: number,
    heading?: number
  ): RouteTrackingSession | null {
    const session = this.activeSessionSubject.value;
    if (!session) return null;

    const updated = { ...session };
    updated.driverCoords = {
      lat,
      lng,
      heading: heading !== undefined ? heading : updated.driverCoords.heading
    };
    updated.lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (updated.status === 'heading_to_pickup') {
      const dist = this.bicycleFinder.calculateHaversineDistance(
        lat,
        lng,
        updated.pickupCoords.lat,
        updated.pickupCoords.lng
      );
      updated.distanceRemainingMeters = dist;
      updated.estimatedArrivalMinutes = Math.max(1, Math.ceil(dist / 250));

      // Within 25 meters -> trigger arrived state
      if (dist <= 25) {
        updated.status = 'arrived_at_pickup';
      }
    } else if (updated.status === 'en_route_destination') {
      const dist = this.bicycleFinder.calculateHaversineDistance(
        lat,
        lng,
        updated.destinationCoords.lat,
        updated.destinationCoords.lng
      );
      updated.distanceRemainingMeters = dist;
      updated.estimatedArrivalMinutes = Math.max(1, Math.ceil(dist / 250));

      if (dist <= 20) {
        updated.status = 'completed';
      }
    }

    this.activeSessionSubject.next(updated);
    return updated;
  }

  public setStatus(status: RouteTrackingSession['status']): void {
    const session = this.activeSessionSubject.value;
    if (!session) return;
    const updated: RouteTrackingSession = { ...session, status };
    this.activeSessionSubject.next(updated);
  }

  public stopTrackingSession(): void {
    this.activeSessionSubject.next(null);
  }

  public getActiveSession(): RouteTrackingSession | null {
    return this.activeSessionSubject.value;
  }
}

