import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export interface InAppToast {
  id: string;
  title: string;
  message: string;
  type: 'trip' | 'queue' | 'system' | 'safety' | 'driver';
  subtype?: 'arrival' | 'accepted' | 'completed' | 'request' | 'general';
  timestamp: Date;
  actionText?: string;
  actionCallback?: () => void;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private inAppToastSubject = new BehaviorSubject<InAppToast | null>(null);
  public inAppToast$: Observable<InAppToast | null> = this.inAppToastSubject.asObservable();

  private toastTimeout: any = null;
  private notificationCounter = 100;
  private sharedAudioCtx: AudioContext | null = null;

  constructor(private ngZone: NgZone) {
    this.initPermissions();
    this.initAudioUnlockListener();
  }

  /**
   * Unlocks Web Audio API on first user gesture (touch or click)
   */
  private initAudioUnlockListener(): void {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.getAudioContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.sharedAudioCtx) {
        this.sharedAudioCtx = new AudioCtx();
      }
      if (this.sharedAudioCtx.state === 'suspended') {
        this.sharedAudioCtx.resume();
      }
      return this.sharedAudioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Initializes notification permissions for native mobile and browser
   */
  public async initPermissions(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const check = await LocalNotifications.checkPermissions();
        if (check.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          // Will request on first user interaction or first notification
        }
      }
    } catch (err) {
      console.warn('Notification permission check failed:', err);
    }
  }

  /**
   * Triggers a comprehensive multi-channel notification:
   * 1. Real phone push/system notification via Capacitor LocalNotifications
   * 2. Modern In-App Dynamic Island / Floating Heads-Up Banner with smooth spring animation
   * 3. Haptic vibration effect on mobile device
   * 4. Pleasant modern chime sound via Web Audio API
   */
  public async notify(
    title: string,
    message: string,
    type: 'trip' | 'queue' | 'system' | 'safety' | 'driver' = 'system',
    actionText?: string,
    actionCallback?: () => void,
    subtype?: 'arrival' | 'accepted' | 'completed' | 'request' | 'general'
  ): Promise<void> {
    // Detect subtype from title/message if not explicitly given
    const st = subtype || this.inferSubtype(title, message, type);

    // 1. Play chime sound tailored to notification event
    this.playNotificationSound(st);

    // 2. Trigger mobile haptic feedback pattern
    this.triggerHapticFeedback(st);

    // 3. Show modern in-app floating banner
    this.showInAppToast(title, message, type, actionText, actionCallback, st);

    // 4. Send real phone system notification (status bar / lock screen)
    await this.sendPhoneSystemNotification(title, message, type);
  }

  private inferSubtype(title: string, message: string, type: string): 'arrival' | 'accepted' | 'completed' | 'request' | 'general' {
    const text = (title + ' ' + message).toLowerCase();
    if (text.includes('arrived') || text.includes('nandiyan') || text.includes('nandito') || text.includes('sakayan')) {
      return 'arrival';
    }
    if (text.includes('accepted') || text.includes('tinanggap')) {
      return 'accepted';
    }
    if (text.includes('dropped off') || text.includes('naihatid') || text.includes('completed') || text.includes('nakarating')) {
      return 'completed';
    }
    if (text.includes('new ride request') || text.includes('bagong ride') || type === 'driver') {
      return 'request';
    }
    return 'general';
  }

  /**
   * Shows the modern floating In-App Toast banner
   */
  public showInAppToast(
    title: string,
    message: string,
    type: 'trip' | 'queue' | 'system' | 'safety' | 'driver' = 'system',
    actionText?: string,
    actionCallback?: () => void,
    subtype?: 'arrival' | 'accepted' | 'completed' | 'request' | 'general'
  ): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    const toast: InAppToast = {
      id: 'toast-' + Date.now(),
      title,
      message,
      type,
      subtype,
      timestamp: new Date(),
      actionText,
      actionCallback
    };

    this.ngZone.run(() => {
      this.inAppToastSubject.next(toast);
    });

    // Auto-dismiss after 5 seconds
    this.toastTimeout = setTimeout(() => {
      this.dismissToast();
    }, 5000);
  }

  /**
   * Dismisses current in-app toast
   */
  public dismissToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.ngZone.run(() => {
      this.inAppToastSubject.next(null);
    });
  }

  /**
   * Sends actual system notification to the mobile phone (or browser fallback)
   */
  private async sendPhoneSystemNotification(
    title: string,
    message: string,
    type: string
  ): Promise<void> {
    const notifId = ++this.notificationCounter;

    try {
      if (Capacitor.isNativePlatform()) {
        const perms = await LocalNotifications.checkPermissions();
        if (perms.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== 'granted') return;
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: title,
              body: message,
              schedule: { at: new Date(Date.now() + 100) },
              sound: 'beep.wav',
              actionTypeId: '',
              extra: { type }
            }
          ]
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: 'assets/images/BikeGO_logo.png'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, {
                body: message,
                icon: 'assets/images/BikeGO_logo.png'
              });
            }
          });
        }
      }
    } catch (err) {
      console.warn('Could not post system notification:', err);
    }
  }

  /**
   * Modern acoustic chime synthesis using Web Audio API
   */
  public playNotificationSound(subtype: 'arrival' | 'accepted' | 'completed' | 'request' | 'general' = 'general'): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (subtype === 'arrival') {
        // Distinct 4-tone joyful ascending arrival chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.11;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } else if (subtype === 'accepted') {
        // High harmonic 2-tone chime: F5 (698Hz) -> A5 (880Hz)
        const notes = [698.46, 880.00];
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.12;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.38);
        });
      } else if (subtype === 'completed') {
        // Triumphant 3-tone major triad: G5 (784Hz) -> B5 (987Hz) -> D6 (1174Hz)
        const notes = [783.99, 987.77, 1174.66];
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.10;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.26, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.40);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.42);
        });
      } else if (subtype === 'request') {
        // Driver incoming ring tone: D5 (587Hz) -> A5 (880Hz) -> D5 -> A5
        const notes = [587.33, 880.00, 587.33, 880.00];
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.09;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.25);
        });
      } else {
        // Standard pleasant 2-tone notification chime: E5 (659Hz) -> A5 (880Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.20, now + 0.03);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        gain2.gain.setValueAtTime(0, now + 0.12);
        gain2.gain.linearRampToValueAtTime(0.24, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.58);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Real phone haptic vibration feedback
   */
  public async triggerHapticFeedback(subtype: 'arrival' | 'accepted' | 'completed' | 'request' | 'general' = 'general'): Promise<void> {
    try {
      // 1. HTML5 Vibration API (Android Chrome, Firefox, Progressive Web App)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (subtype === 'arrival') {
          // Strong double pulse + firm buzz: 250ms on, 100ms off, 250ms on, 100ms off, 400ms on
          navigator.vibrate([250, 100, 250, 100, 400]);
        } else if (subtype === 'accepted') {
          navigator.vibrate([180, 80, 180]);
        } else if (subtype === 'completed') {
          navigator.vibrate([150, 60, 150]);
        } else if (subtype === 'request') {
          navigator.vibrate([200, 100, 200, 100, 200]);
        } else {
          navigator.vibrate([100, 50, 100]);
        }
      }

      // 2. Capacitor Native Mobile Haptics
      if (Capacitor.isNativePlatform()) {
        if (subtype === 'arrival') {
          // Strong noticeable vibration motor for driver arrival
          await Haptics.vibrate({ duration: 600 });
        } else if (subtype === 'request') {
          // Alert vibration for incoming ride booking
          await Haptics.vibrate({ duration: 450 });
        } else if (subtype === 'completed') {
          await Haptics.notification({ type: NotificationType.Success });
        } else if (subtype === 'accepted') {
          await Haptics.notification({ type: NotificationType.Success });
        } else {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }
      }
    } catch {
      // Haptics unavailable
    }
  }

  /**
   * Quick tactile tap feel for button clicks
   */
  public async triggerTapHaptic(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
    } catch {
      // Ignore
    }
  }
}


