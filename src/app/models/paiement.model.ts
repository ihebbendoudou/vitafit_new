export interface Paiement {
  id?: number;
  abonnement_id: number;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
}