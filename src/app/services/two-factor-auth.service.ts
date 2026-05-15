import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TwoFactorAuthService {

  private apiUrl = 'http://localhost:8080/api/2fa';

  constructor(private http: HttpClient) {}

  // ✅ Generate QR + secret (NO TOKEN)
 generate(email: string) {
  return this.http.get<any>(`${this.apiUrl}/generate?email=${email}`);
}

verifyCode(email: string, code: string) {
  return this.http.post<any>(
    `${this.apiUrl}/verify?email=${email}&code=${code}`,
    {}
  );
}
}