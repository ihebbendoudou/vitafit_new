import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Categorie {
  id: number;
  nom: string;
}

export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  quantite: number;
  categorie_id: number;
  images?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Méthodes pour les produits
  getAllProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/produits`);
  }

  getProduitById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/produits/${id}`);
  }

  createProduit(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/produits`, formData);
  }

  updateProduit(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/produits/${id}`, formData);
  }

  deleteProduit(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/produits/${id}`);
  }

  getProduitsByCategorie(categorieId: number): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/produits/categorie/${categorieId}`);
  }

  // Méthodes pour les catégories
  getAllCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/categories`);
  }

  getCategorieById(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${this.apiUrl}/categories/${id}`);
  }

  createCategorie(categorie: Partial<Categorie>): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, categorie);
  }

  updateCategorie(id: number, categorie: Partial<Categorie>): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, categorie);
  }

  deleteCategorie(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }

  // Méthode utilitaire pour construire l'URL des images
  getImageUrl(imagePath: string): string {
    return `http://localhost:3000/uploads/produits/${imagePath}`;
  }
}