import { Injectable, NgZone } from '@angular/core';
import { Bicycle, DesignatedZone, DemandHeatPoint, CampusLocation } from '../models/models';
import { PickupLocationService } from './pickup-location.service';

declare const L: any;

@Injectable({
  providedIn: 'root'
})
export class LeafletMapService {
  constructor(private ngZone: NgZone) {}

  public isLeafletLoaded(): boolean {
    return typeof L !== 'undefined' && L !== null;
  }

  /**
   * Ensures Leaflet CSS & JS are loaded in the browser even if index.html CDN script was delayed
   */
  public ensureLeafletLoaded(): Promise<boolean> {
    if (this.isLeafletLoaded()) {
      return Promise.resolve(true);
    }
    if (typeof document === 'undefined') {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      // Ensure CSS is loaded
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // Check again shortly in case existing script tag is finishing
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (this.isLeafletLoaded()) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts === 6) {
          // Inject fallback script dynamically
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
          script.onload = () => {
            clearInterval(checkInterval);
            resolve(this.isLeafletLoaded());
          };
          script.onerror = () => {
            clearInterval(checkInterval);
            resolve(false);
          };
          document.head.appendChild(script);
        } else if (attempts > 30) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 120);
    });
  }

  /**
   * Initializes a Leaflet Map instance on the given HTML element or ID
   */
  public createMap(element: HTMLElement | string, centerLat = 15.4475, centerLng = 120.9388, zoom = 17): any {
    if (!this.isLeafletLoaded()) return null;

    try {
      // Campus Bounds for NEUST Sumacab Grounds with comfortable view margin
      const campusBounds = L.latLngBounds(
        L.latLng(15.4410, 120.9330), // South-West: terminal gate, NSTP & inner creek
        L.latLng(15.4540, 120.9450)  // North-East: Grandstand & Engineering
      );

      const map = L.map(element, {
        center: [centerLat, centerLng],
        zoom: zoom,
        minZoom: 15,
        maxZoom: 19,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelDebounceTime: 100,
        bounceAtZoomLimits: false,
        maxBounds: campusBounds,
        maxBoundsViscosity: 0.35,
        zoomControl: false,
        attributionControl: false
      });

      // High-resolution street tiles matching the exact NEUST Sumacab Google Map
      const googleRoads = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        minZoom: 13,
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps'
      });

      // OpenStreetMap fallback (100% free, no API key required, zero watermark)
      const osmFallback = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 13,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors'
      });

      googleRoads.on('tileerror', () => {
        if (!map.hasLayer(osmFallback)) {
          map.removeLayer(googleRoads);
          osmFallback.addTo(map);
        }
      });

      googleRoads.addTo(map);

      // Add subtle zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      return map;
    } catch (e) {
      console.warn('Error initializing Leaflet map:', e);
      return null;
    }
  }

  /**
   * Creates a draggable Grab-style Custom Pickup Pin (Blue teardrop with attached white bubble)
   */
  public addDraggablePickupPin(
    map: any,
    lat: number,
    lng: number,
    onDragEnd: (newLat: number, newLng: number) => void,
    title: string = 'Current location'
  ): any {
    return this.renderGrabPickupPin(map, lat, lng, title, true, onDragEnd);
  }

  /**
   * Renders Authentic Grab-style Blue Pickup Teardrop Pin with Left Attached Bubble
   */
  public renderGrabPickupPin(
    map: any,
    lat: number,
    lng: number,
    title: string = 'Current location',
    draggable: boolean = true,
    onDragEnd?: (newLat: number, newLng: number) => void
  ): any {
    if (!this.isLeafletLoaded() || !map) return null;

    const shortTitle = title.length > 28 ? title.slice(0, 26) + '...' : title;

    const html = `
      <div class="grab-marker-anchor-box">
        <div class="grab-pin-root">
          <div class="grab-pin-bubble bubble-left">
            <span class="bubble-title-text">${shortTitle}</span>
            <span class="bubble-arrow-icon">&#x203A;</span>
          </div>
          <div class="grab-pin-teardrop teardrop-blue">
            <svg width="34" height="44" viewBox="0 0 34 44" fill="none">
              <path d="M17 0C7.61116 0 0 7.61116 0 17C0 28.5 17 44 17 44C17 44 34 28.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#0085FF"/>
              <circle cx="17" cy="17" r="6" fill="#FFFFFF"/>
            </svg>
            <div class="pin-shadow-ellipse"></div>
          </div>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'grab-leaflet-pin-icon-wrap',
      html,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const marker = L.marker([lat, lng], {
      icon,
      draggable: draggable,
      zIndexOffset: 1200
    }).addTo(map);

    if (draggable && onDragEnd) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        this.ngZone.run(() => {
          onDragEnd(pos.lat, pos.lng);
        });
      });
    }

    return marker;
  }

  /**
   * Renders Authentic Grab-style Red Destination Teardrop Pin with Right Attached Bubble & Plus Icon
   */
  public renderGrabDestinationPin(
    map: any,
    lat: number,
    lng: number,
    title: string = 'Destination'
  ): any {
    if (!this.isLeafletLoaded() || !map) return null;

    const shortTitle = title.length > 26 ? title.slice(0, 24) + '...' : title;

    const html = `
      <div class="grab-marker-anchor-box">
        <div class="grab-pin-root">
          <div class="grab-pin-teardrop teardrop-red">
            <svg width="34" height="44" viewBox="0 0 34 44" fill="none">
              <path d="M17 0C7.61116 0 0 7.61116 0 17C0 28.5 17 44 17 44C17 44 34 28.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#F04438"/>
              <circle cx="17" cy="17" r="6" fill="#FFFFFF"/>
            </svg>
            <div class="pin-shadow-ellipse"></div>
          </div>
          <div class="grab-pin-bubble bubble-right">
            <span class="bubble-title-text">${shortTitle}</span>
            <span class="bubble-arrow-icon">&#x203A;</span>
            <span class="bubble-plus-btn">+</span>
          </div>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'grab-leaflet-pin-icon-wrap',
      html,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    return L.marker([lat, lng], {
      icon,
      zIndexOffset: 1100
    }).addTo(map);
  }

  /**
   * Renders the 2 Official Terminal Pilahan Hubs (Pilahan sa Gate & Gilid ng Arki)
   * directly on the map with live queued trike counters.
   */
  public renderTerminalHubMarkers(
    map: any,
    terminals: Array<{
      id: string;
      title: string;
      subtitle: string;
      iconEmoji: string;
      lat: number;
      lng: number;
      queuedBikes: Bicycle[];
      totalFreeSeats: number;
      accent: 'gate' | 'arki';
    }>,
    onSelectTerminal: (termId: string) => void,
    lang: 'en' | 'fil' = 'en'
  ): any[] {
    if (!this.isLeafletLoaded() || !map) return [];

    const layers: any[] = [];
    const isFil = lang === 'fil';

    for (const term of terminals) {
      const count = term.queuedBikes.length;
      const isGate = term.accent === 'gate';
      const ringColor = isGate ? '#16A34A' : '#0D9488';
      const fillBg = isGate ? '#22C55E' : '#14B8A6';

      // Subtle terminal zone ground circle
      const zoneCircle = L.circle([term.lat, term.lng], {
        radius: 32,
        color: ringColor,
        weight: 2,
        dashArray: '5, 5',
        fillColor: fillBg,
        fillOpacity: 0.14
      }).addTo(map);
      layers.push(zoneCircle);

      const bikePlates = term.queuedBikes.map(b => b.bikeNumber).join(', ');
      const countLabel = count > 0 
        ? `${count} ${isFil ? 'Nakapila' : 'in Queue'}` 
        : (isFil ? 'Walang Pila' : 'Stand Empty');
      const subBadgeText = count > 0 
        ? `${term.totalFreeSeats} ${isFil ? 'Upuan' : 'Seats'} • ${bikePlates}` 
        : (isFil ? 'Naghihintay ng Trike' : 'Waiting for Pedicabs');

      const html = `
        <div class="leaflet-terminal-hub-marker hub-${term.accent} ${count === 0 ? 'hub-empty' : ''}">
          <div class="hub-pulse-ring"></div>
          <div class="hub-card-pill">
            <div class="hub-icon-box">${term.iconEmoji}</div>
            <div class="hub-info-col">
              <div class="hub-top-line">
                <span class="hub-title">${term.title}</span>
                <span class="hub-count-badge">${countLabel}</span>
              </div>
              <span class="hub-sub-meta">${subBadgeText}</span>
            </div>
          </div>
          <div class="hub-pointer-tip"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'leaflet-terminal-hub-host',
        html,
        iconSize: [160, 44],
        iconAnchor: [80, 44]
      });

      const marker = L.marker([term.lat, term.lng], {
        icon,
        zIndexOffset: 950
      }).addTo(map);

      marker.on('click', () => {
        this.ngZone.run(() => {
          onSelectTerminal(term.id);
        });
      });

      layers.push(marker);
    }

    return layers;
  }

  /**
   * Renders Authentic 3D Pedicab vehicle sprites moving on campus roads or queued at terminals
   * with clear status badges (Nakapila sa Gate, Gilid ng Arki, Nagroronda, Bumabyahe)
   * and side-by-side coordinate offsets when multiple trikes are queued at the same terminal.
   */
  public renderBicycleMarkers(
    map: any,
    bicycles: Bicycle[],
    onSelect: (bike: Bicycle) => void,
    lang: 'en' | 'fil' = 'en'
  ): any[] {
    if (!this.isLeafletLoaded() || !map) return [];

    const markers: any[] = [];
    const gateCoords = { lat: 15.444889, lng: 120.940417 };
    const arkiCoords = { lat: 15.446868, lng: 120.939533 };

    let gateSlotIdx = 0;
    let arkiSlotIdx = 0;
    const isFil = lang === 'fil';

    for (const bike of bicycles) {
      if (bike.status === 'offline' || bike.status === 'maintenance') continue;

      // Filter: Ensure pedicab is strictly inside NEUST Sumacab campus boundary
      if (!PickupLocationService.isInsideCampusBoundary(bike.currentLocation.lat, bike.currentLocation.lng)) {
        continue;
      }

      // Check if bike is queued at Gate or Gilid ng Arki
      const distGateMeters = Math.hypot(
        (bike.currentLocation.lat - gateCoords.lat) * 111320,
        (bike.currentLocation.lng - gateCoords.lng) * 107180
      );
      const distArkiMeters = Math.hypot(
        (bike.currentLocation.lat - arkiCoords.lat) * 111320,
        (bike.currentLocation.lng - arkiCoords.lng) * 107180
      );

      const isWaitingStatus = bike.status === 'available' || (bike.status === 'almost_full' && (distGateMeters <= 75 || distArkiMeters <= 75));
      const isAtGate = isWaitingStatus && distGateMeters <= 75;
      const isAtArki = isWaitingStatus && !isAtGate && distArkiMeters <= 75;

      let displayLat = bike.currentLocation.lat;
      let displayLng = bike.currentLocation.lng;

      // Offset queued trikes slightly along the road side-by-side so they never overlap on top of each other
      if (isAtGate) {
        const offsets = [
          { dLat: 0.00018, dLng: -0.00020 },
          { dLat: 0.00018, dLng:  0.00020 },
          { dLat: 0.00034, dLng: -0.00020 },
          { dLat: 0.00034, dLng:  0.00020 }
        ];
        const off = offsets[gateSlotIdx % offsets.length];
        displayLat = gateCoords.lat + off.dLat;
        displayLng = gateCoords.lng + off.dLng;
        gateSlotIdx++;
      } else if (isAtArki) {
        const offsets = [
          { dLat: 0.00018, dLng: -0.00020 },
          { dLat: 0.00018, dLng:  0.00020 },
          { dLat: 0.00034, dLng: -0.00020 },
          { dLat: 0.00034, dLng:  0.00020 }
        ];
        const off = offsets[arkiSlotIdx % offsets.length];
        displayLat = arkiCoords.lat + off.dLat;
        displayLng = arkiCoords.lng + off.dLng;
        arkiSlotIdx++;
      }

      // Determine status badge appearance
      let statusClass = 'trike-roaming';
      let statusShort = isFil ? 'Nagroronda' : 'Roaming';

      if (isAtGate) {
        statusClass = 'trike-queued-gate';
        statusShort = isFil ? 'Pila • Gate' : 'Queue • Gate';
      } else if (isAtArki) {
        statusClass = 'trike-queued-arki';
        statusShort = isFil ? 'Pila • Arki' : 'Queue • Arki';
      } else if (bike.status === 'almost_full' || (bike.status === 'available' && !isAtGate && !isAtArki)) {
        statusClass = 'trike-roaming';
        const freeSeats = Math.max(0, bike.maxCapacity - bike.passengerCount);
        statusShort = isFil ? `Ronda (${freeSeats} libre)` : `Roaming (${freeSeats} open)`;
      } else {
        statusClass = 'trike-ontrip';
        statusShort = isFil ? `Biyahe (${bike.passengerCount}/${bike.maxCapacity})` : `On Trip (${bike.passengerCount}/${bike.maxCapacity})`;
      }

      // Smooth horizontal flip if bike heading is towards the west
      const normHeading = (((bike.heading || 0) % 360) + 360) % 360;
      const isFacingWest = normHeading > 180 && normHeading < 360;
      const flipStyle = isFacingWest ? 'transform: scaleX(-1);' : 'transform: scaleX(1);';

      const html = `
        <div class="leaflet-clean-pedicab-icon-wrap ${statusClass}">
          <div class="pedicab-status-ring"></div>
          <div class="pedicab-vehicle-sprite" style="${flipStyle}">
            <img src="assets/images/pedicab-rider.png" class="pedicab-map-img" alt="${bike.bikeNumber}" />
          </div>
          <div class="pedicab-ground-shadow"></div>
          <div class="pedicab-mini-tag">
            <span class="pm-dot"></span>
            <span class="pm-num">${bike.bikeNumber}</span>
            <span class="pm-sep">•</span>
            <span class="pm-state">${statusShort}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'leaflet-clean-pedicab-marker',
        html,
        iconSize: [80, 52],
        iconAnchor: [40, 26]
      });

      const marker = L.marker([displayLat, displayLng], {
        icon,
        zIndexOffset: isAtGate || isAtArki ? 650 : 780
      }).addTo(map);

      marker.on('click', () => {
        this.ngZone.run(() => {
          onSelect(bike);
        });
      });

      markers.push(marker);
    }

    return markers;
  }

  /**
   * Renders official campus building / destination marker on Leaflet.
   * Bulky [Bldg | CODE | X wait] bubble badges are removed to keep the map clean.
   * Only displays a sleek destination indicator when a destination is actively selected.
   */
  public renderCampusLocationMarkers(
    map: any,
    locations: CampusLocation[],
    selectedDestinationId: string | null,
    onSelect: (loc: CampusLocation) => void
  ): any[] {
    if (!this.isLeafletLoaded() || !map || !selectedDestinationId) return [];

    const markers: any[] = [];
    const dest = locations.find(l => l.id === selectedDestinationId);

    if (dest) {
      const html = `
        <div class="leaflet-selected-dest-marker">
          <div class="dest-target-pulse"></div>
          <div class="dest-target-tag">
            <span class="dest-icon">🎯</span>
            <span class="dest-name">${dest.name}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'leaflet-clean-dest-icon',
        html,
        iconSize: [120, 36],
        iconAnchor: [60, 32]
      });

      const marker = L.marker([dest.coordinates.lat, dest.coordinates.lng], {
        icon,
        zIndexOffset: 350
      }).addTo(map);

      marker.on('click', () => {
        this.ngZone.run(() => onSelect(dest));
      });

      markers.push(marker);
    }

    return markers;
  }

  /**
   * Renders designated pickup and drop-off zones as Leaflet Circles / Polygons
   */
  public renderZones(map: any, zones: DesignatedZone[]): any[] {
    if (!this.isLeafletLoaded() || !map) return [];

    const layers: any[] = [];

    for (const zone of zones) {
      if (!zone.isEnabled) continue;

      const isRestricted = zone.type === 'restricted';
      const color = isRestricted ? '#DC2626' : '#2563EB';
      const fillColor = isRestricted ? '#EF4444' : '#60A5FA';

      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radiusMeters,
        color: color,
        weight: isRestricted ? 2.5 : 2,
        dashArray: isRestricted ? '6, 6' : undefined,
        fillColor: fillColor,
        fillOpacity: isRestricted ? 0.25 : 0.15
      }).addTo(map);

      const popupContent = `
        <div style="font-family: inherit; padding: 4px;">
          <strong style="color: ${color}; font-size: 13px;">${zone.name}</strong>
          <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">${zone.description}</p>
          <div style="margin-top: 6px; font-size: 11px; font-weight: 600; color: #1E293B;">
            ${isRestricted ? '⚠️ RESTRICTED CAMPUS ZONE' : `Radius: ${zone.radiusMeters}m • ${zone.type.toUpperCase()}`}
          </div>
        </div>
      `;
      circle.bindPopup(popupContent);

      layers.push(circle);
    }

    return layers;
  }

  /**
   * Renders the Official NEUST Sumacab Campus Perimeter Boundary Polygon
   * matching the exact red perimeter line drawn by the user.
   * Allows customizing line thickness (weight) and color.
   */
  public renderCampusBoundary(map: any, weight = 1.5, color = '#DC2626'): any {
    if (!this.isLeafletLoaded() || !map) return null;

    const coords = PickupLocationService.CAMPUS_BOUNDARY_POLYGON;

    const boundaryPolygon = L.polygon(coords, {
      color: color,       // Red line as requested
      weight: weight,     // Line thickness (default: 1.5px, subtle and clean)
      opacity: 0.85,
      dashArray: '5, 4',  // Neat subtle dashed line
      fillColor: '#2563EB',
      fillOpacity: 0.03
    }).addTo(map);

    return boundaryPolygon;
  }

  /**
   * Draws a Grab-style route polyline connecting driver, pickup, and destination
   */
  public renderRoutePolyline(map: any, waypoints: Array<[number, number]>, isLiveTracking = false): any {
    if (!this.isLeafletLoaded() || !map || waypoints.length < 2) return null;

    const group = L.featureGroup();

    // Outer contrast casing (Crisp white border for road contrast, matching Grab navigation)
    const casing = L.polyline(waypoints, {
      color: '#FFFFFF',
      weight: 8.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });
    group.addLayer(casing);

    // Inner Directional Road Line (Solid Vibrant Blue as requested)
    const core = L.polyline(waypoints, {
      color: '#1D4ED8',
      weight: 5.5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round'
    });
    group.addLayer(core);

    group.addTo(map);

    // Auto-fit bounds with padding so destination & pickup are clearly framed above bottom sheet
    try {
      map.fitBounds(group.getBounds(), {
        paddingTopLeft: [50, 40],
        paddingBottomRight: [50, 260],
        maxZoom: 18,
        animate: true
      });
    } catch (e) {}

    return group;
  }

  /**
   * Renders high-visibility custom 3D pedicab marker with smooth direction flip and rider tag
   */
  public renderPedicabMarker(
    map: any,
    lat: number,
    lng: number,
    heading: number = 0,
    bikeNumber: string = 'BIKE-003',
    driverName: string = 'Juan Dela Cruz',
    isArriving: boolean = true
  ): any {
    if (!this.isLeafletLoaded() || !map) return null;

    // Determine horizontal flip based on heading
    // The 3D pedicab image naturally faces front-right. If heading west (180 to 360), flip horizontally.
    const normHeading = ((heading % 360) + 360) % 360;
    const isFacingWest = normHeading > 180 && normHeading < 360;
    const flipStyle = isFacingWest ? 'transform: scaleX(-1);' : 'transform: scaleX(1);';

    const html = `
      <div class="leaflet-custom-pedicab-container">
        <div class="pedicab-halo ${isArriving ? 'halo-green' : 'halo-blue'}"></div>
        <div class="pedicab-vehicle-body" style="${flipStyle}">
          <img src="assets/images/pedicab-rider.png" class="pedicab-3d-img" alt="NEUST Pedicab Rider" />
        </div>
        <div class="pedicab-rider-badge">
          <span class="p-dot ${isArriving ? 'dot-green' : 'dot-blue'}"></span>
          <span class="p-label">${bikeNumber}</span>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'leaflet-pedicab-icon-host',
      html,
      iconSize: [68, 68],
      iconAnchor: [34, 34]
    });

    const marker = L.marker([lat, lng], {
      icon,
      zIndexOffset: 3000
    }).addTo(map);

    return marker;
  }

  /**
   * Renders high-visibility Pickup marker with pulse ring and badge
   */
  public renderPickupStationMarker(map: any, lat: number, lng: number, title: string = 'Pickup Point'): any {
    return this.renderGrabPickupPin(map, lat, lng, title, false);
  }

  /**
   * Renders high-visibility Destination marker using Grab-style Red Pin
   */
  public renderDestinationStationMarker(map: any, lat: number, lng: number, title: string = 'Destination'): any {
    return this.renderGrabDestinationPin(map, lat, lng, title);
  }

  /**
   * Renders passenger demand heatmap points
   */
  public renderHeatmap(map: any, heatPoints: DemandHeatPoint[]): any[] {
    if (!this.isLeafletLoaded() || !map) return [];

    const layers: any[] = [];

    // Check if L.heatLayer is available from leaflet-heat plugin
    if (typeof L.heatLayer === 'function') {
      const data = heatPoints.map(p => [p.lat, p.lng, p.weight]);
      const heat = L.heatLayer(data, {
        radius: 35,
        blur: 25,
        maxZoom: 18,
        gradient: {
          0.2: '#2563EB',
          0.4: '#10B981',
          0.6: '#F89318',
          0.8: '#F97316',
          1.0: '#EF4444'
        }
      }).addTo(map);
      layers.push(heat);
    } else {
      // Graceful fallback: render graduated intensity circles
      for (const p of heatPoints) {
        const radius = 25 + p.weight * 25;
        const color =
          p.weight > 0.75
            ? '#DC2626'
            : p.weight > 0.45
            ? '#F59E0B'
            : '#2563EB';

        const circle = L.circle([p.lat, p.lng], {
          radius: radius,
          color: color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.2 + p.weight * 0.35
        }).addTo(map);

        circle.bindTooltip(
          `<strong>${p.locationName}</strong><br/>Waiting: ${p.waitingCount} student(s)`,
          { permanent: false, direction: 'top' }
        );

        layers.push(circle);
      }
    }

    return layers;
  }

  /**
   * Safely clears an array of Leaflet layers from the map
   */
  public clearLayers(map: any, layers: any[]): void {
    if (!map || !layers) return;
    for (const layer of layers) {
      if (layer && typeof layer.remove === 'function') {
        layer.remove();
      } else if (map.hasLayer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }
}

