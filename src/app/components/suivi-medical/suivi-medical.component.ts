import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuiviMedical } from '../../models/suivi-medical.model';
import { User } from '../../models/user.model';
import { Medecin } from '../../models/medecin.model';
import { SuiviMedicalService } from '../../services/suivi-medical.service';
import { UserService } from '../../services/user.service';
import { MedecinService } from '../../services/medecin.service';
import { HealthInitialService } from '../../services/health-initial.service';

@Component({
  selector: 'app-suivi-medical',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './suivi-medical.component.html',
  styleUrls: ['./suivi-medical.component.css']
})
export class SuiviMedicalComponent implements OnInit {
  suivis: SuiviMedical[] = [];
  users: User[] = [];
  medecins: Medecin[] = [];
  filteredUsers: User[] = [];
  suiviForm: FormGroup;
  isLoading = false;
  isEditing = false;
  currentSuiviId: number | null = null;
  searchTerm = '';
  alertMessage = '';
  alertType = '';
  showAlert = false;
  showSuggestions = false;
  
  // Propriétés pour le popup de données de santé
  // Dans la section des propriétés de la classe
  showHealthPopup = false;
  currentHealthData: any = null;
  loadingHealthData = false;
  editingHealth = false;
  healthForm: FormGroup;
  currentUserId: number | null = null;
  savingHealth = false;

  constructor(
    private suiviService: SuiviMedicalService,
    private userService: UserService,
    private medecinService: MedecinService,
    private fb: FormBuilder,
    private healthService: HealthInitialService
  ) {
    this.suiviForm = this.fb.group({
      id: [null],
      user_id: ['', Validators.required],
      medecin_id: ['', Validators.required],
      diagnostic: ['', Validators.required],
      recommandations: ['', Validators.required]
    });

    // Initialisation du formulaire de santé
    this.healthForm = this.fb.group({
      user_id: [null],
      imc: [null],
      tour_taille: [null],
      tour_hanches: [null],
      tour_bras: [null],
      tour_cuisses: [null],
      graisse_corporelle: [null],
      masse_musculaire: [null],
      hydratation: [null],
      tension_arterielle: [null],
      frequence_cardiaque: [null],
      glycemie: [null],
      ferritine: [null],
      cholesterol: [null],
      activite_physique: [null],
      pathologies: [null],
      date_diagnostic: [null],
      date_enregistrement: [null],
      sommeil_heures: [null],
      qualite_sommeil: [null],
      stress: [null],
      hydratation_litres: [null],
      journal_alimentaire: [null],
      score_conformite_alimentaire: [null],
      activite_physique_type: [null],
      frequence_activite: [null],
      duree_activite_minutes: [null]
    });
  }

  ngOnInit(): void {
    this.loadSuivis();
    this.loadUsers();
    this.loadMedecins();
  }

  loadSuivis(): void {
    this.isLoading = true;
    this.suiviService.getAllSuivis().subscribe({
      next: (data) => {
        this.suivis = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des suivis:', error);
        this.showAlertMessage('Erreur lors du chargement des suivis', 'danger');
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        if (!Array.isArray(data)) {
          console.error('Les données reçues ne sont pas un tableau:', data);
          this.users = [];
          this.filteredUsers = [];
          this.showAlertMessage('Format de données utilisateurs incorrect', 'danger');
          return;
        }
        
        this.users = data;
        this.filteredUsers = [];
        console.log('Liste des utilisateurs chargés:', this.users);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.showAlertMessage('Erreur lors du chargement des utilisateurs', 'danger');
      }
    });
  }

  loadMedecins(): void {
    this.medecinService.getAllMedecins().subscribe({
      next: (data) => {
        this.medecins = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des médecins:', error);
        this.showAlertMessage('Erreur lors du chargement des médecins', 'danger');
      }
    });
  }

  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [];
      this.showSuggestions = false;
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user => 
      (user.nom && user.nom.toLowerCase().includes(searchTermLower)) || 
      (user.prenom && user.prenom.toLowerCase().includes(searchTermLower)) ||
      (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
      (user.nom && user.prenom && `${user.nom.toLowerCase()} ${user.prenom.toLowerCase()}`.includes(searchTermLower))
    );
    this.showSuggestions = this.filteredUsers.length > 0;
  }

  selectUser(user: User): void {
    this.suiviForm.get('user_id')?.setValue(user.id);
    this.searchTerm = `${user.nom} ${user.prenom}`;
    this.filteredUsers = [];
    this.showSuggestions = false;
  }

  onSubmit(): void {
    if (this.suiviForm.invalid) {
      this.showAlertMessage('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }

    this.isLoading = true;
    const suiviData = this.suiviForm.value;

    if (this.isEditing && this.currentSuiviId) {
      this.suiviService.updateSuivi(this.currentSuiviId, suiviData).subscribe({
        next: () => {
          this.showAlertMessage('Suivi médical mis à jour avec succès', 'success');
          this.resetForm();
          this.loadSuivis();
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du suivi:', error);
          this.showAlertMessage('Erreur lors de la mise à jour du suivi', 'danger');
          this.isLoading = false;
        }
      });
    } else {
      this.suiviService.createSuivi(suiviData).subscribe({
        next: () => {
          this.showAlertMessage('Suivi médical créé avec succès', 'success');
          this.resetForm();
          this.loadSuivis();
        },
        error: (error) => {
          console.error('Erreur lors de la création du suivi:', error);
          this.showAlertMessage('Erreur lors de la création du suivi', 'danger');
          this.isLoading = false;
        }
      });
    }
  }

  editSuivi(suivi: SuiviMedical): void {
    this.isEditing = true;
    this.currentSuiviId = suivi.id!;
    this.suiviForm.patchValue({
      user_id: suivi.user_id,
      medecin_id: suivi.medecin_id,
      diagnostic: suivi.diagnostic,
      recommandations: suivi.recommandations
    });
    
    const user = this.users.find(u => u.id === suivi.user_id);
    if (user) {
      this.searchTerm = `${user.nom} ${user.prenom}`;
    }
  }

  deleteSuivi(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce suivi médical ?')) {
      this.isLoading = true;
      this.suiviService.deleteSuivi(id).subscribe({
        next: () => {
          this.showAlertMessage('Suivi médical supprimé avec succès', 'success');
          this.loadSuivis();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du suivi:', error);
          this.showAlertMessage('Erreur lors de la suppression du suivi', 'danger');
          this.isLoading = false;
        }
      });
    }
  }

  resetForm(): void {
    this.suiviForm.reset();
    this.isEditing = false;
    this.currentSuiviId = null;
    this.isLoading = false;
    this.searchTerm = '';
    this.filteredUsers = [];
    this.showSuggestions = false;
  }

  showAlertMessage(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.nom} ${user.prenom}` : 'Utilisateur inconnu';
  }

  getMedecinName(medecinId: number): string {
    const medecin = this.medecins.find(m => m.id === medecinId);
    return medecin ? medecin.nom : 'Médecin inconnu';
  }

  // Méthodes pour le popup de données de santé
  showHealthDetails(userId: number) {
    this.showHealthPopup = true;
    this.loadingHealthData = true;
    this.currentHealthData = null;
    this.currentUserId = userId;
    this.editingHealth = false;
    
    this.healthService.getHealthDataByUserId(userId).subscribe(
      (data) => {
        this.currentHealthData = data;
        this.loadingHealthData = false;
        console.log('Données de santé chargées:', data);
      },
      (error) => {
        console.error('Erreur lors du chargement des données de santé:', error);
        this.loadingHealthData = false;
        this.showAlertMessage('Erreur lors du chargement des données de santé', 'danger');
      }
    );
  }

  // Méthode pour fermer le popup
  closeHealthPopup() {
    this.showHealthPopup = false;
    this.editingHealth = false;
    this.currentUserId = null;
  }

  // Méthode pour vérifier si une donnée est disponible
  hasValue(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  // Méthode pour afficher une valeur ou un message par défaut
  displayValue(value: any, unit: string = '', defaultMessage: string = 'Non renseigné'): string {
    return this.hasValue(value) ? `${value}${unit}` : defaultMessage;
  }

  // Méthode pour passer en mode édition des données de santé
  editHealthData() {
    this.editingHealth = true;
    this.healthForm.patchValue(this.currentHealthData);
  }

  // Méthode pour créer de nouvelles données de santé
  createNewHealthData() {
    this.editingHealth = true;
    this.healthForm.reset();
    this.healthForm.patchValue({
      user_id: this.currentUserId
    });
  }

  // Méthode pour annuler l'édition des données de santé
  cancelHealthEdit() {
    this.editingHealth = false;
  }

  // Méthode pour enregistrer les données de santé
  saveHealthData() {
    if (this.healthForm.invalid) {
      this.showAlertMessage('Veuillez vérifier les informations saisies', 'warning');
      return;
    }

    this.savingHealth = true;
    const healthData = this.healthForm.value;
    healthData.user_id = this.currentUserId;

    // Si on a déjà des données, on les met à jour, sinon on les crée
    if (this.currentHealthData) {
      this.healthService.updateHealthData(this.currentUserId!, healthData).subscribe(
        () => {
          this.savingHealth = false;
          this.editingHealth = false;
          this.showAlertMessage('Données de santé mises à jour avec succès', 'success');
          // Recharger les données
          this.showHealthDetails(this.currentUserId!);
        },
        (error) => {
          console.error('Erreur lors de la mise à jour des données de santé:', error);
          this.savingHealth = false;
          this.showAlertMessage('Erreur lors de la mise à jour des données de santé', 'danger');
        }
      );
    } else {
      this.healthService.createHealthData(healthData).subscribe(
        () => {
          this.savingHealth = false;
          this.editingHealth = false;
          this.showAlertMessage('Données de santé créées avec succès', 'success');
          // Recharger les données
          this.showHealthDetails(this.currentUserId!);
        },
        (error) => {
          console.error('Erreur lors de la création des données de santé:', error);
          this.savingHealth = false;
          this.showAlertMessage('Erreur lors de la création des données de santé', 'danger');
        }
      );
    }
  }

  // Méthode pour confirmer la suppression des données de santé
  confirmDeleteHealthData() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ces données de santé ?')) {
      this.deleteHealthData();
    }
  }

  // Méthode pour supprimer les données de santé
  deleteHealthData() {
    this.savingHealth = true;
    this.healthService.deleteHealthData(this.currentUserId!).subscribe(
      () => {
        this.savingHealth = false;
        this.currentHealthData = null;
        this.showAlertMessage('Données de santé supprimées avec succès', 'success');
      },
      (error) => {
        console.error('Erreur lors de la suppression des données de santé:', error);
        this.savingHealth = false;
        this.showAlertMessage('Erreur lors de la suppression des données de santé', 'danger');
      }
    );
  }
}