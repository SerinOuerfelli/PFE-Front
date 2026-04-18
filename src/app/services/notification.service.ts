import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, timer, combineLatest } from 'rxjs';
import { PredictionService } from './prediction.service';
import { RecommendationService } from './recommendation.service';
import { DecisionService } from './decision.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface UnreadCounts {
  predictions: number;
  recommendations: number;
  decisions: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  // Streams the latest unread counts to the UI
  private unreadSubject = new BehaviorSubject<UnreadCounts>({ predictions: 0, recommendations: 0, decisions: 0, total: 0 });
  unread$ = this.unreadSubject.asObservable();

  private pollingSub?: Subscription;

  // Track the actual lengths retrieved from backend
  private currentLengths = { predictions: 0, recommendations: 0, decisions: 0 };
  
  // Track what the user 'has seen' (persisted between reloads)
  private seenLengths = { predictions: 0, recommendations: 0, decisions: 0 };

  constructor(
    private predictionService: PredictionService,
    private recService: RecommendationService,
    private decService: DecisionService
  ) {
    this.loadSeenState();
  }

  startPolling(intervalMs: number = 500000) {
    if (this.pollingSub) return;
    
    // Fire immediately (0), then every intervalMs
    this.pollingSub = timer(0, intervalMs).subscribe(() => {
      this.fetchUpdates();
    });
  }

  stopPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = undefined;
    }
  }

    private mockUnreadOffset = 0;

  private fetchUpdates() {
    // Parallel fetch from all three AI endpoints
    combineLatest([
      this.predictionService.getAllPredictions().pipe(catchError(() => of([]))),
      this.recService.getAllRecommendations().pipe(catchError(() => of([]))),
      this.decService.getAllDecisions().pipe(catchError(() => of([])))
    ]).subscribe(([preds, recs, decs]) => {
      // Base lengths from the backend
      let pLen = preds ? preds.length : 0;
      let rLen = recs ? recs.length : 0;
      let dLen = decs ? decs.length : 0;

      // SIMULATION FIX: Always incrementally bump the lengths so the unread badges grow artificially.
      // This forces the dynamic red notification badges to appear so you can test the UI!
      this.mockUnreadOffset += 1;
      
      this.currentLengths.predictions = pLen + this.mockUnreadOffset;
      this.currentLengths.recommendations = rLen + Math.floor(this.mockUnreadOffset / 3);
      this.currentLengths.decisions = dLen + Math.floor(this.mockUnreadOffset / 5);

      this.calculateUnread();
    });
  }

  private calculateUnread() {
    const unreadPreds = Math.max(0, this.currentLengths.predictions - this.seenLengths.predictions);
    const unreadRecs = Math.max(0, this.currentLengths.recommendations - this.seenLengths.recommendations);
    const unreadDecs = Math.max(0, this.currentLengths.decisions - this.seenLengths.decisions);

    this.unreadSubject.next({
      predictions: unreadPreds,
      recommendations: unreadRecs,
      decisions: unreadDecs,
      total: unreadPreds + unreadRecs + unreadDecs
    });
  }

  /**
   * Called when user clicks a specific sidebar tab.
   * Resets the 'seen' count to current, clearing the specific badge.
   */
  markAsSeen(category: 'predictions' | 'recommendations' | 'decisions') {
    this.seenLengths[category] = this.currentLengths[category];
    this.saveSeenState();
    this.calculateUnread();
  }

  private loadSeenState() {
    try {
      const saved = localStorage.getItem('biat_seen_counts');
      if (saved) {
        this.seenLengths = JSON.parse(saved);
      }
    } catch { } // Error handling fallback
  }

  private saveSeenState() {
    localStorage.setItem('biat_seen_counts', JSON.stringify(this.seenLengths));
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}
