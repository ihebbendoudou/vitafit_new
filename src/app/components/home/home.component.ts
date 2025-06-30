import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService, Produit, Categorie } from '../../services/product.service';
import { CartService, CartItem } from '../../services/cart.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../shared/navbar/navbar.component';

interface Recipe {
  id?: number;
  title: string;
  description: string;
  ingredients: string;
  steps: string;
  calories: number;
  image_url?: string;
  created_at?: string;
  main_image?: string; // <- Ajouté ici
  images?: RecipeImage[];
}

interface RecipeImage {
  id: number;
  recipe_id: number;
  image_url: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  isMenuOpen = false;
  
  // Propriétés pour les recettes
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  selectedRecipe: Recipe | null = null;
  searchTerm = '';
  showRecipeModal = false;
  private apiUrl = 'http://localhost:3000/api/recipes';
  
  // Propriétés pour le carrousel d'images
  currentImageIndex = 0;
  selectedRecipeImages: RecipeImage[] = [];
  
  // Propriétés pour les produits
  produits: Produit[] = [];
  featuredProduits: Produit[] = [];
  allProduits: Produit[] = [];
  categories: Categorie[] = [];
  showAllProducts = false;
  selectedCategory: number | null = null;
  filteredProduits: Produit[] = [];
  productSearchTerm = '';
  
  // Propriétés pour le panier
  cartItems: CartItem[] = [];
  showCartModal = false;
  cartItemCount = 0;
  cartTotal = 0;
  
  // Propriétés pour les modaux de commande
  showCheckoutModal = false;
  showConfirmationModal = false;
  isSubmittingOrder = false;
  orderReference = '';
  
  // Données de commande
  orderData = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    gouvernorat: '',
    ville: '',
    adresse: '',
    codePostal: '',
    notes: '',
    modePaiement: 'carte'
  };
  
  // Données des villes par gouvernorat
  villesData: { [key: string]: string[] } = {
    'Tunis': ['Tunis', 'La Marsa', 'Sidi Bou Said', 'Carthage', 'Le Bardo'],
    'Ariana': ['Ariana', 'Ettadhamen', 'Kalâat el-Andalous', 'Raoued', 'Soukra'],
    'Ben Arous': ['Ben Arous', 'Radès', 'Fouchana', 'Mohamedia', 'Ezzahra'],
    'Manouba': ['Manouba', 'Douar Hicher', 'Tebourba', 'Jedaida', 'Mornaguia'],
    'Nabeul': ['Nabeul', 'Hammamet', 'Kelibia', 'Korba', 'Menzel Temime'],
    'Zaghouan': ['Zaghouan', 'Zriba', 'Bir Mcherga', 'Fahs', 'Nadhour'],
    'Bizerte': ['Bizerte', 'Menzel Bourguiba', 'Mateur', 'Sejnane', 'Joumine'],
    'Béja': ['Béja', 'Medjez el-Bab', 'Goubellat', 'Testour', 'Nefza'],
    'Jendouba': ['Jendouba', 'Tabarka', 'Aïn Draham', 'Fernana', 'Bou Salem'],
    'Le Kef': ['Le Kef', 'Dahmani', 'Sers', 'Tajerouine', 'Nebeur'],
    'Siliana': ['Siliana', 'Bou Arada', 'Gaâfour', 'El Krib', 'Maktar'],
    'Kairouan': ['Kairouan', 'Sbikha', 'Oueslatia', 'Haffouz', 'Alaa'],
    'Kasserine': ['Kasserine', 'Sbeïtla', 'Thala', 'Feriana', 'Foussana'],
    'Sidi Bouzid': ['Sidi Bouzid', 'Jellaz', 'Cebbala Ouled Asker', 'Bir El Hafey', 'Sidi Ali Ben Aoun'],
    'Sousse': ['Sousse', 'Msaken', 'Kalâa Kebira', 'Kalâa Seghira', 'Akouda'],
    'Monastir': ['Monastir', 'Ksar Hellal', 'Moknine', 'Jemmal', 'Bembla'],
    'Mahdia': ['Mahdia', 'Chebba', 'Melloulèche', 'Ouled Chamekh', 'Sidi Alouane'],
    'Sfax': ['Sfax', 'Sakiet Ezzit', 'Sakiet Eddaïer', 'Chihia', 'Jebiniana'],
    'Gafsa': ['Gafsa', 'Ksar', 'Moularès', 'Redeyef', 'Métlaoui'],
    'Tozeur': ['Tozeur', 'Degache', 'Nefta', 'Tameghza', 'Hazoua'],
    'Kebili': ['Kebili', 'Douz', 'Souk Lahad', 'Faouar', 'Jemna'],
    'Gabès': ['Gabès', 'Mareth', 'Zarat', 'El Hamma', 'Matmata'],
    'Médenine': ['Médenine', 'Ben Gardane', 'Zarzis', 'Djerba Houmt Souk', 'Djerba Midoun'],
    'Tataouine': ['Tataouine', 'Ghomrassen', 'Bir Lahmar', 'Remada', 'Dehiba']
  };
  
  // Propriétés pour le formulaire de consultation
  consultationData = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    objet: '',
    medecin_id: '',
    date_demande: new Date().toISOString().slice(0, 16) // Format YYYY-MM-DDTHH:MM
  };
  
  medecins: any[] = [];
  specialites: string[] = [];
  medecinsFiltres: any[] = [];
  selectedSpecialite: string = '';
  isSubmitting = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';
  
  features = [
    {
      icon: 'fas fa-utensils',
      title: 'Suivi Nutritionnel',
      description: 'Planifiez vos repas, suivez vos calories et macronutriments avec notre système intelligent de nutrition personnalisée.'
    },
    {
      icon: 'fas fa-dumbbell',
      title: 'Programmes d\'Exercices',
      description: 'Accédez à des programmes d\'entraînement personnalisés adaptés à votre niveau et vos objectifs fitness.'
    },
    {
      icon: 'fas fa-users',
      title: 'Communauté Active',
      description: 'Rejoignez une communauté motivante, partagez vos progrès et trouvez l\'inspiration pour atteindre vos objectifs.'
    }
  ];

  dashboards = [
    {
      title: 'Tableau de bord Utilisateur',
      description: 'Interface intuitive pour suivre votre santé, vos programmes et vos progrès au quotidien.',
      features: ['Suivi du poids', 'Programmes personnalisés', 'Dossier médical', 'Rappels'],
      sidebarItems: [1, 2, 3, 4, 5]
    },
    {
      title: 'Tableau de bord Médecin',
      description: 'Outils professionnels pour le suivi de vos patients et la gestion des consultations.',
      features: ['Gestion patients', 'Suivis médicaux', 'Consultations', 'Rapports'],
      sidebarItems: [1, 2, 3, 4]
    },
    {
      title: 'Tableau de bord Coach',
      description: 'Plateforme complète pour créer des programmes et suivre vos clients.',
      features: ['Gestion clients', 'Programmes', 'Séances', 'Statistiques'],
      sidebarItems: [1, 2, 3, 4, 5]
    },
    {
      title: 'Tableau de bord Admin',
      description: 'Interface d\'administration pour gérer la plateforme et les utilisateurs.',
      features: ['Gestion utilisateurs', 'Abonnements', 'Paiements', 'Analytics'],
      sidebarItems: [1, 2, 3, 4, 5, 6]
    }
  ];

  stats = [
    { number: '1000+', label: 'Utilisateurs actifs' },
    { number: '50+', label: 'Professionnels de santé' },
    { number: '500+', label: 'Programmes disponibles' },
    { number: '98%', label: 'Satisfaction client' }
  ];

  steps = [
    {
      title: 'Créez votre compte',
      description: 'Inscrivez-vous en quelques minutes et choisissez votre profil (utilisateur, médecin, coach).',
      icon: 'fas fa-user-plus'
    },
    {
      title: 'Configurez votre profil',
      description: 'Renseignez vos informations de santé et définissez vos objectifs personnels.',
      icon: 'fas fa-cog'
    },
    {
      title: 'Connectez-vous aux professionnels',
      description: 'Trouvez et connectez-vous avec des médecins et coachs adaptés à vos besoins.',
      icon: 'fas fa-handshake'
    },
    {
      title: 'Suivez vos progrès',
      description: 'Utilisez nos outils de suivi pour monitorer votre évolution et atteindre vos objectifs.',
      icon: 'fas fa-trophy'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService,
    private cartService: CartService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Rediriger si l'utilisateur est connecté
    if (this.authService.isLoggedIn()) {
      this.authService.redirectBasedOnRole();
    }

    // Charger les recettes
    this.loadRecipes();
    this.loadProduits();
    this.loadCategories();
    this.initializeCart();
    this.loadMedecins();

    // Initialiser les animations seulement côté navigateur
    if (isPlatformBrowser(this.platformId)) {
      this.initScrollAnimations();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }

    this.isMenuOpen = false;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToAllRecipes(): void {
    this.router.navigate(['/recipes']);
  }

  onMenuToggle(): void {
    // Méthode appelée quand le menu est basculé depuis la navbar
    console.log('Menu toggled from navbar');
  }

  // Méthodes pour les recettes
  loadRecipes(): void {
    this.http.get<Recipe[]>(`${this.apiUrl}/`).subscribe({
      next: (data) => {
        // Trier par date de création (plus récent en premier) et prendre les 4 dernières
        const sortedRecipes = data.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Tri décroissant (plus récent en premier)
        }).slice(0, 6); // Prendre seulement les 4 premières
        
        this.recipes = sortedRecipes;
        this.filteredRecipes = sortedRecipes;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des recettes:', error);
      }
    });
  }

  loadMedecins(): void {
    this.http.get<any[]>('http://localhost:3000/api/medecin/').subscribe({
      next: (data) => {
        this.medecins = data;
        // Extraire les spécialités uniques
        this.specialites = [...new Set(data.map(medecin => medecin.specialite))].sort();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des médecins:', error);
      }
    });
  }

  onSpecialiteChange(): void {
    if (this.selectedSpecialite) {
      this.medecinsFiltres = this.medecins.filter(medecin => medecin.specialite === this.selectedSpecialite);
    } else {
      this.medecinsFiltres = [];
    }
    // Réinitialiser la sélection du médecin
    this.consultationData.medecin_id = '';
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
    this.selectedRecipe = recipe;
    this.currentImageIndex = 0;
    this.loadRecipeImages(recipe.id!);
    this.showRecipeModal = true;
  }

  closeRecipeModal(): void {
    this.showRecipeModal = false;
    this.selectedRecipe = null;
    this.selectedRecipeImages = [];
    this.currentImageIndex = 0;
  }

  loadRecipeImages(recipeId: number): void {
    this.http.get<RecipeImage[]>(`${this.apiUrl}/${recipeId}/images`).subscribe({
      next: (images) => {
        this.selectedRecipeImages = images;
      },
      error: (error) => {
        console.error('Error loading recipe images:', error);
        this.selectedRecipeImages = [];
      }
    });
  }

  getImageUrl(imageName: string): string {
    if (!imageName) return 'assets/default-image.jpg'; // ou un placeholder
    return `http://localhost:3000/uploads/recips/${imageName}`;
  }
  
  onImageError(event: any): void {
    // Masquer l'image en cas d'erreur de chargement
    event.target.style.display = 'none';
    // Optionnel: afficher un placeholder à la place
    const placeholder = event.target.parentElement.querySelector('.recipe-placeholder, .modal-recipe-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
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

  getMainImageUrl(recipe: Recipe): string {
    // Si la recette a des images multiples, utiliser la première
    if (recipe.images && recipe.images.length > 0) {
      return this.getImageUrl(recipe.images[0].image_url);
    }
    // Sinon utiliser l'image_url de la recette
    return this.getImageUrl(recipe.image_url || '');
  }

  private initScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    setTimeout(() => {
      const elementsToAnimate = document.querySelectorAll(
        '.feature-card, .dashboard-card, .step, .stat-item, .recipe-card'
      );
      elementsToAnimate.forEach(el => observer.observe(el));
    }, 100);
  }

  // Méthodes pour le formulaire de consultation
  submitConsultationRequest(): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
    
    const consultationUrl = 'http://localhost:3000/api/consultations/guest/request';
    
    const requestData = {
      nom: this.consultationData.nom,
      prenom: this.consultationData.prenom,
      email: this.consultationData.email,
      telephone: this.consultationData.telephone,
      objet: this.consultationData.objet,
      medecin_id: this.consultationData.medecin_id,
      date_demande: this.consultationData.date_demande
    };
    
    this.http.post(consultationUrl, requestData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.showSuccessMessage = true;
        this.resetFormData();
        
        // Faire défiler vers le message de succès
        setTimeout(() => {
          const successElement = document.querySelector('.success-message');
          if (successElement) {
            successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.showErrorMessage = true;
        
        if (error.error && error.error.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.';
        }
        
        console.error('Erreur lors de l\'envoi de la consultation:', error);
      }
    });
  }
  
  resetForm(): void {
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
    this.resetFormData();
  }
  
  private resetFormData(): void {
    this.consultationData = {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      objet: '',
      medecin_id: '',
      date_demande: ''
    };
  }

  // Méthodes pour les produits
  loadProduits() {
    this.productService.getAllProduits().subscribe({
      next: (produits) => {
        this.allProduits = produits;
        this.produits = produits;
        this.featuredProduits = produits.slice(0, 8); // Prendre les 8 premiers pour la grille
        this.filteredProduits = produits;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);
      }
    });
  }

  loadCategories() {
    this.productService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    });
  }

  toggleProductsView() {
    this.showAllProducts = !this.showAllProducts;
    if (this.showAllProducts) {
      this.scrollToSection('all-products');
    }
  }

  filterProductsByCategory(categoryId: number | null) {
    this.selectedCategory = categoryId;
    if (categoryId === null) {
      this.filteredProduits = this.allProduits;
    } else {
      this.filteredProduits = this.allProduits.filter(p => p.categorie_id === categoryId);
    }
  }

  searchProducts() {
    if (!this.productSearchTerm.trim()) {
      this.filteredProduits = this.allProduits;
    } else {
      const term = this.productSearchTerm.toLowerCase();
      this.filteredProduits = this.allProduits.filter(p => 
        p.nom.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
    }
  }

  getProductImageUrl(produit: Produit): string {
    if (produit.images && produit.images.length > 0) {
      return this.productService.getImageUrl(produit.images[0]);
    }
    return 'assets/images/no-image.png';
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.nom : 'Non catégorisé';
  }

  // Méthodes pour le panier
  initializeCart() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.cartItemCount = this.cartService.getTotalItems();
      this.cartTotal = this.cartService.getTotalPrice();
    });
  }

  addToCart(produit: Produit, quantity: number = 1) {
    this.cartService.addToCart(produit, quantity);
    // Optionnel: afficher une notification
    this.showNotification(`${produit.nom} ajouté au panier`);
  }

  removeFromCart(produitId: number) {
    this.cartService.removeFromCart(produitId);
  }

  updateCartQuantity(produitId: number, quantity: number) {
    this.cartService.updateQuantity(produitId, quantity);
  }

  toggleCartModal() {
    this.showCartModal = !this.showCartModal;
  }

  clearCart() {
    this.cartService.clearCart();
  }

  isInCart(produitId: number): boolean {
    return this.cartService.isInCart(produitId);
  }

  getQuantityInCart(produitId: number): number {
    return this.cartService.getQuantityInCart(produitId);
  }

  /**
   * Affiche une notification
   */
  showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    // Implémentation de la notification (peut utiliser un service de notification)
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  /**
   * Procède au paiement
   */
  proceedToPayment(): void {
    if (this.cartItems.length === 0) {
      this.showNotification('Votre panier est vide', 'error');
      return;
    }

    // Fermer le modal du panier
    this.showCartModal = false;
    
    // Rediriger vers la page de paiement
    this.router.navigate(['/paiements'], {
      queryParams: {
        total: this.cartTotal.toFixed(2),
        items: JSON.stringify(this.cartItems.map(item => ({
          id: item.produit.id,
          nom: item.produit.nom,
          prix: item.produit.prix,
          quantity: item.quantity,
          total: (item.produit.prix * item.quantity).toFixed(2)
        })))
      }
    });
  }

  // Méthodes pour les modaux de commande
  openCheckoutModal(): void {
    if (this.cartItems.length === 0) {
      this.showNotification('Votre panier est vide', 'error');
      return;
    }
    this.showCartModal = false;
    this.showCheckoutModal = true;
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
  }

  onGouvernoratChange(): void {
    this.orderData.ville = '';
  }

  getVillesByGouvernorat(): string[] {
    return this.villesData[this.orderData.gouvernorat] || [];
  }

  getCartTotal(): number {
    return this.cartService.getTotalPrice()+8;
  }

  submitOrder(): void {
    // Validation des champs obligatoires
    if (!this.orderData.nom || !this.orderData.prenom || !this.orderData.email || 
        !this.orderData.telephone || !this.orderData.gouvernorat || !this.orderData.ville || 
        !this.orderData.adresse) {
      this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    this.isSubmittingOrder = true;

    // Préparer les données de la commande selon le format attendu par le backend
    const orderPayload = {
      produits: this.cartItems.map(item => ({
        produit_id: item.produit.id,
        quantite: item.quantity,
        prix_unitaire: item.produit.prix
      })),
      total: this.getCartTotal()-8,
      nom: this.orderData.nom,
      prenom: this.orderData.prenom,
      email: this.orderData.email,
      telephone: this.orderData.telephone,
      adresse_livraison: `${this.orderData.adresse}, ${this.orderData.ville}, ${this.orderData.gouvernorat}${this.orderData.codePostal ? ', ' + this.orderData.codePostal : ''}`,
      mode_paiement: this.orderData.modePaiement,
      notes: this.orderData.notes
    };

    console.log('Données de la commande:', orderPayload);

    // Appel API pour créer la commande
    this.http.post('http://localhost:3000/api/commande', orderPayload).subscribe({
      next: (response: any) => {
        this.isSubmittingOrder = false;
        this.orderReference = response.reference || 'CMD' + Date.now();
        this.showCheckoutModal = false;
        this.showConfirmationModal = true;
        this.clearCart();
        this.resetOrderData();
      },
      error: (error) => {
        this.isSubmittingOrder = false;
        console.error('Erreur lors de la soumission de la commande:', error);
        this.showNotification('Erreur lors de la soumission de la commande', 'error');
      }
    });
  }

  continueShopping(): void {
    this.showConfirmationModal = false;
    // Optionnel: faire défiler vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private resetOrderData(): void {
    this.orderData = {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      gouvernorat: '',
      ville: '',
      adresse: '',
      codePostal: '',
      notes: '',
      modePaiement: 'carte'
    };
  }
}
