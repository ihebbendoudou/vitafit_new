// Modèle pour les médias associés aux exercices
export interface Media {
  id?: number;
  type: 'image' | 'gif' | 'youtube';
  url: string;
  exercice_id?: number;
}

// Modèle pour les exercices
export interface Exercice {
  id?: number;
  jour_id?: number;
  nom: string;
  description?: string;
  muscle_cible?: string;
  sets: number;
  repetitions: number;
  poids?: string;
  temps_repos: number;
  ordre?: number;
  medias?: Media[];
}

// Modèle pour les jours d'entraînement
export interface JourEntrainement {
  id?: number;
  programme_id?: number;
  jour: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
  titre?: string;
  notes?: string;
  exercices?: Exercice[];
}

// Modèle pour les programmes d'entraînement
export interface Programme {
  id?: number;
  user_id: number;
  coach_id?: number;
  nom: string;
  description?: string;
  created_at?: string;
  coach_nom?: string;
  coach_prenom?: string;
  user_nom?: string;
  user_prenom?: string;
  jours?: JourEntrainement[];
}