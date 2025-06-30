import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultationService, Consultation } from '../../../services/consultation.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-consultations-medecin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultations-medecin.component.html',
  styleUrls: ['./consultations-medecin.component.css']
})
export class ConsultationsMedecinComponent implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loading: boolean = false;
  medecinId: any;

  // Modales
  showApprovalModal: boolean = false;
  showRejectionModal: boolean = false;
  selectedConsultation: Consultation | null = null;
  commentaireMedecin: string = '';
  dateConsultation: string = '';

  constructor(
    private consultationService: ConsultationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getMedecinId();
    this.loadConsultations();
  }

  /**
   * Récupère l'ID du médecin connecté
   */
  getMedecinId(): void {
    const user = this.authService.getcurrentUser();

      this.medecinId = localStorage.getItem('userId'); // ✅ Correction ici
  
      console.error('ID médecin non trouvé');
      
    
  }

  /**
   * Charge les consultations du médecin
   */
  loadConsultations(): void {
    if (!this.medecinId) return;
    
    this.loading = true;
    this.consultationService.getConsultationsByMedecinId(this.medecinId).subscribe({
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
   * Applique les filtres de recherche et de statut
   */
  applyFilters(): void {
    let filtered = [...this.consultations];

    // Filtre par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(consultation => {
        const patientName = this.getPatientName(consultation).toLowerCase();
        const patientEmail = this.getPatientEmail(consultation).toLowerCase();
        const objet = consultation.objet?.toLowerCase() || '';
        return patientName.includes(term) || patientEmail.includes(term) || objet.includes(term);
      });
    }

    // Filtre par statut
    if (this.statusFilter) {
      filtered = filtered.filter(consultation => consultation.statut === this.statusFilter);
    }

    this.filteredConsultations = filtered;
    this.currentPage = 1;
  }

  /**
   * Obtient le nom du patient
   */
  getPatientName(consultation: Consultation): string {
    if (consultation.user_nom && consultation.user_prenom) {
      return `${consultation.user_prenom} ${consultation.user_nom}`;
    }
    if (consultation.guest_nom && consultation.guest_prenom) {
      return `${consultation.guest_prenom} ${consultation.guest_nom}`;
    }
    return 'Patient inconnu';
  }

  /**
   * Obtient l'email du patient
   */
  getPatientEmail(consultation: Consultation): string {
    return consultation.user_email || consultation.guest_email || 'Email non disponible';
  }

  /**
   * Obtient le type de patient
   */
  getPatientType(consultation: Consultation): string {
    return consultation.type === 'adherent' ? 'Adhérent' : 'Internaute';
  }

  /**
   * Obtient la classe CSS pour le statut
   */
  getStatusClass(statut: string): string {
    switch (statut) {
      case 'en_attente_medecin': return 'status-pending';
      case 'valide': return 'status-approved';
      case 'refuse': return 'status-rejected';
      default: return 'status-default';
    }
  }

  /**
   * Obtient le libellé du statut
   */
  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'en_attente_medecin': return 'En attente de validation';
      case 'valide': return 'Validée';
      case 'refuse': return 'Refusée';
      default: return statut;
    }
  }

  /**
   * Ouvre la modale d'approbation
   */
  openApprovalModal(consultation: Consultation): void {
    this.selectedConsultation = consultation;
    this.commentaireMedecin = '';
    this.dateConsultation = '';
    this.showApprovalModal = true;
  }

  /**
   * Ouvre la modale de refus
   */
  openRejectionModal(consultation: Consultation): void {
    this.selectedConsultation = consultation;
    this.commentaireMedecin = '';
    this.showRejectionModal = true;
  }

  /**
   * Ferme toutes les modales
   */
  closeModals(): void {
    this.showApprovalModal = false;
    this.showRejectionModal = false;
    this.selectedConsultation = null;
    this.commentaireMedecin = '';
    this.dateConsultation = '';
  }

  /**
   * Approuve une consultation
   */
  approveConsultation(): void {
    if (!this.selectedConsultation?.id) return;

    const data = {
      commentaire_medecin: this.commentaireMedecin,
      date_consultation: this.dateConsultation
    };

    this.consultationService.approveByMedecin(this.selectedConsultation.id, data).subscribe({
      next: () => {
        this.loadConsultations();
        this.closeModals();
        alert('Consultation approuvée avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation:', error);
        alert('Erreur lors de l\'approbation de la consultation.');
      }
    });
  }

  /**
   * Refuse une consultation
   */
  rejectConsultation(): void {
    if (!this.selectedConsultation?.id) return;

    this.consultationService.rejectByMedecin(this.selectedConsultation.id, this.commentaireMedecin).subscribe({
      next: () => {
        this.loadConsultations();
        this.closeModals();
        alert('Consultation refusée.');
      },
      error: (error) => {
        console.error('Erreur lors du refus:', error);
        alert('Erreur lors du refus de la consultation.');
      }
    });
  }

  /**
   * Formate une date
   */
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

  /**
   * Pagination
   */
  get paginatedConsultations(): Consultation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredConsultations.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredConsultations.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Statistiques
   */
  get totalConsultations(): number {
    return this.consultations.length;
  }

  get consultationsEnAttente(): number {
    return this.consultations.filter(c => c.statut === 'en_attente_medecin').length;
  }

  get consultationsValidees(): number {
    return this.consultations.filter(c => c.statut === 'valide').length;
  }

  get consultationsRefusees(): number {
    return this.consultations.filter(c => c.statut === 'refuse').length;
  }
}