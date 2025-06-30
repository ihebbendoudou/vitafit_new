import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HealthInitialService, HealthInitialData } from '../../../services/health-initial.service';
import { SuiviResultatsService, SuiviResultat } from '../../../services/suivi-resultats.service';

interface Patient {
  user_id: number;
  user_nom: string;
  user_prenom: string;
  user_email: string;
  user_tel: string;
  user_adresse: string;
  user_role: string;
  date_suivi: string;
  diagnostic: string;
  recommandations: string;
  medecin_id: number;
  medecin_nom: string;
  medecin_specialite: string;
  medecin_tel: string;
  medecin_email: string;
}

interface SuiviStatistics {
  totalSuivis: number;
  poidsEvolution: { date: string; poids: number }[];
  imcEvolution: { date: string; imc: number }[];
  dernierSuivi: SuiviResultat | null;
  moyennePoids: number;
  moyenneIMC: number;
  tendancePoids: 'hausse' | 'baisse' | 'stable';
  tendanceIMC: 'hausse' | 'baisse' | 'stable';
}

@Component({
  selector: 'app-suivi-medicaux-medecin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suivi-medicaux-medecin.component.html',
  styleUrls: ['./suivi-medicaux-medecin.component.css']
})
export class SuiviMedicauxMedecinComponent implements OnInit {
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  healthData: HealthInitialData | null = null;
  suiviHistory: SuiviResultat[] = [];
  statistics: SuiviStatistics | null = null;
  
  loading: boolean = false;
  loadingPatients: boolean = false;
  loadingHealthData: boolean = false;
  loadingSuiviHistory: boolean = false;
  
  error: string = '';
  healthDataError: string = '';
  suiviHistoryError: string = '';
  
  medecinId: number = 0;
  searchTerm: string = '';
  filteredPatients: Patient[] = [];
  userRole: string = '';
  currentUserId: number = 0;

  constructor(
    private http: HttpClient,
    private healthService: HealthInitialService,
    private suiviService: SuiviResultatsService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadPatients();
  }

  loadUserInfo(): void {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (userId) {
      this.currentUserId = parseInt(userId, 10);
      this.medecinId = parseInt(userId, 10); // Pour compatibilité
    }
    if (userRole) {
      this.userRole = userRole;
    }
  }

  loadPatients(): void {
    if (!this.currentUserId) {
      this.error = 'ID utilisateur non trouvé';
      return;
    }

    this.loadingPatients = true;
    this.error = '';

    let apiUrl = '';
    
    // Adapter l'URL selon le rôle de l'utilisateur
    switch (this.userRole) {
      case 'medecin':
        apiUrl = `http://localhost:3000/api/suivis/${this.currentUserId}/patients`;
        break;
      case 'coach':
        // Pour les coachs, récupérer seulement leurs adhérents assignés
        apiUrl = `http://localhost:3000/api/suivis/coach/${this.currentUserId}/patients`;
        break;
      case 'admin':
        // Pour les admins, récupérer tous les patients
        apiUrl = `http://localhost:3000/api/suivis/all/patients`;
        break;
      default:
        // Par défaut, utiliser l'ancien comportement pour les médecins
        apiUrl = `http://localhost:3000/api/suivis/${this.currentUserId}/patients`;
        break;
    }

    this.http.get<Patient[]>(apiUrl)
      .subscribe({
        next: (data) => {
          this.patients = data;
          this.filteredPatients = data;
          this.loadingPatients = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des patients';
          this.loadingPatients = false;
          console.error('Erreur:', error);
        }
      });
  }

  filterPatients(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = this.patients;
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredPatients = this.patients.filter(patient => 
        patient.user_prenom.toLowerCase().includes(searchLower) ||
        patient.user_nom.toLowerCase().includes(searchLower) ||
        patient.user_email.toLowerCase().includes(searchLower) ||
        (patient.user_tel && patient.user_tel.includes(this.searchTerm))
      );
    }
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.loadPatientData(patient.user_id);
  }

  loadPatientData(userId: number): void {
    this.loadHealthData(userId);
    this.loadSuiviHistory(userId);
  }

  loadHealthData(userId: number): void {
    this.loadingHealthData = true;
    this.healthDataError = '';

    this.healthService.getHealthDataByUserId(userId)
      .subscribe({
        next: (data) => {
          this.healthData = data;
          this.loadingHealthData = false;
        },
        error: (error) => {
          this.healthDataError = 'Erreur lors du chargement des données de santé';
          this.loadingHealthData = false;
          console.error('Erreur:', error);
        }
      });
  }

  loadSuiviHistory(userId: number): void {
    this.loadingSuiviHistory = true;
    this.suiviHistoryError = '';

    this.suiviService.getSuiviResultatsByUserId(userId)
      .subscribe({
        next: (data) => {
          this.suiviHistory = data.sort((a, b) => 
            new Date(b.date_suivi).getTime() - new Date(a.date_suivi).getTime()
          );
          this.calculateStatistics();
          this.loadingSuiviHistory = false;
        },
        error: (error) => {
          this.suiviHistoryError = 'Erreur lors du chargement de l\'historique des suivis';
          this.loadingSuiviHistory = false;
          console.error('Erreur:', error);
        }
      });
  }

  calculateStatistics(): void {
    if (!this.suiviHistory || this.suiviHistory.length === 0) {
      this.statistics = null;
      return;
    }

    const totalSuivis = this.suiviHistory.length;
    const dernierSuivi = this.suiviHistory[0];
    
    // Évolution du poids et IMC
    const poidsEvolution = this.suiviHistory
      .filter(s => s.poids && s.poids > 0)
      .map(s => ({ date: s.date_suivi, poids: s.poids! }))
      .reverse();
    
    const imcEvolution = this.suiviHistory
      .filter(s => s.imc && s.imc > 0)
      .map(s => ({ date: s.date_suivi, imc: s.imc! }))
      .reverse();

    // Moyennes
    const validPoids = this.suiviHistory.filter(s => s.poids && s.poids > 0);
    const validIMC = this.suiviHistory.filter(s => s.imc && s.imc > 0);
    
    const moyennePoids = validPoids.length > 0 
      ? validPoids.reduce((sum, s) => sum + s.poids!, 0) / validPoids.length 
      : 0;
    
    const moyenneIMC = validIMC.length > 0 
      ? validIMC.reduce((sum, s) => sum + s.imc!, 0) / validIMC.length 
      : 0;

    // Tendances
    const tendancePoids = this.calculateTendance(poidsEvolution.map(p => p.poids));
    const tendanceIMC = this.calculateTendance(imcEvolution.map(i => i.imc));

    this.statistics = {
      totalSuivis,
      poidsEvolution,
      imcEvolution,
      dernierSuivi,
      moyennePoids,
      moyenneIMC,
      tendancePoids,
      tendanceIMC
    };
  }

  calculateTendance(values: number[]): 'hausse' | 'baisse' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const difference = last - first;
    const percentageChange = Math.abs(difference / first) * 100;
    
    if (percentageChange < 2) return 'stable';
    return difference > 0 ? 'hausse' : 'baisse';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTendanceIcon(tendance: 'hausse' | 'baisse' | 'stable'): string {
    switch (tendance) {
      case 'hausse': return 'fas fa-arrow-up';
      case 'baisse': return 'fas fa-arrow-down';
      case 'stable': return 'fas fa-minus';
    }
  }

  getTendanceColor(tendance: 'hausse' | 'baisse' | 'stable'): string {
    switch (tendance) {
      case 'hausse': return '#e74c3c';
      case 'baisse': return '#27ae60';
      case 'stable': return '#f39c12';
    }
  }

  refreshData(): void {
    this.loadPatients();
    if (this.selectedPatient) {
      this.loadPatientData(this.selectedPatient.user_id);
    }
  }

  clearSelection(): void {
    this.selectedPatient = null;
    this.healthData = null;
    this.suiviHistory = [];
    this.statistics = null;
    this.healthDataError = '';
    this.suiviHistoryError = '';
  }
}