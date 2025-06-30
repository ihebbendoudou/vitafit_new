import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Importer AuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService // Remplacer HttpClient par AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Utiliser le service pour vérifier la connexion
    if (this.authService.isLoggedIn()) {
      this.authService.redirectBasedOnRole();
    }
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Utiliser le service d'authentification pour la connexion
    this.authService.login(this.f['email'].value, this.f['password'].value)
      .subscribe({
        next: () => {
          // Redirection gérée par le service
          this.authService.redirectBasedOnRole();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la connexion';
          this.loading = false;
        }
      });
  }
}