import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface Equipment {
  id: number;
  reference: string;
  type: string;
  status: string;
  city: string;
  region: string;
  area: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = 'http://localhost:8080/api';

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

  getEquipmentGeoData(): Observable<Equipment[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<Equipment[]>(`${this.apiUrl}/equipment`, { headers }).pipe(
      catchError(err => {
        console.error("Backend error, loading mock equipment list", err);
        return of([
          { id: 1, reference: 'EQ-1001', type: 'DAB', status: 'ACTIVE', city: 'Tunis', region: 'Tunis', area: 'North', latitude: 36.8065, longitude: 10.1815 },
          { id: 2, reference: 'EQ-1002', type: 'TPE', status: 'INACTIVE', city: 'Sfax', region: 'Sfax', area: 'South', latitude: 34.7400, longitude: 10.7600 },
          { id: 3, reference: 'EQ-1003', type: 'DAB', status: 'MAINTENANCE', city: 'Sousse', region: 'Sousse', area: 'Center', latitude: 35.8256, longitude: 10.6369 },
          { id: 6, reference: 'EQ-1006', type: 'EPT', status: 'ACTIVE', city: 'Nabeul', region: 'Nabeul', area: 'Center', latitude: 36.444, longitude: 11.333 },
          { id: 7, reference: 'EQ-1007', type: 'TPE', status: 'ACTIVE', city: 'Bizerte', region: 'Bizerte', area: 'North', latitude: 37.2768, longitude: 9.8739 }
        ]);
      })
    );
  }

  getEquipmentCountByCity(): Observable<Record<string, number>> {
    const headers = this.createAuthHeaders();
    return this.http.get<Record<string, number>>(`${this.apiUrl}/equipment/by-city`, { headers }).pipe(
      catchError(() => of({ 'Tunis': 45, 'Sfax': 22, 'Sousse': 18, 'Nabeul': 12 }))
    );
  }

  getEquipmentCountByArea(): Observable<Record<string, number>> {
    const headers = this.createAuthHeaders();
    return this.http.get<Record<string, number>>(`${this.apiUrl}/equipment/by-area`, { headers }).pipe(
      catchError(() => of({ 'North': 55, 'Center': 30, 'South': 12 }))
    );
  }
}
