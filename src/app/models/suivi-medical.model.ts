export interface SuiviMedical {
  id?: number;
  user_id: number;
  medecin_id: number;
  diagnostic: string;
  recommandations: string;
  date_creation?: Date;
  user_nom?: string;
  medecin_nom?: string;
}