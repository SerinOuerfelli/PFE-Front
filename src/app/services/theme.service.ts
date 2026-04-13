import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private nightMode = new BehaviorSubject<boolean>(false);
  nightMode$ = this.nightMode.asObservable();

  toggleTheme() {
    this.nightMode.next(!this.nightMode.value);
  }
}