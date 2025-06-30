import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

interface Recipe {
  id?: number;
  title: string;
  description: string;
  ingredients: string;
  steps: string;
  calories: number;
  prep_time?: number;
  cook_time?: number;
  total_time?: number;
  servings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  cuisine?: string;
  afficher?: boolean;
  created_at?: string;
  updated_at?: string;
  images?: RecipeImage[];
}

interface RecipeImage {
  id: number;
  recipe_id: number;
  image_url: string;
}

@Component({
  selector: 'app-recipe-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './recipe-management.component.html',
  styleUrls: ['./recipe-management.component.css']
})
export class RecipeManagementComponent implements OnInit {
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  selectedRecipe: Recipe | null = null;
  isEditing = false;
  isCreating = false;
  searchTerm = '';
  maxCaloriesFilter = '';
  ingredientFilter = '';
  selectedFile: File | null = null;
  selectedFiles: FileList | null = null;
  
  // Propriétés pour le carrousel d'images
  currentImageIndex = 0;
  selectedRecipeImages: RecipeImage[] = [];
  
  newRecipe: Recipe = {
    title: '',
    description: '',
    ingredients: '',
    steps: '',
    calories: 0,
    prep_time: 0,
    cook_time: 0,
    total_time: 0,
    servings: 1,
    difficulty: 'Medium',
    category: '',
    cuisine: '',
    afficher: true
  };

  private apiUrl = 'http://localhost:3000/api/recipes';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.http.get<Recipe[]>(`${this.apiUrl}/`, { headers: this.getAuthHeaders() }).subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.filteredRecipes = recipes;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des recettes:', error);
        if (error.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          this.authService.logout();
        }
      }
    });
  }

  filterRecipes(): void {
    let filtered = this.recipes;

    // Filtre par terme de recherche
    if (this.searchTerm) {
      filtered = filtered.filter(recipe => 
        recipe.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtre par calories max
    if (this.maxCaloriesFilter) {
      filtered = filtered.filter(recipe => 
        recipe.calories <= parseInt(this.maxCaloriesFilter)
      );
    }

    // Filtre par ingrédient
    if (this.ingredientFilter) {
      filtered = filtered.filter(recipe => 
        recipe.ingredients.toLowerCase().includes(this.ingredientFilter.toLowerCase())
      );
    }

    this.filteredRecipes = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.maxCaloriesFilter = '';
    this.ingredientFilter = '';
    this.filteredRecipes = this.recipes;
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipe = { ...recipe };
    this.isEditing = false;
    this.isCreating = false;
    this.currentImageIndex = 0;
    if (recipe.id) {
      this.loadRecipeImages(recipe.id);
    }
  }

  startEdit(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.selectedRecipe && this.selectedRecipe.id) {
      // Recharger les données originales
      const original = this.recipes.find(r => r.id === this.selectedRecipe!.id);
      if (original) {
        this.selectedRecipe = { ...original };
      }
    }
  }

  saveRecipe(): void {
    if (!this.selectedRecipe) return;

    // Vérifier si l'utilisateur est connecté
    const token = this.authService.getToken();
    if (!token) {
      alert('Vous devez être connecté pour modifier une recette.');
      return;
    }

    this.http.put(`${this.apiUrl}/${this.selectedRecipe.id}`, this.selectedRecipe, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.loadRecipes();
        this.isEditing = false;
        alert('Recette mise à jour avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        if (error.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          this.authService.logout();
        } else {
          alert('Erreur lors de la mise à jour de la recette.');
        }
      }
    });
  }

  startCreate(): void {
    this.isCreating = true;
    this.selectedRecipe = null;
    this.newRecipe = {
      title: '',
      description: '',
      ingredients: '',
      steps: '',
      calories: 0,
      prep_time: 0,
      cook_time: 0,
      total_time: 0,
      servings: 1,
      difficulty: 'Medium',
      category: '',
      cuisine: '',
      afficher: true
    };
  }

  cancelCreate(): void {
    this.isCreating = false;
    this.selectedRecipe = null;
    this.resetNewRecipe();
  }

  createRecipe(): void {
    // Vérifier si l'utilisateur est connecté
    const token = this.authService.getToken();
    if (!token) {
      alert('Vous devez être connecté pour créer une recette.');
      return;
    }

    this.http.post<{id: number, message: string}>(`${this.apiUrl}/`, this.newRecipe, { headers: this.getAuthHeaders() }).subscribe({
      next: (response) => {
        const newRecipeId = response.id;
        
        // Upload des images si elles sont sélectionnées
        if (this.selectedFile || (this.selectedFiles && this.selectedFiles.length > 0)) {
          this.uploadImagesForNewRecipe(newRecipeId);
        }
        
        this.loadRecipes();
        this.isCreating = false;
        this.resetNewRecipe();
        alert('Recette créée avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors de la création:', error);
        if (error.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          this.authService.logout();
        } else {
          alert('Erreur lors de la création de la recette.');
        }
      }
    });
  }

  private uploadImagesForNewRecipe(recipeId: number): void {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const uploadPromises: Promise<any>[] = [];

    // Upload image unique si sélectionnée
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      uploadPromises.push(this.http.post(`${this.apiUrl}/${recipeId}/images`, formData, { headers }).toPromise());
    }

    // Upload images multiples si sélectionnées
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];
        const formData = new FormData();
        formData.append('image', file);
        uploadPromises.push(this.http.post(`${this.apiUrl}/${recipeId}/images`, formData, { headers }).toPromise());
      }
    }

    if (uploadPromises.length > 0) {
      Promise.all(uploadPromises).then(
        (responses) => {
          console.log('Images uploadées pour la nouvelle recette:', responses);
          this.loadRecipes(); // Recharger pour voir les images
        },
        (error) => {
          console.error('Erreur lors de l\'upload des images:', error);
          if (error.status === 401) {
            alert('Session expirée. Veuillez vous reconnecter.');
            this.authService.logout();
          } else if (error.status === 404) {
            alert('Recette créée mais endpoint d\'upload d\'images non trouvé. Vérifiez que le serveur backend est démarré.');
          } else {
            alert(`Recette créée mais erreur lors de l'upload des images: ${error.status} - ${error.statusText}`);
          }
        }
      );
    }
  }

  private resetNewRecipe(): void {
    this.newRecipe = {
      title: '',
      description: '',
      ingredients: '',
      steps: '',
      calories: 0,
      prep_time: 0,
      cook_time: 0,
      total_time: 0,
      servings: 1,
      difficulty: 'Medium',
      category: '',
      cuisine: '',
      afficher: true
    };
    this.selectedFile = null;
    this.selectedFiles = null;
  }

  deleteRecipe(recipe: Recipe): void {
    if (!recipe.id) return;
    
    // Vérifier si l'utilisateur est connecté
    const token = this.authService.getToken();
    if (!token) {
      alert('Vous devez être connecté pour supprimer une recette.');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer la recette "${recipe.title}" ?`)) {
      this.http.delete(`${this.apiUrl}/${recipe.id}`, { headers: this.getAuthHeaders() }).subscribe({
        next: () => {
          this.loadRecipes();
          if (this.selectedRecipe && this.selectedRecipe.id === recipe.id) {
            this.selectedRecipe = null;
          }
          alert('Recette supprimée avec succès!');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          if (error.status === 401) {
            alert('Session expirée. Veuillez vous reconnecter.');
            this.authService.logout();
          } else {
            alert('Erreur lors de la suppression de la recette.');
          }
        }
      });
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onMultipleFilesSelected(event: any): void {
    this.selectedFiles = event.target.files;
  }

  uploadImage(recipeId: number): void {
    if (!this.selectedFile) {
      alert('Veuillez sélectionner une image');
      return;
    }

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    // Créer des headers sans Content-Type pour FormData
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`${this.apiUrl}/${recipeId}/images`, formData, { headers }).subscribe({
      next: (response) => {
        console.log('Image uploadée avec succès:', response);
        this.selectedFile = null;
        this.loadRecipes();
        alert('Image uploadée avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors de l\'upload:', error);
        if (error.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          this.authService.logout();
        } else if (error.status === 404) {
          alert('Endpoint d\'upload d\'images non trouvé. Vérifiez que le serveur backend est démarré.');
        } else {
          alert(`Erreur lors de l'upload de l'image: ${error.status} - ${error.statusText}`);
        }
      }
    });
  }

  uploadMultipleImages(recipeId: number): void {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      alert('Veuillez sélectionner au moins une image');
      return;
    }

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Upload chaque image individuellement
    const uploadPromises: Promise<any>[] = [];
    
    for (let i = 0; i < this.selectedFiles.length; i++) {
      const file = this.selectedFiles[i];
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadPromise = this.http.post(`${this.apiUrl}/${recipeId}/images`, formData, { headers }).toPromise();
      uploadPromises.push(uploadPromise);
    }

    Promise.all(uploadPromises).then(
      (responses) => {
        console.log('Toutes les images ont été uploadées:', responses);
        this.selectedFiles = null;
        this.loadRecipes();
        alert(`${uploadPromises.length} image(s) uploadée(s) avec succès!`);
      },
      (error) => {
        console.error('Erreur lors de l\'upload multiple:', error);
        if (error.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          this.authService.logout();
        } else if (error.status === 404) {
          alert('Endpoint d\'upload d\'images non trouvé. Vérifiez que le serveur backend est démarré.');
        } else {
          alert(`Erreur lors de l'upload des images: ${error.status} - ${error.statusText}`);
        }
      }
    );
  }

  // Méthodes pour charger et gérer les images
  loadRecipeImages(recipeId: number): void {
    this.http.get<RecipeImage[]>(`${this.apiUrl}/${recipeId}/images`, { headers: this.getAuthHeaders() }).subscribe({
      next: (images) => {
        this.selectedRecipeImages = images;
      },
      error: (error) => {
        console.error('Error loading recipe images:', error);
        if (error.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          this.authService.logout();
        }
        this.selectedRecipeImages = [];
      }
    });
  }

  // Méthodes pour le carrousel d'images
  nextImage(): void {
    if (this.selectedRecipeImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.selectedRecipeImages.length;
    }
  }

  previousImage(): void {
    if (this.selectedRecipeImages.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.selectedRecipeImages.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  goToImage(index: number): void {
    if (index >= 0 && index < this.selectedRecipeImages.length) {
      this.currentImageIndex = index;
    }
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `http://localhost:3000/uploads/recips/${imageUrl}`;
  }

  getMainImageUrl(recipe: Recipe): string {
    // Si la recette a des images multiples, utiliser la première
    if (recipe.images && recipe.images.length > 0) {
      return this.getImageUrl(recipe.images[0].image_url);
    }
    // Sinon retourner une image par défaut
    return '/assets/images/recipe-placeholder.jpg';
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  // Méthode pour calculer automatiquement le temps total
  calculateTotalTime(recipe: Recipe): void {
    const prepTime = recipe.prep_time || 0;
    const cookTime = recipe.cook_time || 0;
    recipe.total_time = prepTime + cookTime;
  }

  // Méthodes appelées lors des changements de temps
  onPrepTimeChange(recipe: Recipe): void {
    this.calculateTotalTime(recipe);
  }

  onCookTimeChange(recipe: Recipe): void {
    this.calculateTotalTime(recipe);
  }

  // Méthode pour obtenir le libellé de difficulté en français
  getDifficultyLabel(difficulty?: string): string {
    switch (difficulty) {
      case 'Easy': return 'Facile';
      case 'Medium': return 'Moyen';
      case 'Hard': return 'Difficile';
      default: return 'Non défini';
    }
  }
}