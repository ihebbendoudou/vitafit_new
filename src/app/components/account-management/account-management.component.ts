import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account-management.component.html',
  styleUrls: ['./account-management.component.css']
})
export class AccountManagementComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  submitted = false;
  passwordSubmitted = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  userId: string | null = null;
  userRole: string | null = null;
  userEmail: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.profileForm = this.formBuilder.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required]
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.mustMatch('newPassword', 'confirmPassword')
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId');
    this.userRole = localStorage.getItem('userRole');
    this.userEmail = localStorage.getItem('userEmail');

    if (this.userId) {
      this.loadUserData();
    }
  }

  // Fonction pour vérifier que les mots de passe correspondent
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  // Charger les données de l'utilisateur
  loadUserData() {
    const apiEndpoint = this.getApiEndpoint();
    
    if (!apiEndpoint) return;

    this.http.get(`${environment.apiUrl}${apiEndpoint}/${this.userId}`)
      .subscribe({
        next: (data: any) => {
          this.profileForm.patchValue({
            nom: data.nom || '',
            prenom: data.prenom || '',
            email: data.email || '',
            telephone: data.telephone || ''
          });
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors du chargement des données utilisateur';
          console.error('Erreur lors du chargement des données utilisateur', error);
        }
      });
  }

  // Déterminer l'endpoint API en fonction du rôle de l'utilisateur
  getApiEndpoint(): string | null {
    switch (this.userRole) {
      case 'admin':
      case 'user':
        return '/users';
      case 'medecin':
        return '/medecins';
      case 'coach':
        return '/coachs';
      default:
        return null;
    }
  }

  // Soumettre le formulaire de profil
  onSubmitProfile() {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    const apiEndpoint = this.getApiEndpoint();
    
    if (!apiEndpoint) {
      this.errorMessage = 'Erreur: Impossible de déterminer le type d\'utilisateur';
      this.loading = false;
      return;
    }

    this.http.put(`${environment.apiUrl}${apiEndpoint}/${this.userId}`, this.profileForm.value)
      .subscribe({
        next: () => {
          this.successMessage = 'Profil mis à jour avec succès';
          this.loading = false;
          
          // Mettre à jour l'email dans le localStorage si changé
          if (this.userEmail !== this.profileForm.value.email) {
            localStorage.setItem('userEmail', this.profileForm.value.email);
            this.userEmail = this.profileForm.value.email;
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour du profil';
          this.loading = false;
        }
      });
  }

  // Soumettre le formulaire de changement de mot de passe
  onSubmitPassword() {
    this.passwordSubmitted = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    if (this.passwordForm.invalid) {
      return;
    }

    this.loading = true;
    const apiEndpoint = this.getApiEndpoint();
    
    if (!apiEndpoint) {
      this.passwordErrorMessage = 'Erreur: Impossible de déterminer le type d\'utilisateur';
      this.loading = false;
      return;
    }

    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.http.put(`${environment.apiUrl}${apiEndpoint}/password/${this.userId}`, passwordData)
      .subscribe({
        next: () => {
          this.passwordSuccessMessage = 'Mot de passe mis à jour avec succès';
          this.loading = false;
          this.passwordForm.reset();
          this.passwordSubmitted = false;
        },
        error: (error) => {
          this.passwordErrorMessage = error.error?.message || 'Erreur lors de la mise à jour du mot de passe';
          this.loading = false;
        }
      });
  }

  // Getters pour accéder facilement aux contrôles du formulaire
  get f() { return this.profileForm.controls; }
  get p() { return this.passwordForm.controls; }
}