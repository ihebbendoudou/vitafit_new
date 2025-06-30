import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { SuiviMedicalService } from '../../../services/suivi-medical.service';
import { HealthInitialService } from '../../../services/health-initial.service';
import { SuiviResultatsService } from '../../../services/suivi-resultats.service';
import { AuthService } from '../../../services/auth.service';
import { SuiviMedical } from '../../../models/suivi-medical.model';
import { HealthInitialData } from '../../../services/health-initial.service';
import { SuiviResultat } from '../../../services/suivi-resultats.service';

// Enregistrer les composants Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dossier-medical',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dossier-medical.component.html',
  styleUrls: ['./dossier-medical.component.css']
})
export class DossierMedicalComponent implements OnInit {
  userId: number = 0;
  suivisMedicaux: SuiviMedical[] = [];
  donneesInitiales: HealthInitialData | null = null;
  suivisResultats: SuiviResultat[] = [];
  loading: boolean = true;
  error: string = '';

  // Données pour les graphiques
  poidsChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  imcChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  mesuresChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  
  // Configuration des graphiques
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Valeur'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };
  
  chartType: ChartType = 'line';

  constructor(
    private suiviMedicalService: SuiviMedicalService,
    private healthInitialService: HealthInitialService,
    private suiviResultatsService: SuiviResultatsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getUserId();
    this.loadDossierMedical();
  }

  private getUserId(): void {
    const userData = this.authService.getcurrentUser();
    if (userData && userData.id) {
      this.userId = userData.id;
    }
  }

  private loadDossierMedical(): void {
    this.loading = true;
    this.error = '';

    // Charger les données initiales de santé
    this.healthInitialService.getHealthDataByUserId(this.userId).subscribe({
      next: (data) => {
        this.donneesInitiales = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données initiales:', err);
      }
    });

    // Charger les suivis médicaux
    this.suiviMedicalService.getAllSuivis().subscribe({
      next: (suivis) => {
        // Filtrer les suivis pour l'utilisateur actuel si nécessaire
        this.suivisMedicaux = suivis;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des suivis médicaux:', err);
      }
    });

    // Charger les résultats de suivi
    this.suiviResultatsService.getSuiviResultatsByUserId(this.userId).subscribe({
      next: (resultats) => {
        this.suivisResultats = resultats.sort((a, b) => 
          new Date(a.date_suivi).getTime() - new Date(b.date_suivi).getTime()
        );
        this.generateCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des résultats:', err);
        this.loading = false;
        this.error = 'Erreur lors du chargement du dossier médical';
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getNiveauEnergieBadgeClass(niveau: string): string {
    switch (niveau?.toLowerCase()) {
      case 'élevé':
      case 'eleve':
        return 'badge-success';
      case 'moyen':
        return 'badge-warning';
      case 'faible':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getAdherenceBadgeClass(adherence: string): string {
    switch (adherence?.toLowerCase()) {
      case 'excellente':
        return 'badge-success';
      case 'bonne':
        return 'badge-info';
      case 'moyenne':
        return 'badge-warning';
      case 'faible':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  private generateCharts(): void {
    if (this.suivisResultats.length === 0) return;

    const labels = this.suivisResultats.map(suivi => 
      this.formatDate(suivi.date_suivi)
    );

    // Graphique du poids
    this.poidsChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Poids (kg)',
          data: this.suivisResultats.map(suivi => suivi.poids),
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Graphique de l'IMC
    this.imcChartData = {
      labels: labels,
      datasets: [
        {
          label: 'IMC',
          data: this.suivisResultats.map(suivi => suivi.imc),
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Graphique des mesures corporelles
    this.mesuresChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Tour de taille (cm)',
          data: this.suivisResultats.map(suivi => suivi.tour_taille),
          borderColor: '#27ae60',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Tour de hanches (cm)',
          data: this.suivisResultats.map(suivi => suivi.tour_hanches),
          borderColor: '#f39c12',
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Tour de bras (cm)',
          data: this.suivisResultats.map(suivi => suivi.tour_bras),
          borderColor: '#9b59b6',
          backgroundColor: 'rgba(155, 89, 182, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Tour de cuisses (cm)',
          data: this.suivisResultats.map(suivi => suivi.tour_cuisses),
          borderColor: '#e67e22',
          backgroundColor: 'rgba(230, 126, 34, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    };
  }
}