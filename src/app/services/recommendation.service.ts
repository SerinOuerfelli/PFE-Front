import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { Recommendation } from '../Model/Recommendation';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = 'http://localhost:8080/api/recommendation';

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

  getAllRecommendations(): Observable<Recommendation[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<Recommendation[]>(this.apiUrl, { headers });
  }

  getRecommendationById(id: number): Observable<Recommendation> {
    const headers = this.createAuthHeaders();
    return this.http.get<Recommendation>(`${this.apiUrl}/${id}`, { headers });
  }
}
