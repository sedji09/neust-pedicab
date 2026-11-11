import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  personOutline,
  personCircleOutline,
  createOutline,
  keyOutline,
  swapHorizontalOutline,
  logOutOutline,
  checkmarkCircle,
  chevronForwardOutline,
  languageOutline,
  shieldCheckmarkOutline,
  schoolOutline,
  closeCircleOutline,
  logInOutline,
  personAddOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { StateService } from '../../../core/services/state.service';
import { LanguageService, SupportedLanguage } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent
  ],
  template: `
    <div class="dedicated-profile-page-root">

      <!-- ==================== TOP NAVIGATION BAR ==================== -->
      <div class="profile-page-top-nav">
        <button type="button" class="btn-profile-back" (click)="onBackClick($event)" title="Go Back">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>

        <div class="profile-nav-title-group">
          <h1 class="page-title">{{ langService.t('profile.title') }}</h1>
          <span class="user-role-badge" [class.badge-guest]="!authService.isAuthenticated">
            {{ authService.isAuthenticated ? ((authService.currentUser?.role || 'student') | uppercase) : 'GUEST' }}
          </span>
        </div>

        <div class="nav-right-spacer"></div>
      </div>

      <!-- ==================== SCROLLABLE PROFILE CONTENT ==================== -->
      <div class="profile-scroll-content">

        <!-- 1. AUTHENTICATED USER HERO CARD -->
        <div class="profile-hero-card" *ngIf="authService.isAuthenticated && authService.currentUser">
          <div class="profile-avatar-ring">
            <img [src]="authService.currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'" class="profile-avatar-img" alt="Avatar" referrerpolicy="no-referrer" (error)="$any($event.target).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'" />
            <div class="online-indicator-dot"></div>
          </div>

          <div class="profile-hero-meta">
            <h2 class="profile-hero-name">{{ authService.currentUser.fullName }}</h2>
            <div class="profile-hero-pills">
              <span class="pill-role" [ngClass]="'role-' + authService.currentUser.role">
                {{ authService.currentUser.role | uppercase }}
              </span>
              <span class="pill-id">{{ authService.currentUser.idNumber }}</span>
            </div>
            <span class="profile-hero-dept">{{ authService.currentUser.department || 'College of Information & Communications Tech (CICT)' }}</span>
          </div>
        </div>

        <!-- GUEST HERO CARD (If not authenticated) -->
        <div class="profile-hero-card is-guest" *ngIf="!authService.isAuthenticated">
          <div class="profile-avatar-ring guest-avatar-box">
            <ion-icon name="person-circle-outline"></ion-icon>
          </div>
          <div class="profile-hero-meta">
            <h2 class="profile-hero-name">{{ isFil ? 'Bisitang Pasahero (Naka-Logout)' : 'Guest Passenger (Logged Out)' }}</h2>
            <span class="profile-hero-dept">{{ isFil ? 'Mag-sign in o mag-register upang ma-access ang iyong profile, ride history, at student pass.' : 'Sign in or create an account to access your student profile, campus trip history, and transit pass.' }}</span>
            <div class="guest-btn-row">
              <button type="button" class="btn-hero-signin" (click)="openAuthModal('signin')">
                <ion-icon name="log-in-outline"></ion-icon> {{ isFil ? 'Sign In (Mag-Login)' : 'Sign In' }}
              </button>
              <button type="button" class="btn-hero-register" (click)="openAuthModal('register')">
                <ion-icon name="person-add-outline"></ion-icon> {{ isFil ? 'Register (Sign Up)' : 'Create Account' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 2. QUICK STATS STRIP (Role-Aware: Dynamic for Student, Driver, Admin) -->
        <div class="profile-stats-strip" *ngIf="authService.isAuthenticated">
          <!-- When STUDENT -->
          <ng-container *ngIf="authService.currentUser?.role === 'student'">
            <div class="stat-cell">
              <span class="stat-num">{{ (stateService.trips$ | async)?.length || 15 }}</span>
              <span class="stat-label">CAMPUS RIDES</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-cell">
              <span class="stat-num verified">Verified</span>
              <span class="stat-label">NEUST STUDENT</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-cell">
              <span class="stat-num active">Active</span>
              <span class="stat-label">DIGITAL PASS</span>
            </div>
          </ng-container>

          <!-- When DRIVER -->
          <ng-container *ngIf="authService.currentUser?.role === 'driver'">
            <div class="stat-cell">
              <span class="stat-num">21</span>
              <span class="stat-label">PASADA TODAY</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-cell">
              <span class="stat-num verified">Verified</span>
              <span class="stat-label">NEUST DRIVER</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-cell">
              <span class="stat-num active">{{ authService.currentUser?.assignedBicycleNumber || 'BIKE-003' }}</span>
              <span class="stat-label">ASSIGNED SHUTTLE</span>
            </div>
          </ng-container>

          <!-- When ADMIN -->
          <ng-container *ngIf="authService.currentUser?.role === 'admin'">
            <div class="stat-cell">
              <span class="stat-num">7</span>
              <span class="stat-label">ACTIVE SHUTTLES</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-cell">
              <span class="stat-num verified">Verified</span>
              <span class="stat-label">CAMPUS ADMIN</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-cell">
              <span class="stat-num active">Full Access</span>
              <span class="stat-label">SUPERVISOR</span>
            </div>
          </ng-container>
        </div>

        <!-- 2B. GUEST LOCKED BANNER (When Not Authenticated) -->
        <div class="profile-stats-locked-card" *ngIf="!authService.isAuthenticated">
          <div class="psl-icon">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
          </div>
          <div class="psl-text">
            <strong>{{ isFil ? 'Naka-lock ang Record at Digital Pass' : 'Trip History & Digital Pass Locked' }}</strong>
            <span>{{ isFil ? 'Kailangan mong mag-sign up o mag-login gamit ang iyong Student ID upang makita ang iyong campus rides at digital pass.' : 'Please sign in or register with your Student ID to access your campus rides and digital transit pass.' }}</span>
          </div>
        </div>

        <!-- 3. APP LANGUAGE / WIKA SWITCHER CARD (Matches user uploaded photo) -->
        <div class="profile-section-card">
          <div class="section-card-header">
            <div class="section-icon-box icon-lang">
              <ion-icon name="language-outline"></ion-icon>
            </div>
            <div class="section-title-col">
              <strong>{{ langService.t('settings.language_title') }}</strong>
              <span>{{ langService.t('settings.language_sub') }}</span>
            </div>
          </div>

          <div class="language-options-grid">
            <button
              type="button"
              class="lang-choice-card"
              [class.is-active]="langService.currentLanguage === 'en'"
              (click)="changeLanguage('en')">
              <span class="lang-flag">US</span>
              <div class="lang-label-group">
                <strong class="lang-title">English</strong>
                <span class="lang-sub">(Default)</span>
              </div>
              <ion-icon name="checkmark-circle" class="lang-check" *ngIf="langService.currentLanguage === 'en'"></ion-icon>
            </button>

            <button
              type="button"
              class="lang-choice-card"
              [class.is-active]="langService.currentLanguage === 'fil'"
              (click)="changeLanguage('fil')">
              <span class="lang-flag">PH</span>
              <div class="lang-label-group">
                <strong class="lang-title">Filipino</strong>
                <span class="lang-sub">(Tagalog)</span>
              </div>
              <ion-icon name="checkmark-circle" class="lang-check" *ngIf="langService.currentLanguage === 'fil'"></ion-icon>
            </button>
          </div>
        </div>

        <!-- 4. PROFILE ACTIONS MENU LIST (Matches user uploaded photo) -->
        <div class="profile-actions-list">

          <!-- AUTHENTICATED USER ACTIONS ONLY -->
          <ng-container *ngIf="authService.isAuthenticated">
            <!-- Edit Profile -->
            <button type="button" class="action-item-row" (click)="isEditModalOpen = true">
              <div class="action-item-icon icon-blue">
                <ion-icon name="create-outline"></ion-icon>
              </div>
              <div class="action-item-text">
                <strong>{{ langService.t('profile.edit_profile') }}</strong>
                <span>{{ langService.t('profile.edit_profile_sub') }}</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>

            <!-- Change Password -->
            <button type="button" class="action-item-row" (click)="isPasswordModalOpen = true">
              <div class="action-item-icon icon-amber">
                <ion-icon name="key-outline"></ion-icon>
              </div>
              <div class="action-item-text">
                <strong>{{ langService.t('profile.change_password') }}</strong>
                <span>{{ langService.t('profile.change_password_sub') }}</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>

            <!-- Switch / Create Account -->
            <button type="button" class="action-item-row" (click)="openAuthModal('signin')">
              <div class="action-item-icon icon-purple">
                <ion-icon name="person-outline"></ion-icon>
              </div>
              <div class="action-item-text">
                <strong>{{ langService.t('profile.switch_account') }}</strong>
                <span>{{ langService.t('profile.switch_account_sub') }}</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>
          </ng-container>

          <!-- GUEST / LOGGED-OUT USER ACTIONS (Prompts to Sign In or Register) -->
          <ng-container *ngIf="!authService.isAuthenticated">
            <button type="button" class="action-item-row action-primary-row" (click)="openAuthModal('signin')">
              <div class="action-item-icon icon-blue">
                <ion-icon name="log-in-outline"></ion-icon>
              </div>
              <div class="action-item-text">
                <strong>{{ isFil ? 'Mag-Login sa Account (Sign In)' : 'Sign In to Account' }}</strong>
                <span>{{ isFil ? 'Pumasok gamit ang iyong Student ID o Email' : 'Sign in using your Student ID or Email' }}</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>

            <button type="button" class="action-item-row action-gold-row" (click)="openAuthModal('register')">
              <div class="action-item-icon icon-amber">
                <ion-icon name="person-add-outline"></ion-icon>
              </div>
              <div class="action-item-text">
                <strong>{{ isFil ? 'Gumawa ng Bagong Account (Register)' : 'Create New Account' }}</strong>
                <span>{{ isFil ? 'Magrehistro bilang bagong estudyante sa NEUST' : 'Register as a student or shuttle driver' }}</span>
              </div>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>
          </ng-container>

          <!-- Switch User Role (Student, Driver, Admin Demo) -->
          <button type="button" class="action-item-row" (click)="isRoleModalOpen = true">
            <div class="action-item-icon icon-indigo">
              <ion-icon name="swap-horizontal-outline"></ion-icon>
            </div>
            <div class="action-item-text">
              <strong>Demo Switcher</strong>
              <span>Subukan bilang: Student, Driver, o Admin</span>
            </div>
            <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
          </button>

          <!-- Log Out (ONLY when Authenticated!) -->
          <button *ngIf="authService.isAuthenticated" type="button" class="action-item-row is-logout" (click)="handleLogout()">
            <div class="action-item-icon icon-red">
              <ion-icon name="log-out-outline"></ion-icon>
            </div>
            <div class="action-item-text">
              <strong class="text-danger">{{ langService.t('profile.logout') }}</strong>
              <span>{{ langService.t('profile.logout_sub') }}</span>
            </div>
            <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
          </button>

        </div>

        <!-- Campus Footer Notice -->
        <div class="profile-footer-notice">
          <p>Nueva Ecija University of Science and Technology</p>
          <span>BikeGo Sumacab Transit System • Version 2.0</span>
        </div>

      </div>

      <!-- ==================== MODALS ==================== -->

      <!-- Edit Profile Modal -->
      <ion-modal [isOpen]="isEditModalOpen" (didDismiss)="isEditModalOpen = false" [initialBreakpoint]="0.6" [breakpoints]="[0, 0.6]">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ langService.t('profile.edit_profile') }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="isEditModalOpen = false">
                  <ion-icon name="close-circle-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="modal-form-body">
              <label>Phone Number</label>
              <input type="tel" class="modal-input" [(ngModel)]="editPhone" placeholder="0917-000-0000" />

              <label>College / Department</label>
              <input type="text" class="modal-input" [(ngModel)]="editDept" placeholder="e.g. CICT, COE, CMBT" />

              <button type="button" class="btn-save-modal" (click)="saveProfileChanges()">
                Save Changes
              </button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- Change Password Modal -->
      <ion-modal [isOpen]="isPasswordModalOpen" (didDismiss)="isPasswordModalOpen = false" [initialBreakpoint]="0.5" [breakpoints]="[0, 0.5]">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>{{ langService.t('profile.change_password') }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="isPasswordModalOpen = false">
                  <ion-icon name="close-circle-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="modal-form-body">
              <label>Current Password</label>
              <input type="password" class="modal-input" placeholder="••••••••" />

              <label>New Password</label>
              <input type="password" class="modal-input" placeholder="••••••••" />

              <button type="button" class="btn-save-modal" (click)="savePasswordChanges()">
                Update Password
              </button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- Switch Role Modal -->
      <ion-modal [isOpen]="isRoleModalOpen" (didDismiss)="isRoleModalOpen = false" [initialBreakpoint]="0.5" [breakpoints]="[0, 0.5]">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
              <ion-title>Switch User Role</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="isRoleModalOpen = false">
                  <ion-icon name="close-circle-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="role-selector-list">
              <button class="role-choice-btn" [class.is-selected]="authService.role === 'student'" (click)="selectRole('student')">
                <strong>Student Passenger</strong>
                <span>Book rides, track pedicabs, digital campus passes</span>
              </button>
              <button class="role-choice-btn" [class.is-selected]="authService.role === 'driver'" (click)="selectRole('driver')">
                <strong>Pedicab Driver</strong>
                <span>Accept bookings, GPS tracking, passenger queues</span>
              </button>
              <button class="role-choice-btn" [class.is-selected]="authService.role === 'admin'" (click)="selectRole('admin')">
                <strong>Campus Administrator</strong>
                <span>Fleet telemetry, campus mapping, location approval</span>
              </button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

    </div>
  `,
  styles: [`
    /* ==================== ROOT CONTAINER ==================== */
    .dedicated-profile-page-root {
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
      z-index: 10000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: profileSlideIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);

      @media (max-width: 520px) {
        max-width: 100%;
      }
    }

    @keyframes profileSlideIn {
      from {
        opacity: 0;
        transform: translate(-50%, 16px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }

    /* ==================== TOP NAVIGATION BAR ==================== */
    .profile-page-top-nav {
      min-height: 58px;
      padding: max(10px, env(safe-area-inset-top)) 16px 12px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

      .btn-profile-back {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.15s ease;

        &:active {
          transform: scale(0.92);
          background: #e2e8f0;
        }
      }

      .profile-nav-title-group {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;

        .page-title {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .user-role-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          letter-spacing: 0.5px;
        }
      }

      .nav-right-spacer {
        width: 40px;
      }
    }

    /* ==================== SCROLLABLE CONTENT ==================== */
    .profile-scroll-content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      padding: 16px 16px calc(48px + env(safe-area-inset-bottom, 0px));
      display: flex;
      flex-direction: column;
      gap: 14px;

      > * {
        flex-shrink: 0;
      }
    }

    /* 1. HERO USER CARD */
    .profile-hero-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 20px 18px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      align-items: center;
      gap: 16px;

      .profile-avatar-ring {
        position: relative;
        width: 68px;
        height: 68px;
        flex-shrink: 0;

        .profile-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }

        .online-indicator-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #22c55e;
          border: 2.5px solid #ffffff;
        }

        ion-icon {
          font-size: 68px;
          color: #94a3b8;
        }
      }

      .profile-hero-meta {
        flex: 1;
        min-width: 0;

        .profile-hero-name {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.2;
        }

        .profile-hero-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;

          .pill-role {
            font-size: 10px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 4px;
            background: #dbeafe;
            color: #1e40af;
            letter-spacing: 0.5px;
          }

          .pill-id {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
          }
        }

        .profile-hero-dept {
          font-size: 11.5px;
          color: #475569;
          font-weight: 500;
          display: block;
          line-height: 1.3;
        }
      }

      &.is-guest {
        background: #f8fafc;
        border: 1.5px dashed #cbd5e1;

        .guest-avatar-box {
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;

          ion-icon {
            font-size: 56px;
            color: #64748b;
          }
        }

        .guest-btn-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;

          .btn-hero-signin {
            padding: 9px 14px;
            border-radius: 10px;
            background: linear-gradient(135deg, #0a2558 0%, #1d4ed8 100%);
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;

            &:active { transform: scale(0.96); }
          }

          .btn-hero-register {
            padding: 9px 14px;
            border-radius: 10px;
            background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;

            &:active { transform: scale(0.96); }
          }
        }
      }
    }

    /* GUEST LOCKED BANNER */
    .profile-stats-locked-card {
      background: #eff6ff;
      border: 1px dashed #93c5fd;
      border-radius: 16px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;

      .psl-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #dbeafe;
        color: #1e40af;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }

      .psl-text {
        strong {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #1e3a8a;
          margin-bottom: 2px;
        }

        span {
          font-size: 11px;
          color: #2563eb;
          line-height: 1.35;
          display: block;
        }
      }
    }

    /* 2. STATS STRIP */
    .profile-stats-strip {
      background: #ffffff;
      border-radius: 16px;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
      display: flex;
      align-items: center;
      justify-content: space-around;

      .stat-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        flex: 1;
        text-align: center;

        .stat-num {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;

          &.verified { color: #15803d; }
          &.active { color: #1d4ed8; }
        }

        .stat-label {
          font-size: 9.5px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.3px;
        }
      }

      .stat-divider {
        width: 1px;
        height: 28px;
        background: #e2e8f0;
      }
    }

    /* 3. APP LANGUAGE SECTION CARD */
    .profile-section-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);

      .section-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;

        .section-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;

          &.icon-lang {
            background: #eff6ff;
            color: #2563eb;
          }
        }

        .section-title-col {
          display: flex;
          flex-direction: column;

          strong {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          }

          span {
            font-size: 11.5px;
            color: #64748b;
          }
        }
      }

      .language-options-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;

        @media (max-width: 350px) {
          grid-template-columns: 1fr;
        }

        .lang-choice-card {
          padding: 12px 14px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s ease;

          @media (max-width: 380px) {
            padding: 10px 10px;
            gap: 8px;
          }

          .lang-flag {
            font-size: 13px;
            font-weight: 900;
            color: #1d3698;
            background: #e0e7ff;
            padding: 3px 6px;
            border-radius: 6px;
          }

          .lang-label-group {
            flex: 1;
            text-align: left;

            .lang-title {
              display: block;
              font-size: 13px;
              color: #0f172a;
              font-weight: 800;
            }

            .lang-sub {
              display: block;
              font-size: 10px;
              color: #64748b;
            }
          }

          .lang-check {
            font-size: 18px;
            color: #2563eb;
          }

          &.is-active {
            background: #eff6ff;
            border-color: #3b82f6;

            .lang-label-group .lang-title {
              color: #1d4ed8;
            }
          }

          &:active {
            transform: scale(0.98);
          }
        }
      }
    }

    /* 4. ACTIONS LIST */
    .profile-actions-list {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
      display: flex;
      flex-direction: column;
      gap: 2px;

      .action-item-row {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 10px;
        border: none;
        background: transparent;
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;

        &:active {
          background: #f1f5f9;
        }

        .action-item-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;

          &.icon-blue { background: #eff6ff; color: #2563eb; }
          &.icon-amber { background: #fef3c7; color: #d97706; }
          &.icon-purple { background: #f3e8ff; color: #9333ea; }
          &.icon-indigo { background: #e0e7ff; color: #4338ca; }
          &.icon-red { background: #fee2e2; color: #dc2626; }
        }

        .action-item-text {
          flex: 1;
          min-width: 0;

          strong {
            display: block;
            font-size: 13.5px;
            font-weight: 800;
            color: #0f172a;

            &.text-danger { color: #dc2626; }
          }

          span {
            display: block;
            font-size: 11px;
            color: #64748b;
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .action-arrow {
          font-size: 16px;
          color: #94a3b8;
          flex-shrink: 0;
        }

        &.is-logout {
          margin-top: 4px;
          border-top: 1px solid #f1f5f9;
        }
      }
    }

    .profile-footer-notice {
      text-align: center;
      padding: 16px 0;

      p {
        margin: 0;
        font-size: 11.5px;
        font-weight: 700;
        color: #64748b;
      }

      span {
        font-size: 10px;
        color: #94a3b8;
      }
    }

    /* Modal styles */
    .modal-form-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 10px;

      label {
        font-size: 12px;
        font-weight: 800;
        color: #334155;
      }

      .modal-input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1.5px solid #cbd5e1;
        background: #f8fafc;
        font-size: 14px;
        outline: none;

        &:focus {
          border-color: #2563eb;
          background: #ffffff;
        }
      }

      .btn-save-modal {
        margin-top: 12px;
        padding: 14px;
        border-radius: 12px;
        background: #1d3698;
        color: #ffffff;
        font-size: 14px;
        font-weight: 800;
        border: none;
        cursor: pointer;
      }
    }

    .role-selector-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 10px;

      .role-choice-btn {
        padding: 14px;
        border-radius: 14px;
        border: 1.5px solid #e2e8f0;
        background: #f8fafc;
        text-align: left;
        cursor: pointer;

        strong {
          display: block;
          font-size: 14px;
          color: #0f172a;
          margin-bottom: 2px;
        }

        span {
          font-size: 11.5px;
          color: #64748b;
        }

        &.is-selected {
          border-color: #2563eb;
          background: #eff6ff;

          strong {
            color: #1d4ed8;
          }
        }
      }
    }
  `]
})
export class ProfilePageComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  public isEditModalOpen = false;
  public isPasswordModalOpen = false;
  public isRoleModalOpen = false;

  public editPhone = '';
  public editDept = '';

  constructor(
    public authService: AuthService,
    public stateService: StateService,
    public langService: LanguageService,
    private notificationService: NotificationService
  ) {
    addIcons({
      arrowBackOutline,
      personOutline,
      personCircleOutline,
      createOutline,
      keyOutline,
      swapHorizontalOutline,
      logOutOutline,
      checkmarkCircle,
      chevronForwardOutline,
      languageOutline,
      shieldCheckmarkOutline,
      schoolOutline,
      closeCircleOutline,
      logInOutline,
      personAddOutline
    });
  }

  ngOnInit(): void {
    if (this.authService.currentUser) {
      this.editPhone = this.authService.currentUser.phone || '';
      this.editDept = this.authService.currentUser.department || '';
    }
  }

  public onBackClick(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.close.emit();
  }

  public changeLanguage(lang: SupportedLanguage): void {
    this.langService.setLanguage(lang);
    this.notificationService.notify(
      'Language Updated',
      lang === 'en' ? 'App language set to English (Default)' : 'Pinalitan ang wika sa Filipino',
      'system'
    );
  }

  public get isFil(): boolean {
    return this.langService.currentLanguage === 'fil';
  }

  public openAuthModal(mode: 'signin' | 'register' = 'signin'): void {
    // 1. Close profile page overlay so it doesn't block the screen
    this.stateService.closeProfilePage();
    this.close.emit();

    // 2. If exploring as guest, exit guest mode so the full landing auth view mounts
    if (this.authService.isGuestBrowsing) {
      this.authService.exitGuestMode();
    }

    // 3. Trigger auth modal and landing auth card with chosen mode
    this.authService.openAuthModal(mode);
  }

  public saveProfileChanges(): void {
    if (this.authService.currentUser) {
      this.authService.currentUser.phone = this.editPhone;
      this.authService.currentUser.department = this.editDept;
      this.notificationService.notify('Profile Updated', 'Your profile details have been saved.', 'system');
    }
    this.isEditModalOpen = false;
  }

  public savePasswordChanges(): void {
    this.notificationService.notify('Password Updated', 'Your security password has been changed.', 'system');
    this.isPasswordModalOpen = false;
  }

  public selectRole(role: 'student' | 'driver' | 'admin'): void {
    this.authService.switchRole(role);
    this.isRoleModalOpen = false;
    this.close.emit();
  }

  public handleLogout(): void {
    this.authService.logout();
    this.close.emit();
  }
}

