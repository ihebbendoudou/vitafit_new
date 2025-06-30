import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  specialite: string;
  email: string;
  telephone: string;
}

interface ConsultationData {
  objet: string;
  medecin_id: any;
  date_demande: string;
}

@Component({
  selector: 'app-consultation-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-request.component.html',
  styleUrls: ['./consultation-request.component.css']
})
export class ConsultationRequestComponent implements OnInit {
  consultationData: ConsultationData = {
    objet: '',
    medecin_id: '',
    date_demande: ''
  };

  medecins: Medecin[] = [];
  specialites: string[] = [];
  medecinsFiltres: Medecin[] = [];
  selectedSpecialite: string = '';
  
  isSubmitting: boolean = false;
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = true;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMedecins();
    this.initializeDateDemande();
  }

  initializeDateDemande(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    this.consultationData.date_demande = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  loadMedecins(): void {
    this.loading = true;
    this.http.get<Medecin[]>('http://localhost:3000/api/medecin/')
      .subscribe({
        next: (data) => {
          this.medecins = data;
          this.medecinsFiltres = data;
          
          // Extraire les spécialités uniques
          const specialitesSet = new Set(data.map(medecin => medecin.specialite));
          this.specialites = Array.from(specialitesSet).sort();
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des médecins:', error);
          this.showError('Erreur lors du chargement des médecins');
          this.loading = false;
        }
      });
  }

  onSpecialiteChange(): void {
    if (this.selectedSpecialite) {
      this.medecinsFiltres = this.medecins.filter(
        medecin => medecin.specialite === this.selectedSpecialite
      );
    } else {
      this.medecinsFiltres = this.medecins;
    }
    
    // Réinitialiser la sélection du médecin
    this.consultationData.medecin_id = null;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Vérifier si l'utilisateur est connecté
    const token = this.authService.getToken();
    if (!token) {
      this.showError('Vous devez être connecté pour faire une demande de consultation.');
      return;
    }

    this.isSubmitting = true;
    this.hideMessages();

    const userData = this.authService.getcurrentUser();
    if (!userData || !userData.id) {
      this.showError('Erreur d\'authentification. Veuillez vous reconnecter.');
      this.isSubmitting = false;
      return;
    }

    const requestData = {
      objet: this.consultationData.objet,
      medecin_id: this.consultationData.medecin_id,
      date_demande: this.consultationData.date_demande
    };

    this.http.post('http://localhost:3000/api/consultations/user/request', requestData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        this.showSuccess('Votre demande de consultation a été envoyée avec succès!');
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi de la demande:', error);
        
        if (error.status === 401) {
          this.showError('Session expirée. Veuillez vous reconnecter.');
          // Optionnel: rediriger vers la page de connexion
          // this.authService.logout();
        } else if (error.status === 400) {
          this.showError('Données invalides. Veuillez vérifier vos informations.');
        } else {
          this.showError('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.');
        }
        
        this.isSubmitting = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(this.consultationData.objet && 
             this.consultationData.date_demande);
  }

  resetForm() {
    this.consultationData = {
      objet: '',
      medecin_id: '',
      date_demande: ''
    };
    this.selectedSpecialite = '';
    this.medecinsFiltres = this.medecins;
    this.initializeDateDemande();
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    this.showErrorMessage = false;
    
    setTimeout(() => {
      this.hideMessages();
    }, 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    this.showSuccessMessage = false;
  }

  hideMessages(): void {
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
  }

  getMedecinName(medecinId: number): string {
    const medecin = this.medecins.find(m => m.id === medecinId);
    return medecin ? `Dr. ${medecin.nom} ${medecin.prenom}` : '';
  }
}