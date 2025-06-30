import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ProgrammeTableComponent } from '../programme-table/programme-table.component';
import { DashboardProfileComponent } from './dashboard-profile/dashboard-profile.component';
import { WeightHistoryComponent } from './weight-history/weight-history.component';
import { AbonnementInfoComponent } from './abonnement-info/abonnement-info.component';
import { DossierMedicalComponent } from './dossier-medical/dossier-medical.component';


@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.css']
})
export class DashboardUserComponent implements OnInit {
  currentSection: string = 'abonnement';
  sections = [
    { name: 'abonnement', label: 'Mon Abonnement', icon: 'crown' },
    { name: 'profile', label: 'Mon Profil', icon: 'user' },
    { name: 'poids', label: 'Mon Poids', icon: 'weight' },
    { name: 'suivi', label: 'Suivi Médical', icon: 'heartbeat' },
    { name: 'consultation', label: 'Demander Consultation', icon: 'calendar-plus' },
    { name: 'planning', label: 'Planning', icon: 'calendar-alt' },
    { name: 'programme', label: 'Mes Programmes', icon: 'dumbbell' },
    { name: 'reminder', label: 'Rappels d\'Entraînement', icon: 'bell' },

  ];
  sidebarActive: boolean = true;
  isMobileView: boolean = false;
  userName: string = '';
  userId: number = 0;

  constructor(
    private router: Router, 
    private authService: AuthService, 
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Vérifier si l'écran est en mode mobile
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    // Récupérer les informations utilisateur
    const userData = this.authService.getcurrentUser();
    if (userData) {
      this.userId = userData.id || this.getUserId();
      // Récupérer les informations complètes de l'utilisateur depuis l'API
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          this.userName = user.nom || 'Utilisateur';
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des informations utilisateur:', error);
          this.userName = 'Utilisateur';
        }
      });
    } else {
      this.userId = this.getUserId();
      // Si pas de données d'authentification, essayer de récupérer depuis l'ID stocké
      if (this.userId > 0) {
        this.userService.getUserById(this.userId).subscribe({
          next: (user) => {
            this.userName = user.nom || 'Utilisateur';
          },
          error: (error) => {
            console.error('Erreur lors de la récupération des informations utilisateur:', error);
            this.userName = 'Utilisateur';
          }
        });
      }
    }

    // Écouter les changements de route pour mettre à jour la section active
    this.route.firstChild?.url.subscribe(url => {
      if (url && url.length > 0) {
        this.currentSection = url[0].path;
      }
    });
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 768;
    if (this.isMobileView) {
      this.sidebarActive = false;
    }
  }

  changeSection(sectionName: string): void {
    this.router.navigate(['/user-dashboard', this.userId, sectionName]);
    if (this.isMobileView) {
      this.sidebarActive = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarActive = !this.sidebarActive;
  }

  logout(): void {
    this.authService.logout();
  }

  getUserId(): number {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : 0;
  }
}