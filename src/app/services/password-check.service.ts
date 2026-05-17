import { Injectable } from '@angular/core';
import { UsersService } from './users.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class PasswordCheckService {

  constructor(private usersService: UsersService) { }

  checkPasswordStatus(): void {
    const isChanged = localStorage.getItem('passwordChanged');
    const userId = localStorage.getItem('id');
    console.log('Checking password status:', { isChanged, userId });

    if (isChanged === 'false' && userId) {
      this.showMandatoryChangeModal(Number(userId));
    }
  }

  private showMandatoryChangeModal(userId: number): void {
    Swal.fire({
      title: 'Security Update Required',
      text: 'For your security, you must change your auto-generated password before continuing.',
      icon: 'warning',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: 'Change Password Now',
      background: 'rgba(15, 30, 45, 0.95)',
      color: '#ffffff',
      customClass: {
        popup: 'swal2-dark-glass'
      }
    }).then(() => {
      this.promptNewPassword(userId);
    });
  }

  private promptNewPassword(userId: number): void {
    Swal.fire({
      title: 'Set New Password',
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 15px;">
          <div>
            <label for="current-password" style="font-size: 14px; font-weight: bold; color: #bae6fd;">Current Password (from email)</label>
            <input id="current-password" class="swal2-input" type="password" style="width: 100%; margin: 5px 0;" placeholder="Enter current password" />
          </div>
          <div>
            <label for="new-password" style="font-size: 14px; font-weight: bold; color: #bae6fd;">New Secure Password</label>
            <input id="new-password" class="swal2-input" type="password" style="width: 100%; margin: 5px 0;" placeholder="Min 8 chars, 1 uppercase, 1 symbol, 1 number" />
          </div>
          <div>
            <label for="confirm-password" style="font-size: 14px; font-weight: bold; color: #bae6fd;">Confirm New Password</label>
            <input id="confirm-password" class="swal2-input" type="password" style="width: 100%; margin: 5px 0;" placeholder="Confirm new password" />
          </div>
        </div>
      `,
      showCancelButton: false,
      confirmButtonText: 'Update Password',
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: 'rgba(15, 30, 45, 0.95)',
      color: '#ffffff',
      customClass: {
        popup: 'swal2-dark-glass'
      },
      preConfirm: () => {
        const currentPassword = (document.getElementById('current-password') as HTMLInputElement).value;
        const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Please fill in all fields.');
          return false;
        }

        if (newPassword.length < 8) {
          Swal.showValidationMessage('New password must be at least 8 characters long.');
          return false;
        }

        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

        if (!hasUpperCase || !hasNumber || !hasSymbol) {
          Swal.showValidationMessage('Password must contain at least one uppercase letter, one number, and one symbol.');
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('New passwords do not match.');
          return false;
        }

        return { currentPassword, newPassword };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Updating Password...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.usersService.changePassword(userId, result.value).subscribe({
          next: () => {
            localStorage.setItem('passwordChanged', 'true');
            Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: 'Your password has been updated securely.',
              timer: 2000,
              showConfirmButton: false,
              background: 'rgba(15, 30, 45, 0.95)',
              color: '#ffffff',
              allowOutsideClick: false,
              allowEscapeKey: false
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Update Failed',
              text: err.error || 'The current password you entered is incorrect.',
              confirmButtonText: 'Try Again',
              allowOutsideClick: false,
              allowEscapeKey: false,
              background: 'rgba(15, 30, 45, 0.95)',
              color: '#ffffff'
            }).then(() => this.promptNewPassword(userId));
          }
        });
      }
    });
  }
}
