import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coach } from '../models/coach.model';

@Injectable({
  providedIn: 'root'
})
export class CoachService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Récupérer tous les coachs
  getAllCoachs(): Observable<Coach[]> {
    return this.http.get<Coach[]>(`${this.apiUrl}/coach`);
  }

  // Récupérer un coach par ID
  getCoachById(id: number): Observable<Coach> {
    return this.http.get<Coach>(`${this.apiUrl}/coach/${id}`);
  }

  // Ajouter un nouveau coach
  addCoach(coach: Coach): Observable<any> {
    return this.http.post(`${this.apiUrl}/coach`, coach);
  }

  // Mettre à jour un coach
  updateCoach(id: number, coach: Coach): Observable<any> {
    return this.http.put(`${this.apiUrl}/coach/${id}`, coach);
  }

  // Supprimer un coach
  deleteCoach(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/coach/${id}`);
  }

  // Rechercher des coachs
  searchCoachs(query: string): Observable<Coach[]> {
    return this.http.get<Coach[]>(`${this.apiUrl}/coach/search?query=${query}`);
  }
}