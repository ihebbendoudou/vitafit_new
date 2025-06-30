import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AbonnementService, Abonnement } from '../../services/abonnement.service';
import { TypeAbonnementService } from '../../services/type-abonnement.service';
import { UserService } from '../../services/user.service';
import { CoachService } from '../../services/coach.service';
import { User } from '../../models/user.model';
import { Coach } from '../../models/coach.model';
import { HealthInitialService, HealthInitialData } from '../../services/health-initial.service';

type TypeAbonnement = {
  id: number;
  nom: string;
  duree_jours: number;
  prix: number;
  avec_coach: boolean;
};

@Component({
  selector: 'app-abonnement',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './abonnement.component.html',
  styleUrls: ['./abonnement.component.css']
})
export class AbonnementComponent implements OnInit {
  abonnements: Abonnement[] = [];
  typeAbonnements: TypeAbonnement[] = [];
  users: User[] = [];
  coaches: Coach[] = [];
  abonnementForm: FormGroup;
  isEditing = false;
  currentAbonnementId: number | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showForm = false;
  showCoachSelector = false;
  isTypeWithCoach = false;
  showAlert = false;
  alertType = '';
  alertMessage = '';
  
  // Propriétés pour le tri
  sortColumn: string = 'date_creation';
  sortDirection: 'asc' | 'desc' = 'desc';
  sortIcon: { [key: string]: string } = {};
  defaultSortApplied: boolean = false;
  
  // Propriétés pour la recherche dans le tableau
  tableSearchTerm: string = '';
  filteredAbonnements: Abonnement[] = [];
  tableSuggestions: string[] = [];
  showTableSuggestions: boolean = false;
  
  // Propriétés pour l'autocomplétion
  searchTerm: string = '';
  filteredUsers: User[] = [];
  showUserSuggestions: boolean = false;
  selectedUser: User | null = null;
  
  // Propriétés pour les données de santé
  showHealthPopup: boolean = false;
  currentHealthData: HealthInitialData | any;
  loadingHealthData: boolean = false;
  editingHealth: boolean = false;
  healthForm: FormGroup;
  currentUserId: number | null = null;
  savingHealth: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private abonnementService: AbonnementService,
    private typeAbonnementService: TypeAbonnementService,
    private userService: UserService,
    private coachService: CoachService,
    private healthService: HealthInitialService
  ) {
    this.abonnementForm = this.fb.group({
      user_id: ['', Validators.required],
      type_id: ['', Validators.required],
      date_debut: ['', Validators.required],
      date_fin: ['', Validators.required],
      coach_id: [null]
    });

    // Écouter les changements du type d'abonnement pour afficher/masquer le sélecteur de coach
    // et calculer automatiquement la date de fin
    this.abonnementForm.get('type_id')?.valueChanges.subscribe(typeId => {
      this.updateCoachRequirement(typeId);
      this.calculateEndDate();
    });
    
    // Écouter les changements de la date de début pour recalculer la date de fin
    this.abonnementForm.get('date_debut')?.valueChanges.subscribe(() => {
      this.calculateEndDate();
    });
    
    // Initialisation du formulaire de santé
    this.healthForm = this.fb.group({
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
      activite_physique_type: [null],
      frequence_activite: [null],
      duree_activite_minutes: [null],
      sommeil_heures: [null],
      qualite_sommeil: [null],
      stress: [null],
      hydratation_litres: [null],
      journal_alimentaire: [null],
      score_conformite_alimentaire: [null],
      pathologies: [null],
      date_diagnostic: [null]
    });
  }

  ngOnInit(): void {
    this.loadAbonnements();
    this.loadTypeAbonnements();
    this.loadUsers();
    this.loadCoachs();
    
    // Initialiser l'icône de tri pour la colonne par défaut
    this.sortIcon[this.sortColumn] = this.sortDirection === 'asc' ? '↑' : '↓';
  }

  loadAbonnements(): void {
    this.loading = true;
    this.errorMessage = '';
    this.abonnementService.getAllAbonnements().subscribe({
      next: (data) => {
        console.log('Abonnements chargés:', data);
        this.abonnements = data;
        
        // Appliquer le tri par défaut lors du chargement initial
        if (!this.defaultSortApplied) {
          this.sortData(this.sortColumn);
          this.defaultSortApplied = true;
        } else {
          // Réappliquer le tri actuel si les données sont rechargées
          this.sortData(this.sortColumn, false);
        }
        
        // Initialiser la liste filtrée
        this.filteredAbonnements = [...this.abonnements];
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur de chargement des abonnements', error);
        this.errorMessage = 'Erreur lors du chargement des abonnements';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

    
  private downloadSortedData(data: any[]) {
  const sortedData = data.sort((a, b) => a.id - b.id);
  const content = 'Abonnements chargés (triés par id):\n' + 
                 JSON.stringify(sortedData, null, 2);
  this.downloadFile(content, 'abonnements_tries_par_id.txt');
}
    private downloadFile(data: string, filename: string) {
      const blob = new Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
  loadTypeAbonnements(): void {
    this.typeAbonnementService.getAll().subscribe({
      next: (data) => this.typeAbonnements = data,
      error: (error) => console.error('Erreur de chargement des types d\'abonnement', error)
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = [...this.users];
      },
      error: (error) => console.error('Erreur de chargement des utilisateurs', error)
    });
  }

  loadCoachs(): void {
    this.coachService.getAllCoachs().subscribe({
      next: (data) => {
        this.coaches = data;
      },
      error: (error) => console.error('Erreur de chargement des coachs', error)
    });
  }

  // Méthode pour filtrer les utilisateurs en fonction du terme de recherche
  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user => {
      const fullName = `${user.nom} ${user.prenom}`.toLowerCase();
      const reverseName = `${user.prenom} ${user.nom}`.toLowerCase();
      return user.nom.toLowerCase().includes(searchTermLower) || 
             user.prenom.toLowerCase().includes(searchTermLower) || 
             (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
             fullName.includes(searchTermLower) ||
             reverseName.includes(searchTermLower);
    });
    
    this.showUserSuggestions = true;
  }

  // Méthode pour sélectionner un utilisateur dans la liste des suggestions
  selectUser(user: User): void {
    this.selectedUser = user;
    this.searchTerm = `${user.nom} ${user.prenom}`;
    this.abonnementForm.get('user_id')?.setValue(user.id);
    this.showUserSuggestions = false;
  }

  // Méthode pour gérer la perte de focus du champ de recherche
  onSearchBlur(): void {
    // Délai pour permettre le clic sur une suggestion avant qu'elle ne disparaisse
    setTimeout(() => {
      this.showUserSuggestions = false;
    }, 200);
  }
  
  // Méthode pour trier les données
  sortData(column: string, toggleDirection: boolean = true): void {
    // Si on clique sur la même colonne, on inverse la direction du tri
    if (this.sortColumn === column && toggleDirection) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else if (toggleDirection) {
      // Si on clique sur une nouvelle colonne, on la trie par défaut en ordre ascendant
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Réinitialiser tous les icônes de tri
    this.sortIcon = {};
    // Définir l'icône pour la colonne active
    this.sortIcon[column] = this.sortDirection === 'asc' ? '↑' : '↓';
    
    // Trier les abonnements en fonction de la colonne et de la direction
    this.abonnements.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // Déterminer les valeurs à comparer en fonction de la colonne
      switch(column) {
        case 'id':
          valueA = a.id || 0;
          valueB = b.id || 0;
          break;
        case 'user_name':
          valueA = a.utilisateur ? `${a.utilisateur.nom} ${a.utilisateur.prenom}` : this.getUserName(a.user_id);
          valueB = b.utilisateur ? `${b.utilisateur.nom} ${b.utilisateur.prenom}` : this.getUserName(b.user_id);
          break;
        case 'type_name':
          valueA = a.type_abonnement ? a.type_abonnement.nom : this.getTypeAbonnementName(a.type_id);
          valueB = b.type_abonnement ? b.type_abonnement.nom : this.getTypeAbonnementName(b.type_id);
          break;
        case 'date_debut':
          valueA = new Date(a.date_debut).getTime();
          valueB = new Date(b.date_debut).getTime();
          break;
        case 'date_fin':
          valueA = new Date(a.date_fin).getTime();
          valueB = new Date(b.date_fin).getTime();
          break;
        case 'prix':
          valueA = a.type_abonnement ? a.type_abonnement.prix : 0;
          valueB = b.type_abonnement ? b.type_abonnement.prix : 0;
          break;
      
          break;
        default:
          valueA = a[column as keyof Abonnement] || '';
          valueB = b[column as keyof Abonnement] || '';
      }
      
      // Comparer les valeurs en fonction de la direction du tri
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else {
        return this.sortDirection === 'asc' 
          ? (valueA > valueB ? 1 : -1) 
          : (valueA < valueB ? 1 : -1);
      }
    });
    
    // Mettre à jour la liste filtrée
    this.filterAbonnements();
  }
  
  // Méthode pour filtrer les abonnements en fonction du terme de recherche
  filterAbonnements(): void {
    if (!this.tableSearchTerm || this.tableSearchTerm.trim() === '') {
      this.filteredAbonnements = [...this.abonnements];
      this.tableSuggestions = [];
      return;
    }
    
    const searchTerm = this.tableSearchTerm.toLowerCase().trim();
    
    // Générer les suggestions pour l'autocomplétion
    this.generateTableSuggestions(searchTerm);
    
    this.filteredAbonnements = this.abonnements.filter(abonnement => {
      // Rechercher dans l'ID
      if (abonnement.id && abonnement.id.toString().includes(searchTerm)) {
        return true;
      }
      
      // Rechercher dans le nom d'utilisateur
      const userName = abonnement.utilisateur 
        ? `${abonnement.utilisateur.nom} ${abonnement.utilisateur.prenom}`.toLowerCase() 
        : this.getUserName(abonnement.user_id).toLowerCase();
      if (userName.includes(searchTerm)) {
        return true;
      }
      
      // Rechercher dans le type d'abonnement
      const typeName = abonnement.type_abonnement 
        ? abonnement.type_abonnement.nom.toLowerCase() 
        : this.getTypeAbonnementName(abonnement.type_id).toLowerCase();
      if (typeName.includes(searchTerm)) {
        return true;
      }
      
      // Rechercher dans les dates
      if (abonnement.date_debut && abonnement.date_debut.toLowerCase().includes(searchTerm)) {
        return true;
      }
      if (abonnement.date_fin && abonnement.date_fin.toLowerCase().includes(searchTerm)) {
        return true;
      }
     
      
      // Rechercher dans le nom du coach
      const coachName = abonnement.coach 
      ? `${abonnement.coach.nom} ${abonnement.coach.prenom}`.toLowerCase() 
       : this.getCoachName(abonnement.coach_id).toLowerCase();
     if (coachName.includes(searchTerm)) {
      return true;
      }
      
      // Rechercher dans le prix
      const prix = abonnement.type_abonnement 
        ? abonnement.type_abonnement.prix.toString() 
        : '';
      if (prix.includes(searchTerm)) {
        return true;
      }
      
      return false;
    });
  }
  
  // Méthode pour générer les suggestions pour l'autocomplétion
  generateTableSuggestions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.tableSuggestions = [];
      return;
    }
    
    const suggestions = new Set<string>();
    const maxSuggestions = 10;
    
    // Collecter les suggestions à partir des différentes colonnes
    this.abonnements.forEach(abonnement => {
      // Suggestions d'ID
      if (abonnement.id && abonnement.id.toString().includes(searchTerm)) {
        suggestions.add(abonnement.id.toString());
      }
      
      // Suggestions de noms d'utilisateurs
      const userName = abonnement.utilisateur 
        ? `${abonnement.utilisateur.nom} ${abonnement.utilisateur.prenom}` 
        : this.getUserName(abonnement.user_id);
      if (userName.toLowerCase().includes(searchTerm)) {
        suggestions.add(userName);
      }
      
      // Suggestions de types d'abonnement
      const typeName = abonnement.type_abonnement 
        ? abonnement.type_abonnement.nom 
        : this.getTypeAbonnementName(abonnement.type_id);
      if (typeName.toLowerCase().includes(searchTerm)) {
        suggestions.add(typeName);
      }
      
    
    });
    
    // Convertir le Set en tableau et limiter le nombre de suggestions
    this.tableSuggestions = Array.from(suggestions).slice(0, maxSuggestions);
  }
  
  // Méthode pour sélectionner une suggestion
  selectTableSuggestion(suggestion: string): void {
    this.tableSearchTerm = suggestion;
    this.filterAbonnements();
    this.showTableSuggestions = false;
  }
  
  // Méthode pour gérer la perte de focus du champ de recherche
  onTableSearchBlur(): void {
    setTimeout(() => {
      this.showTableSuggestions = false;
    }, 200);
  }

  openEditForm(abonnement: Abonnement): void {
    this.isEditing = true;
    this.currentAbonnementId = abonnement.id!;
    
    // Trouver l'utilisateur correspondant pour afficher son nom dans le champ de recherche
    const user = this.users.find(u => u.id === abonnement.user_id);
    if (user) {
      this.selectedUser = user;
      this.searchTerm = `${user.nom} ${user.prenom}`;
    }
    
    this.abonnementForm.patchValue({
      user_id: abonnement.user_id,
      type_id: abonnement.type_id,
      date_debut: this.formatDateForInput(abonnement.date_debut),
      date_fin: this.formatDateForInput(abonnement.date_fin),
      coach_id: abonnement.coach_id || null
    });
    this.showForm = true;
    
    // Mettre à jour l'affichage du sélecteur de coach
    this.updateCoachRequirement(abonnement.type_id);
  }
  
  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // mois commence à 0
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cancelForm(): void {
    this.showForm = false;
    this.abonnementForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditing = false;
    this.currentAbonnementId = null;
    this.searchTerm = '';
    this.selectedUser = null;
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentAbonnementId = null;
    this.abonnementForm.reset();
    this.showForm = true;
    this.searchTerm = '';
    this.selectedUser = null;
  }

  updateCoachRequirement(typeId: number): void {
    if (!typeId) {
      this.showCoachSelector = false;
      this.isTypeWithCoach = false;
      return;
    }
    
    const selectedType = this.typeAbonnements.find(type => type.id === +typeId);
    if (selectedType) {
      this.showCoachSelector = true;
      this.isTypeWithCoach = selectedType.avec_coach;
      
      // Si le type d'abonnement nécessite un coach, ajouter la validation
      const coachControl = this.abonnementForm.get('coach_id');
      if (this.isTypeWithCoach) {
        coachControl?.setValidators([Validators.required]);
      } else {
        coachControl?.clearValidators();
        coachControl?.setValue(null);
      }
      coachControl?.updateValueAndValidity();
    }
  }

  calculateEndDate(): void {
    const typeId = this.abonnementForm.get('type_id')?.value;
    const dateDebut = this.abonnementForm.get('date_debut')?.value;
    
    if (!typeId || !dateDebut) return;
    
    const selectedType = this.typeAbonnements.find(type => type.id === +typeId);
    if (selectedType) {
      const startDate = new Date(dateDebut);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedType.duree_jours);
      
      this.abonnementForm.get('date_fin')?.setValue(this.formatDateForInput(endDate));
    }
  }

  onSubmit(): void {
    if (this.abonnementForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const formData = this.abonnementForm.value;
    
    if (this.isEditing && this.currentAbonnementId) {
      // Mise à jour d'un abonnement existant
      this.abonnementService.updateAbonnement(this.currentAbonnementId, formData).subscribe({
        next: (response) => {
          this.successMessage = 'Abonnement mis à jour avec succès';
          this.loadAbonnements();
          this.showForm = false;
          this.abonnementForm.reset();
          this.isEditing = false;
          this.currentAbonnementId = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de l\'abonnement', error);
          this.errorMessage = 'Erreur lors de la mise à jour de l\'abonnement';
          this.loading = false;
        }
      });
    } else {
      // Création d'un nouvel abonnement
      this.abonnementService.createAbonnement(formData).subscribe({
        next: (response) => {
          this.successMessage = 'Abonnement créé avec succès';
          this.loadAbonnements();
          this.showForm = false;
          this.abonnementForm.reset();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'abonnement', error);
          this.errorMessage = 'Erreur lors de la création de l\'abonnement';
          this.loading = false;
        }
      });
    }
  }

  deleteAbonnement(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      this.abonnementService.deleteAbonnement(id).subscribe({
        next: () => {
          this.successMessage = 'Abonnement supprimé avec succès';
          this.loadAbonnements();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de l\'abonnement', error);
          this.errorMessage = 'Erreur lors de la suppression de l\'abonnement';
          this.loading = false;
        }
      });
    }
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.prenom} ${user.nom}` : 'Utilisateur inconnu';
  }

  getTypeAbonnementName(typeId: number): string {
    const type = this.typeAbonnements.find(t => t.id === typeId);
    return type ? type.nom : 'Type inconnu';
  }

  getCoachName(coachId: number | null | undefined): string {
    if (!coachId) return 'Aucun coach';
    const coach = this.coaches.find(c => c.id === coachId);
    return coach ? `${coach.prenom} ${coach.nom}` : 'Coach inconnu';

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
  showAlertMessage(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
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