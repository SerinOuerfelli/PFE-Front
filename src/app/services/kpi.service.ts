import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class KpiService {
  private apiUrl = 'http://localhost:8080/kpi';  

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  private createAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  getKpis(): Observable<any> {
    const headers = this.createAuthHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }

  downloadPerformanceReport(): Observable<Blob> {
    const headers = this.createAuthHeaders();
    return this.http.get(`http://localhost:8080/api/reports/performance/download`, {
      headers,
      responseType: 'blob'
    });
  }
}