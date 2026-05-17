import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { LoginRequestDTO } from '../Model/LoginRequestDTO';
import { AuthService } from '../services/auth.service';
import { SupportService } from '../services/support.service';
import { Router } from '@angular/router';
import { User } from '../Model/User';

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

  constructor(
    private authService: AuthService,
    private supportService: SupportService,
    private router: Router
  ) { }

  login() {
    const loginRequest: LoginRequestDTO = {
      email: this.email,
      password: this.password,
    };

    this.clipRemoved = true;

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.authService.saveAuthData(response);
        this.animateOut = true; // Trigger fade-out only after backend success
        setTimeout(() => {
          this.router.navigate(['/qrcode']);
        }, 380); // Snappy 300ms page handoff
      },
      error: (err) => {
        this.clipRemoved = false;
        this.animateOut = false;

        const errorMessage = err.error?.message || 'Invalid email or password. Please try again.';

        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: errorMessage,
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
    });
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
              <input id="user-email" class="swal2-input" type="email" style="width: 100%; margin: 5px 0;" placeholder="your.email@example.com" value="" />
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
}
