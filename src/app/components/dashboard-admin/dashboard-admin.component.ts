import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SuiviMedicauxMedecinComponent } from '../dashboard-medecin/suivi-medicaux-medecin/suivi-medicaux-medecin.component';
import { RecipeManagementComponent } from './recipe-management/recipe-management.component';
import { ConsultationsUnifiedComponent } from './consultations-unified/consultations-unified.component';
import { ProductManagementComponent } from './product-management/product-management.component';
import { OrderManagementComponent } from './order-management/order-management.component';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    RouterOutlet, 
    CommonModule, 
    SuiviMedicauxMedecinComponent, 
    RecipeManagementComponent, 
    ConsultationsUnifiedComponent,
    ProductManagementComponent,
    OrderManagementComponent,
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit {
  currentSection: string = 'users';
  sections = [
    { name: 'users', label: 'Utilisateurs', icon: 'users' },
    { name: 'abonnementstype', label: 'Types d\'abonnement', icon: 'id-card' },
    { name: 'abonnements', label: 'Abonnements', icon: 'credit-card' },
    { name: 'coachs', label: 'Coachs', icon: 'dumbbell' },
    { name: 'medecins', label: 'Médecins', icon: 'user-md' },
    { name: 'consultations', label: 'Gestion des Consultations', icon: 'calendar-check' },
    { name: 'suivi-medical', label: 'Suivi Médical', icon: 'heartbeat' },
    { name: 'paiements', label: 'Paiements', icon: 'money-bill-wave' },
    { name: 'recettes', label: 'Recettes', icon: 'utensils' },
    { name: 'produits', label: 'Produits & Catégories', icon: 'boxes' },
    { name: 'commandes', label: 'Gestion des Commandes', icon: 'shopping-cart' }
  ];
  sidebarActive: boolean = true;
  isMobileView: boolean = false;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    // Vérifier la taille de l'écran au chargement
    this.checkScreenSize();
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  /**
   * Vérifie la taille de l'écran et ajuste la sidebar en conséquence
   */
  checkScreenSize(): void {
    this.isMobileView = window.innerWidth <= 768;
    this.sidebarActive = window.innerWidth > 768;
  }

  /**
   * Bascule l'état de la sidebar (ouverte/fermée)
   */
  toggleSidebar(): void {
    this.sidebarActive = !this.sidebarActive;
    
 
  }

  /**
   * Change la section active du dashboard et navigue vers la route correspondante
   */
  changeSection(section: string): void {
    this.currentSection = section;
    this.router.navigate(['/dashboard', section]);
    
    // Fermer automatiquement la sidebar en mode mobile après la navigation
    if (this.isMobileView) {
      this.sidebarActive = false;
    }
  }

  /**
   * Gère la déconnexion de l'utilisateur
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}