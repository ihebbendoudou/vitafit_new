import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Vérifier si l'utilisateur est connecté
    if (this.authService.isLoggedIn()) {
      // Vérifier si la route a des rôles requis
      if (route.data['roles'] && route.data['roles'].length) {
        const userRole = this.authService.getUserRole();
        // Vérifier si l'utilisateur a le rôle requis
        if (userRole && route.data['roles'].includes(userRole)) {
          return true;
        } else {
          // Rediriger vers la page d'accueil si l'utilisateur n'a pas le rôle requis
          this.router.navigate(['/']);
          return false;
        }
      }
      
      // Si aucun rôle n'est requis, autoriser l'accès
      return true;
    }

    // Non connecté, rediriger vers la page de connexion
    this.router.navigate(['/'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}