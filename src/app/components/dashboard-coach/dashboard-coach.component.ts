import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { ProgrammeTableComponent } from '../programme-table/programme-table.component';
import { SuiviMedicauxMedecinComponent } from '../dashboard-medecin/suivi-medicaux-medecin/suivi-medicaux-medecin.component';
import { SuiviMedicalComponent } from '../suivi-medical/suivi-medical.component';
import { CoachService } from '../../services/coach.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-dashboard-coach',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ProgrammeTableComponent, SuiviMedicauxMedecinComponent, SuiviMedicalComponent],
  templateUrl: './dashboard-coach.component.html',
  styleUrls: ['./dashboard-coach.component.css']
})
export class DashboardCoachComponent implements OnInit {
  currentSection: string = 'clients';
  sections = [
    { name: 'clients', label: 'Mes Clients', icon: 'users' },
    { name: 'seances', label: 'Séances', icon: 'dumbbell' },
    { name: 'programmes', label: 'Programmes', icon: 'clipboard-list' },
    { name: 'suivis', label: 'Suivis Médicaux', icon: 'heartbeat' },
    { name: 'planning', label: 'Planning', icon: 'calendar-alt' },
    { name: 'profile', label: 'Mon Profil', icon: 'user' }
  ];
  sidebarActive: boolean = true;
  isMobileView: boolean = false;
  coachName: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Vérifier si l'écran est en mode mobile
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    // Récupérer le nom du coach depuis le localStorage ou le service
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      this.coachName = userEmail.split('@')[0]; // Utiliser la partie avant @ comme nom d'utilisateur
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
    this.router.navigate(['/coach-dashboard', sectionName]);
    
    // Fermer la sidebar en mode mobile après la sélection
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

  getCoachId(): number {
    const coachId = localStorage.getItem('userId'); // Assuming coach uses same userId storage
    return coachId ? parseInt(coachId, 10) : 0;
  }
}