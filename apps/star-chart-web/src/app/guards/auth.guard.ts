import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { UserStateService } from '../services/user-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private userStateService: UserStateService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.userStateService.getUserState().pipe(
      take(1),
      map(user => {
        // Check if user is active
        const isActive = user.state === 'active';
        
        // If roles are specified in route data, check if user has required role
        const requiredRoles = route.data?.['roles'] as string[] | undefined;
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRole = requiredRoles.some(role => user.roles.includes(role));
          if (!hasRole) {
            this.router.navigate(['/access-denied']);
            return false;
          }
        }
        
        if (!isActive) {
          this.router.navigate(['/login']);
        }
        return isActive;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
