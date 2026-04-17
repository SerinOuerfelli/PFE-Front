import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecisionService } from '../services/decision.service';
import { Decision } from '../Model/Decision';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './decision.component.html',
  styleUrl: './decision.component.css'
})
export class DecisionComponent implements OnInit {
  decisions: Decision[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchQuery: string = '';

  constructor(
    private decisionService: DecisionService,
    public themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.fetchDecisions();
  }

  fetchDecisions(): void {
    this.loading = true;
    this.error = null;
    this.decisionService.getAllDecisions().subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          // Mock data for demonstration
          this.decisions = [
            {
              decisionId: 71,
              description: "Escalate anomaly to fraud team",
              decisionDate: "2026-04-16T20:21:45.000+00:00",
              user: { userId: 61, username: "MC Adam", email: "adam@gmail.com", role: "SUPERADMIN", active: true }
            },
            {
              decisionId: 77,
              description: "Schedule maintenance approval for ATM Branch #04",
              decisionDate: new Date().toISOString(),
              user: { userId: 61, username: "MC Adam", email: "adam@gmail.com", role: "SUPERADMIN", active: true }
            },
            {
              decisionId: 78,
              description: "Reject suspicious transaction attempt #88219",
              decisionDate: new Date(Date.now() - 3600000).toISOString(),
              user: { userId: 62, username: "Sarah Connor", email: "sarah@biat.com.tn", role: "ADMIN", active: false }
            },
            {
              decisionId: 79,
              description: "High-priority security patch deployment",
              decisionDate: new Date(Date.now() - 7200000).toISOString(),
              user: { userId: 61, username: "MC Adam", email: "adam@gmail.com", role: "SUPERADMIN", active: true }
            }
          ];
        } else {
          this.decisions = data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching decisions:', err);
        this.error = 'Failed to load decisions. Connection error.';
        this.loading = false;
        
        // Fallback mock even on error for design validation
        this.decisions = [
          {
            decisionId: 10,
            description: "System Recovery initiated after power failure",
            decisionDate: new Date().toISOString(),
            user: { userId: 1, username: "Admin", email: "admin@biat.tn", role: "SUPERADMIN", active: true }
          }
        ];
      }
    });
  }

  get filteredDecisions(): Decision[] {
    if (!this.searchQuery) return this.decisions;
    return this.decisions.filter(d => 
      d.description.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
      d.user.username.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
