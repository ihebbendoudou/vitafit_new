import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shared-weight-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shared-weight-history.component.html',
  styleUrls: ['./shared-weight-history.component.css']
})
export class SharedWeightHistoryComponent implements OnInit {
  @Input() userId: string = '';
  weightHistory: any[] = [];
  userInfo: any = null;
  loading = true;
  error = '';
  
  // Propriétés pour la modale des photos
  showPhotoModal = false;
  currentPhotos: string[] = [];
  currentPhotoIndex = 0;
  currentWeightData: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Si userId n'est pas fourni en input, essayer de le récupérer depuis l'URL
    if (!this.userId) {
      this.userId = this.route.snapshot.params['userId'];
    }
    this.loadSharedWeightHistory();
  }

  loadSharedWeightHistory() {
    this.loading = true;
    this.error = '';
    
    if (!this.userId) {
      this.error = 'ID utilisateur manquant dans l\'URL.';
      this.loading = false;
      return;
    }
    
    console.log('Chargement de l\'historique pour l\'utilisateur:', this.userId);
    
    this.http.get(`${environment.apiUrl}/poids/public/${this.userId}`)
      .subscribe({
        next: (response: any) => {
          console.log('Réponse reçue:', response);
          
          if (response && response.weightHistory && response.userInfo) {
            this.weightHistory = response.weightHistory;
            this.userInfo = response.userInfo;
            this.loading = false;
          } else {
            console.error('Structure de réponse invalide:', response);
            this.error = 'Données reçues invalides du serveur.';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'historique partagé:', error);
          
          if (error.status === 404) {
            this.error = 'Utilisateur non trouvé ou aucun historique disponible.';
          } else if (error.status === 500) {
            this.error = 'Erreur du serveur. Veuillez réessayer plus tard.';
          } else if (error.status === 0) {
            this.error = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
          } else {
            this.error = error.error?.error || 'Impossible de charger l\'historique de poids.';
          }
          
          this.loading = false;
        }
      });
  }

  getPhotoUrl(photo: string): string {
    if (photo.startsWith('http')) {
      return photo;
    }
    return `${environment.apiUrl}/uploads/${photo}`;
  }

  hasPhotos(weight: any): boolean {
    return weight.photos && weight.photos.length > 0;
  }

  getPhotosCount(weight: any): number {
    return weight.photos ? weight.photos.length : 0;
  }

  getTendencyIcon(current: number, previous: number): string {
    if (current > previous) return 'fas fa-arrow-up';
    if (current < previous) return 'fas fa-arrow-down';
    return 'fas fa-minus';
  }

  getTendencyClass(current: number, previous: number): string {
    if (current > previous) return 'trend-up';
    if (current < previous) return 'trend-down';
    return 'trend-stable';
  }

  getTendencyText(current: number, previous: number): string {
    const diff = Math.abs(current - previous);
    if (current > previous) return `+${diff.toFixed(1)} kg`;
    if (current < previous) return `-${diff.toFixed(1)} kg`;
    return 'Stable';
  }

  openPhotoModal(photos: string[], startIndex: number = 0, weightData: any = null) {
    this.currentPhotos = photos;
    this.currentPhotoIndex = startIndex;
    this.currentWeightData = weightData;
    this.showPhotoModal = true;
  }

  closePhotoModal() {
    this.showPhotoModal = false;
    this.currentPhotos = [];
    this.currentPhotoIndex = 0;
    this.currentWeightData = null;
  }

  nextPhoto() {
    if (this.currentPhotoIndex < this.currentPhotos.length - 1) {
      this.currentPhotoIndex++;
    }
  }

  previousPhoto() {
    if (this.currentPhotoIndex > 0) {
      this.currentPhotoIndex--;
    }
  }

  getCurrentPhoto(): string {
    return this.currentPhotos[this.currentPhotoIndex] || '';
  }
}