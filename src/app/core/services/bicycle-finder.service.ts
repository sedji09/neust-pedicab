import { Injectable } from '@angular/core';
import { Bicycle, NearestBicycleResult } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class BicycleFinderService {
  private readonly AVERAGE_WALKING_SPEED_M_PER_MIN = 75; // 4.5 km/h
  private readonly AVERAGE_SHUTTLE_SPEED_M_PER_MIN = 250; // 15 km/h

  constructor() {}

  /**
   * Haversine formula calculation for distance between two WGS84 GPS coordinates
   * @returns Straight-line distance in meters
   */
  public calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Identifies and sorts available bicycles nearest to student/pickup location
   */
  public findNearestBicycles(
    originLat: number,
    originLng: number,
    bicycles: Bicycle[],
    targetDestinationName?: string
  ): NearestBicycleResult[] {
    if (!bicycles || bicycles.length === 0) return [];

    const results: NearestBicycleResult[] = [];

    for (const bike of bicycles) {
      // Exclude offline, maintenance or missing location
      if (bike.status === 'maintenance' || bike.status === 'offline' || !bike.currentLocation) {
        continue;
      }

      const straightLineDistanceMeters = this.calculateHaversineDistance(
        originLat,
        originLng,
        bike.currentLocation.lat,
        bike.currentLocation.lng
      );

      // Campus pedestrian / pathway routing multiplier (typically ~1.2x straight line on campus grid)
      const walkingDistanceMeters = Math.round(straightLineDistanceMeters * 1.2);

      // Estimated arrival in minutes based on pedicab speed + traffic buffer
      const estimatedArrivalMinutes = Math.max(
        1,
        Math.ceil(walkingDistanceMeters / this.AVERAGE_SHUTTLE_SPEED_M_PER_MIN)
      );

      const remainingSeats = bike.maxCapacity - bike.passengerCount;
      let isAvailableForTrip = true;
      let ineligibilityReason: string | undefined;

      if (remainingSeats <= 0 || bike.status === 'full') {
        isAvailableForTrip = false;
        ineligibilityReason = 'Pedicab is at full capacity (4/4)';
      } else if (
        targetDestinationName &&
        bike.currentDestination &&
        bike.currentDestination !== targetDestinationName &&
        bike.status === 'on_trip'
      ) {
        // En route to a different building with active passengers
        isAvailableForTrip = false;
        ineligibilityReason = `Heading to ${bike.currentDestination}`;
      }

      results.push({
        bicycle: bike,
        straightLineDistanceMeters,
        walkingDistanceMeters,
        estimatedArrivalMinutes,
        isAvailableForTrip,
        ineligibilityReason
      });
    }

    // Sort: Available first, then by distance ascending
    return results.sort((a, b) => {
      if (a.isAvailableForTrip && !b.isAvailableForTrip) return -1;
      if (!a.isAvailableForTrip && b.isAvailableForTrip) return 1;
      return a.straightLineDistanceMeters - b.straightLineDistanceMeters;
    });
  }

  /**
   * Formats distance nicely (e.g. "85m" or "0.4 km")
   */
  public formatDistance(distanceMeters: number): string {
    if (distanceMeters < 1000) {
      return `${distanceMeters}m`;
    }
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }
}

