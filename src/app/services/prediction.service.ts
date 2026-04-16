import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Prediction } from '../Model/Prediction';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = 'http://localhost:8080/api/predictions';

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

  getAllPredictions(): Observable<Prediction[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<Prediction[]>(this.apiUrl, { headers });
  }

  getPredictionById(id: number): Observable<Prediction> {
    const headers = this.createAuthHeaders();
    return this.http.get<Prediction>(`${this.apiUrl}/${id}`, { headers });
  }
}
