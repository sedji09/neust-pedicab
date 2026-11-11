import { Injectable } from '@angular/core';
import { CampusLocation, DemandHeatPoint, QueueEntry } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PassengerDemandService {
  constructor() {}

  /**
   * Generates passenger demand heatmap data points from current queue state
   */
  public generateDemandHeatPoints(
    queues: QueueEntry[],
    locations: CampusLocation[]
  ): DemandHeatPoint[] {
    const activeWaiting = queues.filter(q => q.status === 'waiting');
    const locationCounts = new Map<string, number>();

    // Count waiting per location
    for (const q of activeWaiting) {
      const locId = q.pickupLocationId;
      locationCounts.set(locId, (locationCounts.get(locId) || 0) + 1);
    }

    // Also include baseline campus location waiting counts
    for (const loc of locations) {
      const existing = locationCounts.get(loc.id) || 0;
      locationCounts.set(loc.id, Math.max(existing, loc.waitingCount || 0));
    }

    let maxCount = 1;
    for (const count of locationCounts.values()) {
      if (count > maxCount) maxCount = count;
    }

    const heatPoints: DemandHeatPoint[] = [];

    for (const loc of locations) {
      const count = locationCounts.get(loc.id) || 0;
      if (count > 0) {
        // Normalize weight between 0.2 and 1.0
        const weight = Math.min(1.0, Math.max(0.2, Number((count / maxCount).toFixed(2))));
        heatPoints.push({
          lat: loc.coordinates.lat,
          lng: loc.coordinates.lng,
          weight,
          locationName: loc.name,
          waitingCount: count,
          x: loc.coordinates.x,
          y: loc.coordinates.y
        });
      }
    }

    // Also include any custom student pickup coordinates currently in waiting queue
    for (const q of activeWaiting) {
      if (q.customPickupPin) {
        heatPoints.push({
          lat: q.customPickupPin.lat,
          lng: q.customPickupPin.lng,
          weight: 0.6,
          locationName: q.customPickupPin.addressText,
          waitingCount: 1,
          x: q.customPickupPin.x,
          y: q.customPickupPin.y
        });
      }
    }

    return heatPoints;
  }

  /**
   * Calculates overall campus demand metrics for administrative dispatch
   */
  public getDemandMetrics(heatPoints: DemandHeatPoint[]): {
    totalWaiting: number;
    highestDemandLocation: string;
    highestDemandCount: number;
    peakSeverity: 'Low' | 'Moderate' | 'High' | 'Critical';
  } {
    const totalWaiting = heatPoints.reduce((acc, p) => acc + p.waitingCount, 0);
    const sorted = [...heatPoints].sort((a, b) => b.waitingCount - a.waitingCount);

    const highest = sorted[0];
    let peakSeverity: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
    if (totalWaiting > 30) peakSeverity = 'Critical';
    else if (totalWaiting > 15) peakSeverity = 'High';
    else if (totalWaiting > 5) peakSeverity = 'Moderate';

    return {
      totalWaiting,
      highestDemandLocation: highest ? highest.locationName : 'None',
      highestDemandCount: highest ? highest.waitingCount : 0,
      peakSeverity
    };
  }
}

