import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.css'
})
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  searchTerm = '';
  private apiUrl = 'http://localhost:3000/api/recipes';
  isLoading = false;
  isMenuOpen = false;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.isLoading = true;
    this.http.get<Recipe[]>(`${this.apiUrl}/`).subscribe({
      next: (data) => {
        // Trier par date de création (plus récent en premier)
        const sortedRecipes = data.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        
        this.recipes = sortedRecipes;
        this.filteredRecipes = sortedRecipes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des recettes:', error);
        this.isLoading = false;
      }
    });
  }

  searchRecipes(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRecipes = this.recipes;
      return;
    }

    this.filteredRecipes = this.recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      recipe.ingredients.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  viewRecipe(recipe: Recipe): void {
    if (recipe.id) {
      this.router.navigate(['/recipe', recipe.id]);
    }
  }

  getImageUrl(imageName: string): string {
    if (!imageName) return 'assets/default-recipe.jpg';
    return `http://localhost:3000/uploads/recips/${imageName}`;
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
    const placeholder = event.target.parentElement.querySelector('.recipe-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}