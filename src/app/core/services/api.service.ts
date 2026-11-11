import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User, RegisterUserDto, BookingRequest, BookingStatus } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Configurable base URL:
  // - In browser: http://localhost/neust-bike-api
  // - In Android APK via WiFi: http://192.168.x.x/neust-bike-api (Replace with PC's IPv4 address)
  private readonly DEFAULT_API_URL = 'http://localhost/neust-bike-api';
  private readonly URL_STORAGE_KEY = 'neust_bikego_api_base_url';

  constructor(private http: HttpClient) {}

  public getApiBaseUrl(): string {
    return localStorage.getItem(this.URL_STORAGE_KEY) || this.DEFAULT_API_URL;
  }

  public setApiBaseUrl(url: string): void {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(this.URL_STORAGE_KEY, cleanUrl);
  }

  /**
   * Sends user registration to XAMPP PHP MySQL backend
   */
  public registerToXampp(dto: RegisterUserDto): Observable<{ success: boolean; message: string; user?: User }> {
    const url = `${this.getApiBaseUrl()}/register.php`;
    return this.http.post<{ success: boolean; message: string; user?: User }>(url, dto).pipe(
      catchError(err => {
        console.warn('XAMPP server unreachable, falling back to local database:', err);
        return of({
          success: false,
          message: 'Could not connect to XAMPP Apache/MySQL server. Using local database.'
        });
      })
    );
  }

  /**
   * Sends sign-in credentials to XAMPP PHP MySQL backend
   */
  public loginToXampp(identifier: string, password: string): Observable<{ success: boolean; message: string; user?: User }> {
    const url = `${this.getApiBaseUrl()}/login.php`;
    return this.http.post<{ success: boolean; message: string; user?: User }>(url, { identifier, password }).pipe(
      catchError(err => {
        console.warn('XAMPP server unreachable, falling back to local database:', err);
        return of({
          success: false,
          message: 'Could not connect to XAMPP Apache/MySQL server. Using local database.'
        });
      })
    );
  }

  /**
   * Fetches all registered users from XAMPP MySQL database
   */
  public getUsersFromXampp(): Observable<{ success: boolean; users?: User[]; message?: string }> {
    const url = `${this.getApiBaseUrl()}/get_users.php`;
    return this.http.get<{ success: boolean; users?: User[]; message?: string }>(url).pipe(
      catchError(err => of({ success: false, users: [] }))
    );
  }

  // --- JoyRide-Style Booking APIs ---

  public createBookingXampp(payload: Partial<BookingRequest>): Observable<{ success: boolean; message: string; booking?: BookingRequest }> {
    const url = `${this.getApiBaseUrl()}/create_booking.php`;
    return this.http.post<{ success: boolean; message: string; booking?: BookingRequest }>(url, payload).pipe(
      catchError(err => of({ success: false, message: 'XAMPP backend offline' }))
    );
  }

  public getBookingStatusXampp(bookingId: string): Observable<{ success: boolean; booking?: BookingRequest }> {
    const url = `${this.getApiBaseUrl()}/get_booking_status.php?id=${encodeURIComponent(bookingId)}`;
    return this.http.get<{ success: boolean; booking?: BookingRequest }>(url).pipe(
      catchError(err => of({ success: false }))
    );
  }

  public pollDriverRequestsXampp(driverId: string): Observable<{ success: boolean; hasRequest?: boolean; booking?: BookingRequest }> {
    const url = `${this.getApiBaseUrl()}/driver_poll_requests.php?driverId=${encodeURIComponent(driverId)}`;
    return this.http.get<{ success: boolean; hasRequest?: boolean; booking?: BookingRequest }>(url).pipe(
      catchError(err => of({ success: false }))
    );
  }

  public respondBookingXampp(
    bookingId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
    bikeNumber: string,
    action: 'accept' | 'reject'
  ): Observable<{ success: boolean; message: string; status?: string }> {
    const url = `${this.getApiBaseUrl()}/driver_respond_booking.php`;
    return this.http.post<{ success: boolean; message: string; status?: string }>(url, {
      bookingId,
      driverId,
      driverName,
      driverPhone,
      bikeNumber,
      action
    }).pipe(
      catchError(err => of({ success: false, message: 'Network error or backend unreachable' }))
    );
  }

  public updateTripStatusXampp(bookingId: string, status: BookingStatus): Observable<{ success: boolean; message: string; status?: BookingStatus }> {
    const url = `${this.getApiBaseUrl()}/update_trip_status.php`;
    return this.http.post<{ success: boolean; message: string; status?: BookingStatus }>(url, {
      bookingId,
      status
    }).pipe(
      catchError(err => of({ success: false, message: 'Network error or backend unreachable' }))
    );
  }

  public cancelBookingXampp(bookingId: string, reason = 'Cancelled by user'): Observable<{ success: boolean; message: string }> {
    const url = `${this.getApiBaseUrl()}/cancel_booking.php`;
    return this.http.post<{ success: boolean; message: string }>(url, {
      bookingId,
      reason
    }).pipe(
      catchError(err => of({ success: false, message: 'Network error or backend unreachable' }))
    );
  }

  public updateDriverGpsXampp(payload: {
    bike_number: string;
    driver_id: string;
    lat: number;
    lng: number;
    heading?: number;
    speed_kmh?: number;
  }): Observable<{ status: string; message: string; data?: any }> {
    const url = `${this.getApiBaseUrl()}/update_driver_gps.php`;
    return this.http.post<{ status: string; message: string; data?: any }>(url, payload).pipe(
      catchError(err => of({ status: 'error', message: 'Backend GPS update skipped (offline mode)' }))
    );
  }

  public getLiveTrackingXampp(bookingId: string, studentUid?: string): Observable<any> {
    const url = `${this.getApiBaseUrl()}/get_live_tracking.php?booking_id=${encodeURIComponent(bookingId)}&student_uid=${encodeURIComponent(studentUid || '')}`;
    return this.http.get<any>(url).pipe(
      catchError(err => of({ status: 'error', message: 'Tracking unreachable' }))
    );
  }
}

