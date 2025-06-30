import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PaiementService } from '../../services/paiement.service';
import { AbonnementService, Abonnement } from '../../services/abonnement.service';
import { TypeAbonnementService } from '../../services/type-abonnement.service';
import { UserService } from '../../services/user.service';
import { Paiement } from '../../models/paiement.model';
import { AnalysePaiementComponent } from './analyse-paiement/analyse-paiement.component';
import { PdfExportService } from '../../services/pdf-export.service';

type TypeAbonnement = {
  id: number;
  nom: string;
  duree_jours: number;
  prix: number;
  avec_coach: boolean;
};

@Component({
  selector: 'app-paiement',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AnalysePaiementComponent],
  templateUrl: './paiement.component.html',
  styleUrls: ['./paiement.component.css']
})
export class PaiementComponent implements OnInit {
  paiements: Paiement[] = [];
  abonnements: Abonnement[] = [];
  typeAbonnements: TypeAbonnement[] = [];
  users: any[] = [];
  abonnementsPaies: any[] = [];
  abonnementsNonPaies: any[] = [];
  abonnementsExpirantAujourdhui: any[] = [];
  paiementForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showForm = false;
  selectedAbonnementPrix = 0;
  modesPaiement = ['Espèces', 'Carte bancaire', 'Virement', 'Chèque'];
  activeTab = 'tous';
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];
  isRenewal = false; // Nouvelle propriété pour le renouvellement

  constructor(
    private fb: FormBuilder,
    private paiementService: PaiementService,
    private abonnementService: AbonnementService,
    private typeAbonnementService: TypeAbonnementService,
    private userService: UserService,
    private pdfExportService: PdfExportService
  ) {
    this.paiementForm = this.fb.group({
      abonnement_id: ['', Validators.required],
      montant: [{ value: '', disabled: true }, [Validators.required, Validators.min(0)]],
      mode_paiement: ['Espèces', Validators.required],
      is_renewal: [false] // Nouveau champ pour le renouvellement
    });

    this.paiementForm.get('abonnement_id')?.valueChanges.subscribe(abonnementId => {
      this.updateMontant(abonnementId);
    });
  }

  ngOnInit(): void {
    this.loadPaiements();
    this.loadAbonnements();
    this.loadTypeAbonnements();
    this.loadUsers();
    this.loadAbonnementsPaies();
    this.loadAbonnementsNonPaies();
    this.loadAbonnementsExpirantAujourdhui();
    
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 5; i++) {
      this.availableYears.push(currentYear - i);
    }
    
    const currentDate = new Date();
    this.selectedMonth = currentDate.getMonth() + 1;
    this.selectedYear = currentDate.getFullYear();
  }

  getMonthName(monthNumber: number): string {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return monthNames[monthNumber - 1];
  }

  loadPaiements(): void {
    this.loading = true;
    this.paiementService.getAllPaiements().subscribe({
      next: (data) => {
        this.paiements = data.map(paiement => ({
          ...paiement,
          montant: typeof paiement.montant === 'string' ? parseFloat(paiement.montant) : paiement.montant,
          mode_paiement: paiement.mode_paiement || 'Non spécifié'
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur de chargement des paiements', error);
        this.errorMessage = 'Erreur lors du chargement des paiements';
        this.loading = false;
      }
    });
  }

  loadAbonnements(): void {
    this.abonnementService.getAllAbonnements().subscribe({
      next: (data) => {
        this.abonnements = data;
      },
      error: (error) => console.error('Erreur de chargement des abonnements', error)
    });
  }

  loadTypeAbonnements(): void {
    this.typeAbonnementService.getAll().subscribe({
      next: (data) => this.typeAbonnements = data,
      error: (error) => console.error('Erreur de chargement des types d\'abonnement', error)
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => console.error('Erreur de chargement des utilisateurs', error)
    });
  }

  openAddForm(): void {
    this.paiementForm.reset({
      mode_paiement: 'Espèces',
      is_renewal: false
    });
    this.showForm = true;
    this.selectedAbonnementPrix = 0;
  }

  openAddFormWithAbonnement(abonnement: any): void {
    this.paiementForm.reset({
      abonnement_id: abonnement.abonnement_id,
      mode_paiement: 'Espèces',
      is_renewal: false
    });
    this.showForm = true;
    
    this.typeAbonnementService.getAll().subscribe({
      next: (types) => {
        const typeAbonnement = types.find(t => t.nom === abonnement.type_abonnement);
        if (typeAbonnement) {
          this.selectedAbonnementPrix = typeAbonnement.prix;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des types d\'abonnement', error);
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.paiementForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedAbonnementPrix = 0;
  }

  onSubmit(): void {
    if (this.paiementForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    const formData = {
      abonnement_id: this.paiementForm.get('abonnement_id')?.value,
      montant: this.selectedAbonnementPrix,
      mode_paiement: this.paiementForm.get('mode_paiement')?.value,
      is_renewal: this.paiementForm.get('is_renewal')?.value
    };

    this.loading = true;
    
    this.paiementService.createPaiement(formData).subscribe({
      next: (response) => {
        if (formData.is_renewal) {
          this.renewAbonnement(formData.abonnement_id);
        } else {
          this.successMessage = 'Paiement enregistré avec succès';
          this.handleSuccess();
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement du paiement', error);
        this.errorMessage = error.error?.error || 'Erreur lors de l\'enregistrement du paiement';
        this.loading = false;
      }
    });
  }

  private renewAbonnement(abonnementId: number): void {
    // Recherche d'abord dans les abonnements non payés (qui ont une structure différente)
    const abonnementNonPaye = this.abonnementsNonPaies.find(a => a.abonnement_id === abonnementId);
    
    if (abonnementNonPaye) {
      // Si c'est un abonnement non payé, on cherche le type par son nom
      const typeAbonnement = this.typeAbonnements.find(t => t.nom === abonnementNonPaye.type_abonnement);
      
      if (!typeAbonnement) {
        this.errorMessage = 'Type d\'abonnement introuvable';
        this.loading = false;
        return;
      }
      
      // Récupérer l'abonnement complet pour le mettre à jour
      this.abonnementService.getAbonnementById(abonnementId).subscribe({
        next: (abonnement) => {
          if (!abonnement) {
            this.errorMessage = 'Abonnement introuvable';
            this.loading = false;
            return;
          }
          
          const newStartDate = new Date().toISOString().split('T')[0];
          const newEndDate = new Date();
          newEndDate.setDate(new Date().getDate() + typeAbonnement.duree_jours);
          const formattedEndDate = newEndDate.toISOString().split('T')[0];

          const updatedAbonnement = {
            ...abonnement,
            date_debut: newStartDate,
            date_fin: formattedEndDate
          };

          this.abonnementService.updateAbonnement(abonnementId, updatedAbonnement).subscribe({
            next: () => {
              this.successMessage = 'Abonnement renouvelé avec succès';
              this.handleSuccess();
            },
            error: (error) => {
              console.error('Erreur de renouvellement', error);
              this.errorMessage = 'Erreur lors du renouvellement';
              this.loading = false;
            }
          });
        },
        error: (error) => {
          console.error('Erreur lors de la récupération de l\'abonnement', error);
          this.errorMessage = 'Erreur lors de la récupération de l\'abonnement';
          this.loading = false;
        }
      });
      
      return;
    }
    
    // Si ce n'est pas un abonnement non payé, on utilise la logique existante
    const abonnement = this.abonnements.find(a => a.id === abonnementId);
    
    if (!abonnement) {
      this.errorMessage = 'Abonnement introuvable';
      this.loading = false;
      return;
    }

    const typeAbonnement = this.typeAbonnements.find(t => t.id === abonnement.type_id);
    
    if (!typeAbonnement) {
      this.errorMessage = 'Type d\'abonnement introuvable';
      this.loading = false;
      return;
    }

    const newStartDate = new Date().toISOString().split('T')[0];
    const newEndDate = new Date();
    newEndDate.setDate(new Date().getDate() + typeAbonnement.duree_jours);
    const formattedEndDate = newEndDate.toISOString().split('T')[0];

    const updatedAbonnement = {
      ...abonnement,
      date_debut: newStartDate,
      date_fin: formattedEndDate
    };

    this.abonnementService.updateAbonnement(abonnementId, updatedAbonnement).subscribe({
      next: () => {
        this.successMessage = 'Abonnement renouvelé avec succès';
        this.handleSuccess();
      },
      error: (error) => {
        console.error('Erreur de renouvellement', error);
        this.errorMessage = 'Erreur lors du renouvellement';
        this.loading = false;
      }
    });
  }

  private handleSuccess(): void {
    this.loadPaiements();
    this.loadAbonnements();
    this.loadAbonnementsNonPaies();
    this.loadAbonnementsPaies();
    this.loadAbonnementsExpirantAujourdhui();
    this.paiementForm.reset();
    this.showForm = false;
    this.loading = false;
    this.selectedAbonnementPrix = 0;
  }

  updateMontant(abonnementId: number): void {
    if (!abonnementId) {
      this.selectedAbonnementPrix = 0;
      return;
    }

    const abonnementIdNumber = typeof abonnementId === 'string' ? parseInt(abonnementId, 10) : abonnementId;
    const selectedAbonnement = this.abonnementsNonPaies.find(a => a.abonnement_id === abonnementIdNumber);
    
    if (selectedAbonnement) {
      const typeAbonnement = this.typeAbonnements.find(t => t.nom === selectedAbonnement.type_abonnement);
      if (typeAbonnement) this.selectedAbonnementPrix = typeAbonnement.prix;
    } else {
      const standardAbonnement = this.abonnements.find(a => a.id === abonnementIdNumber);
      if (standardAbonnement) {
        const typeAbonnement = this.typeAbonnements.find(t => t.id === standardAbonnement.type_id);
        if (typeAbonnement) this.selectedAbonnementPrix = typeAbonnement.prix;
      }
    }
  }

  getAbonnementInfo(abonnementId: number): string {
    if (!abonnementId) return 'Non spécifié';
    const abonnement = this.abonnements.find(a => a.id === abonnementId);
    if (!abonnement) return 'Non spécifié';
    const typeAbonnement = this.typeAbonnements.find(t => t.id === abonnement.type_id);
    const typeNom = typeAbonnement ? typeAbonnement.nom : 'Type inconnu';
    return `${typeNom} - ${this.formatDate(abonnement.date_debut)}`;
  }

  getUserNameByAbonnementId(abonnementId: number): string {
    if (!abonnementId) return 'Non spécifié';
    const abonnement = this.abonnements.find(a => a.id === abonnementId);
    if (!abonnement) return 'Non spécifié';
    if (abonnement.utilisateur) {
      return `${abonnement.utilisateur.prenom || ''} ${abonnement.utilisateur.nom}`.trim();
    }
    const user = this.users.find(u => u.id === abonnement.user_id);
    return user ? `${user.prenom || ''} ${user.nom}`.trim() : 'Utilisateur inconnu';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Non spécifiée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  isAbonnementPaid(abonnementId: number): boolean {
    return this.paiements.some(p => p.abonnement_id === abonnementId);
  }
  
  isAbonnementExpired(dateFin: string): boolean {
    if (!dateFin) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(dateFin);
    endDate.setHours(0, 0, 0, 0);
    return endDate <= today;
  }
  
  isAbonnementExpiringInTwoDays(dateFin: string): boolean {
    if (!dateFin) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);
    const endDate = new Date(dateFin);
    endDate.setHours(0, 0, 0, 0);
    return endDate.getTime() === twoDaysLater.getTime();
  }
  
  getRowClass(dateFin: string): string {
    if (this.isAbonnementExpired(dateFin)) {
      return 'expired-row';
    } else if (this.isAbonnementExpiringInTwoDays(dateFin)) {
      return 'expiring-soon-row';
    }
    return '';
  }

  getPaiementDetails(paiement: Paiement): any {
    return {
      id: paiement.id,
      abonnement: this.getAbonnementInfo(paiement.abonnement_id),
      utilisateur: this.getUserNameByAbonnementId(paiement.abonnement_id),
      montant: typeof paiement.montant === 'string' ? parseFloat(paiement.montant) : paiement.montant,
      date: this.formatDate(paiement.date_paiement),
      mode: paiement.mode_paiement || 'Non spécifié'
    };
  }

  getUnpaidAbonnements(): Abonnement[] {
    return this.abonnements.filter(abonnement => 
      !this.isAbonnementPaid(abonnement.id!)
    );
  }

  loadAbonnementsPaies(): void {
    this.paiementService.getAbonnementsPaies().subscribe({
      next: (data) => {
        this.abonnementsPaies = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des abonnements payés', error);
      }
    });
  }

  loadAbonnementsNonPaies(): void {
    this.paiementService.getAbonnementsNonPaies().subscribe({
      next: (data) => {
        this.abonnementsNonPaies = data.sort((a, b) => {
          if (this.isAbonnementExpired(a.date_fin) && !this.isAbonnementExpired(b.date_fin)) {
            return -1;
          }
          if (!this.isAbonnementExpired(a.date_fin) && this.isAbonnementExpired(b.date_fin)) {
            return 1;
          }
          const dateA = new Date(a.date_fin);
          const dateB = new Date(b.date_fin);
          return dateA.getTime() - dateB.getTime();
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des abonnements non payés', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'analyse') {
      this.showForm = false;
    }
  }

  loadAbonnementsExpirantAujourdhui(): void {
    this.paiementService.getAbonnementsPaies().subscribe({
      next: (abonnementsPaies) => {
        this.paiementService.getAbonnementsNonPaies().subscribe({
          next: (abonnementsNonPaies) => {
            const tousAbonnements = [...abonnementsPaies, ...abonnementsNonPaies];
            this.abonnementsExpirantAujourdhui = tousAbonnements.filter(abonnement => {
              return this.isAbonnementExpired(abonnement.date_fin) && 
                     !this.isAbonnementExpiredBefore(abonnement.date_fin);
            });
            this.abonnementsExpirantAujourdhui = this.abonnementsExpirantAujourdhui.map(abonnement => ({
              ...abonnement,
              est_paye: abonnementsPaies.some(a => a.abonnement_id === abonnement.abonnement_id)
            }));
          },
          error: (error) => {
            console.error('Erreur lors du chargement des abonnements non payés', error);
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des abonnements payés', error);
      }
    });
  }
  
  isAbonnementExpiredBefore(dateFin: string): boolean {
    if (!dateFin) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(dateFin);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  }

  exportPaiementsPdf(): void {
    const filteredPaiements = this.paiementService.filterPaiementsByMonth(
      this.paiements,
      this.selectedYear,
      this.selectedMonth
    );
    const paiementsForExport = filteredPaiements.map(paiement => {
      return {
        id: paiement.id,
        abonnement: this.getAbonnementInfo(paiement.abonnement_id),
        utilisateur: this.getUserNameByAbonnementId(paiement.abonnement_id),
        montant: typeof paiement.montant === 'string' ? parseFloat(paiement.montant) : paiement.montant,
        date: this.formatDate(paiement.date_paiement),
        mode: paiement.mode_paiement || 'Non spécifié'
      };
    });
    const totalAmount = this.paiementService.calculateTotalAmount(filteredPaiements);
    this.pdfExportService.exportPaiementsToPdf(
      paiementsForExport,
      totalAmount,
      this.selectedMonth,
      this.selectedYear
    );
  }
}