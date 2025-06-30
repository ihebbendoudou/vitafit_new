import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Input() brandName: string = 'VitaFit';
  @Input() currentPage: string = '';
  @Input() showCartIcon: boolean = true;
  @Input() showAuthButtons: boolean = true;
  @Output() cartClick = new EventEmitter<void>();
  @Output() menuToggle = new EventEmitter<void>();

  isMenuOpen = false;
  cartItemCount = 0;
  isLoggedIn = false;
  userRole = '';

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService
  ) {
    // S'abonner aux changements du panier
    this.cartService.cart$.subscribe(items => {
      this.cartItemCount = this.cartService.getTotalItems();
    });

    // S'abonner aux changements d'authentification
    this.authService.currentUser.subscribe((user: any) => {
      this.isLoggedIn = !!user;
      this.userRole = user?.role || '';
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.menuToggle.emit();
  }

  toggleCartModal(): void {
    this.cartClick.emit();
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
    this.isMenuOpen = false;
  }

  navigateToRecipes(): void {
    this.router.navigate(['/#recipes']);
    this.isMenuOpen = false;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
    this.isMenuOpen = false;
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
    this.isMenuOpen = false;
  }

  navigateToDashboard(): void {
    if (this.userRole) {
      this.router.navigate(['/dashboard']);
    }
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.isMenuOpen = false;
  }

  scrollToSection(sectionId: string): void {
    // Naviguer vers la page d'accueil si on n'y est pas déjà
    if (this.router.url !== '/') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.scrollToElement(sectionId), 100);
      });
    } else {
      this.scrollToElement(sectionId);
    }
    this.isMenuOpen = false;
  }

  private scrollToElement(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.currentPage === route;
  }
}