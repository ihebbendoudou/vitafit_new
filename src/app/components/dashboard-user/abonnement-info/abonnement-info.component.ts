import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbonnementService } from '../../../services/abonnement.service';

export interface AbonnementHistory {
  abonnement_id: number;
  user_id: number;
  nom_utilisateur: string;
  prenom_utilisateur: string;
  type_id: number;
  type_abonnement: string;
  prix: string;
  montant: string;
  date_paiement: string;
  mode_paiement: string;
  date_debut: string;
  date_fin: string;
  coach_id: number;
  nom_coach: string;
  prenom_coach: string;
}

@Component({
  selector: 'app-abonnement-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abonnement-info.component.html',
  styleUrls: ['./abonnement-info.component.css']
})
export class AbonnementInfoComponent implements OnInit {
  userId: number = 0;
  
  abonnementHistory: AbonnementHistory[] = [];
  currentAbonnement: AbonnementHistory | null = null;
  expiredAbonnements: AbonnementHistory[] = [];
  loading = false;
  error = '';
  showHistory = false;

  constructor(private abonnementService: AbonnementService) {}

  ngOnInit(): void {
    // Récupérer l'ID utilisateur depuis localStorage
    const userIdStr = localStorage.getItem('userId');
    if (userIdStr) {
      this.userId = parseInt(userIdStr, 10);
      this.loadAbonnementHistory();
    } else {
      this.error = 'Utilisateur non identifié';
    }
  }

  loadAbonnementHistory(): void {
    this.loading = true;
    this.error = '';
    
    this.abonnementService.getAbonnementHistory(this.userId).subscribe({
      next: (data) => {
        this.abonnementHistory = data;
        this.processAbonnements();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement de l\'historique des abonnements';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  processAbonnements(): void {
    const now = new Date();
    
    // Trouver l'abonnement actuel (non expiré)
    this.currentAbonnement = this.abonnementHistory.find(abonnement => {
      const dateFin = new Date(abonnement.date_fin);
      return dateFin >= now;
    }) || null;
    
    // Filtrer les abonnements expirés
    this.expiredAbonnements = this.abonnementHistory.filter(abonnement => {
      const dateFin = new Date(abonnement.date_fin);
      return dateFin < now;
    }).sort((a, b) => new Date(b.date_fin).getTime() - new Date(a.date_fin).getTime());
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isAbonnementExpiringSoon(dateFin: string): boolean {
    const now = new Date();
    const endDate = new Date(dateFin);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }

  getDaysRemaining(dateFin: string): number {
    const now = new Date();
    const endDate = new Date(dateFin);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}