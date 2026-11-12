import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkDoneOutline,
  notificationsOutline,
  bicycleOutline,
  flashOutline,
  shieldCheckmarkOutline,
  chevronForwardOutline,
  timeOutline,
  locationOutline,
  closeOutline
} from 'ionicons/icons';
import { StateService } from '../../../core/services/state.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { AppNotification } from '../../../core/models/models';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="dedicated-notif-page-root">

      <!-- ==================== TOP NAVIGATION BAR ==================== -->
      <div class="notif-page-top-nav">
        <button type="button" class="btn-notif-back" (click)="onBackClick($event)" title="Go Back">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>

        <div class="notif-title-group">
          <h1 class="page-title">Notifications</h1>
          <span class="unread-pill-chip" *ngIf="unreadCount > 0">{{ unreadCount }} unread</span>
        </div>

        <button
          type="button"
          class="btn-read-all-action"
          *ngIf="notificationsList.length > 0"
          (click)="markAllAsRead()"
          title="Mark all as read">
          <ion-icon name="checkmark-done-outline"></ion-icon>
          <span>Read All</span>
        </button>
      </div>

      <!-- ==================== CATEGORY FILTER CHIPS ==================== -->
      <div class="notif-filters-strip">
        <button
          type="button"
          class="filter-pill-btn"
          [class.is-active]="activeCategory === 'all'"
          (click)="activeCategory = 'all'">
          All ({{ notificationsList.length }})
        </button>
        <button
          type="button"
          class="filter-pill-btn"
          [class.is-active]="activeCategory === 'trip'"
          (click)="activeCategory = 'trip'">
          Rides & Trips
        </button>
        <button
          type="button"
          class="filter-pill-btn"
          [class.is-active]="activeCategory === 'queue'"
          (click)="activeCategory = 'queue'">
          Queue Alerts
        </button>
        <button
          type="button"
          class="filter-pill-btn"
          [class.is-active]="activeCategory === 'system'"
          (click)="activeCategory = 'system'">
          Campus
        </button>
      </div>

      <!-- ==================== NOTIFICATIONS FEED LIST ==================== -->
      <div class="notif-feed-container">

        <!-- Modern Notification Card -->
        <div
          *ngFor="let notif of filteredNotifications"
          class="modern-notif-card"
          [class.is-unread]="!notif.isRead"
          [ngClass]="'card-' + notif.type"
          (click)="onCardClick(notif)">

          <!-- Icon Box with dynamic neon tint -->
          <div class="notif-icon-circle" [style.background]="notif.type === 'system' ? 'transparent' : null" [style.padding]="notif.type === 'system' ? '2px' : null">
            <img *ngIf="notif.type === 'system'; else notifIonIcon" src="assets/images/BikeGO_logo.png" alt="BikeGo" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
            <ng-template #notifIonIcon>
              <ion-icon [name]="getTypeIcon(notif.type)"></ion-icon>
            </ng-template>
          </div>

          <!-- Content Details -->
          <div class="notif-card-content">
            <div class="ncc-header-row">
              <strong class="ncc-title">{{ notif.title }}</strong>
              <span class="ncc-time">{{ notif.timestamp }}</span>
            </div>

            <p class="ncc-message">{{ notif.message }}</p>

            <div class="ncc-action-footer" *ngIf="notif.type === 'trip' || notif.type === 'queue'">
              <span class="action-caption">{{ isFil ? 'Tingnan ang biyahe' : 'View Trip Details' }}</span>
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </div>
          </div>

          <!-- Blue Unread Dot -->
          <span class="unread-blue-pip" *ngIf="!notif.isRead"></span>
        </div>

        <!-- Empty State (When no notifications match) -->
        <div *ngIf="filteredNotifications.length === 0" class="notif-empty-state-box">
          <div class="empty-bell-circle">
            <ion-icon name="notifications-outline"></ion-icon>
          </div>
          <h3>{{ isFil ? 'Walang Bagong Notifications' : 'No New Notifications' }}</h3>
          <p>{{ isFil ? 'Lahat ng update sa iyong booking, pedicab trip, at anunsyo sa NEUST Sumacab ay lalabas dito.' : 'All campus transit updates, booking notifications, and notices will appear here.' }}</p>
          <button type="button" class="btn-empty-return" (click)="onBackClick()">
            <span>{{ isFil ? 'Bumalik sa Dashboard' : 'Back to Dashboard' }}</span>
          </button>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .dedicated-notif-page-root {
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      bottom: 0;
      width: 100%;
      max-width: 480px;
      height: 100vh;
      height: 100dvh;
      background: #f8fafc;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: pageFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;

      @media (max-width: 520px) {
        max-width: 100%;
      }
    }

    /* TOP NAVIGATION BAR */
    .notif-page-top-nav {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: max(12px, env(safe-area-inset-top, 0px)) 16px 12px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px 12px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
      flex-shrink: 0;

      @media (max-width: 360px) {
        padding: max(10px, env(safe-area-inset-top, 0px)) 12px 10px;
        gap: 8px;
      }

      .btn-notif-back {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        color: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;

        &:hover {
          background: #e2e8f0;
        }

        &:active {
          transform: scale(0.92);
          background: #cbd5e1;
        }
      }

      .notif-title-group {
        flex: 1;
        min-width: 120px;
        display: flex;
        align-items: center;
        gap: 8px;

        .page-title {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.4px;

          @media (max-width: 360px) {
            font-size: 16.5px;
          }
        }

        .unread-pill-chip {
          background: #ef4444;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          flex-shrink: 0;
        }
      }

      .btn-read-all-action {
        background: #eff6ff;
        border: 1px solid #dbeafe;
        color: #1d3698;
        padding: 7px 12px;
        border-radius: 12px;
        font-size: 11.5px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;

        @media (max-width: 360px) {
          padding: 6px 10px;
          font-size: 11px;
        }

        ion-icon {
          font-size: 16px;
        }

        &:hover {
          background: #dbeafe;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    /* CATEGORY FILTER CHIPS */
    .notif-filters-strip {
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      padding: 10px 16px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      flex-shrink: 0;

      &::-webkit-scrollbar {
        display: none;
      }

      .filter-pill-btn {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 7px 14px;
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.18s ease;

        &.is-active {
          background: #1d3698;
          border-color: #1d3698;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(29, 54, 152, 0.25);
        }

        &:active {
          transform: scale(0.96);
        }
      }
    }

    /* FEED LIST */
    .notif-feed-container {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      padding: 14px 16px calc(44px + env(safe-area-inset-bottom, 0px));
      display: flex;
      flex-direction: column;
      gap: 12px;

      > * {
        flex-shrink: 0;
      }

      .modern-notif-card {
        background: #ffffff;
        border-radius: 18px;
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 14px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        position: relative;
        cursor: pointer;
        transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

        &:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        &:active {
          transform: scale(0.98);
        }

        &.is-unread {
          border-left: 4.5px solid #1d3698;
          background: #ffffff;
          box-shadow: 0 4px 14px rgba(29, 54, 152, 0.08);
        }

        &.card-trip {
          .notif-icon-circle { background: #dcfce7; color: #16a34a; }
        }

        &.card-queue {
          .notif-icon-circle { background: #fef3c7; color: #d97706; }
        }

        &.card-system {
          .notif-icon-circle { background: #f3e8ff; color: #9333ea; }
        }

        .notif-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .notif-card-content {
          flex: 1;
          min-width: 0;

          .ncc-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;

            .ncc-title {
              font-size: 14.5px;
              font-weight: 750;
              color: #0f172a;
              line-height: 1.25;
            }

            .ncc-time {
              font-size: 11px;
              color: #94a3b8;
              font-weight: 500;
              flex-shrink: 0;
            }
          }

          .ncc-message {
            margin: 5px 0 0;
            font-size: 13px;
            color: #475569;
            line-height: 1.42;
          }

          .ncc-action-footer {
            margin-top: 10px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 700;
            color: #1d3698;

            ion-icon {
              font-size: 14px;
            }
          }
        }

        .unread-blue-pip {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #2563eb;
          position: absolute;
          top: 16px;
          right: 16px;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
        }
      }

      /* EMPTY STATE */
      .notif-empty-state-box {
        background: #ffffff;
        border-radius: 24px;
        padding: 48px 24px;
        text-align: center;
        border: 1.5px dashed #cbd5e1;
        margin-top: 32px;

        .empty-bell-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto 18px;
        }

        h3 {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 800;
          color: #1e293b;
        }

        p {
          margin: 0 0 24px;
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
        }

        .btn-empty-return {
          background: #1d3698;
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(29, 54, 152, 0.25);
          transition: transform 0.15s ease;

          &:active {
            transform: scale(0.96);
          }
        }
      }
    }

    @keyframes pageFadeIn {
      from {
        opacity: 0;
        transform: translate(-50%, 14px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
  `]
})
export class NotificationsPageComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  public activeCategory: 'all' | 'trip' | 'queue' | 'system' = 'all';

  constructor(
    public stateService: StateService,
    public authService: AuthService,
    public langService: LanguageService
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkDoneOutline,
      notificationsOutline,
      bicycleOutline,
      flashOutline,
      shieldCheckmarkOutline,
      chevronForwardOutline,
      timeOutline,
      locationOutline,
      closeOutline
    });
  }

  ngOnInit(): void {}

  public get isFil(): boolean {
    return this.langService.currentLanguage === 'fil';
  }

  public onBackClick(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.close.emit();
    this.stateService.closeNotificationsPage();
  }

  public get notificationsList(): AppNotification[] {
    return this.stateService.getNotificationsForUser(
      this.authService.currentUser?.id,
      this.authService.role
    );
  }

  public get filteredNotifications(): AppNotification[] {
    const list = this.notificationsList;
    if (this.activeCategory === 'all') return list;
    return list.filter(n => n.type === this.activeCategory);
  }

  public get unreadCount(): number {
    return this.notificationsList.filter(n => !n.isRead).length;
  }

  public markAllAsRead(): void {
    this.stateService.markNotificationsAsReadForUser(
      this.authService.currentUser?.id,
      this.authService.role
    );
  }

  public onCardClick(notif: AppNotification): void {
    if (notif.type === 'trip' || notif.type === 'queue') {
      this.close.emit();
      this.stateService.setActiveTab('queue');
    }
  }

  public getTypeIcon(type: string): string {
    if (type === 'trip' || type === 'driver') return 'bicycle-outline';
    if (type === 'queue') return 'flash-outline';
    if (type === 'safety') return 'shield-checkmark-outline';
    return 'notifications-outline';
  }
}
