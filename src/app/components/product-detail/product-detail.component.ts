import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { ProductService, Produit } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, NavbarComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Produit | null = null;
  productImages: string[] = [];
  currentImageIndex = 0;
  isLoading = true;
  error = '';
  isMenuOpen = false;
  quantity = 1;
  selectedColor = '';
  availableColors = ['green', 'gray', 'pink'];
  cartItemCount = 0;
  showCartModal = false;
  cartItems: any[] = [];
  relatedProducts: Produit[] = [];
  isLoadingRelated = false;
  
  // Order properties
  showCheckoutModal: boolean = false;
  showConfirmationModal: boolean = false;
  isSubmittingOrder: boolean = false;
  orderReference: string = '';
  orderData = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    gouvernorat: '',
    ville: '',
    adresse_livraison: '',
    mode_paiement: 'carte_bancaire',
    notes: ''
  };

  // Données des villes par gouvernorat
  villesData: { [key: string]: { value: string, label: string }[] } = {
    tunis: [
      { value: 'tunis_centre', label: 'Tunis Centre' },
      { value: 'bab_bhar', label: 'Bab Bhar' },
      { value: 'bab_souika', label: 'Bab Souika' },
      { value: 'carthage', label: 'Carthage' },
      { value: 'cite_el_khadra', label: 'Cité El Khadra' },
      { value: 'ezzouhour', label: 'Ezzouhour' },
      { value: 'hraira', label: 'Hraïra' },
      { value: 'jebel_jelloud', label: 'Jebel Jelloud' },
      { value: 'la_goulette', label: 'La Goulette' },
      { value: 'la_marsa', label: 'La Marsa' },
      { value: 'le_bardo', label: 'Le Bardo' },
      { value: 'medina', label: 'Médina' },
      { value: 'sidi_bou_said', label: 'Sidi Bou Saïd' },
      { value: 'sidi_hassine', label: 'Sidi Hassine' }
    ],
    ariana: [
      { value: 'ariana_ville', label: 'Ariana Ville' },
      { value: 'ettadhamen', label: 'Ettadhamen' },
      { value: 'kalaat_el_andalous', label: 'Kalâat el-Andalous' },
      { value: 'la_soukra', label: 'La Soukra' },
      { value: 'mnihla', label: 'Mnihla' },
      { value: 'raoued', label: 'Raoued' },
      { value: 'sidi_thabet', label: 'Sidi Thabet' }
    ],
    ben_arous: [
      { value: 'ben_arous_ville', label: 'Ben Arous Ville' },
      { value: 'bou_mhel_el_bassatine', label: 'Bou Mhel el-Bassatine' },
      { value: 'ezzahra', label: 'Ezzahra' },
      { value: 'fouchana', label: 'Fouchana' },
      { value: 'hammam_chott', label: 'Hammam Chott' },
      { value: 'hammam_lif', label: 'Hammam Lif' },
      { value: 'megrine', label: 'Mégrine' },
      { value: 'mohamedia', label: 'Mohamedia' },
      { value: 'nouvelle_medina', label: 'Nouvelle Médina' },
      { value: 'radès', label: 'Radès' }
    ],
    manouba: [
      { value: 'manouba_ville', label: 'Manouba Ville' },
      { value: 'den_den', label: 'Den Den' },
      { value: 'djedeida', label: 'Djedeida' },
      { value: 'douar_hicher', label: 'Douar Hicher' },
      { value: 'mornaguia', label: 'Mornaguia' },
      { value: 'oued_ellil', label: 'Oued Ellil' },
      { value: 'tebourba', label: 'Tebourba' }
    ],
    nabeul: [
      { value: 'nabeul_ville', label: 'Nabeul Ville' },
      { value: 'beni_khalled', label: 'Beni Khalled' },
      { value: 'bou_argoub', label: 'Bou Argoub' },
      { value: 'dar_chaabane', label: 'Dar Chaâbane' },
      { value: 'grombalia', label: 'Grombalia' },
      { value: 'hammamet', label: 'Hammamet' },
      { value: 'kelibia', label: 'Kélibia' },
      { value: 'korba', label: 'Korba' },
      { value: 'menzel_bouzelfa', label: 'Menzel Bouzelfa' },
      { value: 'menzel_temime', label: 'Menzel Temime' },
      { value: 'soliman', label: 'Soliman' },
      { value: 'takelsa', label: 'Takelsa' }
    ],
    sousse: [
      { value: 'sousse_ville', label: 'Sousse Ville' },
      { value: 'akouda', label: 'Akouda' },
      { value: 'bouficha', label: 'Bouficha' },
      { value: 'enfida', label: 'Enfida' },
      { value: 'hammam_sousse', label: 'Hammam Sousse' },
      { value: 'hergla', label: 'Hergla' },
      { value: 'kalaa_kebira', label: 'Kalâa Kebira' },
      { value: 'kalaa_seghira', label: 'Kalâa Seghira' },
      { value: 'kondar', label: 'Kondar' },
      { value: 'msaken', label: 'M\'saken' },
      { value: 'sidi_bou_ali', label: 'Sidi Bou Ali' },
      { value: 'sidi_el_hani', label: 'Sidi El Hani' }
    ],
    sfax: [
      { value: 'sfax_ville', label: 'Sfax Ville' },
      { value: 'agareb', label: 'Agareb' },
      { value: 'bir_ali_ben_khalifa', label: 'Bir Ali Ben Khalifa' },
      { value: 'el_amra', label: 'El Amra' },
      { value: 'el_hencha', label: 'El Hencha' },
      { value: 'ghraiba', label: 'Ghraïba' },
      { value: 'jebiniana', label: 'Jebiniana' },
      { value: 'kerkennah', label: 'Kerkennah' },
      { value: 'mahares', label: 'Maharès' },
      { value: 'menzel_chaker', label: 'Menzel Chaker' },
      { value: 'sakiet_eddaier', label: 'Sakiet Eddaïer' },
      { value: 'sakiet_ezzit', label: 'Sakiet Ezzit' },
      { value: 'skhira', label: 'Skhira' },
      { value: 'thyna', label: 'Thyna' }
    ]
    // Ajoutez d'autres gouvernorats selon vos besoins
  };
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private location: Location,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
    
    // Initialize cart items
    this.loadCartItems();
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.error = '';
    
    this.productService.getProduitById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.productImages = product.images || [];
        this.selectedColor = this.availableColors[0];
        this.isLoading = false;
        // Charger les produits de même catégorie
        this.loadRelatedProducts(product.categorie_id, product.id);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du produit:', error);
        this.error = 'Produit non trouvé';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  previousImage(): void {
    if (this.productImages.length > 1) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.productImages.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  nextImage(): void {
    if (this.productImages.length > 1) {
      this.currentImageIndex = this.currentImageIndex === this.productImages.length - 1 
        ? 0 
        : this.currentImageIndex + 1;
    }
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.quantite) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      for (let i = 0; i < this.quantity; i++) {
        this.cartService.addToCart(this.product);
      }
      alert(`${this.quantity} ${this.product.nom} ajouté(s) au panier!`);
    }
  }

  buyNow(): void {
    if (this.product) {
      this.addToCart();
      // Rediriger vers la page de checkout ou panier
      this.router.navigate(['/cart']);
    }
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/no-image.png';
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/no-image.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000/uploads/produits/${imagePath}`;
  }

  addToWishlist(): void {
    // Fonctionnalité à implémenter
    alert('Ajouté à la liste de souhaits!');
  }

  toggleCartModal(): void {
    console.log('toggleCartModal called, current state:', this.showCartModal);
    this.showCartModal = !this.showCartModal;
    console.log('toggleCartModal new state:', this.showCartModal);
    if (this.showCartModal) {
      this.loadCartItems();
    }
  }

  loadCartItems(): void {
    // Get current cart items directly
    this.cartItems = this.cartService.getCartItems();
    this.cartItemCount = this.cartService.getTotalItems();
    console.log('Cart items loaded:', this.cartItems);
    console.log('Cart item count:', this.cartItemCount);
    
    // Also subscribe to future changes
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.cartItemCount = this.cartService.getTotalItems();
    });
  }

  updateCartQuantity(productId: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.cartService.updateQuantity(productId, newQuantity);
    }
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  getCartTotal(): number {
    return this.cartService.getCartTotal()+8;
  }

  getProductImageUrl(product: any): string {
    if (product.images && product.images.length > 0) {
      return this.getImageUrl(product.images[0]);
    }
    return '/assets/images/default-product.jpg';
  }

  getCategoryName(categoryId: number): string {
    // Vous pouvez implémenter une logique pour récupérer le nom de la catégorie
    return 'Catégorie';
  }

  // Méthodes pour la gestion des gouvernorats et villes
  onGouvernoratChange(): void {
    // Réinitialiser la ville quand le gouvernorat change
    this.orderData.ville = '';
  }

  getVillesByGouvernorat(): { value: string, label: string }[] {
    if (!this.orderData.gouvernorat) {
      return [];
    }
    return this.villesData[this.orderData.gouvernorat] || [];
  }

  loadRelatedProducts(categorieId: number, currentProductId: number): void {
    this.isLoadingRelated = true;
    this.productService.getProduitsByCategorie(categorieId).subscribe({
      next: (products) => {
        // Filtrer le produit actuel et limiter à 10 produits
        this.relatedProducts = products
          .filter(product => product.id !== currentProductId)
          .slice(0, 10);
        this.isLoadingRelated = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits similaires:', error);
        this.relatedProducts = [];
        this.isLoadingRelated = false;
      }
    });
  }

  navigateToProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  onMenuToggle(): void {
    // Logique pour le toggle du menu mobile si nécessaire
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Order methods
  openCheckoutModal() {
    this.showCheckoutModal = true;
    this.showCartModal = false;
  }

  closeCheckoutModal() {
    this.showCheckoutModal = false;
  }

  closeConfirmationModal() {
    this.showConfirmationModal = false;
  }

  submitOrder() {
    if (!this.orderData.nom || !this.orderData.prenom || !this.orderData.email || !this.orderData.adresse_livraison) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.isSubmittingOrder = true;

    // Préparer les données de la commande
    const orderPayload = {
      nom: this.orderData.nom,
      prenom: this.orderData.prenom,
      email: this.orderData.email,
      telephone: this.orderData.telephone,
      gouvernorat: this.orderData.gouvernorat,
      ville: this.orderData.ville,
      adresse_livraison: `${this.orderData.gouvernorat}, ${this.orderData.ville} - ${this.orderData.adresse_livraison}`,
      mode_paiement: this.orderData.mode_paiement,
      notes: this.orderData.notes,
      total: this.getCartTotal()-8,
      produits: this.cartItems.map(item => ({
        produit_id: item.produit.id,
        quantite: item.quantity,
        prix_unitaire: item.produit.prix
      }))
    };

    // Afficher le JSON dans la console pour vérification
    console.log('🚀 JSON envoyé au backend:', JSON.stringify(orderPayload, null, 2));
    console.log('📊 Détails de la commande:', {
      'Nombre d\'articles': this.cartItems.length,
      'Total': this.getCartTotal(),
      'Client': `${this.orderData.prenom} ${this.orderData.nom}`,
      'Adresse complète': orderPayload.adresse_livraison
    });

    // Appel à l'API backend
    this.http.post('http://localhost:3000/api/commande', orderPayload)
      .subscribe({
        next: (response: any) => {
          this.isSubmittingOrder = false;
          this.orderReference = response.reference;
          this.showCheckoutModal = false;
          this.showConfirmationModal = true;
          
          // Vider le panier après commande réussie
          this.clearCart();
        },
        error: (error) => {
          this.isSubmittingOrder = false;
          console.error('Erreur lors de la création de la commande:', error);
          alert('Une erreur est survenue lors de la création de votre commande. Veuillez réessayer.');
        }
      });
  }

  continueShopping() {
    this.showConfirmationModal = false;
    this.router.navigate(['/']);
  }
}