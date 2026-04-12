import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequestDTO } from '../Model/LoginRequestDTO';


interface LoginResponse {
  role: string;
  token: string;
  id: number;
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth/login';  
  

  constructor(private http: HttpClient) {}

  
  login(loginRequest: LoginRequestDTO): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, loginRequest);
  }

  

  
  saveAuthData(response: LoginResponse): void {
    localStorage.setItem('role', response.role);  
    localStorage.setItem('token', response.token); 
    localStorage.setItem('id', response.id.toString());  
    localStorage.setItem('email', response.email); 
    localStorage.setItem('username', response.username); 
  }

  
  getToken(): string | null {
    return localStorage.getItem('token');
  }


  getRole(): string | null {
    return localStorage.getItem('role');
  }

  
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null;  
  }

  
  logout(): void {
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('email');
  }
}


