import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommandeService, Commande, CommandeItem, CommandeDetails } from '../../../services/commande.service';
import { ProductService } from '../../../services/product.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Les interfaces sont maintenant importées du service

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  // État de l'interface
  commandes: Commande[] = [];
  selectedCommande: CommandeDetails | null = null;
  loading = false;
  error = '';
  
  // Filtres et recherche
  searchTerm = '';
  filterStatut = '';
  filterPeriode = '';
  dateDebut = '';
  dateFin = '';
  montantMin = 0;

  // RxJS
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  
  // Tri
  sortField = 'date_commande';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Vue
  viewMode: 'cards' | 'table' = 'table';
  
  // Dropdown
  openDropdown: string | null = null;
  
  // Statuts disponibles (correspondant exactement à la base de données)
  statutsDisponibles = [
    { value: 'en_attente', label: 'En attente', color: '#fbbf24' },
    { value: 'validée', label: 'Validée', color: '#3b82f6' },
    { value: 'en_preparation', label: 'En préparation', color: '#f59e0b' },
    { value: 'expédiée', label: 'Expédiée', color: '#8b5cf6' },
    { value: 'livrée', label: 'Livrée', color: '#10b981' },
    { value: 'annulée', label: 'Annulée', color: '#ef4444' }
  ];
  
  // Référence globale pour Math
  Math = Math;
  
  constructor(
    private http: HttpClient,
    private commandeService: CommandeService,
    private productService: ProductService
  ) {
    // Configuration du debounce pour la recherche
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
    });
  }
  
  ngOnInit(): void {
    this.loadCommandes();
    
    // Auto-refresh toutes les 30 secondes
    setInterval(() => {
      this.refreshCommandes();
    }, 30000);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Chargement des données
  loadCommandes(): void {
    this.loading = true;
    this.error = '';
    
    this.commandeService.getAllCommandes().subscribe({
      next: (commandes) => {
        this.commandes = commandes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
        this.error = 'Erreur lors du chargement des commandes';
        this.loading = false;
      }
    });
  }
  
  refreshCommandes(): void {
    if (!this.loading) {
      this.loadCommandes();
    }
  }
  
  loadCommandeDetails(commandeId: number): void {
    this.commandeService.getCommandeDetails(commandeId).subscribe({
      next: (details: CommandeDetails) => {
        this.selectedCommande = details;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails:', error);
        this.error = 'Erreur lors du chargement des détails';
      }
    });
  }
  
  // Gestion des statuts
  updateStatut(commandeId: number, nouveauStatut: string): void {
    // Validation des transitions de statut
    const commande = this.commandes.find(c => c.id === commandeId);
    if (!commande) return;
    
    if (!this.isTransitionValide(commande.statut, nouveauStatut)) {
      alert('Transition de statut non autorisée');
      return;
    }
    
    // Confirmation pour la livraison
    if (nouveauStatut === 'livrée') {
      if (!confirm('Confirmer la livraison de cette commande ?')) {
        return;
      }
    }
    
    this.commandeService.updateCommandeStatut(commandeId, nouveauStatut).subscribe({
      next: () => {
        // Mettre à jour le statut localement
        const index = this.commandes.findIndex(c => c.id === commandeId);
        if (index !== -1) {
          this.commandes[index].statut = nouveauStatut;
        }
        
        // Si expédition, mettre à jour les stocks
        if (nouveauStatut === 'expédiée') {
          this.updateStockAfterExpedition(commandeId);
        }
        
        // Recharger les détails si ouverts
        if (this.selectedCommande && this.selectedCommande.commande.id === commandeId) {
          this.loadCommandeDetails(commandeId);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        alert('Erreur lors de la mise à jour du statut');
      }
    });
  }
  
  isTransitionValide(statutActuel: string, nouveauStatut: string): boolean {
    const transitions: { [key: string]: string[] } = {
      'en_attente': ['validée', 'annulée'],
      'validée': ['en_preparation', 'annulée'],
      'en_preparation': ['expédiée'],
      'expédiée': ['livrée'],
      'livrée': [],
      'annulée': []
    };
    
    return transitions[statutActuel]?.includes(nouveauStatut) || false;
  }
  
  updateStockAfterExpedition(commandeId: number): void {
    if (this.selectedCommande && this.selectedCommande.commande.id === commandeId) {
      this.selectedCommande.items.forEach(item => {
        this.processStockUpdate(item.produit_id, item.quantite);
      });
    } else {
      // Charger les détails pour mettre à jour le stock
      this.http.get<CommandeDetails>(`http://localhost:3000/api/commande/${commandeId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            data.items.forEach(item => {
              this.processStockUpdate(item.produit_id, item.quantite);
            });
          },
          error: (error) => {
            console.error('Erreur lors du chargement pour mise à jour stock:', error);
          }
        });
    }
  }
  
  processStockUpdate(produitId: number, quantite: number): void {
    this.commandeService.updateProductStock(produitId, quantite).subscribe({
      next: (response) => {
        console.log(`Stock mis à jour pour le produit ${produitId}:`, response);
      },
      error: (error) => {
        console.error(`Erreur mise à jour stock produit ${produitId}:`, error);
      }
    });
  }
  
  // Filtrage
  get commandesFiltrees(): Commande[] {
    let filtered = [...this.commandes];
    
    // Recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(commande => 
        commande.reference.toLowerCase().includes(term) ||
        commande.nom.toLowerCase().includes(term) ||
        commande.prenom.toLowerCase().includes(term) ||
        commande.email.toLowerCase().includes(term)
      );
    }
    
    // Filtre par statut
    if (this.filterStatut) {
      filtered = filtered.filter(commande => commande.statut === this.filterStatut);
    }
    
    // Filtre par période
    if (this.filterPeriode) {
      const now = new Date();
      const startDate = new Date();
      
      switch (this.filterPeriode) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(commande => 
        new Date(commande.date_commande) >= startDate
      );
    }
    
    // Filtre par dates personnalisées
    if (this.dateDebut) {
      filtered = filtered.filter(commande => 
        new Date(commande.date_commande) >= new Date(this.dateDebut)
      );
    }
    
    if (this.dateFin) {
      filtered = filtered.filter(commande => 
        new Date(commande.date_commande) <= new Date(this.dateFin)
      );
    }
    
    // Filtre par montant minimum
    if (this.montantMin > 0) {
      filtered = filtered.filter(commande => commande.total >= this.montantMin);
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Commande];
      let bValue: any = b[this.sortField as keyof Commande];
      
      if (this.sortField === 'date_commande') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }
  
  // Utilitaires pour les statuts
  getStatutColor(statut: string): string {
    const statutInfo = this.statutsDisponibles.find(s => s.value === statut);
    return statutInfo?.color || '#6b7280';
  }
  
  getStatutLabel(statut: string): string {
    const statutInfo = this.statutsDisponibles.find(s => s.value === statut);
    return statutInfo?.label || statut;
  }
  
  getStatutsPossibles(statutActuel: string): any[] {
    const transitions: { [key: string]: string[] } = {
      'en_attente': ['validée', 'annulée'],
      'validée': ['en_preparation', 'annulée'],
      'en_preparation': ['expédiée'],
      'expédiée': ['livrée'],
      'livrée': [],
      'annulée': []
    };
    
    const possibles = transitions[statutActuel] || [];
    return this.statutsDisponibles.filter(s => possibles.includes(s.value));
  }
  
  // Actions spéciales
  marquerCommeLivree(commandeId: number): void {
    if (confirm('Confirmer que cette commande a été livrée ?')) {
      this.updateStatut(commandeId, 'livrée');
    }
  }
  
  peutEtreLivree(statut: string): boolean {
    return statut === 'expédiée';
  }
  
  getNextStatut(statutActuel: string): string | null {
    const nextStatuts: { [key: string]: string } = {
      'en_attente': 'validée',
      'validée': 'en_preparation',
      'en_preparation': 'expédiée',
      'expédiée': 'livrée'
    };
    
    return nextStatuts[statutActuel] || null;
  }
  
  // Interface
  closeDetails(): void {
    this.selectedCommande = null;
  }
  
  getTotalItems(): number {
    if (!this.selectedCommande) return 0;
    return this.selectedCommande.items.reduce((total, item) => total + item.quantite, 0);
  }
  
  getTotalItemsPrice(): number {
    if (!this.selectedCommande) return 0;
    return this.selectedCommande.items.reduce((total, item) => total + (item.quantite * item.prix_unitaire), 0);
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatut = '';
    this.filterPeriode = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.montantMin = 0;
  }
  
  // Recherche
  onSearchChange(event: any): void {
    this.searchSubject.next(event.target.value);
  }
  
  clearSearch(): void {
    this.searchTerm = '';
  }
  
  // Vue
  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode = mode;
  }
  
  // Tri
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }
  
  sortBy(field: string): void {
    this.sort(field);
  }
  
  // Pagination
  goToPage(page: number): void {
    this.currentPage = page;
  }
  
  getTotalPages(): number {
    return Math.ceil(this.commandesFiltrees.length / this.pageSize);
  }
  
  getVisiblePages(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.commandesFiltrees.length);
    return `${start} - ${end} sur ${this.commandesFiltrees.length}`;
  }
  
  onPageSizeChange(): void {
    this.currentPage = 1;
  }
  
  getPagedCommandes(): Commande[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.commandesFiltrees.slice(start, end);
  }
  
  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }
  
  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.commandesFiltrees.length);
  }
  
  // Utilitaires
  trackByCommandeId(index: number, commande: Commande): number {
    return commande.id;
  }
  
  getClientInitials(nom: string, prenom: string): string {
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
  }
  
  getTimeAgo(date: string): string {
    const now = new Date();
    const commandeDate = new Date(date);
    const diffMs = now.getTime() - commandeDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Récemment';
    }
  }
  
  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getTodayOrdersCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.commandes.filter(commande => {
      const commandeDate = new Date(commande.date_commande);
      commandeDate.setHours(0, 0, 0, 0);
      return commandeDate.getTime() === today.getTime();
    }).length;
  }
  
  getStatutPercentage(statut: string): number {
    const total = this.commandes.length;
    if (total === 0) return 0;
    
    const count = this.commandes.filter(c => c.statut === statut).length;
    return Math.round((count / total) * 100);
  }
  
  getStatutIcon(statut: string): string {
    const icons: { [key: string]: string } = {
      'en_attente': 'fas fa-clock',
      'validée': 'fas fa-check-circle',
      'en_preparation': 'fas fa-cog',
      'expédiée': 'fas fa-shipping-fast',
      'livrée': 'fas fa-check-double',
      'annulée': 'fas fa-times-circle'
    };
    
    return icons[statut] || 'fas fa-question';
  }
  
  getStatusProgress(statut: string): number {
    const progress: { [key: string]: number } = {
      'en_attente': 16,
      'validée': 33,
      'en_preparation': 50,
      'expédiée': 83,
      'livrée': 100,
      'annulée': 0
    };
    
    return progress[statut] || 0;
  }
  
  isPriorityOrder(commande: Commande): boolean {
    return commande.total > 100; // Commandes prioritaires si > 100dt
  }
  
  // Dropdown
  toggleDropdown(commandeId: string): void {
    this.openDropdown = this.openDropdown === commandeId ? null : commandeId;
  }
  
  // Actions sur les commandes
  canAdvanceStatus(statut: string): boolean {
    return ['en_attente', 'validée', 'en_preparation', 'expédiée'].includes(statut);
  }
  
  advanceStatus(commande: Commande): void {
    const nextStatut = this.getNextStatut(commande.statut);
    if (nextStatut) {
      this.updateStatut(commande.id, nextStatut);
    }
  }
  
  printOrder(commande: Commande): void {
    // Créer le contenu du ticket d'impression
    const ticketContent = this.generateTicketContent(commande);
    
    // Ouvrir une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé avant d'imprimer (compatible Chrome)
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          
          // Fermer la fenêtre après impression (optionnel)
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };
      
      // Fallback si onload ne fonctionne pas
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.focus();
          printWindow.print();
        }
      }, 1000);
    } else {
      // Fallback si la fenêtre popup est bloquée
      alert('Veuillez autoriser les popups pour imprimer le ticket.');
    }
  }

  generateTicketContent(commande: Commande): string {
    const fraisLivraison = 8; // 8 dinars
    const commandeTotal = Number(commande.total) || 0;
    const totalAvecLivraison = commandeTotal + fraisLivraison;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket de Commande - ${commande.reference}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 30px;
            background: white;
            color: black;
            font-size: 14px;
            line-height: 1.5;
          }
          .ticket {
            max-width: 600px;
            width: 80%;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 30px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          
          .app-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #2c5530;
          }
          .wishes {
            font-size: 14px;
            font-style: italic;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
            border-bottom: 2px dashed #000;
            padding-bottom: 15px;
          }
          .section:last-child {
            border-bottom: none;
          }
          .section-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
            font-size: 16px;
            color: #2c5530;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .total-row {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 15px;
            color: #2c5530;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { margin: 0; padding: 20px; }
            .ticket { border: 2px solid #000; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <!-- En-tête -->
          <div class="header">
               <div class="app-name">VitaFit</div>
            <div class="wishes">Best Wishes</div>
          </div>
          
          <!-- Informations de commande -->
          <div class="section">
            <div class="section-title">COMMANDE</div>
            <div class="row">
              <span>Référence:</span>
              <span>${commande.reference}</span>
            </div>
            <div class="row">
              <span>Date:</span>
              <span>${this.formatDate(commande.date_commande)}</span>
            </div>
          
          </div>
          
          <!-- Informations client -->
          <div class="section">
            <div class="section-title">CLIENT</div>
            <div class="row">
              <span>Nom:</span>
              <span>${commande.prenom} ${commande.nom}</span>
            </div>
            <div class="row">
              <span>Email:</span>
              <span>${commande.email}</span>
            </div>
            <div class="row">
              <span>Téléphone:</span>
              <span>${commande.telephone || 'N/A'}</span>
            </div>
            <div style="margin-top: 8px;">
              <div><strong>Adresse de livraison:</strong></div>
              <div style="margin-left: 10px; margin-top: 3px;">${commande.adresse_livraison}</div>
            </div>
          </div>
          
          <!-- Détails financiers -->
          <div class="section">
            <div class="section-title">MONTANTS</div>
            <div class="row">
               <span>Sous-total:</span>
               <span>${commandeTotal.toFixed(2)} DT</span>
             </div>
            <div class="row">
              <span>Frais de livraison:</span>
              <span>${fraisLivraison.toFixed(2)} DT</span>
            </div>
            <div class="row total-row">
              <span>TOTAL:</span>
              <span>${totalAvecLivraison.toFixed(2)} DT</span>
            </div>
          </div>
          
          <!-- Pied de page -->
          <div class="footer">
            <div>Merci pour votre commande!</div>
            <div>Imprimé le ${new Date().toLocaleString('fr-FR')}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  sendEmail(commande: Commande): void {
    // Logique d'envoi d'email
    console.log('Envoi email pour:', commande.email);
  }
  
  cancelOrder(commande: Commande): void {
    if (confirm(`Êtes-vous sûr de vouloir annuler la commande ${commande.reference} ?`)) {
      this.updateStatut(commande.id, 'annulée');
    }
  }
  
  exportCommandes(): void {
    // Logique d'export
    console.log('Export des commandes');
  }
  
  // Statistiques
  getCommandesCountByStatut(statut: string): number {
    return this.commandes.filter(c => c.statut === statut).length;
  }
}