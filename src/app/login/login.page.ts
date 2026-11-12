import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonToast,
  IonSpinner
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  personOutline,
  lockClosedOutline,
  arrowForwardOutline,
  logoGoogle,
  alertCircleOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  schoolOutline,
  callOutline,
  cardOutline,
  shieldCheckmarkOutline,
  checkmarkCircle,
  chevronBackOutline
} from 'ionicons/icons';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { AuthService } from '../core/services/auth.service';
import { UserRole } from '../core/models/models';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonToast,
    IonSpinner
  ]
})
export class LoginPage implements OnInit {
  public viewMode: 'login' | 'google_register' = 'login';

  public email = '';
  public password = '';
  public isLoading = false;
  public toastMessage = '';
  public showToast = false;

  // --- Google Onboarding / Registration State ---
  public googleEmail = '';
  public googleFullName = '';
  public googleAvatarUrl = '';

  public selectedRole: 'student' | 'driver' = 'student';

  // Student Fields
  public studentIdNumber = '';
  public studentDepartment = 'College of Information & Communications Technology (CICT)';
  public studentPhone = '';

  // Driver Fields
  public driverFullName = '';
  public driverBikeNumber = 'BIKE-003';
  public driverPhone = '';

  public departmentOptions = [
    'College of Information & Communications Technology (CICT)',
    'College of Engineering (COE)',
    'College of Management & Business Technology (CMBT)',
    'College of Education (COED)',
    'College of Nursing (CON)',
    'College of Arts and Sciences (CAS)',
    'Senior High School / Basic Education'
  ];

  public quickBikeOptions = ['BIKE-001', 'BIKE-002', 'BIKE-003', 'BIKE-004', 'PEDICAB-01', 'PEDICAB-02'];

  constructor(
    public authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      bicycleOutline,
      personOutline,
      lockClosedOutline,
      arrowForwardOutline,
      logoGoogle,
      alertCircleOutline,
      checkmarkCircleOutline,
      checkmarkDoneOutline,
      schoolOutline,
      callOutline,
      cardOutline,
      shieldCheckmarkOutline,
      checkmarkCircle,
      chevronBackOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.initSocialLogin();
  }

  /**
   * Initializes the SocialLogin plugin with webClientId configuration
   */
  async initSocialLogin(): Promise<void> {
    try {
      await SocialLogin.initialize({
        google: {
          webClientId: '232021188558-g0q53j07r2miuv5qc8pb2epi499qh251.apps.googleusercontent.com',
          redirectUrl: window.location.origin
        }
      });
      console.log('SocialLogin successfully initialized with Google webClientId');
    } catch (err) {
      console.warn('SocialLogin.initialize notice:', err);
    }
  }

  /**
   * Triggers Google Sign-In using @capgo/capacitor-social-login
   */
  async signInWithGoogle(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await SocialLogin.login({
        provider: 'google',
        options: {}
      });

      console.log('Google login success response:', response);

      let email = 'student.google@neust.edu.ph';
      let name = 'NEUST Google User';
      let avatarUrl = '';

      if (response && response.result) {
        const resAny = response.result as any;
        if (resAny.idToken) {
          try {
            const decoded = await SocialLogin.decodeIdToken({ idToken: resAny.idToken });
            if (decoded?.claims) {
              email = decoded.claims['email'] || email;
              name = decoded.claims['name'] || name;
              avatarUrl = decoded.claims['picture'] || '';
            }
          } catch (_) {
            if (resAny.profile) {
              email = resAny.profile.email || email;
              name = resAny.profile.name || resAny.profile.displayName || name;
              avatarUrl = resAny.profile.imageUrl || resAny.profile.picture || '';
            }
          }
        } else if (resAny.profile) {
          email = resAny.profile.email || email;
          name = resAny.profile.name || resAny.profile.displayName || name;
          avatarUrl = resAny.profile.imageUrl || resAny.profile.picture || '';
        }
      }

      this.ngZone.run(() => {
        // Check if user is already registered in our local users database
        const existingUser = this.authService.findUserByEmail(email);

        if (existingUser) {
          // User already has an account: Log in directly and proceed to /home
          const authRes = this.authService.loginWithGoogle(email, existingUser.role);
          this.toastMessage = `Maligayang pagbabalik, ${existingUser.fullName}!`;
          this.showToast = true;
          this.router.navigate(['/home']);
        } else {
          // NEW USER: Transition to Profile Completion / Registration Form!
          this.googleEmail = email;
          this.googleFullName = name;
          this.googleAvatarUrl = avatarUrl;
          this.driverFullName = name;
          this.viewMode = 'google_register';
          this.toastMessage = 'Email verified! Pakikumpleto ang iyong impormasyon sa ibaba.';
          this.showToast = true;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } catch (error: any) {
      console.error('Google Sign-In failed or was cancelled:', error);
      this.ngZone.run(() => {
        if (error?.message && !error.message.includes('cancel')) {
          this.toastMessage = 'Google Sign-In: ' + error.message;
        } else {
          this.toastMessage = 'Google Sign-In cancelled or unavailable.';
        }
        this.showToast = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  /**
   * Completes and saves registration for verified Google user
   */
  submitGoogleRegistration(): void {
    if (this.selectedRole === 'student') {
      if (!this.studentIdNumber.trim()) {
        this.toastMessage = 'Pakilagay ang iyong Student ID / Number.';
        this.showToast = true;
        return;
      }
      if (!this.studentDepartment) {
        this.toastMessage = 'Pakipili ang iyong Kolehiyo o Departamento.';
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

      this.toastMessage = res.message;
      this.showToast = true;
      this.router.navigate(['/home']);

    } else if (this.selectedRole === 'driver') {
      if (!this.driverFullName.trim()) {
        this.toastMessage = 'Pakilagay ang iyong Pangalan bilang Driver.';
        this.showToast = true;
        return;
      }
      if (!this.driverBikeNumber.trim()) {
        this.toastMessage = 'Pakilagay ang iyong Assigned Bike / Pedicab Number.';
        this.showToast = true;
        return;
      }
      if (!this.driverPhone.trim()) {
        this.toastMessage = 'Pakilagay ang iyong Contact Number.';
        this.showToast = true;
        return;
      }

      const res = this.authService.registerGoogleUser({
        fullName: this.driverFullName.trim(),
        email: this.googleEmail,
        role: 'driver',
        idNumber: 'DRV-' + (this.driverBikeNumber.trim().toUpperCase() || '003'),
        assignedBicycleNumber: this.driverBikeNumber.trim().toUpperCase(),
        department: 'NEUST Fleet & Campus Safety Transport',
        phone: this.driverPhone.trim(),
        avatarUrl: this.googleAvatarUrl
      });

      this.toastMessage = res.message;
      this.showToast = true;
      this.router.navigate(['/home']);
    }
  }

  cancelGoogleRegister(): void {
    this.viewMode = 'login';
  }

  handleManualLogin(): void {
    if (!this.email.trim() || !this.password) {
      this.toastMessage = 'Please enter your ID/Email and password.';
      this.showToast = true;
      return;
    }

    const res = this.authService.login(this.email, this.password);
    this.toastMessage = res.message;
    this.showToast = true;

    if (res.success) {
      this.router.navigate(['/home']);
    }
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}

