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
    const headers = this.createAuthHeaders();
    return this.http.post(this.apiUrl + '/addUser', user, { headers, responseType: 'text' });
  }

  updateUser(id: number, user: User): Observable<User> {
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
    const headers = this.createAuthHeaders();
    return this.http.get<User>(`${this.apiUrl}/email/${email}`, { headers });
  }
}
