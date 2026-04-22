import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetricService } from '../services/metric.service';
import { Metric } from '../Model/Metric';
import { ThemeService } from '../services/theme.service';

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

  isModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;
  isEditing: boolean = false;
  selectedId: number | null = null;

  successMessage: string = '';
  errorMessage: string = '';

 form: Metric = { metricName: '', unit: '', threshold: 0, alert: false };


  constructor(
    private metricService: MetricService,
    public themeService: ThemeService
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
    this.filteredMetrics = this.metrics.filter(m =>
      (m.metricName ?? '').toLowerCase().includes(term) ||
      (m.unit ?? '').toLowerCase().includes(term)
    );
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
        next: () => {
          this.showSuccess('Metric updated successfully.');
          this.loadMetrics();
          this.closeModal();
        },
        error: () => this.showError('Update failed.')
      });
    } else {
      this.metricService.create(this.form).subscribe({
        next: () => {
          this.showSuccess('Metric created successfully.');
          this.loadMetrics();
          this.closeModal();
        },
        error: () => this.showError('Creation failed.')
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
        this.showSuccess('Metric deleted.');
        this.loadMetrics();
        this.closeModal();
      },
      error: () => this.showError('Delete failed.')
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3500);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 3500);
  }
}
