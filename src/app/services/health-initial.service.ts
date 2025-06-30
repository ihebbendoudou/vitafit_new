import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HealthInitialData {
  user_id: number;
  imc: number;
  tour_taille: number;
  tour_hanches: number;
  tour_bras: number;
  tour_cuisses: number;
  graisse_corporelle: number;
  masse_musculaire: number;
  hydratation: number;
  tension_arterielle: string;
  frequence_cardiaque: number;
  glycemie: number;
  ferritine: number;
  cholesterol: number;
  activite_physique: string;
  pathologies: string;
  date_diagnostic: string;
  date_enregistrement: string;
  sommeil_heures: number;
  qualite_sommeil: string;
  stress: string;
  hydratation_litres: number;
  journal_alimentaire: string;
  score_conformite_alimentaire: number;
  activite_physique_type: string;
  frequence_activite: string;
  duree_activite_minutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class HealthInitialService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Récupérer les données de santé d'un utilisateur par son ID
  getHealthDataByUserId(userId: number): Observable<HealthInitialData> {
    return this.http.get<HealthInitialData>(`${this.apiUrl}/health/${userId}`);
  }

  // Créer de nouvelles données de santé
  createHealthData(data: HealthInitialData): Observable<any> {
    return this.http.post(`${this.apiUrl}/health`, data);
  }

  // Mettre à jour les données de santé d'un utilisateur
  updateHealthData(userId: number, data: Partial<HealthInitialData>): Observable<any> {
    return this.http.put(`${this.apiUrl}/health/${userId}`, data);
  }

  // Supprimer les données de santé d'un utilisateur
  deleteHealthData(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/health/${userId}`);
  }
}