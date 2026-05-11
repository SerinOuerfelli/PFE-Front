import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Metric } from '../Model/Metric';
import { NotificationService } from './notification.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MetricService {
  private apiUrl = 'http://localhost:8080/metrics';

  constructor(
    private http: HttpClient, 
    @Inject(PLATFORM_ID) private platformId: Object,
    private notifService: NotificationService
  ) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAll(): Observable<Metric[]> {
    return this.http.get<Metric[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Metric> {
    return this.http.get<Metric>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  create(metric: Metric): Observable<Metric> {
    return this.http.post<Metric>(this.apiUrl, metric, { headers: this.getHeaders() }).pipe(
      tap(m => this.notifService.addNotification(`Metric ${m.metricName} created.`, 'success'))
    );
  }

  update(id: number, metric: Metric): Observable<Metric> {
    return this.http.put<Metric>(`${this.apiUrl}/${id}`, metric, { headers: this.getHeaders() }).pipe(
      tap(m => this.notifService.addNotification(`Metric ${m.metricName} updated.`, 'info'))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      tap(() => this.notifService.addNotification(`Metric deleted.`, 'warning'))
    );
  }
}
