import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { KpiService } from '../services/kpi.service';
import { CommonModule } from '@angular/common';
import { UserOverviewComponent } from '../useroverview/useroverview.component';
import { FormsModule } from '@angular/forms';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { RapportsComponent } from '../rapports/rapports.component';
import { ThemeService } from '../services/theme.service';
import { PredictionComponent } from '../prediction/prediction.component';
import { RecommendationComponent } from '../recommendation/recommendation.component';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UserOverviewComponent, AnalyticsComponent, RapportsComponent, PredictionComponent, RecommendationComponent],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrl: './superadmin-dashboard.component.css'
})
export class SuperadminDashboardComponent {
activeItem: string = 'My Dashboard';
  currentContent: string = 'useroverview';
  kpis: any;

  username: string | null = null;
  email: string | null = null;

  constructor(
    private router: Router,
    private kpiService: KpiService,
    public themeService: ThemeService
  ) {}
  ngOnInit(): void {
    this.kpiService.getKpis().subscribe(data => {
      this.kpis = data;
    });

    this.username = localStorage.getItem('username');
    this.email = localStorage.getItem('email');
  }
  loadContent(target: string) {
    this.currentContent = target;
  }

  setActive(item: string): void {
    this.activeItem = item;
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  alertsDropdownOpen: boolean = false;

toggleAlertsDropdown() {
  this.alertsDropdownOpen = !this.alertsDropdownOpen;
}
aiDropdownOpen: boolean = false;

toggleAiDropdown() {
  this.aiDropdownOpen = !this.aiDropdownOpen;
}



}
