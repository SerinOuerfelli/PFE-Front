import { Component, OnInit } from '@angular/core';
import { KpiService } from '../services/kpi.service';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { NotificationService, SystemNotification } from '../services/notification.service';
import { ToastService } from '../services/toast.service';

Chart.register(...registerables);

@Component({
  selector: 'app-useroverview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './useroverview.component.html',
  styleUrls: ['./useroverview.component.css']
})
export class UserOverviewComponent implements OnInit {
  kpis: any;
  isNightMode: boolean = false;
  downloading: boolean = false;
  private pollingSub?: Subscription;
  systemNotifications: SystemNotification[] = [];

  get topClientsEntries(): [string, number][] {
    if (!this.kpis?.TopClientsByTransactions) return [];
    return Object.entries(this.kpis.TopClientsByTransactions)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 8) as [string, number][];
  }

  get txByDateEntries(): [string, number][] {
    if (!this.kpis?.TransactionsByDate) return [];
    return Object.entries(this.kpis.TransactionsByDate)
      .sort((a, b) => a[0].localeCompare(b[0])) as [string, number][];
  }

  constructor(
    private kpiService: KpiService, 
    public themeService: ThemeService,
    private notifService: NotificationService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.themeService.nightMode$.subscribe(isNight => {
      this.isNightMode = isNight;
      if (this.kpis) this.renderAllCharts(isNight);
    });

    // Start 10s polling for real-time data
    this.pollingSub = interval(10000)
      .pipe(
        startWith(0),
        switchMap(() => this.kpiService.getKpis())
      )
      .subscribe({
        next: (data) => {
          this.kpis = data;
          setTimeout(() => this.renderAllCharts(this.isNightMode), 0);
        },
        error: (err) => console.error('Failed to poll KPIs:', err)
      });

    this.notifService.systemNotifications$.subscribe(notifs => {
      this.systemNotifications = notifs;
    });
  }

  clearAllNotifications() {
    this.notifService.clearNotifications();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'info': return 'fas fa-info-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-times-circle';
      default: return 'fas fa-bell';
    }
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  private renderAllCharts(isNight: boolean) {
    this.renderTransactionsByDateChart(isNight);
    this.renderChannelChart(isNight);
    this.renderRecommendationsChart(isNight);
    this.renderTopClientsChart(isNight);
    this.renderRatesChart(isNight);
  }

  private textColor(isNight: boolean) { return isNight ? '#e2e8f0' : '#1e293b'; }
  private gridColor(isNight: boolean) { return isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'; }

  renderTransactionsByDateChart(isNight: boolean) {
    const canvas = document.getElementById('txByDateChart') as HTMLCanvasElement;
    if (!canvas || !this.kpis?.TransactionsByDate) return;
    Chart.getChart(canvas)?.destroy();

    const sorted = Object.entries(this.kpis.TransactionsByDate)
      .sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sorted.map(([d]) => d.slice(5));   // "MM-DD"
    const values = sorted.map(([, v]) => v as number);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Transactions / Day',
          data: values,
          borderColor: '#6366f1',
          backgroundColor: isNight ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.45,
          pointRadius: 5,
          pointBackgroundColor: '#6366f1',
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 900 },
        plugins: {
          legend: { labels: { color: this.textColor(isNight), font: { weight: 'bold' } } },
          title: { display: false }
        },
        scales: {
          x: { ticks: { color: this.textColor(isNight) }, grid: { color: this.gridColor(isNight) } },
          y: {
            ticks: { color: this.textColor(isNight), stepSize: 1 },
            grid: { color: this.gridColor(isNight) },
            beginAtZero: true
          }
        }
      }
    });
  }

  renderChannelChart(isNight: boolean) {
    const canvas = document.getElementById('channelChart') as HTMLCanvasElement;
    if (!canvas || !this.kpis?.TransactionsByChannel) return;
    Chart.getChart(canvas)?.destroy();

    const labels = Object.keys(this.kpis.TransactionsByChannel);
    const values = Object.values(this.kpis.TransactionsByChannel) as number[];

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#6366f1', '#0ea5e9', '#f59e0b'],
          borderWidth: 2,
          borderColor: isNight ? '#1e293b' : '#ffffff',
          hoverOffset: 12
        }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: this.textColor(isNight), padding: 14, font: { size: 12 } } },
          title: { display: false }
        }
      }
    });
  }

  renderRecommendationsChart(isNight: boolean) {
    const canvas = document.getElementById('recommendationsChart') as HTMLCanvasElement;
    if (!canvas || !this.kpis?.RecommendationsByPriority) return;
    Chart.getChart(canvas)?.destroy();

    const labels = Object.keys(this.kpis.RecommendationsByPriority);
    const values = Object.values(this.kpis.RecommendationsByPriority) as number[];

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#f43f5e', '#f59e0b', '#6366f1', '#10b981'],
          borderWidth: 2,
          borderColor: isNight ? '#1e293b' : '#ffffff',
          hoverOffset: 12
        }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: this.textColor(isNight), padding: 14, font: { size: 12 } } },
          title: { display: false }
        }
      }
    });
  }

  renderTopClientsChart(isNight: boolean) {
    const canvas = document.getElementById('topClientsChart') as HTMLCanvasElement;
    if (!canvas || !this.kpis?.TopClientsByTransactions) return;
    Chart.getChart(canvas)?.destroy();

    const sorted = Object.entries(this.kpis.TopClientsByTransactions)
      .sort((a: any, b: any) => b[1] - a[1]);
    const labels = sorted.map(([k]) => k);
    const values = sorted.map(([, v]) => v as number);

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Transactions',
          data: values,
          backgroundColor: 'rgba(99,102,241,0.75)',
          borderColor: '#6366f1',
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        animation: { duration: 900 },
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: {
            ticks: { color: this.textColor(isNight), stepSize: 1 },
            grid: { color: this.gridColor(isNight) },
            beginAtZero: true
          },
          y: { ticks: { color: this.textColor(isNight) }, grid: { display: false } }
        }
      }
    });
  }

  renderRatesChart(isNight: boolean) {
    const canvas = document.getElementById('ratesChart') as HTMLCanvasElement;
    if (!canvas || !this.kpis) return;
    Chart.getChart(canvas)?.destroy();

    const labels = ['Failure Rate', 'Success Rate', 'Uptime', 'Critical Risk', 'Fraud Suspicion', 'Normal Rate'];
    const values = [
      this.kpis.EquipmentFailureRate,
      this.kpis.TransactionSuccessRate,
      this.kpis.EquipmentUptimeRate,
      this.kpis.CriticalRiskRate,
      this.kpis.FraudSuspicionRate,
      this.kpis.NormalRate
    ];
    const colors = ['#f43f5e', '#10b981', '#6366f1', '#ef4444', '#f59e0b', '#0ea5e9'];

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map(c => c + 'cc'),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 900 },
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: { ticks: { color: this.textColor(isNight), font: { size: 11 } }, grid: { display: false } },
          y: {
            ticks: { color: this.textColor(isNight), callback: (v) => v + '%' },
            grid: { color: this.gridColor(isNight) },
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  downloadReport() {
    this.downloading = true;
    this.kpiService.downloadPerformanceReport().subscribe({
      next: (blob) => {
        if (blob.size < 100) {
          console.error('Downloaded file is too small, possible error:', blob);
          this.downloading = false;
          this.toastService.error('Failed to generate a valid PDF. Please check server logs.');
          return;
        }

        // Explicitly create a PDF blob to be safe
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `Performance_Report_${new Date().getTime()}.pdf`;

        document.body.appendChild(link); // Required for some browsers
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
        this.downloading = false;
        this.toastService.success('Performance report generated and downloaded.');
        this.notifService.addNotification('Performance report downloaded', 'info');
      },
      error: (err) => {
        console.error('Download failed:', err);
        this.toastService.error('Download failed. Ensure backend PDF dependencies are installed.');
        this.downloading = false;
      }
    });
  }
}