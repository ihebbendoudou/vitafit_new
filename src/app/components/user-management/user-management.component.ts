import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ProgrammeService } from '../../services/programme.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  userForm: FormGroup;
  searchQuery: string = '';
  isEditing: boolean = false;
  currentUserId: number | null = null;
  showForm: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private userService: UserService,
    private programmeService: ProgrammeService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditing ? [] : [Validators.required, Validators.minLength(6)]],
      tel: ['', [Validators.required]],
      adresse: ['', [Validators.required]],
      role: ['user', [Validators.required]],
      image: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loadProgrammeInfoForUsers();
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  loadProgrammeInfoForUsers(): void {
    const userPromises = this.users.map(user => {
      if (user.role === 'admin') {
        user.hasProgramme = false;
        user.programmeCount = 0;
        return Promise.resolve();
      }
      
      return new Promise<void>((resolve) => {
        this.programmeService.getProgrammesByUser(user.id!).subscribe({
          next: (programmes) => {
            user.hasProgramme = programmes.length > 0;
            user.programmeCount = programmes.length;
            resolve();
          },
          error: (error) => {
            console.error(`Erreur lors du chargement des programmes pour l'utilisateur ${user.id}:`, error);
            user.hasProgramme = false;
            user.programmeCount = 0;
            resolve();
          }
        });
      });
    });

    Promise.all(userPromises).then(() => {
      this.filteredUsers = this.users;
      this.loading = false;
    });
  }

  searchUsers(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = this.users;
      return;
    }

    this.loading = true;
    this.userService.searchUsers(this.searchQuery).subscribe({
      next: (data) => {
        this.filteredUsers = data;
        this.loading = false;
      },
      error: (error) => {
        if (error.status === 404) {
          this.filteredUsers = [];
        } else {
          this.errorMessage = 'Erreur lors de la recherche';
          console.error('Error searching users:', error);
        }
        this.loading = false;
      }
    });
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.filteredUsers = this.users;
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentUserId = null;
    this.userForm.reset({
      role: 'user'
    });
    this.showForm = true;
  }

  openEditForm(user: User): void {
    this.isEditing = true;
    this.currentUserId = user.id!;
    this.userForm.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      tel: user.tel,
      adresse: user.adresse,
      role: user.role,
      image: user.image || ''
    });
    // Remove password validation for editing
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.userForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitForm(): void {
    if (this.userForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement';
      return;
    }

    this.loading = true;
    const userData = this.userForm.value;

    if (this.isEditing && this.currentUserId) {
      // Update existing user
      this.userService.updateUser(this.currentUserId, userData).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur mis à jour avec succès';
          this.loadUsers();
          this.showForm = false;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la mise à jour de l\'utilisateur';
          console.error('Error updating user:', error);
          this.loading = false;
        }
      });
    } else {
      // Add new user
      this.userService.addUser(userData).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur ajouté avec succès';
          this.loadUsers();
          this.showForm = false;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de l\'ajout de l\'utilisateur';
          console.error('Error adding user:', error);
          this.loading = false;
        }
      });
    }
  }

  deleteUser(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.loading = true;
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.successMessage = 'Utilisateur supprimé avec succès';
          this.loadUsers();
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la suppression de l\'utilisateur';
          console.error('Error deleting user:', error);
          this.loading = false;
        }
      });
    }
  }
}