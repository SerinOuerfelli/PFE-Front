import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecommendationService } from '../services/recommendation.service';
import { Recommendation } from '../Model/Recommendation';

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.css']
})
export class RecommendationComponent implements OnInit {
  recommendations: Recommendation[] = [];
  loading: boolean = true;
  error: string | null = null;
  currentPage: number = 1;
  pageSize: number = 5;
  searchQuery: string = '';

  constructor(private recommendationService: RecommendationService) { }

  ngOnInit(): void {
    this.fetchRecommendations();
  }

  fetchRecommendations(): void {
    this.loading = true;
    this.error = null;
    this.recommendationService.getAllRecommendations().subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          // Generate mock data for visualization if backend is disconnected or empty
          this.recommendations = Array.from({ length: 10 }).map((_, i) => ({
            recommendationId: 201 + i,
            predictionId: 1000 + i,
            description: i % 2 === 0 ? 'Restart primary database node' : 'Scale up web server instances',
            priority: i % 3 === 0 ? 'CRITICAL' : (i % 2 === 0 ? 'HIGH' : 'MEDIUM')
          }));
        } else {
          this.recommendations = data;
        }
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching recommendations:', err);
        // Fallback or error display
        this.error = 'Failed to load recommendations. Please ensure the backend is running.';
        this.loading = false;
      }
    });
  }

  get filteredRecommendations(): Recommendation[] {
    if (!this.searchQuery) {
      return this.recommendations;
    }
    const query = this.searchQuery.toLowerCase();
    return this.recommendations.filter(r => 
      r.recommendationId?.toString().includes(query) || 
      r.description?.toLowerCase().includes(query)
    );
  }

  get paginatedRecommendations(): Recommendation[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecommendations.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRecommendations.length / this.pageSize);
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
}
