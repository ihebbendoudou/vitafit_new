import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medecin } from '../models/medecin.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedecinService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Récupérer tous les médecins
  getAllMedecins(): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(`${this.apiUrl}/medecin`);
  }

  // Récupérer un médecin par ID
  getMedecinById(id: number): Observable<Medecin> {
    return this.http.get<Medecin>(`${this.apiUrl}/medecin/${id}`);
  }

  // Ajouter un nouveau médecin
  addMedecin(medecin: Medecin): Observable<any> {
    return this.http.post(`${this.apiUrl}/medecin`, medecin);
  }

  // Mettre à jour un médecin
  updateMedecin(id: number, medecin: Medecin): Observable<any> {
    return this.http.put(`${this.apiUrl}/medecin/${id}`, medecin);
  }

  // Supprimer un médecin
  deleteMedecin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/medecin/${id}`);
  }

  // Rechercher des médecins
  searchMedecins(query: string): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(`${this.apiUrl}/medecin/search?q=${query}`);
  }
}