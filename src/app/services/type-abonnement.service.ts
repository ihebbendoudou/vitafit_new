import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

type TypeAbonnement = {
  id: number;
  nom: string;
  duree_jours: number;
  prix: number;
  avec_coach: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class TypeAbonnementService {
  private apiUrl = `${environment.apiUrl}/type_abonnement`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<TypeAbonnement[]>(this.apiUrl);
  }

  create(data: Omit<TypeAbonnement, 'id'>) {
    return this.http.post<TypeAbonnement>(this.apiUrl, data);
  }

  update(id: number, data: Partial<TypeAbonnement>) {
    return this.http.put<TypeAbonnement>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}