import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { PaiementService } from '../../../services/paiement.service';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analyse-paiement',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [DatePipe],
  templateUrl: './analyse-paiement.component.html',
  styleUrls: ['./analyse-paiement.component.css']
})
export class AnalysePaiementComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // Chart data for monthly view
  public chartMensuelData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { 
        data: [], 
        label: 'Montant des paiements (€)', 
        backgroundColor: 'rgba(78, 115, 223, 0.8)',
        borderColor: 'rgba(78, 115, 223, 1)',
        borderWidth: 1
      }
    ]
  };

  // Chart data for yearly view
  public chartAnnuelData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { 
        data: [], 
        label: 'Montant des paiements (€)', 
        backgroundColor: 'rgba(28, 200, 138, 0.8)',
        borderColor: 'rgba(28, 200, 138, 1)',
        borderWidth: 1
      }
    ]
  };

  // Chart configuration options
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category'
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + ' €';
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y + ' €';
          }
        }
      }
    }
  };

  public chartType: ChartType = 'bar';
  private paiements: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private paiementService: PaiementService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadPaiements();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.chart?.destroy();
    }
  }

  loadPaiements(): void {
    this.loading = true;
    this.paiementService.getAllPaiements().subscribe({
      next: (data) => {
        this.paiements = data;
        this.prepareChartData();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des paiements', error);
        this.errorMessage = 'Impossible de charger les données des paiements';
        this.loading = false;
      }
    });
  }

  prepareChartData(): void {
    this.prepareMonthlyData();
    this.prepareYearlyData();
  }

  prepareMonthlyData(): void {
    const currentDate = new Date();
    const monthLabels = [];
    const monthlyData = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthLabel = this.datePipe.transform(date, 'MMM yyyy');
      monthLabels.push(monthLabel);
      
      const monthPayments = this.paiements.filter(payment => {
        const paymentDate = new Date(payment.date_paiement);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear();
      });
      
      const totalAmount = monthPayments.reduce((sum, payment) => {
        return sum + (typeof payment.montant === 'string' ? parseFloat(payment.montant) : payment.montant);
      }, 0);
      
      monthlyData.push(totalAmount);
    }
    
    this.chartMensuelData = {
      ...this.chartMensuelData,
      labels: monthLabels,
      datasets: [{
        ...this.chartMensuelData.datasets[0],
        data: monthlyData
      }]
    };
  }

  prepareYearlyData(): void {
    const currentYear = new Date().getFullYear();
    const yearLabels = [];
    const yearlyData = [];
    
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      yearLabels.push(year.toString());
      
      const yearPayments = this.paiements.filter(payment => {
        const paymentDate = new Date(payment.date_paiement);
        return paymentDate.getFullYear() === year;
      });
      
      const totalAmount = yearPayments.reduce((sum, payment) => {
        return sum + (typeof payment.montant === 'string' ? parseFloat(payment.montant) : payment.montant);
      }, 0);
      
      yearlyData.push(totalAmount);
    }
    
    this.chartAnnuelData = {
      ...this.chartAnnuelData,
      labels: yearLabels,
      datasets: [{
        ...this.chartAnnuelData.datasets[0],
        data: yearlyData
      }]
    };
  }

  toggleChartType(): void {
    this.chartType = this.chartType === 'bar' ? 'line' : 'bar';
    
    // Force chart update
    if (this.chart) {
      this.chart.update();
    }
  }
}