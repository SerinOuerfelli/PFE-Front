import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { Decision } from '../Model/Decision';

@Injectable({
  providedIn: 'root'
})
export class DecisionService {
  private apiUrl = 'http://localhost:8080/api/decision';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }

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

  getAllDecisions(): Observable<Decision[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<Decision[]>(this.apiUrl, { headers });
  }

  getDecisionById(id: number): Observable<Decision> {
    const headers = this.createAuthHeaders();
    return this.http.get<Decision>(`${this.apiUrl}/${id}`, { headers });
  }

  createDecision(decision: Decision): Observable<Decision> {
    const headers = this.createAuthHeaders();
    return this.http.post<Decision>(this.apiUrl, decision, { headers });
  }
}
