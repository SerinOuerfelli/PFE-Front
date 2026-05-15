import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { User } from '../Model/User';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }

  private normalizeEmail(email: string | undefined): string | undefined {
    if (email && !email.includes('@')) {
      return email + '@biat-it.com';
    }
    return email;
  }

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

  getAllUsers(): Observable<User[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<User[]>(this.apiUrl, { headers });
  }

  addUser(user: User): Observable<string> {
    user.email = this.normalizeEmail(user.email) || '';
    const headers = this.createAuthHeaders();
    return this.http.post(this.apiUrl + '/addUser', user, { headers, responseType: 'text' });
  }

  updateUser(id: number, user: User): Observable<User> {
    user.email = this.normalizeEmail(user.email) || '';
    const headers = this.createAuthHeaders();
    return this.http.put<User>(`${this.apiUrl}/${id}`, user, { headers });
  }

  activateUser(id: number): Observable<string> {
    const headers = this.createAuthHeaders();
    return this.http.put(`${this.apiUrl}/${id}/activate`, {}, { headers, responseType: 'text' });
  }

  deactivateUser(id: number): Observable<string> {
    const headers = this.createAuthHeaders();
    return this.http.put(`${this.apiUrl}/${id}/deactivate`, {}, { headers, responseType: 'text' });
  }

  findByEmail(email: string): Observable<User> {
    const normalizedEmail = this.normalizeEmail(email);
    const headers = this.createAuthHeaders();
    return this.http.get<User>(`${this.apiUrl}/email/${normalizedEmail}`, { headers });
  }

  resetPassword(userId: number): Observable<string> {
    const headers = this.createAuthHeaders();
    return this.http.post(`${this.apiUrl}/${userId}/reset-password`, {}, { headers, responseType: 'text' });
  }

  changePassword(userId: number, passwords: any): Observable<string> {
    const headers = this.createAuthHeaders();
    return this.http.post(`${this.apiUrl}/${userId}/change-password`, passwords, { headers, responseType: 'text' });
  }
}
