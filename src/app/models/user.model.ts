export interface User {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  tel: string;
  adresse: string;
  role: string;
  image?: string;
  hasProgramme?: boolean;
  programmeCount?: number;
}