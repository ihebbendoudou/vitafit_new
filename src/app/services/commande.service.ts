import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Commande {
  id: number;
  reference: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse_livraison: string;
  mode_paiement: string;
  notes?: string;
  total: number;
  statut: string;
  date_commande: string;
}

export interface CommandeItem {
  id: number;
  commande_id: number;
  produit_id: number;
  quantite: number;
  prix_unitaire: number;
  nom?: string;
  image?: string;
  description?: string;
  prix?: number;
}

export interface CommandeStatut {
  id: number;
  commande_id: number;
  statut: string;
  date_statut: string;
}

export interface CommandeDetails {
  commande: Commande;
  items: CommandeItem[];
  statuts: CommandeStatut[];
}

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Récupérer toutes les commandes
   */
  getAllCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiUrl}/commande`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupérer les détails d'une commande par ID
   */
  getCommandeDetails(id: number): Observable<CommandeDetails> {
    return this.http.get<CommandeDetails>(`${this.apiUrl}/commande/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupérer les détails d'une commande par référence
   */
  getCommandeDetailsByReference(reference: string): Observable<CommandeDetails> {
    return this.http.get<CommandeDetails>(`${this.apiUrl}/commande/reference/${reference}`);
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  updateCommandeStatut(id: number, statut: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/commande/${id}/statut`, { statut })
      .pipe(catchError(this.handleError));
  }

  /**
   * Créer une nouvelle commande
   */
  createCommande(commandeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/commande`, commandeData);
  }

  /**
   * Mettre à jour le stock d'un produit
   */
  updateProductStock(produitId: number, quantiteReduite: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/produits/${produitId}/stock`, { 
      quantite_reduite: quantiteReduite 
    }).pipe(catchError(this.handleError));
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.status === 401) {
      errorMessage = 'Accès non autorisé. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit. Vous n\'avez pas les permissions nécessaires.';
    } else if (error.status === 404) {
      errorMessage = 'Ressource non trouvée.';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    console.error('Erreur HTTP:', error);
    return throwError(() => new Error(errorMessage));
  }
}