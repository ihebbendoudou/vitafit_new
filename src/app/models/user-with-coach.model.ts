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
  hasProgramme?: boolean;
  programmeCount?: number;
}