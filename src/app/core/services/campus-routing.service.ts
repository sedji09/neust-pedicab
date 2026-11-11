import { Injectable } from '@angular/core';

export interface RouteResult {
  waypoints: Array<[number, number]>; // Array of [lat, lng]
  distanceMeters: number;
  estimatedMinutes: number;
  source: 'osrm' | 'campus_graph';
}

interface CampusJunction {
  id: string;
  lat: number;
  lng: number;
  neighbors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CampusRoutingService {
  // Road network graph representing actual paved internal roads of NEUST Sumacab
  private readonly campusJunctions: Record<string, CampusJunction> = {
    // South Terminal / Main Entrance Gate
    terminal: {
      id: 'terminal',
      lat: 15.444889,
      lng: 120.940417,
      neighbors: ['banaba_east', 'gate_inner', 'mahogany_pili']
    },
    gate_inner: {
      id: 'gate_inner',
      lat: 15.445200,
      lng: 120.940500,
      neighbors: ['terminal', 'banaba_east']
    },
    // Banaba St / South Ring Road
    banaba_east: {
      id: 'banaba_east',
      lat: 15.445500,
      lng: 120.940600,
      neighbors: ['terminal', 'gate_inner', 'banaba_mid']
    },
    banaba_mid: {
      id: 'banaba_mid',
      lat: 15.446000,
      lng: 120.940700,
      neighbors: ['banaba_east', 'plaza_east']
    },
    // Mahogany Blvd (South internal road) & Pili Ave (CMBT & Cafeteria front)
    mahogany_pili: {
      id: 'mahogany_pili',
      lat: 15.444889,
      lng: 120.939200,
      neighbors: ['terminal', 'pili_cmbt', 'mahogany_hostel']
    },
    pili_cmbt: {
      id: 'pili_cmbt',
      lat: 15.445500,
      lng: 120.939200,
      neighbors: ['mahogany_pili', 'admin_south']
    },
    mahogany_hostel: {
      id: 'mahogany_hostel',
      lat: 15.444889,
      lng: 120.937800,
      neighbors: ['mahogany_pili', 'creek_road']
    },
    creek_road: {
      id: 'creek_road',
      lat: 15.446200,
      lng: 120.936800,
      neighbors: ['mahogany_hostel', 'kasoy_mid']
    },
    kasoy_mid: {
      id: 'kasoy_mid',
      lat: 15.447500,
      lng: 120.936600,
      neighbors: ['creek_road', 'neust_mart_west', 'grandstand_west']
    },
    // Administration & Central Plaza (Main Intersection)
    admin_south: {
      id: 'admin_south',
      lat: 15.445900,
      lng: 120.939200,
      neighbors: ['pili_cmbt', 'admin_plaza']
    },
    admin_plaza: {
      id: 'admin_plaza',
      lat: 15.446300,
      lng: 120.939200,
      neighbors: ['admin_south', 'plaza_east', 'cict_entrance', 'library_front']
    },
    plaza_east: {
      id: 'plaza_east',
      lat: 15.446500,
      lng: 120.940800,
      neighbors: ['banaba_mid', 'admin_plaza', 'narra_malunggay']
    },
    // Narra Avenue & Academic Strip
    coe_bldg: {
      id: 'coe_bldg',
      lat: 15.446990,
      lng: 120.940490,
      neighbors: ['narra_malunggay', 'engineering_connector', 'plaza_east']
    },
    gym_facility: {
      id: 'gym_facility',
      lat: 15.448650,
      lng: 120.941100,
      neighbors: ['engineering_front', 'malunggay_north', 'open_gym_east']
    },
    pool_facility: {
      id: 'pool_facility',
      lat: 15.448300,
      lng: 120.941630,
      neighbors: ['engineering_front', 'narra_malunggay']
    },
    museum_bldg: {
      id: 'museum_bldg',
      lat: 15.445240,
      lng: 120.939610,
      neighbors: ['pili_cmbt', 'mahogany_pili', 'admin_south']
    },
    architecture_bldg: {
      id: 'architecture_bldg',
      lat: 15.446310,
      lng: 120.939290,
      neighbors: ['admin_plaza', 'admin_south', 'cict_entrance']
    },
    education_bldg: {
      id: 'education_bldg',
      lat: 15.447290,
      lng: 120.938630,
      neighbors: ['cict_entrance', 'engineering_connector', 'cict_north']
    },
    criminology_bldg: {
      id: 'criminology_bldg',
      lat: 15.448880,
      lng: 120.938170,
      neighbors: ['athletic_field_mid', 'cict_north']
    },
    grandstand_stage: {
      id: 'grandstand_stage',
      lat: 15.449350,
      lng: 120.939350,
      neighbors: ['athletic_field_mid', 'grandstand_east', 'cict_bldg']
    },
    library_front: {
      id: 'library_front',
      lat: 15.446700,
      lng: 120.938200,
      neighbors: ['admin_plaza', 'cict_entrance', 'neust_mart_west']
    },
    cict_entrance: {
      id: 'cict_entrance',
      lat: 15.447100,
      lng: 120.938800,
      neighbors: ['admin_plaza', 'library_front', 'engineering_connector', 'cict_north']
    },
    neust_mart_west: {
      id: 'neust_mart_west',
      lat: 15.447800,
      lng: 120.937800,
      neighbors: ['library_front', 'kasoy_mid', 'cict_north']
    },
    cict_north: {
      id: 'cict_north',
      lat: 15.448000,
      lng: 120.938600,
      neighbors: ['cict_entrance', 'neust_mart_west', 'athletic_field_mid', 'engineering_mid']
    },
    // East Academic Ring / Malunggay Ave / College of Engineering
    narra_malunggay: {
      id: 'narra_malunggay',
      lat: 15.447400,
      lng: 120.941200,
      neighbors: ['plaza_east', 'engineering_connector', 'engineering_front']
    },
    engineering_connector: {
      id: 'engineering_connector',
      lat: 15.447300,
      lng: 120.939800,
      neighbors: ['cict_entrance', 'narra_malunggay', 'engineering_mid']
    },
    engineering_front: {
      id: 'engineering_front',
      lat: 15.448400,
      lng: 120.941500,
      neighbors: ['narra_malunggay', 'malunggay_north', 'open_gym_east']
    },
    malunggay_north: {
      id: 'malunggay_north',
      lat: 15.449100,
      lng: 120.941100,
      neighbors: ['engineering_front', 'gym_curve']
    },
    engineering_mid: {
      id: 'engineering_mid',
      lat: 15.448400,
      lng: 120.939800,
      neighbors: ['engineering_connector', 'cict_north', 'open_gym_east', 'cict_bldg']
    },
    // North Campus / Athletic Complex / Grandstand
    open_gym_east: {
      id: 'open_gym_east',
      lat: 15.449600,
      lng: 120.940800,
      neighbors: ['engineering_front', 'gym_curve', 'engineering_mid', 'grandstand_east', 'cict_bldg']
    },
    gym_curve: {
      id: 'gym_curve',
      lat: 15.449700,
      lng: 120.940600,
      neighbors: ['malunggay_north', 'open_gym_east', 'gym_oval_turn', 'cict_bldg']
    },
    cict_bldg: {
      id: 'cict_bldg',
      lat: 15.448850,
      lng: 120.939800,
      neighbors: ['open_gym_east', 'engineering_mid', 'grandstand_stage', 'athletic_field_mid']
    },
    gym_oval_turn: {
      id: 'gym_oval_turn',
      lat: 15.450200,
      lng: 120.939800,
      neighbors: ['gym_curve', 'grandstand_east']
    },
    athletic_field_mid: {
      id: 'athletic_field_mid',
      lat: 15.449200,
      lng: 120.938200,
      neighbors: ['cict_north', 'grandstand_mid', 'grandstand_west']
    },
    grandstand_west: {
      id: 'grandstand_west',
      lat: 15.450200,
      lng: 120.937200,
      neighbors: ['kasoy_mid', 'athletic_field_mid', 'grandstand_north']
    },
    grandstand_mid: {
      id: 'grandstand_mid',
      lat: 15.450500,
      lng: 120.938200,
      neighbors: ['athletic_field_mid', 'grandstand_north', 'grandstand_east']
    },
    grandstand_east: {
      id: 'grandstand_east',
      lat: 15.450500,
      lng: 120.939100,
      neighbors: ['gym_oval_turn', 'open_gym_east', 'grandstand_north_road', 'grandstand_mid']
    },
    grandstand_north_road: {
      id: 'grandstand_north_road',
      lat: 15.450850,
      lng: 120.938700,
      neighbors: ['grandstand_east', 'grandstand_corner', 'grandstand_north']
    },
    grandstand_corner: {
      id: 'grandstand_corner',
      lat: 15.451080,
      lng: 120.938550,
      neighbors: ['grandstand_north_road', 'grandstand_north']
    },
    grandstand_north: {
      id: 'grandstand_north',
      lat: 15.451000,
      lng: 120.938500,
      neighbors: ['grandstand_west', 'grandstand_mid', 'grandstand_east', 'grandstand_corner', 'grandstand_north_road']
    }
  };

  // Route request cache to prevent excessive requests
  private routeCache = new Map<string, RouteResult>();

  constructor() {}

  /**
   * Calculates a road-following route between origin and destination.
   * Confined strictly to the legal, accessible internal road network of NEUST Sumacab.
   * Public OSRM driving servers are bypassed because they lack institutional campus
   * micro-mobility road access and detour 2+ km outside the university fence onto highways.
   */
  public async getRoadRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<RouteResult> {
    const [startLat, startLng] = origin;
    const [endLat, endLng] = destination;

    // Cache key quantized to ~10 meters (4 decimals)
    const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}->${endLat.toFixed(4)},${endLng.toFixed(4)}`;
    if (this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey)!;
    }

    const result = this.computeCampusGraphRoute(origin, destination);
    this.routeCache.set(cacheKey, result);
    return result;
  }

  /**
   * Dijkstra shortest path on the campus road network
   */
  public computeCampusGraphRoute(
    origin: [number, number],
    destination: [number, number]
  ): RouteResult {
    const [startLat, startLng] = origin;
    const [endLat, endLng] = destination;

    // 1. Find nearest entry junction to origin
    const startJunction = this.findNearestJunction(startLat, startLng);
    // 2. Find nearest exit junction to destination
    const endJunction = this.findNearestJunction(endLat, endLng);

    // If both snap to the same junction or straight close
    if (startJunction.id === endJunction.id) {
      const dist = this.haversineMeters(startLat, startLng, endLat, endLng);
      return {
        waypoints: [origin, [startJunction.lat, startJunction.lng], destination],
        distanceMeters: Math.round(dist),
        estimatedMinutes: Math.max(1, Math.ceil(dist / 200)),
        source: 'campus_graph'
      };
    }

    // Dijkstra algorithm
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    for (const key of Object.keys(this.campusJunctions)) {
      distances[key] = Infinity;
      previous[key] = null;
      unvisited.add(key);
    }

    distances[startJunction.id] = 0;

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const id of unvisited) {
        if (distances[id] < minDistance) {
          minDistance = distances[id];
          currentId = id;
        }
      }

      if (!currentId || minDistance === Infinity) break;
      if (currentId === endJunction.id) break;

      unvisited.delete(currentId);
      const current = this.campusJunctions[currentId];

      for (const neighborId of current.neighbors) {
        if (!unvisited.has(neighborId)) continue;
        const neighbor = this.campusJunctions[neighborId];
        const edgeWeight = this.haversineMeters(current.lat, current.lng, neighbor.lat, neighbor.lng);
        const alt = distances[currentId] + edgeWeight;

        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previous[neighborId] = currentId;
        }
      }
    }

    // Reconstruct road path
    const pathIds: string[] = [];
    let curr: string | null = endJunction.id;
    while (curr) {
      pathIds.unshift(curr);
      curr = previous[curr];
    }

    // Prune backtracking at the start: if origin is already between pathIds[0] and pathIds[1],
    // or closer to pathIds[1] than pathIds[0] is, going to pathIds[0] is moving backwards!
    if (pathIds.length >= 2) {
      const j0 = this.campusJunctions[pathIds[0]];
      const j1 = this.campusJunctions[pathIds[1]];
      const dJ0toJ1 = this.haversineMeters(j0.lat, j0.lng, j1.lat, j1.lng);
      const dOrigToJ1 = this.haversineMeters(origin[0], origin[1], j1.lat, j1.lng);
      const dOrigToJ0 = this.haversineMeters(origin[0], origin[1], j0.lat, j0.lng);

      if (dOrigToJ1 < dJ0toJ1 && (dOrigToJ0 + dOrigToJ1) <= dJ0toJ1 * 1.35) {
        pathIds.shift();
      }
    }

    // Prune overshooting at destination: if destination is before the last junction,
    // don't overshoot to the last junction and double back!
    if (pathIds.length >= 2) {
      const lastIdx = pathIds.length - 1;
      const jLast = this.campusJunctions[pathIds[lastIdx]];
      const jPenult = this.campusJunctions[pathIds[lastIdx - 1]];
      const dPenultToLast = this.haversineMeters(jPenult.lat, jPenult.lng, jLast.lat, jLast.lng);
      const dDestToPenult = this.haversineMeters(destination[0], destination[1], jPenult.lat, jPenult.lng);
      const dDestToLast = this.haversineMeters(destination[0], destination[1], jLast.lat, jLast.lng);

      if (dDestToPenult < dPenultToLast && (dDestToPenult + dDestToLast) <= dPenultToLast * 1.35) {
        pathIds.pop();
      }
    }

    const rawWaypoints: Array<[number, number]> = [origin];
    for (const id of pathIds) {
      const j = this.campusJunctions[id];
      rawWaypoints.push([j.lat, j.lng]);
    }
    rawWaypoints.push(destination);

    // Deduplicate adjacent points closer than 2.5 meters for smooth rendering and animation
    const waypoints: Array<[number, number]> = [];
    for (const wp of rawWaypoints) {
      if (waypoints.length === 0) {
        waypoints.push(wp);
      } else {
        const last = waypoints[waypoints.length - 1];
        if (this.haversineMeters(last[0], last[1], wp[0], wp[1]) >= 2.5) {
          waypoints.push(wp);
        }
      }
    }
    if (waypoints.length < 2) {
      waypoints.push(destination);
    }

    // Calculate total road distance along waypoints
    let totalDist = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDist += this.haversineMeters(
        waypoints[i][0],
        waypoints[i][1],
        waypoints[i + 1][0],
        waypoints[i + 1][1]
      );
    }

    const distanceMeters = Math.round(totalDist);
    const estimatedMinutes = Math.max(1, Math.ceil(distanceMeters / 200));

    return {
      waypoints,
      distanceMeters,
      estimatedMinutes,
      source: 'campus_graph'
    };
  }

  /**
   * Calculates bearing angle in degrees (0 - 360) from point A to point B
   * for rotating the custom pedicab icon in direction of travel
   */
  public calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = Math.PI / 180;
    const toDeg = 180 / Math.PI;

    const y = Math.sin((lon2 - lon1) * toRad) * Math.cos(lat2 * toRad);
    const x =
      Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
      Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos((lon2 - lon1) * toRad);

    let bearing = Math.atan2(y, x) * toDeg;
    return (bearing + 360) % 360;
  }

  /**
   * Smoothly interpolates coordinates between two points (t: 0.0 -> 1.0)
   */
  public interpolateCoords(
    p1: [number, number],
    p2: [number, number],
    fraction: number
  ): [number, number] {
    const f = Math.max(0, Math.min(1, fraction));
    return [
      p1[0] + (p2[0] - p1[0]) * f,
      p1[1] + (p2[1] - p1[1]) * f
    ];
  }

  private findNearestJunction(lat: number, lng: number): CampusJunction {
    let nearest: CampusJunction = Object.values(this.campusJunctions)[0];
    let minDist = Infinity;

    for (const j of Object.values(this.campusJunctions)) {
      const d = this.haversineMeters(lat, lng, j.lat, j.lng);
      if (d < minDist) {
        minDist = d;
        nearest = j;
      }
    }
    return nearest;
  }

  public haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
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

