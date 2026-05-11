import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../services/users.service';
import { User } from '../Model/User';
import Swal from 'sweetalert2';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading: boolean = true;
  searchQuery: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal State
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  editingUserId: number | null = null;
  newUser: any = {
    username: '',
    email: '',
    password: '',
    role: 'TECHNICIAN',
    active: true
  };

  constructor(
    private usersService: UsersService,
    public themeService: ThemeService,
    private notifService: NotificationService
  ) { }

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        Swal.fire('Error', 'Failed to load users from management API', 'error');
        this.loading = false;
      }
    });
  }

  get filteredUsers(): User[] {
    const q = this.searchQuery.toLowerCase();
    const filtered = this.users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
    return this.applySorting(filtered);
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  private applySorting(data: User[]): User[] {
    if (!this.sortColumn) return data;

    return [...data].sort((a, b) => {
      let valA: any = this.getPropertyValue(a, this.sortColumn);
      let valB: any = this.getPropertyValue(b, this.sortColumn);

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private getPropertyValue(obj: any, column: string): any {
    switch (column) {
      case 'username': return obj.username || '';
      case 'email': return obj.email || '';
      case 'status': return obj.active ? 1 : 0;
      case 'role': return obj.role || '';
      default: return '';
    }
  }

  toggleUserStatus(user: User): void {
    const action = user.active ? 'deactivate' : 'activate';
    const statusText = user.active ? 'deactivated' : 'activated';

    Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} user ${user.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${action}!`
    }).then((result) => {
      if (result.isConfirmed) {
        const obs = user.active
          ? this.usersService.deactivateUser(user.userId)
          : this.usersService.activateUser(user.userId);

        obs.subscribe({
          next: () => {
            user.active = !user.active;
            this.notifService.addNotification(`User ${user.username} has been ${statusText}.`, user.active ? 'success' : 'warning');
            Swal.fire(
              'Success!',
              `User has been ${statusText}.`,
              'success'
            );
          },
          error: (err) => {
            console.error(`Error ${action}ing user:`, err);
            Swal.fire('Error', `Failed to ${action} user.`, 'error');
          }
        });
      }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.resetNewUser();
    this.isModalOpen = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.editingUserId = user.userId;
    // Clone user details into the form model (prevent unintended auto-binding to table)
    this.newUser = {
      username: user.username,
      email: user.email.replace('@biat-it.com', ''),
      password: '', // We don't fetch passwords, so keep it empty. If they don't type a new one, don't update it.
      role: user.role,
      active: user.active
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.resetNewUser();
  }

  resetNewUser(): void {
    this.newUser = {
      username: '',
      email: '',
      password: '',
      role: 'TECHNICIAN',
      active: true
    };
  }

  saveUser(): void {
    // Only strictly require password if we are creating a newly fresh user.
    if (!this.newUser.username || !this.newUser.email || (!this.isEditMode && !this.newUser.password)) {
      Swal.fire('Wait', 'Please fill in all required fields', 'info');
      return;
    }

    // Ensure we send the full email to the service
    const userToSave = { ...this.newUser };
    if (!userToSave.email.includes('@')) {
      userToSave.email = userToSave.email + '@biat-it.com';
    }

    if (this.isEditMode && this.editingUserId) {
      // Update logic
      this.usersService.updateUser(this.editingUserId, userToSave as User).subscribe({
        next: () => {
          this.notifService.addNotification(`User profile updated: ${userToSave.username}`, 'info');
          Swal.fire('Updated!', 'User profile modified successfully.', 'success');
          this.closeModal();
          this.fetchUsers();
        },
        error: (err) => {
          console.error('Error updating user:', err);
          Swal.fire('Error', 'Failed to update user profile.', 'error');
        }
      });
    } else {
      // Create logic
      this.usersService.addUser(userToSave as User).subscribe({
        next: () => {
          this.notifService.addNotification(`New user created: ${userToSave.username}`, 'success');
          Swal.fire('Created!', 'New user added successfully.', 'success');
          this.closeModal();
          this.fetchUsers();
        },
        error: (err) => {
          console.error('Error adding user:', err);
          Swal.fire('Error', 'Failed to add user. Check if email exists.', 'error');
        }
      });
    }
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  }
}
