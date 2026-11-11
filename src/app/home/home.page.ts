import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  bicycleOutline,
  flashOutline,
  shieldCheckmarkOutline,
  notificationsOutline
} from 'ionicons/icons';
import { AuthService } from '../core/services/auth.service';
import { StateService } from '../core/services/state.service';
import { NotificationService, InAppToast } from '../core/services/notification.service';
import { AppHeaderComponent } from '../shared/components/app-header/app-header.component';
import { StudentDashboardComponent } from '../modules/student/student-dashboard.component';
import { DriverDashboardComponent } from '../modules/driver/driver-dashboard.component';
import { AdminDashboardComponent } from '../modules/admin/admin-dashboard.component';
import { AuthModalComponent } from '../shared/components/auth-modal/auth-modal.component';
import { NotificationsPageComponent } from '../shared/components/notifications-page/notifications-page.component';
import { ProfilePageComponent } from '../shared/components/profile-page/profile-page.component';
import { LandingPageComponent } from '../shared/components/landing-page/landing-page.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    LandingPageComponent,
    AppHeaderComponent,
    StudentDashboardComponent,
    DriverDashboardComponent,
    AdminDashboardComponent,
    AuthModalComponent,
    NotificationsPageComponent,
    ProfilePageComponent
  ]
})
export class HomePage implements OnInit {
  constructor(
    public authService: AuthService,
    public stateService: StateService,
    public notificationService: NotificationService,
    private route: ActivatedRoute
  ) {
    addIcons({
      closeOutline,
      bicycleOutline,
      flashOutline,
      shieldCheckmarkOutline,
      notificationsOutline
    });
  }

  ngOnInit(): void {
    const roleFromData = this.route.snapshot.data['role'];
    const roleFromQuery = this.route.snapshot.queryParams['role'];
    const targetRole = roleFromData || roleFromQuery;
    if (targetRole && (targetRole === 'student' || targetRole === 'driver' || targetRole === 'admin')) {
      if (this.authService.role !== targetRole) {
        this.authService.switchRole(targetRole);
      }
    }
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
      this.stateService.closeProfilePage();
      this.stateService.setActiveTab('queue');
    } else {
      this.stateService.closeProfilePage();
      this.stateService.openNotificationsPage();
    }
  }
}
