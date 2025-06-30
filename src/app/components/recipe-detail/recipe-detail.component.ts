import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Location } from '@angular/common';

interface Recipe {
  id?: number;
  title: string;
  description: string;
  ingredients: string;
  steps: string;
  calories: number;
  image_url?: string;
  created_at?: string;
  main_image?: string;
  images?: RecipeImage[];
}

interface RecipeImage {
  id: number;
  recipe_id: number;
  image_url: string;
}

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.css'
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  recipeImages: RecipeImage[] = [];
  currentImageIndex = 0;
  isLoading = true;
  error = '';
  isMenuOpen = false;
  private apiUrl = 'http://localhost:3000/api/recipes';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private location: Location
  ) {}

  ngOnInit(): void {
    const recipeId = this.route.snapshot.paramMap.get('id');
    if (recipeId) {
      this.loadRecipe(parseInt(recipeId));
    } else {
      this.error = 'ID de recette invalide';
      this.isLoading = false;
    }
  }

  loadRecipe(id: number): void {
    this.isLoading = true;
    this.http.get<Recipe>(`${this.apiUrl}/${id}`).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        this.loadRecipeImages(id);
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la recette:', error);
        this.error = 'Recette non trouvée';
        this.isLoading = false;
      }
    });
  }

  loadRecipeImages(recipeId: number): void {
    this.http.get<RecipeImage[]>(`${this.apiUrl}/${recipeId}/images`).subscribe({
      next: (images) => {
        this.recipeImages = images;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des images:', error);
        this.recipeImages = [];
        this.isLoading = false;
      }
    });
  }

  getImageUrl(imageName: string): string {
    if (!imageName) return 'assets/default-recipe.jpg';
    return `http://localhost:3000/uploads/recips/${imageName}`;
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
    const placeholder = event.target.parentElement.querySelector('.recipe-placeholder, .modal-recipe-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  // Navigation du carrousel d'images
  previousImage(): void {
    if (this.recipeImages.length > 1) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.recipeImages.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  nextImage(): void {
    if (this.recipeImages.length > 1) {
      this.currentImageIndex = this.currentImageIndex === this.recipeImages.length - 1 
        ? 0 
        : this.currentImageIndex + 1;
    }
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  // Navigation
  goBack(): void {
    this.location.back();
  }

  goToRecipes(): void {
    this.router.navigate(['/recipes']);
  }

  // Utilitaires pour le formatage
  getIngredientsList(): string[] {
    if (!this.recipe?.ingredients) return [];
    return this.recipe.ingredients
      .split('\n')
      .map(ingredient => ingredient.replace('//', '').trim())
      .filter(ingredient => ingredient.length > 0);
  }

  getStepsList(): string[] {
    if (!this.recipe?.steps) return [];
    return this.recipe.steps
      .split('\n')
      .map(step => step.replace('//', '').trim())
      .filter(step => step.length > 0);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToRecipes(): void {
    this.router.navigate(['/recipes']);
  }
}