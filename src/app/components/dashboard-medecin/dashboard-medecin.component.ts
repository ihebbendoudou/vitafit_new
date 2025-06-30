import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PatientsComponent } from './patients/patients.component';
import { SuiviMedicauxMedecinComponent } from './suivi-medicaux-medecin/suivi-medicaux-medecin.component';
import { ConsultationsMedecinComponent } from './consultations-medecin/consultations-medecin.component';


@Component({
  selector: 'app-dashboard-medecin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PatientsComponent, SuiviMedicauxMedecinComponent, ConsultationsMedecinComponent],
  templateUrl: './dashboard-medecin.component.html',
  styleUrls: ['./dashboard-medecin.component.css']
})
export class DashboardMedecinComponent implements OnInit {
  currentSection: string = 'patients';
  sections = [
    { name: 'patients', label: 'Mes Patients', icon: 'users' },
    { name: 'consultations', label: 'Consultations', icon: 'stethoscope' },
    {name: 'suivis', label: 'Suivis Médicaux', icon: 'heartbeat' },
    { name: 'planning', label: 'Planning', icon: 'calendar-alt' },
    { name: 'profile', label: 'Mon Profil', icon: 'user-md' }
  ];
  sidebarActive: boolean = true;
  isMobileView: boolean = false;
  medecinName: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Vérifier si l'écran est en mode mobile
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    // Récupérer le nom du médecin depuis le localStorage ou le service
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      this.medecinName = userEmail.split('@')[0]; // Utiliser la partie avant @ comme nom d'utilisateur
    }
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 768;
    if (this.isMobileView) {
      this.sidebarActive = false;
    }
  }

  changeSection(sectionName: string): void {
    this.currentSection = sectionName;
    // Pas besoin de navigation pour l'instant car on affiche directement les composants
    // this.router.navigate(['/medecin-dashboard', sectionName]);
    
    // Fermer la sidebar en mode mobile après la sélection
    if (this.isMobileView) {
      this.sidebarActive = false;
    }
  }

  getSectionLabel(sectionName: string): string {
    const section = this.sections.find(s => s.name === sectionName);
    return section ? section.label : sectionName;
  }

  toggleSidebar(): void {
    this.sidebarActive = !this.sidebarActive;
  }

  logout(): void {
    this.authService.logout();
  }
}