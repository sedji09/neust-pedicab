import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonIcon,
  IonToast
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  callOutline,
  cardOutline,
  schoolOutline,
  shieldCheckmarkOutline,
  closeOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  sparklesOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole, RegisterUserDto } from '../../../core/models/models';
import { SocialLogin } from '@capgo/capacitor-social-login';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonModal,
    IonIcon,
    IonToast
  ],
  template: `
    <ion-modal 
      [isOpen]="(authService.isAuthModalOpen$ | async) ?? false" 
      (willPresent)="onWillPresent()"
      (didDismiss)="closeModal()" 
      [initialBreakpoint]="0.95" 
      [breakpoints]="[0, 0.95, 1.0]">
      <ng-template>
        <div class="auth-modal-wrapper">
          
          <!-- Modal Top Bar -->
          <div class="auth-top-bar">
            <div class="auth-brand-snippet">
              <div class="auth-logo-circle">
                <ion-icon name="bicycle-outline"></ion-icon>
              </div>
              <div>
                <h3 class="auth-app-title">NEUST <span>BikeGo</span></h3>
                <p class="auth-app-sub">Campus Shuttle & Passenger Portal</p>
              </div>
            </div>
            <button class="auth-x-btn" (click)="closeModal()">
              <ion-icon name="close-outline"></ion-icon>
            </button>
          </div>

          <!-- Auth Mode Segment Tabs: Sign In / Create Account -->
          <div class="auth-tab-segment">
            <button 
              class="auth-segment-btn" 
              [class.is-active]="activeMode === 'signin'" 
              (click)="activeMode = 'signin'; errorBanner = ''">
              Sign In
            </button>
            <button 
              class="auth-segment-btn" 
              [class.is-active]="activeMode === 'register'" 
              (click)="activeMode = 'register'; errorBanner = ''">
              Create Account
            </button>
          </div>

          <!-- Alert / Error Banner -->
          <div class="auth-error-banner" *ngIf="errorBanner">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <span>{{ errorBanner }}</span>
          </div>

          <!-- Sign in with Google Button -->
          <div class="google-auth-box">
            <button type="button" class="btn-google-sign" (click)="handleGoogleSignIn()">
              <svg class="google-svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div class="auth-divider">
            <span>or with email & password</span>
          </div>

          <!-- ==================== TAB 1: SIGN IN ==================== -->
          <div *ngIf="activeMode === 'signin'" class="auth-form-scrollable">
            <form (ngSubmit)="handleSignIn()">
              <div class="form-group">
                <label>Student ID Number or Email</label>
                <div class="input-field-box">
                  <ion-icon name="person-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="loginIdentifier" 
                    name="loginIdentifier" 
                    placeholder="e.g. 2023-01042 or maria@neust.edu.ph" 
                    required />
                </div>
              </div>

              <div class="form-group">
                <label>Password</label>
                <div class="input-field-box">
                  <ion-icon name="lock-closed-outline"></ion-icon>
                  <input 
                    [type]="showLoginPassword ? 'text' : 'password'" 
                    [(ngModel)]="loginPassword" 
                    name="loginPassword" 
                    placeholder="Enter your password" 
                    required />
                  <button type="button" class="eye-toggle-btn" (click)="showLoginPassword = !showLoginPassword">
                    <ion-icon [name]="showLoginPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                  </button>
                </div>
              </div>

              <button type="submit" class="btn-primary-auth">
                <span>Sign In to BikeGo</span>
                <ion-icon name="arrow-forward-outline"></ion-icon>
              </button>
            </form>

            <!-- Quick Demo One-Click Access -->
            <div class="auth-divider">
              <span>Or Quick Demo Login</span>
            </div>

            <div class="demo-quick-grid">
              <button class="demo-pill-btn" (click)="quickDemoLogin('student')">
                <span class="demo-dot dot-student"></span>
                <span>Student Maria</span>
              </button>
              <button class="demo-pill-btn" (click)="quickDemoLogin('driver')">
                <span class="demo-dot dot-driver"></span>
                <span>Driver Pedro</span>
              </button>
              <button class="demo-pill-btn" (click)="quickDemoLogin('admin')">
                <span class="demo-dot dot-admin"></span>
                <span>Admin Bautista</span>
              </button>
            </div>
          </div>

          <!-- ==================== TAB 2: CREATE ACCOUNT ==================== -->
          <div *ngIf="activeMode === 'register'" class="auth-form-scrollable">
            <form (ngSubmit)="handleRegister()">
              <!-- Role Selector -->
              <div class="form-group">
                <label>Register As</label>
                <div class="role-selector-row">
                  <button 
                    type="button" 
                    class="role-choice-pill" 
                    [class.is-selected]="regRole === 'student'" 
                    (click)="regRole = 'student'">
                    <ion-icon name="school-outline"></ion-icon>
                    <span>Student</span>
                  </button>
                  <button 
                    type="button" 
                    class="role-choice-pill" 
                    [class.is-selected]="regRole === 'driver'" 
                    (click)="regRole = 'driver'">
                    <ion-icon name="bicycle-outline"></ion-icon>
                    <span>Driver</span>
                  </button>
                  <button 
                    type="button" 
                    class="role-choice-pill" 
                    [class.is-selected]="regRole === 'admin'" 
                    (click)="regRole = 'admin'">
                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              <!-- Full Name -->
              <div class="form-group">
                <label>Full Name</label>
                <div class="input-field-box">
                  <ion-icon name="person-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="regFullName" 
                    name="regFullName" 
                    placeholder="e.g. Juan Dela Cruz" 
                    required />
                </div>
              </div>

              <!-- Student / Employee ID -->
              <div class="form-group">
                <label>{{ regRole === 'student' ? 'Student ID Number' : 'Employee / License ID' }}</label>
                <div class="input-field-box">
                  <ion-icon name="card-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="regIdNumber" 
                    name="regIdNumber" 
                    [placeholder]="regRole === 'student' ? 'e.g. 2024-01234' : 'e.g. DRV-2024-004'" 
                    required />
                </div>
              </div>

              <!-- University Email -->
              <div class="form-group">
                <label>University / Active Email</label>
                <div class="input-field-box">
                  <ion-icon name="mail-outline"></ion-icon>
                  <input 
                    type="email" 
                    [(ngModel)]="regEmail" 
                    name="regEmail" 
                    placeholder="e.g. juan.delacruz@neust.edu.ph" 
                    required />
                </div>
              </div>

              <!-- Contact Phone Number -->
              <div class="form-group">
                <label>Mobile Number</label>
                <div class="input-field-box">
                  <ion-icon name="call-outline"></ion-icon>
                  <input 
                    type="tel" 
                    [(ngModel)]="regPhone" 
                    name="regPhone" 
                    placeholder="e.g. 0917-123-4567" 
                    required />
                </div>
              </div>

              <!-- College / Department -->
              <div class="form-group">
                <label>College / Department</label>
                <div class="input-field-box">
                  <ion-icon name="school-outline"></ion-icon>
                  <select [(ngModel)]="regDepartment" name="regDepartment" class="native-select">
                    <option value="College of Information & Communications Tech (CICT)">CICT — Information Technology</option>
                    <option value="College of Engineering">COE — College of Engineering</option>
                    <option value="College of Management & Business Tech (CMBT)">CMBT — Management & Business</option>
                    <option value="College of Education">COED — College of Education</option>
                    <option value="College of Nursing & Allied Health">CON — Nursing & Allied Health</option>
                    <option value="University Logistics & Fleet Operations">Campus Logistics & Transportation</option>
                    <option value="General University Administration">General Administration</option>
                  </select>
                </div>
              </div>

              <!-- Assigned Bicycle (If Driver) -->
              <div class="form-group" *ngIf="regRole === 'driver'">
                <label>Assigned Shuttle Bicycle Number</label>
                <div class="input-field-box">
                  <ion-icon name="bicycle-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="regAssignedBike" 
                    name="regAssignedBike" 
                    placeholder="e.g. BIKE-004" />
                </div>
              </div>

              <!-- Google Verified Indicator -->
              <div class="google-verified-strip" *ngIf="isGoogleVerified" style="display: flex; align-items: center; gap: 8px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-size: 12px; color: #15803d; font-weight: 700;">
                <ion-icon name="checkmark-circle-outline" style="font-size: 18px; color: #16a34a;"></ion-icon>
                <span>Verified Google: {{ regEmail }} (No password needed)</span>
              </div>

              <!-- Password -->
              <ng-container *ngIf="!isGoogleVerified">
              <div class="form-group">
                <label>Password (at least 6 characters)</label>
                <div class="input-field-box">
                  <ion-icon name="lock-closed-outline"></ion-icon>
                  <input 
                    [type]="showRegPassword ? 'text' : 'password'" 
                    [(ngModel)]="regPassword" 
                    name="regPassword" 
                    placeholder="Create a strong password" 
                    [required]="!isGoogleVerified" />
                  <button type="button" class="eye-toggle-btn" (click)="showRegPassword = !showRegPassword">
                    <ion-icon [name]="showRegPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                  </button>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="form-group">
                <label>Confirm Password</label>
                <div class="input-field-box">
                  <ion-icon name="lock-closed-outline"></ion-icon>
                  <input 
                    [type]="showRegPassword ? 'text' : 'password'" 
                    [(ngModel)]="regConfirmPassword" 
                    name="regConfirmPassword" 
                    placeholder="Re-enter password" 
                    [required]="!isGoogleVerified" />
                </div>
              </div>
              </ng-container>

              <button type="submit" class="btn-primary-auth">
                <span>Create NEUST Account</span>
                <ion-icon name="arrow-forward-outline"></ion-icon>
              </button>
            </form>
          </div>

        </div>
      </ng-template>
    </ion-modal>

    <!-- Success Toast -->
    <ion-toast
      [isOpen]="showToast"
      [message]="toastMsg"
      [duration]="3000"
      (didDismiss)="showToast = false"
      position="top">
    </ion-toast>
  `,
  styles: [`
    ion-modal {
      --border-radius: 24px 24px 0 0;
      --box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
      --backdrop-opacity: 0.6;
      z-index: 99999 !important;
    }

    .auth-modal-wrapper {
      padding: 20px 20px calc(32px + env(safe-area-inset-bottom, 0px));
      background: #ffffff;
      height: 100%;
      max-height: 100%;
      min-height: 100%;
      box-sizing: border-box;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      display: flex;
      flex-direction: column;
      font-family: inherit;
    }

    .auth-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;

      .auth-brand-snippet {
        display: flex;
        align-items: center;
        gap: 12px;

        .auth-logo-circle {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1d3698 0%, #2563eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(29, 54, 152, 0.3);

          ion-icon {
            font-size: 24px;
            color: #f89318;
          }
        }

        .auth-app-title {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          color: #1d3698;

          span {
            color: #2563eb;
          }
        }

        .auth-app-sub {
          margin: 2px 0 0;
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }
      }

      .auth-x-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #f1f5f9;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #475569;
        font-size: 18px;

        &:active {
          background: #e2e8f0;
        }
      }
    }

    /* Segment Pills */
    .auth-tab-segment {
      display: flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 12px;
      margin-bottom: 16px;

      .auth-segment-btn {
        flex: 1;
        padding: 9px 0;
        border: none;
        background: transparent;
        border-radius: 9px;
        font-size: 13px;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        transition: all 0.18s ease;

        &.is-active {
          background: #ffffff;
          color: #1d3698;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
      }
    }

    /* Error Banner */
    .auth-error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #dc2626;
      font-size: 12px;
      font-weight: 600;

      ion-icon {
        font-size: 18px;
        flex-shrink: 0;
      }
    }

    .google-auth-box {
      margin-bottom: 14px;

      .btn-google-sign {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 11px;
        border-radius: 12px;
        border: 1.5px solid #cbd5e1;
        background: #ffffff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        &:active {
          transform: scale(0.98);
        }
      }
    }

    /* Forms */
    .auth-form-scrollable {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
    }

    .form-group {
      margin-bottom: 14px;

      label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .input-field-box {
        display: flex;
        align-items: center;
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 12px;
        padding: 0 12px;
        height: 46px;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        overflow: hidden;
        transition: border-color 0.18s ease;

        &:focus-within {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        ion-icon {
          color: #94a3b8;
          font-size: 18px;
          margin-right: 8px;
          flex-shrink: 0;
        }

        input {
          flex: 1;
          min-width: 0;
          width: 100%;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          outline: none;

          &::placeholder {
            color: #94a3b8;
            font-weight: 500;
          }
        }

        .native-select {
          flex: 1;
          min-width: 0;
          width: 100%;
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          outline: none;
          cursor: pointer;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .eye-toggle-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #64748b;
          font-size: 18px;
          padding: 4px;
        }
      }
    }

    /* Role Choice Row */
    .role-selector-row {
      display: flex;
      gap: 8px;

      .role-choice-pill {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 0;
        border: 1.5px solid #cbd5e1;
        background: #f8fafc;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;

        ion-icon {
          font-size: 16px;
        }

        &.is-selected {
          border-color: #2563eb;
          background: #eff6ff;
          color: #2563eb;
        }
      }
    }

    .btn-primary-auth {
      width: 100%;
      height: 48px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #1d3698 0%, #2563eb 100%);
      color: #ffffff;
      font-size: 14px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
      margin-top: 18px;
      transition: transform 0.12s ease;

      &:active {
        transform: scale(0.98);
      }
    }

    .auth-divider {
      text-align: center;
      position: relative;
      margin: 22px 0 14px;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #e2e8f0;
      }

      span {
        position: relative;
        background: #ffffff;
        padding: 0 10px;
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
      }
    }

    .demo-quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));
      gap: 8px;

      .demo-pill-btn {
        padding: 10px 6px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 700;
        color: #334155;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 0;

        .demo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;

          &.dot-student { background: #2563eb; }
          &.dot-driver { background: #16a34a; }
          &.dot-admin { background: #d97706; }
        }

        &:hover {
          background: #eff6ff;
          border-color: #2563eb;
        }
      }
    }

    @media (max-width: 360px) {
      .auth-modal-wrapper {
        padding: 16px 14px calc(24px + env(safe-area-inset-bottom, 0px));
      }
      .role-selector-row {
        gap: 6px;
        .role-choice-pill {
          font-size: 11px;
          padding: 9px 4px;
        }
      }
    }
  `]
})
export class AuthModalComponent {
  public activeMode: 'signin' | 'register' = 'signin';
  public errorBanner = '';
  public showToast = false;
  public toastMsg = '';

  // Sign In Form
  public loginIdentifier = '';
  public loginPassword = '';
  public showLoginPassword = false;

  // Register Form
  public regRole: UserRole = 'student';
  public regFullName = '';
  public regIdNumber = '';
  public regEmail = '';
  public regPhone = '';
  public regDepartment = 'College of Information & Communications Tech (CICT)';
  public regAssignedBike = '';
  public regPassword = '';
  public regConfirmPassword = '';
  public showRegPassword = false;
  public isGoogleVerified = false;
  public googleAvatarUrl = '';

  constructor(
    public authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      bicycleOutline,
      personOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      callOutline,
      cardOutline,
      schoolOutline,
      shieldCheckmarkOutline,
      closeOutline,
      arrowForwardOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      sparklesOutline
    });
  }

  public onWillPresent(): void {
    this.activeMode = this.authService.authModalMode || 'signin';
    this.errorBanner = '';
  }

  public closeModal(): void {
    this.authService.isAuthModalOpen = false;
  }

  public async handleGoogleSignIn(): Promise<void> {
    this.errorBanner = '';
    try {
      await SocialLogin.initialize({
        google: {
          webClientId: '232021188558-g0q53j07r2miuv5qc8pb2epi499qh251.apps.googleusercontent.com',
          redirectUrl: window.location.origin
        }
      });
      const response = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile']
        }
      });
      let email = 'student.google@neust.edu.ph';
      let name = '';
      if (response && response.result) {
        const resAny = response.result as any;
        if (resAny.idToken) {
          try {
            const decoded = await SocialLogin.decodeIdToken({ idToken: resAny.idToken });
            email = decoded?.claims?.['email'] || email;
            name = decoded?.claims?.['name'] || name;
          } catch (_) {
            email = resAny.profile?.email || email;
            name = resAny.profile?.name || resAny.profile?.displayName || name;
          }
        } else if (resAny.profile) {
          email = resAny.profile.email || email;
          name = resAny.profile.name || resAny.profile.displayName || name;
        }
      }

      this.ngZone.run(() => {
        const existing = this.authService.findUserByEmail(email);
        if (existing) {
          const res = this.authService.loginWithGoogle(email, existing.role);
          if (res.success) {
            this.toastMsg = res.message;
            this.showToast = true;
            this.authService.isAuthModalOpen = false;
          } else {
            this.errorBanner = res.message;
          }
        } else {
          // New user: Pre-fill the registration form in the modal
          this.activeMode = 'register';
          this.isGoogleVerified = true;
          this.regEmail = email;
          if (name) {
            this.regFullName = name;
          }
          this.toastMsg = 'Verified Google email! Pakikumpleto ang iyong impormasyon sa ibaba.';
          this.showToast = true;
        }
        this.cdr.detectChanges();
      });
    } catch (e: any) {
      console.warn('Native Google Sign-In error:', e);
      this.ngZone.run(() => {
        this.errorBanner = 'Hindi natuloy ang Google Sign-In o kinansela.';
        this.cdr.detectChanges();
      });
    }
  }

  public handleSignIn(): void {
    this.errorBanner = '';
    const res = this.authService.login(this.loginIdentifier, this.loginPassword);
    if (res.success) {
      this.toastMsg = res.message;
      this.showToast = true;
      this.authService.isAuthModalOpen = false;
    } else {
      this.errorBanner = res.message;
    }
  }

  public handleRegister(): void {
    this.errorBanner = '';

    if (this.isGoogleVerified) {
      if (this.regRole === 'student' && !this.regIdNumber.trim()) {
        this.errorBanner = 'Pakilagay ang iyong Student ID Number.';
        return;
      }
      if (this.regRole === 'driver' && !this.regAssignedBike.trim()) {
        this.errorBanner = 'Pakilagay ang iyong bike o pedicab number.';
        return;
      }
      const res = this.authService.registerGoogleUser({
        fullName: this.regFullName.trim() || 'NEUST User',
        email: this.regEmail,
        role: this.regRole,
        idNumber: this.regIdNumber.trim().toUpperCase() || ('ID-' + Date.now().toString().slice(-5)),
        department: this.regDepartment,
        phone: this.regPhone || '0917-000-0000',
        assignedBicycleNumber: this.regRole === 'driver' ? this.regAssignedBike.trim().toUpperCase() : undefined,
        avatarUrl: this.googleAvatarUrl
      });
      this.toastMsg = res.message;
      this.showToast = true;
      if (res.success) {
        this.authService.isAuthModalOpen = false;
        this.isGoogleVerified = false;
      } else {
        this.errorBanner = res.message;
      }
      return;
    }

    if (this.regPassword !== this.regConfirmPassword) {
      this.errorBanner = 'Passwords do not match. Please re-enter.';
      return;
    }

    const dto: RegisterUserDto = {
      fullName: this.regFullName,
      idNumber: this.regIdNumber,
      email: this.regEmail,
      phone: this.regPhone,
      department: this.regDepartment,
      role: this.regRole,
      password: this.regPassword,
      assignedBicycleNumber: this.regRole === 'driver' ? this.regAssignedBike : undefined
    };

    const res = this.authService.createAccount(dto);
    if (res.success) {
      this.toastMsg = res.message;
      this.showToast = true;
      this.authService.isAuthModalOpen = false;
      // Reset form
      this.regFullName = '';
      this.regIdNumber = '';
      this.regEmail = '';
      this.regPhone = '';
      this.regPassword = '';
      this.regConfirmPassword = '';
    } else {
      this.errorBanner = res.message;
    }
  }

  public quickDemoLogin(role: UserRole): void {
    const user = this.authService.loginAsDemo(role);
    this.toastMsg = `Logged in as ${user.fullName} (${role.toUpperCase()}).`;
    this.showToast = true;
  }
}
