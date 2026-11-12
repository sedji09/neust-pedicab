# NEUST BikeGo
## Mobile Application Technology — Final Case Study Documentation

---

### Cover Page Information (For Separate Cover Page)
* **Project Title:** NEUST BikeGo: Campus Bicycle Ride-Hailing & Shuttle Booking Application
* **Course:** Mobile Application Technology
* **Group Members:**
  1. `[Member 1 Full Name]`
  2. `[Member 2 Full Name]`
  3. `[Member 3 Full Name]`
  4. `[Member 4 Full Name]`
* **Project Files / Repository Link:** `[Insert Google Drive Folder or GitHub Repository Link Here]`

---

## 1. Project Information
* **Project Title:** NEUST BikeGo
* **Target Platform:** Android (APK via Capacitor) and Web Browser
* **Tech Stack:** Ionic 9, Angular 22, Capacitor 8, Leaflet.js, and PHP/MySQL (XAMPP) with `localStorage` fallback
* **Group Members:** `[Member 1]`, `[Member 2]`, `[Member 3]`, `[Member 4]`

---

## 2. Problem and Proposed Solution

### Problem Statement
Inside a large university campus like NEUST, students frequently need to travel between distant academic buildings, gates, and facilities. Walking under extreme heat or rain, or during tight class schedules, causes delays and fatigue. Meanwhile, campus bicycle/e-bike drivers lack a centralized system to locate waiting passengers, resulting in unorganized queues, missed pickups, and inefficient campus routes.

### Intended Users
1. **NEUST Students (Passengers):** Students who need a quick, convenient, and affordable way to book a campus ride from their current location to a campus destination.
2. **Campus Bike Drivers:** Drivers who need a simple interface to view incoming ride requests, locate passengers on the campus map, and manage active trips.

### Proposed Solution
**NEUST BikeGo** is a focused, small-scale mobile application prototype that connects students and campus bike drivers. Students can detect their real-time GPS location on an interactive campus map, choose pickup and drop-off points, and submit a ride request. Drivers can view incoming requests, accept bookings, and mark trips as completed. The system supports both a local XAMPP PHP/MySQL backend and an automatic `localStorage` fallback so the prototype remains testable even without an active server connection.

---

## 3. Application Features

1. **User Authentication & Role Routing (`LandingPageComponent` & `AuthModalComponent`)**
   * Users can sign up or log in as a **Student** or **Driver**.
   * Upon login, the app automatically routes the user to their respective dashboard.
2. **Interactive Campus Map & GPS Detection (`CampusMapComponent` & `StudentDashboardComponent`)**
   * Displays NEUST campus landmarks, designated pickup zones, and custom pins using **Leaflet**.
   * Students can tap the GPS button to detect their current coordinates and verify if they are within the campus boundary, or manually adjust the pin if needed.
3. **Ride Booking Flow (`StudentDashboardComponent`)**
   * Students select a pickup point and destination, review the estimated fare, and submit a booking request.
   * The app provides immediate system feedback via status updates, notifications, and haptic feedback.
4. **Driver Trip Management (`DriverDashboardComponent`)**
   * Drivers view incoming pending ride requests, accept a booking, see the passenger's pickup location on the map, and mark the trip as completed upon drop-off.
5. **User Profile (`ProfilePageComponent`)**
   * Displays the user's account details, assigned role, and basic profile settings.

---

## 4. Technical Implementation

### Relevant Capacitor & Device Capabilities
* **Geolocation (`@capacitor/geolocation`):** Implemented in `src/app/core/services/campus-geolocation.service.ts` (`CampusGeolocationService`). The app requests runtime location permissions (`Geolocation.requestPermissions()`) and retrieves high-accuracy GPS coordinates (`Geolocation.getCurrentPosition({ enableHighAccuracy: true })`). It also includes a browser `navigator.geolocation` fallback and evaluates GPS accuracy (high, medium, low) to warn users when indoor signal is weak.
* **Haptics & Local Notifications (`@capacitor/haptics`, `@capacitor/local-notifications`):** Used to provide tactile and notification feedback during key user interactions such as booking updates.

### Data Handling & API Operations
* **HTTP API Operations (`HttpClient`):** Implemented in `src/app/core/services/api.service.ts` (`ApiService`). The app communicates with a XAMPP PHP/MySQL backend using:
  * **POST** requests (`register.php`, `login.php`, `create_booking.php`) to register users, authenticate accounts, and create ride bookings.
  * **GET** requests (`get_users.php`, `get_booking_status.php`) to fetch user records and check booking status updates.
* **Resilient Fallback (`localStorage` & RxJS `BehaviorSubject`):** All `HttpClient` calls use RxJS `catchError` so that if the XAMPP server is unreachable (e.g., offline testing on an Android APK), the app gracefully falls back to local state management in `StateService` (`src/app/core/services/state.service.ts`) backed by `localStorage`.

### Important Implementation Choices
* **Configurable API Base URL:** `ApiService` automatically switches between `http://localhost/neust-bike-api` (for browser testing) and a configurable local network IPv4 address (for Android APK testing over Wi-Fi) via `Capacitor.isNativePlatform()`.
* **Focused Scope:** Instead of building a heavy real-time WebSocket infrastructure, the prototype uses reactive RxJS `BehaviorSubject` streams and lightweight HTTP endpoints tailored for a two-week academic case study.

---

## 5. Testing and Evaluation

### Basic Test Results
| Feature / Task Tested | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **User Login & Registration** | User authenticates and routes to Student or Driver dashboard. | Login/signup succeeded; automatically falls back to local storage when XAMPP is offline. | **Pass** |
| **GPS Location Detection** | App requests permission, reads GPS coordinates, and pins location on Leaflet map. | Coordinates detected on device/browser; displays accuracy warning if signal is >15m–35m. | **Pass** |
| **Student Ride Booking** | Selecting pickup/drop-off and submitting creates a pending booking with feedback. | Booking created, status updated, and user feedback displayed. | **Pass** |
| **Driver Accept & Complete Trip** | Driver sees pending request, accepts it, and marks trip as completed. | Booking status transitioned from pending to accepted and completed. | **Pass** |
| **XAMPP Cross-Device Sync** | Android APK connects to PC XAMPP server over local Wi-Fi. | Works when PC IPv4 matches `ApiService` config; falls back to local mode when IP changes or offline. | **Needs Improvement** |

### Observed Issues & Limitations
1. **Local Server Dependency:** When running the Android APK on a separate device, the XAMPP backend requires the phone and PC to be on the same Wi-Fi network with the correct local IPv4 address configured.
2. **Indoor GPS Accuracy:** GPS accuracy degrades indoors, which can slightly offset the initial pickup pin.

### Recommended Improvements
1. **Cloud-Hosted Backend:** Deploy the PHP/MySQL API (or migrate to a cloud backend) so students and drivers can sync bookings over mobile data without relying on a local Wi-Fi IP address.
2. **Real-Time Updates:** Replace polling/manual refresh with WebSockets or real-time listeners for instant driver-passenger status synchronization.

---

## 6. AI Usage Disclosure
* **AI Tools Used:** `[Insert AI tool(s) used, e.g., Antigravity / ChatGPT / Gemini]`
* **How AI Assisted Development:** AI coding assistants were used to help scaffold Ionic/Angular UI components, troubleshoot Capacitor plugin and TypeScript configurations, and organize the project documentation.
* **Group Review, Testing, and Modifications:** All AI-generated suggestions and code snippets were carefully reviewed by the group, adapted to match our NEUST campus data and XAMPP API endpoints, and tested on both browser and Android devices to verify correctness and usability.

---

## References
* Ionic Framework Documentation — https://ionicframework.com/docs
* Angular Documentation — https://angular.dev
* Capacitor Documentation (Geolocation, Haptics, Local Notifications) — https://capacitorjs.com/docs
* Leaflet.js Documentation — https://leafletjs.com

