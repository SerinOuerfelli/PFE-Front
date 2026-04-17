import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { DecisionComponent } from '../decision/decision.component';
import { EquipmentOverviewComponent } from '../equipment-overview/equipment-overview.component';
import { NotificationService, UnreadCounts } from '../services/notification.service';
import { UserManagementComponent } from '../user-management/user-management.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UserOverviewComponent, AnalyticsComponent, RapportsComponent, PredictionComponent, RecommendationComponent, DecisionComponent, EquipmentOverviewComponent, UserManagementComponent],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrl: './superadmin-dashboard.component.css'
})
export class SuperadminDashboardComponent implements OnInit, OnDestroy{
activeItem: string = 'Equipment Overview';
  currentContent: string = 'useroverview';
  kpis: any;

  username: string | null = null;
  email: string | null = null;
  
  unread: UnreadCounts = { predictions: 0, recommendations: 0, decisions: 0, total: 0 };

  constructor(
    private router: Router,
    private kpiService: KpiService,
    public themeService: ThemeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.kpiService.getKpis().subscribe(data => {
      this.kpis = data;
    });

    this.username = localStorage.getItem('username');
    this.email = localStorage.getItem('email');

    // Subscribe to notification counts and start polling
    this.notificationService.unread$.subscribe(counts => this.unread = counts);
    this.notificationService.startPolling(3000); 
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  loadContent(target: string) {
    this.currentContent = target;
    
    // Clear notifications for AI categories when viewed
    if (target === 'predictions') this.notificationService.markAsSeen('predictions');
    if (target === 'recommendations') this.notificationService.markAsSeen('recommendations');
    if (target === 'decision-support') this.notificationService.markAsSeen('decisions');
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
    // Optional: Only clear parent notification when dropdown drops if we want, but usually better to let user click the specific tab.
  }
}
