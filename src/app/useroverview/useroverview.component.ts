import { Component, OnInit } from '@angular/core';
import { KpiService } from '../services/kpi.service';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';

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

  constructor(private kpiService: KpiService) {}

  ngOnInit(): void {
    this.kpiService.getKpis().subscribe(data => {
      console.log('KPI data:', data);
      this.kpis = data;

      // Render charts only after data is loaded
      if (this.kpis?.AlertsByLevel) this.renderAlertsChart();
      if (this.kpis?.RecommendationsByPriority) this.renderRecommendationsChart();
      if (this.kpis) this.renderRatesChart();
      if (this.kpis?.IncidentsPerMonth) this.renderIncidentsChart();
    });
  }

  renderAlertsChart() {
    const canvas = document.getElementById('alertsChart') as HTMLCanvasElement;
    if (!canvas) return;

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(this.kpis.AlertsByLevel),
        datasets: [{
          label: 'Alerts by Level',
          data: Object.values(this.kpis.AlertsByLevel),
          backgroundColor: ['#64b5f6', '#1e88e5', '#0d47a1', '#9c27b0']
        }]
      },
      options: { responsive: true }
    });
  }

  renderRecommendationsChart() {
    const canvas = document.getElementById('recommendationsChart') as HTMLCanvasElement;
    if (!canvas) return;

    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: Object.keys(this.kpis.RecommendationsByPriority),
        datasets: [{
          data: Object.values(this.kpis.RecommendationsByPriority),
          backgroundColor: ['#42a5f5', '#1976d2', '#f44336']
        }]
      },
      options: { responsive: true }
    });
  }

  renderRatesChart() {
    const canvas = document.getElementById('ratesChart') as HTMLCanvasElement;
    if (!canvas) return;

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [
          'Failure Rate',
          'Success Rate',
          'Uptime Rate',
          'Critical Risk',
          'Fraud Suspicion',
          'Normal Rate'
        ],
        datasets: [{
          data: [
            this.kpis.EquipmentFailureRate,
            this.kpis.TransactionSuccessRate,
            this.kpis.EquipmentUptimeRate,
            this.kpis.CriticalRiskRate,
            this.kpis.FraudSuspicionRate,
            this.kpis.NormalRate
          ],
          backgroundColor: '#1565c0'
        }]
      },
      options: { responsive: true }
    });
  }

 renderIncidentsChart() {
  if (!this.kpis?.IncidentsPerMonth) return;

  const canvas = document.getElementById('incidentsChart') as HTMLCanvasElement;
  if (!canvas) return;

  // Sort months like "2026-1", "2026-2" properly
  const months = Object.keys(this.kpis.IncidentsPerMonth).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return yearA === yearB ? monthA - monthB : yearA - yearB;
  });

  const values = months.map(m => Number(this.kpis.IncidentsPerMonth[m]));

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: months.map(m => {
        const [year, month] = m.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
      }),
      datasets: [{
        label: 'Incidents per Month',
        data: values,
        borderColor: '#2196f3',
        backgroundColor: '#bbdefb',
        fill: true,
        tension: 0.3,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#1976d2',
        pointHoverBorderColor: '#0d47a1'
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1200,
        easing: 'easeOutBounce'
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              return `Incidents: ${value.toFixed(2)}`;
            }
          }
        },
        title: {
          display: true,
          text: 'Incidents per Month',
          font: { size: 18, weight: 'bold' },
          color: '#1976d2'
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const month = months[index];
          const value = values[index];
          alert(`Month: ${month}, Incidents: ${value}`);
        }
      }
    }
  });
}
}