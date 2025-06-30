import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SuiviResultat {
  id?: number;
  user_id: number;
  date_suivi: string;
  poids: number;
  imc: number;
  tour_taille: number;
  tour_hanches: number;
  tour_bras: number;
  tour_cuisses: number;
  niveau_energie: string;
  observations: string;
  adherence_programme: string;
  photo_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuiviResultatsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Créer un nouveau suivi résultat
  createSuiviResultat(data: SuiviResultat): Observable<any> {
    return this.http.post(`${this.apiUrl}/suivi-resultats`, data);
  }

  // Récupérer les résultats d'un utilisateur par ID
  getSuiviResultatsByUserId(userId: number): Observable<SuiviResultat[]> {
    return this.http.get<SuiviResultat[]>(`${this.apiUrl}/suivi-resultats/${userId}`);
  }

  // Upload d'image
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
}