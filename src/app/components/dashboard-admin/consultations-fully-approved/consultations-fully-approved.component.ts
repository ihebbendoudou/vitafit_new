import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultationService, Consultation } from '../../../services/consultation.service';

@Component({
  selector: 'app-consultations-fully-approved',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultations-fully-approved.component.html',
  styleUrls: ['./consultations-fully-approved.component.css']
})
export class ConsultationsFullyApprovedComponent implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  searchTerm: string = '';
  typeFilter: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loading: boolean = false;

  constructor(private consultationService: ConsultationService) {}

  ngOnInit(): void {
    this.loadFullyApprovedConsultations();
  }

  /**
   * Charge les consultations approuvées par l'admin ET le médecin
   */
  loadFullyApprovedConsultations(): void {
    this.loading = true;
    this.consultationService.getConsultationsByStatus('valide').subscribe({
      next: (data) => {
        this.consultations = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des consultations:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Applique les filtres de recherche et de type
   */
  applyFilters(): void {
    let filtered = [...this.consultations];

    // Filtre par terme de recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(consultation => {
        const patientName = this.getPatientName(consultation).toLowerCase();
        const patientEmail = this.getPatientEmail(consultation).toLowerCase();
        const objet = (consultation.objet || '').toLowerCase();
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

    this.filteredConsultations = filtered;
    this.currentPage = 1;
  }

  /**
   * Réinitialise tous les filtres
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.applyFilters();
  }

  /**
   * Obtient le nom du patient selon son type
   */
  getPatientName(consultation: Consultation): string {
    if (consultation.type === 'adherent' && consultation.user_nom && consultation.user_prenom) {
      return `${consultation.user_prenom} ${consultation.user_nom}`;
    } else if (consultation.type === 'internaute' && consultation.guest_nom && consultation.guest_prenom) {
      return `${consultation.guest_prenom} ${consultation.guest_nom}`;
    }
    return consultation.user_name || consultation.guest_name || 'N/A';
  }

  /**
   * Obtient l'email du patient selon son type
   */
  getPatientEmail(consultation: Consultation): string {
    if (consultation.type === 'adherent' && consultation.user_email) {
      return consultation.user_email;
    } else if (consultation.type === 'internaute' && consultation.guest_email) {
      return consultation.guest_email;
    }
    return 'N/A';
  }

  /**
   * Obtient l'ID du patient selon son type
   */
  getPatientId(consultation: Consultation): string {
    if (consultation.type === 'adherent' && consultation.user_id) {
      return `ADH-${consultation.user_id}`;
    } else if (consultation.type === 'internaute' && consultation.guest_id) {
      return `INV-${consultation.guest_id}`;
    }
    return 'N/A';
  }

  /**
   * Obtient les informations du médecin
   */
  getMedecinInfo(consultation: Consultation): string {
    if (consultation.medecin_nom && consultation.medecin_specialite) {
      return `Dr. ${consultation.medecin_nom} (${consultation.medecin_specialite})`;
    } else if (consultation.medecin_name) {
      return `Dr. ${consultation.medecin_name}`;
    }
    return 'Non assigné';
  }

  /**
   * Formate la date de demande
   */
  getFormattedRequestDate(consultation: Consultation): string {
    if (!consultation.created_at) return 'Date inconnue';
    
    try {
      const date = new Date(consultation.created_at);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }

  /**
   * Formate la date de consultation
   */
  getFormattedConsultationDate(consultation: Consultation): string {
    if (!consultation.date_consultation) return 'Non programmée';
    
    try {
      const date = new Date(consultation.date_consultation);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }

  /**
   * Obtient les consultations paginées
   */
  getPaginatedConsultations(): Consultation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredConsultations.slice(startIndex, endIndex);
  }

  /**
   * Obtient le nombre total de pages
   */
  getTotalPages(): number {
    return Math.ceil(this.filteredConsultations.length / this.itemsPerPage);
  }

  /**
   * Va à la page précédente
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Va à la page suivante
   */
  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  /**
   * Va à une page spécifique
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }
}