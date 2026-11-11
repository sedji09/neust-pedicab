import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatMessage, BookingRequest } from '../models/models';
import { NotificationService } from './notification.service';

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

  constructor(private notificationService: NotificationService) {
    this.initMessages();
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

  public getMessagesForBooking(bookingId?: string): ChatMessage[] {
    if (!bookingId) return this.currentMessages;
    return this.currentMessages.filter(m => !m.bookingId || m.bookingId === bookingId);
  }

  public getLatestMessageForBooking(bookingId?: string): ChatMessage | undefined {
    const list = this.getMessagesForBooking(bookingId);
    return list.length ? list[list.length - 1] : undefined;
  }

  /**
   * Initializes welcome message from driver when booking is accepted
   */
  public initBookingWelcome(booking: BookingRequest): void {
    const list = [...this.currentMessages];
    const existingWelcome = list.find(m => m.bookingId === booking.id);
    if (!existingWelcome) {
      const welcomeMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        bookingId: booking.id,
        senderId: booking.assignedDriverId || 'driver-003',
        senderName: booking.assignedDriverName || 'Juan Dela Cruz',
        senderRole: 'driver',
        receiverId: booking.studentId,
        receiverName: booking.studentName,
        message: `Hello po ${booking.studentName}! Ako po si ${booking.assignedDriverName || 'Kuya Driver'} (${booking.assignedBikeNumber || 'BIKE-003'}). Tinanggap ko na po ang booking niyo papunta sa ${booking.destinationName}. Papunta na po ako sa ${booking.pickupName}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false
      };
      list.push(welcomeMsg);
      this.persistMessages(list);

      // Trigger notification for student
      this.notificationService.notify(
        `💬 Mensahe mula kay ${booking.assignedDriverName || 'Driver'}`,
        welcomeMsg.message,
        'driver'
      );
    }
  }

  /**
   * Student sends a message to the driver
   */
  public sendStudentMessage(
    text: string,
    studentId: string,
    studentName: string,
    booking?: BookingRequest
  ): void {
    if (!text || !text.trim()) return;

    const list = [...this.currentMessages];
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      bookingId: booking?.id,
      senderId: studentId,
      senderName: studentName,
      senderRole: 'student',
      receiverId: booking?.assignedDriverId || 'driver-003',
      receiverName: booking?.assignedDriverName || 'Juan Dela Cruz',
      message: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };
    list.push(newMsg);
    this.persistMessages(list);

    // Simulate realistic Driver reply after 1.5 seconds if ride is active
    if (booking && booking.status !== 'completed' && booking.status !== 'cancelled') {
      setTimeout(() => {
        this.simulateDriverReply(text.trim(), booking);
      }, 1500);
    }
  }

  /**
   * Driver sends a response
   */
  public sendDriverMessage(
    text: string,
    booking?: BookingRequest,
    driverUser?: any
  ): void {
    if (!text || !text.trim()) return;

    const list = [...this.currentMessages];
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      bookingId: booking?.id,
      senderId: driverUser?.id || booking?.assignedDriverId || 'driver-003',
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

    // Alert student with chime and notification
    this.notificationService.notify(
      `💬 Mensahe mula kay ${newMsg.senderName}`,
      newMsg.message,
      'driver'
    );
  }

  /**
   * Driver sends a response
   */
  private simulateDriverReply(studentText: string, booking: BookingRequest): void {
    const list = [...this.currentMessages];
    const lower = studentText.toLowerCase();

    let replyText = 'Sige po, noted po!';
    if (lower.includes('saan') || lower.includes('nasaan') || lower.includes('where')) {
      replyText = `Nandito na po ako malapit sa may kanto, papasok na po sa ${booking.pickupName}!`;
    } else if (lower.includes('waiting') || lower.includes('nandito') || lower.includes('here') || lower.includes('tapat')) {
      replyText = 'Sige po Maam/Sir, nakikita ko na po kayo, tabi lang po ako sa gilid!';
    } else if (lower.includes('salamat') || lower.includes('thank')) {
      replyText = 'Walang anuman po! Ingat po palagi sa biyahe.';
    } else if (lower.includes('tagal') || lower.includes('matagal') || lower.includes('traffic')) {
      replyText = 'Medyo may kasabay lang pong mga estudyante sa daan pero mabilis lang po ito, papalapit na po!';
    } else {
      const replies = [
        `Opo, papunta na po diyan sa ${booking.pickupName}!`,
        'Sige po, naka-standby na po ako.',
        'Noted po! Papasok na po ang pedicab sa waiting shed.',
        'Opo, konting sandali na lang po nandiyan na po ako!'
      ];
      replyText = replies[Math.floor(Math.random() * replies.length)];
    }

    const driverMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      bookingId: booking.id,
      senderId: booking.assignedDriverId || 'driver-003',
      senderName: booking.assignedDriverName || 'Juan Dela Cruz',
      senderRole: 'driver',
      receiverId: booking.studentId,
      receiverName: booking.studentName,
      message: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    list.push(driverMsg);
    this.persistMessages(list);

    // Alert student with chime and notification
    this.notificationService.notify(
      `💬 Mensahe mula kay ${booking.assignedDriverName || 'Driver'}`,
      replyText,
      'driver'
    );
  }

  public markAllAsRead(): void {
    const list = this.currentMessages.map(m => ({ ...m, isRead: true }));
    this.persistMessages(list);
  }
}

