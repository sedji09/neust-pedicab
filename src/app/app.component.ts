import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [CommonModule, IonApp, IonRouterOutlet],
  styles: [`
    .bikego-splash-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: linear-gradient(160deg, #07193d 0%, #0a2558 55%, #123b88 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      transition: opacity 0.35s ease, visibility 0.35s ease;
      animation: splashAutoFade 0.4s ease 1.35s forwards;
    }

    .bikego-splash-overlay.is-hiding {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    @keyframes splashAutoFade {
      to {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
    }

    .splash-logo-ring {
      width: auto;
      max-width: 240px;
      height: auto;
      padding: 12px 18px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.94);
      border: 1.5px solid rgba(251, 191, 36, 0.55);
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35), 0 0 32px rgba(251, 191, 36, 0.25);
      animation: splashPulse 1.5s ease-in-out infinite;
    }

    .splash-logo-img {
      width: 180px;
      height: auto;
      object-fit: contain;
      display: block;
    }

    .splash-title {
      margin: 20px 0 4px;
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.4px;
    }

    .splash-title span {
      color: #fbbf24;
    }

    .splash-sub {
      margin: 0 0 26px;
      font-size: 12.5px;
      font-weight: 600;
      color: rgba(226, 232, 240, 0.85);
      letter-spacing: 0.4px;
    }

    .splash-loader-track {
      width: 160px;
      height: 4px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.16);
      overflow: hidden;
    }

    .splash-loader-bar {
      width: 45%;
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #fbbf24, #fde68a);
      animation: splashSlide 1.1s ease-in-out infinite;
    }

    @keyframes splashPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    @keyframes splashSlide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(260%); }
    }
  `]
})
export class AppComponent implements OnInit {
  public showSplash = true;
  public isHidingSplash = false;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        this.isHidingSplash = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showSplash = false;
          this.cdr.detectChanges();
        }, 380);
      });
    }, 1250);
  }
}
