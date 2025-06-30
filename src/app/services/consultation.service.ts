import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Consultation {
  id: number;
  type: 'adherent' | 'internaute';
  user_id?: number;
  guest_id?: number;
  objet?: string;
  approuve_admin: boolean | number;
  approuve_medecin: boolean | number;
  commentaire_admin?: string;
  commentaire_medecin?: string;
  date_demande?: any;
  date_consultation?: any;
  heure_consultation?: any;
  statut: 'en_attente' | 'approuve_admin' | 'en_attente_medecin' | 'valide' | 'refuse';
  medecin_id?: number;
  created_at: string;
  // Champs utilisateur
  user_nom?: string;
  user_prenom?: string;
  user_email?: string;
  // Champs invité
  guest_nom?: string;
  guest_prenom?: string;
  guest_email?: string;
  // Champs médecin
  medecin_nom?: string;
  medecin_specialite?: string;
  // Champs additionnels pour compatibilité
  user_name?: string;
  guest_name?: string;
  medecin_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Récupère toutes les consultations non approuvées
   */
  getUnapprovedConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(
      `${this.apiUrl}/consultations`,
      { headers: this.getHeaders() }
    ).pipe(
      map((consultations: Consultation[]) => 
        consultations.filter(c => 
          c.approuve_admin === false || c.approuve_admin === 0
        )
      )
    );
  }

  /**
   * Récupère toutes les consultations avec filtres optionnels
   */
  getConsultations(filters?: {
    type?: string;
    statut?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{
    consultations: Consultation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let url = `${this.apiUrl}/consultations`;
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) params.append('type', filters.type);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<{
      consultations: Consultation[];
      total: number;
      page: number;
      totalPages: number;
    }>(url, { headers: this.getHeaders() });
  }

  /**
   * Approuve une consultation
   */
  approveConsultation(id: number, commentaire?: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/consultations/${id}/approve`,
      { commentaire_admin: commentaire },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Refuse une consultation
   */
  rejectConsultation(id: number, commentaire?: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/consultations/${id}/reject`,
      { commentaire_admin: commentaire },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Supprime une consultation
   */
  deleteConsultation(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/consultations/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Récupère une consultation par ID
   */
  getConsultationById(id: number): Observable<Consultation> {
    return this.http.get<Consultation>(
      `${this.apiUrl}/consultations/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Met à jour une consultation
   */
  updateConsultation(id: number, data: Partial<Consultation>): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/consultations/${id}`,
      data,
      { headers: this.getHeaders() }
    );
  }
  
  
  
  getAllConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/consultations`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Récupère les consultations par statut
   */
  getConsultationsByStatus(statut: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(
      `${this.apiUrl}/consultations/status/${statut}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Approuve une consultation par l'admin
   */
  approveByAdmin(id: number, data: { commentaire_admin?: string; medecin_id?: number }): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/consultations/${id}/approve-admin`,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Refuse une consultation par l'admin
   */
  rejectByAdmin(id: number, commentaire_admin?: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/consultations/${id}/reject-admin`,
      { commentaire_admin },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Approuve une consultation par le médecin
   */
  approveByMedecin(id: number, data: { commentaire_medecin?: string; date_consultation?: string }): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/consultations/${id}/approve-medecin`,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Approuve une consultation par le médecin
   */


  /**
   * Refuse une consultation par le médecin
   */
  rejectByMedecin(id: number, commentaire_medecin?: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/consultations/${id}/reject-medecin`,
      { commentaire_medecin },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Récupère les consultations assignées à un médecin spécifique
   */
  getConsultationsByMedecinId(medecinId: number): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(
      `${this.apiUrl}/consultations/medecin/${medecinId}`,
      { headers: this.getHeaders() }
    );
  }

}

