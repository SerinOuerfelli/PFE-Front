import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../Model/User';

export interface SupportTicket {
  issueType: string;
  description: string;
  adminEmail: string;
  userEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) { }

  getAdmins(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admins`);
  }

  submitTicket(ticket: SupportTicket): Observable<any> {
    // Make sure your backend has an endpoint at POST /api/users/support/ticket
    return this.http.post(`${this.apiUrl}/support/ticket`, ticket);
  }
}
