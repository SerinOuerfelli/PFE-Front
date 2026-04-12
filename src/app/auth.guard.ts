import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './services/auth.service';  // Import your AuthService here
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      
    // Check if the user is authenticated (has a valid token)
    const token = this.authService.getToken();
    const role = this.authService.getRole();  // Get the user's role from localStorage or wherever it's stored

    if (token && role) {
      // If the user is authenticated, check if they have the required role
      const requiredRole = next.data['role'];
      if (requiredRole && requiredRole !== role) {
        // If they don't have the required role, redirect to the unauthorized page
        this.router.navigate(['/unauthorized']);
        return false;
      }
      return true;  // Allow access to the route
    }

    // If not authenticated, redirect to login page
    this.router.navigate(['/login']);
    return false;
  }
}
