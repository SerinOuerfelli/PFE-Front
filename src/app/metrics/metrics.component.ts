import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetricService } from '../services/metric.service';
import { Metric } from '../Model/Metric';
import { ThemeService } from '../services/theme.service';
import { ToastService } from '../services/toast.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.css']
})
export class MetricsComponent implements OnInit {

  metrics: Metric[] = [];
  filteredMetrics: Metric[] = [];
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  isModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;
  isEditing: boolean = false;
  selectedId: number | null = null;

  successMessage: string = '';
  errorMessage: string = '';

 form: Metric = { metricName: '', unit: '', threshold: 0, alert: false };


  constructor(
    private metricService: MetricService,
    public themeService: ThemeService,
    private toastService: ToastService,
    private notifService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.metricService.getAll().subscribe({
      next: data => {
        this.metrics = data;
        this.applyFilter();
      },
      error: () => this.showError('Failed to load metrics.')
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    const filtered = this.metrics.filter(m =>
      (m.metricName ?? '').toLowerCase().includes(term) ||
      (m.unit ?? '').toLowerCase().includes(term)
    );
    this.filteredMetrics = this.applySorting(filtered);
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilter();
  }

  private applySorting(data: Metric[]): Metric[] {
    if (!this.sortColumn) return data;

    return [...data].sort((a, b) => {
      let valA: any = this.getPropertyValue(a, this.sortColumn);
      let valB: any = this.getPropertyValue(b, this.sortColumn);

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private getPropertyValue(obj: any, column: string): any {
    switch (column) {
      case 'id': return obj.metricId || 0;
      case 'name': return obj.metricName || '';
      case 'value': return obj.threshold || 0;
      case 'unit': return obj.unit || '';
      default: return '';
    }
  }

  openCreateModal(): void {
    this.form = { metricName: '', threshold: 0, unit: '', alert: false };
    this.isEditing = false;
    this.selectedId = null;
    this.isModalOpen = true;
  }

  openEditModal(metric: Metric): void {
    this.form = { ...metric };
    this.isEditing = true;
    this.selectedId = metric.metricId ?? null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isDeleteModalOpen = false;
    this.selectedId = null;
  }

  saveMetric(): void {
    if (this.isEditing && this.selectedId !== null) {
      this.metricService.update(this.selectedId, this.form).subscribe({
        next: (updated) => {
          this.toastService.success(`Metric ${updated.metricName} updated successfully.`);
          this.notifService.addNotification(`Metric updated: ${updated.metricName}`, 'success');
          this.loadMetrics();
          this.closeModal();
        },
        error: () => {
          this.toastService.error('Failed to update metric.');
        }
      });
    } else {
      this.metricService.create(this.form).subscribe({
        next: (created) => {
          this.toastService.success(`Metric ${created.metricName} created successfully.`);
          this.notifService.addNotification(`New metric created: ${created.metricName}`, 'success');
          this.loadMetrics();
          this.closeModal();
        },
        error: () => {
          this.toastService.error('Failed to create metric.');
        }
      });
    }
  }

  confirmDelete(metric: Metric): void {
    this.selectedId = metric.metricId ?? null;
    this.isDeleteModalOpen = true;
  }

  deleteMetric(): void {
    if (this.selectedId === null) return;
    this.metricService.delete(this.selectedId).subscribe({
      next: () => {
        this.toastService.success('Metric deleted successfully.');
        this.notifService.addNotification('A metric was deleted', 'warning');
        this.loadMetrics();
        this.closeModal();
      },
      error: () => {
        this.toastService.error('Failed to delete metric.');
      }
    });
  }

  private showSuccess(msg: string): void {
    this.toastService.success(msg);
  }

  private showError(msg: string): void {
    this.toastService.error(msg);
  }
}
