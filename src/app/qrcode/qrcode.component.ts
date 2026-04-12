import { Component, OnInit } from '@angular/core';
import { TwoFactorAuthService } from '../services/two-factor-auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { Router } from '@angular/router';
@Component({
  selector: 'app-qrcode',
  standalone: true,
  imports: [FormsModule, CommonModule, QRCodeModule],
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.css']
})
export class QrcodeComponent implements OnInit {

  qrData: string = '';
  email: string = '';
  secret: string = '';

  // 6-digit code storage
  codeDigits: string[] = ["", "", "", "", "", ""];
  code: string = "";

  constructor(private twoFactorAuthService: TwoFactorAuthService,private router: Router) {}

  ngOnInit(): void {
    this.email = localStorage.getItem('email') || '';

    if (this.email) {
      this.twoFactorAuthService.generate(this.email).subscribe({
        next: (res) => {
          this.qrData = res.otpAuthUrl;
          this.secret = res.secret;
          console.log('QR generated for', this.email);
          console.log('SECRET:', this.secret);
        },
        error: (err) => {
          alert('Failed to generate QR: ' + err.message);
        }
      });
    } else {
      alert('No email found. Please log in again.');
    }
  }

  updateCode() {
    this.code = this.codeDigits.join("");
  }

  verify(): void {
    if (this.email && this.code.length === 6) {
      const numericCode = Number(this.code);

      this.twoFactorAuthService.verifyCode(this.email, numericCode).subscribe({
        next: () => {
          const role = localStorage.getItem('role');

              if (role === 'ADMIN') {
          this.router.navigate(['/admin-dashboard']);
        } else if (role === 'USER') {
          this.router.navigate(['/user-dashboard']);
        } else {
          this.router.navigate(['/default-dashboard']);
        }
        },
        error: (err) => {
          console.log(err);
          const message =
            err.error?.message ||
            err.error ||
            'Verification failed';
          alert('❌ ' + message);
        }
      });
    } else {
      alert('Please enter the 6-digit code.');
    }
  }

  moveFocus(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Update the full code string
    this.updateCode();

    // If a digit was entered and there is a next input, focus it
    if (value && index < 5) {
      const nextInput = input.parentElement?.children[index + 1] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    // If user presses backspace on empty field, go back
    if (!value && event.inputType === 'deleteContentBackward' && index > 0) {
      const prevInput = input.parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }

    // Optional: auto-verify when last digit entered
    if (value && index === 5) {
      this.verify();
    }
  }
}