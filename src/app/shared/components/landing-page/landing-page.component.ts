import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonToast } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  mapOutline,
  shieldCheckmarkOutline,
  personOutline,
  personAddOutline,
  logInOutline,
  flashOutline,
  peopleOutline,
  locationOutline,
  cashOutline,
  arrowForwardOutline,
  arrowBackOutline,
  sparklesOutline,
  schoolOutline,
  compassOutline,
  checkmarkCircleOutline,
  globeOutline,
  cardOutline,
  lockClosedOutline,
  mailOutline,
  callOutline,
  eyeOutline,
  eyeOffOutline,
  alertCircleOutline,
  logoGoogle,
  closeOutline,
  checkmarkCircle,
  checkmarkDoneOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { UserRole, RegisterUserDto } from '../../../core/models/models';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, IonToast],
  template: `
    <div class="landing-page-root">
      
      <!-- ==================== TOP BRAND HEADER ==================== -->
      <header class="landing-header">
        <div class="brand-group">
          <!-- Back button if in Auth Mode -->
          <button 
            type="button" 
            class="btn-back-landing" 
            *ngIf="viewState === 'auth'" 
            (click)="viewState = 'welcome'" 
            [title]="isFil ? 'Bumalik' : 'Back'">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </button>

          <div class="brand-logo-circle">
            <ion-icon name="bicycle-outline"></ion-icon>
          </div>
          <div class="brand-text">
            <h2 class="brand-name">NEUST <span>BikeGo</span></h2>
            <span class="brand-sub">Sumacab Campus Transit</span>
          </div>
        </div>

        <div class="header-right-actions">
          <!-- Language Toggle Pill -->
          <button 
            type="button" 
            class="btn-lang-toggle" 
            (click)="toggleLanguage()" 
            title="Toggle Language / Wika">
            <ion-icon name="globe-outline"></ion-icon>
            <span>{{ langService.currentLanguage === 'fil' ? 'PH (Filipino)' : 'US (English)' }}</span>
          </button>
        </div>
      </header>

      <!-- ==================== VIEW 1: WELCOME LANDING ==================== -->
      <main class="landing-main-scroll" *ngIf="viewState === 'welcome'">
        
        <!-- Hero Card -->
        <section class="hero-card-section">
          <div class="hero-badge">
            <span class="pulse-indicator"></span>
            <span>{{ isFil ? 'OPISYAL NA CAMPUS TRANSIT • SUMACAB' : 'OFFICIAL CAMPUS TRANSIT • SUMACAB' }}</span>
          </div>

          <h1 class="hero-headline">
            <span class="text-blue">{{ isFil ? 'Mabilis, Ligtas, at' : 'Fast, Safe, and' }}</span><br/>
            <span class="text-gold">{{ isFil ? 'Maginhawang Pasada' : 'Convenient Transit' }}</span><br/>
            <span class="text-dark">{{ isFil ? 'sa Loob ng NEUST' : 'Across NEUST Campus' }}</span>
          </h1>

          <p class="hero-description">
            {{ isFil 
              ? 'Real-time e-shuttle tracking, digital passenger queueing, at maasahang biyahe sa lahat ng gusali at kolehiyo ng NEUST Sumacab.' 
              : 'Real-time e-shuttle tracking, digital passenger queueing, and reliable rides across all buildings and colleges of NEUST Sumacab.' 
            }}
          </p>

          <!-- Primary Call-to-Action Buttons -->
          <div class="hero-actions-container">
            <!-- 1. Mag-Login -->
            <button type="button" class="btn-cta-primary btn-signin" (click)="openAuth('signin')">
              <ion-icon name="log-in-outline"></ion-icon>
              <div class="btn-cta-col">
                <strong>{{ isFil ? 'Mag-Login (Sign In)' : 'Sign In to Account' }}</strong>
                <span>{{ isFil ? 'Gamitin ang Student ID, Email, o Google' : 'Use your Student ID, Email, or Google' }}</span>
              </div>
              <ion-icon name="arrow-forward-outline" class="cta-arrow"></ion-icon>
            </button>

            <!-- 2. Gumawa ng Account -->
            <button type="button" class="btn-cta-secondary btn-register" (click)="openAuth('register')">
              <ion-icon name="person-add-outline"></ion-icon>
              <div class="btn-cta-col">
                <strong>{{ isFil ? 'Gumawa ng Account (Sign Up)' : 'Create New Account' }}</strong>
                <span>{{ isFil ? 'Para sa mga bagong estudyante o driver' : 'Register as new campus passenger or driver' }}</span>
              </div>
              <ion-icon name="arrow-forward-outline" class="cta-arrow"></ion-icon>
            </button>

            <!-- 3. Subukan bilang Bisita (Explore as Guest) -->
            <button type="button" class="btn-cta-outline btn-guest" (click)="authService.enterGuestMode()">
              <ion-icon name="compass-outline"></ion-icon>
              <div class="btn-cta-col">
                <strong>{{ isFil ? 'Subukan bilang Bisita (Explore as Guest)' : 'Explore as Guest Passenger' }}</strong>
                <span>{{ isFil ? 'Tingnan ang mapa at shuttle status' : 'View campus map & live shuttles' }}</span>
              </div>
              <ion-icon name="arrow-forward-outline" class="cta-arrow"></ion-icon>
            </button>
          </div>
        </section>

        <!-- Live Transit Metrics Bar -->
        <section class="live-stats-bar">
          <div class="stat-bubble">
            <span class="sb-val">7</span>
            <span class="sb-lbl">{{ isFil ? 'Aktibong Tricycle' : 'Active Shuttles' }}</span>
          </div>
          <div class="sb-divider"></div>
          <div class="stat-bubble">
            <span class="sb-val">15</span>
            <span class="sb-lbl">{{ isFil ? 'Campus Stations' : 'Campus Stations' }}</span>
          </div>
          <div class="sb-divider"></div>
          <div class="stat-bubble">
            <span class="sb-val text-gold">₱10</span>
            <span class="sb-lbl">{{ isFil ? 'Pamasahe / Head' : 'Fixed Student Fare' }}</span>
          </div>
        </section>

        <!-- Features Showcase Grid -->
        <section class="features-section">
          <h3 class="section-title">{{ isFil ? 'Bakit Gagamitin ang BikeGo?' : 'Why Choose BikeGo?' }}</h3>
          
          <div class="features-grid">
            <!-- Feature 1 -->
            <div class="feature-card">
              <div class="f-icon-box f-blue">
                <ion-icon name="bicycle-outline"></ion-icon>
              </div>
              <div class="f-content">
                <h4>{{ isFil ? 'Real-Time GPS & Bakanteng Upuan' : 'Live GPS & Vacant Seats' }}</h4>
                <p>{{ isFil ? 'Alamin agad kung ilang upuan pa ang bakante bago pumunta sa terminal.' : 'See live bike positions and remaining seats before heading to stations.' }}</p>
              </div>
            </div>

            <!-- Feature 2 -->
            <div class="feature-card">
              <div class="f-icon-box f-gold">
                <ion-icon name="map-outline"></ion-icon>
              </div>
              <div class="f-content">
                <h4>{{ isFil ? 'Ruta sa Bawat Gusali' : 'Direct Campus Routing' }}</h4>
                <p>{{ isFil ? 'Mula Gate Terminal patungong CICT, Engineering, Oval, at Administration.' : 'Convenient pickups between CICT, Engineering, Oval, and Admin.' }}</p>
              </div>
            </div>

            <!-- Feature 3 -->
            <div class="feature-card">
              <div class="f-icon-box f-green">
                <ion-icon name="flash-outline"></ion-icon>
              </div>
              <div class="f-content">
                <h4>{{ isFil ? 'Digital Pila at Pasahero System' : 'Digital Queueing System' }}</h4>
                <p>{{ isFil ? 'Wala nang siksikan o pag-aagawan. Automated queue ticket sa bawat biyahe.' : 'Fair, orderly queue tickets and instant boarding notifications.' }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Demo Quick Access (For evaluators and defense panel) -->
        <section class="demo-switch-section">
          <div class="demo-card-inner">
            <div class="dci-head">
              <ion-icon name="sparkles-outline"></ion-icon>
              <div>
                <h4>{{ isFil ? 'Mabilisang Demo Access (Para sa Evaluators)' : 'Quick Demo Access (For Evaluators)' }}</h4>
                <span>{{ isFil ? 'Subukan agad ang iba\'t ibang user portal' : 'Instantly log in to evaluate specific roles' }}</span>
              </div>
            </div>

            <div class="demo-buttons-row">
              <button type="button" class="btn-demo-pill demo-student" (click)="quickLogin('student')">
                <ion-icon name="school-outline"></ion-icon>
                <span>{{ isFil ? 'Estudyante (Student)' : 'Student Demo' }}</span>
              </button>

              <button type="button" class="btn-demo-pill demo-driver" (click)="quickLogin('driver')">
                <ion-icon name="bicycle-outline"></ion-icon>
                <span>{{ isFil ? 'Driver (BIKE-003)' : 'Driver Demo' }}</span>
              </button>

              <button type="button" class="btn-demo-pill demo-admin" (click)="quickLogin('admin')">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <span>{{ isFil ? 'Admin Dispatcher' : 'Admin Demo' }}</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Footer Notice -->
        <footer class="landing-footer">
          <p class="univ-title">Nueva Ecija University of Science and Technology</p>
          <p class="campus-title">Sumacab Campus • Cabanatuan City, Nueva Ecija</p>
          <span class="copyright">College of Information and Communications Technology (CICT) Project • BikeGo 2.0</span>
        </footer>

      </main>

      <!-- ==================== VIEW 2: AUTH VIEW (LOGIN / REGISTER) ==================== -->
      <main class="landing-main-scroll auth-container-scroll" *ngIf="viewState === 'auth'">
        
        <div class="auth-card-wrapper">
          <!-- Alert / Error Banner -->
          <div class="auth-error-banner" *ngIf="errorBanner">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <span>{{ errorBanner }}</span>
          </div>

          <!-- ==================== GOOGLE ONBOARDING VIEW ==================== -->
          <div *ngIf="authMode === 'google_register'" class="google-onboarding-wrapper">
            <!-- Back Button Bar -->
            <div class="goc-top-bar">
              <button type="button" class="btn-goc-back" (click)="cancelGoogleRegister()">
                <ion-icon name="arrow-back-outline"></ion-icon>
                <span>{{ isFil ? 'Bumalik sa Login' : 'Back to Sign In' }}</span>
              </button>
              <span class="goc-tag-pill">{{ isFil ? 'Bagong Account' : 'New Account' }}</span>
            </div>

            <!-- Verified Google Banner -->
            <div class="google-verified-strip">
              <div class="gvs-avatar" *ngIf="googleAvatarUrl">
                <img [src]="googleAvatarUrl" alt="Google Profile" referrerpolicy="no-referrer" (error)="googleAvatarUrl = ''" />
              </div>
              <div class="gvs-avatar gvs-placeholder" *ngIf="!googleAvatarUrl">
                <ion-icon name="person-outline"></ion-icon>
              </div>
              <div class="gvs-info">
                <div class="gvs-badge">
                  <ion-icon name="checkmark-circle"></ion-icon>
                  <span>{{ isFil ? 'Google Email Na-verify' : 'Verified Google Account' }}</span>
                </div>
                <strong class="gvs-name">{{ googleFullName || (selectedRole === 'driver' ? 'Juan Dela Cruz' : 'NEUST Student') }}</strong>
                <span class="gvs-email">{{ googleEmail }}</span>
              </div>
            </div>

            <div class="goc-intro">
              <h3>{{ isFil ? 'Kumpletuhin ang Rehistrasyon' : 'Complete Registration' }}</h3>
              <p>{{ isFil ? 'Piliin ang iyong role at ilagay ang kinakailangang impormasyon:' : 'Select your role and provide the required details:' }}</p>
            </div>

            <!-- Role Selector Pills -->
            <div class="role-selector-pills">
              <button 
                type="button" 
                class="role-pill-btn" 
                [class.is-selected]="selectedRole === 'student'" 
                (click)="selectedRole = 'student'">
                <ion-icon name="school-outline"></ion-icon>
                <span>{{ isFil ? 'Estudyante' : 'Student' }}</span>
              </button>
              <button 
                type="button" 
                class="role-pill-btn" 
                [class.is-selected]="selectedRole === 'driver'" 
                (click)="selectedRole = 'driver'">
                <ion-icon name="bicycle-outline"></ion-icon>
                <span>{{ isFil ? 'Pedicab Driver' : 'Pedicab Driver' }}</span>
              </button>
            </div>

            <!-- Student Form -->
            <div *ngIf="selectedRole === 'student'" class="onboarding-fields-group">
              <div class="form-field-group">
                <label>{{ isFil ? 'Student ID Number' : 'Student ID Number' }} <span class="required-star">*</span></label>
                <div class="input-box">
                  <ion-icon name="card-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="studentIdNumber" 
                    name="studentIdNumber"
                    [placeholder]="isFil ? 'Hal. 2024-10492-SC-0' : 'e.g. 2024-10492-SC-0'" 
                    required />
                </div>
                <span class="field-hint">{{ isFil ? 'Gagamitin para sa opisyal na student verification at pila' : 'Used for campus transit validation' }}</span>
              </div>

              <div class="form-field-group">
                <label>{{ isFil ? 'Kolehiyo / Departamento' : 'College / Department' }} <span class="required-star">*</span></label>
                <div class="input-box">
                  <ion-icon name="school-outline"></ion-icon>
                  <select [(ngModel)]="studentDepartment" name="studentDepartment" class="native-dropdown">
                    <option *ngFor="let dept of departmentOptions" [value]="dept">{{ dept }}</option>
                  </select>
                </div>
              </div>

              <div class="form-field-group">
                <label>{{ isFil ? 'Numero ng Telepono (Contact Number)' : 'Contact Number' }}</label>
                <div class="input-box">
                  <ion-icon name="call-outline"></ion-icon>
                  <input 
                    type="tel" 
                    [(ngModel)]="studentPhone" 
                    name="studentPhone"
                    [placeholder]="isFil ? 'Hal. 0917-123-4567' : 'e.g. 0917-123-4567'" />
                </div>
              </div>

              <button type="button" class="btn-submit-auth btn-submit-gold" (click)="submitGoogleRegistration()">
                <ion-icon name="checkmark-done-outline"></ion-icon>
                <span>{{ isFil ? 'Isumite at Pumasok bilang Estudyante' : 'Register & Enter as Student' }}</span>
              </button>
            </div>

            <!-- Driver Form -->
            <div *ngIf="selectedRole === 'driver'" class="onboarding-fields-group">
              <div class="form-field-group">
                <label>{{ isFil ? 'Buong Pangalan ng Driver' : 'Driver Full Name' }} <span class="required-star">*</span></label>
                <div class="input-box">
                  <ion-icon name="person-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="driverFullName" 
                    name="driverFullName"
                    [placeholder]="isFil ? 'Hal. Juan Dela Cruz' : 'e.g. Juan Dela Cruz'" 
                    required />
                </div>
              </div>

              <div class="form-field-group">
                <label>{{ isFil ? 'Numero ng Pedicab / Bike' : 'Assigned Pedicab / Bike Number' }} <span class="required-star">*</span></label>
                <div class="input-box">
                  <ion-icon name="bicycle-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="driverBikeNumber" 
                    name="driverBikeNumber"
                    [placeholder]="isFil ? 'Hal. BIKE-001 o PEDICAB-01' : 'e.g. BIKE-001 or PEDICAB-01'" 
                    required />
                </div>
                <div class="quick-bike-chips">
                  <span class="qbc-label">{{ isFil ? 'Mabilisang pili:' : 'Quick Select:' }}</span>
                  <button 
                    type="button" 
                    class="qbc-chip" 
                    *ngFor="let bike of bikeChips" 
                    [class.chip-active]="driverBikeNumber === bike"
                    (click)="driverBikeNumber = bike">
                    {{ bike }}
                  </button>
                </div>
              </div>

              <div class="form-field-group">
                <label>{{ isFil ? 'Numero ng Telepono (Contact Number)' : 'Contact Number' }} <span class="required-star">*</span></label>
                <div class="input-box">
                  <ion-icon name="call-outline"></ion-icon>
                  <input 
                    type="tel" 
                    [(ngModel)]="driverPhone" 
                    name="driverPhone"
                    [placeholder]="isFil ? 'Hal. 0917-123-4567' : 'e.g. 0917-123-4567'" 
                    required />
                </div>
              </div>

              <button type="button" class="btn-submit-auth btn-submit-gold" (click)="submitGoogleRegistration()">
                <ion-icon name="bicycle-outline"></ion-icon>
                <span>{{ isFil ? 'Isumite at Pumasok bilang Driver' : 'Register & Enter as Driver' }}</span>
              </button>
            </div>
          </div>

          <!-- ==================== REGULAR SIGN IN / REGISTER ==================== -->
          <ng-container *ngIf="authMode !== 'google_register'">
            <!-- Auth Mode Segment Tabs -->
            <div class="auth-tab-segment">
              <button 
                type="button"
                class="auth-segment-btn" 
                [class.is-active]="authMode === 'signin'" 
                (click)="authMode = 'signin'; errorBanner = ''">
                <ion-icon name="log-in-outline"></ion-icon>
                <span>{{ isFil ? 'Mag-Login' : 'Sign In' }}</span>
              </button>
              <button 
                type="button"
                class="auth-segment-btn" 
                [class.is-active]="authMode === 'register'" 
                (click)="authMode = 'register'; errorBanner = ''">
                <ion-icon name="person-add-outline"></ion-icon>
                <span>{{ isFil ? 'Gumawa ng Account' : 'Create Account' }}</span>
              </button>
            </div>

          <!-- ==========================================
               SIGN IN WITH GOOGLE (NEUST Institutional)
               ========================================== -->
          <div class="google-auth-container">
            <button type="button" class="btn-google-auth" (click)="triggerGoogleSignIn()">
              <!-- Official Multicolored Google 'G' SVG Logo -->
              <svg class="google-svg-icon" viewBox="0 0 24 24" width="22" height="22">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <div class="google-btn-text">
                <strong>{{ isFil ? 'Magpatuloy gamit ang Google' : 'Continue with Google' }}</strong>
                <span>{{ isFil ? 'Gamitin ang iyong institutional @neust.edu.ph account' : 'Sign in with your account' }}</span>
              </div>
            </button>
          </div>

          <!-- Divider -->
          <div class="auth-divider">
            <span>{{ isFil ? 'o gamit ang iyong ID at Password' : 'or with your ID and Password' }}</span>
          </div>

          <!-- ==================== TAB A: SIGN IN FORM ==================== -->
          <div *ngIf="authMode === 'signin'" class="form-container">
            <form (ngSubmit)="handleManualSignIn()">
              <!-- ID Number or Email -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Student ID Number o Email' : 'Student ID Number or Email' }}</label>
                <div class="input-box">
                  <ion-icon name="person-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="loginIdentifier" 
                    name="loginIdentifier" 
                    [placeholder]="isFil ? 'Hal. 2023-01042 o maria@neust.edu.ph' : 'e.g. 2023-01042 or maria@neust.edu.ph'" 
                    required />
                </div>
              </div>

              <!-- Password -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Password' : 'Password' }}</label>
                <div class="input-box">
                  <ion-icon name="lock-closed-outline"></ion-icon>
                  <input 
                    [type]="showLoginPassword ? 'text' : 'password'" 
                    [(ngModel)]="loginPassword" 
                    name="loginPassword" 
                    [placeholder]="isFil ? 'Ipasok ang iyong password' : 'Enter your password'" 
                    required />
                  <button type="button" class="btn-toggle-eye" (click)="showLoginPassword = !showLoginPassword">
                    <ion-icon [name]="showLoginPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                  </button>
                </div>
              </div>

              <!-- Submit Sign In -->
              <button type="submit" class="btn-submit-auth">
                <ion-icon name="log-in-outline"></ion-icon>
                <span>{{ isFil ? 'Pumasok sa BikeGo' : 'Sign In to BikeGo' }}</span>
              </button>
            </form>

            <!-- Quick Demo One-Click Access -->
            <div class="auth-sub-divider">
              <span>{{ isFil ? 'Mabilisang Subok (Demo Accounts)' : 'Quick Demo Logins' }}</span>
            </div>

            <div class="demo-quick-row">
              <button type="button" class="demo-btn-chip student" (click)="quickLogin('student')">
                <ion-icon name="school-outline"></ion-icon>
                <span>Student Maria</span>
              </button>
              <button type="button" class="demo-btn-chip driver" (click)="quickLogin('driver')">
                <ion-icon name="bicycle-outline"></ion-icon>
                <span>Driver Juan</span>
              </button>
              <button type="button" class="demo-btn-chip admin" (click)="quickLogin('admin')">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <span>Admin Roberto</span>
              </button>
            </div>
          </div>

          <!-- ==================== TAB B: REGISTER FORM ==================== -->
          <div *ngIf="authMode === 'register'" class="form-container">
            <form (ngSubmit)="handleManualRegister()">
              <!-- Role Choice -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Mag-rehistro bilang' : 'Register As' }}</label>
                <div class="role-selector-pills">
                  <button 
                    type="button" 
                    class="role-pill-btn" 
                    [class.is-selected]="regRole === 'student'" 
                    (click)="regRole = 'student'">
                    <ion-icon name="school-outline"></ion-icon>
                    <span>{{ isFil ? 'Estudyante' : 'Student' }}</span>
                  </button>
                  <button 
                    type="button" 
                    class="role-pill-btn" 
                    [class.is-selected]="regRole === 'driver'" 
                    (click)="regRole = 'driver'">
                    <ion-icon name="bicycle-outline"></ion-icon>
                    <span>{{ isFil ? 'Shuttle Driver' : 'Shuttle Driver' }}</span>
                  </button>
                </div>
              </div>

              <!-- Full Name -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Buong Pangalan' : 'Full Name' }} *</label>
                <div class="input-box">
                  <ion-icon name="person-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="regFullName" 
                    name="regFullName" 
                    [placeholder]="isFil ? 'Hal. Juan Dela Cruz' : 'e.g. Juan Dela Cruz'" 
                    required />
                </div>
              </div>

              <!-- ID Number -->
              <div class="form-field-group">
                <label>{{ regRole === 'student' ? (isFil ? 'Student ID Number *' : 'Student ID Number *') : (isFil ? 'Driver / Employee License ID *' : 'Driver / Employee ID *') }}</label>
                <div class="input-box">
                  <ion-icon name="card-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="regIdNumber" 
                    name="regIdNumber" 
                    [placeholder]="isFil ? 'Hal. 2024-00123' : 'e.g. 2024-00123'" 
                    required />
                </div>
              </div>

              <!-- University Email -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Email Address' : 'Email Address' }} *</label>
                <div class="input-box">
                  <ion-icon name="mail-outline"></ion-icon>
                  <input 
                    type="email" 
                    [(ngModel)]="regEmail" 
                    name="regEmail" 
                    [placeholder]="isFil ? 'Hal. juan@neust.edu.ph' : 'e.g. juan@neust.edu.ph'" 
                    required />
                </div>
              </div>

              <!-- Phone Number -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Numero ng Telepono' : 'Phone Number' }} *</label>
                <div class="input-box">
                  <ion-icon name="call-outline"></ion-icon>
                  <input 
                    type="tel" 
                    [(ngModel)]="regPhone" 
                    name="regPhone" 
                    [placeholder]="isFil ? 'Hal. 0917-123-4567' : 'e.g. 0917-123-4567'" 
                    required />
                </div>
              </div>

              <!-- Department -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Kolehiyo / Department' : 'College / Department' }}</label>
                <div class="input-box">
                  <ion-icon name="school-outline"></ion-icon>
                  <select [(ngModel)]="regDepartment" name="regDepartment" class="native-dropdown">
                    <option value="College of Information & Communications Tech (CICT)">CICT — Information Technology</option>
                    <option value="College of Engineering">COE — College of Engineering</option>
                    <option value="College of Management & Business Tech (CMBT)">CMBT — Management & Business</option>
                    <option value="College of Education">COED — College of Education</option>
                    <option value="College of Nursing & Allied Health">CON — Nursing & Allied Health</option>
                    <option value="Campus Transportation Services">Campus Transportation & Fleet</option>
                    <option value="General University Administration">General Administration</option>
                  </select>
                </div>
              </div>

              <!-- Assigned Bicycle (If Driver) -->
              <div class="form-field-group" *ngIf="regRole === 'driver'">
                <label>{{ isFil ? 'Assigned Shuttle Bike Number' : 'Assigned Bike Number' }}</label>
                <div class="input-box">
                  <ion-icon name="bicycle-outline"></ion-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="regAssignedBike" 
                    name="regAssignedBike" 
                    [placeholder]="isFil ? 'Hal. BIKE-003' : 'e.g. BIKE-003'" />
                </div>
              </div>

              <!-- Password -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Password (kahit 6 na titik)' : 'Password (at least 6 characters)' }} *</label>
                <div class="input-box">
                  <ion-icon name="lock-closed-outline"></ion-icon>
                  <input 
                    [type]="showRegPassword ? 'text' : 'password'" 
                    [(ngModel)]="regPassword" 
                    name="regPassword" 
                    [placeholder]="isFil ? 'Gumawa ng password' : 'Create a password'" 
                    required />
                  <button type="button" class="btn-toggle-eye" (click)="showRegPassword = !showRegPassword">
                    <ion-icon [name]="showRegPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                  </button>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="form-field-group">
                <label>{{ isFil ? 'Ulitin ang Password' : 'Confirm Password' }} *</label>
                <div class="input-box">
                  <ion-icon name="lock-closed-outline"></ion-icon>
                  <input 
                    [type]="showRegPassword ? 'text' : 'password'" 
                    [(ngModel)]="regConfirmPassword" 
                    name="regConfirmPassword" 
                    [placeholder]="isFil ? 'I-type muli ang password' : 'Confirm your password'" 
                    required />
                </div>
              </div>

              <!-- Submit Register -->
              <button type="submit" class="btn-submit-auth btn-submit-gold">
                <ion-icon name="person-add-outline"></ion-icon>
                <span>{{ isFil ? 'Isumite at Gumawa ng Account' : 'Register NEUST Account' }}</span>
              </button>
            </form>
          </div>

          <!-- Bottom Switch View Prompt -->
          <div class="auth-bottom-switch">
            <span *ngIf="authMode === 'signin'">
              {{ isFil ? 'Wala ka pa bang account?' : "Don't have an account yet?" }}
              <button type="button" class="btn-switch-link" (click)="authMode = 'register'; errorBanner = ''">
                {{ isFil ? 'Mag-Register Dito' : 'Register Here' }}
              </button>
            </span>
            <span *ngIf="authMode === 'register'">
              {{ isFil ? 'May account ka na ba?' : 'Already have an account?' }}
              <button type="button" class="btn-switch-link" (click)="authMode = 'signin'; errorBanner = ''">
                {{ isFil ? 'Mag-Login Dito' : 'Sign In Here' }}
              </button>
            </span>
          </div>
          </ng-container>

        </div>

      </main>

      <ion-toast [isOpen]="showToast" [message]="toastMsg" [duration]="2500" (didDismiss)="showToast = false"></ion-toast>

    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    .landing-page-root {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
      max-height: 100dvh;
      width: 100%;
      background: #f8fafc;
      color: #0f172a;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      position: relative;
    }

    /* Top Brand Header */
    .landing-header {
      min-height: 62px;
      padding: max(10px, env(safe-area-inset-top, 0px)) 14px 10px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-shrink: 0;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      z-index: 10;

      .brand-group {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex: 1;

        .btn-back-landing {
          width: 34px;
          height: 34px;
          min-width: 34px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 1px solid #cbd5e1;
          background: #f1f5f9;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          cursor: pointer;
          transition: all 0.15s ease;

          &:active {
            transform: scale(0.92);
            background: #e2e8f0;
          }
        }

        .brand-logo-circle {
          width: 38px;
          height: 38px;
          min-width: 38px;
          flex-shrink: 0;
          border-radius: 11px;
          background: linear-gradient(135deg, #0a2558 0%, #1e40af 100%);
          color: #fbbf24;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          box-shadow: 0 4px 10px rgba(10, 37, 88, 0.25);
        }

        .brand-text {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;

          .brand-name {
            margin: 0;
            font-size: clamp(16px, 4.4vw, 18.5px);
            font-weight: 900;
            color: #0a2558;
            letter-spacing: -0.4px;
            line-height: 1.15;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            span {
              color: #d97706;
            }
          }

          .brand-sub {
            display: block;
            font-size: 9.5px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            line-height: 1.2;
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      .header-right-actions {
        flex-shrink: 0;
      }

      .btn-lang-toggle {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 10px;
        border-radius: 20px;
        border: 1px solid #cbd5e1;
        background: #f1f5f9;
        color: #334155;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
        cursor: pointer;
        transition: all 0.2s ease;

        ion-icon {
          font-size: 15px;
          color: #1e40af;
          flex-shrink: 0;
        }

        &:active {
          transform: scale(0.95);
          background: #e2e8f0;
        }
      }
    }

    /* Scrollable Body */
    .landing-main-scroll {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      padding: 16px 16px calc(96px + env(safe-area-inset-bottom, 0px));
      display: flex;
      flex-direction: column;
      gap: 16px;

      > * {
        flex-shrink: 0;
      }
    }

    /* Hero Section */
    .hero-card-section {
      background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
      border: 1px solid #dcfce7;
      border-radius: 20px;
      padding: 22px 18px 20px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #dbeafe;
        color: #1e40af;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.5px;
        margin-bottom: 14px;
        border: 1px solid #bfdbfe;

        .pulse-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: badgePulse 2s infinite;
        }
      }

      .hero-headline {
        margin: 0 0 12px;
        font-size: clamp(21px, 6vw, 26px);
        font-weight: 900;
        line-height: 1.15;
        letter-spacing: -0.6px;

        .text-blue {
          color: #0a2558;
        }

        .text-gold {
          color: #b45309;
        }

        .text-dark {
          color: #0f172a;
        }
      }

      .hero-description {
        margin: 0 0 20px;
        font-size: 13.5px;
        line-height: 1.5;
        color: #475569;
        font-weight: 500;
      }
    }

    /* CTA Buttons */
    .hero-actions-container {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .btn-cta-primary, .btn-cta-secondary, .btn-cta-outline {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 13px 16px;
        border-radius: 14px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        width: 100%;

        ion-icon:first-child {
          font-size: 24px;
          flex-shrink: 0;
        }

        .btn-cta-col {
          flex: 1;
          display: flex;
          flex-direction: column;

          strong {
            font-size: 15px;
            font-weight: 800;
            line-height: 1.2;
          }

          span {
            font-size: 11px;
            font-weight: 500;
            opacity: 0.85;
            margin-top: 2px;
          }
        }

        .cta-arrow {
          font-size: 18px;
          opacity: 0.7;
          flex-shrink: 0;
        }

        &:active {
          transform: scale(0.98);
        }
      }

      /* 1. Sign In */
      .btn-signin {
        background: linear-gradient(135deg, #0a2558 0%, #1d4ed8 100%);
        color: #ffffff;
        box-shadow: 0 6px 18px rgba(29, 78, 216, 0.28);

        ion-icon:first-child {
          color: #fbbf24;
        }
      }

      /* 2. Register */
      .btn-register {
        background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
        color: #ffffff;
        box-shadow: 0 6px 18px rgba(217, 119, 6, 0.24);

        ion-icon:first-child {
          color: #ffffff;
        }
      }

      /* 3. Guest */
      .btn-guest {
        background: #ffffff;
        color: #0f172a;
        border: 1.5px solid #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        ion-icon:first-child {
          color: #2563eb;
        }

        &:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
      }
    }

    /* Live Stats Bar */
    .live-stats-bar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

      .stat-bubble {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        .sb-val {
          font-size: 18px;
          font-weight: 900;
          color: #0a2558;
          line-height: 1.1;

          &.text-gold {
            color: #d97706;
          }
        }

        .sb-lbl {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-top: 3px;
        }
      }

      .sb-divider {
        width: 1px;
        height: 28px;
        background: #e2e8f0;
      }
    }

    /* Features Section */
    .features-section {
      .section-title {
        font-size: 16px;
        font-weight: 900;
        color: #0f172a;
        margin: 6px 0 12px;
        letter-spacing: -0.2px;
      }

      .features-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .feature-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px 14px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);

          .f-icon-box {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;

            &.f-blue {
              background: #eff6ff;
              color: #1d4ed8;
            }

            &.f-gold {
              background: #fef3c7;
              color: #d97706;
            }

            &.f-green {
              background: #dcfce7;
              color: #16a34a;
            }
          }

          .f-content {
            flex: 1;

            h4 {
              margin: 0 0 3px;
              font-size: 13.5px;
              font-weight: 800;
              color: #0f172a;
            }

            p {
              margin: 0;
              font-size: 12px;
              color: #64748b;
              line-height: 1.4;
            }
          }
        }
      }
    }

    /* Demo Quick Access */
    .demo-switch-section {
      .demo-card-inner {
        background: #f1f5f9;
        border: 1px dashed #cbd5e1;
        border-radius: 16px;
        padding: 14px;

        .dci-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;

          ion-icon {
            font-size: 18px;
            color: #d97706;
          }

          h4 {
            margin: 0;
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
          }

          span {
            font-size: 10.5px;
            color: #64748b;
          }
        }

        .demo-buttons-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 7px;

          .btn-demo-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 12px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            transition: all 0.15s ease;

            ion-icon {
              font-size: 16px;
            }

            &.demo-student {
              color: #1e40af;
              border-color: #bfdbfe;
              background: #f8faff;
            }

            &.demo-driver {
              color: #047857;
              border-color: #a7f3d0;
              background: #f0fdf4;
            }

            &.demo-admin {
              color: #7c3aed;
              border-color: #ddd6fe;
              background: #faf5ff;
            }

            &:active {
              transform: scale(0.97);
            }
          }
        }
      }
    }

    /* ==============================================================
       VIEW 2: AUTH CARD & FORM STYLES
       ============================================================== */
    .auth-container-scroll {
      padding-top: 12px;
      padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px)) !important;
    }

    .auth-card-wrapper {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 18px 16px 32px;
      margin-bottom: 24px;
      box-shadow: 0 6px 24px rgba(15, 23, 42, 0.06);

      .auth-tab-segment {
        display: flex;
        background: #f1f5f9;
        border-radius: 12px;
        padding: 4px;
        margin-bottom: 16px;
        gap: 4px;

        .auth-segment-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 8px;
          border-radius: 10px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;

          ion-icon {
            font-size: 16px;
          }

          &.is-active {
            background: #ffffff;
            color: #0a2558;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          }
        }
      }

      .auth-error-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 12px;
        padding: 10px 12px;
        color: #b91c1c;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 14px;

        ion-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
      }

      /* Google Sign In Banner */
      .google-auth-container {
        margin-bottom: 16px;

        .btn-google-auth {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;

          .google-svg-icon {
            flex-shrink: 0;
          }

          .google-btn-text {
            flex: 1;
            display: flex;
            flex-direction: column;

            strong {
              font-size: 13.5px;
              font-weight: 800;
              color: #1e293b;
              line-height: 1.2;
            }

            span {
              font-size: 10.5px;
              color: #64748b;
              margin-top: 2px;
            }
          }

          &:hover {
            border-color: #94a3b8;
            background: #f8fafc;
          }

          &:active {
            transform: scale(0.98);
          }
        }
      }

      .auth-divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin: 14px 0 16px;

        &::before, &::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }

        span {
          padding: 0 10px;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
      }

      /* Shared Form Fields & Buttons (Applies to Sign In, Register, and Google Onboarding) */
      .form-container {
        display: flex;
        flex-direction: column;
      }

      .form-field-group {
        margin-bottom: 14px;
        min-width: 0;
        width: 100%;

        label {
          display: block;
          font-size: 12px;
          font-weight: 800;
          color: #334155;
          margin-bottom: 6px;
        }

        .required-star {
          color: #ef4444;
        }

        .field-hint {
          display: block;
          font-size: 10.5px;
          color: #64748b;
          margin-top: 5px;
          line-height: 1.35;
        }

        .input-box {
          display: flex;
          align-items: center;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          padding: 0 12px;
          height: 46px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow: hidden;
          transition: all 0.2s ease;

          ion-icon {
            font-size: 18px;
            color: #64748b;
            margin-right: 10px;
            flex-shrink: 0;
          }

          input {
            flex: 1;
            min-width: 0;
            border: none;
            background: transparent;
            font-size: 13.5px;
            font-weight: 600;
            color: #0f172a;
            outline: none;
            width: 100%;

            &::placeholder {
              color: #94a3b8;
              font-size: 12.5px;
              font-weight: 500;
            }
          }

          .native-dropdown {
            flex: 1;
            min-width: 0;
            border: none;
            background: transparent;
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            outline: none;
            width: 100%;
            cursor: pointer;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }

          .btn-toggle-eye {
            background: transparent;
            border: none;
            color: #64748b;
            font-size: 18px;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }

          &:focus-within {
            border-color: #2563eb;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);

            ion-icon {
              color: #2563eb;
            }
          }
        }
      }

      .role-selector-pills {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 14px;

        .role-pill-btn {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 11px 8px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
          background: #f8fafc;
          color: #475569;
          font-size: clamp(11.5px, 3.3vw, 13px);
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;

          ion-icon {
            font-size: 17px;
            flex-shrink: 0;
          }

          &.is-selected {
            border-color: #2563eb;
            background: #eff6ff;
            color: #1d4ed8;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.14);
          }
        }
      }

      .btn-submit-auth {
        width: 100%;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 13px 16px;
        border-radius: 12px;
        background: linear-gradient(135deg, #0a2558 0%, #1d4ed8 100%);
        color: #ffffff;
        font-size: 14px;
        font-weight: 800;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(29, 78, 216, 0.28);
        margin-top: 8px;
        transition: all 0.2s ease;

        ion-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        &.btn-submit-gold {
          background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.28);
        }

        &:active {
          transform: scale(0.98);
        }
      }

      .auth-sub-divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin: 18px 0 12px;

        &::before, &::after {
          content: '';
          flex: 1;
          border-bottom: 1px dashed #cbd5e1;
        }

        span {
          padding: 0 8px;
          font-size: 10.5px;
          font-weight: 700;
          color: #64748b;
        }
      }

      .demo-quick-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;

        @media (max-width: 340px) {
          grid-template-columns: 1fr;
        }

        .demo-btn-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 9px 4px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 10.5px;
          font-weight: 800;
          cursor: pointer;
          color: #334155;
          min-width: 0;
          text-align: center;

          @media (max-width: 340px) {
            flex-direction: row;
            gap: 6px;
            padding: 9px 10px;
          }

          ion-icon {
            font-size: 16px;
            flex-shrink: 0;
          }

          span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          &.student { color: #1e40af; border-color: #bfdbfe; background: #eff6ff; }
          &.driver { color: #047857; border-color: #a7f3d0; background: #f0fdf4; }
          &.admin { color: #7c3aed; border-color: #ddd6fe; background: #faf5ff; }

          &:active { transform: scale(0.95); }
        }
      }

      .auth-bottom-switch {
        margin-top: 18px;
        text-align: center;
        font-size: 12px;
        color: #64748b;

        .btn-switch-link {
          background: transparent;
          border: none;
          color: #2563eb;
          font-weight: 800;
          cursor: pointer;
          text-decoration: underline;
          padding: 0 4px;
        }
      }

      /* Google Onboarding Card Wrapper & Styles */
      .google-onboarding-wrapper {
        display: flex;
        flex-direction: column;

        .goc-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;

          .btn-goc-back {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 11.5px;
            font-weight: 700;
            color: #334155;
            cursor: pointer;

            ion-icon {
              font-size: 14px;
            }

            &:active {
              background: #e2e8f0;
            }
          }

          .goc-tag-pill {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #fef3c7;
            color: #92400e;
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid #fde68a;
          }
        }

        .google-verified-strip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          border-radius: 14px;
          margin-bottom: 14px;

          .gvs-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            overflow: hidden;
            border: 2px solid #22c55e;
            flex-shrink: 0;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            &.gvs-placeholder {
              background: #dcfce7;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              color: #15803d;
            }
          }

          .gvs-info {
            display: flex;
            flex-direction: column;
            min-width: 0;

            .gvs-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 10.5px;
              font-weight: 800;
              color: #16a34a;
              margin-bottom: 2px;

              ion-icon {
                font-size: 13px;
              }
            }

            .gvs-name {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .gvs-email {
              font-size: 11px;
              color: #475569;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }

        .goc-intro {
          margin-bottom: 14px;

          h3 {
            margin: 0 0 4px;
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
          }

          p {
            margin: 0;
            font-size: 12px;
            color: #64748b;
          }
        }

        .role-selector-pills {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;

          .role-pill-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 10px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            background: #f8fafc;
            font-size: 13px;
            font-weight: 800;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s ease;

            ion-icon {
              font-size: 18px;
            }

            &.is-selected {
              border-color: #2563eb;
              background: #eff6ff;
              color: #1d4ed8;
              box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
            }
          }
        }

        .onboarding-fields-group {
          display: flex;
          flex-direction: column;

          .required-star {
            color: #ef4444;
          }

          .field-hint {
            display: block;
            font-size: 10.5px;
            color: #64748b;
            margin-top: 4px;
          }

          .quick-bike-chips {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;

            .qbc-label {
              font-size: 10.5px;
              font-weight: 700;
              color: #64748b;
            }

            .qbc-chip {
              padding: 4px 10px;
              border-radius: 20px;
              border: 1px solid #cbd5e1;
              background: #ffffff;
              font-size: 11px;
              font-weight: 700;
              color: #334155;
              cursor: pointer;
              transition: all 0.15s ease;

              &:hover {
                border-color: #2563eb;
                color: #2563eb;
              }

              &.chip-active {
                background: #2563eb;
                border-color: #2563eb;
                color: #ffffff;
              }
            }
          }
        }
      }
    }

    /* Footer */
    .landing-footer {
      text-align: center;
      padding: 16px 8px 8px;
      border-top: 1px solid #e2e8f0;

      .univ-title {
        margin: 0;
        font-size: 11.5px;
        font-weight: 800;
        color: #334155;
      }

      .campus-title {
        margin: 2px 0 6px;
        font-size: 10.5px;
        color: #64748b;
      }

      .copyright {
        font-size: 9.5px;
        color: #94a3b8;
        display: block;
      }
    }

    @keyframes badgePulse {
      0% {
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
      }
    }

    @media (max-width: 375px) {
      .landing-header {
        padding: max(10px, env(safe-area-inset-top, 0px)) 12px 10px;

        .brand-group .brand-logo-circle {
          width: 38px;
          height: 38px;
          font-size: 20px;
        }

        .brand-group .brand-text .brand-name {
          font-size: 17px;
        }
      }

      .landing-main-scroll {
        padding: 12px 12px calc(96px + env(safe-area-inset-bottom, 0px));
      }

      .hero-card-section {
        padding: 18px 14px 16px;
      }

      .auth-card-wrapper {
        padding: 16px 14px 32px;
        margin-bottom: 24px;
      }
    }
  `]
})
export class LandingPageComponent implements OnInit {
  public viewState: 'welcome' | 'auth' = 'welcome';
  public authMode: 'signin' | 'register' | 'google_register' = 'signin';

  public errorBanner = '';
  public showToast = false;
  public toastMsg = '';

  // Google Sign In / Registration State
  public googleEmail = '';
  public googleFullName = '';
  public googleAvatarUrl = '';
  public selectedRole: 'student' | 'driver' = 'student';

  // Google Student Fields
  public studentIdNumber = '';
  public studentDepartment = 'College of Information & Communications Tech (CICT)';
  public studentPhone = '';

  // Google Driver Fields
  public driverFullName = '';
  public driverBikeNumber = 'BIKE-001';
  public driverPhone = '';

  public bikeChips = ['BIKE-001', 'BIKE-002', 'BIKE-003', 'BIKE-004', 'PEDICAB-01', 'PEDICAB-02'];

  public departmentOptions: string[] = [
    'College of Information & Communications Tech (CICT)',
    'College of Engineering (COE)',
    'College of Management & Business Tech (CMBT)',
    'College of Education (COED)',
    'College of Nursing & Allied Health (CON)',
    'College of Architecture (COA)',
    'College of Criminology (COC)',
    'College of Arts & Sciences (CAS)',
    'Campus Transportation Services'
  ];

  // Sign In Form state
  public loginIdentifier = '';
  public loginPassword = '';
  public showLoginPassword = false;

  // Register Form state
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

  constructor(
    public authService: AuthService,
    public langService: LanguageService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      bicycleOutline,
      mapOutline,
      shieldCheckmarkOutline,
      personOutline,
      personAddOutline,
      logInOutline,
      flashOutline,
      peopleOutline,
      locationOutline,
      cashOutline,
      arrowForwardOutline,
      arrowBackOutline,
      sparklesOutline,
      schoolOutline,
      compassOutline,
      checkmarkCircleOutline,
      globeOutline,
      cardOutline,
      lockClosedOutline,
      mailOutline,
      callOutline,
      eyeOutline,
      eyeOffOutline,
      alertCircleOutline,
      logoGoogle,
      closeOutline,
      checkmarkCircle,
      checkmarkDoneOutline
    });
  }

  ngOnInit(): void {
    // Listen for external open requests
    this.authService.isAuthModalOpen$.subscribe(isOpen => {
      if (isOpen && !this.authService.isAuthenticated) {
        this.openAuth(this.authService.authModalMode || 'signin');
      }
    });
  }

  public get isFil(): boolean {
    return this.langService.currentLanguage === 'fil';
  }

  public toggleLanguage(): void {
    const nextLang = this.langService.currentLanguage === 'fil' ? 'en' : 'fil';
    this.langService.setLanguage(nextLang);
  }

  public openAuth(mode: 'signin' | 'register' = 'signin'): void {
    this.authMode = mode;
    this.viewState = 'auth';
    this.errorBanner = '';
  }

  public async triggerGoogleSignIn(): Promise<void> {
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
      let avatarUrl = '';
      if (response && response.result) {
        const resAny = response.result as any;
        if (resAny.idToken) {
          try {
            const decoded = await SocialLogin.decodeIdToken({ idToken: resAny.idToken });
            email = decoded?.claims?.['email'] || email;
            name = decoded?.claims?.['name'] || name;
            avatarUrl = decoded?.claims?.['picture'] || avatarUrl;
          } catch (_) {
            email = resAny.profile?.email || email;
            name = resAny.profile?.name || resAny.profile?.displayName || name;
            avatarUrl = resAny.profile?.imageUrl || resAny.profile?.avatarUrl || avatarUrl;
          }
        } else if (resAny.profile) {
          email = resAny.profile.email || email;
          name = resAny.profile.name || resAny.profile.displayName || name;
          avatarUrl = resAny.profile.imageUrl || resAny.profile.avatarUrl || avatarUrl;
        }
      }

      this.ngZone.run(() => {
        const existing = this.authService.findUserByEmail(email);
        if (existing) {
          this.completeGoogleLogin(email, existing.role);
        } else {
          // Direct transition to registration form!
          this.googleEmail = email;
          this.googleFullName = name || 'NEUST Google User';
          this.googleAvatarUrl = avatarUrl;
          this.driverFullName = name || '';
          this.driverBikeNumber = 'BIKE-001';
          this.studentIdNumber = '';
          this.selectedRole = 'student';
          this.viewState = 'auth';
          this.authMode = 'google_register';
          this.toastMsg = this.isFil ? 'Verified Google email! Pakikumpleto ang iyong impormasyon sa rehistrasyon.' : 'Verified Google email! Please complete your registration details.';
          this.showToast = true;
          this.cdr.detectChanges();
        }
      });
    } catch (e) {
      console.warn('Native Google Sign-In prompt unavailable or cancelled:', e);
      this.ngZone.run(() => {
        this.errorBanner = this.isFil ? 'Kinansela o hindi natuloy ang Google Sign-In.' : 'Google Sign-In was cancelled or unavailable.';
        this.cdr.detectChanges();
      });
    }
  }

  public completeGoogleLogin(email: string, role: UserRole = 'student'): void {
    const res = this.authService.loginWithGoogle(email, role);
    if (res.success) {
      this.toastMsg = res.message;
      this.showToast = true;
      this.viewState = 'welcome';
    } else {
      this.errorBanner = res.message;
    }
    this.cdr.detectChanges();
  }

  public submitGoogleRegistration(): void {
    this.errorBanner = '';

    if (this.selectedRole === 'student') {
      if (!this.studentIdNumber.trim()) {
        this.errorBanner = this.isFil ? 'Pakilagay ang iyong Student ID Number.' : 'Please enter your Student ID Number.';
        this.toastMsg = this.errorBanner;
        this.showToast = true;
        return;
      }

      const res = this.authService.registerGoogleUser({
        fullName: this.googleFullName || 'NEUST Student',
        email: this.googleEmail,
        role: 'student',
        idNumber: this.studentIdNumber.trim().toUpperCase(),
        department: this.studentDepartment,
        phone: this.studentPhone || '0917-000-0000',
        avatarUrl: this.googleAvatarUrl
      });

      this.toastMsg = res.message;
      this.showToast = true;
      if (res.success) {
        this.viewState = 'welcome';
      } else {
        this.errorBanner = res.message;
      }
      this.cdr.detectChanges();
    } else {
      // Driver / Pedicab
      if (!this.driverFullName.trim()) {
        this.errorBanner = this.isFil ? 'Pakilagay ang buong pangalan ng driver.' : 'Please enter driver full name.';
        this.toastMsg = this.errorBanner;
        this.showToast = true;
        return;
      }
      if (!this.driverBikeNumber.trim()) {
        this.errorBanner = this.isFil ? 'Pakilagay ang numero ng iyong bike o pedicab.' : 'Please enter your bike / pedicab number.';
        this.toastMsg = this.errorBanner;
        this.showToast = true;
        return;
      }
      if (!this.driverPhone.trim()) {
        this.errorBanner = this.isFil ? 'Pakilagay ang iyong numero ng telepono (contact number).' : 'Please enter contact number.';
        this.toastMsg = this.errorBanner;
        this.showToast = true;
        return;
      }

      const res = this.authService.registerGoogleUser({
        fullName: this.driverFullName.trim(),
        email: this.googleEmail,
        role: 'driver',
        idNumber: 'DRV-' + this.driverBikeNumber.trim().toUpperCase(),
        assignedBicycleNumber: this.driverBikeNumber.trim().toUpperCase(),
        department: 'NEUST Fleet & Campus Safety Transport',
        phone: this.driverPhone.trim(),
        avatarUrl: this.googleAvatarUrl
      });

      this.toastMsg = res.message;
      this.showToast = true;
      if (res.success) {
        this.viewState = 'welcome';
      } else {
        this.errorBanner = res.message;
      }
      this.cdr.detectChanges();
    }
  }

  public cancelGoogleRegister(): void {
    this.authMode = 'signin';
    this.errorBanner = '';
  }

  public handleManualSignIn(): void {
    this.errorBanner = '';
    const res = this.authService.login(this.loginIdentifier, this.loginPassword);
    if (res.success) {
      this.toastMsg = res.message;
      this.showToast = true;
      this.viewState = 'welcome';
    } else {
      this.errorBanner = res.message;
    }
  }

  public handleManualRegister(): void {
    this.errorBanner = '';

    if (this.regPassword !== this.regConfirmPassword) {
      this.errorBanner = this.isFil ? 'Hindi magkatugma ang mga password. Paki-ulit.' : 'Passwords do not match. Please re-enter.';
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
      this.viewState = 'welcome';
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

  public quickLogin(role: UserRole): void {
    const user = this.authService.loginAsDemo(role);
    this.toastMsg = `Logged in as ${user.fullName} (${role.toUpperCase()}).`;
    this.showToast = true;
    this.viewState = 'welcome';
  }
}
