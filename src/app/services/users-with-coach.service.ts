import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserWithCoach {
  user_id: number;
  user_nom: string;
  user_prenom: string;
  user_email: string;
  user_telephone: string;
  coach_id: number;
  coach_nom: string;
  coach_prenom: string;
  coach_email: string;
  coach_specialite: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersWithCoachService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Récupérer tous les utilisateurs avec leur coach
  getAllUsersWithCoaches(): Observable<UserWithCoach[]> {
    return this.http.get<UserWithCoach[]>(`${this.apiUrl}/users-with-coaches`);
  }

  // Rechercher des utilisateurs avec coach par terme
  searchUsersWithCoaches(term: string): Observable<UserWithCoach[]> {
    return this.http.get<UserWithCoach[]>(`${this.apiUrl}/search-users-coaches?term=${term}`);
  }

  // Obtenir les utilisateurs par ID de coach
  getUsersByCoachId(coachId: number): Observable<UserWithCoach[]> {
    return this.http.get<UserWithCoach[]>(`${this.apiUrl}/users-by-coach/${coachId}`);
  }
}