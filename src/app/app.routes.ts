import { Routes } from '@angular/router';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { TypeAbonnementComponent } from './components/type-abonnement/type-abonnement.component';
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin.component';
import { DashboardUserComponent } from './components/dashboard-user/dashboard-user.component';
import { DashboardMedecinComponent } from './components/dashboard-medecin/dashboard-medecin.component';
import { DashboardCoachComponent } from './components/dashboard-coach/dashboard-coach.component';
import { AbonnementComponent } from './components/abonnement/abonnement.component';
import { CoachManagementComponent } from './components/coach-management/coach-management.component';
import { PaiementComponent } from './components/paiement/paiement.component';
import { AnalysePaiementComponent } from './components/paiement/analyse-paiement/analyse-paiement.component';
import { MedecinManagementComponent } from './components/medecin-management/medecin-management.component';
import { SuiviMedicauxMedecinComponent } from './components/dashboard-medecin/suivi-medicaux-medecin/suivi-medicaux-medecin.component';
import { SuiviMedicalComponent } from './components/suivi-medical/suivi-medical.component';
import { RecipeManagementComponent } from './components/dashboard-admin/recipe-management/recipe-management.component';
import { ConsultationsUnifiedComponent } from './components/dashboard-admin/consultations-unified/consultations-unified.component';
import { ProductManagementComponent } from './components/dashboard-admin/product-management/product-management.component';
import { OrderManagementComponent } from './components/dashboard-admin/order-management/order-management.component';
import { LoginComponent } from './components/login/login.component';
import { AccountManagementComponent } from './components/account-management/account-management.component';
import { CoachClientsComponent } from './components/coach-clients/coach-clients.component';
import { ProgrammeComponent } from './components/programme/programme.component';
import { ProgrammeComponent as UserProgrammeComponent } from './components/dashboard-user/programme/programme.component';
import { DashboardProfileComponent } from './components/dashboard-user/dashboard-profile/dashboard-profile.component';
import { WeightHistoryComponent } from './components/dashboard-user/weight-history/weight-history.component';
import { AbonnementInfoComponent } from './components/dashboard-user/abonnement-info/abonnement-info.component';
import { DossierMedicalComponent } from './components/dashboard-user/dossier-medical/dossier-medical.component';
import { ReminderComponent } from './components/dashboard-user/reminder/reminder.component';
import { ConsultationRequestComponent } from './components/dashboard-user/consultation-request/consultation-request.component';
import { HomeComponent } from './components/home/home.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { RecipeDetailComponent } from './components/recipe-detail/recipe-detail.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';

import { SharedWeightHistoryComponent } from './components/shared-weight-history/shared-weight-history.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'accueil', component: HomeComponent },
  { path: 'recipes', component: RecipesComponent },
  { path: 'recipe/:id', component: RecipeDetailComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'shared/weight/:token', component: SharedWeightHistoryComponent },
  { 
    path: 'dashboard', 
    component: DashboardAdminComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: UserManagementComponent },
      { path: 'abonnementstype', component: TypeAbonnementComponent },
      { path: 'abonnements', component: AbonnementComponent },
      { path: 'coachs', component: CoachManagementComponent },
      { path: 'medecins', component: MedecinManagementComponent },
      { path: 'consultations', component: ConsultationsUnifiedComponent },
      { path: 'produits', component: ProductManagementComponent },
      { path: 'commandes', component: OrderManagementComponent },
      { path: 'paiements', component: PaiementComponent },
      { path: 'suivi-medical', component: SuiviMedicalComponent },
      { path: 'recettes', component: RecipeManagementComponent },
      { path: 'stats', component: UserManagementComponent },
      { path: 'settings', component: UserManagementComponent },
      { path: 'analyse', component: AnalysePaiementComponent },
      { path: 'mon-compte', component: AccountManagementComponent }
    ] 
  },
  {
    path: 'user-dashboard/:userId',
    component: DashboardUserComponent,
    canActivate: [AuthGuard],
    data: { roles: ['user'], prerender: false },
    children: [
      { path: '', redirectTo: 'abonnement', pathMatch: 'full' },
      { path: 'abonnement', component: AbonnementInfoComponent },
      { path: 'profile', component: DashboardProfileComponent },
      { path: 'poids', component: WeightHistoryComponent, data: { prerender: false } },
      { path: 'suivi', component: DossierMedicalComponent },
      { path: 'consultation', component: ConsultationRequestComponent },
      { path: 'planning', component: UserManagementComponent, data: { prerender: false } },
      { path: 'programme', component: UserProgrammeComponent },
      { path: 'reminder', component: ReminderComponent, data: { prerender: false } },

      { path: 'mon-compte', component: AccountManagementComponent }
    ]
  },
  // Route publique pour partager l'historique de poids
  { path: 'user-dashboard/:userId/poids', component: WeightHistoryComponent, data: { prerender: false } },
  {
    path: 'medecin-dashboard',
    component: DashboardMedecinComponent,
    canActivate: [AuthGuard],
    data: { roles: ['medecin'] },
    children: [
      { path: '', redirectTo: 'patients', pathMatch: 'full' },
      { path: 'patients', component: UserManagementComponent },
      { path: 'consultations', component: UserManagementComponent },
      { path: 'suivis', component: SuiviMedicalComponent },
      { path: 'planning', component: UserManagementComponent },
      { path: 'profile', component: UserManagementComponent },
      { path: 'mon-compte', component: AccountManagementComponent }
    ]
  },
  {
    path: 'coach-dashboard',
    component: DashboardCoachComponent,
    canActivate: [AuthGuard],
    data: { roles: ['coach'] },
    children: [
      { path: '', redirectTo: 'clients', pathMatch: 'full' },
      { path: 'clients', component: CoachClientsComponent },
      { path: 'seances', component: UserManagementComponent },
      { path: 'programmes', component: ProgrammeComponent },
      { path: 'suivis', component: SuiviMedicauxMedecinComponent },
      { path: 'planning', component: UserManagementComponent },
      { path: 'profile', component: UserManagementComponent },
      { path: 'mon-compte', component: AccountManagementComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
