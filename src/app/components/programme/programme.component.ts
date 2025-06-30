import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ProgrammeService } from '../../services/programme.service';
import { UsersWithCoachService } from '../../services/users-with-coach.service';
import { Programme, JourEntrainement, Exercice, Media } from '../../models/programme.model';
import { UserWithCoach } from '../../models/user-with-coach.model';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-programme',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SafeUrlPipe],
  templateUrl: './programme.component.html',
  styleUrls: ['./programme.component.css']
})
export class ProgrammeComponent implements OnInit {
  // États du composant
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  coachId: number | null = null;
  clients: UserWithCoach[] = [];
  programmes: Programme[] = [];
  selectedProgramme: Programme | null = null;
  showForm: boolean = false;
  currentStep: number = 1; // 1: Infos programme, 2: Jours, 3: Exercices, 4: Médias
  selectedJourId: number | null = null;
  selectedExerciceId: number | null = null;
  
  // Variables pour la modification
  isEditMode: boolean = false;
  editingProgrammeId: number | null = null;
  editingJourId: number | null = null;
  editingExerciceId: number | null = null;
  selectedJour: any = null;
  selectedExercice: any = null;
  
  // Propriétés pour l'upload de fichiers
  selectedFile: File | null = null;
  filePreview: string | null = null;
  fileUploadError: string = '';
  
  // Formulaires
  programmeForm: FormGroup;
  jourForm: FormGroup;
  exerciceForm: FormGroup;
  mediaForm: FormGroup;
  
  // Options pour les formulaires
  joursOptions = [
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
  ];
  
  typesMediaOptions = [
    { value: 'image', label: 'Image' },
    { value: 'gif', label: 'GIF animé' },
    { value: 'youtube', label: 'Vidéo YouTube' }
  ];

  constructor(
    private fb: FormBuilder,
    private programmeService: ProgrammeService,
    private usersWithCoachService: UsersWithCoachService
  ) {
    // Initialisation des formulaires
    this.programmeForm = this.fb.group({
      user_id: ['', Validators.required],
      nom: ['', Validators.required],
      description: ['']
    });
    
    this.jourForm = this.fb.group({
      programme_id: ['', Validators.required],
      jour: ['', Validators.required],
      titre: [''],
      notes: ['']
    });
    
    this.exerciceForm = this.fb.group({
      jour_id: [''],
      nom: ['', Validators.required],
      description: [''],
      muscle_cible: [''],
      sets: [3, [Validators.required, Validators.min(1)]],
      repetitions: [10, [Validators.required, Validators.min(1)]],
      poids: [''],
      temps_repos: [60, [Validators.required, Validators.min(0)]],
      ordre: [1]
    });
    
    this.mediaForm = this.fb.group({
      exercice_id: ['', Validators.required],
      type: ['image', Validators.required],
      url: ['', []]
    });
  }

  ngOnInit(): void {
    this.loadCoachId();
    this.loadProgrammesByCoach();
    
    // Appliquer les validateurs initiaux en fonction du type de média
    this.onMediaTypeChange();
    
    // Écouter les changements de type de média
    this.mediaForm.get('type')?.valueChanges.subscribe(() => {
      this.onMediaTypeChange();
    });
  }

  loadCoachId(): void {
    // Récupérer l'ID du coach connecté depuis le localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.coachId = parseInt(userId, 10);
      this.loadClients();
    } else {
      this.errorMessage = "Impossible de récupérer l'ID du coach connecté";
    }
  }

  loadClients(): void {
    if (!this.coachId) {
      this.errorMessage = "ID du coach non disponible";
      return;
    }

    this.loading = true;
    this.usersWithCoachService.getUsersByCoachId(this.coachId).subscribe({
      next: (data) => {
        this.clients = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients', error);
        this.errorMessage = "Erreur lors du chargement des clients";
        this.loading = false;
      }
    });
  }

  // Ouvrir le formulaire de création de programme
  openCreateForm(): void {
    this.showForm = true;
    this.currentStep = 1;
    this.programmeForm.reset();
    this.selectedProgramme = null;
  }

  // Fermer le formulaire
  closeForm(): void {
    this.showForm = false;
    this.currentStep = 1;
    this.programmeForm.reset();
    this.jourForm.reset();
    this.exerciceForm.reset();
    this.mediaForm.reset();
    this.selectedProgramme = null;
    this.selectedJourId = null;
    this.selectedExerciceId = null;
  }

  // Soumettre le formulaire de programme
  submitProgramme(): void {
    if (this.programmeForm.invalid) {
      this.errorMessage = "Veuillez remplir tous les champs obligatoires";
      return;
    }

    this.loading = true;
    const programmeData = this.programmeForm.value;
    
    if (this.isEditMode && this.editingProgrammeId) {
      // Mode modification
      this.programmeService.updateProgramme(this.editingProgrammeId, {
        nom: programmeData.nom,
        description: programmeData.description
      }).subscribe({
        next: () => {
          this.successMessage = "Programme modifié avec succès";
          this.loadProgrammesByCoach();
          this.cancelEdit();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la modification du programme', error);
          this.errorMessage = "Erreur lors de la modification du programme";
          this.loading = false;
        }
      });
    } else {
      // Mode création
      this.programmeService.createProgramme(programmeData).subscribe({
        next: (response) => {
          this.successMessage = "Programme créé avec succès";
          this.selectedProgramme = {
            ...programmeData,
            id: response.programme_id
          };
          this.jourForm.patchValue({ programme_id: response.programme_id });
          this.currentStep = 2; // Passer à l'étape des jours
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création du programme', error);
          this.errorMessage = "Erreur lors de la création du programme";
          this.loading = false;
        }
      });
    }
  }

  // Soumettre le formulaire de jour d'entraînement
  submitJour(): void {
    if (this.jourForm.invalid) {
      this.errorMessage = "Veuillez remplir tous les champs obligatoires";
      return;
    }

    this.loading = true;
    const jourData = this.jourForm.value;
    
    if (this.isEditMode && this.editingJourId) {
      // Mode modification
      this.programmeService.updateJour(this.editingJourId, {
        jour: jourData.jour,
        titre: jourData.titre,
        notes: jourData.notes
      }).subscribe({
        next: () => {
          this.successMessage = "Jour d'entraînement modifié avec succès";
          this.refreshProgrammeDetails();
          this.cancelEdit();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la modification du jour d\'entraînement', error);
          this.errorMessage = "Erreur lors de la modification du jour d'entraînement";
          this.loading = false;
        }
      });
    } else {
      // Mode création
      this.programmeService.addJour(jourData).subscribe({
        next: (response) => {
          this.successMessage = "Jour d'entraînement ajouté avec succès";
          this.selectedJourId = response.jour_id;
          this.exerciceForm.patchValue({ jour_id: response.jour_id });
          this.currentStep = 3; // Passer à l'étape des exercices
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du jour d\'entraînement', error);
          this.errorMessage = "Erreur lors de l'ajout du jour d'entraînement";
          this.loading = false;
        }
      });
    }
  }

  // Soumettre le formulaire d'exercice
  submitExercice(): void {
    if (this.exerciceForm.invalid) {
      this.errorMessage = "Veuillez remplir tous les champs obligatoires";
      return;
    }

    this.loading = true;
    const exerciceData = this.exerciceForm.value;
    
    if (this.isEditMode && this.editingExerciceId) {
      // Mode modification
      this.programmeService.updateExercice(this.editingExerciceId, {
        nom: exerciceData.nom,
        description: exerciceData.description,
        muscle_cible: exerciceData.muscle_cible,
        sets: exerciceData.sets,
        repetitions: exerciceData.repetitions,
        poids: exerciceData.poids,
        temps_repos: exerciceData.temps_repos,
        ordre: exerciceData.ordre
      }).subscribe({
        next: () => {
          this.successMessage = "Exercice modifié avec succès";
          this.refreshProgrammeDetails();
          this.cancelEdit();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la modification de l\'exercice', error);
          this.errorMessage = "Erreur lors de la modification de l'exercice";
          this.loading = false;
        }
      });
    } else {
      // Mode création
      this.programmeService.addExercice(exerciceData).subscribe({
        next: (response) => {
          this.successMessage = "Exercice ajouté avec succès";
          this.selectedExerciceId = response.exercice_id;
          this.mediaForm.patchValue({ exercice_id: response.exercice_id });
          this.currentStep = 4; // Passer à l'étape des médias
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout de l\'exercice', error);
          this.errorMessage = "Erreur lors de l'ajout de l'exercice";
          this.loading = false;
        }
      });
    }
  }

  // Méthode appelée lorsqu'un fichier est sélectionné
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      this.filePreview = null;
      return;
    }
    
    const file = input.files[0];
    this.selectedFile = file;
    
    // Vérifier le type de fichier
    const fileType = this.mediaForm.get('type')?.value;
    const isImage = file.type.startsWith('image/');
    
    if ((fileType === 'image' && !isImage) || 
        (fileType === 'gif' && file.type !== 'image/gif')) {
      this.fileUploadError = `Le fichier sélectionné n'est pas un ${fileType === 'gif' ? 'GIF' : 'fichier image'} valide`;
      this.selectedFile = null;
      this.filePreview = null;
      return;
    }
    
    this.fileUploadError = '';
    
    // Créer un aperçu du fichier
    const reader = new FileReader();
    reader.onload = () => {
      this.filePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
  
  // Méthode appelée lors du changement de type de média
  onMediaTypeChange(): void {
    const mediaType = this.mediaForm.get('type')?.value;
    const urlControl = this.mediaForm.get('url');
    
    if (mediaType === 'youtube') {
      // Pour YouTube, l'URL est requise et doit suivre un format valide
      urlControl?.setValidators([
        Validators.required, 
        Validators.pattern('^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11}).*$')
      ]);
      console.log('YouTube validators set');
    } else {
      // Pour image/gif, l'URL n'est pas requise car on utilise un fichier
      urlControl?.clearValidators();
      console.log('URL validators cleared');
    }
    
    // Mettre à jour les validateurs
    urlControl?.updateValueAndValidity();
    console.log('URL control after update:', urlControl);
    console.log('URL valid after update:', urlControl?.valid);
    console.log('URL errors after update:', urlControl?.errors);
    
    // Réinitialiser les propriétés de fichier si on change de type
    this.selectedFile = null;
    this.filePreview = null;
    this.fileUploadError = '';
  }
  
  // Vérifier si le formulaire de média est valide
  isMediaFormValid(): boolean {
    const mediaType = this.mediaForm.get('type')?.value;
    
    // Pour YouTube, vérifier si le formulaire est valide (URL requise)
    if (mediaType === 'youtube') {
      // Vérifier spécifiquement la validité du champ URL
      const urlControl = this.mediaForm.get('url');
      const exerciceIdValid = this.mediaForm.get('exercice_id')?.valid === true;
      
      // Afficher des informations de débogage dans la console
      console.log('URL Control:', urlControl);
      console.log('URL Valid:', urlControl?.valid);
      console.log('URL Value:', urlControl?.value);
      console.log('URL Errors:', urlControl?.errors);
      console.log('Exercice ID Valid:', exerciceIdValid);
      console.log('Media Form Valid:', this.mediaForm.valid);
      
      return exerciceIdValid && urlControl?.valid === true;
    }
    
    // Pour image/gif, vérifier si un fichier est sélectionné
    if (mediaType === 'image' || mediaType === 'gif') {
      const exerciceIdValid = this.mediaForm.get('exercice_id')?.valid === true;
      return exerciceIdValid && !!this.selectedFile;
    }
    
    return false;
  }
  
  // Soumettre le formulaire de média
  submitMedia(): void {
    if (this.mediaForm.invalid) {
      this.errorMessage = "Veuillez remplir tous les champs obligatoires avec des valeurs valides";
      return;
    }
    
    const mediaType = this.mediaForm.get('type')?.value;
    
    // Si c'est une URL YouTube, utiliser la méthode existante
    if (mediaType === 'youtube') {
      this.submitMediaUrl();
      return;
    }
    
    // Si c'est une image ou un GIF, mais aucun fichier n'est sélectionné
    if ((mediaType === 'image' || mediaType === 'gif') && !this.selectedFile) {
      this.fileUploadError = "Veuillez sélectionner un fichier";
      return;
    }
    
    // Upload du fichier
    this.loading = true;
    
    const formData = new FormData();
    formData.append('image', this.selectedFile as File);
    
    this.programmeService.uploadFile(formData).subscribe({
      next: (response) => {
        // Une fois le fichier uploadé, ajouter le média avec l'URL retournée
        const mediaData = {
          exercice_id: this.mediaForm.get('exercice_id')?.value,
          type: mediaType,
          url: response.url
        };
        
        this.programmeService.addMedia(mediaData).subscribe({
          next: (mediaResponse) => {
            this.successMessage = "Média ajouté avec succès";
            this.loading = false;
            
            // Réinitialiser le formulaire et les propriétés de fichier
            this.mediaForm.patchValue({
              exercice_id: this.selectedExerciceId,
              type: 'image',
              url: ''
            });
            this.selectedFile = null;
            this.filePreview = null;
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout du média', error);
            this.errorMessage = "Erreur lors de l'ajout du média";
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors de l\'upload du fichier', error);
        this.errorMessage = "Erreur lors de l'upload du fichier";
        this.loading = false;
      }
    });
  }
  
  // Méthode pour soumettre un média de type URL (YouTube)
  submitMediaUrl(): void {
    this.loading = true;
    const mediaData = this.mediaForm.value;
    
    this.programmeService.addMedia(mediaData).subscribe({
      next: (response) => {
        this.successMessage = "Média ajouté avec succès";
        this.loading = false;
        
        // Réinitialiser le formulaire de média pour en ajouter un autre
        this.mediaForm.patchValue({
          exercice_id: this.selectedExerciceId,
          type: 'image',
          url: ''
        });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du média', error);
        this.errorMessage = "Erreur lors de l'ajout du média";
        this.loading = false;
      }
    });
  }
  
  // Ajouter un autre jour au même programme
  addAnotherJour(): void {
    this.currentStep = 2;
    this.jourForm.reset();
    this.jourForm.patchValue({ programme_id: this.selectedProgramme?.id });
    this.selectedJourId = null;
    this.selectedExerciceId = null;
  }

  // Ajouter un autre exercice au même jour
  addAnotherExercice(): void {
    this.currentStep = 3;
    this.exerciceForm.reset();
    this.exerciceForm.patchValue({ 
      jour_id: this.selectedJourId,
      sets: 3,
      repetitions: 10,
      temps_repos: 60,
      ordre: 1
    });
    this.selectedExerciceId = null;
  }

  // Terminer la création du programme
  finishProgramme(): void {
    this.successMessage = "Programme créé avec succès";
    this.closeForm();
    // Recharger la liste des programmes du coach
    this.loadProgrammesByCoach();
  }

  // Charger les programmes d'un utilisateur
  loadProgrammesByUser(userId: number): void {
    this.loading = true;
    this.programmeService.getProgrammesByUser(userId).subscribe({
      next: (data) => {
        this.programmes = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes', error);
        this.errorMessage = "Erreur lors du chargement des programmes";
        this.loading = false;
      }
    });
  }

  // Voir les détails d'un programme
  viewProgrammeDetails(programmeId: number): void {
    this.loading = true;
    this.programmeService.getProgrammeDetails(programmeId).subscribe({
      next: (data) => {
        this.selectedProgramme = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails du programme', error);
        this.errorMessage = "Erreur lors du chargement des détails du programme";
        this.loading = false;
      }
    });
  }

  // Supprimer un programme
  deleteProgramme(programmeId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      this.loading = true;
      this.programmeService.deleteProgramme(programmeId).subscribe({
        next: () => {
          this.successMessage = "Programme supprimé avec succès";
          // Recharger la liste des programmes du coach
          this.loadProgrammesByCoach();
          this.selectedProgramme = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du programme', error);
          this.errorMessage = "Erreur lors de la suppression du programme";
          this.loading = false;
        }
      });
    }
  }

  // Effacer les messages
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ===== MÉTHODES DE MODIFICATION =====

  // Modifier un programme
  editProgramme(programme: any): void {
    this.isEditMode = true;
    this.editingProgrammeId = programme.id;
    this.showForm = true;
    this.currentStep = 1;
    
    this.programmeForm.patchValue({
      user_id: programme.user_id,
      nom: programme.nom,
      description: programme.description
    });
  }

  // Modifier un jour
  editJour(jour: any): void {
    this.isEditMode = true;
    this.editingJourId = jour.id;
    this.selectedJour = jour;
    this.showForm = true;
    this.currentStep = 2;
    
    this.jourForm.patchValue({
      programme_id: jour.programme_id,
      jour: jour.jour,
      titre: jour.titre,
      notes: jour.notes
    });
  }

  // Modifier un exercice
  editExercice(exercice: any): void {
    this.isEditMode = true;
    this.editingExerciceId = exercice.id;
    this.selectedExercice = exercice;
    this.showForm = true;
    this.currentStep = 3;
    
    this.exerciceForm.patchValue({
      jour_id: exercice.jour_id,
      nom: exercice.nom,
      description: exercice.description,
      muscle_cible: exercice.muscle_cible,
      sets: exercice.sets,
      repetitions: exercice.repetitions,
      poids: exercice.poids,
      temps_repos: exercice.temps_repos,
      ordre: exercice.ordre
    });
    
    // Marquer tous les champs comme touchés pour afficher les erreurs de validation
    this.exerciceForm.markAllAsTouched();
  }

  // Supprimer un jour
  deleteJour(jourId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce jour d\'entraînement ?')) {
      this.loading = true;
      this.programmeService.deleteJour(jourId).subscribe({
        next: () => {
          this.successMessage = "Jour d'entraînement supprimé avec succès";
          this.refreshProgrammeDetails();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du jour', error);
          this.errorMessage = "Erreur lors de la suppression du jour d'entraînement";
          this.loading = false;
        }
      });
    }
  }

  // Supprimer un exercice
  deleteExercice(exerciceId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      this.loading = true;
      this.programmeService.deleteExercice(exerciceId).subscribe({
        next: () => {
          this.successMessage = "Exercice supprimé avec succès";
          this.refreshProgrammeDetails();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de l\'exercice', error);
          this.errorMessage = "Erreur lors de la suppression de l'exercice";
          this.loading = false;
        }
      });
    }
  }

  // Supprimer un média
  deleteMedia(mediaId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
      this.loading = true;
      this.programmeService.deleteMedia(mediaId).subscribe({
        next: () => {
          this.successMessage = "Média supprimé avec succès";
          this.refreshProgrammeDetails();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du média', error);
          this.errorMessage = "Erreur lors de la suppression du média";
          this.loading = false;
        }
      });
    }
  }

  // Actualiser les détails du programme
  refreshProgrammeDetails(): void {
    if (this.selectedProgramme?.id) {
      this.viewProgrammeDetails(this.selectedProgramme.id);
    }
  }

  // Annuler la modification
  cancelEdit(): void {
    this.isEditMode = false;
    this.editingProgrammeId = null;
    this.editingJourId = null;
    this.editingExerciceId = null;
    this.selectedJour = null;
    this.selectedExercice = null;
    this.closeForm();
  }

  // Charger les programmes associés au coach connecté
  loadProgrammesByCoach(): void {
    const coachId = localStorage.getItem('userId');
    if (!coachId) {
      this.errorMessage = "ID du coach non disponible";
      return;
    }

    this.loading = true;
    this.programmeService.getProgrammesByCoachId(parseInt(coachId, 10)).subscribe({
      next: (data) => {
        this.programmes = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes du coach', error);
        this.errorMessage = "Erreur lors du chargement des programmes";
        this.loading = false;
      }
    });
  }
}