import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paiement } from '../models/paiement.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // Récupérer tous les paiements
  getAllPaiements(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/paiements`);
  }

  // Enregistrer un nouveau paiement
  createPaiement(paiementData: { abonnement_id: number, montant: number, mode_paiement: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/paiement`, paiementData);
  }

  // Récupérer les abonnements payés
  getAbonnementsPaies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/abonnements-payes`);
  }

  // Récupérer les abonnements non payés
  getAbonnementsNonPaies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/abonnements-non-payes`);
  }

  // Récupérer les paiements pour un mois spécifique
  getPaiementsByMonth(year: number, month: number): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/paiements/month/${year}/${month}`);
  }

  // Filtrer les paiements par mois côté client
  filterPaiementsByMonth(paiements: Paiement[], year: number, month: number): Paiement[] {
    return paiements.filter(paiement => {
      const paiementDate = new Date(paiement.date_paiement);
      return paiementDate.getFullYear() === year && paiementDate.getMonth() === month - 1; // Les mois commencent à 0 en JavaScript
    });
  }

  // Calculer le total des paiements
  calculateTotalAmount(paiements: Paiement[]): number {
    return paiements.reduce((total, paiement) => {
      const montant = typeof paiement.montant === 'string' ? parseFloat(paiement.montant) : paiement.montant;
      return total + montant;
    }, 0);
  }
}