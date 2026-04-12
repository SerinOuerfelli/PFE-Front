import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { KpiService } from '../services/kpi.service';
import { CommonModule } from '@angular/common';
import { UserOverviewComponent } from '../useroverview/useroverview.component';
import { FormsModule } from '@angular/forms';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { RapportsComponent } from '../rapports/rapports.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule,FormsModule,UserOverviewComponent,AnalyticsComponent,RapportsComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent  {
  activeItem: string = 'My Dashboard'; // default active
  currentContent: string = 'useroverview'; // default content
  kpis: any;

  username: string | null = null;
  email: string | null = null;

  constructor(private router: Router, private kpiService: KpiService) {}

  ngOnInit(): void {
    this.kpiService.getKpis().subscribe(data => {
      this.kpis = data;
    });

    // Load from localStorage
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
}
