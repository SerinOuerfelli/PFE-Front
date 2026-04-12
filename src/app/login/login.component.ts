import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { LoginRequestDTO } from '../Model/LoginRequestDTO';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  clipRemoved = false;
  animateOut = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    const loginRequest: LoginRequestDTO = {
      email: this.email,
      password: this.password,
   
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.authService.saveAuthData(response);
        // Example: navigate after animation
         this.router.navigate(['/qrcode']);
      },
      error: (err) => {
        alert('Login failed: ' + err.message);
      }
    });

    // Trigger animation
    this.clipRemoved = true;
    this.animateOut = true;

    setTimeout(() => {
      // After animation, show QR code or navigate
    }, 1200);
  }
isSignup = false;
  switchToSignup() { this.isSignup = true; }

  switchToLogin() {
    // Trigger reverse animation
    this.clipRemoved = false;
  }

}