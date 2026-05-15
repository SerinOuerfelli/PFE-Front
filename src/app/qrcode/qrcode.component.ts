import { Component, OnInit } from '@angular/core';
import { TwoFactorAuthService } from '../services/two-factor-auth.service';
import { SupportService } from '../services/support.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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

  constructor(
    private twoFactorAuthService: TwoFactorAuthService,
    private supportService: SupportService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.email = localStorage.getItem('email') || '';

    if (this.email) {
      this.twoFactorAuthService.generate(this.email).subscribe({
        next: (res) => {
          this.qrData = res.otpAuthUrl;
          this.secret = res.secret;
        },
        error: (err) => {
          this.showError('Failed to generate QR code. Please try logging in again.');
        }
      });
    } else {
      this.showError('Session expired. Please log in again.');
    }
  }

  updateCode() {
    this.code = this.codeDigits.join("");
  }

  verify(): void {
    if (this.email && this.code.length === 6) {
      this.twoFactorAuthService.verifyCode(this.email, this.code).subscribe({
        next: () => {
          const role = localStorage.getItem('role');

          if (role === 'SUPERVISOR') {
            this.router.navigate(['/supervisor-dashboard']);
          } else if (role === 'TECHNICIAN') {
            this.router.navigate(['/technician-dashboard']);
          } else if (role === 'ADMIN') {
            this.router.navigate(['/admin-dashboard']);
          }

          else {
            this.router.navigate(['/login-dashboard']);
          }
        },
        error: (err) => {
          console.log(err);
          const message =
            err.error?.message ||
            err.error ||
            'Verification failed';
          this.showError('Invalid or expired code. Please try again.');
        }
      });
    } else {
      this.showError('Please enter the complete 6-digit code.');
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

  onNeedHelp() {
    // Show a loading state while fetching admins
    Swal.fire({
      title: 'Loading Support Form...',
      background: 'rgba(15, 30, 45, 0.95)',
      color: '#ffffff',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.supportService.getAdmins().subscribe({
      next: (admins) => {
        let adminOptions = '';
        if (admins && admins.length > 0) {
          admins.forEach(admin => {
            adminOptions += `<option value="${admin.email}">${admin['firstname'] || admin.username} ${admin['lastname'] || ''} (${admin.email})</option>`;
          });
        } else {
          adminOptions = '<option value="support@biat-it.com">Default IT Support (support@biat-it.com)</option>';
        }

        const formHtml = `
          <div style="text-align: left; display: flex; flex-direction: column; gap: 15px;">
            <div>
              <label for="user-email" style="font-size: 14px; font-weight: bold; color: #bae6fd;">Your Email</label>
              <input id="user-email" class="swal2-input" type="email" style="width: 100%; margin: 5px 0;" placeholder="your.email@example.com" value="${this.email}" />
            </div>
            <div>
              <label for="issue-type" style="font-size: 14px; font-weight: bold; color: #bae6fd;">Issue Type</label>
              <select id="issue-type" class="swal2-input" style="display: flex; width: 100%; margin: 5px 0;">
                <option value="Forgot Password">Forgot Password</option>
                <option value="Account Locked">Account Locked</option>
                <option value="Cannot Access System">Cannot Access System</option>
                <option value="Hardware Issue">Hardware Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label for="admin-select" style="font-size: 14px; font-weight: bold; color: #bae6fd;">Send To</label>
              <select id="admin-select" class="swal2-input" style="display: flex; width: 100%; margin: 5px 0;">
                ${adminOptions}
              </select>
            </div>
            <div>
              <label for="issue-desc" style="font-size: 14px; font-weight: bold; color: #bae6fd;">Description</label>
              <textarea id="issue-desc" class="swal2-textarea" style="width: 100%; box-sizing: border-box; margin: 5px 0; height: 100px;" placeholder="Please describe your issue..."></textarea>
            </div>
          </div>
        `;

        Swal.fire({
          title: 'Help Ticket',
          html: formHtml,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Send Ticket',
          cancelButtonText: 'Cancel',
          background: 'rgba(15, 30, 45, 0.95)',
          color: '#ffffff',
          customClass: {
            popup: 'swal2-dark-glass',
            title: 'swal2-title',
            confirmButton: 'swal2-confirm',
            cancelButton: 'swal2-cancel'
          },
          preConfirm: () => {
            const userEmail = (document.getElementById('user-email') as HTMLInputElement).value;
            const issueType = (document.getElementById('issue-type') as HTMLSelectElement).value;
            const adminEmail = (document.getElementById('admin-select') as HTMLSelectElement).value;
            const description = (document.getElementById('issue-desc') as HTMLTextAreaElement).value;

            if (!userEmail.trim() || !userEmail.includes('@')) {
              Swal.showValidationMessage('Please enter a valid email address.');
              return false;
            }
            if (!description.trim()) {
              Swal.showValidationMessage('Please enter a description for your issue.');
              return false;
            }

            return { issueType, adminEmail, description, userEmail };
          }
        }).then((result) => {
          if (result.isConfirmed && result.value) {
            // Show sending state
            Swal.fire({
              title: 'Sending Ticket...',
              background: 'rgba(15, 30, 45, 0.95)',
              color: '#ffffff',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });

            this.supportService.submitTicket({
              issueType: result.value.issueType,
              description: result.value.description,
              adminEmail: result.value.adminEmail,
              userEmail: result.value.userEmail
            }).subscribe({
              next: () => {
                Swal.fire({
                  icon: 'success',
                  title: 'Ticket Sent!',
                  text: 'Your support ticket has been sent to ' + result.value.adminEmail + '.',
                  background: 'rgba(15, 30, 45, 0.95)',
                  color: '#ffffff',
                  customClass: {
                    popup: 'swal2-dark-glass'
                  }
                });
              },
              error: () => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Failed to send ticket. Please try again later.',
                  background: 'rgba(15, 30, 45, 0.95)',
                  color: '#ffffff',
                  customClass: {
                    popup: 'swal2-dark-glass'
                  }
                });
              }
            });
          }
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch support admins. Please try again later.',
          background: 'rgba(15, 30, 45, 0.95)',
          color: '#ffffff',
          customClass: {
            popup: 'swal2-dark-glass'
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }

  private showError(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Verification Error',
      text: message,
      confirmButtonText: 'Try Again',
      timer: 5000,
      timerProgressBar: true,
      background: 'rgba(15, 30, 45, 0.95)',
      color: '#ffffff',
      backdrop: `rgba(0,0,0,0.4)`,
      customClass: {
        popup: 'swal2-dark-glass',
        title: 'swal2-title',
        confirmButton: 'swal2-confirm'
      }
    });
  }
}