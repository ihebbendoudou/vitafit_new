import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TypeAbonnementService } from '../../services/type-abonnement.service';

type TypeAbonnement = {
  id: number;
  nom: string;
  duree_jours: number;
  prix: number;
  avec_coach: boolean;
};

@Component({
  selector: 'app-type-abonnement',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './type-abonnement.component.html',
  styleUrls: ['./type-abonnement.component.css']
})
export class TypeAbonnementComponent implements OnInit {
  abonnements: TypeAbonnement[] = [];
  abonnementForm: FormGroup;
  isEditing = false;
  currentAbonnementId: number | null = null;
  
  constructor(
    private fb: FormBuilder,
    private abonnementService: TypeAbonnementService
  ) {
    this.abonnementForm = this.fb.group({
      nom: ['', Validators.required],
      duree_jours: ['', [Validators.required, Validators.min(1)]],
      prix: ['', [Validators.required, Validators.min(0)]],
      avec_coach: [false]
    });
  }

  ngOnInit(): void {
    this.loadAbonnements();
  }

  loadAbonnements(): void {
    this.abonnementService.getAll().subscribe({
      next: (data) => this.abonnements = data,
      error: (error) => console.error('Erreur de chargement', error)
    });
  }

  onSubmit(): void {
    if (this.abonnementForm.invalid) return;

    const formData = this.abonnementForm.value;
    
    if (this.isEditing && this.currentAbonnementId) {
      this.abonnementService.update(this.currentAbonnementId, formData).subscribe({
        next: () => this.handleSuccess(),
        error: (error) => console.error('Erreur de mise à jour', error)
      });
    } else {
      this.abonnementService.create(formData).subscribe({
        next: () => this.handleSuccess(),
        error: (error) => console.error('Erreur de création', error)
      });
    }
  }

  editAbonnement(abonnement: TypeAbonnement): void {
    this.isEditing = true;
    this.currentAbonnementId = abonnement.id;
    this.abonnementForm.patchValue(abonnement);
  }

  deleteAbonnement(id: number): void {
    if (confirm('Confirmer la suppression ?')) {
      this.abonnementService.delete(id).subscribe({
        next: () => this.handleSuccess(),
        error: (error) => console.error('Erreur de suppression', error)
      });
    }
  }

  private handleSuccess(): void {
    this.loadAbonnements();
    this.abonnementForm.reset();
    this.isEditing = false;
    this.currentAbonnementId = null;
  }
}