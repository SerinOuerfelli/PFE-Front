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

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    const loginRequest: LoginRequestDTO = {
      email: this.email,
      password: this.password,
    };

    // 1. Trigger the out-animation immediately for instant visual feedback
    this.clipRemoved = true;
    this.animateOut = true;

    // 2. Perform the login
    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.authService.saveAuthData(response);
        
        // 3. Wait for the slide-out animation (0.8s) to finish before routing
        setTimeout(() => {
          this.router.navigate(['/qrcode']);
        }, 800);
      },
      error: (err) => {
        // If error, bring the panels back
        this.clipRemoved = false;
        this.animateOut = false;
        alert('Login failed: ' + err.message);
      }
    });
  }
  isSignup = false;
  switchToSignup() { this.isSignup = true; }

  switchToLogin() {
    // Trigger reverse animation
    this.clipRemoved = false;
  }

}