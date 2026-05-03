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
import { ChatbotComponent } from '../chatbot/chatbot.component';
import { ChatBubbleComponent } from '../chat-bubble/chat-bubble.component';

import { AgentService } from '../services/agent.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UserOverviewComponent, AnalyticsComponent, RapportsComponent, PredictionComponent, ChatbotComponent, ChatBubbleComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent {
  activeItem: string = 'Dashboard Overview';
  currentContent: string = 'useroverview';
  kpis: any;

  username: string | null = null;
  email: string | null = null;

  retrainLoading = false;
  retrainMessage = '';

  constructor(
    private router: Router,
    private kpiService: KpiService,
    public themeService: ThemeService,
    private agentService: AgentService
  ) {}

  onRetrain(): void {
    this.retrainLoading = true;
    this.retrainMessage = 'AI is learning from live data...';
    
    this.agentService.retrainModel().subscribe({
      next: (res) => {
        this.retrainMessage = 'AI retrained successfully!';
        this.retrainLoading = false;
        setTimeout(() => this.retrainMessage = '', 3000);
      },
      error: (err) => {
        this.retrainMessage = 'Error connecting to AI agent.';
        this.retrainLoading = false;
      }
    });
  }

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
}