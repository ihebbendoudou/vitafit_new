import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Produit } from './product.service';

export interface CartItem {
  produit: Produit;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCartFromCookies();
  }

  // Charger le panier depuis les cookies
  private loadCartFromCookies(): void {
    try {
      const cartData = this.getCookie('vitafit_cart');
      if (cartData) {
        this.cartItems = JSON.parse(cartData);
        this.cartSubject.next(this.cartItems);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      this.cartItems = [];
    }
  }

  // Sauvegarder le panier dans les cookies
  private saveCartToCookies(): void {
    try {
      const cartData = JSON.stringify(this.cartItems);
      this.setCookie('vitafit_cart', cartData, 30); // 30 jours
      this.cartSubject.next(this.cartItems);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  }

  // Ajouter un produit au panier
  addToCart(produit: Produit, quantity: number = 1): void {
    const existingItem = this.cartItems.find(item => item.produit.id === produit.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cartItems.push({ produit, quantity });
    }
    
    this.saveCartToCookies();
  }

  // Supprimer un produit du panier
  removeFromCart(produitId: number): void {
    this.cartItems = this.cartItems.filter(item => item.produit.id !== produitId);
    this.saveCartToCookies();
  }

  // Mettre à jour la quantité d'un produit
  updateQuantity(produitId: number, quantity: number): void {
    const item = this.cartItems.find(item => item.produit.id === produitId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(produitId);
      } else {
        item.quantity = quantity;
        this.saveCartToCookies();
      }
    }
  }

  // Vider le panier
  clearCart(): void {
    this.cartItems = [];
    this.saveCartToCookies();
  }

  // Obtenir les articles du panier
  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  // Obtenir le nombre total d'articles
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  // Obtenir le prix total
  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => total + (item.produit.prix * item.quantity), 0);
  }

  // Obtenir le total du panier (alias pour getTotalPrice)
  getCartTotal(): number {
    return this.getTotalPrice();
  }

  // Vérifier si un produit est dans le panier
  isInCart(produitId: number): boolean {
    return this.cartItems.some(item => item.produit.id === produitId);
  }

  // Obtenir la quantité d'un produit dans le panier
  getQuantityInCart(produitId: number): number {
    const item = this.cartItems.find(item => item.produit.id === produitId);
    return item ? item.quantity : 0;
  }

  // Méthodes utilitaires pour les cookies
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
}