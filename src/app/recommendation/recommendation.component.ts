import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecommendationService } from '../services/recommendation.service';
import { Recommendation } from '../Model/Recommendation';
import { DecisionService } from '../services/decision.service';
import { Decision } from '../Model/Decision';
import Swal from 'sweetalert2';

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
  expandedRecommendationIds: Set<number> = new Set();

  // "Take Action" Modal State
  isModalOpen: boolean = false;
  selectedRecommendation: Recommendation | null = null;
  newDecisionDescription: string = '';
  isSubmitting: boolean = false;

  constructor(
    private recommendationService: RecommendationService,
    private decisionService: DecisionService
  ) { }

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
          this.recommendations = Array.from({ length: 12 }).map((_, i) => ({
            recommendationId: 201 + i,
            predictionId: 1000 + i,
            description: i % 2 === 0 ? 'Schedule preventive maintenance for equipment' : 'Scale up web server instances',
            priority: i % 3 === 0 ? 'CRITICAL' : (i % 2 === 0 ? 'HIGH' : 'MEDIUM'),
            decisions: [
              {
                decisionId: 71 + i,
                description: "Escalate anomaly to fraud team",
                decisionDate: new Date().toISOString(),
                user: { userId: 61, username: "MC Adam", email: "adam@gmail.com", role: "SUPERADMIN", active: true }
              },
              {
                decisionId: 72 + i,
                description: "Schedule maintenance approval",
                decisionDate: new Date(Date.now() - 3600000).toISOString(),
                user: { userId: 61, username: "Sarah Connor", email: "sarah@biat.tn", role: "ADMIN", active: true }
              }
            ]
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

  toggleExpand(id: number | undefined): void {
    if (!id) return;
    if (this.expandedRecommendationIds.has(id)) {
      this.expandedRecommendationIds.delete(id);
    } else {
      this.expandedRecommendationIds.add(id);
    }
  }

  isExpanded(id: number | undefined): boolean {
    if (!id) return false;
    return this.expandedRecommendationIds.has(id);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  // --- "Take Action" Logic ---

  openDecisionModal(rec: Recommendation): void {
    this.selectedRecommendation = rec;
    this.newDecisionDescription = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedRecommendation = null;
    this.newDecisionDescription = '';
  }

  submitDecision(): void {
    if (!this.selectedRecommendation || !this.newDecisionDescription.trim()) return;

    this.isSubmitting = true;

    // Bind current user context and system time for the database payload
    const storedId = localStorage.getItem('id');
    const uId = storedId ? parseInt(storedId, 10) : 0;
    
    const decisionRequest: any = {
      description: this.newDecisionDescription,
      recommendation: {
        recommendationId: this.selectedRecommendation.recommendationId
      },
      decisionDate: new Date().toISOString(),
      user: {
        userId: uId,
        username: localStorage.getItem('username') || '',
        email: localStorage.getItem('email') || '',
        role: localStorage.getItem('role') || ''
      }
    };

    this.decisionService.createDecision(decisionRequest as Decision).subscribe({
      next: (createdDecision) => {
        // Update local state to reflect the new decision
        if (this.selectedRecommendation) {
          if (!this.selectedRecommendation.decisions) {
            this.selectedRecommendation.decisions = [];
          }
          this.selectedRecommendation.decisions.unshift(createdDecision);
          
          // Auto-expand to show the result
          if (this.selectedRecommendation.recommendationId) {
            this.expandedRecommendationIds.add(this.selectedRecommendation.recommendationId);
          }
        }

        Swal.fire({
          icon: 'success',
          title: 'Decision Logged',
          text: 'The action has been successfully recorded.',
          timer: 2000,
          showConfirmButton: false
        });

        this.isSubmitting = false;
        this.closeModal();
      },
      error: (err) => {
        console.error('Error creating decision:', err);
        Swal.fire({
          icon: 'error',
          title: 'Action Failed',
          text: 'There was an error saving your decision. Please try again.'
        });
        this.isSubmitting = false;
      }
    });
  }
}
