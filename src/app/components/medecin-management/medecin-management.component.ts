import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MedecinService } from '../../services/medecin.service';
import { Medecin } from '../../models/medecin.model';

@Component({
  selector: 'app-medecin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './medecin-management.component.html',
  styleUrls: ['./medecin-management.component.css']
})
export class MedecinManagementComponent implements OnInit {
  medecins: Medecin[] = [];
  filteredMedecins: Medecin[] = [];
  medecinForm: FormGroup;
  searchQuery: string = '';
  isEditing: boolean = false;
  currentMedecinId: number | null = null;
  showForm: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private medecinService: MedecinService,
    private fb: FormBuilder
  ) {
    this.medecinForm = this.fb.group({
      nom: ['', [Validators.required]],
      specialite: ['', [Validators.required]],
      telephone: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      adresse: ['', [Validators.required]],
      password: ['', this.isEditing ? [] : [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadMedecins();
  }

  loadMedecins(): void {
    this.loading = true;
    this.medecinService.getAllMedecins().subscribe({
      next: (data) => {
        this.medecins = data;
        this.filteredMedecins = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des médecins', error);
        this.errorMessage = 'Erreur lors du chargement des médecins';
        this.loading = false;
      }
    });
  }

  searchMedecins(): void {
    if (this.searchQuery.trim() === '') {
      this.filteredMedecins = this.medecins;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredMedecins = this.medecins.filter(medecin => 
      medecin.nom.toLowerCase().includes(query) ||
      medecin.specialite.toLowerCase().includes(query) ||
      medecin.email.toLowerCase().includes(query) ||
      medecin.telephone.toLowerCase().includes(query) ||
      medecin.adresse.toLowerCase().includes(query)
    );
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentMedecinId = null;
    this.medecinForm.reset();
    
    // Réinitialiser les validateurs pour le mot de passe (requis pour un nouvel ajout)
    this.medecinForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.medecinForm.get('password')?.updateValueAndValidity();
    
    this.showForm = true;
  }

  openEditForm(medecin: Medecin): void {
    this.isEditing = true;
    this.currentMedecinId = medecin.id || null;
    this.medecinForm.patchValue({
      nom: medecin.nom,
      specialite: medecin.specialite,
      telephone: medecin.telephone,
      email: medecin.email,
      adresse: medecin.adresse
    });
    
    // Rendre le mot de passe optionnel lors de l'édition
    this.medecinForm.get('password')?.clearValidators();
    this.medecinForm.get('password')?.updateValueAndValidity();
    
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitForm(): void {
    if (this.medecinForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.loading = true;
    const medecinData: Medecin = this.medecinForm.value;

    if (this.isEditing && this.currentMedecinId) {
      // Mise à jour d'un médecin existant
      this.medecinService.updateMedecin(this.currentMedecinId, medecinData).subscribe({
        next: () => {
          this.successMessage = 'Médecin mis à jour avec succès';
          this.loadMedecins();
          this.closeForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du médecin', error);
          this.errorMessage = 'Erreur lors de la mise à jour du médecin';
          this.loading = false;
        }
      });
    } else {
      // Ajout d'un nouveau médecin
      this.medecinService.addMedecin(medecinData).subscribe({
        next: () => {
          this.successMessage = 'Médecin ajouté avec succès';
          this.loadMedecins();
          this.closeForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du médecin', error);
          this.errorMessage = 'Erreur lors de l\'ajout du médecin';
          this.loading = false;
        }
      });
    }
  }

  deleteMedecin(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      this.loading = true;
      this.medecinService.deleteMedecin(id).subscribe({
        next: () => {
          this.successMessage = 'Médecin supprimé avec succès';
          this.loadMedecins();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du médecin', error);
          this.errorMessage = 'Erreur lors de la suppression du médecin';
          this.loading = false;
        }
      });
    }
  }
}