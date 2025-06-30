import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ConsultationService, Consultation } from '../../../services/consultation.service';

@Component({
  selector: 'app-consultations-unified',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultations-unified.component.html',
  styleUrls: ['./consultations-unified.component.css']
})
export class ConsultationsUnifiedComponent implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  searchTerm: string = '';
  typeFilter: string = '';
  priorityFilter: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loading: boolean = false;

  // Type de consultation sélectionné
  selectedConsultationType: string = 'en_attente';

  // Options du dropdown
  consultationTypes = [
    { value: 'en_attente', label: 'En attente d\'approbation', icon: 'fas fa-clock' },
    { value: 'approuve_admin', label: 'Approuvées par l\'admin', icon: 'fas fa-check-circle' },
    { value: 'valide', label: 'Entièrement approuvées', icon: 'fas fa-check-double' },
    { value: 'refuse_admin', label: 'Refusées par l\'admin', icon: 'fas fa-times-circle' },
    { value: 'refuse_medecin', label: 'Refusées par le médecin', icon: 'fas fa-user-md' }
  ];

  constructor(
    private authService: AuthService,
    private consultationService: ConsultationService
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  /**
   * Change le type de consultation affiché
   */
  onConsultationTypeChange(): void {
    this.loadConsultations();
  }

  /**
   * Charge les consultations selon le type sélectionné
   */
  loadConsultations(): void {
    this.loading = true;
    this.consultations = [];
    this.filteredConsultations = [];

    switch (this.selectedConsultationType) {
      case 'en_attente':
        this.loadPendingConsultations();
        break;
      case 'approuve_admin':
        this.loadApprovedByAdminConsultations();
        break;
      case 'valide':
        this.loadFullyApprovedConsultations();
        break;
      case 'refuse_admin':
        this.loadRejectedByAdminConsultations();
        break;
      case 'refuse_medecin':
        this.loadRejectedByMedecinConsultations();
        break;
      default:
        this.loading = false;
    }
  }

  /**
   * Charge les consultations en attente
   */
  loadPendingConsultations(): void {
    this.consultationService.getConsultationsByStatus('en_attente').subscribe({
      next: (consultations) => {
        this.consultations = consultations;
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
   * Charge les consultations approuvées par l'admin
   */
  loadApprovedByAdminConsultations(): void {
    this.consultationService.getConsultationsByStatus('en_attente_medecin').subscribe({
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
   * Charge les consultations entièrement approuvées
   */
  loadFullyApprovedConsultations(): void {
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
   * Charge les consultations refusées par l'admin
   */
  loadRejectedByAdminConsultations(): void {
    this.consultationService.getConsultationsByStatus('refuse').subscribe({
      next: (data) => {
        // Filtrer pour ne garder que celles refusées par l'admin
        this.consultations = data.filter(consultation => 
          consultation.statut === 'refuse' && 
          consultation.commentaire_admin && 
          consultation.commentaire_admin.trim() !== ''
        );
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des consultations refusées par l\'admin:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Charge les consultations refusées par le médecin
   */
  loadRejectedByMedecinConsultations(): void {
    this.consultationService.getConsultationsByStatus('refuse').subscribe({
      next: (data) => {
        // Filtrer pour ne garder que celles refusées par le médecin
        this.consultations = data.filter(consultation => 
          consultation.statut === 'refuse' && 
          consultation.commentaire_medecin && 
          consultation.commentaire_medecin.trim() !== '' &&
          (!consultation.commentaire_admin || consultation.commentaire_admin.trim() === '')
        );
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des consultations refusées par le médecin:', error);
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

    // Filtre par priorité (seulement pour les consultations en attente)
    if (this.priorityFilter && this.selectedConsultationType === 'en_attente') {
      filtered = filtered.filter(consultation => 
        this.getConsultationPriority(consultation) === this.priorityFilter
      );
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
    this.priorityFilter = '';
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
   * Obtient la priorité d'une consultation
   */
  getConsultationPriority(consultation: Consultation): 'high' | 'medium' | 'low' {
    const daysSinceRequest = this.getDaysSinceRequest(consultation.date_demande);
    if (daysSinceRequest > 7) return 'high';
    if (daysSinceRequest > 3) return 'medium';
    return 'low';
  }

  /**
   * Calcule le nombre de jours depuis la demande
   */
  getDaysSinceRequest(dateString: string): number {
    if (!dateString) return 0;
    const requestDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - requestDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Formate la date de demande
   */
  getFormattedRequestDate(consultation: Consultation): string {
    if (!consultation.created_at) return 'Date inconnue';
    
    try {
      const date = new Date(consultation.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const formattedDate = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      if (diffDays === 1) {
        return `${formattedDate} (aujourd'hui)`;
      } else if (diffDays === 2) {
        return `${formattedDate} (hier)`;
      } else if (diffDays <= 7) {
        return `${formattedDate} (il y a ${diffDays - 1} jours)`;
      } else {
        return formattedDate;
      }
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
   * Obtient les consultations par priorité (pour les statistiques)
   */
  getConsultationsByPriority(priority: 'high' | 'medium' | 'low'): Consultation[] {
    return this.consultations.filter(consultation => 
      this.getConsultationPriority(consultation) === priority
    );
  }

  /**
   * Obtient les consultations par type (pour les statistiques)
   */
  getConsultationsByType(type: 'adherent' | 'internaute'): Consultation[] {
    return this.consultations.filter(consultation => consultation.type === type);
  }

  /**
   * Obtient la classe CSS pour le statut
   */
  getStatusClass(consultation: Consultation): string {
    switch (consultation.statut) {
      case 'en_attente': return 'pending';
      case 'en_attente_medecin': return 'approved-admin';
      case 'valide': return 'approved';
      case 'refuse': return 'rejected';
      default: return '';
    }
  }

  /**
   * Approuve une consultation (pour les consultations en attente)
   */
  approveConsultation(consultation: Consultation): void {
    if (!consultation.id) return;

    const updateData = {
      commentaire_admin: 'Consultation approuvée par l\'administrateur',
      medecin_id: consultation.medecin_id
    };

    this.consultationService.approveByAdmin(consultation.id, updateData).subscribe({
      next: () => {
        this.loadConsultations();
        alert('Consultation approuvée avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation:', error);
        alert('Erreur lors de l\'approbation de la consultation.');
      }
    });
  }

  /**
   * Refuse une consultation (pour les consultations en attente)
   */
  rejectConsultation(consultation: Consultation): void {
    if (!consultation.id) return;

    const reason = prompt('Raison du refus:');
    if (!reason) return;

    const updateData = {
      commentaire_admin: reason
    };

    this.consultationService.rejectByAdmin(consultation.id, updateData.commentaire_admin).subscribe({
      next: () => {
        this.loadConsultations();
        alert('Consultation refusée avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors du refus:', error);
        alert('Erreur lors du refus de la consultation.');
      }
    });
  }

  /**
   * Obtient le titre de la section selon le type sélectionné
   */
  getSectionTitle(): string {
    const type = this.consultationTypes.find(t => t.value === this.selectedConsultationType);
    return type ? type.label : 'Consultations';
  }

  /**
   * Obtient l'icône de la section selon le type sélectionné
   */
  getSectionIcon(): string {
    const type = this.consultationTypes.find(t => t.value === this.selectedConsultationType);
    return type ? type.icon : 'fas fa-list';
  }

  /**
   * Vérifie si les actions sont disponibles pour le type sélectionné
   */
  hasActions(): boolean {
    return this.selectedConsultationType === 'en_attente';
  }

  /**
   * Vérifie si le filtre de priorité est disponible
   */
  hasPriorityFilter(): boolean {
    return this.selectedConsultationType === 'en_attente';
  }
}