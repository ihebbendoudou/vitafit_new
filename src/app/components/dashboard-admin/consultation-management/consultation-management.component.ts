import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ConsultationService, Consultation } from '../../../services/consultation.service';

@Component({
  selector: 'app-consultation-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-management.component.html',
  styleUrls: ['./consultation-management.component.css']
})
export class ConsultationManagementComponent implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  searchTerm = '';
  typeFilter = '';
  priorityFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  constructor(
    private authService: AuthService,
    private consultationService: ConsultationService
  ) {}

  ngOnInit(): void {
    this.loadPendingConsultations();
  }

  loadPendingConsultations(): void {
    this.consultationService.getConsultationsByStatus('en_attente').subscribe({
      next: (consultations) => {
        this.consultations = consultations;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des consultations:', error);
        if (error.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          this.authService.logout();
        }
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.consultations];

    // Filtre par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(consultation => {
        const patientName = this.getPatientName(consultation).toLowerCase();
        const patientEmail = this.getPatientEmail(consultation).toLowerCase();
        const objet = consultation.objet?.toLowerCase() || '';
        const medecinInfo = this.getMedecinInfo(consultation).toLowerCase();
        
        return patientName.includes(term) ||
               patientEmail.includes(term) ||
               objet.includes(term) ||
               medecinInfo.includes(term);
      });
    }

    // Filtre par type
    if (this.typeFilter) {
      filtered = filtered.filter(consultation => consultation.type === this.typeFilter);
    }

    // Filtre par priorité
    if (this.priorityFilter) {
      filtered = filtered.filter(consultation => 
        this.getConsultationPriority(consultation) === this.priorityFilter
      );
    }

    this.filteredConsultations = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredConsultations.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  getPaginatedConsultations(): Consultation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredConsultations.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.priorityFilter = '';
    this.applyFilters();
  }

  getPatientName(consultation: Consultation): string {
    if (consultation.type === 'adherent' && consultation.user_nom && consultation.user_prenom) {
      return `${consultation.user_prenom} ${consultation.user_nom}`;
    } else if (consultation.type === 'internaute' && consultation.guest_nom && consultation.guest_prenom) {
      return `${consultation.guest_prenom} ${consultation.guest_nom}`;
    }
    return consultation.type === 'adherent' ? 'Adhérent inconnu' : 'Invité inconnu';
  }

  getPatientEmail(consultation: Consultation): string {
    if (consultation.type === 'adherent' && consultation.user_email) {
      return consultation.user_email;
    } else if (consultation.type === 'internaute' && consultation.guest_email) {
      return consultation.guest_email;
    }
    return 'Email non disponible';
  }

  getMedecinInfo(consultation: Consultation): string {
    if (consultation.medecin_nom && consultation.medecin_specialite) {
      return `Dr. ${consultation.medecin_nom} (${consultation.medecin_specialite})`;
    }
    return 'Médecin non assigné';
  }

  getConsultationPriority(consultation: Consultation): 'high' | 'medium' | 'low' {
    const daysSinceRequest = this.getDaysSinceRequest(consultation.date_demande);
    if (daysSinceRequest > 7) return 'high';
    if (daysSinceRequest > 3) return 'medium';
    return 'low';
  }

  getDaysSinceRequest(dateString: string): number {
    if (!dateString) return 0;
    const requestDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - requestDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getFormattedRequestDate(consultation: Consultation): string {
    const days = this.getDaysSinceRequest(consultation.date_demande);
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    return `Il y a ${days} jours`;
  }

  getConsultationsByPriority(priority: 'high' | 'medium' | 'low'): Consultation[] {
    return this.consultations.filter(consultation => 
      this.getConsultationPriority(consultation) === priority
    );
  }

  getConsultationsByType(type: 'adherent' | 'internaute'): Consultation[] {
    return this.consultations.filter(consultation => consultation.type === type);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Non définie';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }

  approveConsultation(consultation: Consultation): void {
    if (!consultation.id) return;

    const updateData = {
      commentaire_admin: 'Consultation approuvée par l\'administrateur',
      medecin_id: consultation.medecin_id
    };

    this.consultationService.approveByAdmin(consultation.id, updateData).subscribe({
      next: () => {
        this.loadPendingConsultations();
        alert('Consultation approuvée avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation:', error);
        alert('Erreur lors de l\'approbation de la consultation.');
      }
    });
  }

  rejectConsultation(consultation: Consultation): void {
    if (!consultation.id) return;

    const reason = prompt('Raison du refus (optionnel):');
    const commentaire = reason || 'Consultation refusée par l\'administrateur';

    this.consultationService.rejectByAdmin(consultation.id, commentaire).subscribe({
      next: () => {
        this.loadPendingConsultations();
        alert('Consultation refusée.');
      },
      error: (error) => {
        console.error('Erreur lors du refus:', error);
        alert('Erreur lors du refus de la consultation.');
      }
    });
  }

  deleteConsultation(consultation: Consultation): void {
    if (!consultation.id) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cette consultation ?')) {
      this.consultationService.deleteConsultation(consultation.id).subscribe({
        next: () => {
          this.loadPendingConsultations();
          alert('Consultation supprimée avec succès!');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de la consultation.');
        }
      });
    }
  }
}