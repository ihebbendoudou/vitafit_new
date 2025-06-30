import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Produit, Categorie } from '../../../services/product.service';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  // État de l'interface
  currentView: 'products' | 'categories' = 'products';
  loading = false;
  
  // Données
  produits: Produit[] = [];
  categories: Categorie[] = [];
  filteredProduits: Produit[] = [];
  
  // Filtres et recherche
  searchTerm = '';
  selectedCategoryFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Formulaires
  showProductForm = false;
  showCategoryForm = false;
  editingProduct: Produit | null = null;
  editingCategory: Categorie | null = null;
  
  // Formulaire produit
  productForm = {
    nom: '',
    description: '',
    prix: 0,
    quantite: 0,
    categorie_id: 0
  };
  
  // Formulaire catégorie
  categoryForm = {
    nom: ''
  };
  
  selectedFiles: File[] = [];
  
  // Référence globale pour Math
  Math = Math;
  
  constructor(private productService: ProductService) {}
  
  ngOnInit(): void {
    this.loadCategories();
    this.loadProduits();
  }
  
  // Chargement des données
  loadProduits(): void {
    this.loading = true;
    this.productService.getAllProduits().subscribe({
      next: (data) => {
        this.produits = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);
        this.loading = false;
      }
    });
  }
  
  loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    });
  }
  
  // Filtrage et recherche
  applyFilters(): void {
    let filtered = [...this.produits];
    
    // Recherche par nom
    if (this.searchTerm) {
      filtered = filtered.filter(produit => 
        produit.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        produit.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    // Filtrage par catégorie
    if (this.selectedCategoryFilter) {
      filtered = filtered.filter(produit => 
        produit.categorie_id.toString() === this.selectedCategoryFilter
      );
    }
    
    this.filteredProduits = filtered;
    this.totalPages = Math.ceil(this.filteredProduits.length / this.itemsPerPage);
    this.currentPage = 1;
  }
  
  onSearch(): void {
    this.applyFilters();
  }
  
  onCategoryFilterChange(): void {
    this.applyFilters();
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryFilter = '';
    this.applyFilters();
  }
  
  // Pagination
  get paginatedProduits(): Produit[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProduits.slice(startIndex, endIndex);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // Gestion des vues
  switchView(view: 'products' | 'categories'): void {
    this.currentView = view;
    this.closeAllForms();
  }
  
  // Gestion des formulaires
  openProductForm(product?: Produit): void {
    this.showProductForm = true;
    this.editingProduct = product || null;
    
    if (product) {
      this.productForm = {
        nom: product.nom,
        description: product.description,
        prix: product.prix,
        quantite: product.quantite,
        categorie_id: product.categorie_id
      };
    } else {
      this.resetProductForm();
    }
  }
  
  openCategoryForm(category?: Categorie): void {
    this.showCategoryForm = true;
    this.editingCategory = category || null;
    
    if (category) {
      this.categoryForm = { nom: category.nom };
    } else {
      this.resetCategoryForm();
    }
  }
  
  closeAllForms(): void {
    this.showProductForm = false;
    this.showCategoryForm = false;
    this.editingProduct = null;
    this.editingCategory = null;
    this.selectedFiles = [];
  }
  
  resetProductForm(): void {
    this.productForm = {
      nom: '',
      description: '',
      prix: 0,
      quantite: 0,
      categorie_id: 0
    };
    this.selectedFiles = [];
  }
  
  resetCategoryForm(): void {
    this.categoryForm = { nom: '' };
  }
  
  // Gestion des fichiers
  onFileSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = files;
  }
  
  // CRUD Produits
  saveProduct(): void {
    if (!this.productForm.nom || !this.productForm.description || this.productForm.categorie_id === 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const formData = new FormData();
    formData.append('nom', this.productForm.nom);
    formData.append('description', this.productForm.description);
    formData.append('prix', this.productForm.prix.toString());
    formData.append('quantite', this.productForm.quantite.toString());
    formData.append('categorie_id', this.productForm.categorie_id.toString());
    
    // Ajouter les images
    this.selectedFiles.forEach(file => {
      formData.append('images', file);
    });
    
    if (this.editingProduct) {
      // Mise à jour
      this.productService.updateProduit(this.editingProduct.id, formData).subscribe({
        next: () => {
          this.loadProduits();
          this.closeAllForms();
          alert('Produit mis à jour avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du produit:', error);
          alert('Erreur lors de la mise à jour du produit');
        }
      });
    } else {
      // Création
      this.productService.createProduit(formData).subscribe({
        next: () => {
          this.loadProduits();
          this.closeAllForms();
          alert('Produit créé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la création du produit:', error);
          alert('Erreur lors de la création du produit');
        }
      });
    }
  }
  
  deleteProduct(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.productService.deleteProduit(id).subscribe({
        next: () => {
          this.loadProduits();
          alert('Produit supprimé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du produit:', error);
          alert('Erreur lors de la suppression du produit');
        }
      });
    }
  }
  
  // CRUD Catégories
  saveCategory(): void {
    if (!this.categoryForm.nom) {
      alert('Veuillez saisir un nom pour la catégorie');
      return;
    }
    
    if (this.editingCategory) {
      // Mise à jour
      this.productService.updateCategorie(this.editingCategory.id, this.categoryForm).subscribe({
        next: () => {
          this.loadCategories();
          this.closeAllForms();
          alert('Catégorie mise à jour avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de la catégorie:', error);
          alert('Erreur lors de la mise à jour de la catégorie');
        }
      });
    } else {
      // Création
      this.productService.createCategorie(this.categoryForm).subscribe({
        next: () => {
          this.loadCategories();
          this.closeAllForms();
          alert('Catégorie créée avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la création de la catégorie:', error);
          alert('Erreur lors de la création de la catégorie');
        }
      });
    }
  }
  
  deleteCategory(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      this.productService.deleteCategorie(id).subscribe({
        next: () => {
          this.loadCategories();
          alert('Catégorie supprimée avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la catégorie:', error);
          alert('Erreur lors de la suppression de la catégorie');
        }
      });
    }
  }
  
  // Utilitaires
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.nom : 'Catégorie inconnue';
  }
  
  getImageUrl(imagePath: string): string {
    return this.productService.getImageUrl(imagePath);
  }
}