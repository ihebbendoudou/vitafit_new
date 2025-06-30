import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CoachService } from '../../services/coach.service';
import { Coach } from '../../models/coach.model';

@Component({
  selector: 'app-coach-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './coach-management.component.html',
  styleUrls: ['./coach-management.component.css']
})
export class CoachManagementComponent implements OnInit {
  coachs: Coach[] = [];
  filteredCoachs: Coach[] = [];
  coachForm: FormGroup;
  searchQuery: string = '';
  isEditing: boolean = false;
  currentCoachId: number | null = null;
  showForm: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private coachService: CoachService,
    private fb: FormBuilder
  ) {
    this.coachForm = this.fb.group({
        nom: ['', [Validators.required]],
        prenom: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', [Validators.required]],  // Fixed: changed from 'tel' to 'telephone'
        specialite: ['', [Validators.required]],
        mot_de_passe: ['']  // Fixed: changed from 'password' to 'mot_de_passe'
      });
  }

  ngOnInit(): void {
    this.loadCoachs();
  }

  loadCoachs(): void {
    this.loading = true;
    this.coachService.getAllCoachs().subscribe({
      next: (data) => {
        this.coachs = data;
        this.filteredCoachs = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des coachs', error);
        this.errorMessage = 'Erreur lors du chargement des coachs';
        this.loading = false;
      }
    });
  }

  searchCoachs(): void {
    if (this.searchQuery.trim() === '') {
      this.filteredCoachs = this.coachs;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredCoachs = this.coachs.filter(coach => 
      coach.nom.toLowerCase().includes(query) ||
      coach.prenom.toLowerCase().includes(query) ||
      coach.email.toLowerCase().includes(query) ||
      coach.telephone.toLowerCase().includes(query) ||
      coach.specialite.toLowerCase().includes(query)
    );
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentCoachId = null;
    this.coachForm.reset();
    this.showForm = true;
  }

  openEditForm(coach: Coach): void {
    this.isEditing = true;
    this.currentCoachId = coach.id || null;
    this.coachForm.patchValue({
        nom: coach.nom,
        prenom: coach.prenom,
        email: coach.email,
        telephone: coach.telephone,  // Fixed
        specialite: coach.specialite,
        mot_de_passe: coach.mot_de_passe || ''  // Fixed
      });
      this.showForm = true;
    
  }

  closeForm(): void {
    this.showForm = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitForm(): void {
    if (this.coachForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.loading = true;
    const coachData: Coach = this.coachForm.value;
    console.log(coachData);

    if (this.isEditing && this.currentCoachId) {
      // Mise à jour d'un coach existant
      this.coachService.updateCoach(this.currentCoachId, coachData).subscribe({
        next: () => {
          this.successMessage = 'Coach mis à jour avec succès';
          this.loadCoachs();
          this.closeForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du coach', error);
          this.errorMessage = 'Erreur lors de la mise à jour du coach';
          this.loading = false;
        }
      });
    } else {
      // Ajout d'un nouveau coach
      this.coachService.addCoach(coachData).subscribe({
        next: () => {
          this.successMessage = 'Coach ajouté avec succès';
          this.loadCoachs();
          this.closeForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du coach', error);
          this.errorMessage = 'Erreur lors de l\'ajout du coach';
          this.loading = false;
        }
      });
    }
  }

  deleteCoach(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce coach ?')) {
      this.loading = true;
      this.coachService.deleteCoach(id).subscribe({
        next: () => {
          this.successMessage = 'Coach supprimé avec succès';
          this.loadCoachs();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du coach', error);
          this.errorMessage = 'Erreur lors de la suppression du coach';
          this.loading = false;
        }
      });
    }
  }
}