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

export interface SystemNotification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  // Streams the latest unread counts to the UI
  private unreadSubject = new BehaviorSubject<UnreadCounts>({ predictions: 0, recommendations: 0, decisions: 0, total: 0 });
  unread$ = this.unreadSubject.asObservable();

  // Streams system activity notifications (Activity Log)
  private systemNotifsSubject = new BehaviorSubject<SystemNotification[]>([]);
  systemNotifications$ = this.systemNotifsSubject.asObservable();
  private systemNotifs: SystemNotification[] = [];

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
    this.loadSystemNotifications();
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

      this.currentLengths.predictions = pLen;
      this.currentLengths.recommendations = rLen;
      this.currentLengths.decisions = dLen;

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
   * System Activity Log Logic
   */
  addNotification(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') {
    const newNotif: SystemNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    this.systemNotifs.unshift(newNotif); // Add to top
    // Keep only last 20
    if (this.systemNotifs.length > 20) {
      this.systemNotifs = this.systemNotifs.slice(0, 20);
    }
    this.systemNotifsSubject.next([...this.systemNotifs]);
    this.saveSystemNotifications();
  }

  /**
   * Alias for addNotification to support legacy calls
   */
  notify(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') {
    this.addNotification(message, type);
  }

  clearNotifications() {
    this.systemNotifs = [];
    this.systemNotifsSubject.next([]);
    this.saveSystemNotifications();
  }

  private loadSystemNotifications() {
    try {
      const saved = localStorage.getItem('biat_system_notifications');
      if (saved) {
        this.systemNotifs = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.systemNotifsSubject.next([...this.systemNotifs]);
      }
    } catch { }
  }

  private saveSystemNotifications() {
    localStorage.setItem('biat_system_notifications', JSON.stringify(this.systemNotifs));
  }

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
