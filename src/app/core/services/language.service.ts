import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SupportedLanguage = 'en' | 'fil';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'neust_bikego_language';

  // Default is 'en' as requested by the user
  private currentLanguageSubject = new BehaviorSubject<SupportedLanguage>('en');
  public currentLanguage$: Observable<SupportedLanguage> = this.currentLanguageSubject.asObservable();

  private dictionary: Record<SupportedLanguage, Record<string, string>> = {
    en: {
      // Common & App
      'app.title': 'NEUST BikeGo',
      'app.tagline': 'Campus Pedicab Transportation',
      'app.welcome': 'Welcome back,',
      'app.role_student': 'NEUST STUDENT',
      'app.role_driver': 'CAMPUS DRIVER',
      'app.role_admin': 'CAMPUS ADMIN',
      'app.student_passenger': 'Student Passenger',

      // Navigation Tabs
      'nav.home': 'Home',
      'nav.map': 'Live Map',
      'nav.queue': 'Book / Queue',
      'nav.history': 'History',
      'nav.profile': 'Profile & Settings',
      'nav.messages': 'Messages',

      // Chat & Rider Messaging
      'chat.title': 'Driver Messages',
      'chat.driver_online': 'Active Pedicab Driver',
      'chat.placeholder': 'Type a message to your rider...',
      'chat.send': 'Send',
      'chat.quick_1': 'I am at the pickup point',
      'chat.quick_2': 'Where are you now, Kuya?',
      'chat.quick_3': 'Heading out now',
      'chat.quick_4': 'Thank you!',
      'chat.no_active': 'No Active Ride Conversation',
      'chat.no_active_sub': 'When a pedicab accepts your booking, a direct message channel will open here.',
      'chat.book_btn': 'Book a Pedicab',

      // Home Tab
      'home.available_pedicabs': 'Available Pedicabs',
      'home.available_sub': 'Campus trike shuttle fleet ready for passengers',
      'home.ready_count': '{count} Ready',
      'home.seats_left': '{count} / {max} Seats Left',
      'home.driver': 'Driver:',
      'home.ride_btn': 'Ride',
      'home.empty_pedicabs': 'All pedicabs are currently on campus trips. Please check back in a few minutes.',
      'home.campus_notices': 'Campus Notices & Announcements',
      'home.notices_sub': 'Transit operations, fare updates & campus reminders',
      'home.active_ticket_banner': 'Active Ride Ticket #{num}',
      'home.view': 'View',
      'home.track_ride_btn': 'View Live Ride & Tracking',
      'home.quick_book_tag': 'Campus Transit',
      'home.quick_book_title': 'Book a Campus Pedicab',
      'home.quick_book_sub': 'Safe and fast point-to-point shuttle inside NEUST Sumacab',
      'home.where_to_placeholder': 'Where to? (e.g. CICT, Gym, Library)',
      'home.active_booking_title': 'Your Active Booking',

      // Booking / Queue Step 1: Route
      'book.title': 'Book a Pedicab',
      'book.subtitle': 'Select your pickup point and destination inside NEUST Sumacab.',
      'book.step1': 'Select Route',
      'book.pickup_label': 'PICKUP POINT',
      'book.pickup_default': 'NEUST Sumacab Grounds',
      'book.pickup_search': 'Search',
      'book.pickup_pin': 'Pin Map',
      'book.dest_label': 'DESTINATION',
      'book.dest_search': 'Search',
      'book.pickup_warning': 'Your pickup pin is outside the NEUST campus boundary. Please drag it inside the campus before booking.',

      // Booking Step 2: Passenger Count
      'book.step2': 'Number of Passengers',
      'book.passenger': 'Passenger',
      'book.passengers': 'Passengers',
      'book.pax_solo': 'Solo Passenger',
      'book.pax_2': '2 Passengers',
      'book.pax_3': '3 Passengers',
      'book.pax_4': '4 Passengers (Full)',
      'book.pax_solo_chip': '1 Solo',
      'book.pax_2_chip': '2 Pax',
      'book.pax_3_chip': '3 Pax',
      'book.pax_4_chip': '4 Max',
      'book.capacity_note': 'Capacity: Maximum of 4 passengers per pedicab.',

      // Booking Step 3: Pedicab
      'book.step3': 'Assigned Pedicab',
      'book.nearest_badge': 'Nearest',
      'book.no_pedicabs': 'No Pedicabs Available',
      'book.no_pedicabs_sub': 'All campus pedicabs are currently on trips or offline.',
      'book.wait_shuttle': 'Wait for Next Shuttle',

      // Booking Step 4: Trip Notes
      'book.step4': 'Trip Notes (Optional)',
      'book.notes_placeholder': 'e.g. In front of CICT lobby, carrying heavy project materials...',
      'book.entry_fare': 'Fare: ₱{fare}.00 per passenger (₱10 standard fare)',
      'book.popular_locations': 'Popular Campus Locations',
      'book.choose_pickup': 'Choose This Pickup',
      'book.pickup_placeholder': 'Add pickup details (e.g. near the gate or waiting shed)',
      'book.available': 'available',
      'book.seater_1': '1 Seater (Solo Passenger)',
      'book.seater_1_sub': '1 seat reserved • Express campus trip',
      'book.seater_2': '2 Seater (Pair / Classmates)',
      'book.seater_2_sub': '2 seats reserved • Ride with a partner',
      'book.seater_3': '3 Seater (Group)',
      'book.seater_3_sub': '3 seats reserved • Good for project teams',
      'book.seater_4': '4 Seater (Full Pedicab)',
      'book.seater_4_sub': '4 seats (Maximum legal capacity per pedicab)',
      'book.cash_label': 'Cash',
      'book.per_head': '/ head',
      'book.campus_pedicab': 'Campus Pedicab',

      // Sticky Bottom Confirm Bar
      'bar.going_to': 'GOING TO:',
      'bar.distance': '{dist}m',
      'bar.est_time': '~{min} min',
      'bar.free_ride': 'Campus Pedicab Fare (Cash)',
      'bar.book_btn': 'Book Pedicab',
      'bar.requesting': 'Requesting...',
      'bar.select_valid': 'Select Valid Campus Route',

      // Active Booking / Live Tracking States
      'tracking.searching_title': 'Looking for a Driver...',
      'tracking.searching_sub': 'Connecting you to the nearest available campus pedicab.',
      'tracking.cancel_booking': 'Cancel Booking',
      'tracking.cancel_request': 'Cancel Request',
      'tracking.distance': 'Distance',
      'tracking.duration': 'Duration',
      'tracking.fare': 'Fare',
      'tracking.no_driver_title': 'No Driver Available',
      'tracking.no_driver_sub': 'All campus drivers are currently on active trips. You may try again in a few moments.',
      'tracking.retry': 'Try Again',
      'tracking.cancel': 'Cancel',
      'tracking.accepted_banner': 'Driver Accepted Your Ride!',
      'tracking.heading_banner': 'Driver is heading to your pickup point...',
      'tracking.arrived_banner': 'Pedicab arrived at pickup point!',
      'tracking.in_progress_banner': 'Trip in progress to destination',
      'tracking.driver_heading': 'Driver is heading to pickup point • ~{dist}m away (~{min} min)',
      'tracking.driver_arrived': 'Pedicab has arrived at your pickup point! Please board now.',
      'tracking.in_transit': 'In transit to {dest} (~{dist}m)',
      'tracking.verified_driver': 'Verified Campus Transportation Driver',
      'tracking.call_driver': 'Call Driver',
      'tracking.cancel_trip': 'Cancel Ride',
      'tracking.drop_off': 'DROP-OFF',
      'tracking.pick_up': 'PICKUP POINT',

      // Profile & Settings
      'profile.title': 'Profile & Settings',
      'profile.guest_title': 'Welcome to NEUST BikeGo',
      'profile.guest_sub': 'Create an account or sign in to book campus rides, track pedicabs in real-time, and manage your digital shuttle pass.',
      'profile.create_account': 'Create Student / Driver Account',
      'profile.sign_in': 'Sign In to Existing Account',
      'profile.demo_shortcut': 'Demo Shortcut:',
      'profile.stats_rides': 'Campus Rides',
      'profile.stats_pass': 'Digital Pass',
      'profile.edit_profile': 'Edit Profile Information',
      'profile.edit_profile_sub': 'Update phone and personal details',
      'profile.change_password': 'Change Password',
      'profile.change_password_sub': 'Update security credentials',
      'profile.switch_account': 'Switch / Create Account',
      'profile.switch_account_sub': 'Sign in with another ID or role',
      'profile.logout': 'Log Out',
      'profile.logout_sub': 'Sign out of this session',

      // Language Switcher Section
      'settings.language_title': 'App Language / Wika',
      'settings.language_sub': 'Choose your preferred language for the application',
      'settings.lang_en': 'English (Default)',
      'settings.lang_fil': 'Filipino (Tagalog)',
      'settings.lang_changed_toast': 'Language changed to English'
    },
    fil: {
      // Common & App
      'app.title': 'NEUST BikeGo',
      'app.tagline': 'Transportasyong Pedicab sa Campus',
      'app.welcome': 'Maligayang pagbabalik,',
      'app.role_student': 'ESTUDYANTE NG NEUST',
      'app.role_driver': 'DRIVER NG CAMPUS',
      'app.role_admin': 'ADMIN NG CAMPUS',
      'app.student_passenger': 'Pasaherong Estudyante',

      // Navigation Tabs
      'nav.home': 'Tahanan',
      'nav.map': 'Mapa',
      'nav.queue': 'Pila / Booking',
      'nav.history': 'Kasaysayan',
      'nav.profile': 'Profile at Settings',
      'nav.messages': 'Mensahe',

      // Chat & Rider Messaging
      'chat.title': 'Mensahe sa Rider',
      'chat.driver_online': 'Aktibong Driver ng Pedicab',
      'chat.placeholder': 'Mag-type ng mensahe sa rider...',
      'chat.send': 'Ipadala',
      'chat.quick_1': 'Nandito na po ako sa pickup point',
      'chat.quick_2': 'Saan na po kayo banda, Kuya?',
      'chat.quick_3': 'Palabas na po ako ngayon',
      'chat.quick_4': 'Salamat po, Kuya!',
      'chat.no_active': 'Walang Aktibong Kausap na Driver',
      'chat.no_active_sub': 'Kapag may driver na tumanggap ng booking mo, magbubukas dito ang direct messaging para makapag-usap kayo.',
      'chat.book_btn': 'Mag-book ng Biyahe',

      // Home Tab
      'home.available_pedicabs': 'Mga Available na Pedicab',
      'home.available_sub': 'Mga pedicab shuttle na handang magsakay ng pasahero',
      'home.ready_count': '{count} Handa',
      'home.seats_left': '{count} / {max} Upuan Natitira',
      'home.driver': 'Driver:',
      'home.ride_btn': 'Sumakay',
      'home.empty_pedicabs': 'Lahat ng pedicab ay kasalukuyang bumibiyahe sa loob ng campus. Mangyaring sumubok muli mamaya.',
      'home.campus_notices': 'Mga Pabatid at Anunsyo sa Campus',
      'home.notices_sub': 'Operasyon ng biyahe, paalala sa pamasahe at campus',
      'home.active_ticket_banner': 'Aktibong Ticket sa Pila #{num}',
      'home.view': 'Tingnan',
      'home.track_ride_btn': 'Tingnan ang Live Biyahe at Mapa',
      'home.quick_book_tag': 'Biyaheng Campus',
      'home.quick_book_title': 'Mag-book ng Pedicab sa Campus',
      'home.quick_book_sub': 'Ligtas at mabilis na shuttle sa loob ng NEUST Sumacab',
      'home.where_to_placeholder': 'Saan ka pupunta? (hal. CICT, Gym, Library)',
      'home.active_booking_title': 'Ang Iyong Aktibong Booking',

      // Booking / Queue Step 1: Route
      'book.title': 'Mag-book ng Pedicab',
      'book.subtitle': 'Piliin ang pickup at destination mo sa loob ng NEUST Sumacab.',
      'book.step1': 'Piliin ang Ruta',
      'book.pickup_label': 'PICKUP POINT',
      'book.pickup_default': 'Bakuran ng NEUST Sumacab',
      'book.pickup_search': 'Maghanap',
      'book.pickup_pin': 'I-pin sa Mapa',
      'book.dest_label': 'DESTINASYON',
      'book.dest_search': 'Maghanap',
      'book.pickup_warning': 'Nasa labas ng NEUST campus ang pickup pin mo. I-drag ito papasok sa campus bago mag-book.',

      // Booking Step 2: Passenger Count
      'book.step2': 'Bilang ng Pasahero',
      'book.passenger': 'Pasahero',
      'book.passengers': 'Pasahero',
      'book.pax_solo': 'Solo Passenger',
      'book.pax_2': '2 Pasahero',
      'book.pax_3': '3 Pasahero',
      'book.pax_4': '4 Pasahero (Puno)',
      'book.pax_solo_chip': '1 Solo',
      'book.pax_2_chip': '2 Pasahero',
      'book.pax_3_chip': '3 Pasahero',
      'book.pax_4_chip': '4 Max',
      'book.capacity_note': 'Kapasidad: Maximum ng 4 na pasahero bawat pedicab.',

      // Booking Step 3: Pedicab
      'book.step3': 'Nakatalagang Pedicab',
      'book.nearest_badge': 'Pinakamalapit',
      'book.no_pedicabs': 'Walang Available na Pedicab',
      'book.no_pedicabs_sub': 'Lahat ng pedicab ay bumibiyahe pa o offline.',
      'book.wait_shuttle': 'Maghintay sa Susunod na Shuttle',

      // Booking Step 4: Trip Notes
      'book.step4': 'Mga Tala sa Biyahe (Opsyonal)',
      'book.notes_placeholder': 'Hal. Sa harap ng CICT lobby, may dalang mabigat na gamit...',
      'book.entry_fare': 'Pamasahe: ₱{fare}.00 kada pasahero (₱10 standard fare)',
      'book.popular_locations': 'Mga Madalas Puntahang Lokasyon sa Campus',
      'book.choose_pickup': 'Piliin ang Pickup na Ito',
      'book.pickup_placeholder': 'Magdagdag ng detalye ng pickup (hal. malapit sa gate o waiting shed)',
      'book.available': 'available',
      'book.seater_1': '1 Seater (Solo Passenger)',
      'book.seater_1_sub': '1 upuan nakalaan • Mabilisang biyahe',
      'book.seater_2': '2 Seater (Magkapareha / Kaklase)',
      'book.seater_2_sub': '2 upuan nakalaan • Sumakay kasama ang partner',
      'book.seater_3': '3 Seater (Grupo)',
      'book.seater_3_sub': '3 upuan nakalaan • Para sa pangkat o project team',
      'book.seater_4': '4 Seater (Buong Pedicab)',
      'book.seater_4_sub': '4 na upuan (Pinakamataas na legal na kapasidad)',
      'book.cash_label': 'Cash',
      'book.per_head': '/ bawat isa',
      'book.campus_pedicab': 'Pedicab sa Campus',

      // Sticky Bottom Confirm Bar
      'bar.going_to': 'PAPUNTA SA:',
      'bar.distance': '{dist}m',
      'bar.est_time': '~{min} min',
      'bar.free_ride': 'Pamasahe sa Campus (Cash)',
      'bar.book_btn': 'Mag-book ng Pedicab',
      'bar.requesting': 'Nagbu-book...',
      'bar.select_valid': 'Pumili ng Tamang Ruta sa Campus',

      // Active Booking / Live Tracking States
      'tracking.searching_title': 'Naghahanap ng Driver...',
      'tracking.searching_sub': 'Kinokonekta ka sa pinakamalapit na available na pedicab sa campus.',
      'tracking.cancel_booking': 'Kanselahin ang Booking',
      'tracking.cancel_request': 'Kanselahin ang Request',
      'tracking.distance': 'Distansya',
      'tracking.duration': 'Tagal',
      'tracking.fare': 'Pamasahe',
      'tracking.no_driver_title': 'Walang Available na Driver',
      'tracking.no_driver_sub': 'Kasalukuyang may mga biyahe ang lahat ng mga driver sa campus. Maaari kang sumubok muli o magpalit ng oras.',
      'tracking.retry': 'Subukan Muli',
      'tracking.cancel': 'Kanselahin',
      'tracking.accepted_banner': 'Tinanggap ng Driver ang Booking!',
      'tracking.heading_banner': 'Papunta na ang Driver sa Pickup Point...',
      'tracking.arrived_banner': 'Nandito na ang Driver sa Pickup Point!',
      'tracking.in_progress_banner': 'Kasalukuyang Bumabyahe Patungong Destinasyon',
      'tracking.driver_heading': 'Papunta na ang rider • ~{dist}m layo (~{min} min)',
      'tracking.driver_arrived': 'Nandito na ang pedicab sa pickup point! Sakay na.',
      'tracking.in_transit': 'Bumabyahe na patungong {dest} (~{dist}m)',
      'tracking.verified_driver': 'Rehistradong Driver ng NEUST',
      'tracking.call_driver': 'Tawagan ang Driver',
      'tracking.cancel_trip': 'Kanselahin ang Ride',
      'tracking.drop_off': 'BABAAN',
      'tracking.pick_up': 'SAKAYAN',

      // Profile & Settings
      'profile.title': 'Profile at Settings',
      'profile.guest_title': 'Maligayang pagdating sa NEUST BikeGo',
      'profile.guest_sub': 'Gumawa ng account o mag-sign in para makapag-book ng rides, ma-track ang pedicabs, at magamit ang digital shuttle pass.',
      'profile.create_account': 'Gumawa ng Account (Estudyante / Driver)',
      'profile.sign_in': 'Mag-sign In sa Dating Account',
      'profile.demo_shortcut': 'Shortcut para sa Demo:',
      'profile.stats_rides': 'Biyahe sa Campus',
      'profile.stats_pass': 'Digital Pass',
      'profile.edit_profile': 'I-edit ang Impormasyon',
      'profile.edit_profile_sub': 'Palitan ang cellphone number at personal na detalye',
      'profile.change_password': 'Magpalit ng Password',
      'profile.change_password_sub': 'I-update ang credentials sa seguridad',
      'profile.switch_account': 'Lumipat / Gumawa ng Account',
      'profile.switch_account_sub': 'Mag-sign in gamit ang ibang ID o role',
      'profile.logout': 'Mag-log Out',
      'profile.logout_sub': 'Umalis sa session na ito',

      // Language Switcher Section
      'settings.language_title': 'Wika ng App / Language',
      'settings.language_sub': 'Piliin ang nais mong wika para sa buong application',
      'settings.lang_en': 'English (Default)',
      'settings.lang_fil': 'Filipino (Tagalog)',
      'settings.lang_changed_toast': 'Pinalitan ang wika sa Filipino'
    }
  };

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as SupportedLanguage;
      if (saved && (saved === 'en' || saved === 'fil')) {
        this.currentLanguageSubject.next(saved);
      } else {
        // Default to English as explicitly requested
        this.currentLanguageSubject.next('en');
        localStorage.setItem(this.STORAGE_KEY, 'en');
      }
    } catch (e) {
      this.currentLanguageSubject.next('en');
    }
  }

  public get currentLanguage(): SupportedLanguage {
    return this.currentLanguageSubject.value;
  }

  public setLanguage(lang: SupportedLanguage): void {
    if (lang !== 'en' && lang !== 'fil') return;
    this.currentLanguageSubject.next(lang);
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language preference', e);
    }
  }

  /**
   * Translate key with optional string parameter replacements
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLanguageSubject.value;
    let translation = this.dictionary[lang]?.[key] || this.dictionary['en']?.[key] || key;

    if (params) {
      for (const pKey of Object.keys(params)) {
        translation = translation.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(params[pKey]));
      }
    }

    return translation;
  }
}

