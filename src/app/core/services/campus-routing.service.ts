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
  // Road network graph calibrated to the exact OpenStreetMap road centerlines of NEUST Sumacab Campus:
  // Mahogany Blvd, Banaba St, Malunggay Ave, Pili Ave, Kasoy St, Narra Ave, Caimito St, Duhat St, Avocado St
  private readonly campusJunctions: Record<string, CampusJunction> = {
    // --- 1. Mahogany Blvd (South Entrance Road) ---
    terminal: {
      id: 'terminal',
      lat: 15.444889,
      lng: 120.940417,
      neighbors: ['banaba_south', 'mahogany_pili']
    },
    mahogany_pili: {
      id: 'mahogany_pili',
      lat: 15.445180,
      lng: 120.939350,
      neighbors: ['terminal', 'pili_south', 'mahogany_kasoy']
    },
    mahogany_kasoy: {
      id: 'mahogany_kasoy',
      lat: 15.445520,
      lng: 120.938150,
      neighbors: ['mahogany_pili', 'kasoy_narra']
    },

    // --- 2. Banaba St (Main Central Avenue heading NNW from Main Gate) ---
    banaba_south: {
      id: 'banaba_south',
      lat: 15.445300,
      lng: 120.940220,
      neighbors: ['terminal', 'banaba_mid']
    },
    banaba_mid: {
      id: 'banaba_mid',
      lat: 15.445750,
      lng: 120.940010,
      neighbors: ['banaba_south', 'banaba_y_junction', 'pili_south']
    },
    banaba_y_junction: {
      id: 'banaba_y_junction',
      lat: 15.446150,
      lng: 120.939830,
      neighbors: ['banaba_mid', 'banaba_narra', 'malunggay_south', 'pili_admin']
    },
    banaba_narra: {
      id: 'banaba_narra',
      lat: 15.446868,
      lng: 120.939533,
      neighbors: ['banaba_y_junction', 'banaba_caimito', 'pili_narra', 'malunggay_narra']
    },
    banaba_caimito: {
      id: 'banaba_caimito',
      lat: 15.447550,
      lng: 120.939220,
      neighbors: ['banaba_narra', 'banaba_duhat', 'pili_caimito', 'malunggay_mid']
    },
    banaba_duhat: {
      id: 'banaba_duhat',
      lat: 15.448250,
      lng: 120.938920,
      neighbors: ['banaba_caimito', 'pili_duhat', 'cict_road', 'avocado_north']
    },

    // --- 3. Malunggay Ave (Branches NNE from Banaba Y-Junction towards COE, CICT & Gym) ---
    malunggay_south: {
      id: 'malunggay_south',
      lat: 15.446650,
      lng: 120.940010,
      neighbors: ['banaba_y_junction', 'malunggay_narra']
    },
    malunggay_narra: {
      id: 'malunggay_narra',
      lat: 15.447180,
      lng: 120.940200,
      neighbors: ['malunggay_south', 'banaba_narra', 'malunggay_mid']
    },
    malunggay_mid: {
      id: 'malunggay_mid',
      lat: 15.447750,
      lng: 120.940410,
      neighbors: ['malunggay_narra', 'banaba_caimito', 'malunggay_cict']
    },
    malunggay_cict: {
      id: 'malunggay_cict',
      lat: 15.448450,
      lng: 120.940660,
      neighbors: ['malunggay_mid', 'cict_road', 'malunggay_north', 'gym_pool_east']
    },
    malunggay_north: {
      id: 'malunggay_north',
      lat: 15.449100,
      lng: 120.940900,
      neighbors: ['malunggay_cict', 'avocado_east', 'gym_pool_east']
    },
    gym_pool_east: {
      id: 'gym_pool_east',
      lat: 15.448550,
      lng: 120.941250,
      neighbors: ['malunggay_cict', 'malunggay_north']
    },

    // --- 4. Pili Ave (Parallel Avenue West of Banaba St) ---
    pili_south: {
      id: 'pili_south',
      lat: 15.445650,
      lng: 120.939120,
      neighbors: ['mahogany_pili', 'pili_admin', 'banaba_mid']
    },
    pili_admin: {
      id: 'pili_admin',
      lat: 15.446150,
      lng: 120.938890,
      neighbors: ['pili_south', 'pili_narra', 'banaba_y_junction']
    },
    pili_narra: {
      id: 'pili_narra',
      lat: 15.446600,
      lng: 120.938680,
      neighbors: ['pili_admin', 'pili_caimito', 'banaba_narra', 'kasoy_narra']
    },
    pili_caimito: {
      id: 'pili_caimito',
      lat: 15.447280,
      lng: 120.938360,
      neighbors: ['pili_narra', 'pili_duhat', 'banaba_caimito', 'kasoy_caimito']
    },
    pili_duhat: {
      id: 'pili_duhat',
      lat: 15.447980,
      lng: 120.938040,
      neighbors: ['pili_caimito', 'banaba_duhat', 'kasoy_duhat', 'criminology_road']
    },

    // --- 5. Kasoy St (Western Campus Road) ---
    kasoy_narra: {
      id: 'kasoy_narra',
      lat: 15.446250,
      lng: 120.937800,
      neighbors: ['mahogany_kasoy', 'pili_narra', 'kasoy_caimito']
    },
    kasoy_caimito: {
      id: 'kasoy_caimito',
      lat: 15.446950,
      lng: 120.937480,
      neighbors: ['kasoy_narra', 'pili_caimito', 'kasoy_duhat']
    },
    kasoy_duhat: {
      id: 'kasoy_duhat',
      lat: 15.447650,
      lng: 120.937150,
      neighbors: ['kasoy_caimito', 'pili_duhat', 'criminology_road']
    },

    // --- 6. North Campus Roads (CICT, Avocado St, Grandstand, Criminology) ---
    cict_road: {
      id: 'cict_road',
      lat: 15.448650,
      lng: 120.939800,
      neighbors: ['banaba_duhat', 'malunggay_cict', 'avocado_east', 'avocado_north']
    },
    avocado_east: {
      id: 'avocado_east',
      lat: 15.449150,
      lng: 120.940150,
      neighbors: ['cict_road', 'malunggay_north', 'avocado_north']
    },
    avocado_north: {
      id: 'avocado_north',
      lat: 15.449150,
      lng: 120.939350,
      neighbors: ['banaba_duhat', 'cict_road', 'avocado_east', 'criminology_road']
    },
    criminology_road: {
      id: 'criminology_road',
      lat: 15.448800,
      lng: 120.938200,
      neighbors: ['pili_duhat', 'kasoy_duhat', 'avocado_north']
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
   * Snaps any GPS coordinate (e.g. live mobile phone GPS with ±5-15m drift or building pin)
   * perpendicularly onto the nearest paved road segment in the NEUST campus network.
   */
  public snapToNearestRoadSegment(lat: number, lng: number): {
    snappedPoint: [number, number];
    nodeA: string;
    nodeB: string;
    distanceToRoadMeters: number;
  } {
    let bestPoint: [number, number] = [lat, lng];
    let bestNodeA = 'main_gate';
    let bestNodeB = 'banaba_south';
    let minDist = Infinity;

    const visitedEdges = new Set<string>();
    const cosLat = Math.cos((lat * Math.PI) / 180);

    for (const u of Object.values(this.campusJunctions)) {
      for (const vId of u.neighbors) {
        const edgeKey = u.id < vId ? `${u.id}__${vId}` : `${vId}__${u.id}`;
        if (visitedEdges.has(edgeKey)) continue;
        visitedEdges.add(edgeKey);

        const v = this.campusJunctions[vId];
        if (!v) continue;

        // Project (lat, lng) onto segment u -> v using local equirectangular scaling
        const ax = u.lng * cosLat;
        const ay = u.lat;
        const bx = v.lng * cosLat;
        const by = v.lat;
        const px = lng * cosLat;
        const py = lat;

        const dx = bx - ax;
        const dy = by - ay;
        const lenSq = dx * dx + dy * dy;

        let t = 0;
        if (lenSq > 1e-12) {
          t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
        }

        const projLat = u.lat + t * (v.lat - u.lat);
        const projLng = u.lng + t * (v.lng - u.lng);
        const d = this.haversineMeters(lat, lng, projLat, projLng);

        if (d < minDist) {
          minDist = d;
          bestPoint = [projLat, projLng];
          bestNodeA = u.id;
          bestNodeB = v.id;
        }
      }
    }

    return {
      snappedPoint: bestPoint,
      nodeA: bestNodeA,
      nodeB: bestNodeB,
      distanceToRoadMeters: minDist
    };
  }

  /**
   * Dijkstra shortest path on the campus road network with road-segment snapping
   * so mobile GPS coordinates and building markers stay strictly on paved roads.
   */
  public computeCampusGraphRoute(
    origin: [number, number],
    destination: [number, number]
  ): RouteResult {
    const startSnap = this.snapToNearestRoadSegment(origin[0], origin[1]);
    const endSnap = this.snapToNearestRoadSegment(destination[0], destination[1]);

    const roadOrigin = startSnap.snappedPoint;
    const roadDest = endSnap.snappedPoint;

    // If both points snap onto the exact same road segment, connect directly along that road
    const sameSegment =
      (startSnap.nodeA === endSnap.nodeA && startSnap.nodeB === endSnap.nodeB) ||
      (startSnap.nodeA === endSnap.nodeB && startSnap.nodeB === endSnap.nodeA);

    if (sameSegment) {
      const dist = this.haversineMeters(roadOrigin[0], roadOrigin[1], roadDest[0], roadDest[1]);
      return {
        waypoints: [roadOrigin, roadDest],
        distanceMeters: Math.round(dist),
        estimatedMinutes: Math.max(1, Math.ceil(dist / 200)),
        source: 'campus_graph'
      };
    }

    // Run Dijkstra seeded from BOTH endpoints of the origin's snapped road segment
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    for (const key of Object.keys(this.campusJunctions)) {
      distances[key] = Infinity;
      previous[key] = null;
      unvisited.add(key);
    }

    const startCandidates = [startSnap.nodeA, startSnap.nodeB];
    for (const nodeId of startCandidates) {
      const node = this.campusJunctions[nodeId];
      if (node) {
        distances[nodeId] = this.haversineMeters(roadOrigin[0], roadOrigin[1], node.lat, node.lng);
      }
    }

    while (unvisited.size > 0) {
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const id of unvisited) {
        if (distances[id] < minDistance) {
          minDistance = distances[id];
          currentId = id;
        }
      }

      if (!currentId || minDistance === Infinity) break;

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

    // Pick whichever endpoint of the destination's snapped road segment gives the shortest total road path
    const endCandidates = [endSnap.nodeA, endSnap.nodeB];
    let bestEndNodeId = endSnap.nodeA;
    let bestTotalDist = Infinity;

    for (const nodeId of endCandidates) {
      const node = this.campusJunctions[nodeId];
      if (!node) continue;
      const distToDest = this.haversineMeters(node.lat, node.lng, roadDest[0], roadDest[1]);
      const candidateTotal = (distances[nodeId] ?? Infinity) + distToDest;
      if (candidateTotal < bestTotalDist) {
        bestTotalDist = candidateTotal;
        bestEndNodeId = nodeId;
      }
    }

    // Reconstruct road path
    const pathIds: string[] = [];
    let curr: string | null = bestEndNodeId;
    while (curr) {
      pathIds.unshift(curr);
      curr = previous[curr];
    }

    // Prevent backtracking if the first junction is behind roadOrigin along the same edge
    if (pathIds.length >= 2) {
      const j0 = this.campusJunctions[pathIds[0]];
      const j1 = this.campusJunctions[pathIds[1]];
      const dJ0toJ1 = this.haversineMeters(j0.lat, j0.lng, j1.lat, j1.lng);
      const dOrigToJ1 = this.haversineMeters(roadOrigin[0], roadOrigin[1], j1.lat, j1.lng);
      const dOrigToJ0 = this.haversineMeters(roadOrigin[0], roadOrigin[1], j0.lat, j0.lng);

      if (dOrigToJ1 <= dJ0toJ1 && (dOrigToJ0 + dOrigToJ1) <= dJ0toJ1 * 1.15) {
        pathIds.shift();
      }
    }

    // Prevent overshooting if the last junction is past roadDest along the same edge
    if (pathIds.length >= 2) {
      const lastIdx = pathIds.length - 1;
      const jLast = this.campusJunctions[pathIds[lastIdx]];
      const jPenult = this.campusJunctions[pathIds[lastIdx - 1]];
      const dPenultToLast = this.haversineMeters(jPenult.lat, jPenult.lng, jLast.lat, jLast.lng);
      const dDestToPenult = this.haversineMeters(roadDest[0], roadDest[1], jPenult.lat, jPenult.lng);
      const dDestToLast = this.haversineMeters(roadDest[0], roadDest[1], jLast.lat, jLast.lng);

      if (dDestToPenult <= dPenultToLast && (dDestToPenult + dDestToLast) <= dPenultToLast * 1.15) {
        pathIds.pop();
      }
    }

    const rawWaypoints: Array<[number, number]> = [roadOrigin];
    for (const id of pathIds) {
      const j = this.campusJunctions[id];
      rawWaypoints.push([j.lat, j.lng]);
    }
    rawWaypoints.push(roadDest);

    // Deduplicate adjacent points closer than 2.0 meters for smooth rendering and animation
    const waypoints: Array<[number, number]> = [];
    for (const wp of rawWaypoints) {
      if (waypoints.length === 0) {
        waypoints.push(wp);
      } else {
        const last = waypoints[waypoints.length - 1];
        if (this.haversineMeters(last[0], last[1], wp[0], wp[1]) >= 2.0) {
          waypoints.push(wp);
        }
      }
    }
    if (waypoints.length < 2) {
      waypoints.push(roadDest);
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

