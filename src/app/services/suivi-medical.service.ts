import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SuiviMedical } from '../models/suivi-medical.model';

@Injectable({
  providedIn: 'root'
})
export class SuiviMedicalService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Récupérer tous les suivis médicaux
  getAllSuivis(): Observable<SuiviMedical[]> {
    return this.http.get<SuiviMedical[]>(`${this.apiUrl}/suivis`);
  }

  // Récupérer un suivi médical par ID
  getSuiviById(id: number): Observable<SuiviMedical> {
    return this.http.get<SuiviMedical>(`${this.apiUrl}/suivis/${id}`);
  }

  // Créer un nouveau suivi médical
  createSuivi(suivi: SuiviMedical): Observable<any> {
    return this.http.post(`${this.apiUrl}/suivis`, suivi);
  }

  // Mettre à jour un suivi médical
  updateSuivi(id: number, suivi: SuiviMedical): Observable<any> {
    return this.http.put(`${this.apiUrl}/suivis/${id}`, suivi);
  }

  // Supprimer un suivi médical
  deleteSuivi(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/suivis/${id}`);
  }
}