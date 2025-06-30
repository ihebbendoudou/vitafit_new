import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgrammeService {
  private apiUrl = `${environment.apiUrl}/programmes`;

  constructor(private http: HttpClient) {}

  // Créer un nouveau programme
  createProgramme(programme: { user_id: number, nom: string, description: string }): Observable<any> {
    // Récupérer l'ID du coach connecté depuis le localStorage
    const coachId = localStorage.getItem('userId');
    if (!coachId) {
      throw new Error("ID du coach non disponible");
    }
    
    // Ajouter le coach_id au programme
    const programmeWithCoachId = {
      ...programme,
      coach_id: parseInt(coachId, 10)
    };
    
    return this.http.post(this.apiUrl, programmeWithCoachId);
  }

  // Ajouter un jour d'entraînement
  addJour(jour: { programme_id: number, jour: string, titre: string, notes: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/jours`, jour);
  }

  // Ajouter un exercice
  addExercice(exercice: {
    jour_id: number,
    nom: string,
    description?: string,
    muscle_cible?: string,
    sets: number,
    repetitions: number,
    poids?: string,
    temps_repos: number,
    ordre?: number
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/exercices`, exercice);
  }

  // Ajouter un média à un exercice
  addMedia(media: { exercice_id: number, type: string, url: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/medias`, media);
  }

  // Upload d'un fichier (image ou GIF)
  uploadFile(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/upload`, formData);
  }

  // Obtenir les programmes d'un utilisateur
  getProgrammesByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Obtenir les détails d'un programme
  getProgrammeDetails(programmeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${programmeId}`);
  }

  // Supprimer un programme
  deleteProgramme(programmeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${programmeId}`);
  }

  // Modifier un programme
  updateProgramme(programmeId: number, programme: { nom: string, description: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${programmeId}`, programme);
  }

  // Modifier un jour d'entraînement
  updateJour(jourId: number, jour: { jour: string, titre: string, notes: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/jours/${jourId}`, jour);
  }

  // Modifier un exercice
  updateExercice(exerciceId: number, exercice: {
    nom: string,
    description?: string,
    muscle_cible?: string,
    sets: number,
    repetitions: number,
    poids?: string,
    temps_repos: number,
    ordre?: number
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/exercices/${exerciceId}`, exercice);
  }

  // Supprimer un jour d'entraînement
  deleteJour(jourId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/jours/${jourId}`);
  }

  // Supprimer un exercice
  deleteExercice(exerciceId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/exercices/${exerciceId}`);
  }

  // Supprimer un média
  deleteMedia(mediaId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/medias/${mediaId}`);
  }

  // Obtenir les programmes d'un coach
  getProgrammesByCoachId(coachId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/coach/${coachId}`);
  }
}