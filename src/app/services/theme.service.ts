import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private nightMode = new BehaviorSubject<boolean>(false);
  nightMode$ = this.nightMode.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.updateBodyClass(this.nightMode.value);
  }

  toggleTheme() {
    const isNight = !this.nightMode.value;
    this.nightMode.next(isNight);
    this.updateBodyClass(isNight);
  }

  private updateBodyClass(isNight: boolean) {
    if (isPlatformBrowser(this.platformId)) {
      if (isNight) {
        document.body.classList.add('night-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.remove('night-mode');
        document.body.classList.add('light-mode');
      }
    }
  }
}