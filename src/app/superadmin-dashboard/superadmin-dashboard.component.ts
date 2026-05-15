import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { KpiService } from '../services/kpi.service';
import { CommonModule } from '@angular/common';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
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
import { ToastService } from '../services/toast.service';
import { MetricsComponent } from '../metrics/metrics.component';
import { ChatbotComponent } from '../chatbot/chatbot.component';
import { ChatBubbleComponent } from '../chat-bubble/chat-bubble.component';
import { ToastNotificationsComponent } from '../toast-notifications/toast-notifications.component';

import { AgentService } from '../services/agent.service';
import { PasswordCheckService } from '../services/password-check.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UserOverviewComponent, AnalyticsComponent, RapportsComponent, PredictionComponent, RecommendationComponent, DecisionComponent, EquipmentOverviewComponent, UserManagementComponent, MetricsComponent, ChatbotComponent, ChatBubbleComponent, ToastNotificationsComponent],
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

  retrainLoading = false;
  retrainMessage = '';

  private kpiPollingSub?: Subscription;

  constructor(
    private router: Router,
    private kpiService: KpiService,
    public themeService: ThemeService,
    private notificationService: NotificationService,
    private agentService: AgentService,
    private toastService: ToastService,
    private passwordCheckService: PasswordCheckService
  ) {}

  onRetrain(): void {
    this.retrainLoading = true;
    this.retrainMessage = 'AI is learning from live data...';
    
    this.agentService.retrainModel().subscribe({
      next: (res) => {
        this.retrainMessage = 'AI retrained successfully!';
        this.retrainLoading = false;
        this.toastService.success('AI Model retrained successfully with latest production data.');
        this.notificationService.addNotification('AI Model Retrained (Superadmin)', 'success');
        setTimeout(() => this.retrainMessage = '', 3000);
      },
      error: (err) => {
        this.retrainMessage = 'Error connecting to AI agent.';
        this.retrainLoading = false;
        this.toastService.error('Failed to connect to AI Chaos Agent.');
      }
    });
  }

  ngOnInit(): void {
    // Polling for KPIs
    this.kpiPollingSub = interval(10000)
      .pipe(
        startWith(0),
        switchMap(() => this.kpiService.getKpis())
      )
      .subscribe({
        next: (data) => this.kpis = data,
        error: (err) => console.error('Dashboard KPI poll error:', err)
      });

    this.username = localStorage.getItem('username');
    this.email = localStorage.getItem('email');

    this.passwordCheckService.checkPasswordStatus();
  }

  ngOnDestroy(): void {
    // this.notificationService.stopPolling();
    this.kpiPollingSub?.unsubscribe();
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
