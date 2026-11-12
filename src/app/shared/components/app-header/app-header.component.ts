import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  closeCircleOutline,
  closeOutline,
  notificationsOutline,
  notifications,
  personCircleOutline,
  personOutline,
  bicycleOutline,
  locationOutline,
  businessOutline,
  schoolOutline,
  fitnessOutline,
  restaurantOutline,
  sparklesOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  arrowBackOutline,
  chevronForwardOutline,
  flashOutline,
  shieldCheckmarkOutline,
  pinOutline
} from 'ionicons/icons';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { StateService } from '../../../core/services/state.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService, InAppToast } from '../../../core/services/notification.service';
import { CampusLocation } from '../../../core/models/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon
  ],
  template: `
    <!-- ==================== MODERN MINIMALIST HEADER ==================== -->
    <!-- Contains ONLY: 1. Search Bar (for pinning places), 2. Notification Bell, 3. Round Account Avatar -->
    <header class="modern-minimalist-header">
      <div class="header-clean-bar">

        <!-- 1. SEARCH BAR FOR STUDENT ONLY -->
        <div *ngIf="authService.role === 'student'" class="header-search-container" (click)="$event.stopPropagation()">
          <div class="search-input-pill" [class.is-active]="isSearchDropdownOpen">
            <ion-icon name="search-outline" class="search-glass-icon"></ion-icon>
            <input
              type="text"
              class="header-search-input"
              [(ngModel)]="searchQuery"
              (focus)="onSearchFocus()"
              (input)="onSearchInput()"
              placeholder="Search CICT, Gym, Eng'g, places..."
              autocomplete="off" />

            <button
              type="button"
              class="btn-clear-header-search"
              *ngIf="searchQuery"
              (click)="clearSearch($event)">
              <ion-icon name="close-circle-outline"></ion-icon>
            </button>
          </div>

          <!-- Dropdown of Approved Campus Locations -->
          <div class="search-dropdown-menu" *ngIf="isSearchDropdownOpen">
            <div class="dropdown-header-strip">
              <span>Verified Campus Places</span>
              <span class="count-chip">{{ filteredLocations.length }}</span>
            </div>

            <div class="dropdown-places-list">
              <div
                *ngFor="let loc of filteredLocations"
                class="dropdown-place-item"
                (click)="selectLocation(loc)">
                <div class="dpi-icon-circle" [ngClass]="'cat-' + loc.category">
                  <ion-icon [name]="getLocationIcon(loc)"></ion-icon>
                </div>
                <div class="dpi-info">
                  <strong class="dpi-name">{{ loc.name }}</strong>
                  <span class="dpi-sub">{{ loc.buildingNumber ? loc.buildingNumber + ' • ' : '' }}{{ loc.description }}</span>
                </div>
                <div class="dpi-pin-action">
                  <ion-icon name="pin-outline"></ion-icon>
                  <span>Pin</span>
                </div>
              </div>

              <div *ngIf="filteredLocations.length === 0" class="dropdown-empty-state">
                <ion-icon name="location-outline"></ion-icon>
                <p>{{ langService.currentLanguage === 'fil' ? 'Walang nahanap na lugar para sa' : 'No places found for' }} "{{ searchQuery }}"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 1B. DRIVER BRAND TITLE (For Driver Role) -->
        <div *ngIf="authService.role === 'driver'" class="header-driver-brand-bar">
          <div style="height: 36px; width: auto; flex-shrink: 0; display: flex; align-items: center;">
            <img src="assets/images/BikeGO_logo.png" alt="NEUST BikeGo" style="height: 100%; width: auto; object-fit: contain; display: block;" />
          </div>
          <div class="hdb-info-col">
            <span class="hdb-title">NEUST Driver Portal</span>
            <span class="hdb-sub">{{ langService.currentLanguage === 'fil' ? '● Handa sa Pasada' : '● Ready for Trips' }}</span>
          </div>
        </div>

        <!-- 1C. ADMIN BRAND TITLE (For Admin Role) -->
        <div *ngIf="authService.role === 'admin'" class="header-driver-brand-bar header-admin-brand">
          <div class="hdb-bike-pill admin-pill">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
            <strong>DISPATCH</strong>
          </div>
          <div class="hdb-info-col">
            <span class="hdb-title">NEUST Fleet Control</span>
            <span class="hdb-sub">Campus Dispatch Admin</span>
          </div>
        </div>

        <!-- RIGHT ACTIONS: 2. Notification Bell & 3. Round Account Avatar -->
        <div class="header-end-actions">

          <!-- 2. NOTIFICATIONS BELL -->
          <button
            type="button"
            class="header-btn-icon notif-bell-btn"
            (click)="openNotificationsPage($event)"
            title="Notifications">
            <ion-icon name="notifications-outline"></ion-icon>
            <!-- Glowing Red Unread Counter Badge -->
            <span class="notif-unread-badge" *ngIf="unreadNotifCount > 0">
              {{ unreadNotifCount }}
            </span>
          </button>

          <!-- 3. ROUND ACCOUNT AVATAR (Bilog na Account) -->
          <button
            type="button"
            class="header-round-avatar-btn"
            (click)="openProfileSection($event)"
            title="My Account & Profile">
            <img [src]="currentUserAvatar" class="avatar-circle-img" alt="User Profile" referrerpolicy="no-referrer" (error)="$any($event.target).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'" />
            <span class="role-status-dot" [ngClass]="'dot-' + authService.role"></span>
          </button>

        </div>

      </div>
    </header>
  `,
  styles: [`
    /* ==================== CLEAN MODERN HEADER ==================== */
    .modern-minimalist-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      width: 100%;
      padding-top: env(safe-area-inset-top, 0px);
    }

    .header-clean-bar {
      min-height: 58px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      width: 100%;
      box-sizing: border-box;
      position: relative;

      @media (max-width: 360px) {
        min-height: 54px;
        padding: 6px 10px;
        gap: 6px;
      }
    }

    /* 1. SEARCH BAR */
    .header-search-container {
      flex: 1;
      position: relative;
      min-width: 0;

      .search-input-pill {
        display: flex;
        align-items: center;
        background: #f1f5f9;
        border: 1.5px solid transparent;
        border-radius: 28px;
        padding: 0 14px;
        height: 42px;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

        @media (max-width: 360px) {
          padding: 0 10px;
          height: 38px;
        }

        &.is-active, &:focus-within {
          background: #ffffff;
          border-color: #1d3698;
          box-shadow: 0 0 0 3px rgba(29, 54, 152, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .search-glass-icon {
          font-size: 19px;
          color: #1d3698;
          flex-shrink: 0;
          margin-right: 8px;

          @media (max-width: 360px) {
            font-size: 17px;
            margin-right: 6px;
          }
        }

        .header-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 13.5px;
          color: #0f172a;
          outline: none;
          padding: 0;
          font-weight: 500;
          min-width: 0;

          @media (max-width: 360px) {
            font-size: 12.5px;
          }

          &::placeholder {
            color: #94a3b8;
            font-weight: 400;
          }
        }

        .btn-clear-header-search {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 4px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            color: #475569;
          }
        }
      }

      /* Search Results Dropdown */
      .search-dropdown-menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        width: calc(100vw - 28px);
        max-width: 452px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(0, 0, 0, 0.06);
        border: 1px solid #e2e8f0;
        overflow: hidden;
        z-index: 2000;
        max-height: min(380px, 65dvh);
        display: flex;
        flex-direction: column;
        animation: dropdownSlide 0.2s ease-out;

        @media (max-width: 360px) {
          width: calc(100vw - 20px);
        }

        .dropdown-header-strip {
          padding: 10px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          justify-content: space-between;

          .count-chip {
            background: #e2e8f0;
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 10px;
          }
        }

        .dropdown-places-list {
          overflow-y: auto;
          padding: 6px 0;

          .dropdown-place-item {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            gap: 12px;
            cursor: pointer;
            transition: background 0.15s ease;

            &:hover, &:active {
              background: #f1f5f9;
            }

            .dpi-icon-circle {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              flex-shrink: 0;

              &.cat-academic { background: #e0e7ff; color: #1d3698; }
              &.cat-admin, &.cat-administrative { background: #fef3c7; color: #b45309; }
              &.cat-facility, &.cat-recreation { background: #dcfce7; color: #15803d; }
              &.cat-terminal, &.cat-gate, &.cat-services { background: #fee2e2; color: #b91c1c; }
            }

            .dpi-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              min-width: 0;

              .dpi-name {
                font-size: 13.5px;
                color: #0f172a;
                font-weight: 700;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .dpi-sub {
                font-size: 11.5px;
                color: #64748b;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-top: 2px;
              }
            }

            .dpi-pin-action {
              display: flex;
              align-items: center;
              gap: 4px;
              background: #eff6ff;
              color: #1d3698;
              padding: 4px 9px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 700;

              ion-icon {
                font-size: 13px;
              }
            }
          }

          .dropdown-empty-state {
            padding: 24px 16px;
            text-align: center;
            color: #94a3b8;

            ion-icon {
              font-size: 32px;
              color: #cbd5e1;
              margin-bottom: 6px;
            }

            p {
              margin: 0;
              font-size: 12.5px;
            }
          }
        }
      }
    }

    /* Driver & Admin Header Brand Bars */
    .header-driver-brand-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;

      @media (max-width: 360px) {
        gap: 7px;
      }

      .hdb-bike-pill {
        background: #eff6ff;
        border: 1.5px solid #1d3698;
        color: #1d3698;
        padding: 5px 10px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        flex-shrink: 0;

        @media (max-width: 360px) {
          padding: 4px 8px;
          font-size: 11.5px;
          gap: 4px;
        }

        ion-icon {
          font-size: 18px;
          color: #f89318;

          @media (max-width: 360px) {
            font-size: 16px;
          }
        }

        strong {
          font-weight: 900;
          letter-spacing: 0.3px;
        }

        &.admin-pill {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1d3698;
        }
      }

      .hdb-info-col {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .hdb-title {
          font-size: 13.5px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          @media (max-width: 360px) {
            font-size: 12px;
          }
        }

        .hdb-sub {
          font-size: 10.5px;
          font-weight: 700;
          color: #f89318;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          @media (max-width: 360px) {
            font-size: 9.5px;
          }
        }
      }

      &.header-admin-brand {
        .hdb-sub {
          color: #2563eb;
        }
      }
    }

    /* 2 & 3. RIGHT ACTIONS */
    .header-end-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      position: relative;
      z-index: 50;

      @media (max-width: 360px) {
        gap: 6px;
      }

      /* Notification Bell Button */
      .notif-bell-btn {
        position: relative;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        pointer-events: auto;
        z-index: 60;

        @media (max-width: 360px) {
          width: 38px;
          height: 38px;
        }

        ion-icon {
          font-size: 21px;
          pointer-events: none;

          @media (max-width: 360px) {
            font-size: 19px;
          }
        }

        &:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        &:active {
          transform: scale(0.92);
          background: #e2e8f0;
        }

        .notif-unread-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
          animation: badgePulse 2s infinite;
          pointer-events: none;
        }
      }

      /* Round Account Avatar (Bilog na Account) */
      .header-round-avatar-btn {
        position: relative;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: #e2e8f0;
        border: 2px solid #1d3698;
        padding: 0;
        overflow: visible;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(29, 54, 152, 0.15);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        pointer-events: auto;
        z-index: 60;

        @media (max-width: 360px) {
          width: 38px;
          height: 38px;
        }

        &:hover {
          transform: scale(1.06);
        }

        &:active {
          transform: scale(0.94);
        }

        .avatar-circle-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          pointer-events: none;
        }

        .role-status-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          pointer-events: none;

          &.dot-student { background: #2563eb; }
          &.dot-driver { background: #10b981; }
          &.dot-admin { background: #f59e0b; }
        }
      }
    }

    /* ==================== MODERN IN-APP FLOATING HEADS-UP NOTIFICATION ==================== */
    .in-app-toast-wrapper {
      position: fixed;
      top: 14px;
      left: 14px;
      right: 14px;
      margin: auto;
      max-width: 480px;
      z-index: 99999;
      cursor: pointer;
      animation: inAppToastSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .in-app-toast-card {
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 18px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.14);
      position: relative;
      overflow: hidden;

      .toast-glow-strip {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 4px;
      }

      &.toast-trip {
        .toast-glow-strip { background: #10b981; }
        .toast-icon-circle { background: rgba(16, 185, 129, 0.2); color: #34d399; }
      }

      &.toast-driver {
        .toast-glow-strip { background: #3b82f6; }
        .toast-icon-circle { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
      }

      &.toast-queue {
        .toast-glow-strip { background: #f59e0b; }
        .toast-icon-circle { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
      }

      &.toast-system {
        .toast-glow-strip { background: #8b5cf6; }
        .toast-icon-circle { background: rgba(139, 92, 246, 0.2); color: #c084fc; }
      }

      .toast-icon-circle {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }

      .toast-content-col {
        flex: 1;
        min-width: 0;

        .toast-top-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;

          .toast-title {
            color: #ffffff;
            font-size: 13.5px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .toast-now-tag {
            font-size: 10px;
            color: #94a3b8;
            font-weight: 600;
            flex-shrink: 0;
          }
        }

        .toast-message-body {
          margin: 2px 0 0;
          font-size: 12px;
          color: #cbd5e1;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .btn-toast-dismiss {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #94a3b8;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.15s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }
      }

      /* Countdown timer bar shrinking over 4.5s */
      .toast-progress-countdown {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #2563eb, #10b981);
        width: 100%;
        animation: toastProgress 4.5s linear forwards;
      }
    }

    @keyframes dropdownSlide {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes inAppToastSlideIn {
      0% {
        opacity: 0;
        transform: translateY(-40px) scale(0.92);
      }
      60% {
        opacity: 1;
        transform: translateY(4px) scale(1.02);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes toastProgress {
      from { width: 100%; }
      to { width: 0%; }
    }

    @keyframes badgePulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
      70% { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `]
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  public searchQuery: string = '';
  public isSearchDropdownOpen: boolean = false;
  private sub: Subscription = new Subscription();

  constructor(
    public authService: AuthService,
    public stateService: StateService,
    public langService: LanguageService,
    public notificationService: NotificationService,
    private eRef: ElementRef
  ) {
    addIcons({
      searchOutline,
      closeCircleOutline,
      closeOutline,
      notificationsOutline,
      notifications,
      personCircleOutline,
      personOutline,
      bicycleOutline,
      locationOutline,
      businessOutline,
      schoolOutline,
      fitnessOutline,
      restaurantOutline,
      sparklesOutline,
      checkmarkCircleOutline,
      checkmarkDoneOutline,
      arrowBackOutline,
      chevronForwardOutline,
      flashOutline,
      shieldCheckmarkOutline,
      pinOutline
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // Click outside listener to close search dropdown
  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isSearchDropdownOpen = false;
    }
  }

  public get currentUserAvatar(): string {
    return this.authService.currentUser?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
  }

  public get unreadNotifCount(): number {
    const list = this.stateService.getNotificationsForUser(
      this.authService.currentUser?.id,
      this.authService.role
    );
    return list.filter(n => !n.isRead).length;
  }

  public get filteredLocations(): CampusLocation[] {
    const query = (this.searchQuery || '').trim().toLowerCase();
    const all = this.stateService.getStateSnapshot().locations || [];
    const approved = all.filter(l => l.status === 'approved' || !l.status);

    if (!query) {
      return approved.slice(0, 6);
    }

    return approved.filter(l =>
      l.name.toLowerCase().includes(query) ||
      (l.code && l.code.toLowerCase().includes(query)) ||
      (l.buildingNumber && l.buildingNumber.toLowerCase().includes(query)) ||
      (l.description && l.description.toLowerCase().includes(query))
    );
  }

  public onSearchFocus(): void {
    this.isSearchDropdownOpen = true;
  }

  public onSearchInput(): void {
    this.isSearchDropdownOpen = true;
  }

  public clearSearch(event: Event): void {
    event.stopPropagation();
    this.searchQuery = '';
  }

  public selectLocation(loc: CampusLocation): void {
    this.searchQuery = loc.name;
    this.isSearchDropdownOpen = false;
    // Pin location on campus map and switch to map view
    this.stateService.pinLocationFromSearch(loc);
  }

  public openNotificationsPage(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isSearchDropdownOpen = false;
    this.stateService.openNotificationsPage();
  }

  public openProfileSection(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isSearchDropdownOpen = false;
    this.stateService.closeNotificationsPage();
    this.stateService.openProfilePage();
  }

  public getLocationIcon(loc: CampusLocation): string {
    const cat = loc.category as string;
    if (cat === 'academic') return 'school-outline';
    if (cat === 'administrative' || cat === 'admin') return 'business-outline';
    if (cat === 'facility' || cat === 'recreation') {
      if (loc.code === 'GYM' || loc.code === 'POOL') return 'fitness-outline';
      if (loc.code === 'CAF') return 'restaurant-outline';
      return 'sparkles-outline';
    }
    if (cat === 'gate' || cat === 'terminal' || cat === 'services') return 'bicycle-outline';
    return 'location-outline';
  }

  public getToastIcon(type: string): string {
    if (type === 'trip' || type === 'driver') return 'bicycle-outline';
    if (type === 'queue') return 'flash-outline';
    if (type === 'safety') return 'shield-checkmark-outline';
    return 'notifications-outline';
  }

  public onToastClick(toast: InAppToast): void {
    this.notificationService.dismissToast();
    if (toast.actionCallback) {
      toast.actionCallback();
    } else if (toast.type === 'trip' || toast.type === 'driver') {
      this.stateService.closeNotificationsPage();
      this.stateService.setActiveTab('queue');
    } else {
      this.stateService.openNotificationsPage();
    }
  }
}
