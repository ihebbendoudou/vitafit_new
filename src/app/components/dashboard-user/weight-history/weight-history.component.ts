import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';




interface WeightRecord {
  id: number;
  user_id: number;
  poids: number;
  date_enregistrement: any;
  photos?: string[];
}

interface PhotoUpload {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-weight-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weight-history.component.html',
  styleUrls: ['./weight-history.component.css']
})
export class WeightHistoryComponent implements OnInit {
  weights: WeightRecord[] = [];
  newWeight: number = 0;
  userId: number = 0;
  loading: boolean = false;
  error: string = '';
  success: string = '';
  selectedPhotos: PhotoUpload[] = [];
  maxPhotos: number = 5;
  showPhotoModal: boolean = false;
  selectedWeightPhotos: string[] = [];
  shareUrl: string = '';
  showShareModal: boolean = false;
  shareLoading: boolean = false;
  isPublicView: boolean = false;
  userInfo: any = null;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.getUserId();
    this.loadWeights();
  }

  getUserId(): void {
    // Vérifier d'abord si l'ID utilisateur est dans l'URL
    const userIdFromRoute = this.route.snapshot.paramMap.get('userId');
    
    if (userIdFromRoute) {
      this.userId = parseInt(userIdFromRoute, 10);
      
      // Vérifier si c'est un accès public (pas d'utilisateur connecté)
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId || parseInt(currentUserId, 10) !== this.userId) {
        this.isPublicView = true;
      }
    } else {
      // Fallback vers localStorage pour la compatibilité
      const userIdStr = localStorage.getItem('userId');
      if (userIdStr) {
        this.userId = parseInt(userIdStr, 10);
      }
    }
  }

  loadWeights(): void {
    if (!this.userId) return;
    
    this.loading = true;
    
    if (this.isPublicView) {
      // Accès public - charger les données via l'endpoint public
      this.http.get<any>(`${environment.apiUrl}/poids/public/${this.userId}`)
      .subscribe({
          next: (response) => {
            if (response && response.weightHistory) {
              this.weights = response.weightHistory;
              this.userInfo = response.userInfo;
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des poids publics:', error);
            this.error = 'Impossible de charger l\'historique de poids. L\'accès pourrait être restreint.';
            this.loading = false;
          }
        });
    } else {
      // Accès privé - utiliser l'endpoint normal
      this.http.get<WeightRecord[]>(`${environment.apiUrl}/poids/user/${this.userId}`)
      .subscribe({
          next: (data) => {
            this.weights = data;
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des poids:', error);
            this.error = 'Erreur lors du chargement des données';
            this.loading = false;
          }
        });
    }
  }

  addWeight(): void {
    if (!this.newWeight || this.newWeight <= 0) {
      this.error = 'Veuillez entrer un poids valide';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const formData = new FormData();
    formData.append('user_id', this.userId.toString());
    formData.append('poids', this.newWeight.toString());
    
    // Ajouter les photos sélectionnées
    this.selectedPhotos.forEach((photo, index) => {
      formData.append('photos', photo.file);
    });

    this.http.post(`${environment.apiUrl}/poids`, formData)
    .subscribe({
        next: (response) => {
          this.success = 'Poids ajouté avec succès!';
          this.newWeight = 0;
          this.selectedPhotos = [];
          this.loadWeights(); // Recharger la liste
          this.loading = false;
          
          // Effacer le message de succès après 3 secondes
          setTimeout(() => {
            this.success = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du poids:', error);
          this.error = 'Erreur lors de l\'ajout du poids';
          this.loading = false;
        }
      });
  }

  deleteWeight(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée?')) {
      return;
    }

    this.loading = true;
    this.http.delete(`${environment.apiUrl}/poids/${id}`)
    .subscribe({
        next: (response) => {
          this.success = 'Poids supprimé avec succès!';
          this.loadWeights(); // Recharger la liste
          this.loading = false;
          
          // Effacer le message de succès après 3 secondes
          setTimeout(() => {
            this.success = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.error = 'Erreur lors de la suppression';
          this.loading = false;
        }
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getWeightTrend(): string {
    if (this.weights.length < 2) return '';
    
    const latest = this.weights[0].poids;
    const previous = this.weights[1].poids;
    const diff = latest - previous;
    
    if (diff > 0) {
      return `+${diff.toFixed(1)} kg`;
    } else if (diff < 0) {
      return `${diff.toFixed(1)} kg`;
    }
    return 'Stable';
  }

  getWeightTrendClass(): string {
    if (this.weights.length < 2) return '';
    
    const latest = this.weights[0].poids;
    const previous = this.weights[1].poids;
    const diff = latest - previous;
    
    if (diff > 0) return 'trend-up';
    if (diff < 0) return 'trend-down';
    return 'trend-stable';
  }

  onPhotosSelected(event: any): void {
    const files = event.target.files;
    if (!files) return;

    // Vérifier le nombre maximum de photos
    if (this.selectedPhotos.length + files.length > this.maxPhotos) {
      this.error = `Vous ne pouvez ajouter que ${this.maxPhotos} photos maximum`;
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.error = 'Seules les images sont autorisées';
        continue;
      }

      // Vérifier la taille du fichier (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'La taille de l\'image ne doit pas dépasser 5MB';
        continue;
      }

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedPhotos.push({
          file: file,
          preview: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }

    // Réinitialiser l'input
    event.target.value = '';
  }

  removePhoto(index: number): void {
    this.selectedPhotos.splice(index, 1);
  }

  openPhotoModal(photos: string[]): void {
    this.selectedWeightPhotos = photos;
    this.showPhotoModal = true;
  }

  closePhotoModal(): void {
    this.showPhotoModal = false;
    this.selectedWeightPhotos = [];
  }

  getPhotoUrl(photoPath: string): string {
    // Si l'URL est déjà complète (commence par http), la retourner directement
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    // Sinon, construire l'URL complète
    return `${environment.apiUrl}/uploads/${photoPath}`;
  }

  hasPhotos(weight: WeightRecord): any {
    return weight.photos && weight.photos.length > 0;
  }

  getPhotosCount(weight: WeightRecord): number {
    return weight.photos ? weight.photos.length : 0;
  }

  // Méthodes de partage
  generateShareLink(): void {
    this.shareLoading = true;
    this.error = '';
    
    this.http.post(`${environment.apiUrl}/poids/share/${this.userId}`, {})
      .subscribe({
        next: (response: any) => {
          this.shareUrl = `${environment.apiUrl}/poids/share/${this.userId}`;
          this.showShareModal = true;
          this.shareLoading = false;
          this.success = 'Lien de partage généré avec succès!';
        },
        error: (error) => {
          console.error('Erreur lors de la génération du lien:', error);
          this.error = 'Erreur lors de la génération du lien de partage';
          this.shareLoading = false;
        }
      });
  }

  copyShareLink(): void {
    if (this.shareUrl) {
      navigator.clipboard.writeText(this.shareUrl).then(() => {
        this.success = 'Lien copié dans le presse-papiers!';
        setTimeout(() => this.success = '', 3000);
      }).catch(() => {
        this.error = 'Erreur lors de la copie du lien';
      });
    }
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.shareUrl = '';
  }

  revokeShareLink(): void {
    this.shareLoading = true;
    
    this.http.delete(`${environment.apiUrl}/poids/share/${this.userId}`)
      .subscribe({
        next: () => {
          this.shareUrl = '';
          this.showShareModal = false;
          this.shareLoading = false;
          this.success = 'Lien de partage révoqué avec succès!';
        },
        error: (error) => {
          console.error('Erreur lors de la révocation:', error);
          this.error = 'Erreur lors de la révocation du lien';
          this.shareLoading = false;
        }
      });
  }
}