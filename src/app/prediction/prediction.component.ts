import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionService } from '../services/prediction.service';
import { Prediction } from '../Model/Prediction';

@Component({
  selector: 'app-prediction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prediction.component.html',
  styleUrls: ['./prediction.component.css']
})
export class PredictionComponent implements OnInit {
  predictions: Prediction[] = [];
  loading: boolean = true;
  error: string | null = null;
  currentPage: number = 1;
  pageSize: number = 5;
  searchId: string = '';
  expandedPredictionIds: Set<number> = new Set();
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private predictionService: PredictionService) { }

  ngOnInit(): void {
    this.fetchPredictions();
  }

  fetchPredictions(): void {
    this.loading = true;
    this.error = null;
    this.predictionService.getAllPredictions().subscribe({
      next: (data) => {
        // Mock data if array is completely empty so that the UI can be showcased.
        // Usually, the real data structure matches what's returned from the Spring backend.
        if (!data || data.length === 0) {
          // Generate 12 mock items so we can see pagination in action
          this.predictions = Array.from({ length: 12 }).map((_, i) => ({
            predictionId: 101 + i,
            predictionDate: new Date(Date.now() - (i * 86400000)).toISOString(),
            predictionType: i % 2 === 0 ? 'TRANSACTION_ANOMALY' : 'LOGIN_ANOMALY',
            predictionResult: i % 3 === 0 ? 'SUSPICIOUS' : 'NORMAL',
            probability: 0.5 + (i * 0.03)
          }));
        } else {
          this.predictions = data;
        }
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching predictions:', err);
        // Fallback or error display
        this.error = 'Failed to load predictions. Please ensure the backend is running.';
        this.loading = false;
      }
    });
  }

  get filteredPredictions(): Prediction[] {
    if (!this.searchId) {
      return this.predictions;
    }
    return this.predictions.filter(p => p.predictionId?.toString().includes(this.searchId));
  }

  get paginatedPredictions(): Prediction[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const sorted = this.applySorting(this.filteredPredictions);
    return sorted.slice(startIndex, startIndex + this.pageSize);
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  private applySorting(data: Prediction[]): Prediction[] {
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
      case 'id': return obj.predictionId || 0;
      case 'date': return obj.predictionDate || '';
      case 'type': return obj.predictionType || '';
      case 'probability': return obj.probability || 0;
      case 'result': return obj.predictionResult || '';
      default: return '';
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPredictions.length / this.pageSize);
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  toggleExpand(predictionId: number | undefined): void {
    if (!predictionId) return;
    if (this.expandedPredictionIds.has(predictionId)) {
      this.expandedPredictionIds.delete(predictionId);
    } else {
      this.expandedPredictionIds.add(predictionId);
    }
  }

  isExpanded(predictionId: number | undefined): boolean {
    if (!predictionId) return false;
    return this.expandedPredictionIds.has(predictionId);
  }
}
