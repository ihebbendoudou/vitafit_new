import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Abonnement {
  id?: number;
  user_id: number;
  type_id: number;
  date_debut: string;
  date_fin: string;
  coach_id?: any | null;
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  type_abonnement?: {
    id: number;
    nom: string;
    duree_jours: number;
    prix: number;
    avec_coach: boolean;
  };
  coach?: {
    id: number;
    nom: string; 
    prenom: string;
    email: string;
  } | null;
  date_creation?: any | null;
}

@Injectable({
  providedIn: 'root'
})
export class AbonnementService {
  private apiUrl = `${environment.apiUrl}/abonnement`;

  constructor(private http: HttpClient) {}

  getAllAbonnements(): Observable<Abonnement[]> {
    return this.http.get<Abonnement[]>(this.apiUrl);
  }

  getAbonnementById(id: number): Observable<Abonnement> {
    return this.http.get<Abonnement>(`${this.apiUrl}/${id}`);
  }

  createAbonnement(abonnement: Omit<Abonnement, 'id'>): Observable<any> {
    return this.http.post(this.apiUrl, abonnement);
  }

  updateAbonnement(id: number, abonnement: Partial<Abonnement>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, abonnement);
  }

  deleteAbonnement(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getAbonnementHistory(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${userId}`);
  }
}