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

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: string = '';
  medecinId: number = 0;
  selectedPatient: Patient | null = null;
  healthData: HealthInitialData | null = null;
  loadingHealthData: boolean = false;
  healthDataError: string = '';
  showHealthModal: boolean = false;
  
  // Propriétés pour l'ajout de suivi
  showSuiviModal: boolean = false;
  selectedPatientForSuivi: Patient | null = null;
  loadingSuivi: boolean = false;
  suiviError: string = '';
  selectedFile: File | null = null;
  uploadingImage: boolean = false;
  
  // Données du formulaire de suivi
  suiviForm: Partial<SuiviResultat> = {
    date_suivi: new Date().toISOString().split('T')[0],
    poids: 0,
    imc: 0,
    tour_taille: 0,
    tour_hanches: 0,
    tour_bras: 0,
    tour_cuisses: 0,
    niveau_energie: '',
    observations: '',
    adherence_programme: ''
  };

  constructor(
    private http: HttpClient, 
    private healthService: HealthInitialService,
    private suiviService: SuiviResultatsService
  ) {}

  ngOnInit(): void {
    this.loadMedecinId();
    this.loadPatients();
  }

  loadMedecinId(): void {
    // Récupérer l'ID du médecin depuis le localStorage ou le service d'authentification
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.medecinId = parseInt(userId, 10);
    }
  }

  loadPatients(): void {
    if (!this.medecinId) {
      this.error = 'ID du médecin non trouvé';
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.get<Patient[]>(`http://localhost:3000/api/suivis/${this.medecinId}/patients`)
      .subscribe({
        next: (data) => {
          this.patients = data;
          this.filteredPatients = data;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des patients';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  refreshPatients(): void {
    this.loadPatients();
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

  viewPatientDossier(patient: Patient): void {
    this.selectedPatient = patient;
    this.loadingHealthData = true;
    this.healthDataError = '';
    this.showHealthModal = true;

    this.healthService.getHealthDataByUserId(patient.user_id)
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

  closeHealthModal(): void {
    this.showHealthModal = false;
    this.selectedPatient = null;
    this.healthData = null;
    this.healthDataError = '';
  }

  // Méthodes pour l'ajout de suivi
  openSuiviModal(patient: Patient): void {
    this.selectedPatientForSuivi = patient;
    this.showSuiviModal = true;
    this.resetSuiviForm();
  }

  closeSuiviModal(): void {
    this.showSuiviModal = false;
    this.selectedPatientForSuivi = null;
    this.suiviError = '';
    this.selectedFile = null;
    this.resetSuiviForm();
  }

  resetSuiviForm(): void {
    this.suiviForm = {
      date_suivi: new Date().toISOString().split('T')[0],
      poids: 0,
      imc: 0,
      tour_taille: 0,
      tour_hanches: 0,
      tour_bras: 0,
      tour_cuisses: 0,
      niveau_energie: '',
      observations: '',
      adherence_programme: ''
    };
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
      } else {
        alert('Veuillez sélectionner un fichier image valide.');
        event.target.value = '';
      }
    }
  }

  calculateIMC(): void {
    if (this.suiviForm.poids && this.selectedPatientForSuivi) {
      // Pour calculer l'IMC, nous aurions besoin de la taille du patient
      // Pour l'instant, on laisse l'utilisateur saisir l'IMC manuellement
      // this.suiviForm.imc = this.suiviForm.poids / (taille * taille);
    }
  }

  saveSuivi(): void {
    this.submitSuivi();
  }

  async submitSuivi(): Promise<void> {
    if (!this.selectedPatientForSuivi || !this.suiviForm) {
      return;
    }

    this.loadingSuivi = true;
    this.suiviError = '';

    try {
      let photoUrl = '';

      // Upload de l'image si sélectionnée
      if (this.selectedFile) {
        this.uploadingImage = true;
        const uploadResponse = await this.suiviService.uploadImage(this.selectedFile).toPromise();
        photoUrl = uploadResponse.url;
        this.uploadingImage = false;
      }

      // Préparer les données du suivi
      const suiviData: SuiviResultat = {
        user_id: this.selectedPatientForSuivi.user_id,
        date_suivi: this.suiviForm.date_suivi!,
        poids: this.suiviForm.poids!,
        imc: this.suiviForm.imc!,
        tour_taille: this.suiviForm.tour_taille!,
        tour_hanches: this.suiviForm.tour_hanches!,
        tour_bras: this.suiviForm.tour_bras!,
        tour_cuisses: this.suiviForm.tour_cuisses!,
        niveau_energie: this.suiviForm.niveau_energie!,
        observations: this.suiviForm.observations!,
        adherence_programme: this.suiviForm.adherence_programme!,
        photo_url: photoUrl
      };

      // Envoyer les données
      await this.suiviService.createSuiviResultat(suiviData).toPromise();
      
      // Succès
      alert('Suivi médical ajouté avec succès!');
      this.closeSuiviModal();
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du suivi:', error);
      this.suiviError = 'Erreur lors de l\'ajout du suivi médical';
    } finally {
      this.loadingSuivi = false;
      this.uploadingImage = false;
    }
  }
}