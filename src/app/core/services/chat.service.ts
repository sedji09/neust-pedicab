import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatMessage, BookingRequest } from '../models/models';
import { NotificationService } from './notification.service';
import { LanguageService } from './language.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly STORAGE_KEY = 'neust_bikego_chat_messages';

  private defaultMessages: ChatMessage[] = [];

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  constructor(
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private apiService: ApiService
  ) {
    this.initMessages();

    // Real-time cross-tab synchronization so Passenger and Driver tabs see each other's real messages immediately
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', event => {
        if (event.key === this.STORAGE_KEY) {
          this.syncMessagesFromStorage();
        }
      });
    }
  }

  public syncMessagesFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed = parsed.filter((m: ChatMessage) => m.id !== 'msg-prev-1' && m.id !== 'msg-prev-2');
          if (JSON.stringify(parsed) !== JSON.stringify(this.messagesSubject.value)) {
            this.messagesSubject.next(parsed);
            this.recalcUnread(parsed);
          }
        }
      }
    } catch (e) {
      // Ignore storage parse error
    }
  }

  private initMessages(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy dummy mock messages
          parsed = parsed.filter((m: ChatMessage) => m.id !== 'msg-prev-1' && m.id !== 'msg-prev-2');
          this.messagesSubject.next(parsed);
          this.recalcUnread(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat messages from storage', e);
    }
    this.messagesSubject.next([]);
    this.recalcUnread([]);
  }

  private persistMessages(list: ChatMessage[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save chat messages to storage', e);
    }
    this.messagesSubject.next(list);
    this.recalcUnread(list);
  }

  private recalcUnread(list: ChatMessage[]): void {
    const unread = list.filter(m => m.senderRole === 'driver' && !m.isRead).length;
    this.unreadCountSubject.next(unread);
  }

  public get currentMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  public syncRemoteMessages(
    remoteMessages: any[],
    bookingNumber?: string,
    localBookingId?: string,
    myRole?: 'student' | 'driver'
  ): void {
    if (!remoteMessages || !Array.isArray(remoteMessages)) return;
    this.syncMessagesFromStorage();
    const current = [...this.currentMessages];
    let hasNew = false;
    for (const rm of remoteMessages) {
      const existingIdx = current.findIndex(m =>
        m.id === rm.id ||
        (m.message === rm.message && m.senderRole === rm.senderRole)
      );
      if (existingIdx === -1) {
        const msgObj: ChatMessage = {
          id: rm.id,
          bookingId: localBookingId || rm.bookingId,
          bookingNumber: rm.bookingNumber || bookingNumber,
          senderId: rm.senderId,
          senderName: rm.senderName,
          senderRole: rm.senderRole,
          receiverId: '',
          receiverName: '',
          message: rm.message,
          timestamp: rm.timestamp,
          isRead: false
        };
        current.push(msgObj);
        hasNew = true;

        // Notify user if message came from the other side
        if (myRole && rm.senderRole && rm.senderRole !== myRole) {
          const isFil = this.languageService.currentLanguage === 'fil';
          this.notificationService.notify(
            isFil ? `💬 Mensahe mula kay ${rm.senderName}` : `💬 Message from ${rm.senderName}`,
            rm.message,
            'driver'
          );
        }
      } else {
        // Ensure local message also carries matching bookingNumber and bookingId so both devices match
        const existing = current[existingIdx];
        if (!existing.bookingNumber && (rm.bookingNumber || bookingNumber)) {
          current[existingIdx] = {
            ...existing,
            bookingNumber: rm.bookingNumber || bookingNumber,
            bookingId: existing.bookingId || localBookingId || rm.bookingId
          };
          hasNew = true;
        }
      }
    }
    if (hasNew) {
      this.persistMessages(current);
    }
  }

  public getMessagesForBooking(bookingId?: string, bookingNumber?: string): ChatMessage[] {
    this.syncMessagesFromStorage();
    if (!bookingId && !bookingNumber) return [];
    return this.currentMessages.filter(m =>
      (bookingId && m.bookingId === bookingId) ||
      (bookingNumber && (m as any).bookingNumber === bookingNumber)
    );
  }

  public getLatestMessageForBooking(bookingId?: string, bookingNumber?: string): ChatMessage | undefined {
    const list = this.getMessagesForBooking(bookingId, bookingNumber);
    return list.length ? list[list.length - 1] : undefined;
  }

  /**
   * Initializes the ONLY automatic welcome message from driver when booking is accepted
   */
  public initBookingWelcome(booking: BookingRequest): void {
    this.syncMessagesFromStorage();
    const list = [...this.currentMessages];
    const existingWelcome = list.find(m =>
      m.bookingId === booking.id ||
      (booking.bookingNumber && (m as any).bookingNumber === booking.bookingNumber)
    );
    if (!existingWelcome) {
      const isFil = this.languageService.currentLanguage === 'fil';
      const driverName = booking.assignedDriverName || 'Driver';
      const bikeNum = booking.assignedBikeNumber || 'BIKE-001';
      const welcomeText = isFil
        ? `Hello po ${booking.studentName}! Ako po si ${driverName} (${bikeNum}). Tinanggap ko na po ang booking niyo papunta sa ${booking.destinationName}. Papunta na po ako sa ${booking.pickupName}!`
        : `Hello ${booking.studentName}! I am ${driverName} (${bikeNum}). I have accepted your booking to ${booking.destinationName} and am on my way to ${booking.pickupName}.`;

      const welcomeMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        senderId: booking.assignedDriverId || 'driver-001',
        senderName: driverName,
        senderRole: 'driver',
        receiverId: booking.studentId,
        receiverName: booking.studentName,
        message: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false
      };
      list.push(welcomeMsg);
      this.persistMessages(list);

      // Save to XAMPP MySQL backend
      this.apiService.sendChatMessageXampp({
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        senderId: booking.assignedDriverId || 'driver-001',
        senderName: driverName,
        senderRole: 'driver',
        message: welcomeText
      }).subscribe();

      // Trigger notification for student
      this.notificationService.notify(
        isFil ? `💬 Mensahe mula kay ${driverName}` : `💬 Message from ${driverName}`,
        welcomeMsg.message,
        'driver'
      );
    }
  }

  /**
   * Student sends a real message to the driver (no automatic fake bot reply)
   */
  public sendStudentMessage(
    text: string,
    studentId: string,
    studentName: string,
    booking?: BookingRequest
  ): void {
    if (!text || !text.trim()) return;

    this.syncMessagesFromStorage();
    const list = [...this.currentMessages];
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      bookingId: booking?.id,
      bookingNumber: booking?.bookingNumber,
      senderId: studentId,
      senderName: studentName,
      senderRole: 'student',
      receiverId: booking?.assignedDriverId || 'driver-001',
      receiverName: booking?.assignedDriverName || 'Driver',
      message: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    list.push(newMsg);
    this.persistMessages(list);

    // Save to XAMPP MySQL backend
    this.apiService.sendChatMessageXampp({
      bookingId: booking?.id,
      bookingNumber: booking?.bookingNumber,
      senderId: studentId,
      senderName: studentName,
      senderRole: 'student',
      message: text.trim()
    }).subscribe();
  }

  /**
   * Driver sends a real response to the student
   */
  public sendDriverMessage(
    text: string,
    booking?: BookingRequest,
    driverUser?: any
  ): void {
    if (!text || !text.trim()) return;

    this.syncMessagesFromStorage();
    const list = [...this.currentMessages];
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      bookingId: booking?.id,
      bookingNumber: booking?.bookingNumber,
      senderId: driverUser?.id || booking?.assignedDriverId || 'driver-001',
      senderName: driverUser?.fullName || booking?.assignedDriverName || 'Driver',
      senderRole: 'driver',
      receiverId: booking?.studentId || 'student-001',
      receiverName: booking?.studentName || 'Student',
      message: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    list.push(newMsg);
    this.persistMessages(list);

    // Save to XAMPP MySQL backend
    this.apiService.sendChatMessageXampp({
      bookingId: booking?.id,
      bookingNumber: booking?.bookingNumber,
      senderId: newMsg.senderId,
      senderName: newMsg.senderName,
      senderRole: 'driver',
      message: text.trim()
    }).subscribe();

    // Alert student with chime and notification
    const isFil = this.languageService.currentLanguage === 'fil';
    this.notificationService.notify(
      isFil ? `💬 Mensahe mula kay ${newMsg.senderName}` : `💬 Message from ${newMsg.senderName}`,
      newMsg.message,
      'driver'
    );
  }

  public markAllAsRead(): void {
    this.syncMessagesFromStorage();
    const list = this.currentMessages.map(m => ({ ...m, isRead: true }));
    this.persistMessages(list);
  }
}

