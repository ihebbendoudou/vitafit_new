    export interface Coach {
        id?: number;
        nom: string;                // Contient le "nom complet" (prénom + nom)
        prenom: string;            // Optionnel si tu veux découper nom
        email: string;
        telephone: string;          // utilisé dans `FormGroup`
        specialite: string;
        mot_de_passe?: string;      // Optionnel
    }
    