import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bicycleOutline,
  schoolOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
  callOutline,
  closeOutline,
  flashOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/models';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon
  ],
  template: `
    <ion-modal [isOpen]="isOpen" (didDismiss)="onClose()">
      <ng-template>
        <ion-header class="ion-no-border">
          <ion-toolbar color="primary">
            <ion-title>{{ authMode === 'login' ? 'NEUST BikeGo Login' : 'Create Account' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="onClose()">
                <ion-icon name="close-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <!-- Auth Mode Segment -->
          <div class="auth-segment-wrap">
            <button class="seg-btn" [class.active]="authMode === 'login'" (click)="authMode = 'login'">Sign In</button>
            <button class="seg-btn" [class.active]="authMode === 'register'" (click)="authMode = 'register'">Register</button>
            <button class="seg-btn" [class.active]="authMode === 'forgot'" (click)="authMode = 'forgot'">Reset</button>
          </div>

          <!-- Sign In Form -->
          <div *ngIf="authMode === 'login'" class="auth-form-body">
            <div class="form-group">
              <label>NEUST Email Address</label>
              <input type="email" [(ngModel)]="email" placeholder="student@neust.edu.ph" class="form-input" />
            </div>

            <div class="form-group" style="margin-top: 12px;">
              <label>Password</label>
              <input type="password" [(ngModel)]="password" placeholder="••••••••" class="form-input" />
            </div>

            <div class="form-group" style="margin-top: 12px;">
              <label>Select Role</label>
              <select [(ngModel)]="selectedRole" class="form-input custom-select">
                <option value="student">Student / Passenger</option>
                <option value="driver">Bicycle Operator / Driver</option>
                <option value="admin">Campus Administrator</option>
              </select>
            </div>

            <button class="btn-submit-auth" (click)="submitLogin()">
              Sign In to BikeGo
            </button>
          </div>

          <!-- Register Form -->
          <div *ngIf="authMode === 'register'" class="auth-form-body">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="regFullName" placeholder="e.g. Juan dela Cruz" class="form-input" />
            </div>
            <div class="form-group" style="margin-top: 10px;">
              <label>Student ID / Driver License No.</label>
              <input type="text" [(ngModel)]="regIdNumber" placeholder="2024-00123" class="form-input" />
            </div>
            <div class="form-group" style="margin-top: 10px;" *ngIf="selectedRole !== 'driver'">
              <label>College / Department</label>
              <input type="text" [(ngModel)]="regDepartment" placeholder="e.g. CICT or Engineering" class="form-input" />
            </div>
            <div class="form-group" style="margin-top: 10px;">
              <label>NEUST Email</label>
              <input type="email" [(ngModel)]="regEmail" placeholder="user@neust.edu.ph" class="form-input" />
            </div>
            <div class="form-group" style="margin-top: 10px;">
              <label>Password</label>
              <input type="password" [(ngModel)]="regPassword" placeholder="Minimum 8 characters" class="form-input" />
            </div>

            <button class="btn-submit-auth" (click)="submitRegister()">
              Complete Registration
            </button>
          </div>

          <!-- Forgot Password Form -->
          <div *ngIf="authMode === 'forgot'" class="auth-form-body">
            <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
              Enter your registered NEUST email. A password recovery verification code will be dispatched.
            </p>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="student@neust.edu.ph" class="form-input" />
            </div>
            <button class="btn-submit-auth" style="margin-top: 16px;" (click)="authMode = 'login'">
              Send Reset Instructions
            </button>
          </div>

        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .auth-segment-wrap {
      display: flex;
      background: #f1f5f9;
      border-radius: 10px;
      padding: 4px;
      gap: 4px;
      margin-bottom: 16px;

      .seg-btn {
        flex: 1;
        border: none;
        background: none;
        padding: 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;

        &.active {
          background: #0f2b48;
          color: #ffffff;
        }
      }
    }

    .demo-login-box {
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 18px;

      .demo-head {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 800;
        color: #1e40af;
        margin-bottom: 8px;
      }

      .demo-buttons {
        display: flex;
        gap: 6px;

        .demo-btn {
          flex: 1;
          border: none;
          padding: 8px 4px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #ffffff;
          cursor: pointer;

          &.demo-student { background: #2563eb; }
          &.demo-driver { background: #10b981; }
          &.demo-admin { background: #0f2b48; }
        }
      }
    }

    .form-group {
      label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 4px;
      }

      .form-input {
        width: 100%;
        padding: 10px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
      }
    }

    .btn-submit-auth {
      width: 100%;
      border: none;
      background: #0f2b48;
      color: #ffffff;
      padding: 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 800;
      margin-top: 20px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(15, 43, 72, 0.25);
    }
  `]
})
export class AuthModalComponent {
  public isOpen = false;
  public authMode: 'login' | 'register' | 'forgot' = 'login';

  public email = 'maria.santos@neust.edu.ph';
  public password = '••••••••';
  public selectedRole: UserRole = 'student';

  public regFullName = '';
  public regIdNumber = '';
  public regDepartment = 'CICT';
  public regEmail = '';
  public regPassword = '';

  @Output() close = new EventEmitter<void>();

  constructor(public authService: AuthService) {
    addIcons({
      bicycleOutline,
      schoolOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      mailOutline,
      personOutline,
      callOutline,
      closeOutline,
      flashOutline,
      checkmarkCircleOutline
    });
  }

  public open(): void {
    this.isOpen = true;
  }

  public onClose(): void {
    this.isOpen = false;
    this.close.emit();
  }

  public submitLogin(): void {
    this.authService.login(this.email, 'password123');
    this.onClose();
  }

  public submitRegister(): void {
    this.authService.setSession({
      id: 'reg-' + Date.now(),
      fullName: this.regFullName || 'New User',
      email: this.regEmail || 'user@neust.edu.ph',
      role: 'student',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      phone: '0917-000-0000',
      idNumber: this.regIdNumber || '2024-99999',
      department: this.regDepartment,
      accountStatus: 'active'
    });
    this.onClose();
  }
}
